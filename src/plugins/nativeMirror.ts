import { registerPlugin } from "@capacitor/core";

type NativeMirrorStartOptions = {
  scene: "hearts" | "coins" | "gold" | "rain" | "summit" | "none";
  x: number;
  y: number;
  width: number;
  height: number;
};

type NativeMirrorLayoutOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type NativeMirrorPlugin = {
  isAvailable(): Promise<{ available: boolean; platform: string }>;
  start(options: NativeMirrorStartOptions): Promise<void>;
  stop(): Promise<void>;
  setScene(options: { scene: NativeMirrorStartOptions["scene"] }): Promise<void>;
  updateLayout(options: NativeMirrorLayoutOptions): Promise<void>;
};

export const NativeMirror = registerPlugin<NativeMirrorPlugin>("NativeMirror");

