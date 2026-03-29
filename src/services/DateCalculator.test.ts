import { DateCalculator } from './DateCalculator';
import { PeriodConfig } from '../types';

describe('DateCalculator', () => {
  let calc: DateCalculator;

  beforeEach(() => {
    calc = new DateCalculator();
  });

  // --- calculateTargetDates ---

  describe('calculateTargetDates', () => {
    it('should calculate 1 year ago from a given date', () => {
      const ref = new Date(2026, 2, 29); // 2026-03-29
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'year', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results).toHaveLength(1);
      expect(results[0].date).toEqual(new Date(2025, 2, 29));
      expect(results[0].label).toBe('1 year ago');
    });

    it('should calculate 6 months ago from a given date', () => {
      const ref = new Date(2026, 2, 29); // 2026-03-29
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 6, unit: 'month', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results).toHaveLength(1);
      expect(results[0].date).toEqual(new Date(2025, 8, 29)); // 2025-09-29
      expect(results[0].label).toBe('6 months ago');
    });

    it('should calculate 1 month ago with month-end clamping', () => {
      // 2026-03-31 minus 1 month -> Feb has 28 days -> 2026-02-28
      const ref = new Date(2026, 2, 31); // 2026-03-31
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'month', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results[0].date).toEqual(new Date(2026, 1, 28)); // 2026-02-28
    });

    it('should calculate 1 week ago', () => {
      const ref = new Date(2026, 2, 29);
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'week', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results[0].date).toEqual(new Date(2026, 2, 22));
      expect(results[0].label).toBe('1 week ago');
    });

    it('should calculate 3 days ago', () => {
      const ref = new Date(2026, 2, 29);
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 3, unit: 'day', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results[0].date).toEqual(new Date(2026, 2, 26));
      expect(results[0].label).toBe('3 days ago');
    });

    it('should handle multiple periods and return dates sorted oldest first', () => {
      const ref = new Date(2026, 2, 29);
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'month', enabled: true },
        { type: 'relative', amount: 1, unit: 'year', enabled: true },
        { type: 'relative', amount: 6, unit: 'month', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results).toHaveLength(3);
      // oldest first: 1yr ago, 6mo ago, 1mo ago
      expect(results[0].date).toEqual(new Date(2025, 2, 29)); // 1 year
      expect(results[1].date).toEqual(new Date(2025, 8, 29)); // 6 months
      expect(results[2].date).toEqual(new Date(2026, 1, 28)); // 1 month (clamped)
    });

    it('should skip disabled periods', () => {
      const ref = new Date(2026, 2, 29);
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'year', enabled: false },
        { type: 'relative', amount: 1, unit: 'month', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results).toHaveLength(1);
      expect(results[0].label).toBe('1 month ago');
    });

    it('should return empty array for empty periods', () => {
      const ref = new Date(2026, 2, 29);
      const results = calc.calculateTargetDates(ref, []);
      expect(results).toEqual([]);
    });

    it('should skip random-type periods (handled separately)', () => {
      const ref = new Date(2026, 2, 29);
      const periods: PeriodConfig[] = [
        { type: 'random', amount: 0, unit: 'day', enabled: true },
        { type: 'relative', amount: 1, unit: 'year', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results).toHaveLength(1);
      expect(results[0].label).toBe('1 year ago');
    });

    it('should handle leap year: Feb 29 minus 1 year -> Feb 28', () => {
      const ref = new Date(2024, 1, 29); // 2024-02-29 (leap year)
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'year', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results[0].date).toEqual(new Date(2023, 1, 28)); // 2023-02-28
    });

    it('should handle Jan 31 minus 1 month -> Dec 31', () => {
      const ref = new Date(2026, 0, 31); // 2026-01-31
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'month', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results[0].date).toEqual(new Date(2025, 11, 31)); // 2025-12-31
    });

    it('should handle year boundary: Jan 15 minus 1 month -> Dec 15', () => {
      const ref = new Date(2026, 0, 15);
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'month', enabled: true },
      ];
      const results = calc.calculateTargetDates(ref, periods);
      expect(results[0].date).toEqual(new Date(2025, 11, 15));
    });
  });

  // --- parseDateFromFilename ---

  describe('parseDateFromFilename', () => {
    it('should parse YYYY-MM-DD from a daily note filename', () => {
      const result = calc.parseDateFromFilename('2025-03-29.md');
      expect(result).toEqual(new Date(2025, 2, 29));
    });

    it('should parse YYYY-MM-DD from a full path', () => {
      const result = calc.parseDateFromFilename('00-Inbox/2025-03-29.md');
      expect(result).toEqual(new Date(2025, 2, 29));
    });

    it('should return null for non-date filenames', () => {
      expect(calc.parseDateFromFilename('My Note.md')).toBeNull();
    });

    it('should return null for invalid dates', () => {
      expect(calc.parseDateFromFilename('2025-13-45.md')).toBeNull();
    });
  });

  // --- formatDateToFilename ---

  describe('formatDateToFilename', () => {
    it('should format date as YYYY-MM-DD', () => {
      expect(calc.formatDateToFilename(new Date(2025, 2, 29))).toBe('2025-03-29');
    });

    it('should zero-pad month and day', () => {
      expect(calc.formatDateToFilename(new Date(2025, 0, 5))).toBe('2025-01-05');
    });
  });

  // --- formatLabel ---

  describe('formatLabel', () => {
    it('should produce "1 year ago"', () => {
      expect(calc.formatLabel({ type: 'relative', amount: 1, unit: 'year', enabled: true }))
        .toBe('1 year ago');
    });

    it('should produce "6 months ago"', () => {
      expect(calc.formatLabel({ type: 'relative', amount: 6, unit: 'month', enabled: true }))
        .toBe('6 months ago');
    });

    it('should produce "1 week ago"', () => {
      expect(calc.formatLabel({ type: 'relative', amount: 1, unit: 'week', enabled: true }))
        .toBe('1 week ago');
    });

    it('should produce "3 days ago"', () => {
      expect(calc.formatLabel({ type: 'relative', amount: 3, unit: 'day', enabled: true }))
        .toBe('3 days ago');
    });

    it('should produce "Random" for random type', () => {
      expect(calc.formatLabel({ type: 'random', amount: 0, unit: 'day', enabled: true }))
        .toBe('Random');
    });
  });

  // --- getRandomPeriodCount ---

  describe('getRandomPeriodCount', () => {
    it('should return count of enabled random periods', () => {
      const periods: PeriodConfig[] = [
        { type: 'random', amount: 0, unit: 'day', enabled: true },
        { type: 'random', amount: 0, unit: 'day', enabled: true },
        { type: 'relative', amount: 1, unit: 'year', enabled: true },
        { type: 'random', amount: 0, unit: 'day', enabled: false },
      ];
      expect(calc.getRandomPeriodCount(periods)).toBe(2);
    });

    it('should return 0 when no random periods', () => {
      const periods: PeriodConfig[] = [
        { type: 'relative', amount: 1, unit: 'year', enabled: true },
      ];
      expect(calc.getRandomPeriodCount(periods)).toBe(0);
    });
  });
});
