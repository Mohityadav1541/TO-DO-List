import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import type { DataTablePageEvent } from "primereact/datatable";
import axios from "axios";
import CustomSelectionPanel from "./CustomSelectionPanel";
import type { Artwork, ApiResponse } from "../apiTypes";

const PAGE_SIZE = 12; // rows per page shown in table

const ArtworkTable = () => {
  const [rows, setRows] = useState<Artwork[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);

  const [pageState, setPageState] = useState({
    first: 0,
    rows: PAGE_SIZE,
    page: 1,
  });

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
        },
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
      page: (e.page || 0) + 1,
    });
  };

  /**
   * Fetch exactly `count` rows from the API starting at page 1.
   * Pages are fetched sequentially until we have enough rows.
   */
  const handleSelectN = async (count: number) => {
    panelRef.current?.hide();
    setLoading(true);
    try {
      const FETCH_LIMIT = 100; // max per API request
      const collected: Artwork[] = [];
      let page = 1;

      while (collected.length < count) {
        const needed = count - collected.length;
        const limit = Math.min(needed, FETCH_LIMIT);

        const res = await axios.get<ApiResponse>(
          "https://api.artic.edu/api/v1/artworks",
          { params: { page, limit } },
        );

        const data = res.data.data;
        collected.push(...data);

        // If the API returned fewer items than requested, we've hit the end
        if (data.length < limit) break;

        page++;
      }

      // Merge with existing selections (keep previous + add new unique ones)
      setSelectedRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const toAdd = collected.filter((r) => !existingIds.has(r.id));
        return [...prev, ...toAdd];
      });
    } catch (err) {
      console.error("Select N error", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select ALL rows from the API.
   */
  const handleSelectAll = async () => {
    panelRef.current?.hide();
    setLoading(true);
    try {
      const FETCH_LIMIT = 100;
      const all: Artwork[] = [];
      let page = 1;

      // First request to get total count
      const first = await axios.get<ApiResponse>(
        "https://api.artic.edu/api/v1/artworks",
        { params: { page: 1, limit: FETCH_LIMIT } },
      );
      all.push(...first.data.data);
      const totalRecords = first.data.pagination.total;
      page = 2;

      while (all.length < totalRecords) {
        const res = await axios.get<ApiResponse>(
          "https://api.artic.edu/api/v1/artworks",
          { params: { page, limit: FETCH_LIMIT } },
        );
        const data = res.data.data;
        all.push(...data);
        if (data.length < FETCH_LIMIT) break;
        page++;
      }

      setSelectedRows(all);
    } catch (err) {
      console.error("Select All error", err);
    } finally {
      setLoading(false);
    }
  };

  const headerTemplate = (
    <div className="flex align-items-center gap-2">
      <i
        className="pi pi-chevron-down cursor-pointer"
        onClick={(e) => panelRef.current?.toggle(e)}
      ></i>

      <OverlayPanel ref={panelRef}>
        <CustomSelectionPanel
          onApply={handleSelectN}
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
        selection={selectedRows}
        onSelectionChange={(e) => setSelectedRows(e.value as Artwork[])}
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