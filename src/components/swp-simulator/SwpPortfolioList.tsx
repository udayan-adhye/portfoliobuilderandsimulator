import React from 'react';
import { LumpsumAssetControls } from '../lumpsum-simulator/LumpsumAssetControls';
import { PortfolioListLayout } from '../common/PortfolioListLayout';
import { SwpPortfolio } from '../../types/swpPortfolio';
import { Asset } from '../../types/asset';

interface SwpPortfolioListProps {
  swpPortfolios: SwpPortfolio[];
  setSwpPortfolios: React.Dispatch<React.SetStateAction<SwpPortfolio[]>>;
  onAssetSelect: (pIdx: number, idx: number, asset: Asset | null) => void;
  onAddAsset: (pIdx: number) => void;
  onRemoveAsset: (pIdx: number, idx: number) => void;
  onAllocationChange: (pIdx: number, idx: number, value: number) => void;
  onAddPortfolio: () => void;
  COLORS: string[];
  useAssets?: boolean;
  defaultSchemeCode?: number;
}

export const SwpPortfolioList: React.FC<SwpPortfolioListProps> = ({
  swpPortfolios,
  setSwpPortfolios,
  onAssetSelect,
  onAddAsset,
  onRemoveAsset,
  onAllocationChange,
  onAddPortfolio,
  COLORS,
  useAssets = false,
  defaultSchemeCode
}) => {
  const getAllocationSum = (portfolio: SwpPortfolio) =>
    (portfolio.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0);

  const renderPortfolioControls = (portfolio: SwpPortfolio, pIdx: number) => (
    <LumpsumAssetControls
      selectedAssets={portfolio.selectedAssets || []}
      allocations={portfolio.allocations}
      onAssetSelect={(idx, asset) => onAssetSelect(pIdx, idx, asset)}
      onAddAsset={() => onAddAsset(pIdx)}
      onRemoveAsset={idx => onRemoveAsset(pIdx, idx)}
      onAllocationChange={(idx, value) => onAllocationChange(pIdx, idx, value)}
      useAssets={useAssets}
      defaultSchemeCode={defaultSchemeCode}
    />
  );

  return (
    <PortfolioListLayout
      portfolios={swpPortfolios}
      setPortfolios={setSwpPortfolios}
      COLORS={COLORS}
      onAddPortfolio={onAddPortfolio}
      getAllocationSum={getAllocationSum}
      renderPortfolioControls={renderPortfolioControls}
    />
  );
};
