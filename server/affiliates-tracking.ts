import { storage } from "./storage";

const COMMISSION_PERCENTAGE = 10; // 10% de comissão sobre depósitos

export async function processReferralOnDeposit(
  userId: string,
  depositAmount: number,
  transactionId: string
) {
  console.log(`[AFFILIATE] Processing deposit for userId=${userId}, amount=${depositAmount}`);
  
  // Verificar se o usuário foi indicado
  const referral = await storage.getReferralByUserId(userId);
  
  if (!referral) {
    console.log(`[AFFILIATE] No referral found for userId=${userId}`);
    // Usuário não foi indicado, não há comissão a processar
    return null;
  }
  
  console.log(`[AFFILIATE] Found referral:`, referral);

  // Se é o primeiro depósito, ativar o referral
  if (!referral.isActive) {
    console.log(`[AFFILIATE] Activating referral ${referral.id} (first deposit)`);
    await storage.updateReferral(referral.id, { isActive: true });
    
    // Incrementar contador de referrals ativos do afiliado
    const affiliate = await storage.getAffiliateById(referral.affiliateId);
    if (affiliate) {
      console.log(`[AFFILIATE] Updating affiliate ${affiliate.id}: activeReferrals ${affiliate.activeReferrals} -> ${affiliate.activeReferrals + 1}`);
      await storage.updateAffiliate(affiliate.id, {
        activeReferrals: affiliate.activeReferrals + 1,
      });
    }
  }

  // Calcular comissão
  const commissionAmount = (depositAmount * COMMISSION_PERCENTAGE) / 100;
  console.log(`[AFFILIATE] Calculating commission: ${depositAmount} * ${COMMISSION_PERCENTAGE}% = ${commissionAmount}`);

  // Criar registro de comissão
  const commission = await storage.createCommission({
    affiliateId: referral.affiliateId,
    referralId: referral.id,
    transactionId,
    amount: commissionAmount.toFixed(2),
    percentage: COMMISSION_PERCENTAGE.toFixed(2),
    isPaid: false,
  });
  console.log(`[AFFILIATE] Commission created:`, commission);

  // Atualizar saldo de comissão do afiliado
  const affiliate = await storage.getAffiliateById(referral.affiliateId);
  if (affiliate) {
    const currentCommission = parseFloat(affiliate.commissionBalance || "0");
    const newCommission = currentCommission + commissionAmount;
    
    console.log(`[AFFILIATE] Updating affiliate balance: ${currentCommission} -> ${newCommission}`);
    await storage.updateAffiliate(affiliate.id, {
      commissionBalance: newCommission.toFixed(2),
    });

    // Criar transação de comissão
    const txn = await storage.createTransaction({
      userId: affiliate.userId,
      type: "commission",
      status: "completed",
      amount: commissionAmount.toFixed(2),
      description: `Comissão de ${COMMISSION_PERCENTAGE}% sobre depósito`,
      affiliateId: referral.affiliateId,
    });
    console.log(`[AFFILIATE] Commission transaction created:`, txn);
  }

  console.log(`[AFFILIATE] Processing completed successfully`);
  return commission;
}

export async function createReferralOnRegistration(
  newUserId: string,
  referralCode: string
) {
  // Buscar afiliado pelo código
  const affiliate = await storage.getAffiliateByCode(referralCode);
  
  if (!affiliate) {
    throw new Error("Código de indicação inválido");
  }

  // Criar registro de indicação (inativo até primeiro depósito)
  const referral = await storage.createReferral({
    affiliateId: affiliate.id,
    referredUserId: newUserId,
    isActive: false, // Será ativado no primeiro depósito
  });

  // Atualizar contador de total de indicações
  await storage.updateAffiliate(affiliate.id, {
    totalReferrals: affiliate.totalReferrals + 1,
    // activeReferrals será incrementado apenas no primeiro depósito
  });

  return referral;
}

export function generateUniqueReferralCode(username: string): string {
  // Gerar código baseado no username + timestamp
  const baseCode = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const uniqueId = Date.now().toString(36).slice(-4); // Últimos 4 chars do timestamp em base36
  return `${baseCode}-${uniqueId}`;
}
