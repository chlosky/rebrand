package com.paletteplotting.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.util.Size;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LifecycleOwner;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions;
import com.google.mlkit.vision.segmentation.Segmentation;
import com.google.mlkit.vision.segmentation.Segmenter;
import com.google.mlkit.vision.segmentation.SegmentationMask;

import java.nio.ByteBuffer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Native camera + ML Kit selfie segmentation view for Android Mirror Work.
 * Renders the segmented person with a transparent background so the WebView
 * canvas scene shows through underneath.
 */
public class NativeMirrorView extends View {

    private final ExecutorService cameraExecutor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean processing = new AtomicBoolean(false);
    private ProcessCameraProvider cameraProvider;
    private Segmenter segmenter;
    private String currentScene = "none";
    private boolean cameraStarted = false;

    private Bitmap displayBitmap;
    private Bitmap reusableAlphaMask;
    private int reusableAlphaMaskW;
    private int reusableAlphaMaskH;
    private Bitmap reusableOutput;
    private int reusableOutputW;
    private int reusableOutputH;
    private final Matrix mirrorMatrix = new Matrix();
    private final Paint bitmapPaint = new Paint(Paint.FILTER_BITMAP_FLAG);

    private final Paint maskPaint = new Paint();
    private Bitmap maskWorkBitmap;
    private Canvas maskWorkCanvas;

    public NativeMirrorView(Context context) {
        super(context);
        setLayerType(LAYER_TYPE_HARDWARE, null);
        setBackgroundColor(Color.TRANSPARENT);

        SelfieSegmenterOptions options = new SelfieSegmenterOptions.Builder()
                .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
                .enableRawSizeMask()
                .build();
        segmenter = Segmentation.getClient(options);

        maskPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_IN));
    }

    public void setScene(String scene) {
        this.currentScene = scene != null ? scene : "none";
    }

    @SuppressLint("UnsafeOptInUsageError")
    public void startCamera(Activity activity) {
        if (cameraStarted) return;
        cameraStarted = true;

        if (segmenter == null) {
            SelfieSegmenterOptions options = new SelfieSegmenterOptions.Builder()
                    .setDetectorMode(SelfieSegmenterOptions.STREAM_MODE)
                    .enableRawSizeMask()
                    .build();
            segmenter = Segmentation.getClient(options);
        }

        ProcessCameraProvider.getInstance(activity).addListener(() -> {
            try {
                cameraProvider = ProcessCameraProvider.getInstance(activity).get();
                cameraProvider.unbindAll();

                CameraSelector selector = new CameraSelector.Builder()
                        .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                        .build();

                ImageAnalysis analysis = new ImageAnalysis.Builder()
                        .setTargetResolution(new Size(480, 640))
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                        .build();

                analysis.setAnalyzer(cameraExecutor, this::processFrame);

                cameraProvider.bindToLifecycle(
                        (LifecycleOwner) activity, selector, analysis);

            } catch (Exception e) {
                android.util.Log.e("NativeMirror", "Camera start failed", e);
            }
        }, ContextCompat.getMainExecutor(activity));
    }

    public void stopCamera() {
        cameraStarted = false;
        processing.set(false);
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
            cameraProvider = null;
        }
        if (segmenter != null) {
            segmenter.close();
            segmenter = null;
        }
        synchronized (this) {
            if (displayBitmap != null) {
                displayBitmap.recycle();
                displayBitmap = null;
            }
        }
        if (maskWorkBitmap != null) {
            maskWorkBitmap.recycle();
            maskWorkBitmap = null;
            maskWorkCanvas = null;
        }
        if (reusableAlphaMask != null) {
            reusableAlphaMask.recycle();
            reusableAlphaMask = null;
        }
        if (reusableOutput != null) {
            reusableOutput.recycle();
            reusableOutput = null;
        }
    }

    @SuppressLint("UnsafeOptInUsageError")
    private void processFrame(@NonNull ImageProxy imageProxy) {
        if (segmenter == null || !processing.compareAndSet(false, true)) {
            imageProxy.close();
            return;
        }

        int width = imageProxy.getWidth();
        int height = imageProxy.getHeight();
        int rotation = imageProxy.getImageInfo().getRotationDegrees();
        Bitmap rawBitmap = imageToBitmap(imageProxy, width, height);
        imageProxy.close();

        Bitmap cameraBitmap = rotateBitmap(rawBitmap, rotation);
        int rotW = cameraBitmap.getWidth();
        int rotH = cameraBitmap.getHeight();

        InputImage inputImage = InputImage.fromBitmap(cameraBitmap, 0);

        segmenter.process(inputImage)
                .addOnSuccessListener(mask -> {
                    Bitmap result = compositePersonOnly(cameraBitmap, mask, rotW, rotH);
                    synchronized (this) {
                        displayBitmap = result;
                    }
                    if (cameraBitmap != result) cameraBitmap.recycle();
                    postInvalidate();
                    processing.set(false);
                })
                .addOnFailureListener(e -> {
                    cameraBitmap.recycle();
                    processing.set(false);
                });
    }

    private Bitmap rotateBitmap(Bitmap source, int degrees) {
        if (degrees == 0) return source;
        Matrix m = new Matrix();
        m.postRotate(degrees);
        Bitmap rotated = Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), m, true);
        if (rotated != source) source.recycle();
        return rotated;
    }

    private Bitmap imageToBitmap(ImageProxy image, int width, int height) {
        ImageProxy.PlaneProxy plane = image.getPlanes()[0];
        ByteBuffer buffer = plane.getBuffer();
        int pixelStride = plane.getPixelStride();
        int rowStride = plane.getRowStride();
        int rowPadding = rowStride - pixelStride * width;

        Bitmap bmp = Bitmap.createBitmap(
                width + rowPadding / pixelStride, height, Bitmap.Config.ARGB_8888);
        buffer.rewind();
        bmp.copyPixelsFromBuffer(buffer);

        if (rowPadding > 0) {
            Bitmap cropped = Bitmap.createBitmap(bmp, 0, 0, width, height);
            bmp.recycle();
            return cropped;
        }
        return bmp;
    }

    private Bitmap compositePersonOnly(Bitmap camera, SegmentationMask mask, int camW, int camH) {
        int maskW = mask.getWidth();
        int maskH = mask.getHeight();

        ByteBuffer maskBuffer = mask.getBuffer();
        maskBuffer.rewind();

        if (maskWorkBitmap == null || maskWorkBitmap.getWidth() != camW || maskWorkBitmap.getHeight() != camH) {
            if (maskWorkBitmap != null) maskWorkBitmap.recycle();
            maskWorkBitmap = Bitmap.createBitmap(camW, camH, Bitmap.Config.ARGB_8888);
            maskWorkCanvas = new Canvas(maskWorkBitmap);
        }

        maskWorkCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
        maskWorkCanvas.drawBitmap(camera, 0, 0, null);

        if (reusableAlphaMask == null || reusableAlphaMaskW != maskW || reusableAlphaMaskH != maskH) {
            if (reusableAlphaMask != null) reusableAlphaMask.recycle();
            reusableAlphaMask = Bitmap.createBitmap(maskW, maskH, Bitmap.Config.ARGB_8888);
            reusableAlphaMaskW = maskW;
            reusableAlphaMaskH = maskH;
        }
        int[] maskPixels = new int[maskW * maskH];
        for (int i = 0; i < maskW * maskH; i++) {
            float confidence = maskBuffer.getFloat();
            float sharpened = Math.max(0f, Math.min(1f, (confidence - 0.4f) / 0.3f));
            int alpha = (int) (sharpened * 255);
            maskPixels[i] = Color.argb(alpha, 255, 255, 255);
        }
        reusableAlphaMask.setPixels(maskPixels, 0, maskW, 0, 0, maskW, maskH);

        Bitmap scaledMask = (maskW != camW || maskH != camH)
                ? Bitmap.createScaledBitmap(reusableAlphaMask, camW, camH, true)
                : reusableAlphaMask;

        maskWorkCanvas.drawBitmap(scaledMask, 0, 0, maskPaint);

        if (scaledMask != reusableAlphaMask) scaledMask.recycle();

        if (reusableOutput == null || reusableOutputW != camW || reusableOutputH != camH) {
            if (reusableOutput != null) reusableOutput.recycle();
            reusableOutput = Bitmap.createBitmap(camW, camH, Bitmap.Config.ARGB_8888);
            reusableOutputW = camW;
            reusableOutputH = camH;
        } else {
            reusableOutput.eraseColor(Color.TRANSPARENT);
        }
        Canvas outCanvas = new Canvas(reusableOutput);
        outCanvas.drawBitmap(maskWorkBitmap, 0, 0, null);

        return reusableOutput;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        Bitmap bmp;
        synchronized (this) {
            bmp = displayBitmap;
        }
        if (bmp == null || bmp.isRecycled()) return;

        int vw = getWidth();
        int vh = getHeight();
        float bw = bmp.getWidth();
        float bh = bmp.getHeight();

        float scale = Math.max(vw / bw, vh / bh);
        float dx = (vw - bw * scale) / 2f;
        float dy = (vh - bh * scale) / 2f;

        mirrorMatrix.reset();
        mirrorMatrix.postScale(-scale, scale, bw / 2f, bh / 2f);
        mirrorMatrix.postTranslate(dx + (bw * scale - bw) / 2f, dy + (bh * scale - bh) / 2f);

        canvas.drawBitmap(bmp, mirrorMatrix, bitmapPaint);
    }
}

