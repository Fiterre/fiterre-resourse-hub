"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { tierLabels, tierColors, type TierLevel } from "@/types";
import { Users, Shield, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserManagementDialog({
  open,
  onOpenChange,
}: UserManagementDialogProps) {
  const {
    data: users = [],
    isLoading,
    refetch,
  } = trpc.users.list.useQuery(undefined, { enabled: open });

  const updateTierMutation = trpc.users.updateTier.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("ユーザーのTierを更新しました");
    },
    onError: (error) => {
      toast.error("Tierの更新に失敗しました", { description: error.message });
    },
  });

  const [pendingChanges, setPendingChanges] = useState<
    Record<number, TierLevel>
  >({});

  const handleTierChange = (userId: number, tier: TierLevel) => {
    setPendingChanges((prev) => ({ ...prev, [userId]: tier }));
  };

  const handleSave = async (userId: number) => {
    const newTier = pendingChanges[userId];
    if (newTier) {
      await updateTierMutation.mutateAsync({ userId, tier: newTier });
      setPendingChanges((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            ユーザー管理
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            ユーザーのTierレベルを管理できます。Tier1が最高権限です。
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p>ユーザーがいません</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 mt-4">
            <div className="space-y-3 pr-4">
              {users.map((user) => {
                const currentTier = pendingChanges[user.id] || user.tier;
                const hasChange = pendingChanges[user.id] !== undefined;

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {user.name || user.email || "Unknown User"}
                        </span>
                        {user.role === "admin" && (
                          <Badge variant="secondary" className="text-xs">
                            管理者
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email || "メールアドレスなし"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        最終ログイン:{" "}
                        {new Date(user.lastSignedIn).toLocaleDateString(
                          "ja-JP"
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={currentTier}
                        onValueChange={(value) =>
                          handleTierChange(user.id, value as TierLevel)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <Shield className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["1", "2", "3", "4", "5"] as TierLevel[]).map(
                            (tier) => (
                              <SelectItem key={tier} value={tier}>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${tierColors[tier]}`}
                                >
                                  {tierLabels[tier]}
                                </span>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>

                      {hasChange && (
                        <Button
                          size="sm"
                          onClick={() => handleSave(user.id)}
                          disabled={updateTierMutation.isPending}
                        >
                          {updateTierMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Tier explanation */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Tierレベルについて</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            {(["1", "2", "3", "4", "5"] as TierLevel[]).map((tier) => (
              <div key={tier} className="flex items-center gap-2">
                <Badge className={tierColors[tier]}>Tier {tier}</Badge>
                <span>{tierLabels[tier].replace(`Tier ${tier} (`, "").replace(")", "")}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
