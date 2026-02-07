import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  router,
  publicProcedure,
  protectedProcedure,
  tier1Procedure,
} from "./server";
import {
  getAllUsers,
  getUserById,
  updateUserTier,
  updateUserProfile,
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  reorderResources,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllLabels,
  createLabel,
  deleteLabel,
  getAccessLogs,
  createAccessLog,
  clearAccessLogs,
  createInvitation,
  getInvitationByToken,
  getAllInvitations,
  updateInvitationStatus,
  deleteInvitation,
  isEmailDomainAllowed,
  getAllowedDomains,
  createAllowedDomain,
  updateAllowedDomain,
  deleteAllowedDomain,
  getSetting,
  upsertSetting,
  createUser,
  getUserByEmail,
} from "../db/queries";

// ============ Auth Router ============
const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const user = await getUserById(ctx.user.id);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tier: user.tier,
      image: user.image,
    };
  }),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "名前を入力してください"),
        email: z.string().email("有効なメールアドレスを入力してください"),
        password: z
          .string()
          .min(8, "パスワードは8文字以上で入力してください"),
        inviteToken: z.string().min(1, "招待トークンが必要です"),
      })
    )
    .mutation(async ({ input }) => {
      // Check invitation token first - REQUIRED
      const invitation = await getInvitationByToken(input.inviteToken);
      if (!invitation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無効な招待トークンです。管理者から招待リンクを取得してください。",
        });
      }
      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この招待は既に使用されています。",
        });
      }
      if (new Date() > new Date(invitation.expiresAt)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "この招待は期限切れです。管理者に新しい招待を依頼してください。",
        });
      }

      // Check if user already exists
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "このメールアドレスは既に登録されています",
        });
      }

      // Create user with the tier from invitation
      const user = await createUser({
        name: input.name,
        email: input.email,
        password: input.password,
        tier: invitation.initialTier,
      });

      // Mark invitation as accepted
      await updateInvitationStatus(invitation.id, "accepted", user.id);

      return { success: true, message: "アカウントを作成しました" };
    }),
});

// ============ Users Router ============
const usersRouter = router({
  list: tier1Procedure.query(async () => {
    return await getAllUsers();
  }),

  updateTier: tier1Procedure
    .input(
      z.object({
        userId: z.number(),
        tier: z.enum(["1", "2", "3", "4", "5"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await updateUserTier(input.userId, input.tier);
      return result[0];
    }),

  updateProfile: tier1Procedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, ...data } = input;
      const result = await updateUserProfile(userId, data);
      return result ? result[0] : null;
    }),
});

// ============ Resources Router ============
const resourcesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const all = await getAllResources();
    const userTier = parseInt(ctx.user.tier);
    // Filter resources based on user tier
    return all.filter((r) => {
      if (!r.requiredTier) return true;
      return userTier <= parseInt(r.requiredTier);
    });
  }),

  listAll: tier1Procedure.query(async () => {
    return await getAllResources();
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        url: z.string().min(1),
        category: z.string().min(1),
        icon: z.string().optional(),
        labels: z.string().optional(),
        requiredTier: z.enum(["1", "2", "3", "4", "5"]).optional(),
        isExternal: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createResource({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        category: z.string().optional(),
        icon: z.string().optional(),
        labels: z.string().optional(),
        requiredTier: z.enum(["1", "2", "3", "4", "5"]).nullish(),
        isExternal: z.boolean().optional(),
        isFavorite: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await updateResource(id, updates);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteResource(input.id);
    }),

  reorder: protectedProcedure
    .input(z.object({ orderedIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return await reorderResources(input.orderedIds);
    }),
});

// ============ Categories Router ============
const categoriesRouter = router({
  list: protectedProcedure.query(async () => {
    return await getAllCategories();
  }),

  create: tier1Procedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        icon: z.string().optional(),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createCategory(input);
    }),

  update: tier1Procedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await updateCategory(id, updates);
    }),

  delete: tier1Procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteCategory(input.id);
    }),
});

// ============ Labels Router ============
const labelsRouter = router({
  list: protectedProcedure.query(async () => {
    return await getAllLabels();
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await createLabel(input.name);
    }),

  delete: tier1Procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteLabel(input.id);
    }),
});

// ============ Access Logs Router ============
const accessLogsRouter = router({
  list: tier1Procedure
    .input(
      z
        .object({
          userId: z.number().optional(),
          resourceId: z.number().optional(),
          action: z
            .enum(["view", "create", "edit", "delete"])
            .optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await getAccessLogs(input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        resourceId: z.number().optional(),
        resourceTitle: z.string().optional(),
        resourceUrl: z.string().optional(),
        action: z.enum(["view", "create", "edit", "delete"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createAccessLog({
        userId: ctx.user.id,
        userName: ctx.user.name || ctx.user.email || "Unknown",
        ...input,
      });
    }),

  clear: tier1Procedure.mutation(async () => {
    return await clearAccessLogs();
  }),
});

// ============ Invitations Router ============
const invitationsRouter = router({
  list: tier1Procedure.query(async () => {
    return await getAllInvitations();
  }),

  create: tier1Procedure
    .input(
      z.object({
        email: z.string().email(),
        initialTier: z.enum(["1", "2", "3", "4", "5"]),
        note: z.string().optional(),
        expiresInDays: z.number().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check domain restriction
      const allowed = await isEmailDomainAllowed(input.email);
      if (!allowed) {
        const domain = input.email.split("@")[1];
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `ドメイン「${domain}」は許可されていません。ドメイン設定を確認してください。`,
        });
      }

      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const invitation = await createInvitation({
        email: input.email,
        initialTier: input.initialTier,
        token,
        status: "pending",
        invitedBy: ctx.user.id,
        invitedByName: ctx.user.name || ctx.user.email || "Unknown",
        note: input.note,
        expiresAt,
      });

      return { ...invitation, token };
    }),

  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const invitation = await getInvitationByToken(input.token);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "招待が見つかりません",
        });
      }
      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この招待は既に使用されています",
        });
      }
      if (new Date() > new Date(invitation.expiresAt)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この招待は期限切れです",
        });
      }
      return invitation;
    }),

  accept: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await getInvitationByToken(input.token);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "招待が見つかりません",
        });
      }
      if (invitation.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この招待は既に処理されています",
        });
      }
      if (new Date() > new Date(invitation.expiresAt)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "この招待は期限切れです",
        });
      }

      // Update user tier
      await updateUserTier(ctx.user.id, invitation.initialTier);
      // Mark invitation as accepted
      await updateInvitationStatus(invitation.id, "accepted", ctx.user.id);

      return {
        success: true,
        message: `Tier ${invitation.initialTier}として登録されました`,
      };
    }),

  delete: tier1Procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteInvitation(input.id);
    }),
});

// ============ Allowed Domains Router ============
const allowedDomainsRouter = router({
  list: tier1Procedure.query(async () => {
    return await getAllowedDomains();
  }),

  create: tier1Procedure
    .input(
      z.object({
        domain: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await createAllowedDomain({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  update: tier1Procedure
    .input(
      z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await updateAllowedDomain(id, updates);
    }),

  delete: tier1Procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteAllowedDomain(input.id);
    }),
});

// ============ Settings Router ============
const settingsRouter = router({
  getDomainRestriction: tier1Procedure.query(async () => {
    const setting = await getSetting("domainRestrictionEnabled");
    return { enabled: setting?.value === "true" };
  }),

  setDomainRestriction: tier1Procedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await upsertSetting(
        "domainRestrictionEnabled",
        input.enabled.toString(),
        ctx.user.id
      );
      return { enabled: input.enabled };
    }),
});

// ============ App Router ============
export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  resources: resourcesRouter,
  categories: categoriesRouter,
  labels: labelsRouter,
  accessLogs: accessLogsRouter,
  invitations: invitationsRouter,
  allowedDomains: allowedDomainsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
