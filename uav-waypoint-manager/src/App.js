import "./App.css";
import { MissionProvider } from "./context/MissionContext";
import MapView from "./components/Map/MapView";
import WaypointPanel from "./components/Panels/WaypointPanel";
import MissionPanel from "./components/Panels/MissionPanel";
import MissionBrowser from "./components/Panels/MissionBrowser";

function App() {
  return (
    <MissionProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  UAV Mission Planner
                </h1>
                <p className="text-xs text-blue-100 mt-0.5 ml-9">
                  Professional waypoint management system
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-200">Version 1.0.0</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3 p-3">
            {/* Left Sidebar - Mission Browser */}
            <div className="lg:col-span-3 h-full overflow-y-auto">
              <div className="h-full flex flex-col space-y-3">
                <MissionBrowser />
                <MissionPanel />
              </div>
            </div>

            {/* Center - Map View */}
            <div className="lg:col-span-6 order-first lg:order-none h-full">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-2 flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Map View
                  </h2>
                  <span className="text-xs text-gray-300">Anuradhapura, Sri Lanka</span>
                </div>
                <div className="h-[calc(100%-40px)]">
                  <MapView />
                </div>
              </div>
            </div>

            {/* Right Sidebar - Waypoint List */}
            <div className="lg:col-span-3 h-full overflow-y-auto">
              <WaypointPanel />
            </div>
          </div>
        </main>
      </div>
    </MissionProvider>
  );
}

export default App;
