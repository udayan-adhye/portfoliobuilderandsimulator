import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelMedium, LabelLarge } from 'baseui/typography';
import { Button, KIND } from 'baseui/button';
import { Input } from 'baseui/input';
import { Select } from 'baseui/select';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { usePlotState } from '../hooks/usePlotState';
import { useLumpsumPortfolios } from '../hooks/useLumpsumPortfolios';
import { useHybridPlot } from '../hooks/useHybridPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { LumpsumPortfolioList } from '../components/lumpsum-simulator/LumpsumPortfolioList';
import { HybridCharts } from '../components/charts/HybridCharts';
import { DEFAULT_SCHEME_CODE, ALLOCATION_TOTAL } from '../constants';
import { useMutualFundsContext } from '../hooks/useMutualFunds';
import { formatNumber, parseFormattedNumber } from '../utils/numberFormat';

interface HybridSimulatorTabProps {
  loadNavData: (schemeCode: number) => Promise<any[]>;
}

export const HybridSimulatorTab: React.FC<HybridSimulatorTabProps> = ({ loadNavData }) => {
  const { loading: fundsLoading, error: fundsError } = useMutualFundsContext();
  const location = useLocation();
  const isActive = location.pathname === '/hybrid';
  const plotState = usePlotState(loadNavData);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(500000);
  const [sipAmount, setSipAmount] = useState<number>(10000);
  const [chartView, setChartView] = useState<'xirr' | 'corpus'>('xirr');

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

  const { handlePlotAllPortfolios } = useHybridPlot({
    portfolios: lumpsumPortfolios,
    years,
    loadNavData,
    plotState,
    lumpsumAmount,
    sipAmount,
  });

  const hasMutualFund = lumpsumPortfolios.some(
    p => (p.selectedAssets || []).some(a => a?.type === 'mutual_fund')
  );
  const anyInvalidAlloc = lumpsumPortfolios.some(
    p => (p.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0) !== ALLOCATION_TOTAL
      || (p.selectedAssets || []).some(a => !a)
  ) || (hasMutualFund && (fundsLoading || !!fundsError));

  const { invalidateChart, withInvalidation } = useChartInvalidation(plotState);

  const handleAddPortfolioInvalidate = withInvalidation(handleAddPortfolio);
  const handleAddFundInvalidate = withInvalidation(handleAddFund);
  const handleRemoveFundInvalidate = withInvalidation(handleRemoveFund);
  const handleAllocationChangeInvalidate = withInvalidation(handleAllocationChange);
  const handleYearsChange = invalidateChart;

  const handleLumpsumChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    if (numericValue <= 1000000000) setLumpsumAmount(numericValue);
  };

  const handleSipChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    if (numericValue <= 10000000) setSipAmount(numericValue);
  };

  return (
    <Block position="relative">
      <LoadingOverlay active={plotState.loadingNav || plotState.loadingXirr} />

      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          Simulate a combined lumpsum + monthly SIP strategy. Deploy capital upfront and continue investing monthly.
        </ParagraphMedium>
      </Block>

      <Block maxWidth="900px" margin="0 auto">
        <LumpsumPortfolioList
          lumpsumPortfolios={lumpsumPortfolios}
          setLumpsumPortfolios={setLumpsumPortfolios}
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

        {/* Controls Panel */}
        <Block marginBottom="scale800">
          <Block
            position="relative"
            padding="scale700"
            marginBottom="scale600"
            backgroundColor="backgroundPrimary"
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  borderLeft: '4px solid #000000',
                  borderRadius: $theme.borders.radius200,
                })
              }
            }}
          >
            <Block marginBottom="scale500">
              <LabelLarge
                overrides={{
                  Block: {
                    style: ({ $theme }) => ({
                      color: $theme.colors.primary,
                      fontWeight: '600',
                      marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
                    })
                  }
                }}
              >
                Hybrid Investment Options
              </LabelLarge>
            </Block>

            {/* Rolling Period */}
            <Block display="flex" alignItems="center" marginBottom="scale500" gridGap="scale300">
              <LabelMedium>Rolling Period:</LabelMedium>
              <Select
                options={Array.from({ length: 20 }, (_, i) => ({
                  label: `${i + 1} year${i + 1 > 1 ? 's' : ''}`,
                  id: (i + 1).toString()
                }))}
                value={[{ label: `${years} year${years > 1 ? 's' : ''}`, id: years.toString() }]}
                onChange={params => {
                  if (params.value.length > 0) {
                    setYears(parseInt(params.value[0].id as string));
                    handleYearsChange();
                  }
                }}
                size="compact"
                searchable={false}
                clearable={false}
                overrides={{ Root: { style: { width: '150px' } } }}
              />
            </Block>

            {/* Amounts */}
            <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale500">
              <Block display="flex" alignItems="center" gridGap="scale300">
                <LabelMedium>Lumpsum (₹):</LabelMedium>
                <Input
                  type="text"
                  value={formatNumber(lumpsumAmount)}
                  onChange={handleLumpsumChange}
                  size="compact"
                  overrides={{ Root: { style: { width: '170px' } } }}
                />
              </Block>
              <Block display="flex" alignItems="center" gridGap="scale300">
                <LabelMedium>Monthly SIP (₹):</LabelMedium>
                <Input
                  type="text"
                  value={formatNumber(sipAmount)}
                  onChange={handleSipChange}
                  size="compact"
                  overrides={{ Root: { style: { width: '150px' } } }}
                />
              </Block>
            </Block>

            {/* Chart View */}
            <Block display="flex" alignItems="center" gridGap="scale300">
              <LabelMedium>Chart View:</LabelMedium>
              <Block display="flex">
                <Button
                  onClick={() => setChartView('xirr')}
                  kind={chartView === 'xirr' ? KIND.primary : KIND.secondary}
                  size="compact"
                  overrides={{
                    BaseButton: { style: { borderTopRightRadius: '0', borderBottomRightRadius: '0', marginRight: '-1px' } }
                  }}
                >
                  XIRR (%)
                </Button>
                <Button
                  onClick={() => setChartView('corpus')}
                  kind={chartView === 'corpus' ? KIND.primary : KIND.secondary}
                  size="compact"
                  overrides={{
                    BaseButton: { style: { borderTopLeftRadius: '0', borderBottomLeftRadius: '0' } }
                  }}
                >
                  Corpus (₹)
                </Button>
              </Block>
            </Block>
          </Block>

          <Block display="flex" justifyContent="center">
            <Button kind="primary" onClick={handlePlotAllPortfolios} disabled={anyInvalidAlloc}>
              Plot Hybrid
            </Button>
          </Block>
        </Block>
      </Block>

      {/* Charts */}
      {plotState.hasPlotted && Object.keys(plotState.lumpSumXirrDatas).length > 0 && (
        <Block position="relative" maxWidth="90%" margin="0 auto">
          <HybridCharts
            hybridData={plotState.lumpSumXirrDatas}
            COLORS={plotState.COLORS}
            portfolios={lumpsumPortfolios}
            years={years}
            lumpsumAmount={lumpsumAmount}
            sipAmount={sipAmount}
            chartView={chartView}
          />
        </Block>
      )}
    </Block>
  );
};
