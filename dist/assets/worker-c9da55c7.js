self.onmessage=async function(s){const{navDataList:a,years:t,allocations:o,lumpsumAmount:l,sipAmount:n}=s.data,e=(await import("./index-35e0d092.js")).calculateHybridRollingXirr(a,t,o,l,n);self.postMessage(e)};
//# sourceMappingURL=worker-c9da55c7.js.map
