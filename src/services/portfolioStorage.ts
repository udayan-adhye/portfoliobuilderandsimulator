/**
 * Portfolio Save/Load Service
 *
 * Saves and loads portfolio configurations to/from localStorage.
 * Each saved config includes the portfolio type (SIP/Lumpsum/SWP/Hybrid),
 * asset selections, allocations, and simulation parameters.
 */

export interface SavedPortfolioConfig {
  id: string;
  name: string;
  type: 'sip' | 'lumpsum' | 'swp' | 'hybrid';
  createdAt: string;
  updatedAt: string;
  portfolios: any[];
  params: {
    years?: number;
    sipAmount?: number;
    lumpsumAmount?: number;
    monthlyWithdrawal?: number;
    initialCorpus?: number;
    chartView?: string;
    rebalancingEnabled?: boolean;
    stepUpEnabled?: boolean;
    stepUpPercentage?: number;
  };
}

const STORAGE_KEY = 'portfolio_simulator_saved_configs';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const portfolioStorage = {
  /**
   * Get all saved configs
   */
  getAll(): SavedPortfolioConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save a new portfolio config
   */
  save(config: Omit<SavedPortfolioConfig, 'id' | 'createdAt' | 'updatedAt'>): SavedPortfolioConfig {
    const saved: SavedPortfolioConfig = {
      ...config,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = this.getAll();
    all.unshift(saved); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return saved;
  },

  /**
   * Update an existing config
   */
  update(id: string, updates: Partial<SavedPortfolioConfig>): SavedPortfolioConfig | null {
    const all = this.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return null;

    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all[idx];
  },

  /**
   * Delete a saved config
   */
  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter(c => c.id !== id);
    if (filtered.length === all.length) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  /**
   * Get configs by type
   */
  getByType(type: SavedPortfolioConfig['type']): SavedPortfolioConfig[] {
    return this.getAll().filter(c => c.type === type);
  },

  /**
   * Export all configs as JSON (for backup)
   */
  exportAll(): string {
    return JSON.stringify(this.getAll(), null, 2);
  },

  /**
   * Import configs from JSON
   */
  importConfigs(json: string): number {
    try {
      const configs: SavedPortfolioConfig[] = JSON.parse(json);
      if (!Array.isArray(configs)) return 0;

      const existing = this.getAll();
      const existingIds = new Set(existing.map(c => c.id));
      const newConfigs = configs.filter(c => !existingIds.has(c.id));

      const merged = [...newConfigs, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return newConfigs.length;
    } catch {
      return 0;
    }
  },
};
