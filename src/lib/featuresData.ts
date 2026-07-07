import { LayoutGrid, type LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
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
  ];
}

export interface SupportReportToolOption {
  value: string;
  label: string;
}

export function getSupportReportToolOptions(t: TFunction<"dashboard">): SupportReportToolOption[] {
  return [
    { value: "/dashboard/boards", label: t("tools.boards.title") },
    { value: "/dashboard/boards/accountability", label: t("supportTools.action") },
    { value: "/workspace?tab=library", label: t("workspace.tabs.library") },
    { value: "/workspace?tab=images", label: t("workspace.tabs.imageLibrary") },
    { value: "/workspace?tab=projects", label: t("workspace.tabs.projects") },
    { value: "settings", label: t("profile.yourAccount") },
    { value: "billing", label: t("supportTools.billing") },
    { value: "other", label: t("supportTools.other") },
  ];
}

export function getBillingPurchaseChannelOptions(t: TFunction<"dashboard">) {
  return [
    { value: "apple_app_store", label: t("billingChannels.apple") },
    { value: "google_play", label: t("billingChannels.googlePlay") },
    { value: "web", label: t("billingChannels.web") },
  ];
}
