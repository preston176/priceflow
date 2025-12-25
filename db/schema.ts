import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const lists = pgTable("lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  budget: decimal("budget", { precision: 10, scale: 2 }).default("0"),
  isArchived: boolean("is_archived").default(false).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gifts = pgTable("gifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  listId: uuid("list_id").references(() => lists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url"),
  imageUrl: text("image_url"),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  recipientName: text("recipient_name").notNull(),
  isPurchased: boolean("is_purchased").default(false).notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  notes: text("notes"),
  priceTrackingEnabled: boolean("price_tracking_enabled").default(false).notNull(),
  priceAlertThreshold: decimal("price_alert_threshold", { precision: 10, scale: 2 }),
  lastPriceCheck: timestamp("last_price_check"),
  lowestPriceEver: decimal("lowest_price_ever", { precision: 10, scale: 2 }),
  highestPriceEver: decimal("highest_price_ever", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  giftId: uuid("gift_id")
    .notNull()
    .references(() => gifts.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  source: text("source"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export const shareTokens = pgTable("share_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listCollaborators = pgTable("list_collaborators", {
  id: uuid("id").primaryKey().defaultRandom(),
  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  lists: many(lists),
  gifts: many(gifts),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [lists.userId],
    references: [profiles.id],
  }),
  gifts: many(gifts),
  shareTokens: many(shareTokens),
}));

export const giftsRelations = relations(gifts, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [gifts.userId],
    references: [profiles.id],
  }),
  list: one(lists, {
    fields: [gifts.listId],
    references: [lists.id],
  }),
  priceHistory: many(priceHistory),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  gift: one(gifts, {
    fields: [priceHistory.giftId],
    references: [gifts.id],
  }),
}));

export const shareTokensRelations = relations(shareTokens, ({ one }) => ({
  list: one(lists, {
    fields: [shareTokens.listId],
    references: [lists.id],
  }),
}));

export const listCollaboratorsRelations = relations(listCollaborators, ({ one }) => ({
  list: one(lists, {
    fields: [listCollaborators.listId],
    references: [lists.id],
  }),
  inviter: one(profiles, {
    fields: [listCollaborators.invitedBy],
    references: [profiles.id],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;
export type Gift = typeof gifts.$inferSelect;
export type NewGift = typeof gifts.$inferInsert;
export type ShareToken = typeof shareTokens.$inferSelect;
export type NewShareToken = typeof shareTokens.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;
export type ListCollaborator = typeof listCollaborators.$inferSelect;
export type NewListCollaborator = typeof listCollaborators.$inferInsert;
