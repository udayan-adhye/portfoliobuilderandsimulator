/**
 * Drawdown calculation utilities
 *
 * Max drawdown measures the largest peak-to-trough decline in portfolio value.
 * It answers: "What's the worst loss I could have experienced during this period?"
 *
 * A drawdown of -20% means the portfolio fell 20% from its highest point before recovering.
 * This is one of the most important risk metrics for investors.
 */

export interface DrawdownResult {
  /** Maximum drawdown as a decimal (e.g., -0.20 for a 20% decline) */
  maxDrawdown: number;
  /** Date when the peak occurred (before the decline) */
  peakDate: Date;
  /** Date when the trough occurred (bottom of the decline) */
  troughDate: Date;
}

interface DailyValue {
  date: Date;
  totalValue: number;
}

/**
 * Calculate maximum drawdown from daily portfolio values
 *
 * Algorithm:
 * 1. Track the running peak (highest value seen so far)
 * 2. At each point, calculate how far the current value is below the peak
 * 3. The maximum of all these "distance from peak" values is the max drawdown
 *
 * @param dailyValues - Array of daily portfolio values (must be sorted by date)
 * @returns DrawdownResult with maxDrawdown as a negative percentage decimal,
 *          or { maxDrawdown: 0 } if no drawdown occurred
 */
export function calculateMaxDrawdown(dailyValues: DailyValue[]): DrawdownResult {
  if (dailyValues.length < 2) {
    return { maxDrawdown: 0, peakDate: dailyValues[0]?.date || new Date(), troughDate: dailyValues[0]?.date || new Date() };
  }

  let peak = dailyValues[0].totalValue;
  let peakDate = dailyValues[0].date;
  let maxDrawdown = 0;
  let maxDrawdownPeakDate = dailyValues[0].date;
  let maxDrawdownTroughDate = dailyValues[0].date;

  for (let i = 1; i < dailyValues.length; i++) {
    const currentValue = dailyValues[i].totalValue;

    // Update peak if we have a new high
    if (currentValue > peak) {
      peak = currentValue;
      peakDate = dailyValues[i].date;
    }

    // Calculate drawdown from peak (will be negative or zero)
    if (peak > 0) {
      const drawdown = (currentValue - peak) / peak;

      // Track the worst (most negative) drawdown
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPeakDate = peakDate;
        maxDrawdownTroughDate = dailyValues[i].date;
      }
    }
  }

  return {
    maxDrawdown,
    peakDate: maxDrawdownPeakDate,
    troughDate: maxDrawdownTroughDate,
  };
}

/**
 * Calculate drawdown series - the drawdown value at every point in time
 * Useful for plotting a drawdown chart over time
 *
 * @param dailyValues - Array of daily portfolio values (must be sorted by date)
 * @returns Array of { date, drawdown } where drawdown is a negative percentage decimal
 */
export function calculateDrawdownSeries(dailyValues: DailyValue[]): { date: Date; drawdown: number }[] {
  if (dailyValues.length < 2) return [];

  let peak = dailyValues[0].totalValue;
  const series: { date: Date; drawdown: number }[] = [];

  for (let i = 0; i < dailyValues.length; i++) {
    const currentValue = dailyValues[i].totalValue;

    if (currentValue > peak) {
      peak = currentValue;
    }

    const drawdown = peak > 0 ? (currentValue - peak) / peak : 0;
    series.push({ date: dailyValues[i].date, drawdown });
  }

  return series;
}
