declare module 'xirr' {
  interface XirrTransaction {
    amount: number;
    when: Date;
  }
  function xirr(transactions: XirrTransaction[], options?: { guess?: number }): number;
  export = xirr;
} 