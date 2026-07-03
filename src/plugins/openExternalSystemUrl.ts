import { registerPlugin } from "@capacitor/core";

export interface OpenExternalSystemUrlPlugin {
  /** UIApplication.shared.open — no in-app browser. URL must use itms-apps scheme (enforced on iOS). */
  open(options: { url: string }): Promise<void>;
}

export const OpenExternalSystemUrl = registerPlugin<OpenExternalSystemUrlPlugin>("OpenExternalSystemUrl", {
  web: () => ({
    open: async () => {
      throw new Error("OpenExternalSystemUrl is only available on native iOS");
    },
  }),
});
