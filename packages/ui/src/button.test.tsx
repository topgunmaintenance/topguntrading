import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button.js";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Launch</Button>);
    expect(screen.getByRole("button", { name: "Launch" })).toBeInTheDocument();
  });

  it("defaults to type=button so it does not submit forms by accident", () => {
    render(<Button>Launch</Button>);
    expect(screen.getByRole("button", { name: "Launch" })).toHaveAttribute("type", "button");
  });

  it("applies the secondary variant class", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const el = screen.getByRole("button", { name: "Secondary" });
    expect(el.className).toMatch(/border-border-subtle/);
  });

  it("honors the disabled prop", () => {
    render(<Button disabled>Off</Button>);
    expect(screen.getByRole("button", { name: "Off" })).toBeDisabled();
  });
});
