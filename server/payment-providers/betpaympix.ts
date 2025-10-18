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

  constructor(token: string) {
    if (!token) {
      throw new Error('BetPaymPix token is required');
    }
    this.token = token;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`BetPaymPix API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createCharge(params: CreateChargeParams): Promise<PixCharge> {
    const amountInCents = Math.round(Number(params.amount) * 100);
  
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      throw new Error("Invalid amount");
    }
  
    const payload: any = {
      amount: amountInCents,
    };
  
    if (params.externalId) payload.externalId = String(params.externalId);
    if (params.description) payload.description = String(params.description).slice(0, 140);
    if (params.expiresIn && Number.isFinite(params.expiresIn)) payload.expiresIn = Math.floor(params.expiresIn);
  
    // Só envia se existir e for http/https
    if (params.callbackUrl && /^https?:\/\//i.test(params.callbackUrl)) {
      payload.callbackUrl = params.callbackUrl;
    }
  
    // Dados do pagador só se válidos
    if (params.userName) payload.generatedName = String(params.userName).trim();
    if (params.userEmail) payload.generatedEmail = String(params.userEmail).trim();
  
    if (params.userDocument) {
      const doc = String(params.userDocument).replace(/\D+/g, "");
      if (/^\d{11}$/.test(doc)) {
        payload.generatedDocument = doc;
      }
    }
  
    const response = await this.request("POST", "/pix", payload);
  
    return {
      id: response.id,
      pixKey: response.pixKey || response.brCode,
      qrCode: response.qrCode,
      qrCodeBase64: response.qrCodeBase64 || response.qrCode,
      amount: Number(params.amount),
      status: "PENDING",
      expiresAt: params.expiresIn ? new Date(Date.now() + params.expiresIn * 1000) : undefined,
      paidAt: response.paidAt ? new Date(response.paidAt) : undefined,
    };
  }

  async getChargeStatus(chargeId: string): Promise<PixCharge> {
    const response = await this.request('GET', `/pix?id=${chargeId}`);
    
    return {
      id: response.id,
      pixKey: response.pixKey || response.brCode,
      qrCode: response.qrCode,
      qrCodeBase64: response.qrCodeBase64 || response.qrCode,
      amount: response.amount / 100, // Converte centavos para reais
      status: response.status as 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED',
      expiresAt: new Date(response.expiresAt),
      paidAt: response.paidAt ? new Date(response.paidAt) : undefined,
    };
  }

  async createWithdrawal(params: CreateWithdrawalParams): Promise<WithdrawalResult> {
    const amountInCents = Math.round(params.amount * 100);
    
    const response = await this.request('POST', '/withdrawals', {
      amount: amountInCents,
      pixKey: params.pixKey,
      pixKeyType: params.pixKeyType,
      recipientName: params.recipientName,
      recipientDocument: params.recipientDocument,
      externalId: params.externalId,
    });

    return {
      id: response.id,
      status: 'PENDING',
      amount: params.amount,
      completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
      failureReason: response.failureReason,
    };
  }

  async getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalResult> {
    const response = await this.request('GET', `/withdrawals?id=${withdrawalId}`);
    
    return {
      id: response.id,
      status: response.status as 'PENDING' | 'COMPLETED' | 'FAILED',
      amount: response.amount / 100,
      completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
      failureReason: response.failureReason,
    };
  }

  validateWebhook(payload: any, signature?: string): boolean {
    // BetPaymPix webhook validation
    // Por segurança, sempre validar o signature se fornecido
    // Aqui verificamos se o payload tem estrutura válida
    if (!payload || !payload.id || !payload.status) {
      return false;
    }

    // Se houver signature, validar (implementar quando BetPaymPix fornecer detalhes)
    if (signature) {
      // TODO: Implementar validação de assinatura quando disponível
      console.warn('Signature validation not implemented yet');
    }

    return true;
  }
}
