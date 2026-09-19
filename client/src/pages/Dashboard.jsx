import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { wateringStatus, fertilizingStatus } from "../careStatus.js";
import StatusPill from "../components/StatusPill.jsx";

export default function Dashboard() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setPlants(await api.listPlants());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCare(plant, type) {
    setActingId(plant.id);
    try {
      const updated = await api.logCare(plant.id, { type });
      setPlants((prev) => prev.map((p) => (p.id === plant.id ? updated : p)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  const needsCare = plants
    .map((plant) => ({
      plant,
      watering: wateringStatus(plant),
      fertilizing: fertilizingStatus(plant),
    }))
    .filter(({ watering, fertilizing }) => watering.status !== "ok" || fertilizing.status !== "ok")
    .sort((a, b) => (a.watering.daysLeft ?? -999) - (b.watering.daysLeft ?? -999));

  const overdueCount = needsCare.filter(
    ({ watering, fertilizing }) => watering.status === "overdue" || fertilizing.status === "overdue"
  ).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>A snapshot of everything in your garden right now.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-row">
        <div className="card stat-card">
          <span className="stat-number">{plants.length}</span>
          <span className="stat-label">Tracked plants</span>
        </div>
        <div className="card stat-card">
          <span className="stat-number">{needsCare.length}</span>
          <span className="stat-label">Need attention</span>
        </div>
        <div className="card stat-card">
          <span className="stat-number" style={{ color: overdueCount ? "var(--color-danger)" : undefined }}>
            {overdueCount}
          </span>
          <span className="stat-label">Overdue</span>
        </div>
      </div>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Needs attention</h2>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : needsCare.length === 0 ? (
          <div className="card empty-state">
            {plants.length === 0 ? (
              <>
                No plants yet. <Link to="/plants">Add your first plant</Link> to start tracking care.
              </>
            ) : (
              "Nothing needs care right now. Nice work! 🌿"
            )}
          </div>
        ) : (
          <div className="care-list">
            {needsCare.map(({ plant, watering, fertilizing }) => (
              <div className="card care-row" key={plant.id}>
                <div className="care-row-info">
                  <strong>{plant.name}</strong>
                  <span className="care-row-species">{plant.species}</span>
                </div>
                <div className="care-row-pills">
                  <StatusPill status={watering.status} daysLeft={watering.daysLeft} />
                  <StatusPill status={fertilizing.status} daysLeft={fertilizing.daysLeft} />
                </div>
                <div className="care-row-actions">
                  <button
                    className="btn secondary"
                    disabled={actingId === plant.id}
                    onClick={() => handleCare(plant, "water")}
                  >
                    💧 Water
                  </button>
                  <button
                    className="btn secondary"
                    disabled={actingId === plant.id}
                    onClick={() => handleCare(plant, "fertilize")}
                  >
                    🌾 Fertilize
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
