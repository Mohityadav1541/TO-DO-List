import ArtworkTable from "./components/ArtworkTable";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen p-4 surface-ground">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2">
          Art Institute of Chicago Artworks
        </h1>
      </div>

      <ArtworkTable />
    </div>
  );
}

export default App;