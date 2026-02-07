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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  Trash2,
  Clock,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { tierLabels, tierColors, type TierLevel } from "@/types";

export function InvitationDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<TierLevel>("5");
  const [note, setNote] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: invitations, isLoading } = trpc.invitations.list.useQuery(
    undefined,
    { enabled: open }
  );

  const createMutation = trpc.invitations.create.useMutation({
    onSuccess: (data) => {
      toast.success("招待を作成しました");
      setEmail("");
      setNote("");
      setTier("5");
      setExpiresInDays(7);
      utils.invitations.list.invalidate();

      const inviteUrl = `${window.location.origin}/register?token=${data.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.info("招待リンクをコピーしました。メールやチャットで相手に送ってください。", { duration: 5000 });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.invitations.delete.useMutation({
    onSuccess: () => {
      toast.success("招待を削除しました");
      utils.invitations.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("メールアドレスを入力してください");
      return;
    }
    createMutation.mutate({ email, initialTier: tier, note, expiresInDays });
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    toast.success("招待リンクをコピーしました");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStatusBadge = (status: string, expiresAt: Date) => {
    if (status === "accepted") {
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        >
          承認済み
        </Badge>
      );
    }
    if (status === "expired" || new Date() > new Date(expiresAt)) {
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          期限切れ
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      >
        保留中
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
          <UserPlus className="h-4 w-4" />
          招待
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            ユーザー招待
          </DialogTitle>
          <DialogDescription>
            招待リンクを作成し、メールやチャットで相手に送信してください。招待されたユーザーのみ登録できます。
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
          <strong>招待の流れ：</strong> 招待作成 → リンクをコピー → メール/チャットで送信 → 相手がリンクから登録
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">メールアドレス</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>初期Tier</Label>
              <Select
                value={tier}
                onValueChange={(v) => setTier(v as TierLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["1", "2", "3", "4", "5"] as TierLevel[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={tierColors[value]}
                          variant="secondary"
                        >
                          Tier {value}
                        </Badge>
                        <span>{tierLabels[value].replace(`Tier ${value} (`, "").replace(")", "")}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-note">メモ（任意）</Label>
            <Textarea
              id="invite-note"
              placeholder="招待に関するメモを入力..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>有効期限</Label>
            <Select
              value={expiresInDays.toString()}
              onValueChange={(v) => setExpiresInDays(parseInt(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1日</SelectItem>
                <SelectItem value="3">3日</SelectItem>
                <SelectItem value="7">7日</SelectItem>
                <SelectItem value="14">14日</SelectItem>
                <SelectItem value="30">30日</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending || !email}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? "作成中..." : "招待を作成"}
          </Button>
        </form>

        {/* Invitation list */}
        <div className="space-y-4 pt-4">
          <h3 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            招待履歴
          </h3>

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              読み込み中...
            </div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {invitation.email}
                      </span>
                      {getStatusBadge(
                        invitation.status,
                        invitation.expiresAt
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <Badge
                        className={
                          tierColors[invitation.initialTier as TierLevel]
                        }
                        variant="secondary"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Tier {invitation.initialTier}
                      </Badge>
                      <span>•</span>
                      <span>
                        {format(
                          new Date(invitation.createdAt),
                          "yyyy/MM/dd HH:mm",
                          { locale: ja }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    {invitation.status === "pending" &&
                      new Date() <= new Date(invitation.expiresAt) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invitation.token)}
                        >
                          {copiedToken === invitation.token ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteMutation.mutate({ id: invitation.id })
                      }
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              招待履歴がありません
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
