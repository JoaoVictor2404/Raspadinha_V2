import type {
  PaymentProvider,
  PixCharge,
  CreateChargeParams,
  CreateWithdrawalParams,
  WithdrawalResult
} from './types';

export class SampaBankProvider implements PaymentProvider {
  name = 'SampaBank';
  private apiUrl = 'https://api.sampabank.com.br/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('SampaBank API key is required');
    }
    this.apiKey = apiKey;
  }

  private async request(method: string, endpoint: string, body?: any) {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SampaBank API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createCharge(params: CreateChargeParams): Promise<PixCharge> {
    const response = await this.request('POST', '/pix/charges', {
      value: params.amount,
      customer: {
        name: params.userName,
        email: params.userEmail,
        document: params.userDocument,
      },
      description: params.description,
      referenceId: params.externalId,
      webhookUrl: params.callbackUrl,
      expirationSeconds: params.expiresIn || 600,
    });

    return {
      id: response.chargeId,
      pixKey: response.pixCopyPaste,
      qrCode: response.pixCopyPaste,
      qrCodeBase64: response.qrCodeImage,
      amount: params.amount,
      status: 'PENDING',
      expiresAt: new Date(response.expiresAt),
      paidAt: response.paidAt ? new Date(response.paidAt) : undefined,
    };
  }

  async getChargeStatus(chargeId: string): Promise<PixCharge> {
    const response = await this.request('GET', `/pix/charges/${chargeId}`);
    
    // Mapear status SampaBank para nosso padrão
    const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'> = {
      'awaiting_payment': 'PENDING',
      'paid': 'COMPLETED',
      'expired': 'EXPIRED',
      'cancelled': 'CANCELLED',
    };

    return {
      id: response.chargeId,
      pixKey: response.pixCopyPaste,
      qrCode: response.pixCopyPaste,
      qrCodeBase64: response.qrCodeImage,
      amount: response.value,
      status: statusMap[response.status] || 'PENDING',
      expiresAt: new Date(response.expiresAt),
      paidAt: response.paidAt ? new Date(response.paidAt) : undefined,
    };
  }

  async createWithdrawal(params: CreateWithdrawalParams): Promise<WithdrawalResult> {
    const response = await this.request('POST', '/pix/transfers', {
      value: params.amount,
      pixKey: params.pixKey,
      pixKeyType: params.pixKeyType.toLowerCase(),
      recipient: {
        name: params.recipientName,
        document: params.recipientDocument,
      },
      referenceId: params.externalId,
    });

    return {
      id: response.transferId,
      status: 'PENDING',
      amount: params.amount,
      completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
      failureReason: response.failureReason,
    };
  }

  async getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalResult> {
    const response = await this.request('GET', `/pix/transfers/${withdrawalId}`);
    
    // Mapear status SampaBank para nosso padrão
    const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED'> = {
      'processing': 'PENDING',
      'completed': 'COMPLETED',
      'failed': 'FAILED',
      'rejected': 'FAILED',
    };

    return {
      id: response.transferId,
      status: statusMap[response.status] || 'PENDING',
      amount: response.value,
      completedAt: response.completedAt ? new Date(response.completedAt) : undefined,
      failureReason: response.failureReason || response.rejectionReason,
    };
  }

  validateWebhook(payload: any, signature?: string): boolean {
    // SampaBank webhook validation
    if (!payload || !payload.chargeId || !payload.status) {
      return false;
    }

    // Se houver signature, validar
    if (signature) {
      // TODO: Implementar validação de assinatura quando disponível
      console.warn('Signature validation not implemented yet');
    }

    return true;
  }
}
