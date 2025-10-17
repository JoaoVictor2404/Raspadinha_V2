import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { randomUUID } from "crypto";

// Extend session type for admin
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
    adminUsername?: string;
  }
}

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

      const prizeWon = parseFloat(purchase.prizeWon || "0");
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

  // ============================================================================
  // PIX DEPOSIT ROUTES
  // ============================================================================

  // Create deposit (generate QR Code PIX)
  app.post(
    "/api/deposits/create",
    requireAuth,
    rateLimit("deposit", RATE_LIMITS.DEPOSIT_PER_HOUR, 60 * 60 * 1000),
    async (req, res) => {
      try {
        const userId = req.user!.id;
        const { amount } = req.body;

        // Validate amount
        const amountError = validateAmount(amount, MIN_DEPOSIT, MAX_DEPOSIT);
        if (amountError) {
          return res.status(400).json({ error: amountError });
        }

        // Create pending transaction
        const transaction = await storage.createTransaction({
          userId,
          type: "deposit",
          amount: amount.toString(),
          status: "pending",
          description: `Depósito PIX - R$ ${amount.toFixed(2)}`,
        });

        // Create charge via payment provider
        const provider = getPaymentProvider();
        const charge = await provider.createCharge({
          amount,
          description: `Depósito Ludix - ${req.user!.username}`,
          externalId: transaction.id,
        });

        // Save deposit record
        const deposit = await storage.createDeposit({
          userId,
          transactionId: transaction.id,
          amount: amount.toString(),
          status: "pending",
          pixChargeId: charge.id,
          pixKey: charge.pixKey || null,
          qrCode: charge.qrCode || null,
          qrCodeBase64: charge.qrCodeBase64 || null,
          expiresAt: charge.expiresAt || null,
          paidAt: null,
        });

        res.json({
          depositId: deposit.id,
          transactionId: transaction.id,
          qrCode: charge.qrCode,
          qrCodeBase64: charge.qrCodeBase64,
          pixKey: charge.pixKey,
          amount,
          expiresAt: charge.expiresAt,
          status: "pending",
        });
      } catch (error: any) {
        console.error("Deposit creation error:", error);
        res.status(500).json({ error: "Falha ao criar depósito" });
      }
    }
  );

  // Get deposit status
  app.get("/api/deposits/:id", requireAuth, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(req.params.id);
      
      if (!deposit) {
        return res.status(404).json({ error: "Depósito não encontrado" });
      }

      // Only owner can see their deposits
      if (deposit.userId !== req.user!.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // If still pending, check status with provider
      if (deposit.status === "pending" && deposit.pixChargeId) {
        try {
          const provider = getPaymentProvider();
          const charge = await provider.getChargeStatus(deposit.pixChargeId);
          
          if (charge.status === "COMPLETED" && deposit.status === "pending") {
            // Payment confirmed! Update everything
            await storage.updateDeposit(deposit.id, {
              status: "completed",
              paidAt: charge.paidAt || new Date(),
            });

            await storage.updateTransaction(deposit.transactionId, {
              status: "completed",
            });

            // Credit wallet
            const wallet = await storage.getWallet(deposit.userId);
            if (wallet) {
              const newStandard = parseFloat(wallet.balanceStandard) + parseFloat(deposit.amount);
              const newTotal = parseFloat(wallet.balanceTotal) + parseFloat(deposit.amount);

              await storage.updateWallet(deposit.userId, {
                balanceStandard: newStandard.toString(),
                balanceTotal: newTotal.toString(),
              });
            }

            // Check for affiliate commission
            const referral = await storage.getReferralByUserId(deposit.userId);
            if (referral && !referral.isActive) {
              // Activate referral on first deposit
              await storage.updateReferral(referral.id, {
                isActive: true,
              });

              // Update affiliate stats
              const affiliate = await storage.getAffiliateById(referral.affiliateId);
              if (affiliate) {
                await storage.updateAffiliate(affiliate.id, {
                  activeReferrals: affiliate.activeReferrals + 1,
                });
              }
            }

            // Create commission if referral is active
            if (referral && referral.isActive) {
              const commissionAmount = parseFloat(deposit.amount) * 0.1; // 10%
              
              await storage.createCommission({
                affiliateId: referral.affiliateId,
                referralId: referral.id,
                transactionId: deposit.transactionId,
                amount: commissionAmount.toString(),
                percentage: "10",
                isPaid: false,
              });

              // Update affiliate commission balance
              const affiliate = await storage.getAffiliateById(referral.affiliateId);
              if (affiliate) {
                const newBalance = parseFloat(affiliate.commissionBalance) + commissionAmount;
                await storage.updateAffiliate(affiliate.id, {
                  commissionBalance: newBalance.toString(),
                });
              }
            }

            deposit.status = "completed";
            deposit.paidAt = charge.paidAt || new Date();
          }
        } catch (err) {
          console.error("Error checking deposit status:", err);
        }
      }

      res.json(deposit);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook to receive payment notifications
  app.post("/api/webhooks/pix", async (req, res) => {
    try {
      const provider = getPaymentProvider();
      
      // Validate webhook signature
      const signature = req.headers["x-signature"] as string;
      if (!provider.validateWebhook(req.body, signature)) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      const { event, data } = req.body;

      if (event === "charge.completed" && data.externalId) {
        // Find deposit by transaction ID
        const transaction = await storage.getTransactionsByUser("", "deposit");
        const txn = transaction.find(t => t.id === data.externalId);
        
        if (!txn) {
          return res.status(404).json({ error: "Transaction not found" });
        }

        // Find deposit
        const deposits = await storage.getDepositsByUser(txn.userId);
        const deposit = deposits.find(d => d.transactionId === txn.id);

        if (!deposit || deposit.status === "completed") {
          return res.status(200).json({ message: "Already processed" });
        }

        // Update deposit
        await storage.updateDeposit(deposit.id, {
          status: "completed",
          paidAt: new Date(),
        });

        await storage.updateTransaction(deposit.transactionId, {
          status: "completed",
        });

        // Credit wallet
        const wallet = await storage.getWallet(deposit.userId);
        if (wallet) {
          const newStandard = parseFloat(wallet.balanceStandard) + parseFloat(deposit.amount);
          const newTotal = parseFloat(wallet.balanceTotal) + parseFloat(deposit.amount);

          await storage.updateWallet(deposit.userId, {
            balanceStandard: newStandard.toString(),
            balanceTotal: newTotal.toString(),
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // PIX WITHDRAWAL ROUTES
  // ============================================================================

  // Create withdrawal
  app.post(
    "/api/withdrawals/create",
    requireAuth,
    rateLimit("withdrawal", RATE_LIMITS.WITHDRAWAL_PER_HOUR, 60 * 60 * 1000),
    async (req, res) => {
      try {
        const userId = req.user!.id;
        const { amount, pixKey, pixKeyType, recipientDocument } = req.body;

        // Validate amount
        const amountError = validateAmount(amount, MIN_WITHDRAWAL, MAX_WITHDRAWAL);
        if (amountError) {
          return res.status(400).json({ error: amountError });
        }

        // Validate CPF
        const cpf = sanitizeCPF(recipientDocument);
        if (!validateCPF(cpf)) {
          return res.status(400).json({ error: "CPF inválido" });
        }

        // Check wallet balance
        const wallet = await storage.getWallet(userId);
        if (!wallet) {
          return res.status(400).json({ error: "Carteira não encontrada" });
        }

        const availableBalance = 
          parseFloat(wallet.balanceStandard) + 
          parseFloat(wallet.balancePrizes) - 
          parseFloat(wallet.pendingWithdrawal || "0");

        if (availableBalance < amount) {
          return res.status(400).json({ error: "Saldo insuficiente" });
        }

        // Freeze balance (move to pendingWithdrawal)
        const newPendingWithdrawal = parseFloat(wallet.pendingWithdrawal || "0") + amount;
        
        // Deduct from balanceStandard first, then balancePrizes
        let standardToDebit = 0;
        let prizesToDebit = 0;
        const currentStandard = parseFloat(wallet.balanceStandard);
        const currentPrizes = parseFloat(wallet.balancePrizes);

        if (currentStandard >= amount) {
          standardToDebit = amount;
        } else {
          standardToDebit = currentStandard;
          prizesToDebit = amount - currentStandard;
        }

        const newStandard = currentStandard - standardToDebit;
        const newPrizes = currentPrizes - prizesToDebit;

        await storage.updateWallet(userId, {
          balanceStandard: newStandard.toString(),
          balancePrizes: newPrizes.toString(),
          pendingWithdrawal: newPendingWithdrawal.toString(),
        });

        // Create pending transaction
        const transaction = await storage.createTransaction({
          userId,
          type: "withdrawal",
          amount: amount.toString(),
          status: "pending",
          description: `Saque PIX - R$ ${amount.toFixed(2)}`,
        });

        // Request withdrawal via payment provider
        const provider = getPaymentProvider();
        const result = await provider.createWithdrawal({
          amount,
          pixKey,
          pixKeyType,
          recipientDocument: cpf,
          recipientName: req.user!.username,
          externalId: transaction.id,
        });

        // Save withdrawal record
        const withdrawal = await storage.createWithdrawal({
          userId,
          transactionId: transaction.id,
          amount: amount.toString(),
          status: "pending",
          pixWithdrawalId: result.id,
          pixKey,
          pixKeyType,
          recipientName: req.user!.username,
          recipientDocument: cpf,
          completedAt: null,
          failedReason: null,
        });

        res.json({
          withdrawalId: withdrawal.id,
          transactionId: transaction.id,
          amount,
          status: "pending",
          message: "Saque solicitado com sucesso",
        });
      } catch (error: any) {
        console.error("Withdrawal creation error:", error);
        
        // Revert wallet balance on error
        try {
          const wallet = await storage.getWallet(req.user!.id);
          if (wallet) {
            const revertPending = parseFloat(wallet.pendingWithdrawal || "0") - req.body.amount;
            await storage.updateWallet(req.user!.id, {
              pendingWithdrawal: Math.max(0, revertPending).toString(),
            });
          }
        } catch (revertError) {
          console.error("Failed to revert balance:", revertError);
        }

        res.status(500).json({ error: "Falha ao criar saque" });
      }
    }
  );

  // Get withdrawal status
  app.get("/api/withdrawals/:id", requireAuth, async (req, res) => {
    try {
      const withdrawal = await storage.getWithdrawal(req.params.id);
      
      if (!withdrawal) {
        return res.status(404).json({ error: "Saque não encontrado" });
      }

      // Only owner can see their withdrawals
      if (withdrawal.userId !== req.user!.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // If still pending, check status with provider
      if (withdrawal.status === "pending" && withdrawal.pixWithdrawalId) {
        try {
          const provider = getPaymentProvider();
          const result = await provider.getWithdrawalStatus(withdrawal.pixWithdrawalId);
          
          if (result.status === "COMPLETED" && withdrawal.status === "pending") {
            // Withdrawal completed! Remove from pendingWithdrawal
            await storage.updateWithdrawal(withdrawal.id, {
              status: "completed",
              completedAt: result.completedAt || new Date(),
            });

            await storage.updateTransaction(withdrawal.transactionId, {
              status: "completed",
            });

            const wallet = await storage.getWallet(withdrawal.userId);
            if (wallet) {
              const newPending = parseFloat(wallet.pendingWithdrawal || "0") - parseFloat(withdrawal.amount);
              await storage.updateWallet(withdrawal.userId, {
                pendingWithdrawal: Math.max(0, newPending).toString(),
              });
            }

            withdrawal.status = "completed";
            withdrawal.completedAt = result.completedAt || new Date();
          } else if (result.status === "FAILED") {
            // Withdrawal failed! Revert balance
            await storage.updateWithdrawal(withdrawal.id, {
              status: "failed",
              failedReason: result.failureReason || "Falha no processamento",
            });

            await storage.updateTransaction(withdrawal.transactionId, {
              status: "failed",
            });

            const wallet = await storage.getWallet(withdrawal.userId);
            if (wallet) {
              const revertAmount = parseFloat(withdrawal.amount);
              const newPending = parseFloat(wallet.pendingWithdrawal || "0") - revertAmount;
              const newStandard = parseFloat(wallet.balanceStandard) + revertAmount;

              await storage.updateWallet(withdrawal.userId, {
                balanceStandard: newStandard.toString(),
                pendingWithdrawal: Math.max(0, newPending).toString(),
              });
            }

            withdrawal.status = "failed";
            withdrawal.failedReason = result.failureReason || "Falha no processamento";
          }
        } catch (err) {
          console.error("Error checking withdrawal status:", err);
        }
      }

      res.json(withdrawal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  // Admin authentication middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.isAdmin) {
      return res.status(401).json({ error: "Unauthorized - Admin access required" });
    }
    next();
  };

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Require admin credentials to be set in environment
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminUsername || !adminPassword) {
        return res.status(500).json({ 
          error: "Admin credentials not configured. Please set ADMIN_USERNAME and ADMIN_PASSWORD environment variables." 
        });
      }

      if (username === adminUsername && password === adminPassword) {
        req.session.isAdmin = true;
        req.session.adminUsername = username;
        
        return res.json({ 
          success: true,
          message: "Login admin realizado com sucesso",
          username,
        });
      }

      return res.status(401).json({ error: "Credenciais inválidas" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", requireAdmin, async (req, res) => {
    req.session.isAdmin = false;
    req.session.adminUsername = undefined;
    res.json({ success: true, message: "Logout realizado" });
  });

  // Check admin session
  app.get("/api/admin/session", async (req, res) => {
    if (req.session.isAdmin) {
      return res.json({ 
        isAdmin: true,
        username: req.session.adminUsername,
      });
    }
    res.json({ isAdmin: false });
  });

  // Check admin status (alias for session)
  app.get("/api/admin/status", async (req, res) => {
    if (req.session.isAdmin) {
      return res.json({ 
        isAdmin: true,
        adminUsername: req.session.adminUsername,
      });
    }
    return res.status(401).json({ error: "Not authenticated as admin" });
  });

  // ============================================================================
  // ADMIN - RASPADINHAS MANAGEMENT
  // ============================================================================

  // Get all raspadinhas (admin view with all details)
  app.get("/api/admin/raspadinhas", requireAdmin, async (req, res) => {
    try {
      const raspadinhas = await storage.getRaspadinhas();
      res.json(raspadinhas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create raspadinha
  app.post("/api/admin/raspadinhas", requireAdmin, async (req, res) => {
    try {
      const raspadinha = await storage.createRaspadinha(req.body);
      res.json(raspadinha);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update raspadinha
  app.put("/api/admin/raspadinhas/:id", requireAdmin, async (req, res) => {
    try {
      const raspadinha = await storage.updateRaspadinha(req.params.id, req.body);
      res.json(raspadinha);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete raspadinha
  app.delete("/api/admin/raspadinhas/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteRaspadinha(req.params.id);
      res.json({ success: true, message: "Raspadinha deletada" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN - PRIZES MANAGEMENT
  // ============================================================================

  // Create prize for raspadinha
  app.post("/api/admin/prizes", requireAdmin, async (req, res) => {
    try {
      const prize = await storage.createPrize(req.body);
      res.json(prize);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update prize
  app.put("/api/admin/prizes/:id", requireAdmin, async (req, res) => {
    try {
      const prize = await storage.updatePrize(req.params.id, req.body);
      res.json(prize);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete prize
  app.delete("/api/admin/prizes/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePrize(req.params.id);
      res.json({ success: true, message: "Prêmio deletado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN - AFFILIATES MANAGEMENT
  // ============================================================================

  // Get all affiliates
  app.get("/api/admin/affiliates", requireAdmin, async (req, res) => {
    try {
      const affiliates = await storage.getAllAffiliates();
      res.json(affiliates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update affiliate commission balance
  app.put("/api/admin/affiliates/:id/commission", requireAdmin, async (req, res) => {
    try {
      const { commissionBalance } = req.body;
      const affiliate = await storage.updateAffiliate(req.params.id, { commissionBalance });
      res.json(affiliate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all commissions
  app.get("/api/admin/commissions", requireAdmin, async (req, res) => {
    try {
      const commissions = await storage.getAllCommissions();
      res.json(commissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark commission as paid
  app.put("/api/admin/commissions/:id/pay", requireAdmin, async (req, res) => {
    try {
      const commission = await storage.updateCommission(req.params.id, { isPaid: true });
      res.json(commission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN - USERS MANAGEMENT
  // ============================================================================

  // Get all users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user details with wallet and transactions
  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      const wallet = await storage.getWallet(req.params.id);
      const transactions = await storage.getTransactionsByUser(req.params.id);
      
      res.json({ user, wallet, transactions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN - TRANSACTIONS & DEPOSITS/WITHDRAWALS
  // ============================================================================

  // Get all transactions
  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all deposits
  app.get("/api/admin/deposits", requireAdmin, async (req, res) => {
    try {
      const deposits = await storage.getAllDeposits();
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all withdrawals
  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const withdrawals = await storage.getAllWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve/Complete withdrawal manually
  app.put("/api/admin/withdrawals/:id/complete", requireAdmin, async (req, res) => {
    try {
      const withdrawal = await storage.getWithdrawal(req.params.id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }

      await storage.updateWithdrawal(req.params.id, {
        status: "completed",
        completedAt: new Date(),
      });

      // Remove from pending
      const wallet = await storage.getWallet(withdrawal.userId);
      if (wallet) {
        const amount = parseFloat(withdrawal.amount);
        const newPending = parseFloat(wallet.pendingWithdrawal || "0") - amount;
        
        await storage.updateWallet(withdrawal.userId, {
          pendingWithdrawal: Math.max(0, newPending).toString(),
        });
      }

      res.json({ success: true, message: "Saque completado" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN - DASHBOARD STATS
  // ============================================================================

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const transactions = await storage.getAllTransactions();
      const deposits = await storage.getAllDeposits();
      const withdrawals = await storage.getAllWithdrawals();
      const affiliates = await storage.getAllAffiliates();
      const commissions = await storage.getAllCommissions();

      const totalDeposits = deposits
        .filter(d => d.status === "completed")
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

      const totalWithdrawals = withdrawals
        .filter(w => w.status === "completed")
        .reduce((sum, w) => sum + parseFloat(w.amount), 0);

      const totalCommissions = commissions
        .reduce((sum, c) => sum + parseFloat(c.amount), 0);

      const pendingWithdrawals = withdrawals
        .filter(w => w.status === "pending")
        .reduce((sum, w) => sum + parseFloat(w.amount), 0);

      res.json({
        totalUsers: users.length,
        totalTransactions: transactions.length,
        totalDeposits: totalDeposits.toFixed(2),
        totalWithdrawals: totalWithdrawals.toFixed(2),
        totalCommissions: totalCommissions.toFixed(2),
        pendingWithdrawals: pendingWithdrawals.toFixed(2),
        activeAffiliates: affiliates.filter(a => a.activeReferrals > 0).length,
        totalAffiliates: affiliates.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
