import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getTodayBounds,
  getThisWeekBounds,
  getThisMonthBounds,
  getThisYearBounds,
  isInToday,
  isInThisWeek,
  isInThisMonth,
  isInThisYear,
} from './timeUtils';

describe('timeUtils', () => {
  describe('getTodayBounds', () => {
    it('should return start approximately 24 hours ago', () => {
      const before = Date.now();
      const { start } = getTodayBounds();
      const after = Date.now();
      const expectedStart = before - 24 * 60 * 60 * 1000;
      expect(start.getTime()).toBeGreaterThanOrEqual(expectedStart - 100);
      expect(start.getTime()).toBeLessThanOrEqual(after - 24 * 60 * 60 * 1000 + 100);
    });

    it('should return end as current time', () => {
      const before = Date.now();
      const { end } = getTodayBounds();
      const after = Date.now();
      expect(end.getTime()).toBeGreaterThanOrEqual(before);
      expect(end.getTime()).toBeLessThanOrEqual(after);
    });

    it('should return a 24-hour window', () => {
      const { start, end } = getTodayBounds();
      const diff = end.getTime() - start.getTime();
      expect(diff).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 100);
      expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 100);
    });

    it('should return start in current or previous day', () => {
      const now = new Date();
      const { start } = getTodayBounds();
      expect(start.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('getThisWeekBounds', () => {
    it('should return start at Monday 00:00:00.000 when today is Wednesday', () => {
      // Mock: Wednesday, March 25, 2026, 14:30:00 (actually Wednesday)
      const mockDate = new Date(2026, 2, 25, 14, 30, 0, 0); // Wednesday
      vi.setSystemTime(mockDate);

      const { start } = getThisWeekBounds();
      
      // Should be Monday (2 days back from Wednesday)
      expect(start.getDay()).toBe(1); // Monday
      expect(start.getDate()).toBe(23);
      expect(start.getMonth()).toBe(2); // March
      expect(start.getFullYear()).toBe(2026);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      vi.useRealTimers();
    });

    it('should handle Sunday correctly (go back 6 days to Monday)', () => {
      // Mock: Sunday, March 29, 2026, 10:00:00
      const mockDate = new Date(2026, 2, 29, 10, 0, 0, 0); // Sunday
      vi.setSystemTime(mockDate);

      const { start } = getThisWeekBounds();
      
      // Should be Monday (6 days back from Sunday)
      expect(start.getDay()).toBe(1); // Monday
      const expectedDate = 23; // March 23 is the Monday
      expect(start.getDate()).toBe(expectedDate);
      expect(start.getMonth()).toBe(2); // March
      expect(start.getFullYear()).toBe(2026);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      vi.useRealTimers();
    });

    it('should handle Monday correctly (go back 0 days)', () => {
      // Mock: Monday, March 23, 2026, 15:00:00
      const mockDate = new Date(2026, 2, 23, 15, 0, 0, 0); // Monday
      vi.setSystemTime(mockDate);

      const { start } = getThisWeekBounds();
      
      // Should be same Monday
      expect(start.getDay()).toBe(1); // Monday
      expect(start.getDate()).toBe(23);
      expect(start.getMonth()).toBe(2); // March
      expect(start.getFullYear()).toBe(2026);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      vi.useRealTimers();
    });

    it('should return end as current time', () => {
      const now = new Date();
      const { end } = getThisWeekBounds();
      
      // Allow for small time difference (test execution time)
      const diff = Math.abs(end.getTime() - now.getTime());
      expect(diff).toBeLessThan(100); // Less than 100ms difference
    });
  });

  describe('getThisMonthBounds', () => {
    it('should return start at 1st of month 00:00:00.000', () => {
      const { start } = getThisMonthBounds();
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });

    it('should return start in current month and year', () => {
      const now = new Date();
      const { start } = getThisMonthBounds();
      expect(start.getMonth()).toBe(now.getMonth());
      expect(start.getFullYear()).toBe(now.getFullYear());
    });

    it('should return end as current time', () => {
      const now = new Date();
      const { end } = getThisMonthBounds();
      
      const diff = Math.abs(end.getTime() - now.getTime());
      expect(diff).toBeLessThan(100);
    });
  });

  describe('getThisYearBounds', () => {
    it('should return start at January 1st 00:00:00.000', () => {
      const { start } = getThisYearBounds();
      expect(start.getMonth()).toBe(0); // January
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });

    it('should return start in current year', () => {
      const now = new Date();
      const { start } = getThisYearBounds();
      expect(start.getFullYear()).toBe(now.getFullYear());
    });

    it('should return end as current time', () => {
      const now = new Date();
      const { end } = getThisYearBounds();
      
      const diff = Math.abs(end.getTime() - now.getTime());
      expect(diff).toBeLessThan(100);
    });
  });

  describe('isInToday', () => {
    beforeEach(() => {
      // Mock: March 25, 2026, 14:00:00 local time
      vi.setSystemTime(new Date(2026, 2, 25, 14, 0, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for dates within today', () => {
      // Mock: March 25 14:00, window is March 24 14:00 → March 25 14:00
      expect(isInToday('2026-03-25T00:00:00')).toBe(true);  // within window
      expect(isInToday('2026-03-25T12:00:00')).toBe(true);  // within window
      expect(isInToday('2026-03-24T15:00:00')).toBe(true);  // yesterday but within 24h
    });

    it('should return false for dates older than 24 hours', () => {
      expect(isInToday('2026-03-24T13:59:59')).toBe(false); // more than 24h ago
    });

    it('should return false for tomorrow', () => {
      expect(isInToday('2026-03-26T00:00:00')).toBe(false);
    });

    it('should handle exact 24h boundary', () => {
      expect(isInToday('2026-03-24T14:00:00')).toBe(true);  // exactly at start boundary
    });

    it('should handle exact end-of-day boundary', () => {
      expect(isInToday('2026-03-25T14:00:00')).toBe(true);  // exactly at end (now)
      expect(isInToday('2026-03-25T23:59:59.999')).toBe(false); // after now
    });

    it('should return false for invalid date strings', () => {
      expect(isInToday('')).toBe(false);
      expect(isInToday('invalid')).toBe(false);
      expect(isInToday('2026-13-45')).toBe(false);
      expect(isInToday('not-a-date')).toBe(false);
    });
  });

  describe('isInThisWeek', () => {
    beforeEach(() => {
      // Mock: Wednesday, March 25, 2026, 14:00:00
      vi.setSystemTime(new Date(2026, 2, 25, 14, 0, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for dates from Monday to now', () => {
      // This week is Monday March 23 - Wednesday March 25 (now at 14:00)
      expect(isInThisWeek('2026-03-23T00:00:00')).toBe(true); // Monday
      expect(isInThisWeek('2026-03-24T12:00:00')).toBe(true); // Tuesday
      expect(isInThisWeek('2026-03-25T13:00:00')).toBe(true); // Wednesday (today, before 14:00)
    });

    it('should return false for last week', () => {
      expect(isInThisWeek('2026-03-22T23:59:59')).toBe(false); // Sunday last week
    });

    it('should return false for future dates in this week', () => {
      expect(isInThisWeek('2026-03-25T15:00:00')).toBe(false); // Future (after 14:00)
      expect(isInThisWeek('2026-03-26T00:00:00')).toBe(false); // Thursday (future)
    });

    it('should handle Monday boundary correctly', () => {
      expect(isInThisWeek('2026-03-23T00:00:00')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isInThisWeek('')).toBe(false);
      expect(isInThisWeek('invalid')).toBe(false);
      expect(isInThisWeek('2026-99-99')).toBe(false);
    });

    it('should handle Sunday edge case correctly', () => {
      // Mock: Sunday, March 29, 2026, 10:00:00
      vi.setSystemTime(new Date(2026, 2, 29, 10, 0, 0, 0));

      // This week is Monday March 23 - Sunday March 29 (now at 10:00)
      expect(isInThisWeek('2026-03-23T00:00:00')).toBe(true); // Monday
      expect(isInThisWeek('2026-03-29T09:00:00')).toBe(true); // Sunday (today, before 10:00)
      expect(isInThisWeek('2026-03-22T23:59:59')).toBe(false); // Last Sunday
    });
  });

  describe('isInThisMonth', () => {
    beforeEach(() => {
      // Mock: March 25, 2026, 14:00:00
      vi.setSystemTime(new Date(2026, 2, 25, 14, 0, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for dates from 1st of month to now', () => {
      expect(isInThisMonth('2026-03-01T00:00:00')).toBe(true);
      expect(isInThisMonth('2026-03-15T12:00:00')).toBe(true);
      expect(isInThisMonth('2026-03-25T13:00:00')).toBe(true);
    });

    it('should return false for last month', () => {
      expect(isInThisMonth('2026-02-28T23:59:59')).toBe(false);
    });

    it('should return false for future dates in this month', () => {
      expect(isInThisMonth('2026-03-25T15:00:00')).toBe(false);
      expect(isInThisMonth('2026-03-26T00:00:00')).toBe(false);
    });

    it('should handle 1st of month boundary correctly', () => {
      expect(isInThisMonth('2026-03-01T00:00:00')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isInThisMonth('')).toBe(false);
      expect(isInThisMonth('invalid')).toBe(false);
      expect(isInThisMonth('2026-03-32')).toBe(false);
    });

    it('should handle month boundaries across different month lengths', () => {
      // Mock: February 28, 2026, 23:59:59
      vi.setSystemTime(new Date(2026, 1, 28, 23, 59, 59, 999));
      
      expect(isInThisMonth('2026-02-01T00:00:00')).toBe(true);
      expect(isInThisMonth('2026-02-28T23:00:00')).toBe(true);
      expect(isInThisMonth('2026-03-01T00:00:00')).toBe(false);
    });
  });

  describe('isInThisYear', () => {
    beforeEach(() => {
      // Mock: March 25, 2026, 14:00:00
      vi.setSystemTime(new Date(2026, 2, 25, 14, 0, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for dates from Jan 1 to now', () => {
      expect(isInThisYear('2026-01-01T00:00:00')).toBe(true);
      expect(isInThisYear('2026-02-15T12:00:00')).toBe(true);
      expect(isInThisYear('2026-03-25T13:00:00')).toBe(true);
    });

    it('should return false for last year', () => {
      expect(isInThisYear('2025-12-31T23:59:59')).toBe(false);
    });

    it('should return false for future dates in this year', () => {
      expect(isInThisYear('2026-03-25T15:00:00')).toBe(false);
      expect(isInThisYear('2026-12-31T23:59:59')).toBe(false);
    });

    it('should handle Jan 1 boundary correctly', () => {
      expect(isInThisYear('2026-01-01T00:00:00')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isInThisYear('')).toBe(false);
      expect(isInThisYear('invalid')).toBe(false);
      expect(isInThisYear('2026-13-01')).toBe(false);
    });

    it('should handle year boundaries correctly', () => {
      // Mock: January 1, 2026, 00:00:00
      vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0, 0));
      
      expect(isInThisYear('2026-01-01T00:00:00')).toBe(true);
      expect(isInThisYear('2025-12-31T23:59:59')).toBe(false);
    });
  });

  describe('Edge Cases - Boundary Testing', () => {
    beforeEach(() => {
      // Mock: March 25, 2026, 14:00:00
      vi.setSystemTime(new Date(2026, 2, 25, 14, 0, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle dates at exact midnight boundaries', () => {
      // Mock: March 25 14:00, window is March 24 14:00 → March 25 14:00
      expect(isInToday('2026-03-25T00:00:00')).toBe(true);   // within window
      expect(isInToday('2026-03-24T23:59:59')).toBe(true);   // within window (after March 24 14:00)
      expect(isInToday('2026-03-24T13:59:59')).toBe(false);  // outside window
    });

    it('should handle dates at exact end-of-day boundaries', () => {
      expect(isInToday('2026-03-25T23:59:59.999')).toBe(false); // after now (14:00)
      expect(isInToday('2026-03-26T00:00:00')).toBe(false);
    });

    it('should handle millisecond precision', () => {
      // Mock: March 25 14:00, window is March 24 14:00 → March 25 14:00
      expect(isInToday('2026-03-24T13:59:59.999')).toBe(false); // just before window
      expect(isInToday('2026-03-24T14:00:00.000')).toBe(true);  // start of window
      expect(isInToday('2026-03-25T13:59:59.999')).toBe(true);  // within window
      expect(isInToday('2026-03-26T00:00:00.000')).toBe(false); // after now
    });
  });

  describe('Invalid Input Handling', () => {
    it('should handle null-like values gracefully', () => {
      expect(isInToday('')).toBe(false);
      expect(isInThisWeek('')).toBe(false);
      expect(isInThisMonth('')).toBe(false);
      expect(isInThisYear('')).toBe(false);
    });

    it('should handle malformed ISO strings', () => {
      const now = new Date();
      const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayShortMonth = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const todaySlash = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
      expect(isInToday(todayISO)).toBe(true); // This is actually valid
      expect(isInToday(todayShortMonth)).toBe(true); // This might also work
      expect(isInToday(todaySlash)).toBe(true); // Date constructor is forgiving
    });

    it('should handle completely invalid strings', () => {
      expect(isInToday('totally not a date')).toBe(false);
      expect(isInThisWeek('foobar')).toBe(false);
      expect(isInThisMonth('123abc')).toBe(false);
      expect(isInThisYear('[]{}()')).toBe(false);
    });

    it('should handle invalid dates that parse but are nonsensical', () => {
      expect(isInToday('2026-99-99')).toBe(false);
      expect(isInThisWeek('2026-13-45')).toBe(false);
      expect(isInThisMonth('2026-00-00')).toBe(false);
    });
  });
});
