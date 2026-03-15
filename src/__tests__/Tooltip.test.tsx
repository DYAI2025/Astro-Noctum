// Tests: Tooltip component — both modes (light/dark), ARIA, keyboard
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Tooltip } from "../components/Tooltip";

// Mock motion/react to skip animations so AnimatePresence exits are instant
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const TriggerChild = () => <button data-testid="trigger">Hover me</button>;

describe("Tooltip — light mode (morning theme)", () => {
  it("renders trigger without showing tooltip by default", () => {
    render(<Tooltip content="Hello world"><TriggerChild /></Tooltip>);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on mouseEnter", () => {
    render(<Tooltip content="Solar energy"><TriggerChild /></Tooltip>);
    fireEvent.mouseEnter(screen.getByTestId("trigger").parentElement!.parentElement!);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Solar energy");
  });

  it("hides tooltip on mouseLeave", () => {
    render(<Tooltip content="Moon sign"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("toggles tooltip on click (mobile UX)", () => {
    render(<Tooltip content="Click me"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.click(wrapper);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.click(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on focus (keyboard accessibility)", () => {
    render(<Tooltip content="Keyboard accessible"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.focus(wrapper);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides tooltip on blur", () => {
    render(<Tooltip content="Blur test"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.focus(wrapper);
    fireEvent.blur(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("tooltip has role='tooltip' for ARIA compliance", () => {
    render(<Tooltip content="ARIA check"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole("tooltip")).toHaveAttribute("role", "tooltip");
  });

  it("trigger gets aria-describedby pointing to tooltip id when shown", () => {
    render(<Tooltip content="ARIA link"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    const tooltip = screen.getByRole("tooltip");
    // The inner div wrapping children gets aria-describedby
    const inner = wrapper.querySelector("[aria-describedby]");
    expect(inner?.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("renders children directly when content is empty (no tooltip wrapper)", () => {
    render(<Tooltip content=""><TriggerChild /></Tooltip>);
    // When content is empty, Tooltip returns children directly — no wrapper div
    expect(screen.getByTestId("trigger")).toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

describe("Tooltip — dark mode (planetarium theme)", () => {
  it("shows tooltip in dark mode", () => {
    render(<Tooltip content="Dark tooltip" dark><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Dark tooltip");
  });

  it("dark tooltip has dark CSS class", () => {
    render(<Tooltip content="Dark" dark><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("bg-[#060f28]");
    expect(tooltip.className).not.toContain("bg-white");
  });

  it("light tooltip has light CSS class", () => {
    render(<Tooltip content="Light"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("bg-white");
    expect(tooltip.className).not.toContain("bg-[#060f28]");
  });
});

describe("Tooltip — wide variant", () => {
  it("wide=true applies wider class", () => {
    render(<Tooltip content="Wide tooltip" wide><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("w-64");
  });

  it("default (wide=false) applies narrow class", () => {
    render(<Tooltip content="Narrow"><TriggerChild /></Tooltip>);
    const wrapper = screen.getByTestId("trigger").parentElement!.parentElement!;
    fireEvent.mouseEnter(wrapper);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("w-52");
  });
});
