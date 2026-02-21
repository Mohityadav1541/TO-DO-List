import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import type { DataTablePageEvent } from "primereact/datatable";
import axios from "axios";
import CustomSelectionPanel from "./CustomSelectionPanel";
import type { Artwork, ApiResponse } from "../apiTypes";

const ArtworkTable = () => {
  const [rows, setRows] = useState<Artwork[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [pageState, setPageState] = useState({
    first: 0,
    rows: 12,
    page: 1,
  });

  // ── selection state ──────────────────────────────────────────
  const [bulkLimit, setBulkLimit] = useState<number | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [manualSelected, setManualSelected] = useState<Set<number>>(new Set());
  const [manualDeselected, setManualDeselected] = useState<Set<number>>(new Set());
  // ─────────────────────────────────────────────────────────────

  const panelRef = useRef<OverlayPanel>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>(
        "https://api.artic.edu/api/v1/artworks",
        {
          params: {
            page: pageState.page,
            limit: pageState.rows,
          },
        }
      );
      setRows(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error("fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageState]);

  const handlePage = (e: DataTablePageEvent) => {
    setPageState({
      first: e.first,
      rows: e.rows,
      page: (e.page || 0) + 1,
    });
  };

  // Compute selected rows for the current page only.
  // Rule: row is selected if
  //   (globalIndex < bulkLimit  AND  NOT manuallyDeselected)
  //   OR (selectAll  AND  NOT manuallyDeselected)
  //   OR manuallySelected
  const computedSelection = rows.filter((row, rowIndex) => {
    const globalIndex = pageState.first + rowIndex;
    if (manualDeselected.has(row.id)) return false;
    if (selectAll || (bulkLimit !== null && globalIndex < bulkLimit)) return true;
    if (manualSelected.has(row.id)) return true;
    return false;
  });

  // Handles both individual checkbox clicks AND the header select-all / deselect-all checkbox.
  // We diff old vs new selection to figure out what was added or removed.
  const handleSelectionChange = (e: { value: Artwork[] }) => {
    const newSel = e.value;
    const oldIds = new Set(computedSelection.map((r) => r.id));
    const newIds = new Set(newSel.map((r) => r.id));

    const added = newSel.filter((r) => !oldIds.has(r.id));
    const removed = computedSelection.filter((r) => !newIds.has(r.id));

    setManualSelected((prev) => {
      const next = new Set(prev);
      for (const row of added) {
        const rowIndex = rows.findIndex((r) => r.id === row.id);
        const globalIndex = pageState.first + rowIndex;
        const inBulk = bulkLimit !== null && globalIndex < bulkLimit;
        if (!selectAll && !inBulk) next.add(row.id);
      }
      for (const row of removed) next.delete(row.id);
      return next;
    });

    setManualDeselected((prev) => {
      const next = new Set(prev);
      for (const row of added) next.delete(row.id);
      for (const row of removed) {
        const rowIndex = rows.findIndex((r) => r.id === row.id);
        const globalIndex = pageState.first + rowIndex;
        const inBulk = bulkLimit !== null && globalIndex < bulkLimit;
        if (selectAll || inBulk) next.add(row.id);
      }
      return next;
    });
  };

  // Apply button → select first N rows by global index
  const handleApply = (count: number) => {
    panelRef.current?.hide();
    setBulkLimit(count);
    setSelectAll(false);
    setManualSelected(new Set());
    setManualDeselected(new Set());
  };

  // Select All button → mark every row across all pages as selected
  const handleSelectAll = () => {
    panelRef.current?.hide();
    setSelectAll(true);
    setBulkLimit(null);
    setManualSelected(new Set());
    setManualDeselected(new Set());
  };

  const headerTemplate = (
    <div className="flex align-items-center gap-2">
      <i
        className="pi pi-chevron-down cursor-pointer"
        onClick={(e) => panelRef.current?.toggle(e)}
      ></i>

      <OverlayPanel ref={panelRef}>
        <CustomSelectionPanel
          onApply={handleApply}
          onSelectAll={handleSelectAll}
        />
      </OverlayPanel>

      <span>Title</span>
    </div>
  );

  return (
    <div className="card">
      <DataTable
        value={rows}
        lazy
        dataKey="id"
        paginator
        first={pageState.first}
        rows={pageState.rows}
        totalRecords={total}
        onPage={handlePage}
        loading={loading}
        selection={computedSelection}
        onSelectionChange={handleSelectionChange}
        selectionMode="checkbox"
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="title" header={headerTemplate} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
};

export default ArtworkTable;