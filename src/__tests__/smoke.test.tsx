import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

function Hello() {
  return <h1>Hello</h1>;
}

it("renders heading", () => {
  render(<Hello />);
  expect(screen.getByRole("heading", { name: /hello/i })).toBeInTheDocument();
});
