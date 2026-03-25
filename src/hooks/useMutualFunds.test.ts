import { renderHook, waitFor } from '@testing-library/react';
import { useMutualFunds } from './useMutualFunds';
import { fetchMutualFunds } from '../services/mfapiFundNamesService';

// Mock the mutual fund service
jest.mock('../services/mfapiFundNamesService', () => ({
  fetchMutualFunds: jest.fn()
}));

describe('useMutualFunds', () => {
  const mockFunds = [
    { schemeCode: 123, schemeName: 'Fund 1' },
    { schemeCode: 456, schemeName: 'Fund 2' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches mutual funds on mount', async () => {
    (fetchMutualFunds as jest.Mock).mockResolvedValueOnce(mockFunds);
    const { result } = renderHook(() => useMutualFunds());
    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.funds).toEqual([]);
    // Wait for the data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Final state
    expect(result.current.funds).toEqual(mockFunds);
    expect(result.current.error).toBe(null);
    expect(fetchMutualFunds).toHaveBeenCalledTimes(1);
  });

  it('handles fetch error on mount', async () => {
    const errorMessage = 'Failed to fetch funds';
    (fetchMutualFunds as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    const { result } = renderHook(() => useMutualFunds());
    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.funds).toEqual([]);
    // Wait for the error to be handled
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Final state
    expect(result.current.funds).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch mutual funds');
    expect(fetchMutualFunds).toHaveBeenCalledTimes(1);
  });
}); 