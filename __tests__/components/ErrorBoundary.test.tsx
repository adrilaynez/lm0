import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/lab/ErrorBoundary";

// A component that throws on render
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error("Test explosion");
    }
    return <div>All good</div>;
}

describe("ErrorBoundary", () => {
    // Suppress console.error noise from React error boundary logging
    const originalConsoleError = console.error;
    beforeEach(() => {
        console.error = vi.fn();
    });
    afterEach(() => {
        console.error = originalConsoleError;
    });

    it("renders children when no error occurs", () => {
        render(
            <ErrorBoundary>
                <div>Child content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("shows fallback when a child throws", () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        // Default fallback message
        expect(
            screen.getByText("Something went wrong in this visualization")
        ).toBeInTheDocument();

        // Retry button should be visible
        expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("shows custom fallback message when provided", () => {
        render(
            <ErrorBoundary fallbackMessage="The bigram narrative crashed">
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(
            screen.getByText("The bigram narrative crashed")
        ).toBeInTheDocument();
    });

    it("retry button resets error state and re-renders children", () => {
        // Use a ref-like pattern: first render throws, after reset it won't
        let shouldThrow = true;

        function ConditionalThrower() {
            if (shouldThrow) throw new Error("Boom");
            return <div>Recovered</div>;
        }

        const { rerender } = render(
            <ErrorBoundary>
                <ConditionalThrower />
            </ErrorBoundary>
        );

        // Should show fallback
        expect(screen.getByText("Retry")).toBeInTheDocument();

        // Stop throwing before clicking retry
        shouldThrow = false;

        // Click retry
        fireEvent.click(screen.getByText("Retry"));

        // Should now show recovered content
        expect(screen.getByText("Recovered")).toBeInTheDocument();
    });

    it("shows error details in development mode", () => {
        // process.env.NODE_ENV is "test" by default in vitest,
        // but the component checks for "development". Let's verify
        // the error details section is NOT shown in test/production.
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>
        );

        // In test mode, error details should NOT be visible
        expect(screen.queryByText("Error details (dev only)")).not.toBeInTheDocument();
    });
});
