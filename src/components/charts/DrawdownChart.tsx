import React from 'react';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Block } from 'baseui/block';
import { HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { useHelp } from '../help';
import { CHART_STYLES } from '../../constants';
import { STOCK_CHART_NAVIGATOR, STOCK_CHART_SCROLLBAR, formatDate, getAllDates } from '../../utils/stockChartConfig';

interface DrawdownChartProps {
  portfolioXirrData: Record<string, any[]>;
  COLORS: string[];
  years: number;
}

const getDrawdownSeries = (portfolioXirrData: Record<string, any[]>, COLORS: string[]) => {
  const allDates = getAllDates(portfolioXirrData);
  return Object.entries(portfolioXirrData).map(([portfolioName, data], idx) => {
    const dateToDrawdown: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      if (row.maxDrawdown !== undefined) {
        dateToDrawdown[formatDate(row.date)] = row.maxDrawdown;
      }
    });

    const seriesData = allDates.map(date => {
      const drawdown = dateToDrawdown[date];
      return drawdown !== undefined ? {
        x: new Date(date).getTime(),
        y: drawdown
      } : null;
    }).filter(point => point !== null);

    return {
      name: portfolioName,
      data: seriesData,
      type: 'area' as const,
      color: COLORS[idx % COLORS.length],
      fillOpacity: 0.15,
      lineWidth: 2,
      marker: { enabled: false },
      showInNavigator: true,
    };
  });
};

const getChartOptions = (years: number, portfolioXirrData: Record<string, any[]>, COLORS: string[]) => ({
  title: { text: undefined },
  credits: { enabled: false },
  chart: {
    backgroundColor: CHART_STYLES.colors.background,
    borderRadius: 8,
    spacing: [20, 20, 20, 20],
    height: 500,
    zooming: { mouseWheel: false }
  },
  legend: {
    enabled: true,
    itemStyle: CHART_STYLES.legend,
    itemHoverStyle: { color: '#09090b' }
  },
  xAxis: {
    type: 'datetime',
    title: { text: 'Date', style: CHART_STYLES.axisTitle },
    labels: { style: CHART_STYLES.axisLabels },
    gridLineColor: CHART_STYLES.colors.gridLine,
    lineColor: CHART_STYLES.colors.line,
    tickColor: CHART_STYLES.colors.tick
  },
  yAxis: {
    opposite: false,
    title: {
      text: 'Max Drawdown (%)',
      align: 'middle',
      rotation: -90,
      x: -10,
      style: CHART_STYLES.axisTitle
    },
    labels: {
      formatter: function (this: any) { return this.value.toFixed(1) + ' %'; },
      style: CHART_STYLES.axisLabels
    },
    gridLineColor: CHART_STYLES.colors.gridLine,
    lineColor: CHART_STYLES.colors.line,
    max: 0, // Drawdown is always negative or zero
    plotLines: [{ value: 0, color: '#71717a', dashStyle: 'Solid', width: 1, zIndex: 5 }]
  },
  rangeSelector: { enabled: false },
  navigator: STOCK_CHART_NAVIGATOR,
  scrollbar: STOCK_CHART_SCROLLBAR,
  tooltip: {
    shared: true,
    crosshairs: true,
    useHTML: true,
    backgroundColor: CHART_STYLES.colors.tooltipBackground,
    borderColor: CHART_STYLES.colors.tooltipBackground,
    borderRadius: 6,
    style: CHART_STYLES.tooltip,
    formatter: function (this: any) {
      let tooltipHTML = `<div style="font-size: 12px; color: #ffffff;"><strong>${Highcharts.dateFormat('%e %b %Y', this.x)}</strong><br/>`;

      const sortedPoints = this.points ?
        [...this.points].sort((a: any, b: any) => (b.y as number) - (a.y as number)) : [];

      sortedPoints.forEach((point: any) => {
        const formattedValue = (point.y as number).toFixed(2) + ' %';
        const color = point.series.color;
        tooltipHTML += `<span style="color:${color}">●</span> ${point.series.name}: <strong>${formattedValue}</strong><br/>`;
      });

      return tooltipHTML + '</div>';
    }
  },
  plotOptions: {
    series: {
      animation: false,
      marker: {
        enabled: false,
        states: { hover: { enabled: true, radius: 5 } }
      },
      states: { hover: { lineWidthPlus: 1 } }
    }
  },
  series: getDrawdownSeries(portfolioXirrData, COLORS)
});

export const DrawdownChart: React.FC<DrawdownChartProps> = ({ portfolioXirrData, COLORS, years }) => {
  const { openHelp } = useHelp();

  // Check if any portfolio has drawdown data
  const hasDrawdownData = Object.values(portfolioXirrData).some(data =>
    Array.isArray(data) && data.some(row => row.maxDrawdown !== undefined)
  );

  if (!hasDrawdownData) return null;

  const chartOptions = getChartOptions(years, portfolioXirrData, COLORS);
  const chartTitle = `Max Drawdown - Rolling ${years}Y`;

  return (
    <Block marginTop="2rem">
      {/* Chart Title and Subtitle */}
      <Block marginBottom="scale400" $style={{ textAlign: 'center' }}>
        <HeadingSmall marginTop="0" marginBottom="scale200">{chartTitle}</HeadingSmall>
        <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
          Shows the worst peak-to-trough decline during each rolling period — deeper means more risk.
        </ParagraphSmall>
        <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="0">
          Read{' '}
          <span
            onClick={() => openHelp('drawdown')}
            style={{ color: '#276EF1', cursor: 'pointer' }}
          >
            help
          </span>{' '}
          to know more.
        </ParagraphSmall>
      </Block>

      <Block>
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={chartOptions}
        />
      </Block>
    </Block>
  );
};
