import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    Section,
    SectionLabel,
    Heading,
    Lead,
    P,
    Highlight,
    Callout,
    FormulaBlock,
    type NarrativeAccent,
} from "@/components/lab/narrative-primitives";

// Framer-motion renders fine in jsdom but animations are no-ops

const ACCENTS: NarrativeAccent[] = ["emerald", "amber", "rose", "violet"];

describe("narrative-primitives", () => {
    describe("Section", () => {
        it("renders children", () => {
            render(<Section>Hello section</Section>);
            expect(screen.getByText("Hello section")).toBeInTheDocument();
        });
    });

    describe("SectionLabel", () => {
        ACCENTS.forEach((accent) => {
            it(`renders with ${accent} accent`, () => {
                render(
                    <SectionLabel number="01" label={`Label ${accent}`} accent={accent} />
                );
                expect(screen.getByText("01")).toBeInTheDocument();
                expect(screen.getByText(`Label ${accent}`)).toBeInTheDocument();
            });
        });

        it("renders gradient variant for rose accent", () => {
            render(
                <SectionLabel number="02" label="Gradient" accent="rose" variant="gradient" />
            );
            expect(screen.getByText("02")).toBeInTheDocument();
        });
    });

    describe("Heading", () => {
        it("renders children", () => {
            render(<Heading>My Heading</Heading>);
            expect(screen.getByText("My Heading")).toBeInTheDocument();
        });

        it("applies custom className", () => {
            render(<Heading className="font-extrabold">Bold Heading</Heading>);
            const el = screen.getByText("Bold Heading");
            expect(el.className).toContain("font-extrabold");
        });
    });

    describe("Lead", () => {
        it("renders children", () => {
            render(<Lead>Lead paragraph</Lead>);
            expect(screen.getByText("Lead paragraph")).toBeInTheDocument();
        });
    });

    describe("P", () => {
        it("renders children", () => {
            render(<P>Normal paragraph</P>);
            expect(screen.getByText("Normal paragraph")).toBeInTheDocument();
        });
    });

    describe("Highlight", () => {
        ACCENTS.forEach((color) => {
            it(`renders with ${color} color`, () => {
                render(<Highlight color={color}>highlighted</Highlight>);
                expect(screen.getByText("highlighted")).toBeInTheDocument();
            });
        });

        it("renders tooltip when provided", () => {
            render(
                <Highlight color="rose" tooltip="Extra info">
                    with tooltip
                </Highlight>
            );
            expect(screen.getByText("with tooltip")).toBeInTheDocument();
            expect(screen.getByRole("tooltip")).toHaveTextContent("Extra info");
        });

        it("does not render tooltip element when not provided", () => {
            render(<Highlight color="emerald">no tooltip</Highlight>);
            expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
        });
    });

    describe("Callout", () => {
        it("renders children", () => {
            render(<Callout>Callout body</Callout>);
            expect(screen.getByText("Callout body")).toBeInTheDocument();
        });

        it("renders title when provided", () => {
            render(<Callout title="Important">Body text</Callout>);
            expect(screen.getByText("Important")).toBeInTheDocument();
            expect(screen.getByText("Body text")).toBeInTheDocument();
        });

        it("does not render title element when not provided", () => {
            const { container } = render(<Callout>No title</Callout>);
            // Title is rendered as a <p> with uppercase tracking — should not exist
            const titleEls = container.querySelectorAll("p.text-xs.font-bold.uppercase");
            expect(titleEls.length).toBe(0);
        });
    });

    describe("FormulaBlock", () => {
        it("renders caption text", () => {
            render(<FormulaBlock formula="E=mc^2" caption="Einstein's equation" accent="amber" />);
            expect(screen.getByText("Einstein's equation")).toBeInTheDocument();
        });
    });
});
