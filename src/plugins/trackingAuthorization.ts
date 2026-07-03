import { registerPlugin } from "@capacitor/core";

export type TrackingAuthorizationStatus =
  | "authorized"
  | "denied"
  | "restricted"
  | "notDetermined"
  | "requested"
  | "unavailable"
  | "unknown";

export interface TrackingAuthorizationPlugin {
  request(): Promise<{ status: TrackingAuthorizationStatus }>;
}

export const TrackingAuthorization = registerPlugin<TrackingAuthorizationPlugin>(
  "TrackingAuthorization",
  {
    web: () => ({
      request: async () => ({ status: "unavailable" }),
    }),
  },
);
