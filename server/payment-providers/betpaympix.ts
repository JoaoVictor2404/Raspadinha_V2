import type {
  PaymentProvider,
  PixCharge,
  CreateChargeParams,
  CreateWithdrawalParams,
  WithdrawalResult
} from './types';

export class BetPaymPixProvider implements PaymentProvider {
  name = 'BetPaymPix';
  private apiUrl = (process.env.BETPAYMPIX_API_URL?.replace(/\/+$/,'') || 'https://api.betpaympix.com') + '/v1';
  private token: string;

  constructor(token: string) {
    if (!token) throw new Error('BetPaymPix token is required');
    this.token = token;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const res = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      // tenta ler JSON, senão texto
      let message = await res.text();
      try { message = JSON.stringify(await res.clone().json()); } catch {}
      throw new Error(`BetPaymPix API error: ${res.status} - ${message}`);
    }
    return res.json();
  }

  async createCharge(params: CreateChargeParams): Promise<PixCharge> {
    const amountInCents = Math.round(params.amount * 100);

    const callbackUrl =
      params.callbackUrl ||
      process.env.PIX_CALLBACK_URL ||
      (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/+$/,'')}/api/webhooks/pix` : undefined);

    if (!callbackUrl) throw new Error('callbackUrl is required (set PIX_CALLBACK_URL or APP_URL)');

    // Envia apenas o essencial. Campos do pagador entram só se válidos.
    const payload: Record<string, any> = {
      amount: amountInCents,
      description: (params.description || '').slice(0, 255),
      externalId: params.externalId,
      callbackUrl,
      expiresIn: typeof params.expiresIn === 'number' ? params.expiresIn : 600,
    };

    // Dados do pagador – só se existirem e forem plausíveis.
    if (params.userName && params.userName.trim()) payload.name = params.userName.trim();
    if (params.userEmail && params.userEmail.includes('@')) payload.email = params.userEmail.trim();
    if (params.userDocument && /^\d{11}$/.test(params.userDocument)) payload.document = params.userDocument;

    const r = await this.request('POST', '/pix', payload);

    return {
      id: r.id,
      pixKey: r.pixKey || r.brCode,
      qrCode: r.qrCode,
      qrCodeBase64: r.qrCodeBase64 || r.qrCode,
      amount: params.amount,
      status: 'PENDING',
      expiresAt: r.expiresAt ? new Date(r.expiresAt) : new Date(Date.now() + (payload.expiresIn * 1000)),
      paidAt: r.paidAt ? new Date(r.paidAt) : undefined,
    };
  }

  async getChargeStatus(chargeId: string): Promise<PixCharge> {
    const r = await this.request('GET', `/pix?id=${encodeURIComponent(chargeId)}`);
    return {
      id: r.id,
      pixKey: r.pixKey || r.brCode,
      qrCode: r.qrCode,
      qrCodeBase64: r.qrCodeBase64 || r.qrCode,
      amount: r.amount / 100,
      status: r.status as 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED',
      expiresAt: new Date(r.expiresAt),
      paidAt: r.paidAt ? new Date(r.paidAt) : undefined,
    };
  }

  async createWithdrawal(params: CreateWithdrawalParams): Promise<WithdrawalResult> {
    const amountInCents = Math.round(params.amount * 100);
    const r = await this.request('POST', '/withdrawals', {
      amount: amountInCents,
      pixKey: params.pixKey,
      pixKeyType: params.pixKeyType,
      recipientName: params.recipientName,
      recipientDocument: params.recipientDocument,
      externalId: params.externalId,
    });
    return {
      id: r.id,
      status: 'PENDING',
      amount: params.amount,
      completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
      failureReason: r.failureReason,
    };
  }

  async getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalResult> {
    const r = await this.request('GET', `/withdrawals?id=${encodeURIComponent(withdrawalId)}`);
    return {
      id: r.id,
      status: r.status as 'PENDING' | 'COMPLETED' | 'FAILED',
      amount: r.amount / 100,
      completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
      failureReason: r.failureReason,
    };
  }

  validateWebhook(payload: any, signature?: string): boolean {
    return !!(payload && payload.id && payload.status);
  }
}
