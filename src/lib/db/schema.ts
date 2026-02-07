import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const tierEnum = pgEnum("tier", ["1", "2", "3", "4", "5"]);
export const actionEnum = pgEnum("action", ["view", "create", "edit", "delete"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired"]);

/**
 * Core user table backing auth flow.
 * Extended with tier system for access control.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  hashedPassword: text("hashed_password"),
  role: roleEnum("role").default("user").notNull(),
  tier: tierEnum("tier").default("5").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * NextAuth sessions table
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

/**
 * NextAuth accounts table (for OAuth providers)
 */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

/**
 * NextAuth verification tokens
 */
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

/**
 * Resources table for storing links, documents, and apps
 */
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: varchar("url", { length: 2048 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 64 }),
  labels: text("labels"), // Store as JSON string
  requiredTier: tierEnum("required_tier"),
  isExternal: boolean("is_external").default(true),
  isFavorite: boolean("is_favorite").default(false),
  sortOrder: integer("sort_order").default(0),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

/**
 * Categories table for organizing resources
 */
export const categories = pgTable("categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }),
  sortOrder: integer("sort_order").default(0),
  requiredTier: tierEnum("required_tier"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Labels table for tagging resources
 */
export const labels = pgTable("labels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Label = typeof labels.$inferSelect;
export type InsertLabel = typeof labels.$inferInsert;

/**
 * Access logs table for tracking resource access
 */
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userName: varchar("user_name", { length: 255 }),
  resourceId: integer("resource_id").references(() => resources.id),
  resourceTitle: varchar("resource_title", { length: 255 }),
  resourceUrl: varchar("resource_url", { length: 2048 }),
  action: actionEnum("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;

/**
 * Invitations table for inviting new users
 */
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  initialTier: tierEnum("initial_tier").default("5").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: invitationStatusEnum("status").default("pending").notNull(),
  invitedBy: integer("invited_by")
    .references(() => users.id)
    .notNull(),
  invitedByName: varchar("invited_by_name", { length: 255 }),
  acceptedBy: integer("accepted_by").references(() => users.id),
  note: text("note"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

/**
 * Allowed domains table for invitation email restrictions
 */
export const allowedDomains = pgTable("allowed_domains", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AllowedDomain = typeof allowedDomains.$inferSelect;
export type InsertAllowedDomain = typeof allowedDomains.$inferInsert;

/**
 * Settings table for global configuration
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value"),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
