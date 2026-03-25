import xirr from 'xirr';
import { NavEntry } from '../../../types/navData';
import { areDatesContinuous, getNthPreviousMonthDate } from '../../date/dateUtils';
import { fillMissingNavDates } from '../../data/fillMissingNavDates';
import { calculateMaxDrawdown } from '../drawdown';

/**
 * Hybrid Rolling XIRR — combines Lumpsum + SIP.
 *
 * How it works:
 * For each rolling window (e.g., 5 years ending at date D):
 *   1. Invest `lumpsumAmount` at the start of the window
 *   2. Additionally invest `sipAmount` every month
 *   3. Calculate the combined portfolio value at date D
 *   4. Compute XIRR on all the cashflows
 *
 * This mirrors how many Indian investors operate: deploy a lumpsum at start
 * and continue monthly SIPs.
 */

export interface HybridRollingEntry {
  date: Date;
  xirr: number;
  totalInvested: number;
  finalValue: number;
  maxDrawdown: number;
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function buildDateMap(fund: NavEntry[]): Map<string, NavEntry> {
  return new Map(fund.map(entry => [toDateKey(entry.date), entry]));
}

function getSortedDates(fund: NavEntry[]): NavEntry[] {
  return [...fund].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function calculateHybridRollingXirr(
  navDataList: NavEntry[][],
  years: number = 5,
  allocations: number[] = [],
  lumpsumAmount: number = 100000,
  sipAmount: number = 10000,
): HybridRollingEntry[] {
  const numFunds = navDataList.length;
  if (numFunds === 0 || navDataList.some(f => f.length < 2)) return [];

  const actualAllocations = allocations.length === numFunds
    ? allocations
    : Array(numFunds).fill(100 / numFunds);

  const filledNavs = navDataList.map(fund =>
    areDatesContinuous(fund) ? fund : fillMissingNavDates(fund)
  );
  const fundDateMaps = filledNavs.map(buildDateMap);
  const sorted = getSortedDates(filledNavs[0]);
  const firstDate = sorted[0].date;
  const months = years * 12;

  // Build date index map
  const dateIndexMap = new Map<string, number>();
  sorted.forEach((entry, idx) => dateIndexMap.set(toDateKey(entry.date), idx));

  // Pre-compute all NAVs for fast lookup
  const allNavs: number[][] = sorted.map(entry => {
    const dateKey = toDateKey(entry.date);
    return fundDateMaps.map(dmap => dmap.get(dateKey)?.nav ?? 0);
  });

  const results: HybridRollingEntry[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const endDate = sorted[i].date;
    const startDate = getNthPreviousMonthDate(endDate, months);
    if (startDate < firstDate) continue;

    const startKey = toDateKey(startDate);
    const startIdx = dateIndexMap.get(startKey);
    if (startIdx === undefined) continue;

    const startNavs = allNavs[startIdx];
    if (startNavs.some(n => n === 0)) continue;

    // 1. Lumpsum: buy units at start
    const lumpsumUnits: number[] = actualAllocations.map((alloc, f) => {
      return (lumpsumAmount * alloc / 100) / startNavs[f];
    });

    // 2. SIP: buy units each month
    const sipUnitsTotal: number[] = new Array(numFunds).fill(0);
    const cashflows: { amount: number; when: Date }[] = [
      { amount: -lumpsumAmount, when: startDate }
    ];

    let totalInvested = lumpsumAmount;

    for (let m = 1; m <= months; m++) {
      const sipDate = new Date(startDate);
      sipDate.setMonth(sipDate.getMonth() + m);
      const sipKey = toDateKey(sipDate);

      let validDate = true;
      for (let f = 0; f < numFunds; f++) {
        const navEntry = fundDateMaps[f].get(sipKey);
        if (!navEntry || navEntry.nav === 0) { validDate = false; break; }
        sipUnitsTotal[f] += (sipAmount * actualAllocations[f] / 100) / navEntry.nav;
      }

      if (validDate) {
        cashflows.push({ amount: -sipAmount, when: sipDate });
        totalInvested += sipAmount;
      }
    }

    // 3. Calculate final value
    const endNavs = allNavs[i];
    let finalValue = 0;
    for (let f = 0; f < numFunds; f++) {
      finalValue += (lumpsumUnits[f] + sipUnitsTotal[f]) * endNavs[f];
    }

    cashflows.push({ amount: finalValue, when: endDate });

    // 4. XIRR
    let xirrValue: number;
    try {
      xirrValue = xirr(cashflows);
    } catch {
      continue;
    }

    // 5. Max drawdown: compute daily portfolio values
    const dailyValues: { date: Date; totalValue: number }[] = [];
    // For simplicity, compute using lumpsum units only (SIP units are purchased progressively)
    // This is a reasonable approximation for drawdown
    for (let j = startIdx; j <= i; j++) {
      const dateNavs = allNavs[j];
      let portValue = 0;
      for (let f = 0; f < numFunds; f++) {
        portValue += lumpsumUnits[f] * dateNavs[f];
        // Add SIP units proportionally (approximate)
        const monthsElapsed = Math.round(
          (sorted[j].date.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
        );
        if (monthsElapsed > 0) {
          const sipFractionOwned = Math.min(monthsElapsed / months, 1);
          portValue += sipUnitsTotal[f] * sipFractionOwned * dateNavs[f];
        }
      }
      dailyValues.push({ date: sorted[j].date, totalValue: portValue });
    }
    const drawdownResult = calculateMaxDrawdown(dailyValues);
    const maxDrawdownPct = Math.round(drawdownResult.maxDrawdown * 10000) / 100;

    results.push({
      date: endDate,
      xirr: Math.round(xirrValue * 10000) / 10000,
      totalInvested,
      finalValue: Math.round(finalValue),
      maxDrawdown: maxDrawdownPct,
    });
  }

  return results;
}
