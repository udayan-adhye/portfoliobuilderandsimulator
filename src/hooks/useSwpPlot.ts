import { useCallback } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { indexService } from '../services/indexService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { fixedReturnService } from '../services/fixedReturnService';
import { inflationService } from '../services/inflationService';
import { govSchemeService } from '../services/govSchemeService';
import { trackSimulation } from '../utils/analytics';

const swpCache = new Map<string, any[]>();

function portfolioCacheKey(portfolio: any, years: number, corpus: number, withdrawal: number): string {
  return JSON.stringify({
    assets: (portfolio.selectedAssets || []).filter(Boolean).map((a: any) => ({ id: a.id, type: a.type })),
    allocations: portfolio.allocations,
    years,
    corpus,
    withdrawal,
  });
}

export function useSwpPlot({
  swpPortfolios,
  years,
  loadNavData,
  plotState,
  initialCorpus,
  monthlyWithdrawal,
}: {
  swpPortfolios: any[];
  years: number;
  loadNavData: (schemeCode: number) => Promise<any[]>;
  plotState: any;
  initialCorpus: number;
  monthlyWithdrawal: number;
}) {
  const handlePlotAllPortfolios = useCallback(async () => {
    trackSimulation('SWP', 'Plot');
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

      for (let pIdx = 0; pIdx < swpPortfolios.length; ++pIdx) {
        const navs: any[][] = [];

        if (swpPortfolios[pIdx].selectedAssets && swpPortfolios[pIdx].selectedAssets.length > 0) {
          for (const asset of swpPortfolios[pIdx].selectedAssets.filter(Boolean)) {
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

      const allSwpDatas: Record<string, any[]> = {};

      const workerPromises = swpPortfolios.map((_, pIdx) => {
        const navDataList = allNavDatas[pIdx];
        const allocations = swpPortfolios[pIdx].allocations;
        const cacheKey = portfolioCacheKey(swpPortfolios[pIdx], years, initialCorpus, monthlyWithdrawal);

        if (!navDataList || navDataList.length === 0) {
          allSwpDatas[`Portfolio ${pIdx + 1}`] = [];
          return Promise.resolve();
        }

        const cached = swpCache.get(cacheKey);
        if (cached) {
          console.log(`[SWP] Portfolio ${pIdx + 1}: cache hit (${cached.length} data points)`);
          allSwpDatas[`Portfolio ${pIdx + 1}`] = cached;
          return Promise.resolve();
        }

        const portfolioStartTime = performance.now();

        return new Promise<void>((resolve) => {
          const worker = new Worker(
            new URL('../utils/calculations/swpSimulation/worker.ts', import.meta.url)
          );
          worker.postMessage({
            navDataList,
            years,
            allocations,
            initialCorpus,
            monthlyWithdrawal,
          });
          worker.onmessage = (event: MessageEvent) => {
            const portfolioEndTime = performance.now();
            const resultData = event.data;
            console.log(
              `[SWP] Portfolio ${pIdx + 1} total: ${((portfolioEndTime - portfolioStartTime) / 1000).toFixed(2)}s (${resultData.length} data points)`
            );
            swpCache.set(cacheKey, resultData);
            allSwpDatas[`Portfolio ${pIdx + 1}`] = resultData;
            worker.terminate();
            resolve();
          };
          worker.onerror = (err: ErrorEvent) => {
            console.error(`Error calculating SWP for portfolio ${pIdx + 1}:`, err);
            allSwpDatas[`Portfolio ${pIdx + 1}`] = [];
            worker.terminate();
            resolve();
          };
        });
      });

      await Promise.all(workerPromises);

      // Store SWP data in the lumpSumXirrDatas slot (reusing existing state)
      plotState.setLumpSumXirrDatas(allSwpDatas);
      plotState.setHasPlotted(true);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      plotState.setXirrError('Error loading or calculating data: ' + errorMsg);
      console.error('Error loading or calculating data:', e);
      plotState.setLoadingNav(false);
      plotState.setLoadingXirr(false);
    }
  }, [swpPortfolios, years, loadNavData, plotState, initialCorpus, monthlyWithdrawal]);

  return { handlePlotAllPortfolios };
}
