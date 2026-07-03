import { Capacitor } from "@capacitor/core";
import MirrorRehearsal from "./MirrorRehearsal";
import MirrorRehearsalAndroid from "./MirrorRehearsalAndroid";
import MirrorRehearsalWeb from "./MirrorRehearsalWeb";

/**
 * Platform entry only:
 * - Android native → MirrorRehearsalAndroid
 * - iOS native → MirrorRehearsal (native compositor)
 * - Web (desktop + mobile browser) → MirrorRehearsalWeb
 */
const MirrorRehearsalRoute = () => {
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.getPlatform() === "android") {
      return <MirrorRehearsalAndroid />;
    }
    return <MirrorRehearsal />;
  }
  return <MirrorRehearsalWeb />;
};

export default MirrorRehearsalRoute;
