import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import MyPlants from "./pages/MyPlants.jsx";
import Planner from "./pages/Planner.jsx";
import Advisor from "./pages/Advisor.jsx";
import "./App.css";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/plants", label: "My Plants" },
  { to: "/planner", label: "Planner" },
  { to: "/advisor", label: "AI Advisor" },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">🌱</span>
          <span className="brand-name">Garden Companion</span>
        </div>
        <nav className="app-nav">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plants" element={<MyPlants />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/advisor" element={<Advisor />} />
        </Routes>
      </main>
    </div>
  );
}
