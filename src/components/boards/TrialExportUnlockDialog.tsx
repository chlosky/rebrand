import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { endStripeTrialEarly } from "@/lib/endStripeTrialEarly";
import { toast } from "sonner";

type TrialExportUnlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
  refreshPlan: () => void;
};

export function TrialExportUnlockDialog({
  open,
  onOpenChange,
  onUnlocked,
  refreshPlan,
}: TrialExportUnlockDialogProps) {
  const { t } = useTranslation("tools");
  const { user } = useAuth();
  const [endingTrial, setEndingTrial] = useState(false);

  const handleStartSubscription = async () => {
    if (!user?.id || endingTrial) return;
    setEndingTrial(true);
    try {
      const result = await endStripeTrialEarly(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refreshPlan();
      onOpenChange(false);
      toast.success(
        result.alreadyActive
          ? t("boards.trial.unlockedAlready")
          : t("boards.trial.unlockedNow"),
      );
      onUnlocked();
    } finally {
      setEndingTrial(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("boards.trial.lockTitle")}</DialogTitle>
          <DialogDescription>{t("boards.trial.lockDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full"
            disabled={endingTrial}
            onClick={() => void handleStartSubscription()}
          >
            {endingTrial ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("boards.trial.startingSubscription")}
              </>
            ) : (
              t("boards.trial.startSubscriptionNow")
            )}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            {t("boards.trial.keepTrial")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
