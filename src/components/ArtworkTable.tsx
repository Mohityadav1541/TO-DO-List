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
    page: 1
  });

  // bulk selection limit (global)
  const [limit, setLimit] = useState<number | null>(null);

  const panelRef = useRef<OverlayPanel>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<ApiResponse>(
        "https://api.artic.edu/api/v1/artworks",
        {
          params: {
            page: pageState.page,
            limit: pageState.rows
          }
        }
      );

      setRows(res.data.data);
      setTotal(res.data.pagination.total);

    } catch (err) {
      console.error("Fetch error", err);
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
      page: (e.page || 0) + 1
    });
  };

  // selection based on global index
  const selectedRows = rows.filter((_, index) => {
    if (limit === null) return false;
    const globalIndex = pageState.first + index;
    return globalIndex < limit;
  });

  const headerTemplate = (
    <div className="flex align-items-center gap-2">
      <i
        className="pi pi-chevron-down cursor-pointer"
        onClick={(e) => panelRef.current?.toggle(e)}
      ></i>

      <OverlayPanel ref={panelRef}>
        <CustomSelectionPanel
          onApply={(count) => {
            setLimit(count);
            panelRef.current?.hide();
          }}
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
        selection={selectedRows}
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