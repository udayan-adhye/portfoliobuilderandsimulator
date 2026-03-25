import { useCallback } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { indexService } from '../services/indexService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { fixedReturnService } from '../services/fixedReturnService';
import { inflationService } from '../services/inflationService';
import { govSchemeService } from '../services/govSchemeService';
import { trackSimulation } from '../utils/analytics';

const hybridCache = new Map<string, any[]>();

function portfolioCacheKey(portfolio: any, years: number, lumpsum: number, sip: number): string {
  return JSON.stringify({
    assets: (portfolio.selectedAssets || []).filter(Boolean).map((a: any) => ({ id: a.id, type: a.type })),
    allocations: portfolio.allocations,
    years,
    lumpsum,
    sip,
  });
}

export function useHybridPlot({
  portfolios,
  years,
  loadNavData,
  plotState,
  lumpsumAmount,
  sipAmount,
}: {
  portfolios: any[];
  years: number;
  loadNavData: (schemeCode: number) => Promise<any[]>;
  plotState: any;
  lumpsumAmount: number;
  sipAmount: number;
}) {
  const handlePlotAllPortfolios = useCallback(async () => {
    trackSimulation('Hybrid', 'Plot');
    plotState.setLoadingNav(true);
    plotState.setLoadingXirr(false);
    plotState.setHasPlotted(false);
    plotState.setNavDatas({});
    plotState.setLumpSumXirrDatas({});
    plotState.setSipXirrDatas({});
    plotState.setXirrError(null);

    try {
      const allNavDatas: Record<string, any[][]> = {};
      const allNavsFlat: Record<string, any[]> = {};

      for (let pIdx = 0; pIdx < portfolios.length; ++pIdx) {
        const navs: any[][] = [];

        if (portfolios[pIdx].selectedAssets && portfolios[pIdx].selectedAssets.length > 0) {
          for (const asset of portfolios[pIdx].selectedAssets.filter(Boolean)) {
            try {
              let nav: any[] = [];
              let identifier: string = '';

              if (asset.type === 'mutual_fund') {
                nav = await loadNavData(asset.schemeCode);
                identifier = `${pIdx}_${asset.schemeCode}`;
              } else if (asset.type === 'index_fund') {
                const indexData = await indexService.fetchIndexData(asset.indexName);
                if (!indexData || indexData.length === 0) continue;
                nav = indexData.map(item => ({ date: item.date, nav: item.nav }));
                identifier = `${pIdx}_${asset.indexName}`;
              } else if (asset.type === 'yahoo_finance') {
                const stockData = await yahooFinanceService.fetchStockData(asset.symbol);
                if (!stockData || stockData.length === 0) continue;
                nav = stockData.map(item => ({ date: item.date, nav: item.nav }));
                identifier = `${pIdx}_${asset.symbol}`;
              } else if (asset.type === 'fixed_return') {
                const fixedReturnData = fixedReturnService.generateFixedReturnData(asset.annualReturnPercentage, 1990);
                if (!fixedReturnData || fixedReturnData.length === 0) continue;
                nav = fixedReturnData;
                identifier = `${pIdx}_fixed_${asset.annualReturnPercentage}`;
              } else if (asset.type === 'inflation') {
                const inflationData = await inflationService.generateInflationNavData(asset.countryCode, 1960);
                if (!inflationData || inflationData.length === 0) continue;
                nav = inflationData;
                identifier = `${pIdx}_inflation_${asset.countryCode}`;
              } else if (asset.type === 'gov_scheme') {
                const govData = govSchemeService.generateGovSchemeData(asset.scheme);
                if (!govData || govData.length === 0) continue;
                nav = govData;
                identifier = `${pIdx}_gov_${asset.scheme}`;
              }

              if (!Array.isArray(nav) || nav.length === 0) continue;
              const filled = fillMissingNavDates(nav);
              navs.push(filled);
              allNavsFlat[identifier] = filled;
            } catch (error) {
              console.error(`Error fetching data for asset ${asset.name}:`, error);
              throw error;
            }
          }
        }
        allNavDatas[pIdx] = navs;
      }

      plotState.setNavDatas(allNavsFlat);
      plotState.setLoadingXirr(true);

      const allHybridDatas: Record<string, any[]> = {};

      const workerPromises = portfolios.map((_, pIdx) => {
        const navDataList = allNavDatas[pIdx];
        const allocations = portfolios[pIdx].allocations;
        const cacheKey = portfolioCacheKey(portfolios[pIdx], years, lumpsumAmount, sipAmount);

        if (!navDataList || navDataList.length === 0) {
          allHybridDatas[`Portfolio ${pIdx + 1}`] = [];
          return Promise.resolve();
        }

        const cached = hybridCache.get(cacheKey);
        if (cached) {
          allHybridDatas[`Portfolio ${pIdx + 1}`] = cached;
          return Promise.resolve();
        }

        const portfolioStartTime = performance.now();

        return new Promise<void>((resolve) => {
          const worker = new Worker(
            new URL('../utils/calculations/hybridRollingXirr/worker.ts', import.meta.url)
          );
          worker.postMessage({ navDataList, years, allocations, lumpsumAmount, sipAmount });
          worker.onmessage = (event: MessageEvent) => {
            const elapsed = ((performance.now() - portfolioStartTime) / 1000).toFixed(2);
            const resultData = event.data;
            console.log(`[Hybrid] Portfolio ${pIdx + 1}: ${elapsed}s (${resultData.length} data points)`);
            hybridCache.set(cacheKey, resultData);
            allHybridDatas[`Portfolio ${pIdx + 1}`] = resultData;
            worker.terminate();
            resolve();
          };
          worker.onerror = (err: ErrorEvent) => {
            allHybridDatas[`Portfolio ${pIdx + 1}`] = [];
            worker.terminate();
            resolve();
          };
        });
      });

      await Promise.all(workerPromises);

      plotState.setLumpSumXirrDatas(allHybridDatas);
      plotState.setHasPlotted(true);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      plotState.setXirrError('Error loading or calculating data: ' + errorMsg);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    }
  }, [portfolios, years, loadNavData, plotState, lumpsumAmount, sipAmount]);

  return { handlePlotAllPortfolios };
}
