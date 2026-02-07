"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Dumbbell, Shield } from "lucide-react";
import { tierLabels, tierColors, type TierLevel } from "@/types";
import Link from "next/link";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = params.token as string;

  const {
    data: invitation,
    isLoading,
    error,
  } = trpc.invitations.verify.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const acceptMutation = trpc.invitations.accept.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.push("/");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>招待が無効です</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button>ログインページへ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  // Not logged in - redirect to register with token
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Fiterre Resource Hubへの招待</CardTitle>
            <CardDescription>
              {invitation.invitedByName}さんから招待されました
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">付与されるTier:</span>
                <Badge
                  className={
                    tierColors[invitation.initialTier as TierLevel]
                  }
                  variant="secondary"
                >
                  {tierLabels[invitation.initialTier as TierLevel]}
                </Badge>
              </div>
              {invitation.note && (
                <p className="text-sm text-muted-foreground">
                  メモ: {invitation.note}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Link href={`/register?token=${token}`}>
                <Button className="w-full">新規登録して参加</Button>
              </Link>
              <Link href={`/login?callbackUrl=/invite/${token}`}>
                <Button variant="outline" className="w-full">
                  既存アカウントでログイン
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in - accept invitation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>招待を承認</CardTitle>
          <CardDescription>
            {invitation.invitedByName}さんからの招待を承認しますか？
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">付与されるTier:</span>
              <Badge
                className={
                  tierColors[invitation.initialTier as TierLevel]
                }
                variant="secondary"
              >
                {tierLabels[invitation.initialTier as TierLevel]}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => acceptMutation.mutate({ token })}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              承認する
            </Button>
            <Link href="/">
              <Button variant="outline">キャンセル</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
