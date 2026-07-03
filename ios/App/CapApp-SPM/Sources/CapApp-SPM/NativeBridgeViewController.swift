import UIKit
import Capacitor

@objc(NativeBridgeViewController)
public class NativeBridgeViewController: CAPBridgeViewController {
    public override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(NativeMirrorPlugin())
        bridge?.registerPluginInstance(OpenExternalSystemUrlPlugin())
        bridge?.registerPluginInstance(TrackingAuthorizationPlugin())
    }
}

