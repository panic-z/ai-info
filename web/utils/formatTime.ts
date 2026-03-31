export function formatTime(isoString?: string, lang: 'zh' | 'en' = 'zh'): string {
  if (!isoString) return lang === 'zh' ? '从未更新' : 'Never updated';

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return lang === 'zh' ? '时间未知' : 'Unknown time';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60000) return lang === 'zh' ? '刚刚' : 'Just now';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (lang === 'zh') {
      if (diffMins < 60) return `${diffMins} 分钟前`;
      if (diffHours < 24) return `${diffHours} 小时前`;
      if (diffDays < 30) return `${diffDays} 天前`;
      return date.toLocaleDateString('zh-CN');
    } else {
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US');
    }
  } catch {
    return lang === 'zh' ? '时间未知' : 'Unknown time';
  }
}
