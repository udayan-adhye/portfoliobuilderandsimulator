import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { ParagraphMedium } from 'baseui/typography';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ChartArea } from '../components/layout/ChartArea';
import { usePlotState } from '../hooks/usePlotState';
import { useLumpsumPortfolios } from '../hooks/useLumpsumPortfolios';
import { useLumpsumPlot } from '../hooks/useLumpsumPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { LumpsumPortfolioList } from '../components/lumpsum-simulator/LumpsumPortfolioList';
import { LumpsumControlsPanel } from '../components/controls/LumpsumControlsPanel';
import { DEFAULT_SCHEME_CODE, ALLOCATION_TOTAL } from '../constants';
import { useMutualFundsContext } from '../hooks/useMutualFunds';
import { inflationService } from '../services/inflationService';
import { SaveLoadPortfolio } from '../components/common/SaveLoadPortfolio';
import { SavedPortfolioConfig } from '../services/portfolioStorage';

interface LumpsumSimulatorTabProps {
  loadNavData: (schemeCode: number) => Promise<any[]>;
}

export const LumpsumSimulatorTab: React.FC<LumpsumSimulatorTabProps> = ({ loadNavData }) => {
  const { loading: fundsLoading, error: fundsError } = useMutualFundsContext();
  const location = useLocation();
  const isActive = location.pathname === '/lumpsum';
  const plotState = usePlotState(loadNavData);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [chartView, setChartView] = useState<'xirr' | 'corpus'>('xirr');
  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const [inflationRates, setInflationRates] = useState<Map<number, number>>(new Map());

  // Fetch inflation rates when toggle is turned on
  useEffect(() => {
    if (inflationAdjusted && inflationRates.size === 0) {
      inflationService.fetchInflationRates('IND').then(setInflationRates).catch(console.error);
    }
  }, [inflationAdjusted]);
  
  const {
    lumpsumPortfolios,
    setLumpsumPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleAssetSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
  } = useLumpsumPortfolios(DEFAULT_SCHEME_CODE, [lumpsumAmount, setLumpsumAmount], isActive);

  const { handlePlotAllPortfolios } = useLumpsumPlot({
    lumpsumPortfolios,
    years,
    loadNavData,
    plotState,
    lumpsumAmount,
    chartView,
  });

  const hasMutualFund = lumpsumPortfolios.some(
    p => (p.selectedAssets || []).some(a => a?.type === 'mutual_fund')
  );
  const anyInvalidAlloc = lumpsumPortfolios.some(
    p => (p.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0) !== ALLOCATION_TOTAL
      || (p.selectedAssets || []).some(a => !a)
  ) || (hasMutualFund && (fundsLoading || !!fundsError));

  // Use chart invalidation hook to wrap handlers
  const { invalidateChart, withInvalidation } = useChartInvalidation(plotState);

  // Wrap handlers with automatic chart invalidation
  const handleAddPortfolioInvalidate = withInvalidation(handleAddPortfolio);
  const handleAddFundInvalidate = withInvalidation(handleAddFund);
  const handleRemoveFundInvalidate = withInvalidation(handleRemoveFund);
  const handleAllocationChangeInvalidate = withInvalidation(handleAllocationChange);
  const handleAssetSelectInvalidate = withInvalidation(handleAssetSelect);
  const handleYearsChange = invalidateChart;
  
  // Handle chart view change - invalidate charts when switching between XIRR and Corpus
  const handleChartViewChange = (view: 'xirr' | 'corpus') => {
    setChartView(view);
    invalidateChart();
  };

  return (
    <Block position="relative">
      <LoadingOverlay active={plotState.loadingNav || plotState.loadingXirr} />
      
      {/* Page Description */}
      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          Simulate one-time investments and compare rolling returns across different time periods.
        </ParagraphMedium>
      </Block>
      
      <Block maxWidth="900px" margin="0 auto">
        <SaveLoadPortfolio
          type="lumpsum"
          currentPortfolios={lumpsumPortfolios}
          currentParams={{ years, lumpsumAmount, chartView }}
          onLoad={(config: SavedPortfolioConfig) => {
            if (config.portfolios) setLumpsumPortfolios(config.portfolios);
            if (config.params.years) setYears(config.params.years);
            if (config.params.lumpsumAmount) setLumpsumAmount(config.params.lumpsumAmount);
            invalidateChart();
          }}
        />

        <LumpsumPortfolioList
          lumpsumPortfolios={lumpsumPortfolios}
          setLumpsumPortfolios={setLumpsumPortfolios}
          onAssetSelect={(pIdx: number, idx: number, asset) => {
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

        <LumpsumControlsPanel
          years={years}
          setYears={setYears}
          onPlot={handlePlotAllPortfolios}
          anyInvalidAlloc={anyInvalidAlloc}
          onYearsChange={handleYearsChange}
          lumpsumAmount={lumpsumAmount}
          setLumpsumAmount={setLumpsumAmount}
          chartView={chartView}
          setChartView={handleChartViewChange}
          inflationAdjusted={inflationAdjusted}
          setInflationAdjusted={setInflationAdjusted}
        />
      </Block>

      <ChartArea
        xirrError={plotState.xirrError}
        hasPlotted={plotState.hasPlotted}
        navDatas={plotState.navDatas}
        lumpsumPortfolioXirrData={plotState.lumpSumXirrDatas}
        sipPortfolioXirrData={plotState.sipXirrDatas}
        COLORS={plotState.COLORS}
        loadingNav={plotState.loadingNav}
        loadingXirr={plotState.loadingXirr}
        lumpsumPortfolios={lumpsumPortfolios}
        years={years}
        amount={lumpsumAmount}
        chartView={chartView}
        isLumpsum={true}
        inflationAdjusted={inflationAdjusted}
        inflationRates={inflationRates}
      />
    </Block>
  );
};

