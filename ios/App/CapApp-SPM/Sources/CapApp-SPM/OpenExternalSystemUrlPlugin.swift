import Foundation
import Capacitor
import UIKit

/// Opens URLs with UIApplication.shared.open only — no webview, no SFSafariViewController.
/// Manage Billing uses this for itms-apps subscription management handoff.
@objc(OpenExternalSystemUrlPlugin)
public class OpenExternalSystemUrlPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OpenExternalSystemUrlPlugin"
    public let jsName = "OpenExternalSystemUrl"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise)
    ]

    @objc func open(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("missing or invalid url")
            return
        }
        guard url.scheme?.lowercased() == "itms-apps" else {
            call.reject("only itms-apps URLs are allowed for system handoff")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { success in
                DispatchQueue.main.async {
                    if success {
                        call.resolve()
                    } else {
                        call.reject("UIApplication.shared.open returned false")
                    }
                }
            }
        }
    }
}
