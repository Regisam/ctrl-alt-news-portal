import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ShareAnalyticsDashboard from "@/pages/ShareAnalyticsDashboard";

describe("Share Analytics Dashboard", () => {
  it("renders dashboard title", () => {
    render(<ShareAnalyticsDashboard />);
    expect(screen.getByText("Share Analytics Dashboard")).toBeInTheDocument();
  });

  it("displays key metrics", () => {
    render(<ShareAnalyticsDashboard />);
    const allText = screen.queryAllByText("Total Shares");
    expect(allText.length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Avg Shares/Article").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Top Platform").length).toBeGreaterThan(0);
  });

  it("renders top shared articles section", () => {
    render(<ShareAnalyticsDashboard />);
    expect(screen.getByText("Top Shared Articles")).toBeInTheDocument();
  });

  it("renders platform distribution chart", () => {
    render(<ShareAnalyticsDashboard />);
    expect(screen.getByText("Shares by Platform")).toBeInTheDocument();
  });

  it("renders time series chart", () => {
    render(<ShareAnalyticsDashboard />);
    expect(screen.getByText("Shares Over Time")).toBeInTheDocument();
  });

  it("renders platform breakdown table", () => {
    render(<ShareAnalyticsDashboard />);
    expect(screen.getByText("Share Breakdown by Platform")).toBeInTheDocument();
  });

  it("displays metrics with numeric values", () => {
    const { container } = render(<ShareAnalyticsDashboard />);
    // Check for numeric metric values in the DOM
    const metrics = container.querySelectorAll('[class*="text-3xl"]');
    expect(metrics.length).toBeGreaterThan(0);
  });
});
