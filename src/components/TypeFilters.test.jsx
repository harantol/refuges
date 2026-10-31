import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TypeFilters from "./TypeFilters";

describe("TypeFilters", () => {
  it("rend null quand aucun type n'est présent", () => {
    const { container } = render(
      <TypeFilters allTypes={new Map()} uncheckedTypes={new Set()} onToggle={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("coche les types actifs et décoche les types exclus", () => {
    const allTypes = new Map([
      [7, "cabane non gardée"],
      [10, "refuge gardé"],
    ]);
    render(<TypeFilters allTypes={allTypes} uncheckedTypes={new Set([7])} onToggle={() => {}} />);
    const cbs = screen.getAllByRole("checkbox");
    expect(cbs[0]).not.toBeChecked(); // id 7 exclus, trié en premier
    expect(cbs[1]).toBeChecked(); // id 10 actif
  });

  it("affiche le compteur de points par type quand disponible", () => {
    const allTypes = new Map([
      [7, "cabane non gardée"],
      [10, "refuge gardé"],
    ]);
    const typeCounts = new Map([[10, 3]]);
    render(
      <TypeFilters allTypes={allTypes} typeCounts={typeCounts} uncheckedTypes={new Set()} onToggle={() => {}} />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByLabelText(/cabane non gardée/)).toBeInTheDocument();
  });

  it("appelle onToggle(id, checked) au changement", () => {
    const allTypes = new Map([
      [7, "cabane non gardée"],
      [10, "refuge gardé"],
    ]);
    const onToggle = vi.fn();
    render(<TypeFilters allTypes={allTypes} uncheckedTypes={new Set()} onToggle={onToggle} />);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(onToggle).toHaveBeenCalledWith(10, false);
  });
});
