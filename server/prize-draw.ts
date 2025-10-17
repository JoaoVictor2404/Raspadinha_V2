import type { Prize } from "@shared/schema";

/**
 * Weighted random prize selection based on probability
 * Each prize has a probability field (0.0 to 1.0)
 * Example: prize with 0.10 = 10% chance, 0.01 = 1% chance
 */
export function drawPrize(prizes: Prize[]): Prize {
  // Validate probabilities sum to ~1.0
  const totalProbability = prizes.reduce((sum, p) => sum + parseFloat(p.probability), 0);
  
  if (Math.abs(totalProbability - 1.0) > 0.01) {
    console.warn(`Prize probabilities sum to ${totalProbability}, expected 1.0`);
  }

  // Generate random number between 0 and 1
  const random = Math.random();
  
  // Find prize based on cumulative probability
  let cumulativeProbability = 0;
  
  for (const prize of prizes) {
    cumulativeProbability += parseFloat(prize.probability);
    
    if (random <= cumulativeProbability) {
      return prize;
    }
  }
  
  // Fallback to last prize (should rarely happen)
  return prizes[prizes.length - 1];
}

/**
 * Validate if a prize draw is legitimate
 * Checks if the prize exists in the raspadinha's prize pool
 */
export function validatePrize(wonPrize: Prize, availablePrizes: Prize[]): boolean {
  return availablePrizes.some(p => p.id === wonPrize.id);
}

/**
 * Calculate expected return to player (RTP) for a raspadinha
 * RTP = (Sum of prize_amount * probability) / ticket_price
 */
export function calculateRTP(prizes: Prize[], ticketPrice: number): number {
  const expectedValue = prizes.reduce((sum, prize) => {
    return sum + (parseFloat(prize.amount) * parseFloat(prize.probability));
  }, 0);
  
  return (expectedValue / ticketPrice) * 100; // Return as percentage
}

/**
 * Get prize statistics for a raspadinha
 */
export function getPrizeStats(prizes: Prize[]) {
  const totalProbability = prizes.reduce((sum, p) => sum + parseFloat(p.probability), 0);
  const winProbability = prizes
    .filter(p => parseFloat(p.amount) > 0)
    .reduce((sum, p) => sum + parseFloat(p.probability), 0);
  
  const maxPrize = Math.max(...prizes.map(p => parseFloat(p.amount)));
  const avgPrize = prizes.reduce((sum, p) => {
    return sum + (parseFloat(p.amount) * parseFloat(p.probability));
  }, 0);

  return {
    totalProbability,
    winProbability: winProbability * 100, // as percentage
    loseProbability: (1 - winProbability) * 100, // as percentage
    maxPrize,
    avgPrize,
  };
}
