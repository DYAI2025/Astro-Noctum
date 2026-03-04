// Tests: Tooltip component — both modes (light/dark), ARIA, keyboard
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip } from "../components/Tooltip";

const TriggerChild = () => <button data-testid="trigger">Hover me</button>;

describe("Tooltip — light mode (morning theme)", () => {
  it("renders trigger without showing tooltip by default", () => {
    render(<Tooltip content="Hello world"><TriggerChild /></Tooltip>);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on mouseEnter", () => {
    render(<Tooltip content="Solar energy"><TriggerChild /></Tooltip>);
    fireEvent.mouseEnter(screen.getByTestId("trigger").parentElement!);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Solar energy");
  });

  it("hides tooltip on mouseLeave", () => {
    render(<Tooltip content="Moon sign"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    fireEvent.mouseLeave(container);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("toggles tooltip on click (mobile UX)", () => {
    render(<Tooltip content="Click me"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.click(container);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.click(container);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on focus (keyboard accessibility)", () => {
    render(<Tooltip content="Keyboard accessible"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.focus(container);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides tooltip on blur", () => {
    render(<Tooltip content="Blur test"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.focus(container);
    fireEvent.blur(container);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("tooltip has role='tooltip' for ARIA compliance", () => {
    render(<Tooltip content="ARIA check"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    expect(screen.getByRole("tooltip")).toHaveAttribute("role", "tooltip");
  });

  it("trigger gets aria-describedby pointing to tooltip id when shown", () => {
    render(<Tooltip content="ARIA link"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    const tooltip = screen.getByRole("tooltip");
    const inner = container.querySelector("[aria-describedby]");
    expect(inner?.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("renders nothing extra when content is empty (no tooltip)", () => {
    render(<Tooltip content=""><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement;
    // When content is empty, Tooltip returns children directly without wrapper
    expect(container).toBeNull(); // no relative wrapper div
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
  });
});

describe("Tooltip — dark mode (planetarium theme)", () => {
  it("shows tooltip in dark mode", () => {
    render(<Tooltip content="Dark tooltip" dark><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Dark tooltip");
  });

  it("dark tooltip has dark CSS class", () => {
    render(<Tooltip content="Dark" dark><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    // The tooltip should have a dark background class, not the light one
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("bg-[#060f28]");
    expect(tooltip.className).not.toContain("bg-white");
  });

  it("light tooltip has light CSS class", () => {
    render(<Tooltip content="Light"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("bg-white");
    expect(tooltip.className).not.toContain("bg-[#060f28]");
  });
});

describe("Tooltip — wide variant", () => {
  it("wide=true applies wider class", () => {
    render(<Tooltip content="Wide tooltip" wide><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("w-64");
  });

  it("default (wide=false) applies narrow class", () => {
    render(<Tooltip content="Narrow"><TriggerChild /></Tooltip>);
    const container = screen.getByTestId("trigger").parentElement!;
    fireEvent.mouseEnter(container);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("w-52");
  });
});
