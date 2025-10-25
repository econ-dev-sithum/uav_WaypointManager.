import "./App.css";
import MapView from "./components/MapView";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-3xl font-bold">UAV Waypoint Manager</h1>
      </header>
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Map View</h2>
          <MapView />
        </div>
      </main>
    </div>
  );
}

export default App;
