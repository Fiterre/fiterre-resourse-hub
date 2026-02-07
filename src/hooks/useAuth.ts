"use client";

import { useSession, signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const { data: freshUser } = trpc.auth.me.useQuery(undefined, {
    enabled: status === "authenticated",
    staleTime: 30 * 1000,
  });

  const loading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const user = freshUser
    ? {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        role: freshUser.role,
        tier: freshUser.tier,
        image: freshUser.image,
      }
    : session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          tier: session.user.tier,
          image: session.user.image,
        }
      : null;

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const refreshSession = async () => {
    await update();
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    refreshSession,
    error: null,
  };
}
