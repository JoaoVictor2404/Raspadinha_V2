import type { Request, Response, NextFunction } from 'express';

// Rate limiting simples em memória (em produção, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const RATE_LIMITS = {
  DEPOSIT_PER_HOUR: 3,
  WITHDRAWAL_PER_HOUR: 3,
  WITHDRAWAL_PER_DAY: 5,
};

export const MIN_DEPOSIT = 5; // R$ 5,00
export const MAX_DEPOSIT = 5000; // R$ 5.000,00
export const MIN_WITHDRAWAL = 10; // R$ 10,00
export const MAX_WITHDRAWAL = 10000; // R$ 10.000,00

// Helper para limpar rate limits expirados
function cleanExpiredLimits() {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, value] of entries) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Rate limiting middleware
export function rateLimit(
  type: 'deposit' | 'withdrawal',
  maxRequests: number,
  windowMs: number
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    cleanExpiredLimits();

    const key = `${type}:${req.user.id}`;
    const now = Date.now();
    const limit = rateLimitStore.get(key);

    if (!limit || now > limit.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (limit.count >= maxRequests) {
      const resetIn = Math.ceil((limit.resetAt - now) / 1000 / 60);
      return res.status(429).json({
        message: `Limite de ${type === 'deposit' ? 'depósitos' : 'saques'} excedido. Tente novamente em ${resetIn} minutos.`,
      });
    }

    limit.count++;
    next();
  };
}

// Validação de valores
export function validateAmount(amount: number, min: number, max: number): string | null {
  if (isNaN(amount) || amount <= 0) {
    return 'Valor inválido';
  }
  if (amount < min) {
    return `Valor mínimo é R$ ${min.toFixed(2)}`;
  }
  if (amount > max) {
    return `Valor máximo é R$ ${max.toFixed(2)}`;
  }
  return null;
}

// Validação de CPF (algoritmo simplificado)
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // CPFs como 111.111.111-11

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Sanitização de CPF
export function sanitizeCPF(cpf: string): string {
  return cpf.replace(/[^\d]/g, '');
}

// Validação de email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Prevenir duplicatas (idempotência)
const recentTransactions = new Map<string, string>(); // userId:type -> transactionId

export function checkDuplicateTransaction(
  userId: string,
  type: 'deposit' | 'withdrawal',
  ttlMs: number = 60000 // 1 minuto
): string | null {
  const key = `${userId}:${type}`;
  const existing = recentTransactions.get(key);
  
  if (existing) {
    return existing;
  }
  
  const transactionId = crypto.randomUUID();
  recentTransactions.set(key, transactionId);
  
  // Auto-cleanup após TTL
  setTimeout(() => {
    recentTransactions.delete(key);
  }, ttlMs);
  
  return null; // Não é duplicata
}
