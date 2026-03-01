import "@testing-library/jest-dom/vitest";

// Polyfill IntersectionObserver for jsdom (used by framer-motion whileInView)
class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(
        private callback: IntersectionObserverCallback,
        _options?: IntersectionObserverInit
    ) {
        // Immediately trigger with all entries as intersecting
        setTimeout(() => {
            this.callback(
                [{ isIntersecting: true, intersectionRatio: 1 }] as IntersectionObserverEntry[],
                this
            );
        }, 0);
    }
    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords(): IntersectionObserverEntry[] { return []; }
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
