import React, { useMemo } from 'react';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';

interface RiskSummaryTableProps {
  portfolioXirrData: Record<string, any[]>;
  COLORS: string[];
  years: number;
}

interface PortfolioRiskStats {
  portfolioName: string;
  color: string;
  // Return metrics
  avgXirr: number;
  medianXirr: number;
  bestXirr: number;
  worstXirr: number;
  // Risk metrics
  avgVolatility: number;
  avgMaxDrawdown: number;
  worstMaxDrawdown: number;
  negativeReturnPct: number;
  // Risk-adjusted
  sharpeRatio: number; // Using 6% as risk-free rate (India context)
}

const RISK_FREE_RATE = 0.06; // 6% — approximate Indian risk-free rate

function computeRiskStats(
  portfolioName: string,
  data: any[],
  color: string,
): PortfolioRiskStats | null {
  const validEntries = (data || []).filter(
    (row: any) => typeof row.xirr === 'number'
  );

  if (validEntries.length === 0) return null;

  const xirrs = validEntries.map((r: any) => r.xirr);
  const volatilities = validEntries
    .filter((r: any) => typeof r.volatility === 'number')
    .map((r: any) => r.volatility);
  const drawdowns = validEntries
    .filter((r: any) => typeof r.maxDrawdown === 'number')
    .map((r: any) => r.maxDrawdown);

  const sorted = [...xirrs].sort((a, b) => a - b);
  const avgXirr = xirrs.reduce((s: number, v: number) => s + v, 0) / xirrs.length;
  const medianXirr =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const avgVolatility =
    volatilities.length > 0
      ? volatilities.reduce((s: number, v: number) => s + v, 0) / volatilities.length
      : 0;
  const avgMaxDrawdown =
    drawdowns.length > 0
      ? drawdowns.reduce((s: number, v: number) => s + v, 0) / drawdowns.length
      : 0;
  const worstMaxDrawdown =
    drawdowns.length > 0 ? Math.min(...drawdowns) : 0;

  const negativeReturnPct =
    (xirrs.filter((v: number) => v < 0).length / xirrs.length) * 100;

  // Sharpe ratio = (avg return - risk free rate) / standard deviation of returns
  const stdDev = Math.sqrt(
    xirrs.reduce((s: number, v: number) => s + (v - avgXirr) ** 2, 0) /
      xirrs.length,
  );
  const sharpeRatio = stdDev > 0 ? (avgXirr - RISK_FREE_RATE) / stdDev : 0;

  return {
    portfolioName,
    color,
    avgXirr,
    medianXirr,
    bestXirr: sorted[sorted.length - 1],
    worstXirr: sorted[0],
    avgVolatility,
    avgMaxDrawdown,
    worstMaxDrawdown,
    negativeReturnPct,
    sharpeRatio,
  };
}

export const RiskSummaryTable: React.FC<RiskSummaryTableProps> = ({
  portfolioXirrData,
  COLORS,
  years,
}) => {
  const stats = useMemo(() => {
    return Object.entries(portfolioXirrData || {})
      .map(([name, data], idx) =>
        computeRiskStats(name, data, COLORS[idx % COLORS.length]),
      )
      .filter(Boolean) as PortfolioRiskStats[];
  }, [portfolioXirrData, COLORS]);

  if (stats.length === 0) return null;

  // Helper to color-code the best value
  const ranked = (
    values: number[],
    formatted: string[],
    higherIsBetter: boolean,
  ) => {
    if (values.length < 2) return formatted.map((f) => <span>{f}</span>);
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
    return values.map((v, i) => (
      <span
        key={i}
        style={{
          color: v === best ? '#16a34a' : undefined,
          fontWeight: v === best ? 600 : undefined,
        }}
      >
        {formatted[i]}
      </span>
    ));
  };

  const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
  const pctRaw = (v: number) => `${v.toFixed(2)}%`;
  const num = (v: number) => v.toFixed(2);

  const portfolioCol = (row: PortfolioRiskStats) => (
    <span>
      <span style={{ color: row.color, marginRight: 6 }}>●</span>
      {row.portfolioName}
    </span>
  );

  // Return metrics table
  const returnColumns = ['Portfolio', 'Avg Return', 'Median', 'Best', 'Worst', '% Negative'];
  const returnKeys = [
    { key: 'avgXirr', fmt: pct, better: true },
    { key: 'medianXirr', fmt: pct, better: true },
    { key: 'bestXirr', fmt: pct, better: true },
    { key: 'worstXirr', fmt: pct, better: true },
    { key: 'negativeReturnPct', fmt: pctRaw, better: false },
  ];
  const returnRanked = returnKeys.map((col) =>
    ranked(
      stats.map((r: any) => r[col.key]),
      stats.map((r: any) => col.fmt(r[col.key])),
      col.better,
    ),
  );
  const returnData = stats.map((row, ri) => [
    portfolioCol(row),
    ...returnKeys.map((_, ci) => returnRanked[ci][ri]),
  ]);

  // Risk metrics table
  const riskColumns = [
    'Portfolio',
    'Avg Volatility',
    'Avg Drawdown',
    'Worst Drawdown',
    'Sharpe Ratio',
  ];
  const riskKeys = [
    { key: 'avgVolatility', fmt: pctRaw, better: false },
    { key: 'avgMaxDrawdown', fmt: pctRaw, better: false },
    { key: 'worstMaxDrawdown', fmt: pctRaw, better: false },
    { key: 'sharpeRatio', fmt: num, better: true },
  ];
  const riskRanked = riskKeys.map((col) => {
    // For drawdown: less negative is better, so "higher is better"
    const isBetter = col.key === 'sharpeRatio'
      ? true
      : col.key.includes('Drawdown')
        ? true   // Higher (less negative) drawdown is better
        : false; // Lower volatility is better
    return ranked(
      stats.map((r: any) => r[col.key]),
      stats.map((r: any) => col.fmt(r[col.key])),
      isBetter,
    );
  });
  const riskData = stats.map((row, ri) => [
    portfolioCol(row),
    ...riskKeys.map((_, ci) => riskRanked[ci][ri]),
  ]);

  return (
    <Block marginTop="2rem">
      <Block marginBottom="scale400" $style={{ textAlign: 'center' }}>
        <HeadingSmall marginTop="0" marginBottom="scale200">
          Risk & Return Summary - Rolling {years}Y
        </HeadingSmall>
        <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
          Side-by-side comparison of return and risk metrics across portfolios. Green
          highlights the best value in each column.
        </ParagraphSmall>
      </Block>

      <Block
        display="flex"
        flexDirection={['column', 'column', 'row']}
        justifyContent="center"
        gridGap="scale600"
      >
        {/* Return Metrics */}
        <Block $style={{ overflowX: 'auto' }}>
          <ParagraphSmall
            marginTop="0"
            marginBottom="scale300"
            $style={{ fontWeight: 600, textAlign: 'center' }}
          >
            Return Metrics
          </ParagraphSmall>
          <Table columns={returnColumns} data={returnData} divider="grid" size="compact" />
        </Block>

        {/* Risk Metrics */}
        <Block $style={{ overflowX: 'auto' }}>
          <ParagraphSmall
            marginTop="0"
            marginBottom="scale300"
            $style={{ fontWeight: 600, textAlign: 'center' }}
          >
            Risk Metrics
          </ParagraphSmall>
          <Table columns={riskColumns} data={riskData} divider="grid" size="compact" />
        </Block>
      </Block>
    </Block>
  );
};
