import Foundation
import Capacitor
import UIKit
import AVFoundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

@objc(NativeMirrorPlugin)
public class NativeMirrorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeMirrorPlugin"
    public let jsName = "NativeMirror"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setScene", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateLayout", returnType: CAPPluginReturnPromise)
    ]

    private let manager = NativeMirrorManager()

    @objc public func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "platform": "ios-native"
        ])
    }

    @objc public func start(_ call: CAPPluginCall) {
        guard let hostView = bridge?.viewController?.view else {
            call.reject("Bridge view unavailable")
            return
        }

        let scene = call.getString("scene") ?? "none"
        let frame = CGRect(
            x: call.getDouble("x") ?? 0,
            y: call.getDouble("y") ?? 0,
            width: call.getDouble("width") ?? hostView.bounds.width,
            height: call.getDouble("height") ?? hostView.bounds.height
        )

        manager.start(in: hostView, frame: frame, scene: scene) { result in
            switch result {
            case .success:
                call.resolve()
            case .failure(let error):
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc public func stop(_ call: CAPPluginCall) {
        manager.stop()
        call.resolve()
    }

    @objc public func setScene(_ call: CAPPluginCall) {
        manager.setScene(call.getString("scene") ?? "none")
        call.resolve()
    }

    @objc public func updateLayout(_ call: CAPPluginCall) {
        let frame = CGRect(
            x: call.getDouble("x") ?? 0,
            y: call.getDouble("y") ?? 0,
            width: call.getDouble("width") ?? 0,
            height: call.getDouble("height") ?? 0
        )
        manager.updateLayout(frame)
        call.resolve()
    }
}

private final class NativeMirrorManager {
    private var rendererView: NativeMirrorRendererView?

    func start(in host: UIView, frame: CGRect, scene: String, completion: @escaping (Result<Void, Error>) -> Void) {
        DispatchQueue.main.async {
            if self.rendererView == nil {
                let view = NativeMirrorRendererView()
                view.backgroundColor = .clear
                view.frame = frame
                host.addSubview(view)
                self.rendererView = view
            }

            self.rendererView?.frame = frame
            self.rendererView?.setScene(scene)
            self.rendererView?.start { result in
                completion(result)
            }
        }
    }

    func stop() {
        DispatchQueue.main.async {
            self.rendererView?.stop()
            self.rendererView?.removeFromSuperview()
            self.rendererView = nil
        }
    }

    func setScene(_ scene: String) {
        DispatchQueue.main.async {
            self.rendererView?.setScene(scene)
        }
    }

    func updateLayout(_ frame: CGRect) {
        DispatchQueue.main.async {
            self.rendererView?.frame = frame
        }
    }
}

private final class NativeMirrorRendererView: UIView, AVCaptureVideoDataOutputSampleBufferDelegate {
    private let imageView = UIImageView()
    private let captureSession = AVCaptureSession()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let processingQueue = DispatchQueue(label: "native.mirror.processing")
    private let ciContext = CIContext(options: nil)
    private let segmentationRequest = VNGeneratePersonSegmentationRequest()

    private var running = false
    private var currentScene: String = "none"
    private var lastMaskImage: CIImage?
    private var lastSegmentationTs: CFAbsoluteTime = 0
    private var isRequestInFlight = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        isUserInteractionEnabled = false
        clipsToBounds = true
        backgroundColor = .clear
        imageView.frame = bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        imageView.contentMode = .scaleAspectFill
        imageView.backgroundColor = .clear
        imageView.isOpaque = false
        addSubview(imageView)

        segmentationRequest.qualityLevel = .balanced
        segmentationRequest.outputPixelFormat = kCVPixelFormatType_OneComponent8
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        imageView.frame = bounds
        layer.masksToBounds = true
    }

    func start(completion: @escaping (Result<Void, Error>) -> Void) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            guard granted else {
                completion(.failure(NSError(domain: "NativeMirror", code: 1, userInfo: [NSLocalizedDescriptionKey: "Camera permission denied"])))
                return
            }

            self.processingQueue.async {
                do {
                    try self.configureSessionIfNeeded()
                    if !self.captureSession.isRunning {
                        self.captureSession.startRunning()
                    }
                    self.running = true
                    completion(.success(()))
                } catch {
                    completion(.failure(error))
                }
            }
        }
    }

    func stop() {
        processingQueue.async {
            self.running = false
            if self.captureSession.isRunning {
                self.captureSession.stopRunning()
            }
            self.lastMaskImage = nil
            self.lastSegmentationTs = 0
            self.isRequestInFlight = false
            DispatchQueue.main.async {
                self.imageView.image = nil
            }
        }
    }

    func setScene(_ scene: String) {
        currentScene = scene
    }

    private func configureSessionIfNeeded() throws {
        guard captureSession.inputs.isEmpty else { return }

        captureSession.beginConfiguration()
        captureSession.sessionPreset = .high

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) else {
            throw NSError(domain: "NativeMirror", code: 2, userInfo: [NSLocalizedDescriptionKey: "Front camera unavailable"])
        }

        let input = try AVCaptureDeviceInput(device: device)
        if captureSession.canAddInput(input) {
            captureSession.addInput(input)
        }

        videoOutput.alwaysDiscardsLateVideoFrames = true
        videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        videoOutput.setSampleBufferDelegate(self, queue: processingQueue)
        if captureSession.canAddOutput(videoOutput) {
            captureSession.addOutput(videoOutput)
        }
        if let connection = videoOutput.connection(with: .video) {
            if connection.isVideoOrientationSupported {
                connection.videoOrientation = .portrait
            }
            if connection.isVideoMirroringSupported {
                connection.isVideoMirrored = true
            }
        }

        captureSession.commitConfiguration()
    }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard running, let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        let cameraImage = CIImage(cvPixelBuffer: pixelBuffer)
        maybeUpdateSegmentationMask(pixelBuffer: pixelBuffer)

        let composited = compositeForeground(cameraImage: cameraImage)
        guard let cgImage = ciContext.createCGImage(composited, from: composited.extent) else { return }
        DispatchQueue.main.async {
            self.imageView.image = UIImage(cgImage: cgImage)
        }
    }

    private func maybeUpdateSegmentationMask(pixelBuffer: CVPixelBuffer) {
        let now = CFAbsoluteTimeGetCurrent()
        if isRequestInFlight || (now - lastSegmentationTs) < 0.09 { return } // ~11 fps mask refresh
        isRequestInFlight = true
        lastSegmentationTs = now

        let requestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        do {
            try requestHandler.perform([segmentationRequest])
            if let result = segmentationRequest.results?.first?.pixelBuffer {
                var maskImage = CIImage(cvPixelBuffer: result)
                let scaleX = pixelBufferSize(pixelBuffer).width / maskImage.extent.width
                let scaleY = pixelBufferSize(pixelBuffer).height / maskImage.extent.height
                maskImage = maskImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
                lastMaskImage = maskImage
            }
        } catch {
            // Keep previous mask if request fails.
        }

        isRequestInFlight = false
    }

    private func compositeForeground(cameraImage: CIImage) -> CIImage {
        guard let mask = lastMaskImage else { return cameraImage }
        let clearBg = CIImage(color: .clear).cropped(to: cameraImage.extent)
        let filter = CIFilter.blendWithMask()
        filter.inputImage = cameraImage
        filter.backgroundImage = clearBg
        filter.maskImage = mask
        return filter.outputImage?.cropped(to: cameraImage.extent) ?? cameraImage
    }

    private func pixelBufferSize(_ pb: CVPixelBuffer) -> CGSize {
        CGSize(width: CVPixelBufferGetWidth(pb), height: CVPixelBufferGetHeight(pb))
    }
}
