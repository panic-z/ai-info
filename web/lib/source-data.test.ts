import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("fs/promises");
vi.mock("@vercel/blob", () => ({
  list: vi.fn(),
}));

describe("readSourcesData", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("reads aggregated data from the local file by default", async () => {
    const fs = await import("fs/promises");
    vi.mocked(fs.readFile).mockResolvedValue(
      JSON.stringify({ categories: [{ id: "news", name: "News", sources: [] }], lastUpdated: "2026-04-11T00:00:00Z" }),
    );

    const { readSourcesData } = await import("./source-data");
    const result = await readSourcesData();

    expect(result).toEqual({
      categories: [{ id: "news", name: "News", sources: [] }],
      lastUpdated: "2026-04-11T00:00:00Z",
    });
  });

  it("reads aggregated data from blob storage when configured", async () => {
    process.env.BLOB_STORE = "true";
    process.env.BLOB_READ_WRITE_TOKEN = "test-token";

    const { list } = await import("@vercel/blob");
    vi.mocked(list).mockResolvedValue({
      blobs: [{
        url: "https://example.com/ai-info/index.json",
        downloadUrl: "https://example.com/ai-info/index.json",
        pathname: "ai-info/index.json",
        size: 128,
        etag: "blob-etag",
        uploadedAt: new Date(),
      }],
      cursor: undefined,
      hasMore: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: [], lastUpdated: "2026-04-11T00:00:00Z" }),
    }) as unknown as typeof fetch;

    const { readSourcesData } = await import("./source-data");
    const result = await readSourcesData();

    expect(result).toEqual({ categories: [], lastUpdated: "2026-04-11T00:00:00Z" });
  });

  it("prefers the blob downloadUrl so preview rendering does not depend on an explicit auth header", async () => {
    process.env.BLOB_STORE = "true";
    delete process.env.BLOB_READ_WRITE_TOKEN;

    const { list } = await import("@vercel/blob");
    vi.mocked(list).mockResolvedValue({
      blobs: [{
        url: "https://example.com/private/ai-info/index.json",
        downloadUrl: "https://example.com/public/ai-info/index.json",
        pathname: "ai-info/index.json",
        size: 128,
        etag: "blob-etag",
        uploadedAt: new Date(),
      }],
      cursor: undefined,
      hasMore: false,
    });

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: [], lastUpdated: "2026-04-11T00:00:00Z" }),
    }) as unknown as typeof fetch;
    global.fetch = fetchSpy;

    const { readSourcesData } = await import("./source-data");
    await readSourcesData();

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com/public/ai-info/index.json",
      undefined,
    );
  });
});
