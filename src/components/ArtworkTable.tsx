import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { Checkbox } from "primereact/checkbox";
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

  const [bulkLimit, setBulkLimit] = useState<number | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [manualSelected, setManualSelected] = useState<Set<number>>(new Set());
  const [manualDeselected, setManualDeselected] = useState<Set<number>>(new Set());

  const panelRef = useRef<OverlayPanel>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>(
        "https://api.artic.edu/api/v1/artworks",
        { params: { page: pageState.page, limit: pageState.rows } }
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

  // Compute which rows on the current page should appear checked.
  const computedSelection = rows.filter((row, rowIndex) => {
    const globalIndex = pageState.first + rowIndex;
    if (manualDeselected.has(row.id)) return false;
    if (selectAll || (bulkLimit !== null && globalIndex < bulkLimit)) return true;
    if (manualSelected.has(row.id)) return true;
    return false;
  });

  // How many rows are selected in total (across all pages).
  const selectedCount = (() => {
    if (selectAll) return total - manualDeselected.size;
    if (bulkLimit !== null)
      return Math.min(bulkLimit, total) - manualDeselected.size + manualSelected.size;
    return manualSelected.size;
  })();

  // Handles both individual row checkbox clicks and the header checkbox (select/deselect page).
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

  const handleApply = (count: number) => {
    panelRef.current?.hide();
    setBulkLimit(count);
    setSelectAll(false);
    setManualSelected(new Set());
    setManualDeselected(new Set());
  };

  const handleSelectAll = () => {
    panelRef.current?.hide();
    setSelectAll(true);
    setBulkLimit(null);
    setManualSelected(new Set());
    setManualDeselected(new Set());
  };

  // Header checkbox for selecting/deselecting all rows on the current page.
  const allPageSelected = rows.length > 0 && computedSelection.length === rows.length;

  const handleHeaderCheckbox = () => {
    if (allPageSelected) {
      handleSelectionChange({ value: [] });
    } else {
      handleSelectionChange({ value: rows });
    }
  };

  // First column header: checkbox + chevron trigger
  const firstColHeader = (
    <div className="first-col-header">
      <Checkbox checked={allPageSelected} onChange={handleHeaderCheckbox} />
      <i
        className="pi pi-chevron-down"
        onClick={(e) => panelRef.current?.toggle(e)}
      />
      <OverlayPanel ref={panelRef}>
        <CustomSelectionPanel onApply={handleApply} onSelectAll={handleSelectAll} />
      </OverlayPanel>
    </div>
  );

  // Paginator left: "Showing X to Y of Z entries"
  const paginatorLeft = (
    <span className="paginator-info">
      Showing {total === 0 ? 0 : pageState.first + 1} to{" "}
      {Math.min(pageState.first + pageState.rows, total)} of{" "}
      {total.toLocaleString()} entries
    </span>
  );

  return (
    <div>
      <div className="selected-count">Selected: {selectedCount} rows</div>
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
          paginatorLeft={paginatorLeft}
          paginatorTemplate="PrevPageLink PageLinks NextPageLink"
          tableStyle={{ minWidth: "50rem" }}
        >
          <Column selectionMode="multiple" header={firstColHeader} headerStyle={{ width: "4rem" }} />
          <Column
            field="title"
            header="Title"
            body={(row) => <span className="col-title">{row.title}</span>}
          />
          <Column
            field="place_of_origin"
            header="Place of Origin"
            body={(row) => <span className="col-place">{row.place_of_origin}</span>}
          />
          <Column
            field="artist_display"
            header="Artist"
            body={(row) => <span className="col-artist">{row.artist_display}</span>}
          />
          <Column
            field="inscriptions"
            header="Inscriptions"
            body={(row) => <span className="col-inscriptions">{row.inscriptions || "N/A"}</span>}
          />
          <Column
            field="date_start"
            header="Start Date"
            body={(row) => <span className="col-date">{row.date_start}</span>}
          />
          <Column
            field="date_end"
            header="End Date"
            body={(row) => <span className="col-date">{row.date_end}</span>}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default ArtworkTable;