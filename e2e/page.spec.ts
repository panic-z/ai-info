import { test, expect } from '@playwright/test';

test.describe('AI Info 页面交互', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待页面加载完成（loading spinner 消失）
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 });
  });

  // ── Header 时间筛选 ──────────────────────────────────────────────

  test('时间筛选：今日/本周/本月 切换', async ({ page }) => {
    // 默认选中"今日"
    const todayBtn = page.getByRole('button', { name: /今日/ });
    await expect(todayBtn).toHaveClass(/bg-\[hsl\(var\(--foreground\)\)\]/);

    // 点击"本周"
    await page.getByRole('button', { name: /本周/ }).click();
    const weekBtn = page.getByRole('button', { name: /本周/ });
    await expect(weekBtn).toHaveClass(/bg-\[hsl\(var\(--foreground\)\)\]/);

    // 点击"本月"
    await page.getByRole('button', { name: /本月/ }).click();
    const monthBtn = page.getByRole('button', { name: /本月/ });
    await expect(monthBtn).toHaveClass(/bg-\[hsl\(var\(--foreground\)\)\]/);
  });

  // ── Header 分类筛选 ──────────────────────────────────────────────

  test('分类筛选：全部/新闻/技术 切换', async ({ page }) => {
    // 默认选中"全部"
    const allBtn = page.getByRole('button', { name: /^全部/ });
    await expect(allBtn).toHaveClass(/bg-\[hsl\(var\(--foreground\)\)\]/);

    // 点击"新闻"
    await page.getByRole('button', { name: /^新闻/ }).click();
    await expect(page.getByRole('button', { name: /^新闻/ })).toHaveClass(/bg-\[hsl\(var\(--foreground\)\)\]/);

    // 点击"技术"
    await page.getByRole('button', { name: /^技术/ }).click();
    await expect(page.getByRole('button', { name: /^技术/ })).toHaveClass(/bg-\[hsl\(var\(--foreground\)\)\]/);

    // 切回"全部"
    await page.getByRole('button', { name: /^全部/ }).click();
    await expect(allBtn).toHaveClass(/bg-\[hsl\(var\(--foreground\)\)\]/);
  });

  // ── 时间 + 分类 组合筛选 ─────────────────────────────────────────

  test('切换时间后分类计数同步更新', async ({ page }) => {
    // 读取"今日"下"新闻"的计数
    await page.getByRole('button', { name: /今日/ }).click();
    const newsCountToday = await page.getByRole('button', { name: /^新闻/ }).locator('span').last().textContent();

    // 切换到"本月"，新闻计数应更大或相等
    await page.getByRole('button', { name: /本月/ }).click();
    const newsCountMonth = await page.getByRole('button', { name: /^新闻/ }).locator('span').last().textContent();

    expect(Number(newsCountMonth)).toBeGreaterThanOrEqual(Number(newsCountToday));
  });

  // ── SourceCard 展开/折叠 ─────────────────────────────────────────

  test('卡片可以折叠和展开', async ({ page }) => {
    // 切换到本月确保有文章
    await page.getByRole('button', { name: /本月/ }).click();

    const firstCard = page.locator('.rounded-xl').first();
    const cardContent = firstCard.locator('.border-t').first();

    // 初始应展开
    await expect(cardContent).toBeVisible();

    // 点击 header 折叠
    await firstCard.locator('button').first().click();
    await expect(cardContent).not.toBeVisible();

    // 再次点击展开
    await firstCard.locator('button').first().click();
    await expect(cardContent).toBeVisible();
  });

  // ── 查看全部 / showAll 重置 ──────────────────────────────────────

  test('查看全部：展开后折叠再打开应重置回 5 条', async ({ page }) => {
    await page.getByRole('button', { name: /本月/ }).click();

    // 找第一个有"查看全部"按钮的卡片，并锁定该卡片
    const cards = page.locator('.rounded-xl');
    let targetCard;
    let cardIndex = -1;
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const btn = cards.nth(i).getByRole('button', { name: /查看全部/ });
      if (await btn.isVisible()) {
        targetCard = cards.nth(i);
        cardIndex = i;
        break;
      }
    }

    if (!targetCard || cardIndex < 0) {
      test.skip(); // 没有足够文章的卡片时跳过
      return;
    }

    // 点击"查看全部"，按钮消失
    await targetCard.getByRole('button', { name: /查看全部/ }).click();
    await expect(targetCard.getByRole('button', { name: /查看全部/ })).not.toBeVisible();

    // 折叠再展开
    await targetCard.locator('button').first().click();
    await targetCard.locator('button').first().click();

    // "查看全部"按钮应重新出现（showAll 已重置）
    await expect(targetCard.getByRole('button', { name: /查看全部/ })).toBeVisible();
  });

  // ── 文章点击标记已读 ─────────────────────────────────────────────

  test('点击文章后变为已读（蓝点减少）', async ({ page }) => {
    await page.getByRole('button', { name: /本月/ }).click();

    const unreadDots = page.locator('.bg-blue-500');
    const countBefore = await unreadDots.count();
    expect(countBefore).toBeGreaterThan(0);

    // 点击第一篇带蓝点的文章，处理新标签页
    const articleLink = page.locator('a:has(.bg-blue-500)').first();
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      articleLink.click(),
    ]);
    await newPage.close();

    // 蓝点数量应减少 1
    await expect(unreadDots).toHaveCount(countBefore - 1);
  });

  // ── Header 更新时间 ──────────────────────────────────────────────

  test('Header 显示更新时间（不是"从未更新"）', async ({ page }) => {
    const updateText = page.locator('text=/更新于/');
    await expect(updateText).toBeVisible();
    const content = await updateText.textContent();
    expect(content).not.toContain('从未更新');
  });

  // ── 空状态 ───────────────────────────────────────────────────────

  test('筛选无结果时显示空状态提示', async ({ page }) => {
    // 研究分类目前没有数据
    await page.getByRole('button', { name: /今日/ }).click();
    await page.getByRole('button', { name: /^研究/ }).click();

    await expect(page.getByText('该时间段暂无文章')).toBeVisible();
  });

});
