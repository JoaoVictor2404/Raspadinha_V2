import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { randomUUID } from "crypto";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (from blueprint)
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // ============================================================================
  // RASPADINHAS ROUTES
  // ============================================================================

  // Get raspadinhas by category
  app.get("/api/raspadinhas", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const raspadinhas = await storage.getRaspadinhas(category);
      res.json(raspadinhas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get raspadinha by slug
  app.get("/api/raspadinhas/:slug", async (req, res) => {
    try {
      const raspadinha = await storage.getRaspadinhaBySlug(req.params.slug);
      if (!raspadinha) {
        return res.status(404).json({ error: "Raspadinha not found" });
      }
      res.json(raspadinha);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get prizes for a raspadinha
  app.get("/api/raspadinhas/:slug/prizes", async (req, res) => {
    try {
      const raspadinha = await storage.getRaspadinhaBySlug(req.params.slug);
      if (!raspadinha) {
        return res.status(404).json({ error: "Raspadinha not found" });
      }
      const prizes = await storage.getPrizesByRaspadinhaId(raspadinha.id);
      res.json(prizes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Purchase a raspadinha
  app.post("/api/raspadinhas/:slug/purchase", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const raspadinha = await storage.getRaspadinhaBySlug(req.params.slug);
      
      if (!raspadinha) {
        return res.status(404).json({ error: "Raspadinha not found" });
      }

      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(400).json({ error: "Wallet not found" });
      }

      const price = parseFloat(raspadinha.price);
      const currentTotal = parseFloat(wallet.balanceTotal);
      const currentStandard = parseFloat(wallet.balanceStandard);
      const currentPrizes = parseFloat(wallet.balancePrizes);

      if (currentTotal < price) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Calculate how much to debit from each bucket (prioritize standard, then prizes)
      // Validate BEFORE modifying any balances
      let standardToDebit = 0;
      let prizesToDebit = 0;
      
      if (currentStandard >= price) {
        // Standard balance covers the full price
        standardToDebit = price;
      } else {
        // Need to use prizes as well
        standardToDebit = currentStandard;
        const remainingNeeded = price - currentStandard;
        
        // Verify prizes can cover the remaining amount
        if (currentPrizes < remainingNeeded) {
          return res.status(400).json({ error: "Insufficient balance in available buckets" });
        }
        
        prizesToDebit = remainingNeeded;
      }

      // Calculate new balances
      const newStandard = currentStandard - standardToDebit;
      const newPrizes = currentPrizes - prizesToDebit;
      const newTotal = currentTotal - price;

      // Final safety check (should never trigger if logic above is correct)
      if (newStandard < 0 || newPrizes < 0 || newTotal < 0) {
        return res.status(500).json({ error: "Internal error: invalid balance calculation" });
      }

      await storage.updateWallet(userId, {
        balanceTotal: newTotal.toString(),
        balanceStandard: newStandard.toString(),
        balancePrizes: newPrizes.toString(),
      });

      // Create transaction
      const transaction = await storage.createTransaction({
        userId,
        type: "purchase",
        status: "completed",
        amount: price.toString(),
        description: `Compra: ${raspadinha.title}`,
      });

      // Draw prize using weighted probability
      const prizes = await storage.getPrizesByRaspadinhaId(raspadinha.id);
      const { drawPrize, validatePrize } = await import("./prize-draw");
      
      const wonPrize = drawPrize(prizes);
      
      // Validate the drawn prize
      if (!validatePrize(wonPrize, prizes)) {
        throw new Error("Invalid prize drawn");
      }
      
      const prizeWon = parseFloat(wonPrize.amount);

      // Create purchase record (NOT revealed yet)
      const purchase = await storage.createPurchase({
        userId,
        raspadinhaId: raspadinha.id,
        transactionId: transaction.id,
        prizeWon: prizeWon.toString(),
        prizeLabel: wonPrize.label,
        isRevealed: false, // Don't reveal immediately
      });

      // Don't add prize to wallet yet - wait for reveal

      res.json({ 
        purchaseId: purchase.id,
        prizeLabel: wonPrize.label,
        prizeWon: prizeWon.toString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reveal scratch card prize
  app.post("/api/purchases/:id/reveal", requireAuth, async (req, res) => {
    try {
      const purchaseId = req.params.id;
      const userId = req.user!.id;

      const purchase = await storage.getPurchaseById(purchaseId);
      if (!purchase || purchase.userId !== userId) {
        return res.status(404).json({ error: "Purchase not found" });
      }

      if (purchase.isRevealed) {
        return res.status(400).json({ error: "Already revealed" });
      }

      const prizeWon = parseFloat(purchase.prizeWon);
      const wallet = await storage.getWallet(userId);

      if (!wallet) {
        return res.status(400).json({ error: "Wallet not found" });
      }

      // Mark as revealed
      await storage.updatePurchase(purchaseId, { isRevealed: true });

      // Add prize to wallet if won
      if (prizeWon > 0) {
        const currentTotal = parseFloat(wallet.balanceTotal);
        const currentPrizes = parseFloat(wallet.balancePrizes);

        await storage.updateWallet(userId, {
          balanceTotal: (currentTotal + prizeWon).toString(),
          balancePrizes: (currentPrizes + prizeWon).toString(),
        });

        await storage.createTransaction({
          userId,
          type: "prize",
          status: "completed",
          amount: prizeWon.toString(),
          description: `Prêmio: ${purchase.prizeLabel}`,
        });
      }

      res.json({ 
        revealed: true,
        prizeWon,
        prizeLabel: purchase.prizeLabel,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user purchases
  app.get("/api/purchases", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const purchases = await storage.getPurchasesByUser(userId);
      res.json(purchases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // WALLET ROUTES
  // ============================================================================

  app.get("/api/wallet", requireAuth, async (req, res) => {
    try {
      const wallet = await storage.getWallet(req.user!.id);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      res.json(wallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // TRANSACTIONS ROUTES
  // ============================================================================

  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const transactions = await storage.getTransactionsByUser(req.user!.id, type);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // DEPOSIT ROUTES
  // ============================================================================

  app.post("/api/deposits", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      const userId = req.user!.id;

      if (!amount || amount < 10 || amount > 5000) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Generate mock PIX code
      const pixCode = `00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540${amount.toFixed(1)}5802BR5925Raspadinha6009Sao Paulo62070503***6304${randomUUID().substring(0, 4).toUpperCase()}`;

      // Create transaction (pending)
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        status: "pending",
        amount: amount.toString(),
        description: "Depósito via PIX",
        pixCode,
      });

      // In a real app, this would be updated when payment is confirmed
      // For now, auto-complete after 2 seconds (mock)
      setTimeout(async () => {
        try {
          const wallet = await storage.getWallet(userId);
          if (wallet) {
            const newTotal = parseFloat(wallet.balanceTotal) + amount;
            const newStandard = parseFloat(wallet.balanceStandard) + amount;
            
            await storage.updateWallet(userId, {
              balanceTotal: newTotal.toString(),
              balanceStandard: newStandard.toString(),
            });

            // Process affiliate commission if user was referred
            const { processReferralOnDeposit } = await import("./affiliates-tracking");
            await processReferralOnDeposit(userId, amount, transaction.id);
          }
        } catch (err) {
          console.error("Error auto-completing deposit:", err);
        }
      }, 2000);

      res.json({ pixCode, transaction });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Withdrawal endpoint
  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const { amount, pixKey, pixKeyType } = req.body;
      const userId = req.user!.id;

      // Validations
      if (!amount || amount < 20 || amount > 10000) {
        return res.status(400).json({ error: "Valor inválido. Mínimo R$ 20, máximo R$ 10.000" });
      }

      if (!pixKey || !pixKeyType) {
        return res.status(400).json({ error: "Chave PIX obrigatória" });
      }

      // Check wallet balance
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(400).json({ error: "Carteira não encontrada" });
      }

      const availableBalance = parseFloat(wallet.balanceTotal);
      if (availableBalance < amount) {
        return res.status(400).json({ error: "Saldo insuficiente" });
      }

      // Create withdrawal transaction (pending)
      const transaction = await storage.createTransaction({
        userId,
        type: "withdrawal",
        status: "pending",
        amount: amount.toString(),
        description: `Saque via PIX (${pixKeyType})`,
      });

      // Deduct from wallet immediately (in real app, this would be after confirmation)
      const newTotal = availableBalance - amount;
      const currentStandard = parseFloat(wallet.balanceStandard);
      const currentPrizes = parseFloat(wallet.balancePrizes);
      
      // Deduct proportionally from standard and prizes
      let newStandard = currentStandard;
      let newPrizes = currentPrizes;
      
      if (currentStandard >= amount) {
        newStandard = currentStandard - amount;
      } else {
        newStandard = 0;
        newPrizes = currentPrizes - (amount - currentStandard);
      }

      await storage.updateWallet(userId, {
        balanceTotal: newTotal.toString(),
        balanceStandard: newStandard.toString(),
        balancePrizes: newPrizes.toString(),
      });

      // In real app, this would trigger PIX payment processing
      // For now, auto-complete after 2 seconds (mock)
      setTimeout(async () => {
        try {
          await storage.updateTransaction(transaction.id, { status: "completed" });
        } catch (err) {
          console.error("Error auto-completing withdrawal:", err);
        }
      }, 2000);

      res.json({ 
        transaction,
        message: "Saque solicitado com sucesso. O valor será transferido em até 24h.",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // AFFILIATE ROUTES
  // ============================================================================

  app.get("/api/affiliate", requireAuth, async (req, res) => {
    try {
      const affiliate = await storage.getAffiliate(req.user!.id);
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }
      res.json(affiliate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get affiliate statistics
  app.get("/api/affiliate/stats", requireAuth, async (req, res) => {
    try {
      const affiliate = await storage.getAffiliate(req.user!.id);
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }

      const referrals = await storage.getReferralsByAffiliate(affiliate.id);
      const commissions = await storage.getCommissionsByAffiliate(affiliate.id);
      
      // Calculate total commission earned
      const totalCommissionEarned = commissions.reduce(
        (sum, c) => sum + parseFloat(c.amount),
        0
      );

      // Calculate total commission pending
      const pendingCommissions = commissions
        .filter(c => !c.isPaid)
        .reduce((sum, c) => sum + parseFloat(c.amount), 0);

      res.json({
        ...affiliate,
        totalCommissionEarned: totalCommissionEarned.toFixed(2),
        pendingCommissions: pendingCommissions.toFixed(2),
        referralsCount: referrals.length,
        activeReferralsCount: referrals.filter(r => r.isActive).length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get affiliate commissions history
  app.get("/api/affiliate/commissions", requireAuth, async (req, res) => {
    try {
      const affiliate = await storage.getAffiliate(req.user!.id);
      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }

      const commissions = await storage.getCommissionsByAffiliate(affiliate.id);
      res.json(commissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Validate referral code (for frontend tracking)
  app.get("/api/affiliate/validate/:code", async (req, res) => {
    try {
      const affiliate = await storage.getAffiliateByCode(req.params.code);
      if (!affiliate) {
        return res.status(404).json({ error: "Invalid referral code" });
      }
      res.json({ valid: true, code: affiliate.referralCode });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PRIZES & STATISTICS ROUTES
  // ============================================================================

  // Get user's prize history (won prizes only)
  app.get("/api/prizes/history", requireAuth, async (req, res) => {
    try {
      const purchases = await storage.getPurchasesByUser(req.user!.id);
      
      // Filter only revealed purchases with prizes won
      const wonPrizes = purchases
        .filter(p => p.isRevealed && parseFloat(p.prizeWon) > 0)
        .map(p => ({
          id: p.id,
          prizeLabel: p.prizeLabel,
          prizeWon: p.prizeWon,
          createdAt: p.createdAt,
        }));
      
      res.json(wonPrizes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get raspadinha statistics (RTP, win rate, etc.)
  app.get("/api/raspadinhas/:slug/stats", async (req, res) => {
    try {
      const raspadinha = await storage.getRaspadinhaBySlug(req.params.slug);
      if (!raspadinha) {
        return res.status(404).json({ error: "Raspadinha not found" });
      }

      const prizes = await storage.getPrizesByRaspadinhaId(raspadinha.id);
      const { getPrizeStats, calculateRTP } = await import("./prize-draw");
      
      const stats = getPrizeStats(prizes);
      const rtp = calculateRTP(prizes, parseFloat(raspadinha.price));

      res.json({
        ...stats,
        rtp,
        ticketPrice: parseFloat(raspadinha.price),
        maxPrize: parseFloat(raspadinha.maxPrize),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // BONUS ROUTES
  // ============================================================================

  app.get("/api/bonuses", requireAuth, async (req, res) => {
    try {
      const bonuses = await storage.getBonusesByUser(req.user!.id);
      res.json(bonuses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
