import React from 'react';
import { Block } from 'baseui/block';
import { Button, KIND } from 'baseui/button';
import { Input } from 'baseui/input';
import { LabelMedium, LabelLarge } from 'baseui/typography';
import { Select } from 'baseui/select';
import { formatNumber, parseFormattedNumber } from '../../utils/numberFormat';

interface SwpControlsPanelProps {
  years: number;
  setYears: (years: number) => void;
  onPlot: () => void;
  anyInvalidAlloc: boolean;
  onYearsChange: () => void;
  initialCorpus: number;
  setInitialCorpus: (amount: number) => void;
  monthlyWithdrawal: number;
  setMonthlyWithdrawal: (amount: number) => void;
  chartView: 'survival' | 'corpus';
  setChartView: (view: 'survival' | 'corpus') => void;
}

export const SwpControlsPanel: React.FC<SwpControlsPanelProps> = ({
  years,
  setYears,
  onPlot,
  anyInvalidAlloc,
  onYearsChange,
  initialCorpus,
  setInitialCorpus,
  monthlyWithdrawal,
  setMonthlyWithdrawal,
  chartView,
  setChartView,
}) => {
  const handleCorpusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    if (numericValue <= 1000000000) setInitialCorpus(numericValue);
  };

  const handleWithdrawalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    if (numericValue <= 100000000) setMonthlyWithdrawal(numericValue);
  };

  // Calculate withdrawal rate
  const annualWithdrawal = monthlyWithdrawal * 12;
  const withdrawalRate = initialCorpus > 0 ? (annualWithdrawal / initialCorpus) * 100 : 0;

  return (
    <Block marginBottom="scale800">
      <Block
        position="relative"
        padding="scale700"
        marginBottom="scale600"
        backgroundColor="backgroundPrimary"
        overrides={{
          Block: {
            style: ({ $theme }) => ({
              border: '1px solid #e4e4e7',
              borderLeft: '3px solid #09090b',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
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
            SWP Options
          </LabelLarge>
        </Block>

        {/* Rolling Period */}
        <Block display="flex" alignItems="center" marginBottom="scale500" gridGap="scale300">
          <LabelMedium>Rolling Period:</LabelMedium>
          <Select
            options={Array.from({ length: 30 }, (_, i) => ({
              label: `${i + 1} year${i + 1 > 1 ? 's' : ''}`,
              id: (i + 1).toString()
            }))}
            value={[{ label: `${years} year${years > 1 ? 's' : ''}`, id: years.toString() }]}
            placeholder="Select years"
            onChange={params => {
              if (params.value.length > 0) {
                setYears(parseInt(params.value[0].id as string));
                onYearsChange();
              }
            }}
            size="compact"
            searchable={false}
            overrides={{ Root: { style: { width: '150px' } } }}
            clearable={false}
          />
        </Block>

        {/* Initial Corpus and Monthly Withdrawal */}
        <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale500">
          <Block display="flex" alignItems="center" gridGap="scale300">
            <LabelMedium>Initial Corpus (₹):</LabelMedium>
            <Input
              type="text"
              value={formatNumber(initialCorpus)}
              onChange={handleCorpusChange}
              placeholder="50,00,000"
              size="compact"
              overrides={{ Root: { style: { width: '180px' } } }}
            />
          </Block>

          <Block display="flex" alignItems="center" gridGap="scale300">
            <LabelMedium>Monthly Withdrawal (₹):</LabelMedium>
            <Input
              type="text"
              value={formatNumber(monthlyWithdrawal)}
              onChange={handleWithdrawalChange}
              placeholder="25,000"
              size="compact"
              overrides={{ Root: { style: { width: '150px' } } }}
            />
          </Block>
        </Block>

        {/* Withdrawal Rate Info */}
        <Block display="flex" alignItems="center" marginBottom="scale500" gridGap="scale300">
          <LabelMedium color="contentTertiary">
            Annual Withdrawal Rate: <strong style={{ color: withdrawalRate > 6 ? '#d32f2f' : withdrawalRate > 4 ? '#a65b00' : '#008032' }}>
              {withdrawalRate.toFixed(1)}%
            </strong>
            {withdrawalRate > 6 && ' (High risk of corpus depletion)'}
            {withdrawalRate > 4 && withdrawalRate <= 6 && ' (Moderate)'}
            {withdrawalRate <= 4 && ' (Safe withdrawal rate)'}
          </LabelMedium>
        </Block>

        {/* Chart View Toggle */}
        <Block display="flex" alignItems="center" gridGap="scale300">
          <LabelMedium>Chart View:</LabelMedium>
          <Block display="flex">
            <Button
              onClick={() => setChartView('survival')}
              kind={chartView === 'survival' ? KIND.primary : KIND.secondary}
              size="compact"
              overrides={{
                BaseButton: { style: { borderTopRightRadius: '0', borderBottomRightRadius: '0', marginRight: '-1px' } }
              }}
            >
              Survival
            </Button>
            <Button
              onClick={() => setChartView('corpus')}
              kind={chartView === 'corpus' ? KIND.primary : KIND.secondary}
              size="compact"
              overrides={{
                BaseButton: { style: { borderTopLeftRadius: '0', borderBottomLeftRadius: '0' } }
              }}
            >
              Final Corpus (₹)
            </Button>
          </Block>
        </Block>
      </Block>

      <Block display="flex" justifyContent="center">
        <Button kind="primary" onClick={onPlot} disabled={anyInvalidAlloc}>
          Simulate SWP
        </Button>
      </Block>
    </Block>
  );
};
