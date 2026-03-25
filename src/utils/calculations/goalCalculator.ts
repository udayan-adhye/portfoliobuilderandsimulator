/**
 * Goal-Based SIP Calculator
 *
 * Calculates the required monthly SIP to reach a target corpus,
 * using historical return data to show a range of outcomes.
 */

/**
 * Calculate required monthly SIP to reach a goal amount,
 * given an expected annual return rate and time horizon.
 *
 * Formula: FV = P × [(1+r)^n - 1] / r × (1+r)
 * where FV = future value, P = monthly payment, r = monthly rate, n = number of months
 *
 * Solving for P: P = FV × r / [(1+r)^n - 1] / (1+r)
 */
export function calculateRequiredSip(
  goalAmount: number,
  annualReturnRate: number, // as percentage, e.g., 12 for 12%
  years: number,
  inflationRate: number = 0, // annual inflation rate as percentage
): {
  monthlySip: number;
  totalInvested: number;
  totalReturns: number;
  inflationAdjustedGoal: number;
} {
  // Adjust goal for inflation if specified
  const inflationAdjustedGoal = inflationRate > 0
    ? goalAmount * Math.pow(1 + inflationRate / 100, years)
    : goalAmount;

  const monthlyRate = annualReturnRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    // No return scenario
    const monthlySip = inflationAdjustedGoal / months;
    return {
      monthlySip: Math.ceil(monthlySip),
      totalInvested: Math.ceil(monthlySip) * months,
      totalReturns: 0,
      inflationAdjustedGoal,
    };
  }

  const factor = Math.pow(1 + monthlyRate, months);
  const monthlySip = inflationAdjustedGoal * monthlyRate / ((factor - 1) * (1 + monthlyRate));

  const totalInvested = Math.ceil(monthlySip) * months;
  const totalReturns = inflationAdjustedGoal - totalInvested;

  return {
    monthlySip: Math.ceil(monthlySip),
    totalInvested,
    totalReturns,
    inflationAdjustedGoal,
  };
}

/**
 * Calculate the future value of a SIP investment.
 * FV = P × [(1+r)^n - 1] / r × (1+r)
 */
export function calculateSipFutureValue(
  monthlySip: number,
  annualReturnRate: number,
  years: number,
): number {
  const monthlyRate = annualReturnRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) return monthlySip * months;

  const factor = Math.pow(1 + monthlyRate, months);
  return monthlySip * ((factor - 1) / monthlyRate) * (1 + monthlyRate);
}

/**
 * Calculate a range of scenarios for goal planning
 * using different return rates (conservative, moderate, aggressive).
 */
export function calculateGoalScenarios(
  goalAmount: number,
  years: number,
  inflationRate: number = 6,
): {
  conservative: ReturnType<typeof calculateRequiredSip> & { returnRate: number; label: string };
  moderate: ReturnType<typeof calculateRequiredSip> & { returnRate: number; label: string };
  aggressive: ReturnType<typeof calculateRequiredSip> & { returnRate: number; label: string };
} {
  return {
    conservative: {
      ...calculateRequiredSip(goalAmount, 8, years, inflationRate),
      returnRate: 8,
      label: 'Conservative (8% p.a.)',
    },
    moderate: {
      ...calculateRequiredSip(goalAmount, 12, years, inflationRate),
      returnRate: 12,
      label: 'Moderate (12% p.a.)',
    },
    aggressive: {
      ...calculateRequiredSip(goalAmount, 15, years, inflationRate),
      returnRate: 15,
      label: 'Aggressive (15% p.a.)',
    },
  };
}

/**
 * Common financial goals with typical timeframes (India-specific).
 */
export const GOAL_PRESETS = [
  { name: 'Emergency Fund', amount: 500000, years: 2, icon: '🏥' },
  { name: 'Car Purchase', amount: 1000000, years: 3, icon: '🚗' },
  { name: 'Home Down Payment', amount: 2500000, years: 5, icon: '🏠' },
  { name: 'Child Education', amount: 5000000, years: 10, icon: '🎓' },
  { name: 'Child Wedding', amount: 3000000, years: 15, icon: '💒' },
  { name: 'Retirement', amount: 50000000, years: 25, icon: '🌅' },
  { name: 'Custom Goal', amount: 0, years: 0, icon: '🎯' },
];
