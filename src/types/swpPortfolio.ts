import { Asset } from './asset';

export interface SwpPortfolio {
  selectedAssets: (Asset | null)[];
  allocations: number[];
}
