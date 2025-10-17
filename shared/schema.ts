import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
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
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Raspadinhas (scratch cards) table
export const raspadinhas = pgTable("raspadinhas", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: categoryEnum("category").notNull().default("gold-rush"),
  maxPrize: numeric("max_prize", { precision: 10, scale: 2 }).notNull(),
  badge: varchar("badge", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  stock: integer("stock").default(1000).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prize tiers for each raspadinha
export const prizes = pgTable("prizes", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  raspadinhaId: varchar("raspadinha_id", { length: 36 }).references(() => raspadinhas.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  probability: numeric("probability", { precision: 5, scale: 4 }).notNull(), // 0.0001 = 0.01%
  imageUrl: text("image_url"),
});

// User wallet/balance
export const wallets = pgTable("wallets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull().unique(),
  balanceTotal: numeric("balance_total", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceStandard: numeric("balance_standard", { precision: 10, scale: 2 }).default("0").notNull(),
  balancePrizes: numeric("balance_prizes", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceBonus: numeric("balance_bonus", { precision: 10, scale: 2 }).default("0").notNull(),
  pendingWithdrawal: numeric("pending_withdrawal", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions (deposits, withdrawals, purchases, prizes)
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  pixCode: text("pix_code"),
  affiliateId: varchar("affiliate_id", { length: 36 }).references(() => affiliates.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Purchase history
export const purchases = pgTable("purchases", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  raspadinhaId: varchar("raspadinha_id", { length: 36 }).references(() => raspadinhas.id).notNull(),
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id),
  prizeWon: numeric("prize_won", { precision: 10, scale: 2 }),
  prizeLabel: varchar("prize_label", { length: 255 }),
  isRevealed: boolean("is_revealed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bonuses
export const bonuses = pgTable("bonuses", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending").notNull(),
  description: text("description"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Affiliate/Referral system
export const affiliates = pgTable("affiliates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  totalReferrals: integer("total_referrals").default(0).notNull(),
  activeReferrals: integer("active_referrals").default(0).notNull(),
  commissionBalance: numeric("commission_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Referral tracking
export const referrals = pgTable("referrals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id", { length: 36 }).references(() => affiliates.id).notNull(),
  referredUserId: varchar("referred_user_id", { length: 36 }).references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Commissions tracking
export const commissions = pgTable("commissions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id", { length: 36 }).references(() => affiliates.id).notNull(),
  referralId: varchar("referral_id", { length: 36 }).references(() => referrals.id).notNull(),
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deliveries
export const deliveries = pgTable("deliveries", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  purchaseId: varchar("purchase_id", { length: 36 }).references(() => purchases.id).notNull(),
  prizeAmount: numeric("prize_amount", { precision: 10, scale: 2 }).notNull(),
  prizeLabel: varchar("prize_label", { length: 255 }).notNull(),
  status: deliveryStatusEnum("status").default("pending").notNull(),
  trackingCode: varchar("tracking_code", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PIX Deposits
export const deposits = pgTable("deposits", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  pixKeyType: varchar("pix_key_type", { length: 50 }).notNull(),
  pixKey: text("pix_key").notNull(),
  qrCode: text("qr_code"),
  qrCodeBase64: text("qr_code_base64"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  externalId: varchar("external_id", { length: 255 }),
  description: text("description"),
  paidAt: timestamp("paid_at"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PIX Withdrawals
export const withdrawals = pgTable("withdrawals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  pixKeyType: varchar("pix_key_type", { length: 50 }).notNull(),
  pixKey: text("pix_key").notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  externalId: varchar("external_id", { length: 255 }),
  description: text("description"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  deposits: many(deposits),
  withdrawals: many(withdrawals),
}));

export const raspadinhasRelations = relations(raspadinhas, ({ many }) => ({
  prizes: many(prizes),
  purchases: many(purchases),
}));

export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id],
  }),
  referrals: many(referrals),
  commissions: many(commissions),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  affiliate: one(affiliates, {
    fields: [referrals.affiliateId],
    references: [affiliates.id],
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
  }),
  commissions: many(commissions),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Raspadinha = typeof raspadinhas.$inferSelect;
export type InsertRaspadinha = z.infer<typeof insertRaspadinhaSchema>;

export type Prize = typeof prizes.$inferSelect;
export type InsertPrize = z.infer<typeof insertPrizeSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export type Bonus = typeof bonuses.$inferSelect;
export type InsertBonus = z.infer<typeof insertBonusSchema>;

export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  updatedAt: true,
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

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertCommissionSchema = createInsertSchema(commissions).omit({
  id: true,
  createdAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
});
