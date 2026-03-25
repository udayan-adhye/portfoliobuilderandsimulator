import { renderHook, act } from '@testing-library/react';
import { useNavData } from './useNavData';
import * as mfapiNavService from '../services/mfapiNavService';

describe('useNavData', () => {
  const mockNavData = [
    { date: new Date('2025-05-09'), nav: 166.2945 },
    { date: new Date('2025-05-08'), nav: 168.1311 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch on mount', () => {
    const fetchSpy = jest.spyOn(mfapiNavService, 'fetchNavData');
    renderHook(() => useNavData());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches and sets navData when loadNavData is called', async () => {
    jest.spyOn(mfapiNavService, 'fetchNavData').mockResolvedValueOnce(mockNavData);
    const { result } = renderHook(() => useNavData());
    await act(async () => {
      await result.current.loadNavData(120716);
    });
    expect(result.current.navData).toEqual(mockNavData);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.navData[0].date instanceof Date).toBe(true);
    expect(typeof result.current.navData[0].nav).toBe('number');
  });

  it('handles error when fetchNavData fails', async () => {
    jest.spyOn(mfapiNavService, 'fetchNavData').mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useNavData());
    await act(async () => {
      await result.current.loadNavData(120716);
    });
    expect(result.current.navData).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch NAV data');
    expect(result.current.loading).toBe(false);
  });
}); 