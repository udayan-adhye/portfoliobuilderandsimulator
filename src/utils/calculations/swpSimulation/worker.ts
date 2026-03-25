// worker.ts - Web Worker for SWP simulation calculation

self.onmessage = async function(e) {
  const { navDataList, years, allocations, initialCorpus, monthlyWithdrawal } = e.data;
  const module = await import('./index');
  const result = module.calculateRollingSwp(
    navDataList,
    years,
    initialCorpus,
    monthlyWithdrawal,
    allocations
  );
  self.postMessage(result);
};
