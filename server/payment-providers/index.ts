import type { PaymentProvider } from './types';
import { BetPaymPixProvider } from './betpaympix';
import { SampaBankProvider } from './sampabank';

export function createPaymentProvider(provider: 'betpaympix' | 'sampabank' = 'betpaympix'): PaymentProvider {
  const token = process.env.PIX_API_TOKEN;
  if (!token) throw new Error('PIX_API_TOKEN environment variable is required');

  switch (provider) {
    case 'betpaympix': return new BetPaymPixProvider(token);
    case 'sampabank': return new SampaBankProvider(token);
    default: throw new Error(`Unknown payment provider: ${provider}`);
  }
}

let providerInstance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!providerInstance) {
    const sel = (process.env.PIX_PROVIDER as 'betpaympix' | 'sampabank') || 'betpaympix';
    providerInstance = createPaymentProvider(sel);
  }
  return providerInstance;
}
