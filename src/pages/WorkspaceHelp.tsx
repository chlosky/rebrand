import ReportAppIssue from "@/pages/ReportAppIssue";
import { MobileBottomInlet } from "@/components/MobileBottomInlet";

/** Workspace help — support & feedback + inbox. */
export default function WorkspaceHelp() {
  return (
    <>
      <MobileBottomInlet />
      <ReportAppIssue workspaceMode />
    </>
  );
}
