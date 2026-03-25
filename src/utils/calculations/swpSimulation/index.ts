import { NavEntry } from '../../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../../date/dateUtils';
import { fillMissingNavDates } from '../../data/fillMissingNavDates';

// ============================================================================
// TYPES
// ============================================================================

export interface SwpMonthlyEntry {
  date: Date;
  withdrawal: number;
  remainingCorpus: number;
  totalWithdrawn: number;
  portfolioReturn: number; // percentage return since start
}

export interface SwpSimulationResult {
  startDate: Date;
  endDate: Date;
  initialCorpus: number;
  monthlyWithdrawal: number;
  finalCorpus: number;
  totalWithdrawn: number;
  monthsSustained: number; // how many months before corpus ran out (or total months if survived)
  survived: boolean; // did the corpus last the full period?
  monthlyEntries: SwpMonthlyEntry[];
  annualizedReturn: number; // XIRR of the SWP
}

export interface SwpRollingEntry {
  date: Date; // end date of each rolling window
  finalCorpus: number;
  totalWithdrawn: number;
  monthsSustained: number;
  survived: boolean;
  annualizedReturn: number;
  withdrawalYield: number; // total withdrawn / initial corpus as percentage
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildDateMap(fund: NavEntry[]): Map<string, NavEntry> {
  return new Map(fund.map(entry => [toDateKey(entry.date), entry]));
}

function ensureContinuousDates(fund: NavEntry[]): NavEntry[] {
  return areDatesContinuous(fund) ? fund : fillMissingNavDates(fund);
}

function getSortedDates(fund: NavEntry[]): NavEntry[] {
  return [...fund].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get the next month's date (same day or last day of month)
 */
function getNextMonthDate(date: Date): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * Find the closest date in the sorted nav data that is on or after the target date
 */
function findClosestDate(sorted: NavEntry[], targetDate: Date): NavEntry | null {
  const targetTime = targetDate.getTime();
  for (const entry of sorted) {
    if (entry.date.getTime() >= targetTime) return entry;
  }
  return null;
}

// ============================================================================
// SINGLE SWP SIMULATION
// ============================================================================

/**
 * Simulate an SWP starting from startDate for a given number of years.
 *
 * How it works:
 * 1. Invest `initialCorpus` at `startDate`, buying units of each fund per allocation
 * 2. Each month, sell enough units to withdraw `monthlyWithdrawal`
 * 3. Track remaining corpus, total withdrawn, and whether the corpus survived
 *
 * @param navDataList - Array of NAV data for each fund
 * @param startDate - When the SWP starts
 * @param years - Duration in years
 * @param initialCorpus - Starting investment amount
 * @param monthlyWithdrawal - Amount to withdraw each month
 * @param allocations - Fund allocation percentages
 */
export function simulateSwp(
  navDataList: NavEntry[][],
  startDate: Date,
  years: number,
  initialCorpus: number,
  monthlyWithdrawal: number,
  allocations: number[] = []
): SwpSimulationResult | null {
  const numFunds = navDataList.length;
  if (numFunds === 0) return null;

  const actualAllocations = allocations.length === numFunds
    ? allocations
    : Array(numFunds).fill(100 / numFunds);

  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const sorted = getSortedDates(filledNavs[0]);

  const startKey = toDateKey(startDate);

  // Buy units at start
  const fundUnits: number[] = [];
  for (let f = 0; f < numFunds; f++) {
    const navEntry = fundDateMaps[f].get(startKey);
    if (!navEntry) return null;
    const fundAmount = (initialCorpus * actualAllocations[f]) / 100;
    fundUnits[f] = fundAmount / navEntry.nav;
  }

  const totalMonths = years * 12;
  const monthlyEntries: SwpMonthlyEntry[] = [];
  let totalWithdrawn = 0;
  let monthsSustained = 0;
  let survived = true;
  let currentDate = new Date(startDate);

  // Record initial state
  monthlyEntries.push({
    date: new Date(startDate),
    withdrawal: 0,
    remainingCorpus: initialCorpus,
    totalWithdrawn: 0,
    portfolioReturn: 0,
  });

  for (let month = 1; month <= totalMonths; month++) {
    currentDate = getNextMonthDate(startDate);
    // Set month relative to startDate to avoid compounding month drift
    currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + month);

    const dateKey = toDateKey(currentDate);

    // Calculate current portfolio value
    let portfolioValue = 0;
    for (let f = 0; f < numFunds; f++) {
      const navEntry = fundDateMaps[f].get(dateKey);
      if (!navEntry) {
        // Try finding closest date
        const closest = findClosestDate(sorted, currentDate);
        if (!closest) continue;
        const closestKey = toDateKey(closest.date);
        const closestNav = fundDateMaps[f].get(closestKey);
        if (closestNav) {
          portfolioValue += fundUnits[f] * closestNav.nav;
        }
        continue;
      }
      portfolioValue += fundUnits[f] * navEntry.nav;
    }

    // Check if corpus can sustain withdrawal
    if (portfolioValue <= monthlyWithdrawal) {
      // Corpus exhausted — withdraw whatever is left
      totalWithdrawn += portfolioValue;
      monthsSustained = month;
      survived = false;

      monthlyEntries.push({
        date: new Date(currentDate),
        withdrawal: portfolioValue,
        remainingCorpus: 0,
        totalWithdrawn,
        portfolioReturn: ((totalWithdrawn - initialCorpus) / initialCorpus) * 100,
      });
      break;
    }

    // Sell units proportionally from each fund
    for (let f = 0; f < numFunds; f++) {
      const navEntry = fundDateMaps[f].get(dateKey);
      if (!navEntry) continue;

      // Withdraw proportionally based on current value
      const fundValue = fundUnits[f] * navEntry.nav;
      const fundWithdrawPortion = (fundValue / portfolioValue) * monthlyWithdrawal;
      const unitsToSell = fundWithdrawPortion / navEntry.nav;
      fundUnits[f] = Math.max(0, fundUnits[f] - unitsToSell);
    }

    totalWithdrawn += monthlyWithdrawal;
    monthsSustained = month;

    // Recalculate remaining corpus after withdrawal
    let remainingCorpus = 0;
    for (let f = 0; f < numFunds; f++) {
      const navEntry = fundDateMaps[f].get(dateKey);
      if (!navEntry) continue;
      remainingCorpus += fundUnits[f] * navEntry.nav;
    }

    monthlyEntries.push({
      date: new Date(currentDate),
      withdrawal: monthlyWithdrawal,
      remainingCorpus,
      totalWithdrawn,
      portfolioReturn: ((totalWithdrawn + remainingCorpus - initialCorpus) / initialCorpus) * 100,
    });
  }

  if (survived) {
    monthsSustained = totalMonths;
  }

  const finalCorpus = monthlyEntries[monthlyEntries.length - 1]?.remainingCorpus ?? 0;

  // Simple annualized return: treat initial as outflow, all withdrawals + final corpus as inflow
  const totalReturn = (totalWithdrawn + finalCorpus - initialCorpus) / initialCorpus;
  const yearsActual = monthsSustained / 12;
  const annualizedReturn = yearsActual > 0 ? (Math.pow(1 + totalReturn, 1 / yearsActual) - 1) * 100 : 0;

  const endDate = monthlyEntries[monthlyEntries.length - 1]?.date ?? startDate;

  return {
    startDate,
    endDate,
    initialCorpus,
    monthlyWithdrawal,
    finalCorpus,
    totalWithdrawn,
    monthsSustained,
    survived,
    monthlyEntries,
    annualizedReturn,
  };
}

// ============================================================================
// ROLLING SWP SIMULATION (over every possible start date)
// ============================================================================

/**
 * Run rolling SWP simulations across all possible start dates.
 * For each possible start date, simulates the SWP for `years` years
 * and records the outcome.
 *
 * This shows how an SWP would have performed starting at any historical point.
 */
export function calculateRollingSwp(
  navDataList: NavEntry[][],
  years: number,
  initialCorpus: number,
  monthlyWithdrawal: number,
  allocations: number[] = []
): SwpRollingEntry[] {
  const numFunds = navDataList.length;
  if (numFunds === 0) return [];

  const actualAllocations = allocations.length === numFunds
    ? allocations
    : Array(numFunds).fill(100 / numFunds);

  const filledNavs = navDataList.map(ensureContinuousDates);
  const fundDateMaps = filledNavs.map(buildDateMap);
  const sorted = getSortedDates(filledNavs[0]);

  if (sorted.length === 0) return [];

  const totalMonths = years * 12;
  const lastPossibleStartDate = new Date(sorted[sorted.length - 1].date);
  lastPossibleStartDate.setMonth(lastPossibleStartDate.getMonth() - totalMonths);

  const results: SwpRollingEntry[] = [];

  // Iterate over all possible start dates (monthly granularity for performance)
  let prevMonth = -1;
  for (const entry of sorted) {
    const entryMonth = entry.date.getFullYear() * 12 + entry.date.getMonth();
    if (entryMonth === prevMonth) continue; // Skip same month (one simulation per month)
    prevMonth = entryMonth;

    if (entry.date > lastPossibleStartDate) break;

    const startDate = entry.date;
    const startKey = toDateKey(startDate);

    // Buy units at start
    const fundUnits: number[] = [];
    let validStart = true;
    for (let f = 0; f < numFunds; f++) {
      const navEntry = fundDateMaps[f].get(startKey);
      if (!navEntry) { validStart = false; break; }
      const fundAmount = (initialCorpus * actualAllocations[f]) / 100;
      fundUnits[f] = fundAmount / navEntry.nav;
    }
    if (!validStart) continue;

    // Simulate withdrawals
    let totalWithdrawn = 0;
    let monthsSustained = 0;
    let survived = true;
    let finalCorpus = initialCorpus;

    for (let month = 1; month <= totalMonths; month++) {
      const withdrawDate = new Date(startDate);
      withdrawDate.setMonth(withdrawDate.getMonth() + month);
      const dateKey = toDateKey(withdrawDate);

      // Calculate portfolio value
      let portfolioValue = 0;
      for (let f = 0; f < numFunds; f++) {
        const navEntry = fundDateMaps[f].get(dateKey);
        if (!navEntry) continue;
        portfolioValue += fundUnits[f] * navEntry.nav;
      }

      if (portfolioValue <= monthlyWithdrawal) {
        totalWithdrawn += portfolioValue;
        monthsSustained = month;
        survived = false;
        finalCorpus = 0;
        break;
      }

      // Sell proportionally
      for (let f = 0; f < numFunds; f++) {
        const navEntry = fundDateMaps[f].get(dateKey);
        if (!navEntry) continue;
        const fundValue = fundUnits[f] * navEntry.nav;
        const fundWithdraw = (fundValue / portfolioValue) * monthlyWithdrawal;
        fundUnits[f] = Math.max(0, fundUnits[f] - fundWithdraw / navEntry.nav);
      }

      totalWithdrawn += monthlyWithdrawal;
      monthsSustained = month;

      // Update final corpus
      finalCorpus = 0;
      for (let f = 0; f < numFunds; f++) {
        const navEntry = fundDateMaps[f].get(dateKey);
        if (!navEntry) continue;
        finalCorpus += fundUnits[f] * navEntry.nav;
      }
    }

    if (survived) monthsSustained = totalMonths;

    const totalReturn = (totalWithdrawn + finalCorpus - initialCorpus) / initialCorpus;
    const yearsActual = monthsSustained / 12;
    const annualizedReturn = yearsActual > 0 ? (Math.pow(1 + totalReturn, 1 / yearsActual) - 1) * 100 : 0;
    const withdrawalYield = (totalWithdrawn / initialCorpus) * 100;

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsSustained);

    results.push({
      date: endDate,
      finalCorpus,
      totalWithdrawn,
      monthsSustained,
      survived,
      annualizedReturn,
      withdrawalYield,
    });
  }

  return results;
}
