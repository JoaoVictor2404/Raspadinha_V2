export interface PixCharge {
  id: string;
  pixKey: string;
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: Date;
  paidAt?: Date;
}

export interface CreateChargeParams {
  amount: number;
  userName?: string;
  userEmail?: string;
  userDocument?: string;
  description?: string;
  externalId?: string;
  callbackUrl?: string;
  expiresIn?: number;
}

export interface CreateWithdrawalParams {
  amount: number;
  pixKey: string;
  pixKeyType: 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  recipientName: string;
  recipientDocument: string;
  externalId?: string;
}

export interface WithdrawalResult {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  completedAt?: Date;
  failureReason?: string;
}

export interface PaymentProvider {
  name: string;
  
  // Depósitos (Cobranças PIX)
  createCharge(params: CreateChargeParams): Promise<PixCharge>;
  getChargeStatus(chargeId: string): Promise<PixCharge>;
  
  // Saques
  createWithdrawal(params: CreateWithdrawalParams): Promise<WithdrawalResult>;
  getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalResult>;
  
  // Webhook validation
  validateWebhook(payload: any, signature?: string): boolean;
}
