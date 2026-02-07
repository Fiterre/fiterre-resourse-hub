"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Globe, Plus, Trash2, Loader2 } from "lucide-react";

export function DomainSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const utils = trpc.useUtils();

  const { data: domains = [], isLoading: domainsLoading } =
    trpc.allowedDomains.list.useQuery(undefined, { enabled: open });

  const { data: restriction } = trpc.settings.getDomainRestriction.useQuery(
    undefined,
    { enabled: open }
  );

  const setRestriction = trpc.settings.setDomainRestriction.useMutation({
    onSuccess: (data) => {
      utils.settings.getDomainRestriction.invalidate();
      toast.success(
        data.enabled
          ? "ドメイン制限を有効にしました"
          : "ドメイン制限を無効にしました"
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const createDomain = trpc.allowedDomains.create.useMutation({
    onSuccess: () => {
      utils.allowedDomains.list.invalidate();
      setNewDomain("");
      setNewDescription("");
      toast.success("ドメインを追加しました");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateDomain = trpc.allowedDomains.update.useMutation({
    onSuccess: () => {
      utils.allowedDomains.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteDomain = trpc.allowedDomains.delete.useMutation({
    onSuccess: () => {
      utils.allowedDomains.list.invalidate();
      toast.success("ドメインを削除しました");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    createDomain.mutate({
      domain: newDomain.trim().toLowerCase(),
      description: newDescription.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
          <Globe className="h-4 w-4" />
          ドメイン
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            ドメイン制限設定
          </DialogTitle>
          <DialogDescription>
            招待時に許可するメールアドレスのドメインを管理します。
          </DialogDescription>
        </DialogHeader>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div>
            <p className="font-medium text-sm">ドメイン制限</p>
            <p className="text-xs text-muted-foreground">
              有効にすると、許可されたドメインのメールアドレスのみ招待可能になります
            </p>
          </div>
          <Switch
            checked={restriction?.enabled ?? false}
            onCheckedChange={(checked) =>
              setRestriction.mutate({ enabled: checked })
            }
          />
        </div>

        {/* Add domain form */}
        <form onSubmit={handleAddDomain} className="space-y-3">
          <div className="space-y-2">
            <Label>新しいドメインを追加</Label>
            <div className="flex gap-2">
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={createDomain.isPending || !newDomain.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input
            placeholder="説明（任意）"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </form>

        {/* Domain list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">許可ドメイン一覧</h4>
          {domainsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : domains.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              ドメインが登録されていません
            </p>
          ) : (
            <div className="space-y-2">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{domain.domain}</p>
                    {domain.description && (
                      <p className="text-xs text-muted-foreground">
                        {domain.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Switch
                      checked={domain.isActive}
                      onCheckedChange={(checked) =>
                        updateDomain.mutate({
                          id: domain.id,
                          isActive: checked,
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDomain.mutate({ id: domain.id })}
                      disabled={deleteDomain.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
