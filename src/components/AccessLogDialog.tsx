"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { History, Trash2, Eye, PenLine, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface AccessLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionIcons: Record<string, any> = {
  view: Eye,
  create: Plus,
  edit: PenLine,
  delete: Trash2,
};

const actionLabels: Record<string, string> = {
  view: "閲覧",
  create: "作成",
  edit: "編集",
  delete: "削除",
};

const actionColors: Record<string, string> = {
  view: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  create:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  edit: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function AccessLogDialog({ open, onOpenChange }: AccessLogDialogProps) {
  const utils = trpc.useUtils();
  const { data: logs = [], isLoading } = trpc.accessLogs.list.useQuery(
    undefined,
    { enabled: open }
  );

  const clearMutation = trpc.accessLogs.clear.useMutation({
    onSuccess: () => {
      utils.accessLogs.list.invalidate();
      toast.success("アクセスログをクリアしました");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              アクセスログ
            </DialogTitle>
            {logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                クリア
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="w-12 h-12 mb-4 opacity-50" />
            <p>アクセスログがありません</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 mt-4">
            <div className="space-y-2 pr-4">
              {logs.map((log) => {
                const ActionIcon = actionIcons[log.action] || Eye;
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${actionColors[log.action] || ""}`}
                    >
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {log.userName}
                        </span>
                        <Badge
                          variant="secondary"
                          className={actionColors[log.action]}
                        >
                          {actionLabels[log.action]}
                        </Badge>
                      </div>
                      {log.resourceTitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {log.resourceTitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.timestamp), "MM/dd HH:mm", {
                        locale: ja,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
