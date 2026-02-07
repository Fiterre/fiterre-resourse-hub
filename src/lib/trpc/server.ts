import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { authOptions } from "../auth";

export const createContext = async (opts?: FetchCreateContextFnOptions) => {
  const session = await getServerSession(authOptions);
  return {
    session,
    user: session?.user ?? null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "ログインが必要です",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const tier1Procedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.tier !== "1") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tier 1の権限が必要です",
    });
  }
  return next({ ctx });
});
