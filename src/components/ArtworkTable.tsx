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
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);

  const [pageState, setPageState] = useState({
    first: 0,
    rows: 12,
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

  const handleSelectN = async (count: number) => {
    panelRef.current?.hide();
    setLoading(true);
    try {
      const collected: Artwork[] = [];
      let page = 1;

      while (collected.length < count) {
        const needed = count - collected.length;
        const limit = Math.min(needed, 100);

        const res = await axios.get<ApiResponse>(
          "https://api.artic.edu/api/v1/artworks",
          { params: { page, limit } }
        );

        collected.push(...res.data.data);
        if (res.data.data.length < limit) break;
        page++;
      }

      setSelectedRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const toAdd = collected.filter((r) => !existingIds.has(r.id));
        return [...prev, ...toAdd];
      });
    } catch (err) {
      console.error("selectN failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = async () => {
    panelRef.current?.hide();
    setLoading(true);
    try {
      const all: Artwork[] = [];
      let page = 1;

      const first = await axios.get<ApiResponse>(
        "https://api.artic.edu/api/v1/artworks",
        { params: { page: 1, limit: 100 } }
      );
      all.push(...first.data.data);
      const totalRecords = first.data.pagination.total;
      page = 2;

      while (all.length < totalRecords) {
        const res = await axios.get<ApiResponse>(
          "https://api.artic.edu/api/v1/artworks",
          { params: { page, limit: 100 } }
        );
        all.push(...res.data.data);
        if (res.data.data.length < 100) break;
        page++;
      }

      setSelectedRows(all);
    } catch (err) {
      console.error("selectAll failed", err);
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