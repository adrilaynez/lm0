import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBackendHealth } from "@/hooks/useBackendHealth";

describe("useBackendHealth", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        vi.useRealTimers();
    });

    it("returns 'online' when backend responds with ok", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

        const { result } = renderHook(() => useBackendHealth());

        // Initial state is "connecting"
        expect(result.current.status).toBe("connecting");

        // After health check resolves
        await waitFor(() => {
            expect(result.current.status).toBe("online");
        });
    });

    it("stays 'connecting' initially when fetch fails but timeout not reached", async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

        const { result } = renderHook(() => useBackendHealth());

        expect(result.current.status).toBe("connecting");

        // Advance a bit — not past HEALTH_TIMEOUT_MS (45s)
        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        // Should still be "connecting" since timeout hasn't elapsed
        expect(result.current.status).toBe("connecting");
    });

    it("returns 'offline' when fetch fails and timeout elapses", async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

        const { result } = renderHook(() => useBackendHealth());

        // Advance past HEALTH_TIMEOUT_MS (45s) + one retry interval (10s)
        await act(async () => {
            await vi.advanceTimersByTimeAsync(56000);
        });

        expect(result.current.status).toBe("offline");
    });

    it("showBanner becomes true after 2 seconds if still connecting", async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

        const { result } = renderHook(() => useBackendHealth());

        expect(result.current.showBanner).toBe(false);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(2100);
        });

        expect(result.current.showBanner).toBe(true);
    });

    it("showBanner is hidden once status becomes online", async () => {
        // First call fails, then succeeds on retry
        globalThis.fetch = vi.fn()
            .mockRejectedValueOnce(new TypeError("Failed to fetch"))
            .mockResolvedValue({ ok: true });

        const { result } = renderHook(() => useBackendHealth());

        // Advance past banner delay
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2100);
        });
        expect(result.current.showBanner).toBe(true);

        // Advance past retry interval so next health check fires
        await act(async () => {
            await vi.advanceTimersByTimeAsync(10000);
        });

        await waitFor(() => {
            expect(result.current.status).toBe("online");
            expect(result.current.showBanner).toBe(false);
        });
    });
});
