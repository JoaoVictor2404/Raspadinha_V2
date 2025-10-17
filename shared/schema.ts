import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["deposit", "withdrawal", "purchase", "prize", "bonus", "commission"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "cancelled"]);
export const categoryEnum = pgEnum("category", ["gold-rush", "lucky-animals", "vegas-lights", "mythic-gods", "crypto-scratch", "candy-mania"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["pending", "processing", "shipped", "delivered", "cancelled"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Raspadinhas (scratch cards) table
export const raspadinhas = pgTable("raspadinhas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: categoryEnum("category").notNull().default("gold-rush"),
  maxPrize: decimal("max_prize", { precision: 10, scale: 2 }).notNull(),
  badge: text("badge"), // "+Chance", "Recomendado", etc.
  isActive: boolean("is_active").default(true).notNull(),
  stock: integer("stock").default(1000).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prize tiers for each raspadinha
export const prizes = pgTable("prizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raspadinhaId: varchar("raspadinha_id").references(() => raspadinhas.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  label: text("label").notNull(), // "2 Mil Reais", "Mil Reais", etc.
  probability: decimal("probability", { precision: 5, scale: 4 }).notNull(), // 0.0001 = 0.01%
  imageUrl: text("image_url"),
});

// User wallet/balance
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  balanceTotal: decimal("balance_total", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceStandard: decimal("balance_standard", { precision: 10, scale: 2 }).default("0").notNull(),
  balancePrizes: decimal("balance_prizes", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceBonus: decimal("balance_bonus", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions (deposits, withdrawals, purchases, prizes)
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  pixCode: text("pix_code"), // For deposits
  affiliateId: varchar("affiliate_id").references(() => affiliates.id), // For commission tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Purchase history
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  raspadinhaId: varchar("raspadinha_id").references(() => raspadinhas.id).notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  prizeWon: decimal("prize_won", { precision: 10, scale: 2 }),
  prizeLabel: text("prize_label"),
  isRevealed: boolean("is_revealed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bonuses
export const bonuses = pgTable("bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // "deposit_bonus", "referral_bonus", etc.
  status: text("status").default("pending").notNull(), // "pending", "active", "claimed"
  description: text("description"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Affiliate/Referral system
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  totalReferrals: integer("total_referrals").default(0).notNull(),
  activeReferrals: integer("active_referrals").default(0).notNull(),
  commissionBalance: decimal("commission_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Referral tracking
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").references(() => affiliates.id).notNull(),
  referredUserId: varchar("referred_user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Commissions tracking
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").references(() => affiliates.id).notNull(),
  referralId: varchar("referral_id").references(() => referrals.id).notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(), // e.g. 10.00 = 10%
  isPaid: boolean("is_paid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deliveries (for physical prizes)
export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  purchaseId: varchar("purchase_id").references(() => purchases.id).notNull(),
  status: deliveryStatusEnum("status").default("pending").notNull(),
  address: text("address"),
  trackingCode: text("tracking_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  transactions: many(transactions),
  purchases: many(purchases),
  bonuses: many(bonuses),
  affiliate: one(affiliates, {
    fields: [users.id],
    references: [affiliates.userId],
  }),
}));

export const raspadinhasRelations = relations(raspadinhas, ({ many }) => ({
  prizes: many(prizes),
  purchases: many(purchases),
}));

export const prizesRelations = relations(prizes, ({ one }) => ({
  raspadinha: one(raspadinhas, {
    fields: [prizes.raspadinhaId],
    references: [raspadinhas.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  raspadinha: one(raspadinhas, {
    fields: [purchases.raspadinhaId],
    references: [raspadinhas.id],
  }),
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id],
  }),
  referrals: many(referrals),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRaspadinhaSchema = createInsertSchema(raspadinhas).omit({
  id: true,
  createdAt: true,
});

export const insertPrizeSchema = createInsertSchema(prizes).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertBonusSchema = createInsertSchema(bonuses).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Raspadinha = typeof raspadinhas.$inferSelect;
export type InsertRaspadinha = z.infer<typeof insertRaspadinhaSchema>;

export type Prize = typeof prizes.$inferSelect;
export type InsertPrize = z.infer<typeof insertPrizeSchema>;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type Bonus = typeof bonuses.$inferSelect;
export type InsertBonus = z.infer<typeof insertBonusSchema>;

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
