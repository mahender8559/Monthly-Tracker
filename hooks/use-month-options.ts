import { useMemo } from 'react';

export function useMonthOptions(startYear = 2025, count = 36) {
  return useMemo(() => Array.from({ length: count }, (_, index) => new Date(startYear, index).toLocaleString('en-US', { month: 'long', year: 'numeric' })), [startYear, count]);
}
