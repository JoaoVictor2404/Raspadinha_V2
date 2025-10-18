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
  deposits,
  withdrawals,
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
  type Deposit,
  type InsertDeposit,
  type Withdrawal,
  type InsertWithdrawal,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import { randomUUID } from "crypto";
import type { Store } from "express-session";
import MySQLStoreFactory from "express-mysql-session";

const MySQLStore = MySQLStoreFactory(session as any);

// Helper function to generate UUIDs
function generateId(): string {
  return randomUUID();
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCPF(cpf: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
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

  // Deposit methods
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;
  getDeposit(id: string): Promise<Deposit | undefined>;
  getDepositsByUser(userId: string): Promise<Deposit[]>;
  updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit>;

  // Withdrawal methods
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawal(id: string): Promise<Withdrawal | undefined>;
  getWithdrawalsByUser(userId: string): Promise<Withdrawal[]>;
  updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal>;

  // Session store
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new MySQLStore({}, pool as any);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByCPF(cpf: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cpf, cpf));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userId = generateId();
    const user = {
      id: userId,
      ...insertUser,
      createdAt: new Date(),
    };
    
    await db.insert(users).values(user);
    
    // Auto-create wallet for new user
    await db.insert(wallets).values({
      id: generateId(),
      userId: user.id,
      balanceTotal: "0",
      balanceStandard: "0",
      balancePrizes: "0",
      balanceBonus: "0",
      pendingWithdrawal: "0",
      updatedAt: new Date(),
    });

    // Auto-create affiliate record
    const referralCode = user.username.toLowerCase().replace(/\s+/g, '-');
    await db.insert(affiliates).values({
      id: generateId(),
      userId: user.id,
      referralCode,
      totalReferrals: 0,
      activeReferrals: 0,
      commissionBalance: "0",
      commissionPercentage: "10.00",
      createdAt: new Date(),
    });

    return user;
  }

  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet || undefined;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const wallet = {
      id: generateId(),
      balanceTotal: "0",
      balanceStandard: "0",
      balancePrizes: "0",
      balanceBonus: "0",
      pendingWithdrawal: "0",
      ...insertWallet,
      updatedAt: new Date(),
    };
    await db.insert(wallets).values(wallet);
    return wallet as Wallet;
  }

  async updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet> {
    // Ensure pendingWithdrawal has a default value
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      pendingWithdrawal: updates.pendingWithdrawal ?? "0",
    };
    
    await db
      .update(wallets)
      .set(updateData)
      .where(eq(wallets.userId, userId));
    
    const wallet = await this.getWallet(userId);
    return wallet!;
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
    const transaction = {
      id: generateId(),
      status: "pending" as const,
      description: null,
      pixCode: null,
      affiliateId: null,
      ...insertTransaction,
      createdAt: new Date(),
    };
    await db.insert(transactions).values(transaction);
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
    await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id));
    
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const purchase = {
      id: generateId(),
      transactionId: null,
      prizeWon: null,
      prizeLabel: null,
      isRevealed: false,
      ...insertPurchase,
      createdAt: new Date(),
    };
    await db.insert(purchases).values(purchase);
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
    await db
      .update(purchases)
      .set(updates)
      .where(eq(purchases.id, id));
    
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
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
    const affiliate = {
      id: generateId(),
      totalReferrals: 0,
      activeReferrals: 0,
      commissionBalance: "0",
      commissionPercentage: "10.00",
      ...insertAffiliate,
      createdAt: new Date(),
    };
    await db.insert(affiliates).values(affiliate);
    return affiliate;
  }

  async updateAffiliate(affiliateId: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    await db
      .update(affiliates)
      .set(updates)
      .where(eq(affiliates.id, affiliateId));
    
    const affiliate = await this.getAffiliateById(affiliateId);
    return affiliate!;
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const referral = {
      id: generateId(),
      isActive: true,
      ...insertReferral,
      createdAt: new Date(),
    };
    await db.insert(referrals).values(referral);
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
    await db
      .update(referrals)
      .set(updates)
      .where(eq(referrals.id, id));
    
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral;
  }

  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const commission = {
      id: generateId(),
      isPaid: false,
      ...insertCommission,
      createdAt: new Date(),
    };
    await db.insert(commissions).values(commission);
    return commission;
  }

  async getCommissionsByAffiliate(affiliateId: string): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.affiliateId, affiliateId)).orderBy(desc(commissions.createdAt));
  }

  async getBonusesByUser(userId: string): Promise<Bonus[]> {
    return db.select().from(bonuses).where(eq(bonuses.userId, userId)).orderBy(desc(bonuses.createdAt));
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const deposit = {
      id: generateId(),
      status: insertDeposit.status || "pending",
      ...insertDeposit,
      createdAt: new Date(),
    };
    await db.insert(deposits).values(deposit as any);
    return deposit as Deposit;
  }

  async getDeposit(id: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit || undefined;
  }

  async getDepositsByUser(userId: string): Promise<Deposit[]> {
    return db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit> {
    await db
      .update(deposits)
      .set(updates)
      .where(eq(deposits.id, id));
    
    const deposit = await this.getDeposit(id);
    return deposit!;
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const withdrawal = {
      id: generateId(),
      status: insertWithdrawal.status || "pending",
      ...insertWithdrawal,
      createdAt: new Date(),
    };
    await db.insert(withdrawals).values(withdrawal as any);
    return withdrawal as Withdrawal;
  }

  async getWithdrawal(id: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return withdrawal || undefined;
  }

  async getWithdrawalsByUser(userId: string): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal> {
    await db
      .update(withdrawals)
      .set(updates)
      .where(eq(withdrawals.id, id));
    
    const withdrawal = await this.getWithdrawal(id);
    return withdrawal!;
  }

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  // Users
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Transactions
  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  // Deposits
  async getAllDeposits(): Promise<Deposit[]> {
    return db.select().from(deposits).orderBy(desc(deposits.createdAt));
  }

  // Withdrawals
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  }

  // Affiliates
  async getAllAffiliates(): Promise<Affiliate[]> {
    return db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
  }

  // Commissions
  async getAllCommissions(): Promise<Commission[]> {
    return db.select().from(commissions).orderBy(desc(commissions.createdAt));
  }

  async updateCommission(id: string, updates: Partial<Commission>): Promise<Commission> {
    await db.update(commissions).set(updates).where(eq(commissions.id, id));
    const [commission] = await db.select().from(commissions).where(eq(commissions.id, id));
    return commission!;
  }

  // Raspadinhas
  async createRaspadinha(insertRaspadinha: InsertRaspadinha): Promise<Raspadinha> {
    const raspadinha = {
      id: generateId(),
      ...insertRaspadinha,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(raspadinhas).values(raspadinha as any);
    return raspadinha as Raspadinha;
  }

  async updateRaspadinha(id: string, updates: Partial<Raspadinha>): Promise<Raspadinha> {
    await db.update(raspadinhas).set(updates).where(eq(raspadinhas.id, id));
    const [raspadinha] = await db.select().from(raspadinhas).where(eq(raspadinhas.id, id));
    return raspadinha!;
  }

  async deleteRaspadinha(id: string): Promise<void> {
    await db.delete(raspadinhas).where(eq(raspadinhas.id, id));
  }

  // Prizes
  async createPrize(insertPrize: any): Promise<Prize> {
    const prize = {
      id: generateId(),
      ...insertPrize,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(prizes).values(prize as any);
    return prize as Prize;
  }

  async updatePrize(id: string, updates: Partial<Prize>): Promise<Prize> {
    await db.update(prizes).set(updates).where(eq(prizes.id, id));
    const [prize] = await db.select().from(prizes).where(eq(prizes.id, id));
    return prize!;
  }

  async deletePrize(id: string): Promise<void> {
    await db.delete(prizes).where(eq(prizes.id, id));
  }
}

export const storage = new DatabaseStorage();
