package com.paletteplotting.app;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeMirror")
public class NativeMirrorPlugin extends Plugin {

    private NativeMirrorView mirrorView;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        ret.put("platform", "android-native");
        call.resolve(ret);
    }

    @PluginMethod
    public void start(PluginCall call) {
        String scene = call.getString("scene", "none");
        double x = call.getDouble("x", 0.0);
        double y = call.getDouble("y", 0.0);
        double width = call.getDouble("width", 0.0);
        double height = call.getDouble("height", 0.0);

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }

        float density = activity.getResources().getDisplayMetrics().density;
        int pxX = (int) (x * density);
        int pxY = (int) (y * density);
        int pxW = (int) (width * density);
        int pxH = (int) (height * density);

        activity.runOnUiThread(() -> {
            try {
                ViewGroup rootView = (ViewGroup) activity.getWindow().getDecorView().findViewById(android.R.id.content);
                if (rootView == null) {
                    call.reject("Root view unavailable");
                    return;
                }

                if (mirrorView == null) {
                    mirrorView = new NativeMirrorView(activity);
                    FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(pxW, pxH);
                    lp.leftMargin = pxX;
                    lp.topMargin = pxY;
                    mirrorView.setLayoutParams(lp);
                    rootView.addView(mirrorView);
                } else {
                    updateViewLayout(pxX, pxY, pxW, pxH);
                    mirrorView.setScene(scene);
                    call.resolve();
                    return;
                }

                mirrorView.setScene(scene);
                mirrorView.startCamera(activity);
                call.resolve();
            } catch (Exception e) {
                call.reject("start failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.resolve();
            return;
        }

        activity.runOnUiThread(() -> {
            if (mirrorView != null) {
                mirrorView.stopCamera();
                ViewGroup parent = (ViewGroup) mirrorView.getParent();
                if (parent != null) parent.removeView(mirrorView);
                mirrorView = null;
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setScene(PluginCall call) {
        String scene = call.getString("scene", "none");
        Activity activity = getActivity();
        if (activity == null || mirrorView == null) {
            call.resolve();
            return;
        }
        activity.runOnUiThread(() -> {
            mirrorView.setScene(scene);
            call.resolve();
        });
    }

    @PluginMethod
    public void updateLayout(PluginCall call) {
        double x = call.getDouble("x", 0.0);
        double y = call.getDouble("y", 0.0);
        double width = call.getDouble("width", 0.0);
        double height = call.getDouble("height", 0.0);

        Activity activity = getActivity();
        if (activity == null || mirrorView == null) {
            call.resolve();
            return;
        }

        float density = activity.getResources().getDisplayMetrics().density;
        int pxX = (int) (x * density);
        int pxY = (int) (y * density);
        int pxW = (int) (width * density);
        int pxH = (int) (height * density);

        activity.runOnUiThread(() -> {
            updateViewLayout(pxX, pxY, pxW, pxH);
            call.resolve();
        });
    }

    private void updateViewLayout(int x, int y, int w, int h) {
        if (mirrorView == null) return;
        FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) mirrorView.getLayoutParams();
        if (lp == null) lp = new FrameLayout.LayoutParams(w, h);
        lp.width = w;
        lp.height = h;
        lp.leftMargin = x;
        lp.topMargin = y;
        mirrorView.setLayoutParams(lp);
    }
}

