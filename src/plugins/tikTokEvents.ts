import { registerPlugin } from "@capacitor/core";

export type TikTokTrackEventOptions = {
  eventName: string;
  description?: string;
  currency?: string;
  value?: number;
  contentId?: string;
  contentName?: string;
  contentType?: string;
  contentCategory?: string;
  brand?: string;
  price?: number;
  quantity?: number;
};

export type TikTokIdentifyOptions = {
  externalId?: string;
  externalUserName?: string;
  phoneNumber?: string;
  email?: string;
};

export interface TikTokEventsPlugin {
  identify(options: TikTokIdentifyOptions): Promise<void>;
  logout(): Promise<void>;
  trackEvent(options: TikTokTrackEventOptions): Promise<void>;
}

export const TikTokEvents = registerPlugin<TikTokEventsPlugin>("TikTokEvents", {
  web: () => ({
    identify: async () => {},
    logout: async () => {},
    trackEvent: async () => {},
  }),
});
