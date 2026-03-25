self.onmessage=async function(a){const{navDataList:s,years:t,allocations:l,initialCorpus:o,monthlyWithdrawal:n}=a.data,e=(await import("./index-80a7c0d8.js")).calculateRollingSwp(s,t,o,n,l);self.postMessage(e)};
//# sourceMappingURL=worker-759134fa.js.map
