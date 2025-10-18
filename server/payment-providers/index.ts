import type { PaymentProvider } from './types';
import { BetPaymPixProvider } from './betpaympix';
import { SampaBankProvider } from './sampabank';

export function createPaymentProvider(provider: 'betpaympix' | 'sampabank' = 'betpaympix'): PaymentProvider {
  const token = process.env.PIX_API_TOKEN;
  if (!token) throw new Error('PIX_API_TOKEN environment variable is required');

  const defaultCallback = process.env.PIX_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/pix` : undefined);

  switch (provider) {
    case 'betpaympix':
      // passa o callback padrão para o provider
      return new BetPaymPixProvider(token, defaultCallback);
    case 'sampabank':
      return new SampaBankProvider(token);
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

let providerInstance: PaymentProvider | null = null;
export function getPaymentProvider(): PaymentProvider {
  if (!providerInstance) {
    const selected = (process.env.PIX_PROVIDER as 'betpaympix' | 'sampabank') || 'betpaympix';
    providerInstance = createPaymentProvider(selected);
  }
  return providerInstance;
}
