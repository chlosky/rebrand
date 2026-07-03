import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, RefreshCw, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  generateTaskerProfile,
  downloadFile,
} from "@/lib/shortcut-utils";

interface DeviceAutomationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeviceAutomationModal: React.FC<DeviceAutomationModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [weeklySnapshotLink, setWeeklySnapshotLink] = useState<string>("");

  useEffect(() => {
    if (open) {
      // Generate or retrieve weekly snapshot link
      // Point to activity tracking page Week Review tab
      const baseUrl = window.location.origin;
      setWeeklySnapshotLink(`${baseUrl}/dashboard/activity-tracking#review`);
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(weeklySnapshotLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Weekly snapshot link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    // For now, just show a toast. In the future, this could generate a new token
    toast({
      title: "Link regenerated",
      description: "Your weekly snapshot link has been updated",
    });
  };


  const handleDownloadTaskerProfile = () => {
    try {
      const taskerXML = generateTaskerProfile(weeklySnapshotLink);
      downloadFile(taskerXML, "Weekly_Checkin.prf.xml", "application/xml");
      toast({
        title: "Downloaded!",
        description: "Import this file into Tasker app",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Tasker profile. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Device Automation Setup</DialogTitle>
          <DialogDescription>
            Set up automated reminders using your device's built-in automation features
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="iphone" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="iphone">iPhone</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
          </TabsList>

          <TabsContent value="iphone" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">iPhone Shortcuts</h3>
              
              {/* Setup Instructions */}
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open Shortcuts app → Automation tab → + → Create Personal Automation</li>
                <li>Select "Time of Day" → Choose weekly time (e.g., Monday 9:00 AM)</li>
                <li>Add action: "Open URLs"</li>
                <li>Paste your Weekly Snapshot link (below)</li>
                <li>Turn off "Ask Before Running" to make it automatic</li>
                <li>Tap "Done" to save</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="android" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Android Automation</h3>
              
              {/* Tasker Option */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">Tasker (Recommended)</h4>
                    <p className="text-xs text-muted-foreground">
                      Download a ready-to-use Tasker profile
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTaskerProfile}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Import the downloaded file into Tasker app. You may need to adjust the time trigger.
                </p>
              </div>

              {/* Google Assistant Routines */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-medium text-sm">Google Assistant Routines</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Open Google Assistant → Routines</li>
                <li>Create a new routine</li>
                <li>Set trigger: "Time of day" → Choose weekly time</li>
                  <li>Add action: "Open a link" (paste Weekly Snapshot link below)</li>
                <li>Save and enable the routine</li>
              </ol>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <div className="mt-6 pt-4 border-t space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Weekly Snapshot Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={weeklySnapshotLink}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerate}
                className="shrink-0"
                title="Regenerate link"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this link in your automation to open your weekly check-in
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

