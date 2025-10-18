import type {
  PaymentProvider,
  PixCharge,
  CreateChargeParams,
  CreateWithdrawalParams,
  WithdrawalResult
} from './types';

// ---------- helpers locais ----------

function toCents(amount: number | string) {
  const n = typeof amount === 'string' ? Number(amount.replace(',', '.')) : Number(amount);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Valor inválido');
  return Math.round(n * 100);
}

/** Gera txid PIX (26–35) alfanumérico, sem símbolos, com base em externalId quando possível */
function makePixTxid(externalId?: string, prefix = 'DPT') {
  const only = (externalId || '')
    .toString()
    .replace(/[^a-zA-Z0-9]/g, ''); // tira hífen etc.

  let base = (prefix + only).slice(0, 35);
  if (base.length < 26) {
    const extra = (Date.now().toString(36) + Math.random().toString(36)).replace(/[^a-zA-Z0-9]/g, '');
    base = (base + extra).slice(0, 35);
  }
  if (base.length < 26) {
    // fallback extremo
    base = (base + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').slice(0, 26);
  }
  return base;
}

export class BetPaymPixProvider implements PaymentProvider {
  name = 'BetPaymPix';
  private apiUrl =
    (process.env.BETPAYMPIX_API_URL?.replace(/\/+$/, '') || 'https://api.betpaympix.com') + '/v1';
  private token: string;

  constructor(token: string) {
    if (!token) throw new Error('BetPaymPix token is required');
    this.token = token;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const url = `${this.apiUrl}${endpoint}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // lê tudo para log decente
    const raw = await res.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = { raw }; }

    if (!res.ok) {
      const err = new Error(`BetPaymPix API error: ${res.status} - ${JSON.stringify(data)}`);
      // log explícito p/ diagnosticar "Invalid ..."
      console.error('[BetPaymPix] ERROR', method, endpoint, 'payload=', body, 'response=', data);
      throw err;
    }

    return data;
  }

  async createCharge(params: CreateChargeParams): Promise<PixCharge> {
    const amountInCents = toCents(params.amount);

    const callbackUrl =
      params.callbackUrl ||
      process.env.PIX_CALLBACK_URL ||
      (process.env.APP_URL ? `${process.env.APP_URL.replace(/\/+$/, '')}/api/webhooks/pix` : undefined);

    if (!callbackUrl) {
      throw new Error('callbackUrl is required (configure PIX_CALLBACK_URL ou APP_URL)');
    }

    // Gera txid válido (26–35, alfanumérico)
    const txid = makePixTxid(params.externalId);

    // payload mínimo e “limpo”
    const payload: Record<string, any> = {
      amount: amountInCents,
      description: (params.description || '').slice(0, 255),
      externalId: txid, // usamos o txid sanitizado
      txid,             // e também enviamos como txid explicitamente
      callbackUrl,
      expiresIn: typeof params.expiresIn === 'number' ? params.expiresIn : 600,
    };

    // Dados do pagador: só se válidos
    if (params.userName && params.userName.trim()) payload.name = params.userName.trim();
    if (params.userEmail && params.userEmail.includes('@')) payload.email = params.userEmail.trim();
    if (params.userDocument && /^\d{11}$/.test(params.userDocument)) payload.document = params.userDocument;

    // Mantém o endpoint /pix que você já usava
    const r = await this.request('POST', '/pix', payload);

    return {
      id: r.id,
      pixKey: r.pixKey || r.brCode,
      qrCode: r.qrCode,
      qrCodeBase64: r.qrCodeBase64 || r.qrCode,
      amount: Number(params.amount),
      status: 'PENDING',
      expiresAt: r.expiresAt ? new Date(r.expiresAt) : new Date(Date.now() + payload.expiresIn * 1000),
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
    const r = await this.request('POST', '/withdrawals', {
      amount: toCents(params.amount),
      pixKey: params.pixKey,
      pixKeyType: params.pixKeyType,
      recipientName: params.recipientName,
      recipientDocument: params.recipientDocument,
      externalId: params.externalId,
    });

    return {
      id: r.id,
      status: 'PENDING',
      amount: Number(params.amount),
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
