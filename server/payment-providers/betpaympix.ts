import type {
  PaymentProvider,
  PixCharge,
  CreateChargeParams,
  CreateWithdrawalParams,
  WithdrawalResult
} from './types';

export class BetPaymPixProvider implements PaymentProvider {
  name = 'BetPaymPix';
  private apiUrl = 'https://api.betpaympix.com/v1';
  private token: string;
  private defaultCallbackUrl?: string;

  constructor(token: string, defaultCallbackUrl?: string) {
    if (!token) throw new Error('BetPaymPix token is required');
    this.token = token;
    this.defaultCallbackUrl = defaultCallbackUrl;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const res = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      // Mostra a razão exata no log para facilitar debug
      throw new Error(`BetPaymPix API error: ${res.status} - ${text}`);
    }
    return res.json();
  }

  async createCharge(params: CreateChargeParams): Promise<PixCharge> {
    const amountInCents = Math.round(params.amount * 100);

    // Monta o payload apenas com campos definidos para evitar "Invalid "
    const payload: Record<string, any> = {
      amount: amountInCents,
      description: params.description?.slice(0, 200) ?? `Depósito R$ ${(params.amount).toFixed(2)}`,
      externalId: params.externalId
    };

    const callbackUrl = params.callbackUrl || this.defaultCallbackUrl;
    if (!callbackUrl) {
      throw new Error('callbackUrl is required for BetPaymPix');
    }
    payload.callbackUrl = callbackUrl;

    // Campos do pagador – a API costuma exigir dados válidos
    if (params.userName) payload.generatedName = params.userName;
    if (params.userEmail) payload.generatedEmail = params.userEmail;

    // Documento tem que ser numérico e com 11 dígitos no mínimo
    if (params.userDocument) {
      const onlyDigits = params.userDocument.replace(/\D/g, '');
      if (onlyDigits.length >= 11) payload.generatedDocument = onlyDigits;
    }

    if (params.expiresIn) payload.expiresIn = params.expiresIn;

    const response = await this.request('POST', '/pix', payload);

    return {
      id: response.id,
      pixKey: response.pixKey ?? response.brCode,
      qrCode: response.qrCode,
      qrCodeBase64: response.qrCodeBase64 ?? response.qrCode,
      amount: params.amount,
      status: 'PENDING',
      expiresAt: response.expiresAt ? new Date(response.expiresAt) : (params.expiresIn ? new Date(Date.now() + params.expiresIn * 1000) : undefined),
      paidAt: response.paidAt ? new Date(response.paidAt) : undefined,
    };
  }

  async getChargeStatus(chargeId: string): Promise<PixCharge> {
    const response = await this.request('GET', `/pix?id=${encodeURIComponent(chargeId)}`);
    return {
      id: response.id,
      pixKey: response.pixKey ?? response.brCode,
      qrCode: response.qrCode,
      qrCodeBase64: response.qrCodeBase64 ?? response.qrCode,
      amount: response.amount / 100,
      status: response.status as 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED',
      expiresAt: response.expiresAt ? new Date(response.expiresAt) : undefined,
      paidAt: response.paidAt ? new Date(response.paidAt) : undefined,
    };
  }

  async createWithdrawal(params: CreateWithdrawalParams): Promise<WithdrawalResult> {
    const amountInCents = Math.round(params.amount * 100);
    const payload: any = {
      amount: amountInCents,
      pixKey: params.pixKey,
      pixKeyType: params.pixKeyType,
      recipientName: params.recipientName,
      recipientDocument: params.recipientDocument?.replace(/\D/g, ''),
      externalId: params.externalId,
    };
    const response = await this.request('POST', '/withdrawals', payload);
    return {
      id: response.id,
      status: 'PENDING',
      amount: params.amount,
      completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
      failureReason: response.failureReason,
    };
  }

  async getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalResult> {
    const response = await this.request('GET', `/withdrawals?id=${encodeURIComponent(withdrawalId)}`);
    return {
      id: response.id,
      status: response.status as 'PENDING' | 'COMPLETED' | 'FAILED',
      amount: response.amount / 100,
      completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
      failureReason: response.failureReason,
    };
  }

  validateWebhook(payload: any, signature?: string): boolean {
    return Boolean(payload && payload.id && payload.status); // placeholder
  }
}
