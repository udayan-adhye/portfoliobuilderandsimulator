import React, { useState, useMemo, useCallback } from 'react';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelMedium, LabelLarge, HeadingSmall, ParagraphSmall } from 'baseui/typography';
import { Input } from 'baseui/input';
import { Select } from 'baseui/select';
import { Button, KIND, SIZE } from 'baseui/button';
import { Slider } from 'baseui/slider';
import { calculateSipFutureValue, calculateRequiredSip } from '../utils/calculations/goalCalculator';
import { formatNumber, parseFormattedNumber, formatCurrency } from '../utils/numberFormat';

interface Scenario {
  id: number;
  name: string;
  sipAmount: number;
  lumpsumAmount: number;
  annualReturn: number;
  years: number;
  stepUpPercent: number;
  inflationRate: number;
}

interface ScenarioResult {
  scenario: Scenario;
  futureValue: number;
  totalInvested: number;
  wealthGained: number;
  realReturn: number;
  inflationAdjustedValue: number;
}

const DEFAULT_SCENARIO: Omit<Scenario, 'id' | 'name'> = {
  sipAmount: 10000,
  lumpsumAmount: 0,
  annualReturn: 12,
  years: 10,
  stepUpPercent: 0,
  inflationRate: 6,
};

let nextId = 1;

/**
 * Calculate future value with annual step-up SIP.
 * Each year the SIP increases by stepUpPercent.
 */
function calculateStepUpFutureValue(
  monthlySip: number,
  annualReturn: number,
  years: number,
  stepUpPercent: number,
  lumpsumAmount: number
): { futureValue: number; totalInvested: number } {
  const monthlyRate = annualReturn / 100 / 12;
  let totalInvested = lumpsumAmount;
  let portfolio = lumpsumAmount;
  let currentSip = monthlySip;

  for (let year = 0; year < years; year++) {
    for (let month = 0; month < 12; month++) {
      portfolio = portfolio * (1 + monthlyRate) + currentSip;
      totalInvested += currentSip;
    }
    if (year < years - 1) {
      currentSip = currentSip * (1 + stepUpPercent / 100);
    }
  }

  return { futureValue: portfolio, totalInvested };
}

export const WhatIfTab: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { ...DEFAULT_SCENARIO, id: nextId++, name: 'Scenario A' },
    { ...DEFAULT_SCENARIO, id: nextId++, name: 'Scenario B', annualReturn: 15, stepUpPercent: 10 },
  ]);

  const addScenario = () => {
    const letter = String.fromCharCode(65 + scenarios.length); // A, B, C, ...
    setScenarios(prev => [
      ...prev,
      { ...DEFAULT_SCENARIO, id: nextId++, name: `Scenario ${letter}` }
    ]);
  };

  const removeScenario = (id: number) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const updateScenario = (id: number, field: keyof Scenario, value: any) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Calculate results for all scenarios
  const results: ScenarioResult[] = useMemo(() => {
    return scenarios.map(scenario => {
      const { futureValue, totalInvested } = calculateStepUpFutureValue(
        scenario.sipAmount,
        scenario.annualReturn,
        scenario.years,
        scenario.stepUpPercent,
        scenario.lumpsumAmount
      );

      const wealthGained = futureValue - totalInvested;
      const inflationAdjustedValue = futureValue / Math.pow(1 + scenario.inflationRate / 100, scenario.years);
      const realReturn = scenario.years > 0
        ? (Math.pow(inflationAdjustedValue / totalInvested, 1 / scenario.years) - 1) * 100
        : 0;

      return {
        scenario,
        futureValue,
        totalInvested,
        wealthGained,
        realReturn,
        inflationAdjustedValue,
      };
    });
  }, [scenarios]);

  const COLORS = ['#09090b', '#52525b', '#a1a1aa', '#3f3f46', '#71717a'];

  return (
    <Block position="relative">
      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          Compare different investment scenarios side by side. Tweak amounts, returns, step-up rates, and time horizons to see the impact.
        </ParagraphMedium>
      </Block>

      <Block maxWidth="1100px" margin="0 auto">
        {/* Scenario Input Cards */}
        <Block display="flex" flexWrap="wrap" gridGap="scale500" marginBottom="scale600">
          {scenarios.map((scenario, idx) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              color={COLORS[idx % COLORS.length]}
              onUpdate={(field, value) => updateScenario(scenario.id, field, value)}
              onRemove={scenarios.length > 1 ? () => removeScenario(scenario.id) : undefined}
            />
          ))}

          {scenarios.length < 5 && (
            <Block
              display="flex"
              alignItems="center"
              justifyContent="center"
              padding="scale600"
              overrides={{
                Block: {
                  style: {
                    minWidth: '260px',
                    border: '2px dashed #d4d4d8',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }
                }
              }}
              onClick={addScenario}
            >
              <Button kind={KIND.tertiary} size={SIZE.compact} onClick={addScenario}>
                + Add Scenario
              </Button>
            </Block>
          )}
        </Block>

        {/* Comparison Results */}
        {results.length > 0 && (
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
              Comparison Results
            </HeadingSmall>

            <Block as="table" width="100%"
              overrides={{ Block: { style: { borderCollapse: 'collapse', fontSize: '14px' } } }}>
              <thead>
                <tr>
                  {['Scenario', 'Monthly SIP', 'Lumpsum', 'Return', 'Years', 'Step-Up', 'Total Invested', 'Future Value', 'Wealth Gained', 'Real Value*'].map(h => (
                    <th key={h} style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '2px solid #e4e4e7', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  const isBestFV = r.futureValue === Math.max(...results.map(x => x.futureValue));
                  return (
                    <tr key={r.scenario.id} style={{ backgroundColor: isBestFV ? '#f4f4f5' : 'transparent' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid #f4f4f5', fontWeight: 600, color: COLORS[idx % COLORS.length] }}>
                        {r.scenario.name} {isBestFV && '★'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(r.scenario.sipAmount)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(r.scenario.lumpsumAmount)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{r.scenario.annualReturn}%</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{r.scenario.years}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{r.scenario.stepUpPercent}%</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(r.totalInvested)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5', fontWeight: 700 }}>{formatCurrency(r.futureValue)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5', color: '#008032', fontWeight: 600 }}>{formatCurrency(r.wealthGained)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', borderBottom: '1px solid #f4f4f5' }}>{formatCurrency(r.inflationAdjustedValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Block>
            <ParagraphSmall color="contentTertiary" marginTop="scale300">
              *Real Value: Future value adjusted for inflation — what it's worth in today's rupees.
              ★ marks the scenario with the highest future value.
            </ParagraphSmall>
          </Block>
        )}

        {/* Visual Comparison Bars */}
        {results.length > 1 && (
          <Block
            padding="scale700"
            backgroundColor="backgroundPrimary"
            overrides={{ Block: { style: { borderRadius: '8px', border: '1px solid #e4e4e7' } } }}
          >
            <HeadingSmall marginTop="0" marginBottom="scale500">
              Visual Comparison
            </HeadingSmall>
            {results.map((r, idx) => {
              const maxFV = Math.max(...results.map(x => x.futureValue));
              const barWidth = maxFV > 0 ? (r.futureValue / maxFV) * 100 : 0;
              const investedWidth = maxFV > 0 ? (r.totalInvested / maxFV) * 100 : 0;

              return (
                <Block key={r.scenario.id} marginBottom="scale400">
                  <Block display="flex" justifyContent="space-between" marginBottom="scale100">
                    <LabelMedium overrides={{ Block: { style: { color: COLORS[idx % COLORS.length], fontWeight: '600' } } }}>
                      {r.scenario.name}
                    </LabelMedium>
                    <LabelMedium>{formatCurrency(r.futureValue)}</LabelMedium>
                  </Block>
                  <Block
                    position="relative"
                    height="28px"
                    overrides={{ Block: { style: { borderRadius: '4px', backgroundColor: '#f4f4f5', overflow: 'hidden' } } }}
                  >
                    {/* Invested portion */}
                    <Block
                      position="absolute"
                      top="0"
                      left="0"
                      height="100%"
                      overrides={{
                        Block: {
                          style: {
                            width: `${investedWidth}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                            opacity: 0.3,
                            transition: 'width 0.5s ease',
                          }
                        }
                      }}
                    />
                    {/* Total value */}
                    <Block
                      position="absolute"
                      top="0"
                      left="0"
                      height="100%"
                      overrides={{
                        Block: {
                          style: {
                            width: `${barWidth}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                            opacity: 0.7,
                            transition: 'width 0.5s ease',
                            borderRadius: '4px',
                          }
                        }
                      }}
                    />
                  </Block>
                </Block>
              );
            })}
            <ParagraphSmall color="contentTertiary" marginTop="scale300">
              Lighter shading = amount invested. Full bar = future value including returns.
            </ParagraphSmall>
          </Block>
        )}
      </Block>
    </Block>
  );
};

// ============================================================================
// SCENARIO CARD COMPONENT
// ============================================================================

const ScenarioCard: React.FC<{
  scenario: Scenario;
  color: string;
  onUpdate: (field: keyof Scenario, value: any) => void;
  onRemove?: () => void;
}> = ({ scenario, color, onUpdate, onRemove }) => (
  <Block
    padding="scale600"
    flex="1"
    overrides={{
      Block: {
        style: {
          minWidth: '260px',
          maxWidth: '320px',
          borderRadius: '8px',
          border: `1px solid #e4e4e7`,
          borderLeft: `3px solid ${color}`,
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }
      }
    }}
  >
    <Block display="flex" justifyContent="space-between" alignItems="center" marginBottom="scale400">
      <Input
        value={scenario.name}
        onChange={e => onUpdate('name', (e.target as HTMLInputElement).value)}
        size="compact"
        overrides={{
          Root: { style: { maxWidth: '180px' } },
          Input: { style: { fontWeight: 600, color } },
        }}
      />
      {onRemove && (
        <Button kind={KIND.tertiary} size={SIZE.mini} onClick={onRemove}>✕</Button>
      )}
    </Block>

    <CompactInput label="SIP (₹/mo)" value={scenario.sipAmount}
      onChange={v => onUpdate('sipAmount', v)} max={10000000} />
    <CompactInput label="Lumpsum (₹)" value={scenario.lumpsumAmount}
      onChange={v => onUpdate('lumpsumAmount', v)} max={1000000000} />

    <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale300">
      <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '80px' } } }}>Return %</LabelMedium>
      <Slider
        value={[scenario.annualReturn]}
        onChange={({ value }) => onUpdate('annualReturn', value[0])}
        min={4}
        max={25}
        step={0.5}
        overrides={{ Root: { style: { flex: 1 } } }}
      />
      <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '35px' } } }}>{scenario.annualReturn}%</LabelMedium>
    </Block>

    <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale300">
      <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '80px' } } }}>Years</LabelMedium>
      <Select
        options={Array.from({ length: 40 }, (_, i) => ({ label: `${i + 1}`, id: (i + 1).toString() }))}
        value={[{ label: `${scenario.years}`, id: scenario.years.toString() }]}
        onChange={params => {
          if (params.value.length > 0) onUpdate('years', parseInt(params.value[0].id as string));
        }}
        size="mini"
        searchable={false}
        clearable={false}
        overrides={{ Root: { style: { flex: 1 } } }}
      />
    </Block>

    <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale300">
      <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '80px' } } }}>Step-Up %</LabelMedium>
      <Slider
        value={[scenario.stepUpPercent]}
        onChange={({ value }) => onUpdate('stepUpPercent', value[0])}
        min={0}
        max={25}
        step={1}
        overrides={{ Root: { style: { flex: 1 } } }}
      />
      <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '35px' } } }}>{scenario.stepUpPercent}%</LabelMedium>
    </Block>

    <Block display="flex" alignItems="center" gridGap="scale200">
      <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '80px' } } }}>Inflation %</LabelMedium>
      <Slider
        value={[scenario.inflationRate]}
        onChange={({ value }) => onUpdate('inflationRate', value[0])}
        min={0}
        max={12}
        step={0.5}
        overrides={{ Root: { style: { flex: 1 } } }}
      />
      <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '35px' } } }}>{scenario.inflationRate}%</LabelMedium>
    </Block>
  </Block>
);

const CompactInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  max: number;
}> = ({ label, value, onChange, max }) => (
  <Block display="flex" alignItems="center" gridGap="scale200" marginBottom="scale300">
    <LabelMedium overrides={{ Block: { style: { fontSize: '13px', minWidth: '80px' } } }}>{label}</LabelMedium>
    <Input
      type="text"
      value={formatNumber(value)}
      onChange={e => {
        const v = parseFormattedNumber((e.target as HTMLInputElement).value);
        if (v <= max) onChange(v);
      }}
      size="mini"
      overrides={{ Root: { style: { flex: 1 } } }}
    />
  </Block>
);
