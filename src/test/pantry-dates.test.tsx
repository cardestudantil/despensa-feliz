import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { expect, it } from "vitest";
import { Route } from "@/routes/index";

it("preserva ambas as datas ao editar rapidamente e reabrir a página", () => {
  localStorage.clear();
  const component = Route.options.component;
  if (!component) throw new Error("Página indisponível");
  const page = render(createElement(component));
  act(() => {
    fireEvent.change(screen.getByLabelText("Data de conferência do estoque"), {
      target: { value: "2026-10-12" },
    });
    fireEvent.change(screen.getByLabelText("Data da última compra"), {
      target: { value: "2026-10-10" },
    });
  });
  expect(JSON.parse(localStorage.getItem("despensa-datas-gerais-v1") || "{}")).toEqual({
    dataConferencia: "2026-10-12",
    dataUltimaCompra: "2026-10-10",
  });
  page.unmount();
  render(createElement(component));
  expect(screen.getByLabelText("Data de conferência do estoque")).toHaveValue("2026-10-12");
  expect(screen.getByLabelText("Data da última compra")).toHaveValue("2026-10-10");
});