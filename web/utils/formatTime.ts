/**
 * Format an ISO date string as a relative time string in Chinese.
 * Returns "刚刚" for future dates or dates less than 1 minute ago.
 */
export function formatTime(isoString?: string): string {
  if (!isoString) return '从未更新';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return '时间未知';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Handle future dates or sub-minute differences
    if (diffMs < 60000) return '刚刚';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 30) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  } catch {
    return '时间未知';
  }
}
