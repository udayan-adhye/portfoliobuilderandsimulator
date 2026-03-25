import { useState, useCallback } from 'react';
import { NavEntry } from '../types/navData';
import { fetchNavData } from '../services/mfapiNavService';

export const useNavData = () => {
  const [navData, setNavData] = useState<NavEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNavData = useCallback(async (schemeCode: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNavData(schemeCode);
      setNavData(data);
      return data;
    } catch (err) {
      setError('Failed to fetch NAV data');
      setNavData([]);
      console.error('Error fetching NAV data:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { navData, loading, error, loadNavData };
}; 