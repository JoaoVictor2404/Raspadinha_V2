import { sql } from "drizzle-orm";
import { mysqlTable, text, varchar, decimal, datetime, int, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  birthDate: datetime("birth_date").notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Raspadinhas (scratch cards) table
export const raspadinhas = mysqlTable("raspadinhas", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: mysqlEnum("category", ["gold-rush", "lucky-animals", "vegas-lights", "mythic-gods", "crypto-scratch", "candy-mania"]).notNull().default("gold-rush"),
  maxPrize: decimal("max_prize", { precision: 10, scale: 2 }).notNull(),
  badge: varchar("badge", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  stock: int("stock").default(1000).notNull(),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Prize tiers for each raspadinha
export const prizes = mysqlTable("prizes", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  raspadinhaId: varchar("raspadinha_id", { length: 36 }).references(() => raspadinhas.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  probability: decimal("probability", { precision: 5, scale: 4 }).notNull(),
  imageUrl: text("image_url"),
});

// User wallet/balance
export const wallets = mysqlTable("wallets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull().unique(),
  balanceTotal: decimal("balance_total", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceStandard: decimal("balance_standard", { precision: 10, scale: 2 }).default("0").notNull(),
  balancePrizes: decimal("balance_prizes", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceBonus: decimal("balance_bonus", { precision: 10, scale: 2 }).default("0").notNull(),
  pendingWithdrawal: decimal("pending_withdrawal", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
});

// Transactions (deposits, withdrawals, purchases, prizes)
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "purchase", "prize", "bonus", "commission"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  pixCode: text("pix_code"),
  affiliateId: varchar("affiliate_id", { length: 36 }).references(() => affiliates.id),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Purchase history
export const purchases = mysqlTable("purchases", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  raspadinhaId: varchar("raspadinha_id", { length: 36 }).references(() => raspadinhas.id).notNull(),
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id),
  prizeWon: decimal("prize_won", { precision: 10, scale: 2 }),
  prizeLabel: varchar("prize_label", { length: 255 }),
  isRevealed: boolean("is_revealed").default(false).notNull(),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Bonuses
export const bonuses = mysqlTable("bonuses", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).default("pending").notNull(),
  description: text("description"),
  expiresAt: datetime("expires_at"),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Affiliate/Referral system
export const affiliates = mysqlTable("affiliates", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  totalReferrals: int("total_referrals").default(0).notNull(),
  activeReferrals: int("active_referrals").default(0).notNull(),
  commissionBalance: decimal("commission_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("10.00").notNull(),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Referral tracking
export const referrals = mysqlTable("referrals", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateId: varchar("affiliate_id", { length: 36 }).references(() => affiliates.id).notNull(),
  referredUserId: varchar("referred_user_id", { length: 36 }).references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Commissions tracking
export const commissions = mysqlTable("commissions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateId: varchar("affiliate_id", { length: 36 }).references(() => affiliates.id).notNull(),
  referralId: varchar("referral_id", { length: 36 }).references(() => referrals.id).notNull(),
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// Deliveries
export const deliveries = mysqlTable("deliveries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  purchaseId: varchar("purchase_id", { length: 36 }).references(() => purchases.id).notNull(),
  prizeAmount: decimal("prize_amount", { precision: 10, scale: 2 }).notNull(),
  prizeLabel: varchar("prize_label", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  trackingCode: varchar("tracking_code", { length: 255 }),
  address: text("address"),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: datetime("updated_at").notNull().$defaultFn(() => new Date()),
});

// PIX Deposits
export const deposits = mysqlTable("deposits", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  pixKeyType: varchar("pix_key_type", { length: 50 }).notNull(),
  pixKey: text("pix_key").notNull(),
  qrCode: text("qr_code"),
  qrCodeBase64: text("qr_code_base64"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  externalId: varchar("external_id", { length: 255 }),
  description: text("description"),
  paidAt: datetime("paid_at"),
  completedAt: datetime("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
});

// PIX Withdrawals
export const withdrawals = mysqlTable("withdrawals", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  pixKeyType: varchar("pix_key_type", { length: 50 }).notNull(),
  pixKey: text("pix_key").notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  externalId: varchar("external_id", { length: 255 }),
  description: text("description"),
  completedAt: datetime("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: datetime("created_at").notNull().$defaultFn(() => new Date()),
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
