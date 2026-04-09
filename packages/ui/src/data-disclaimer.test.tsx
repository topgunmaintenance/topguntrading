import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataDisclaimer } from "./data-disclaimer.js";

describe("DataDisclaimer", () => {
  it("renders the provider label and the non-advice disclaimer", () => {
    render(<DataDisclaimer providerLabel="Kraken public feed" />);
    expect(screen.getByText("Kraken public feed")).toBeInTheDocument();
    expect(
      screen.getByText(/Not investment advice/i),
    ).toBeInTheDocument();
  });

  it("renders an optional delay note when supplied", () => {
    render(
      <DataDisclaimer
        providerLabel="Kraken public feed"
        delayNote="Delayed"
      />,
    );
    expect(screen.getByText(/— Delayed/)).toBeInTheDocument();
  });

  it("uses role=note so it is findable for accessibility", () => {
    render(<DataDisclaimer providerLabel="Any Provider" />);
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("never emits buy/sell language per ADR-0027", () => {
    render(<DataDisclaimer providerLabel="Any Provider" />);
    const note = screen.getByRole("note");
    const text = note.textContent ?? "";
    expect(text.toLowerCase()).not.toMatch(/\bbuy\b/);
    expect(text.toLowerCase()).not.toMatch(/\bsell\b/);
  });
});
