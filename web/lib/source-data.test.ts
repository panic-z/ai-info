import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("fs/promises");
vi.mock("@vercel/blob", () => ({
  list: vi.fn(),
  get: vi.fn(),
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

    const { list, get } = await import("@vercel/blob");
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

    vi.mocked(get).mockResolvedValue({
      blob: {
        pathname: "ai-info/index.json",
        contentType: "application/json",
        contentDisposition: "inline",
        url: "https://example.com/ai-info/index.json",
        downloadUrl: "https://example.com/ai-info/index.json",
        size: 128,
        uploadedAt: new Date(),
        pathnameWithRandomSuffix: "ai-info/index.random.json",
      },
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ categories: [], lastUpdated: "2026-04-11T00:00:00Z" })));
          controller.close();
        },
      }),
    } as never);

    const { readSourcesData } = await import("./source-data");
    const result = await readSourcesData();

    expect(result).toEqual({ categories: [], lastUpdated: "2026-04-11T00:00:00Z" });
    expect(get).toHaveBeenCalledWith("ai-info/index.json", { access: "private" });
  });

  it("reads the private blob through the SDK instead of fetching blob URLs directly", async () => {
    process.env.BLOB_STORE = "true";

    const { list, get } = await import("@vercel/blob");
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

    vi.mocked(get).mockResolvedValue({
      blob: {
        pathname: "ai-info/index.json",
        contentType: "application/json",
        contentDisposition: "inline",
        url: "https://example.com/private/ai-info/index.json",
        downloadUrl: "https://example.com/public/ai-info/index.json",
        size: 128,
        uploadedAt: new Date(),
        pathnameWithRandomSuffix: "ai-info/index.random.json",
      },
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ categories: [], lastUpdated: "2026-04-11T00:00:00Z" })));
          controller.close();
        },
      }),
    } as never);
    global.fetch = vi.fn() as unknown as typeof fetch;

    const { readSourcesData } = await import("./source-data");
    await readSourcesData();

    expect(get).toHaveBeenCalledWith("ai-info/index.json", { access: "private" });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
