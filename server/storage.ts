// Blueprint: javascript_database + javascript_auth_all_persistance
import {
  users,
  wallets,
  raspadinhas,
  prizes,
  transactions,
  purchases,
  bonuses,
  affiliates,
  deliveries,
  referrals,
  commissions,
  type User,
  type InsertUser,
  type Wallet,
  type InsertWallet,
  type Raspadinha,
  type InsertRaspadinha,
  type Prize,
  type Transaction,
  type InsertTransaction,
  type Purchase,
  type InsertPurchase,
  type Bonus,
  type Affiliate,
  type InsertAffiliate,
  type Referral,
  type InsertReferral,
  type Commission,
  type InsertCommission,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Wallet methods
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet>;

  // Raspadinha methods
  getRaspadinhas(category?: string): Promise<Raspadinha[]>;
  getRaspadinhaBySlug(slug: string): Promise<Raspadinha | undefined>;
  getPrizesByRaspadinhaId(raspadinhaId: string): Promise<Prize[]>;

  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: string, type?: string): Promise<Transaction[]>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>;

  // Purchase methods
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchasesByUser(userId: string): Promise<any[]>; // Returns purchases with raspadinha data
  getPurchaseById(id: string): Promise<Purchase | undefined>;
  updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase>;

  // Affiliate methods
  getAffiliate(userId: string): Promise<Affiliate | undefined>;
  getAffiliateById(id: string): Promise<Affiliate | undefined>;
  getAffiliateByCode(code: string): Promise<Affiliate | undefined>;
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  updateAffiliate(affiliateId: string, updates: Partial<Affiliate>): Promise<Affiliate>;
  
  // Referral methods
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralByUserId(userId: string): Promise<Referral | undefined>;
  getReferralsByAffiliate(affiliateId: string): Promise<Referral[]>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral>;
  
  // Commission methods
  createCommission(commission: InsertCommission): Promise<Commission>;
  getCommissionsByAffiliate(affiliateId: string): Promise<Commission[]>;

  // Bonus methods
  getBonusesByUser(userId: string): Promise<Bonus[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Auto-create wallet for new user
    await db.insert(wallets).values({
      userId: user.id,
      balanceTotal: "0",
      balanceStandard: "0",
      balancePrizes: "0",
      balanceBonus: "0",
    });

    // Auto-create affiliate record
    const referralCode = user.username.toLowerCase().replace(/\s+/g, '-');
    await db.insert(affiliates).values({
      userId: user.id,
      referralCode,
      totalReferrals: 0,
      activeReferrals: 0,
      commissionBalance: "0",
    });

    return user;
  }

  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet || undefined;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db.insert(wallets).values(insertWallet).returning();
    return wallet;
  }

  async updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet> {
    const [wallet] = await db
      .update(wallets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wallets.userId, userId))
      .returning();
    return wallet;
  }

  async getRaspadinhas(category?: string): Promise<Raspadinha[]> {
    if (category && category !== 'destaque') {
      return db.select().from(raspadinhas).where(
        and(
          eq(raspadinhas.category, category as any),
          eq(raspadinhas.isActive, true)
        )
      );
    }
    return db.select().from(raspadinhas).where(eq(raspadinhas.isActive, true));
  }

  async getRaspadinhaBySlug(slug: string): Promise<Raspadinha | undefined> {
    const [raspadinha] = await db.select().from(raspadinhas).where(eq(raspadinhas.slug, slug));
    return raspadinha || undefined;
  }

  async getPrizesByRaspadinhaId(raspadinhaId: string): Promise<Prize[]> {
    return db.select().from(prizes).where(eq(prizes.raspadinhaId, raspadinhaId));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getTransactionsByUser(userId: string, type?: string): Promise<Transaction[]> {
    if (type && type !== 'all') {
      return db.select().from(transactions).where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, type as any)
        )
      ).orderBy(desc(transactions.createdAt));
    }
    return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values(insertPurchase).returning();
    return purchase;
  }

  async getPurchasesByUser(userId: string): Promise<any[]> {
    return db.query.purchases.findMany({
      where: eq(purchases.userId, userId),
      with: {
        raspadinha: true,
      },
      orderBy: desc(purchases.createdAt),
    });
  }

  async getPurchaseById(id: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase || undefined;
  }

  async updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase> {
    const [purchase] = await db
      .update(purchases)
      .set(updates)
      .where(eq(purchases.id, id))
      .returning();
    return purchase;
  }

  async getAffiliate(userId: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, userId));
    return affiliate || undefined;
  }

  async getAffiliateById(id: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, id));
    return affiliate || undefined;
  }

  async getAffiliateByCode(code: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.referralCode, code));
    return affiliate || undefined;
  }

  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    const [affiliate] = await db.insert(affiliates).values(insertAffiliate).returning();
    return affiliate;
  }

  async updateAffiliate(affiliateId: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    const [affiliate] = await db
      .update(affiliates)
      .set(updates)
      .where(eq(affiliates.id, affiliateId))
      .returning();
    return affiliate;
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(insertReferral).returning();
    return referral;
  }

  async getReferralByUserId(userId: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referredUserId, userId));
    return referral || undefined;
  }

  async getReferralsByAffiliate(affiliateId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.affiliateId, affiliateId));
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral> {
    const [referral] = await db
      .update(referrals)
      .set(updates)
      .where(eq(referrals.id, id))
      .returning();
    return referral;
  }

  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const [commission] = await db.insert(commissions).values(insertCommission).returning();
    return commission;
  }

  async getCommissionsByAffiliate(affiliateId: string): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.affiliateId, affiliateId)).orderBy(desc(commissions.createdAt));
  }

  async getBonusesByUser(userId: string): Promise<Bonus[]> {
    return db.select().from(bonuses).where(eq(bonuses.userId, userId)).orderBy(desc(bonuses.createdAt));
  }
}

export const storage = new DatabaseStorage();
