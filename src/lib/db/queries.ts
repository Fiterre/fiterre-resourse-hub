import { eq, desc, and, gte, lte, asc, type SQL } from "drizzle-orm";
import { db } from "./index";
import {
  users,
  resources,
  categories,
  labels,
  accessLogs,
  invitations,
  allowedDomains,
  settings,
  type InsertUser,
  type InsertResource,
  type InsertCategory,
  type InsertAccessLog,
  type InsertInvitation,
  type InsertAllowedDomain,
} from "./schema";
import bcryptjs from "bcryptjs";

// ============ User Functions ============

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  tier?: "1" | "2" | "3" | "4" | "5";
  role?: "user" | "admin";
}) {
  const hashedPassword = await bcryptjs.hash(data.password, 12);
  const result = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      hashedPassword,
      tier: data.tier || "5",
      role: data.role || "user",
    })
    .returning();
  return result[0];
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserById(id: number) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllUsers() {
  return await db.select().from(users).orderBy(asc(users.name));
}

export async function updateUserTier(
  userId: number,
  tier: "1" | "2" | "3" | "4" | "5"
) {
  await db.update(users).set({ tier }).where(eq(users.id, userId));
  return await db.select().from(users).where(eq(users.id, userId)).limit(1);
}

export async function verifyPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.hashedPassword) return null;
  const isValid = await bcryptjs.compare(password, user.hashedPassword);
  if (!isValid) return null;
  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));
  return user;
}

// ============ Resource Functions ============

export async function getAllResources() {
  return await db.select().from(resources).orderBy(asc(resources.sortOrder));
}

export async function getResourceById(id: number) {
  const result = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createResource(resource: Omit<InsertResource, "id">) {
  const result = await db.insert(resources).values(resource).returning();
  return result[0];
}

export async function updateResource(
  id: number,
  updates: Partial<InsertResource>
) {
  await db.update(resources).set(updates).where(eq(resources.id, id));
  return await getResourceById(id);
}

export async function deleteResource(id: number) {
  await db.delete(resources).where(eq(resources.id, id));
  return true;
}

export async function reorderResources(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(resources)
      .set({ sortOrder: i })
      .where(eq(resources.id, orderedIds[i]));
  }
  return true;
}

// ============ Category Functions ============

export async function getAllCategories() {
  return await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));
}

export async function createCategory(category: InsertCategory) {
  await db.insert(categories).values(category);
  return category.id;
}

export async function updateCategory(
  id: string,
  updates: Partial<InsertCategory>
) {
  await db.update(categories).set(updates).where(eq(categories.id, id));
  return await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
  return true;
}

// ============ Label Functions ============

export async function getAllLabels() {
  return await db.select().from(labels).orderBy(asc(labels.name));
}

export async function createLabel(name: string) {
  const result = await db.insert(labels).values({ name }).returning();
  return result[0];
}

export async function deleteLabel(id: number) {
  await db.delete(labels).where(eq(labels.id, id));
  return true;
}

// ============ Access Log Functions ============

export async function getAccessLogs(filters?: {
  userId?: number;
  resourceId?: number;
  action?: "view" | "create" | "edit" | "delete";
  startDate?: Date;
  endDate?: Date;
}) {
  let query = db.select().from(accessLogs);

  const conditions: SQL[] = [];
  if (filters?.userId)
    conditions.push(eq(accessLogs.userId, filters.userId));
  if (filters?.resourceId)
    conditions.push(eq(accessLogs.resourceId, filters.resourceId));
  if (filters?.action)
    conditions.push(eq(accessLogs.action, filters.action));
  if (filters?.startDate)
    conditions.push(gte(accessLogs.timestamp, filters.startDate));
  if (filters?.endDate)
    conditions.push(lte(accessLogs.timestamp, filters.endDate));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(accessLogs.timestamp)).limit(1000);
}

export async function createAccessLog(log: Omit<InsertAccessLog, "id">) {
  const result = await db.insert(accessLogs).values(log).returning();
  return result[0];
}

export async function clearAccessLogs() {
  await db.delete(accessLogs);
  return true;
}

// ============ Invitation Functions ============

export async function createInvitation(
  invitation: Omit<InsertInvitation, "id" | "createdAt">
) {
  const result = await db.insert(invitations).values(invitation).returning();
  return result[0];
}

export async function getInvitationByToken(token: string) {
  const result = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getInvitationByEmail(email: string) {
  const result = await db
    .select()
    .from(invitations)
    .where(
      and(eq(invitations.email, email), eq(invitations.status, "pending"))
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllInvitations() {
  return await db
    .select()
    .from(invitations)
    .orderBy(desc(invitations.createdAt));
}

export async function updateInvitationStatus(
  id: number,
  status: "pending" | "accepted" | "expired",
  acceptedBy?: number
) {
  const updates: Partial<InsertInvitation> = { status };
  if (acceptedBy) {
    updates.acceptedBy = acceptedBy;
    updates.acceptedAt = new Date();
  }

  await db.update(invitations).set(updates).where(eq(invitations.id, id));
  return await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, id))
    .limit(1);
}

export async function deleteInvitation(id: number) {
  await db.delete(invitations).where(eq(invitations.id, id));
  return true;
}

// ============ Allowed Domain Functions ============

export async function getAllowedDomains() {
  return await db
    .select()
    .from(allowedDomains)
    .orderBy(asc(allowedDomains.domain));
}

export async function getActiveAllowedDomains() {
  return await db
    .select()
    .from(allowedDomains)
    .where(eq(allowedDomains.isActive, true))
    .orderBy(asc(allowedDomains.domain));
}

export async function createAllowedDomain(
  domain: Omit<InsertAllowedDomain, "id" | "createdAt" | "updatedAt">
) {
  const result = await db
    .insert(allowedDomains)
    .values(domain)
    .returning();
  return result[0];
}

export async function updateAllowedDomain(
  id: number,
  updates: Partial<InsertAllowedDomain>
) {
  await db
    .update(allowedDomains)
    .set(updates)
    .where(eq(allowedDomains.id, id));
  return await db
    .select()
    .from(allowedDomains)
    .where(eq(allowedDomains.id, id))
    .limit(1);
}

export async function deleteAllowedDomain(id: number) {
  await db.delete(allowedDomains).where(eq(allowedDomains.id, id));
  return true;
}

export async function isEmailDomainAllowed(email: string): Promise<boolean> {
  // Check if domain restriction is enabled
  const settingResult = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "domainRestrictionEnabled"))
    .limit(1);

  const isEnabled =
    settingResult.length > 0 && settingResult[0].value === "true";

  // If restriction is disabled, allow all emails
  if (!isEnabled) return true;

  // Extract domain from email
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  // Check if domain is in allowed list
  const activeDomains = await getActiveAllowedDomains();
  return activeDomains.some((d) => d.domain.toLowerCase() === domain);
}

// ============ Settings Functions ============

export async function getSetting(key: string) {
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllSettings() {
  return await db.select().from(settings);
}

export async function upsertSetting(
  key: string,
  value: string,
  updatedBy?: number
) {
  // PostgreSQL upsert
  const existing = await getSetting(key);
  if (existing) {
    await db
      .update(settings)
      .set({ value, updatedBy })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value, updatedBy });
  }
  return await getSetting(key);
}
