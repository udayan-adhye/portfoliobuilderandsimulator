import React, { useState, useMemo } from 'react';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelMedium, LabelLarge, HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { Input } from 'baseui/input';
import { Select } from 'baseui/select';
import { Button, KIND, SIZE } from 'baseui/button';
import { Slider } from 'baseui/slider';
import {
  calculateRequiredSip,
  calculateSipFutureValue,
  calculateGoalScenarios,
  GOAL_PRESETS,
} from '../utils/calculations/goalCalculator';
import { formatNumber, parseFormattedNumber, formatCurrency } from '../utils/numberFormat';

export const GoalCalculatorTab: React.FC = () => {
  const [goalAmount, setGoalAmount] = useState<number>(5000000); // 50 lakhs
  const [years, setYears] = useState<number>(10);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [inflationRate, setInflationRate] = useState<number>(6);
  const [monthlySip, setMonthlySip] = useState<number>(0);
  const [mode, setMode] = useState<'goal-to-sip' | 'sip-to-goal'>('goal-to-sip');
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Calculate results
  const result = useMemo(() => {
    if (mode === 'goal-to-sip') {
      return calculateRequiredSip(goalAmount, expectedReturn, years, inflationRate);
    } else {
      const futureValue = calculateSipFutureValue(monthlySip, expectedReturn, years);
      const totalInvested = monthlySip * years * 12;
      return {
        monthlySip,
        totalInvested,
        totalReturns: futureValue - totalInvested,
        inflationAdjustedGoal: futureValue,
      };
    }
  }, [goalAmount, years, expectedReturn, inflationRate, monthlySip, mode]);

  const scenarios = useMemo(() => {
    if (mode === 'goal-to-sip') {
      return calculateGoalScenarios(goalAmount, years, inflationRate);
    }
    return null;
  }, [goalAmount, years, inflationRate, mode]);

  const handlePresetSelect = (preset: typeof GOAL_PRESETS[0]) => {
    if (preset.name === 'Custom Goal') {
      setSelectedPreset('Custom Goal');
      return;
    }
    setGoalAmount(preset.amount);
    setYears(preset.years);
    setSelectedPreset(preset.name);
  };

  const handleGoalAmountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    if (numericValue <= 10000000000) setGoalAmount(numericValue);
  };

  const handleSipAmountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const numericValue = parseFormattedNumber(e.target.value);
    if (numericValue <= 10000000) setMonthlySip(numericValue);
  };

  return (
    <Block position="relative">
      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          Plan your financial goals — calculate the SIP needed to reach your target, or see how much your SIP will grow to.
        </ParagraphMedium>
      </Block>

      <Block maxWidth="900px" margin="0 auto">
        {/* Mode Toggle */}
        <Block display="flex" justifyContent="center" marginBottom="scale600">
          <Block display="flex">
            <Button
              onClick={() => setMode('goal-to-sip')}
              kind={mode === 'goal-to-sip' ? KIND.primary : KIND.secondary}
              size={SIZE.compact}
              overrides={{
                BaseButton: { style: { borderTopRightRadius: '0', borderBottomRightRadius: '0', marginRight: '-1px' } }
              }}
            >
              Goal → Required SIP
            </Button>
            <Button
              onClick={() => setMode('sip-to-goal')}
              kind={mode === 'sip-to-goal' ? KIND.primary : KIND.secondary}
              size={SIZE.compact}
              overrides={{
                BaseButton: { style: { borderTopLeftRadius: '0', borderBottomLeftRadius: '0' } }
              }}
            >
              SIP → Future Value
            </Button>
          </Block>
        </Block>

        {/* Goal Presets */}
        {mode === 'goal-to-sip' && (
          <Block marginBottom="scale600">
            <LabelMedium marginBottom="scale300">Quick Goals:</LabelMedium>
            <Block display="flex" flexWrap="wrap" gridGap="scale200">
              {GOAL_PRESETS.map(preset => (
                <Button
                  key={preset.name}
                  kind={selectedPreset === preset.name ? KIND.primary : KIND.tertiary}
                  size={SIZE.compact}
                  onClick={() => handlePresetSelect(preset)}
                  overrides={{
                    BaseButton: {
                      style: {
                        fontSize: '13px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                      }
                    }
                  }}
                >
                  {preset.icon} {preset.name}
                  {preset.amount > 0 && ` (${formatCurrency(preset.amount)})`}
                </Button>
              ))}
            </Block>
          </Block>
        )}

        {/* Input Panel */}
        <Block
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
              {mode === 'goal-to-sip' ? 'Goal Details' : 'SIP Details'}
            </LabelLarge>
          </Block>

          {mode === 'goal-to-sip' ? (
            <Block display="flex" alignItems="center" marginBottom="scale500" gridGap="scale300">
              <LabelMedium>Target Amount (₹):</LabelMedium>
              <Input
                type="text"
                value={formatNumber(goalAmount)}
                onChange={handleGoalAmountChange}
                size="compact"
                overrides={{ Root: { style: { width: '200px' } } }}
              />
            </Block>
          ) : (
            <Block display="flex" alignItems="center" marginBottom="scale500" gridGap="scale300">
              <LabelMedium>Monthly SIP (₹):</LabelMedium>
              <Input
                type="text"
                value={formatNumber(monthlySip)}
                onChange={handleSipAmountChange}
                size="compact"
                overrides={{ Root: { style: { width: '200px' } } }}
              />
            </Block>
          )}

          <Block display="flex" alignItems="center" marginBottom="scale500" gridGap="scale300">
            <LabelMedium>Time Horizon:</LabelMedium>
            <Select
              options={Array.from({ length: 40 }, (_, i) => ({
                label: `${i + 1} year${i + 1 > 1 ? 's' : ''}`,
                id: (i + 1).toString()
              }))}
              value={[{ label: `${years} year${years > 1 ? 's' : ''}`, id: years.toString() }]}
              onChange={params => {
                if (params.value.length > 0) setYears(parseInt(params.value[0].id as string));
              }}
              size="compact"
              searchable={false}
              clearable={false}
              overrides={{ Root: { style: { width: '160px' } } }}
            />
          </Block>

          <Block marginBottom="scale500">
            <Block display="flex" alignItems="center" gridGap="scale300" marginBottom="scale200">
              <LabelMedium>Expected Return:</LabelMedium>
              <LabelMedium><strong>{expectedReturn}% p.a.</strong></LabelMedium>
            </Block>
            <Slider
              value={[expectedReturn]}
              onChange={({ value }) => setExpectedReturn(value[0])}
              min={4}
              max={20}
              step={0.5}
              overrides={{
                Root: { style: { maxWidth: '400px' } },
              }}
            />
          </Block>

          {mode === 'goal-to-sip' && (
            <Block>
              <Block display="flex" alignItems="center" gridGap="scale300" marginBottom="scale200">
                <LabelMedium>Inflation Rate:</LabelMedium>
                <LabelMedium><strong>{inflationRate}% p.a.</strong></LabelMedium>
              </Block>
              <Slider
                value={[inflationRate]}
                onChange={({ value }) => setInflationRate(value[0])}
                min={0}
                max={12}
                step={0.5}
                overrides={{
                  Root: { style: { maxWidth: '400px' } },
                }}
              />
            </Block>
          )}
        </Block>

        {/* Results Panel */}
        <Block
          padding="scale700"
          marginBottom="scale600"
          overrides={{
            Block: {
              style: {
                borderRadius: '8px',
                background: '#fafafa',
                border: '1px solid #e4e4e7',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }
            }
          }}
        >
          <HeadingSmall marginTop="0" marginBottom="scale500">
            {mode === 'goal-to-sip' ? 'Required Monthly SIP' : 'Your SIP Will Grow To'}
          </HeadingSmall>

          <Block display="flex" justifyContent="space-around" flexWrap="wrap" gridGap="scale400">
            {mode === 'goal-to-sip' ? (
              <>
                <ResultCard
                  label="Monthly SIP Needed"
                  value={formatCurrency(result.monthlySip)}
                  highlight
                />
                <ResultCard
                  label="Total Investment"
                  value={formatCurrency(result.totalInvested)}
                />
                <ResultCard
                  label="Estimated Returns"
                  value={formatCurrency(result.totalReturns)}
                  color="#008032"
                />
                {inflationRate > 0 && (
                  <ResultCard
                    label="Inflation-Adjusted Goal"
                    value={formatCurrency(result.inflationAdjustedGoal)}
                    subtext={`Today's ₹${formatNumber(goalAmount)} = ₹${formatNumber(Math.round(result.inflationAdjustedGoal))} in ${years} years`}
                  />
                )}
              </>
            ) : (
              <>
                <ResultCard
                  label="Future Value"
                  value={formatCurrency(result.inflationAdjustedGoal)}
                  highlight
                />
                <ResultCard
                  label="Total Investment"
                  value={formatCurrency(result.totalInvested)}
                />
                <ResultCard
                  label="Wealth Gained"
                  value={formatCurrency(result.totalReturns)}
                  color="#008032"
                />
                <ResultCard
                  label="Wealth Multiplier"
                  value={`${(result.totalInvested > 0 ? result.inflationAdjustedGoal / result.totalInvested : 0).toFixed(1)}x`}
                />
              </>
            )}
          </Block>
        </Block>

        {/* Scenario Comparison (Goal-to-SIP mode only) */}
        {mode === 'goal-to-sip' && scenarios && (
          <Block
            padding="scale700"
            marginBottom="scale600"
            backgroundColor="backgroundPrimary"
            overrides={{
              Block: {
                style: { borderRadius: '8px', border: '1px solid #e4e4e7' }
              }
            }}
          >
            <HeadingSmall marginTop="0" marginBottom="scale400">
              Scenario Comparison
            </HeadingSmall>
            <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="scale400">
              Different return assumptions show a range of SIP amounts needed:
            </ParagraphSmall>

            <Block as="table" width="100%"
              overrides={{ Block: { style: { borderCollapse: 'collapse', fontSize: '14px' } } }}>
              <thead>
                <tr>
                  {['Scenario', 'Return Rate', 'Monthly SIP', 'Total Invested', 'Target (Inflation-Adj)'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #e4e4e7', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(scenarios).map((s, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx === 1 ? '#f4f4f5' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5', fontWeight: 500 }}>{s.label}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5' }}>{s.returnRate}%</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5', fontWeight: 600 }}>{formatCurrency(s.monthlySip)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(s.totalInvested)}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(s.inflationAdjustedGoal)}</td>
                  </tr>
                ))}
              </tbody>
            </Block>
          </Block>
        )}

        {/* Year-by-Year Projection */}
        {mode === 'sip-to-goal' && monthlySip > 0 && (
          <YearByYearProjection monthlySip={monthlySip} years={years} expectedReturn={expectedReturn} />
        )}

        {mode === 'goal-to-sip' && result.monthlySip > 0 && (
          <YearByYearProjection monthlySip={result.monthlySip} years={years} expectedReturn={expectedReturn} />
        )}
      </Block>
    </Block>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ResultCard: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
  subtext?: string;
}> = ({ label, value, highlight, color, subtext }) => (
  <Block
    padding="scale500"
    overrides={{
      Block: {
        style: {
          textAlign: 'center' as const,
          minWidth: '160px',
          flex: '1',
        }
      }
    }}
  >
    <ParagraphSmall color="contentTertiary" marginTop="0" marginBottom="scale100">
      {label}
    </ParagraphSmall>
    <Block
      overrides={{
        Block: {
          style: {
            fontSize: highlight ? '28px' : '22px',
            fontWeight: '700',
            color: color || (highlight ? '#008032' : '#09090b'),
          }
        }
      }}
    >
      {value}
    </Block>
    {subtext && (
      <ParagraphSmall color="contentTertiary" marginTop="scale100" marginBottom="0">
        {subtext}
      </ParagraphSmall>
    )}
  </Block>
);

const YearByYearProjection: React.FC<{
  monthlySip: number;
  years: number;
  expectedReturn: number;
}> = ({ monthlySip, years, expectedReturn }) => {
  const projections = useMemo(() => {
    const rows: { year: number; invested: number; value: number; returns: number }[] = [];
    for (let y = 1; y <= years; y++) {
      const value = calculateSipFutureValue(monthlySip, expectedReturn, y);
      const invested = monthlySip * y * 12;
      rows.push({
        year: y,
        invested,
        value: Math.round(value),
        returns: Math.round(value - invested),
      });
    }
    return rows;
  }, [monthlySip, years, expectedReturn]);

  return (
    <Block
      padding="scale700"
      backgroundColor="backgroundPrimary"
      overrides={{
        Block: {
          style: { borderRadius: '8px', border: '1px solid #e4e4e7' }
        }
      }}
    >
      <HeadingSmall marginTop="0" marginBottom="scale400">
        Year-by-Year Projection
      </HeadingSmall>
      <Block as="table" width="100%"
        overrides={{ Block: { style: { borderCollapse: 'collapse', fontSize: '13px' } } }}>
        <thead>
          <tr>
            {['Year', 'Total Invested', 'Portfolio Value', 'Returns', 'Return %'].map(h => (
              <th key={h} style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '2px solid #e4e4e7', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projections.map(row => (
            <tr key={row.year}>
              <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>Year {row.year}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(row.invested)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f4f4f5', fontWeight: 600 }}>{formatCurrency(row.value)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f4f4f5', color: '#008032' }}>{formatCurrency(row.returns)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>
                {row.invested > 0 ? ((row.returns / row.invested) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </Block>
    </Block>
  );
};
