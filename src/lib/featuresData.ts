import { PenLine, LayoutGrid, type LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import { GiJourney } from "react-icons/gi";
import type { TFunction } from "i18next";

export interface Feature {
  icon: LucideIcon | IconType;
  title: string;
  description: string;
  path: string;
}

export function getDashboardFeatures(t: TFunction<"dashboard">): Feature[] {
  return [
    {
      icon: LayoutGrid,
      title: t("tools.boards.title"),
      description: t("tools.boards.description"),
      path: "/dashboard/boards",
    },
    {
      icon: PenLine,
      title: t("tools.affirmScript.title"),
      description: t("tools.affirmScript.description"),
      path: "/dashboard/affirmations-builder",
    },
    {
      icon: GiJourney,
      title: t("tools.yourJourney.title"),
      description: t("tools.yourJourney.description"),
      path: "/dashboard/your-journey",
    },
  ];
}

/** @deprecated Use getDashboardFeatures(t) */
export const dashboardFeatures: Feature[] = [
  {
    icon: LayoutGrid,
    title: "Boards",
    description: "4-board life system with drag-and-drop editor",
    path: "/dashboard/boards",
  },
  {
    icon: PenLine,
    title: "Affirm & Script",
    description: "Build affirmation sequences and visual goals",
    path: "/dashboard/affirmations-builder",
  },
  {
    icon: GiJourney,
    title: "Your Journey",
    description: "Milestones, tracking, and journal",
    path: "/dashboard/your-journey",
  },
];

export interface SupportReportToolOption {
  value: string;
  label: string;
}

export function getSupportReportToolOptions(t: TFunction<"dashboard">): SupportReportToolOption[] {
  return [
    { value: "/dashboard", label: t("supportTools.dashboard") },
    ...getDashboardFeatures(t).map((f) => ({ value: f.path, label: f.title })),
    { value: "/dashboard/affirmation-viewer", label: t("supportTools.affirmationVisualizer") },
    { value: "/dashboard/music-composer", label: t("supportTools.musicComposer") },
    { value: "/dashboard/tap-in", label: t("supportTools.tapIn") },
    { value: "/dashboard/activity-tracking", label: t("supportTools.activityTracking") },
    { value: "/dashboard/timeline", label: t("supportTools.journal") },
    { value: "settings", label: t("supportTools.settingsAccount") },
    { value: "billing", label: t("supportTools.billing") },
    { value: "other", label: t("supportTools.other") },
  ];
}

export const supportReportToolOptions: SupportReportToolOption[] = [
  { value: "/dashboard", label: "Dashboard (home)" },
  ...dashboardFeatures.map((f) => ({ value: f.path, label: f.title })),
  { value: "/dashboard/affirmation-viewer", label: "Affirmation Visualizer" },
  { value: "/dashboard/music-composer", label: "Music Composer" },
  { value: "/dashboard/tap-in", label: "Tap-in / Piano" },
  { value: "/dashboard/activity-tracking", label: "Activity tracking" },
  { value: "/dashboard/timeline", label: "Manifestation journal" },
  { value: "settings", label: "Settings / Account" },
  { value: "billing", label: "Billing / subscriptions" },
  { value: "other", label: "Other (new tool or not listed)" },
];

export function getBillingPurchaseChannelOptions(t: TFunction<"dashboard">) {
  return [
    { value: "apple_app_store", label: t("billingChannels.apple") },
    { value: "google_play", label: t("billingChannels.googlePlay") },
    { value: "web", label: t("billingChannels.web") },
  ];
}

export const billingPurchaseChannelOptions: { value: string; label: string }[] = [
  { value: "apple_app_store", label: "Apple App Store" },
  { value: "google_play", label: "Google Play" },
  { value: "web", label: "Web (card / checkout)" },
];
