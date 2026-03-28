import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const mockNow = new Date(2026, 2, 27, 12, 0, 0, 0); // 2026-03-27 12:00:00

  it('should return "从未更新" for undefined', () => {
    expect(formatTime(undefined)).toBe('从未更新');
  });

  it('should return "从未更新" for empty string', () => {
    expect(formatTime('')).toBe('从未更新');
  });

  it('should return "时间未知" for invalid date string', () => {
    expect(formatTime('not-a-date')).toBe('时间未知');
    expect(formatTime('2026-99-99')).toBe('时间未知');
  });

  it('should return "刚刚" for dates less than 1 minute ago', () => {
    vi.setSystemTime(mockNow);
    const thirtySecsAgo = new Date(mockNow.getTime() - 30000).toISOString();
    expect(formatTime(thirtySecsAgo)).toBe('刚刚');
  });

  it('should return "刚刚" for future dates (negative diff)', () => {
    vi.setSystemTime(mockNow);
    const future = new Date(mockNow.getTime() + 60000).toISOString();
    expect(formatTime(future)).toBe('刚刚');
  });

  it('should return "N 分钟前" for dates 1-59 minutes ago', () => {
    vi.setSystemTime(mockNow);
    const fiveMinsAgo = new Date(mockNow.getTime() - 5 * 60000).toISOString();
    expect(formatTime(fiveMinsAgo)).toBe('5 分钟前');

    const fiftyNineMinsAgo = new Date(mockNow.getTime() - 59 * 60000).toISOString();
    expect(formatTime(fiftyNineMinsAgo)).toBe('59 分钟前');
  });

  it('should return "N 小时前" for dates 1-23 hours ago', () => {
    vi.setSystemTime(mockNow);
    const twoHoursAgo = new Date(mockNow.getTime() - 2 * 3600000).toISOString();
    expect(formatTime(twoHoursAgo)).toBe('2 小时前');

    const twentyThreeHoursAgo = new Date(mockNow.getTime() - 23 * 3600000).toISOString();
    expect(formatTime(twentyThreeHoursAgo)).toBe('23 小时前');
  });

  it('should return "N 天前" for dates 1-29 days ago', () => {
    vi.setSystemTime(mockNow);
    const threeDaysAgo = new Date(mockNow.getTime() - 3 * 86400000).toISOString();
    expect(formatTime(threeDaysAgo)).toBe('3 天前');

    const twentyNineDaysAgo = new Date(mockNow.getTime() - 29 * 86400000).toISOString();
    expect(formatTime(twentyNineDaysAgo)).toBe('29 天前');
  });

  it('should return localized date string for dates 30+ days ago', () => {
    vi.setSystemTime(mockNow);
    const thirtyDaysAgo = new Date(mockNow.getTime() - 30 * 86400000).toISOString();
    const result = formatTime(thirtyDaysAgo);
    // Should be a date string, not a relative time
    expect(result).not.toContain('前');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle exact boundary: 60 minutes', () => {
    vi.setSystemTime(mockNow);
    const exactlyOneHourAgo = new Date(mockNow.getTime() - 60 * 60000).toISOString();
    expect(formatTime(exactlyOneHourAgo)).toBe('1 小时前');
  });

  it('should handle exact boundary: 24 hours', () => {
    vi.setSystemTime(mockNow);
    const exactlyOneDayAgo = new Date(mockNow.getTime() - 24 * 3600000).toISOString();
    expect(formatTime(exactlyOneDayAgo)).toBe('1 天前');
  });
});
