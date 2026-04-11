import { describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

describe('home page rendering mode', () => {
  it('forces dynamic rendering so preview data is fetched at request time', async () => {
    const filePath = path.join(process.cwd(), 'app/page.tsx');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toMatch(/export const dynamic = ['"]force-dynamic['"]/);
  });
});
