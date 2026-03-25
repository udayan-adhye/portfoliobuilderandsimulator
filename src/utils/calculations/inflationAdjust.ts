/**
 * Inflation-adjusted returns calculator
 *
 * Converts nominal returns to real (inflation-adjusted) returns.
 * A 12% nominal return with 6% inflation is really only ~5.66% in purchasing power.
 *
 * Formula: realReturn = ((1 + nominalReturn) / (1 + inflationRate)) - 1
 *
 * This uses the Fisher equation which properly accounts for the compounding
 * relationship between real returns, nominal returns, and inflation.
 */

/**
 * Convert a nominal XIRR return to a real (inflation-adjusted) return
 *
 * @param nominalXirr - Nominal XIRR as a decimal (e.g., 0.12 for 12%)
 * @param annualInflationRate - Annual inflation rate as a decimal (e.g., 0.06 for 6%)
 * @returns Real XIRR as a decimal
 */
export function adjustForInflation(nominalXirr: number, annualInflationRate: number): number {
  // Fisher equation: (1 + real) = (1 + nominal) / (1 + inflation)
  if (annualInflationRate === -1) return nominalXirr; // Avoid division by zero
  return ((1 + nominalXirr) / (1 + annualInflationRate)) - 1;
}

/**
 * Get the average annual inflation rate for a given period
 *
 * @param yearlyRates - Map of year → inflation rate as percentage (e.g., 6.5 for 6.5%)
 * @param startDate - Start of the investment period
 * @param endDate - End of the investment period
 * @returns Average annual inflation rate as a decimal (e.g., 0.065 for 6.5%)
 */
export function getAverageInflationForPeriod(
  yearlyRates: Map<number, number>,
  startDate: Date,
  endDate: Date
): number {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  let totalRate = 0;
  let count = 0;

  for (let year = startYear; year <= endYear; year++) {
    const rate = yearlyRates.get(year);
    if (rate !== undefined) {
      totalRate += rate;
      count++;
    }
  }

  if (count === 0) return 0;

  // Return as decimal (e.g., 0.065 for 6.5%)
  return (totalRate / count) / 100;
}

/**
 * Adjust an array of rolling XIRR entries for inflation
 *
 * @param entries - Rolling XIRR entries (each has .date and .xirr as decimal)
 * @param yearlyRates - Map of year → inflation rate as percentage
 * @param years - Rolling period in years (to determine the start date for each entry)
 * @returns New array with adjusted XIRR values
 */
export function adjustRollingXirrForInflation(
  entries: Array<{ date: Date; xirr: number; [key: string]: any }>,
  yearlyRates: Map<number, number>,
  years: number
): Array<{ date: Date; xirr: number; [key: string]: any }> {
  return entries.map(entry => {
    // The entry date is the END date. Start date is (years) before that.
    const startDate = new Date(entry.date);
    startDate.setFullYear(startDate.getFullYear() - years);

    const avgInflation = getAverageInflationForPeriod(yearlyRates, startDate, entry.date);
    const realXirr = adjustForInflation(entry.xirr, avgInflation);

    return {
      ...entry,
      xirr: Math.round(realXirr * 10000) / 10000,
    };
  });
}
