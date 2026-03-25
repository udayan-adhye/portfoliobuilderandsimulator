import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { ParagraphMedium } from 'baseui/typography';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { usePlotState } from '../hooks/usePlotState';
import { useSwpPortfolios } from '../hooks/useSwpPortfolios';
import { useSwpPlot } from '../hooks/useSwpPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { SwpPortfolioList } from '../components/swp-simulator/SwpPortfolioList';
import { SwpControlsPanel } from '../components/controls/SwpControlsPanel';
import { SwpCharts } from '../components/charts/SwpCharts';
import { DEFAULT_SCHEME_CODE, ALLOCATION_TOTAL } from '../constants';
import { useMutualFundsContext } from '../hooks/useMutualFunds';

interface SwpSimulatorTabProps {
  loadNavData: (schemeCode: number) => Promise<any[]>;
}

export const SwpSimulatorTab: React.FC<SwpSimulatorTabProps> = ({ loadNavData }) => {
  const { loading: fundsLoading, error: fundsError } = useMutualFundsContext();
  const location = useLocation();
  const isActive = location.pathname === '/swp';
  const plotState = usePlotState(loadNavData);
  const [initialCorpus, setInitialCorpus] = useState<number>(5000000); // 50 lakhs
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState<number>(25000);
  const [chartView, setChartView] = useState<'survival' | 'corpus'>('survival');

  const {
    swpPortfolios,
    setSwpPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleAssetSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
  } = useSwpPortfolios(DEFAULT_SCHEME_CODE);

  const { handlePlotAllPortfolios } = useSwpPlot({
    swpPortfolios,
    years,
    loadNavData,
    plotState,
    initialCorpus,
    monthlyWithdrawal,
  });

  const hasMutualFund = swpPortfolios.some(
    p => (p.selectedAssets || []).some(a => a?.type === 'mutual_fund')
  );
  const anyInvalidAlloc = swpPortfolios.some(
    p => (p.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0) !== ALLOCATION_TOTAL
      || (p.selectedAssets || []).some(a => !a)
  ) || (hasMutualFund && (fundsLoading || !!fundsError));

  const { invalidateChart, withInvalidation } = useChartInvalidation(plotState);

  const handleAddPortfolioInvalidate = withInvalidation(handleAddPortfolio);
  const handleAddFundInvalidate = withInvalidation(handleAddFund);
  const handleRemoveFundInvalidate = withInvalidation(handleRemoveFund);
  const handleAllocationChangeInvalidate = withInvalidation(handleAllocationChange);
  const handleYearsChange = invalidateChart;

  const handleChartViewChange = (view: 'survival' | 'corpus') => {
    setChartView(view);
    // Don't invalidate — just re-render with same data
  };

  return (
    <Block position="relative">
      <LoadingOverlay active={plotState.loadingNav || plotState.loadingXirr} />

      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          Simulate systematic withdrawals from a lumpsum investment. See how your corpus survives across different historical periods.
        </ParagraphMedium>
      </Block>

      <Block maxWidth="900px" margin="0 auto">
        <SwpPortfolioList
          swpPortfolios={swpPortfolios}
          setSwpPortfolios={setSwpPortfolios}
          onAssetSelect={(pIdx, idx, asset) => {
            invalidateChart();
            handleAssetSelect(pIdx, idx, asset);
          }}
          onAddAsset={handleAddFundInvalidate}
          onRemoveAsset={handleRemoveFundInvalidate}
          onAllocationChange={handleAllocationChangeInvalidate}
          onAddPortfolio={handleAddPortfolioInvalidate}
          COLORS={plotState.COLORS}
          useAssets={true}
          defaultSchemeCode={DEFAULT_SCHEME_CODE}
        />

        <SwpControlsPanel
          years={years}
          setYears={setYears}
          onPlot={handlePlotAllPortfolios}
          anyInvalidAlloc={anyInvalidAlloc}
          onYearsChange={handleYearsChange}
          initialCorpus={initialCorpus}
          setInitialCorpus={setInitialCorpus}
          monthlyWithdrawal={monthlyWithdrawal}
          setMonthlyWithdrawal={setMonthlyWithdrawal}
          chartView={chartView}
          setChartView={handleChartViewChange}
        />
      </Block>

      {/* SWP Charts */}
      {plotState.hasPlotted && Object.keys(plotState.lumpSumXirrDatas).length > 0 && (
        <Block position="relative" maxWidth="90%" margin="0 auto">
          <SwpCharts
            swpData={plotState.lumpSumXirrDatas}
            COLORS={plotState.COLORS}
            swpPortfolios={swpPortfolios}
            years={years}
            initialCorpus={initialCorpus}
            monthlyWithdrawal={monthlyWithdrawal}
            chartView={chartView}
          />
        </Block>
      )}
    </Block>
  );
};
