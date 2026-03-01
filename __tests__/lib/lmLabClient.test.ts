import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests for lmLabClient fetch patterns.
 *
 * Since the module's internal helpers (requestRaw, withRetry, LmLabError)
 * are not exported, we test the behavior observable through the public API
 * functions by mocking globalThis.fetch.
 *
 * Note: The module uses real setTimeout for abort controllers internally,
 * so we use real timers and short-circuit via fetch mocks.
 */

// Set BASE_URL before dynamic imports
vi.stubEnv("NEXT_PUBLIC_LM_LAB_API_URL", "http://test-api");

describe("lmLabClient", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it("successful POST request returns parsed JSON", async () => {
        const mockData = { visualization: { transition_matrix: {} }, predictions: null, metadata: {} };
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockData),
        });

        const { visualizeBigram } = await import("@/lib/lmLabClient");
        const result = await visualizeBigram("hello", 10);

        expect(result).toEqual(mockData);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/v1/models/bigram/visualize"),
            expect.objectContaining({ method: "POST" })
        );
    });

    it("request body is sent as JSON with correct content type", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        });

        const { visualizeBigram } = await import("@/lib/lmLabClient");
        await visualizeBigram("abc", 5);

        const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[1].headers).toEqual({ "Content-Type": "application/json" });
        const body = JSON.parse(call[1].body as string);
        expect(body).toEqual({ text: "abc", top_k: 5 });
    });

    it("non-ok response throws error with message and status", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 422,
            text: () => Promise.resolve("Validation error"),
        });

        const { visualizeBigram } = await import("@/lib/lmLabClient");

        await expect(visualizeBigram("test", 5)).rejects.toMatchObject({
            message: "Validation error",
            status: 422,
        });
    });

    it("network error (status 0) triggers retry — fetch called twice", async () => {
        const mockData = { generated_text: "hello world" };
        globalThis.fetch = vi.fn()
            .mockRejectedValueOnce(new TypeError("Failed to fetch"))
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData),
            });

        const { generateBigram } = await import("@/lib/lmLabClient");
        const result = await generateBigram("h", 50, 1.0);

        expect(result).toEqual(mockData);
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("non-retryable error (422) is NOT retried — fetch called once", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 422,
            text: () => Promise.resolve("Bad input"),
        });

        const { visualizeNgram } = await import("@/lib/lmLabClient");

        await expect(visualizeNgram("test", 3, 5)).rejects.toMatchObject({
            status: 422,
        });

        // 422 is not retryable (not 0, 408, or 503), so only 1 call
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
});
