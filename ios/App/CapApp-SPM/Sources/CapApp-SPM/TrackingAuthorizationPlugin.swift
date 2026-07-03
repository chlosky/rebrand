import AppTrackingTransparency
import Capacitor
import Foundation
import UIKit

@objc(TrackingAuthorizationPlugin)
public class TrackingAuthorizationPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TrackingAuthorizationPlugin"
    public let jsName = "TrackingAuthorization"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?
    private var didAddActiveObserver = false

    @objc func request(_ call: CAPPluginCall) {
        guard #available(iOS 14, *) else {
            call.resolve(["status": "unavailable"])
            return
        }

        DispatchQueue.main.async {
            let currentStatus = ATTrackingManager.trackingAuthorizationStatus
            NSLog("[TrackingAuthorization] request called. status=\(self.mapStatus(currentStatus)), appState=\(UIApplication.shared.applicationState.rawValue)")

            guard currentStatus == .notDetermined else {
                call.resolve(["status": self.mapStatus(currentStatus)])
                return
            }

            self.pendingCall = call
            self.addActiveObserverIfNeeded()

            if UIApplication.shared.applicationState == .active {
                self.firePendingRequestAfterDelay()
            } else {
                NSLog("[TrackingAuthorization] app not active, waiting for didBecomeActive")
            }
        }
    }

    private func addActiveObserverIfNeeded() {
        guard !didAddActiveObserver else { return }
        didAddActiveObserver = true

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    @objc private func handleDidBecomeActive() {
        NSLog("[TrackingAuthorization] didBecomeActive received")
        firePendingRequestAfterDelay()
    }

    private func firePendingRequestAfterDelay() {
        guard #available(iOS 14, *) else { return }
        guard pendingCall != nil else { return }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
            guard #available(iOS 14, *) else { return }
            guard let call = self.pendingCall else { return }

            let currentStatus = ATTrackingManager.trackingAuthorizationStatus
            NSLog("[TrackingAuthorization] firing after delay. status=\(self.mapStatus(currentStatus)), appState=\(UIApplication.shared.applicationState.rawValue)")

            guard UIApplication.shared.applicationState == .active else {
                NSLog("[TrackingAuthorization] still not active, waiting")
                return
            }

            guard currentStatus == .notDetermined else {
                self.pendingCall = nil
                call.resolve(["status": self.mapStatus(currentStatus)])
                return
            }

            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    NSLog("[TrackingAuthorization] final status=\(self.mapStatus(status))")
                    self.pendingCall = nil
                    call.resolve(["status": self.mapStatus(status)])
                }
            }
        }
    }

    private func mapStatus(_ status: ATTrackingManager.AuthorizationStatus) -> String {
        switch status {
        case .authorized:
            return "authorized"
        case .denied:
            return "denied"
        case .restricted:
            return "restricted"
        case .notDetermined:
            return "notDetermined"
        @unknown default:
            return "unknown"
        }
    }
}
