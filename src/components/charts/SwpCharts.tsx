import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { CHART_STYLES } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR, formatDate } from '../../utils/stockChartConfig';
import { SwpPortfolio } from '../../types/swpPortfolio';
import { formatCurrency } from '../../utils/numberFormat';

// ============================================================================
// TYPES
// ============================================================================

interface SwpChartsProps {
  swpData: Record<string, any[]>;
  COLORS: string[];
  swpPortfolios: SwpPortfolio[];
  years: number;
  initialCorpus: number;
  monthlyWithdrawal: number;
  chartView: 'survival' | 'corpus';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPortfolioLabel(portfolio: SwpPortfolio, idx: number): string {
  const assets = (portfolio.selectedAssets || []).filter(Boolean);
  if (assets.length === 0) return `Portfolio ${idx + 1}`;
  if (assets.length === 1) {
    const asset = assets[0]!;
    return asset.name || asset.displayName || `Portfolio ${idx + 1}`;
  }
  return `Portfolio ${idx + 1} (${assets.length} assets)`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SwpCharts: React.FC<SwpChartsProps> = ({
  swpData,
  COLORS,
  swpPortfolios,
  years,
  initialCorpus,
  monthlyWithdrawal,
  chartView,
}) => {
  if (!swpData || Object.keys(swpData).length === 0) return null;

  const portfolioNames = Object.keys(swpData);

  if (chartView === 'survival') {
    return (
      <SurvivalChart
        swpData={swpData}
        COLORS={COLORS}
        swpPortfolios={swpPortfolios}
        portfolioNames={portfolioNames}
        years={years}
        initialCorpus={initialCorpus}
        monthlyWithdrawal={monthlyWithdrawal}
      />
    );
  }

  return (
    <CorpusChart
      swpData={swpData}
      COLORS={COLORS}
      swpPortfolios={swpPortfolios}
      portfolioNames={portfolioNames}
      years={years}
      initialCorpus={initialCorpus}
      monthlyWithdrawal={monthlyWithdrawal}
    />
  );
};

// ============================================================================
// SURVIVAL RATE CHART
// ============================================================================

const SurvivalChart: React.FC<{
  swpData: Record<string, any[]>;
  COLORS: string[];
  swpPortfolios: SwpPortfolio[];
  portfolioNames: string[];
  years: number;
  initialCorpus: number;
  monthlyWithdrawal: number;
}> = ({ swpData, COLORS, swpPortfolios, portfolioNames, years, initialCorpus, monthlyWithdrawal }) => {
  // Calculate survival stats for each portfolio
  const summaryData = portfolioNames.map((name, idx) => {
    const data = swpData[name] || [];
    const totalWindows = data.length;
    const survivedWindows = data.filter((d: any) => d.survived).length;
    const survivalRate = totalWindows > 0 ? (survivedWindows / totalWindows) * 100 : 0;
    const avgFinalCorpus = totalWindows > 0
      ? data.reduce((sum: number, d: any) => sum + (d.finalCorpus || 0), 0) / totalWindows
      : 0;
    const avgMonths = totalWindows > 0
      ? data.reduce((sum: number, d: any) => sum + d.monthsSustained, 0) / totalWindows
      : 0;
    const avgWithdrawalYield = totalWindows > 0
      ? data.reduce((sum: number, d: any) => sum + (d.withdrawalYield || 0), 0) / totalWindows
      : 0;

    return {
      name,
      portfolioLabel: getPortfolioLabel(swpPortfolios[idx] || { selectedAssets: [], allocations: [] }, idx),
      survivalRate,
      avgFinalCorpus,
      avgMonths,
      avgWithdrawalYield,
      totalWindows,
      survivedWindows,
    };
  });

  // Time series: rolling survival indicator (1 = survived, 0 = failed)
  const series = portfolioNames.map((name, idx) => {
    const data = swpData[name] || [];
    return {
      name: getPortfolioLabel(swpPortfolios[idx] || { selectedAssets: [], allocations: [] }, idx),
      data: data.map((d: any) => [
        new Date(d.date).getTime(),
        d.monthsSustained,
      ]),
      color: COLORS[idx % COLORS.length],
      type: 'line' as const,
    };
  });

  const chartOptions: Highcharts.Options = {
    chart: { height: 400 },
    title: {
      text: `SWP Sustainability — Months Sustained (${years}yr windows)`,
      style: CHART_STYLES.title,
    },
    xAxis: {
      type: 'datetime',
      title: { text: 'SWP End Date', style: CHART_STYLES.axisTitle },
      labels: { style: CHART_STYLES.axisLabels },
    },
    yAxis: {
      title: { text: 'Months Sustained', style: CHART_STYLES.axisTitle },
      labels: { style: CHART_STYLES.axisLabels },
      plotLines: [{
        value: years * 12,
        color: '#008032',
        width: 2,
        dashStyle: 'Dash',
        label: { text: `Full period (${years * 12} months)`, style: { color: '#008032', fontWeight: '600' } }
      }],
    },
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        const points = this.points || [];
        let s = `<b>${formatDate(this.x as number)}</b><br/>`;
        points.forEach((p: any) => {
          const months = p.y;
          const yearsVal = Math.floor(months / 12);
          const monthsRem = months % 12;
          const survived = months >= years * 12;
          s += `<span style="color:${p.color}">\u25CF</span> ${p.series.name}: <b>${yearsVal}y ${monthsRem}m</b> ${survived ? '✓' : '✗'}<br/>`;
        });
        return s;
      },
    },
    series: series as any,
    navigator: STOCK_CHART_NAVIGATOR,
    scrollbar: STOCK_CHART_SCROLLBAR,
    rangeSelector: { enabled: false },
    credits: { enabled: false },
  };

  return (
    <Block>
      <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={chartOptions} />

      {/* Summary Table */}
      <Block marginTop="scale600" padding="scale600" backgroundColor="#fafafa"
        overrides={{ Block: { style: { borderRadius: '8px' } } }}>
        <HeadingSmall marginTop="0" marginBottom="scale400">SWP Summary</HeadingSmall>
        <Block as="table" width="100%"
          overrides={{ Block: { style: { borderCollapse: 'collapse', fontSize: '14px' } } }}>
          <thead>
            <tr>
              {['Portfolio', 'Survival Rate', 'Avg Months', 'Avg Final Corpus', 'Avg Withdrawal Yield', 'Windows Tested'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e4e4e7', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>
                  <span style={{ color: COLORS[idx % COLORS.length], fontWeight: 600 }}>{row.portfolioLabel}</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', fontWeight: 600, color: row.survivalRate >= 90 ? '#008032' : row.survivalRate >= 70 ? '#a65b00' : '#d32f2f' }}>
                  {row.survivalRate.toFixed(1)}%
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>
                  {Math.floor(row.avgMonths / 12)}y {Math.round(row.avgMonths % 12)}m
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>
                  {formatCurrency(row.avgFinalCorpus)}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>
                  {row.avgWithdrawalYield.toFixed(1)}%
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>
                  {row.totalWindows} ({row.survivedWindows} survived)
                </td>
              </tr>
            ))}
          </tbody>
        </Block>
        <ParagraphSmall color="contentTertiary" marginTop="scale300">
          Withdrawal: {formatCurrency(monthlyWithdrawal)}/month from {formatCurrency(initialCorpus)} initial corpus over {years} year rolling windows.
          Survival rate shows the % of historical windows where the corpus lasted the full period.
        </ParagraphSmall>
      </Block>
    </Block>
  );
};

// ============================================================================
// FINAL CORPUS CHART
// ============================================================================

const CorpusChart: React.FC<{
  swpData: Record<string, any[]>;
  COLORS: string[];
  swpPortfolios: SwpPortfolio[];
  portfolioNames: string[];
  years: number;
  initialCorpus: number;
  monthlyWithdrawal: number;
}> = ({ swpData, COLORS, swpPortfolios, portfolioNames, years, initialCorpus, monthlyWithdrawal }) => {
  const series = portfolioNames.map((name, idx) => {
    const data = swpData[name] || [];
    return {
      name: getPortfolioLabel(swpPortfolios[idx] || { selectedAssets: [], allocations: [] }, idx),
      data: data.map((d: any) => [
        new Date(d.date).getTime(),
        Math.round(d.finalCorpus),
      ]),
      color: COLORS[idx % COLORS.length],
      type: 'line' as const,
    };
  });

  const chartOptions: Highcharts.Options = {
    chart: { height: 400 },
    title: {
      text: `Rolling SWP Final Corpus (${years}yr windows, ${formatCurrency(monthlyWithdrawal)}/mo withdrawal)`,
      style: CHART_STYLES.title,
    },
    xAxis: {
      type: 'datetime',
      title: { text: 'SWP End Date', style: CHART_STYLES.axisTitle },
      labels: { style: CHART_STYLES.axisLabels },
    },
    yAxis: {
      title: { text: 'Final Corpus (₹)', style: CHART_STYLES.axisTitle },
      labels: {
        style: CHART_STYLES.axisLabels,
        formatter: function () { return formatCurrency(this.value as number); }
      },
      plotLines: [{
        value: initialCorpus,
        color: '#71717a',
        width: 1,
        dashStyle: 'Dash',
        label: { text: `Initial: ${formatCurrency(initialCorpus)}`, style: { color: '#71717a' } }
      }],
    },
    tooltip: {
      shared: true,
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        const points = this.points || [];
        let s = `<b>${formatDate(this.x as number)}</b><br/>`;
        points.forEach((p: any) => {
          s += `<span style="color:${p.color}">\u25CF</span> ${p.series.name}: <b>${formatCurrency(p.y)}</b><br/>`;
        });
        return s;
      },
    },
    series: series as any,
    navigator: STOCK_CHART_NAVIGATOR,
    scrollbar: STOCK_CHART_SCROLLBAR,
    rangeSelector: { enabled: false },
    credits: { enabled: false },
  };

  return (
    <Block>
      <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={chartOptions} />
    </Block>
  );
};
