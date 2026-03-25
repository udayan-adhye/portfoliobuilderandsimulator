self.onmessage=async function(s){const{navDataList:t,years:a,allocations:e,investmentAmount:n}=s.data,o=(await import("./index-6083953c.js")).calculateLumpSumRollingXirr(t,a,e,n);self.postMessage(o)};
//# sourceMappingURL=worker-c4c5cfc1.js.map
