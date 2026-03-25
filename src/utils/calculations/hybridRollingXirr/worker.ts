// worker.ts - Web Worker for Hybrid (Lumpsum + SIP) XIRR calculation

self.onmessage = async function(e) {
  const { navDataList, years, allocations, lumpsumAmount, sipAmount } = e.data;
  const module = await import('./index');
  const result = module.calculateHybridRollingXirr(
    navDataList,
    years,
    allocations,
    lumpsumAmount,
    sipAmount,
  );
  self.postMessage(result);
};
