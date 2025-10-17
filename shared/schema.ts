// shared/schema.ts
import {
  mysqlTable,
  varchar,
  text,
  decimal,
  int,
  tinyint,
  mysqlEnum,
  timestamp,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ---- Enum values (const) ----
export const CATEGORY = [
  "gold-rush",
  "lucky-animals",
  "vegas-lights",
  "mythic-gods",
  "crypto-scratch",
  "candy-mania",
] as const;

export const TX_TYPE = [
  "deposit",
  "withdrawal",
  "purchase",
  "prize",
  "bonus",
  "commission",
] as const;

export const TX_STATUS = ["pending", "completed", "failed", "cancelled"] as const;

export const DELIVERY_STATUS = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// ---- Tabelas ----
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const affiliates = mysqlTable("affiliates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  totalReferrals: int("total_referrals").notNull().default(0),
  activeReferrals: int("active_referrals").notNull().default(0),
  commissionBalance: decimal("commission_balance", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const raspadinhas = mysqlTable("raspadinhas", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: mysqlEnum("category", CATEGORY).notNull().default("gold-rush"),
  maxPrize: decimal("max_prize", { precision: 10, scale: 2 }).notNull(),
  badge: varchar("badge", { length: 255 }),
  isActive: tinyint("is_active").notNull().default(1),
  stock: int("stock").notNull().default(1000),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const prizes = mysqlTable("prizes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  raspadinhaId: varchar("raspadinha_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  probability: decimal("probability", { precision: 5, scale: 4 }).notNull(),
  imageUrl: text("image_url"),
});

export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  type: mysqlEnum("type", TX_TYPE).notNull(),
  status: mysqlEnum("status", TX_STATUS).notNull().default("pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  pixCode: text("pix_code"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  affiliateId: varchar("affiliate_id", { length: 36 }),
});

export const purchases = mysqlTable("purchases", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  raspadinhaId: varchar("raspadinha_id", { length: 36 }).notNull(),
  transactionId: varchar("transaction_id", { length: 36 }),
  prizeWon: decimal("prize_won", { precision: 10, scale: 2 }),
  prizeLabel: varchar("prize_label", { length: 255 }),
  isRevealed: tinyint("is_revealed").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const deliveries = mysqlTable("deliveries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  purchaseId: varchar("purchase_id", { length: 36 }).notNull(),
  status: mysqlEnum("status", DELIVERY_STATUS).notNull().default("pending"),
  address: text("address"),
  trackingCode: text("tracking_code"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
});

export const referrals = mysqlTable("referrals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  affiliateId: varchar("affiliate_id", { length: 36 }).notNull(),
  referredUserId: varchar("referred_user_id", { length: 36 }).notNull(),
  isActive: tinyint("is_active").notNull().default(1),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const commissions = mysqlTable("commissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  affiliateId: varchar("affiliate_id", { length: 36 }).notNull(),
  referralId: varchar("referral_id", { length: 36 }).notNull(),
  transactionId: varchar("transaction_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  isPaid: tinyint("is_paid").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const wallets = mysqlTable("wallets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  balanceTotal: decimal("balance_total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  balanceStandard: decimal("balance_standard", { precision: 10, scale: 2 }).notNull().default("0.00"),
  balancePrizes: decimal("balance_prizes", { precision: 10, scale: 2 }).notNull().default("0.00"),
  balanceBonus: decimal("balance_bonus", { precision: 10, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
});

export const bonuses = mysqlTable("bonuses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  description: text("description"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---- Relations (para db.query.* with: {...}) ----
export const raspadinhasRelations = relations(raspadinhas, ({ many }) => ({
  prizes: many(prizes),
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  raspadinha: one(raspadinhas, {
    fields: [purchases.raspadinhaId],
    references: [raspadinhas.id],
  }),
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [purchases.transactionId],
    references: [transactions.id],
  }),
}));

// ---- Tipos inferidos ----
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

export type Raspadinha = typeof raspadinhas.$inferSelect;
export type InsertRaspadinha = typeof raspadinhas.$inferInsert;

export type Prize = typeof prizes.$inferSelect;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

export type Bonus = typeof bonuses.$inferSelect;
export type InsertBonus = typeof bonuses.$inferInsert;

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = typeof affiliates.$inferInsert;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = typeof commissions.$inferInsert;
