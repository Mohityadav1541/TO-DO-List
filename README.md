# React Artworks Table – Persistent Selection with Server Pagination

This project is a React + TypeScript application that displays artwork data from the Art Institute of Chicago API using PrimeReact DataTable.

The application implements server-side pagination along with persistent row selection across multiple pages without pre-fetching data from other pages.

---

## 📌 Tech Stack

- React (Vite)
- TypeScript
- PrimeReact DataTable
- Axios

---

## 📌 Features Implemented

### 1. Server-Side Pagination
- Data is fetched page-wise from:
  https://api.artic.edu/api/v1/artworks
- Only the current page data is requested from the API.
- Pagination controls dynamically trigger API calls.

This ensures that the application does not load all data at once.

---

### 2. Persistent Row Selection
- Row selection persists across page navigation.
- If a user selects rows on Page 1, navigates to another page, and returns back, the selected rows remain selected.

This is handled without storing entire row objects.

---

### 3. Custom Row Selection Panel
- A custom overlay panel allows users to input a number **N**.
- On applying the selection:
  - The first **N rows globally** are considered selected.

---

### 4. Bulk Selection Strategy (Important)

The assignment restricts:

> Do not fetch rows from other pages to complete bulk selection.

To comply with this, a **global index-based selection rule** is used instead of fetching additional data.

Each row's global index is calculated as:
