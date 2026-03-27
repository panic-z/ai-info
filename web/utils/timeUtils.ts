/**
 * Get today's time boundaries (00:00:00 - 23:59:59)
 */
export function getTodayBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get this week's boundaries (Monday 00:00:00 - now)
 */
export function getThisWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

/**
 * Get this month's boundaries (1st 00:00:00 - now)
 */
export function getThisMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return { start, end: now };
}

/**
 * Get this year's boundaries (Jan 1 00:00:00 - now)
 */
export function getThisYearBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  return { start, end: now };
}

/**
 * Check if a date string is within a time range
 * Special handling for GitHub Trending items with timeRange field
 */
function isInTimeRange(publishedAt: string, start: Date, end: Date, timeRange?: string, timePeriod?: 'today' | 'thisWeek' | 'thisMonth'): boolean {
  try {
    // Special handling for GitHub Trending
    if (timeRange && timePeriod) {
      // Map time period to GitHub Trending's timeRange
      const rangeMapping = {
        'today': 'daily',
        'thisWeek': 'weekly',
        'thisMonth': 'monthly'
      };
      return timeRange === rangeMapping[timePeriod];
    }
    
    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) return false;
    return date >= start && date <= end;
  } catch {
    return false;
  }
}

export function isInToday(publishedAt: string, timeRange?: string): boolean {
  const { start, end } = getTodayBounds();
  return isInTimeRange(publishedAt, start, end, timeRange, 'today');
}

export function isInThisWeek(publishedAt: string, timeRange?: string): boolean {
  const { start, end } = getThisWeekBounds();
  return isInTimeRange(publishedAt, start, end, timeRange, 'thisWeek');
}

export function isInThisMonth(publishedAt: string, timeRange?: string): boolean {
  const { start, end } = getThisMonthBounds();
  return isInTimeRange(publishedAt, start, end, timeRange, 'thisMonth');
}

export function isInThisYear(publishedAt: string): boolean {
  const { start, end } = getThisYearBounds();
  return isInTimeRange(publishedAt, start, end);
}
