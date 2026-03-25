import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { CHART_STYLES } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR, formatDate } from '../../utils/stockChartConfig';
import { LumpsumPortfolio } from '../../types/lumpsumPortfolio';
import { formatCurrency } from '../../utils/numberFormat';

interface HybridChartsProps {
  hybridData: Record<string, any[]>;
  COLORS: string[];
  portfolios: LumpsumPortfolio[];
  years: number;
  lumpsumAmount: number;
  sipAmount: number;
  chartView: 'xirr' | 'corpus';
}

function getPortfolioLabel(portfolio: LumpsumPortfolio, idx: number): string {
  const assets = (portfolio.selectedAssets || []).filter(Boolean);
  if (assets.length === 0) return `Portfolio ${idx + 1}`;
  if (assets.length === 1) return assets[0]!.name || assets[0]!.displayName || `Portfolio ${idx + 1}`;
  return `Portfolio ${idx + 1} (${assets.length} assets)`;
}

export const HybridCharts: React.FC<HybridChartsProps> = ({
  hybridData,
  COLORS,
  portfolios,
  years,
  lumpsumAmount,
  sipAmount,
  chartView,
}) => {
  if (!hybridData || Object.keys(hybridData).length === 0) return null;

  const portfolioNames = Object.keys(hybridData);

  if (chartView === 'xirr') {
    const series = portfolioNames.map((name, idx) => {
      const data = hybridData[name] || [];
      return {
        name: getPortfolioLabel(portfolios[idx] || { selectedAssets: [], allocations: [] }, idx),
        data: data.map((d: any) => [new Date(d.date).getTime(), Math.round(d.xirr * 10000) / 100]),
        color: COLORS[idx % COLORS.length],
        type: 'line' as const,
      };
    });

    const chartOptions: Highcharts.Options = {
      chart: { height: 400 },
      title: {
        text: `Hybrid (Lumpsum + SIP) Rolling ${years}-Year XIRR (%)`,
        style: CHART_STYLES.title,
      },
      xAxis: { type: 'datetime', labels: { style: CHART_STYLES.axisLabels } },
      yAxis: {
        title: { text: 'XIRR (%)', style: CHART_STYLES.axisTitle },
        labels: { style: CHART_STYLES.axisLabels, format: '{value}%' },
        plotLines: [{ value: 0, color: '#71717a', width: 1 }],
      },
      tooltip: {
        shared: true,
        formatter: function (this: Highcharts.TooltipFormatterContextObject) {
          const points = this.points || [];
          let s = `<b>${formatDate(this.x as number)}</b><br/>`;
          points.forEach((p: any) => {
            s += `<span style="color:${p.color}">\u25CF</span> ${p.series.name}: <b>${p.y.toFixed(2)}%</b><br/>`;
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
        <SummaryStats hybridData={hybridData} portfolioNames={portfolioNames} portfolios={portfolios} COLORS={COLORS} lumpsumAmount={lumpsumAmount} sipAmount={sipAmount} years={years} />
      </Block>
    );
  }

  // Corpus view
  const series = portfolioNames.map((name, idx) => {
    const data = hybridData[name] || [];
    return {
      name: getPortfolioLabel(portfolios[idx] || { selectedAssets: [], allocations: [] }, idx),
      data: data.map((d: any) => [new Date(d.date).getTime(), d.finalValue]),
      color: COLORS[idx % COLORS.length],
      type: 'line' as const,
    };
  });

  const totalInvested = lumpsumAmount + sipAmount * years * 12;

  const chartOptions: Highcharts.Options = {
    chart: { height: 400 },
    title: {
      text: `Hybrid Rolling ${years}-Year Final Corpus`,
      style: CHART_STYLES.title,
    },
    xAxis: { type: 'datetime', labels: { style: CHART_STYLES.axisLabels } },
    yAxis: {
      title: { text: 'Final Corpus (₹)', style: CHART_STYLES.axisTitle },
      labels: {
        style: CHART_STYLES.axisLabels,
        formatter: function () { return formatCurrency(this.value as number); }
      },
      plotLines: [{
        value: totalInvested,
        color: '#71717a',
        width: 1,
        dashStyle: 'Dash',
        label: { text: `Invested: ${formatCurrency(totalInvested)}`, style: { color: '#71717a' } }
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

// Summary Stats sub-component
const SummaryStats: React.FC<{
  hybridData: Record<string, any[]>;
  portfolioNames: string[];
  portfolios: LumpsumPortfolio[];
  COLORS: string[];
  lumpsumAmount: number;
  sipAmount: number;
  years: number;
}> = ({ hybridData, portfolioNames, portfolios, COLORS, lumpsumAmount, sipAmount, years }) => {
  const totalInvested = lumpsumAmount + sipAmount * years * 12;

  return (
    <Block marginTop="scale600" padding="scale600" backgroundColor="#fafafa"
      overrides={{ Block: { style: { borderRadius: '8px' } } }}>
      <HeadingSmall marginTop="0" marginBottom="scale400">Hybrid Investment Summary</HeadingSmall>
      <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="scale400">
        Lumpsum: {formatCurrency(lumpsumAmount)} + SIP: {formatCurrency(sipAmount)}/month for {years} years = Total invested: {formatCurrency(totalInvested)}
      </ParagraphSmall>
      <Block as="table" width="100%"
        overrides={{ Block: { style: { borderCollapse: 'collapse', fontSize: '14px' } } }}>
        <thead>
          <tr>
            {['Portfolio', 'Avg XIRR', 'Median XIRR', 'Best XIRR', 'Worst XIRR', 'Avg Final Value', 'Avg Drawdown'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e4e4e7', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {portfolioNames.map((name, idx) => {
            const data = hybridData[name] || [];
            if (data.length === 0) return null;
            const xirrs = data.map((d: any) => d.xirr * 100);
            const sorted = [...xirrs].sort((a, b) => a - b);
            const avg = xirrs.reduce((s: number, x: number) => s + x, 0) / xirrs.length;
            const median = sorted[Math.floor(sorted.length / 2)];
            const avgFinal = data.reduce((s: number, d: any) => s + d.finalValue, 0) / data.length;
            const avgDrawdown = data.reduce((s: number, d: any) => s + (d.maxDrawdown || 0), 0) / data.length;

            return (
              <tr key={idx}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', color: COLORS[idx % COLORS.length], fontWeight: 600 }}>
                  {getPortfolioLabel(portfolios[idx] || { selectedAssets: [], allocations: [] }, idx)}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>{avg.toFixed(2)}%</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>{median.toFixed(2)}%</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', color: '#008032' }}>{sorted[sorted.length - 1].toFixed(2)}%</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7', color: '#d32f2f' }}>{sorted[0].toFixed(2)}%</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>{formatCurrency(avgFinal)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e4e4e7' }}>{avgDrawdown.toFixed(2)}%</td>
              </tr>
            );
          })}
        </tbody>
      </Block>
    </Block>
  );
};
