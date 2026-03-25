import { useState, useEffect } from 'react';
import { indexService } from '../services/indexService';
import { ProcessedIndexData } from '../types/index';

export interface IndexOption {
  indexName: string;
  displayName: string;
}

export const useIndices = () => {
  const [indices, setIndices] = useState<IndexOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setLoading(true);
        setError(null);
        const indexNames = await indexService.fetchIndexNames();
        
        const indexOptions = indexNames.map(indexName => ({
          indexName,
          displayName: indexService.getDisplayName(indexName)
        }));
        
        setIndices(indexOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch indices');
      } finally {
        setLoading(false);
      }
    };

    fetchIndices();
  }, []);

  const getIndexData = async (indexName: string): Promise<ProcessedIndexData[]> => {
    return indexService.fetchIndexData(indexName);
  };

  return {
    indices,
    loading,
    error,
    getIndexData
  };
};