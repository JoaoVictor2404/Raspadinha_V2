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
import MySQLStoreFactory from "express-mysql-session";
import crypto from "node:crypto";

const MySQLStore = MySQLStoreFactory(session);

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
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Usa o pool do mysql2 já criado em ./db
    this.sessionStore = new MySQLStore(
      {
        createDatabaseTable: true,
        schema: {
          tableName: "sessions",
          columnNames: {
            session_id: "session_id",
            expires: "expires",
            data: "data",
          },
        },
      },
      pool as any
    );
  }

  // ------- Users -------
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
    }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = (insertUser as any).id ?? crypto.randomUUID();
    await db.insert(users).values({ ...(insertUser as any), id });
    // Auto-create wallet
    await db.insert(wallets).values({
      userId: id,
      balanceTotal: "0.00" as any,
      balanceStandard: "0.00" as any,
      balancePrizes: "0.00" as any,
      balanceBonus: "0.00" as any,
    } as any);
    // Auto-create affiliate record
    const referralCode =
      (insertUser as any).username?.toLowerCase?.().replace(/\s+/g, "-") ??
      `ref-${id.slice(0, 8)}`;
    await db.insert(affiliates).values({
      userId: id,
      referralCode,
      totalReferrals: 0,
      activeReferrals: 0,
      commissionBalance: "0.00" as any,
    } as any);

    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user!;
  }

  // ------- Wallets -------
  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet || undefined;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = (insertWallet as any).id ?? crypto.randomUUID();
    await db.insert(wallets).values({ ...(insertWallet as any), id });
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id as any, id as any));
    return wallet!;
  }

  async updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet> {
    await db
      .update(wallets)
      .set({ ...(updates as any), updatedAt: new Date() as any })
      .where(eq(wallets.userId, userId));
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet!;
  }

  // ------- Raspadinhas & Prizes -------
  async getRaspadinhas(category?: string): Promise<Raspadinha[]> {
    if (category && category !== "destaque") {
      return db
        .select()
        .from(raspadinhas)
        .where(and(eq(raspadinhas.category as any, category as any), eq(raspadinhas.isActive as any, 1 as any)));
    }
    return db.select().from(raspadinhas).where(eq(raspadinhas.isActive as any, 1 as any));
  }

  async getRaspadinhaBySlug(slug: string): Promise<Raspadinha | undefined> {
    const [raspadinha] = await db.select().from(raspadinhas).where(eq(raspadinhas.slug, slug));
    return raspadinha || undefined;
  }

  async getPrizesByRaspadinhaId(raspadinhaId: string): Promise<Prize[]> {
    return db.select().from(prizes).where(eq(prizes.raspadinhaId, raspadinhaId));
  }

  // ------- Transactions -------
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = (insertTransaction as any).id ?? crypto.randomUUID();
    await db.insert(transactions).values({ ...(insertTransaction as any), id });
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx!;
  }

  async getTransactionsByUser(userId: string, type?: string): Promise<Transaction[]> {
    if (type && type !== "all") {
      return db
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.type as any, type as any)))
        .orderBy(desc(transactions.createdAt));
    }
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await db.update(transactions).set(updates as any).where(eq(transactions.id, id));
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx!;
  }

  // ------- Purchases -------
  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = (insertPurchase as any).id ?? crypto.randomUUID();
    await db.insert(purchases).values({ ...(insertPurchase as any), id });
    const [p] = await db.select().from(purchases).where(eq(purchases.id, id));
    return p!;
  }

  async getPurchasesByUser(userId: string): Promise<any[]> {
    // Requer relations configuradas no schema (db.query.*)
    // with: { raspadinha: true } deve existir via relations()
    return db.query.purchases.findMany({
      where: eq(purchases.userId, userId),
      with: { raspadinha: true },
      orderBy: desc(purchases.createdAt),
    } as any);
  }

  async getPurchaseById(id: string): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase || undefined;
  }

  async updatePurchase(id: string, updates: Partial<Purchase>): Promise<Purchase> {
    await db.update(purchases).set(updates as any).where(eq(purchases.id, id));
    const [p] = await db.select().from(purchases).where(eq(purchases.id, id));
    return p!;
  }

  // ------- Affiliates -------
  async getAffiliate(userId: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, userId));
    return affiliate || undefined;
  }

  async getAffiliateById(id: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, id));
    return affiliate || undefined;
  }

  async getAffiliateByCode(code: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.referralCode, code));
    return affiliate || undefined;
  }

  async createAffiliate(insertAffiliate: InsertAffiliate): Promise<Affiliate> {
    const id = (insertAffiliate as any).id ?? crypto.randomUUID();
    await db.insert(affiliates).values({ ...(insertAffiliate as any), id });
    const [a] = await db.select().from(affiliates).where(eq(affiliates.id, id));
    return a!;
  }

  async updateAffiliate(affiliateId: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    await db.update(affiliates).set(updates as any).where(eq(affiliates.id, affiliateId));
    const [a] = await db.select().from(affiliates).where(eq(affiliates.id, affiliateId));
    return a!;
  }

  // ------- Referrals -------
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = (insertReferral as any).id ?? crypto.randomUUID();
    await db.insert(referrals).values({ ...(insertReferral as any), id });
    const [r] = await db.select().from(referrals).where(eq(referrals.id, id));
    return r!;
  }

  async getReferralByUserId(userId: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredUserId, userId));
    return referral || undefined;
  }

  async getReferralsByAffiliate(affiliateId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.affiliateId, affiliateId));
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral> {
    await db.update(referrals).set(updates as any).where(eq(referrals.id, id));
    const [r] = await db.select().from(referrals).where(eq(referrals.id, id));
    return r!;
  }

  // ------- Commissions -------
  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const id = (insertCommission as any).id ?? crypto.randomUUID();
    await db.insert(commissions).values({ ...(insertCommission as any), id });
    const [c] = await db.select().from(commissions).where(eq(commissions.id, id));
    return c!;
  }

  async getCommissionsByAffiliate(affiliateId: string): Promise<Commission[]> {
    return db
      .select()
      .from(commissions)
      .where(eq(commissions.affiliateId, affiliateId))
      .orderBy(desc(commissions.createdAt));
  }

  // ------- Bonuses -------
  async getBonusesByUser(userId: string): Promise<Bonus[]> {
    return db
      .select()
      .from(bonuses)
      .where(eq(bonuses.userId, userId))
      .orderBy(desc(bonuses.createdAt));
  }
}

export const storage = new DatabaseStorage();
