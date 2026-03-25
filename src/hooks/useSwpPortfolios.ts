import React from 'react';
import { SwpPortfolio } from '../types/swpPortfolio';
import { Asset } from '../types/asset';
import { getDefaultAllocations } from '../utils/data/getDefaultAllocations';
import { ALLOCATION_TOTAL } from '../constants';

export function useSwpPortfolios(DEFAULT_SCHEME_CODE: number) {
  const [swpPortfolios, setSwpPortfolios] = React.useState<SwpPortfolio[]>([
    {
      selectedAssets: [{
        type: 'index_fund',
        id: 'NIFTY 50',
        name: 'NIFTY 50',
        indexName: 'NIFTY 50',
        displayName: 'NIFTY 50'
      }],
      allocations: [ALLOCATION_TOTAL],
    },
  ]);

  const [years, setYears] = React.useState<number>(10);

  const handleAddPortfolio = () => {
    setSwpPortfolios(prev => [
      ...prev,
      { selectedAssets: [null], allocations: [ALLOCATION_TOTAL] }
    ]);
  };

  const handleAssetSelect = (portfolioIdx: number, idx: number, asset: Asset | null) => {
    setSwpPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAssets = p.selectedAssets.map((existing, j) => j === idx ? asset : existing);
      return { ...p, selectedAssets: newAssets };
    }));
  };

  const handleAddFund = (portfolioIdx: number) => {
    setSwpPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAssets = [...p.selectedAssets, null];
      const n = newAssets.length;
      const newAlloc = getDefaultAllocations(n);
      return { ...p, selectedAssets: newAssets, allocations: newAlloc };
    }));
  };

  const handleRemoveFund = (portfolioIdx: number, idx: number) => {
    setSwpPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAssets = p.selectedAssets.filter((_, j) => j !== idx);
      const n = newAssets.length;
      const newAlloc = n > 0 ? getDefaultAllocations(n) : [];
      return { ...p, selectedAssets: newAssets, allocations: newAlloc };
    }));
  };

  const handleAllocationChange = (portfolioIdx: number, fundIdx: number, value: number) => {
    setSwpPortfolios(prev => prev.map((p, i) => {
      if (i !== portfolioIdx) return p;
      const newAlloc = p.allocations.map((a, j) => j === fundIdx ? value : a);
      return { ...p, allocations: newAlloc };
    }));
  };

  return {
    swpPortfolios,
    setSwpPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleAssetSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
  };
}
