import { useEffect, useState } from "react";
import { api } from "../api.js";
import { wateringStatus, fertilizingStatus } from "../careStatus.js";
import StatusPill from "../components/StatusPill.jsx";
import PlantForm from "../components/PlantForm.jsx";
import Modal from "../components/Modal.jsx";

export default function MyPlants() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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

  async function handleAdd(data) {
    const created = await api.createPlant(data);
    setPlants((prev) => [created, ...prev]);
    setShowAdd(false);
  }

  async function handleEdit(data) {
    const updated = await api.updatePlant(editingPlant.id, data);
    setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPlant(null);
  }

  async function handleDelete(plant) {
    if (!confirm(`Remove "${plant.name}" from your garden?`)) return;
    try {
      await api.deletePlant(plant.id);
      setPlants((prev) => prev.filter((p) => p.id !== plant.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCare(plant, type) {
    try {
      const updated = await api.logCare(plant.id, { type });
      setPlants((prev) => prev.map((p) => (p.id === plant.id ? updated : p)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Plants</h1>
          <p>Every plant you're growing, with its care schedule.</p>
        </div>
        <button className="btn" onClick={() => setShowAdd(true)}>
          + Add plant
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : plants.length === 0 ? (
        <div className="card empty-state">No plants yet. Add your first one to get started.</div>
      ) : (
        <div className="plant-grid">
          {plants.map((plant) => {
            const watering = wateringStatus(plant);
            const fertilizing = fertilizingStatus(plant);
            const expanded = expandedId === plant.id;
            return (
              <div className="card plant-card" key={plant.id}>
                <div className="plant-card-top">
                  <div>
                    <h3 style={{ marginBottom: 0 }}>{plant.name}</h3>
                    {plant.species && <span className="care-row-species">{plant.species}</span>}
                  </div>
                  <span className="pill" style={{ background: "var(--color-primary-light)", color: "var(--color-primary-dark)" }}>
                    ☀️ {plant.sunlight}
                  </span>
                </div>

                <div className="care-row-pills" style={{ margin: "0.6rem 0" }}>
                  <StatusPill status={watering.status} daysLeft={watering.daysLeft} />
                  <StatusPill status={fertilizing.status} daysLeft={fertilizing.daysLeft} />
                </div>

                {plant.notes && <p className="plant-notes">{plant.notes}</p>}

                <div className="plant-card-actions">
                  <button className="btn secondary" onClick={() => handleCare(plant, "water")}>
                    💧 Water
                  </button>
                  <button className="btn secondary" onClick={() => handleCare(plant, "fertilize")}>
                    🌾 Fertilize
                  </button>
                  <button className="btn secondary" onClick={() => setEditingPlant(plant)}>
                    Edit
                  </button>
                  <button className="btn danger" onClick={() => handleDelete(plant)}>
                    Delete
                  </button>
                </div>

                <button className="link-toggle" onClick={() => setExpandedId(expanded ? null : plant.id)}>
                  {expanded ? "Hide care history" : "Show care history"}
                </button>
                {expanded && <CareHistory plantId={plant.id} />}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Add a plant" onClose={() => setShowAdd(false)}>
          <PlantForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} submitLabel="Add plant" />
        </Modal>
      )}

      {editingPlant && (
        <Modal title={`Edit ${editingPlant.name}`} onClose={() => setEditingPlant(null)}>
          <PlantForm initial={editingPlant} onSubmit={handleEdit} onCancel={() => setEditingPlant(null)} submitLabel="Save changes" />
        </Modal>
      )}
    </div>
  );
}

function CareHistory({ plantId }) {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    api.getPlant(plantId).then((p) => setLogs(p.care_logs));
  }, [plantId]);

  if (!logs) return <p className="empty-state">Loading history…</p>;
  if (logs.length === 0) return <p className="empty-state">No care logged yet.</p>;

  return (
    <ul className="care-history">
      {logs.map((log) => (
        <li key={log.id}>
          <span className="care-history-type">{log.type}</span>
          <span className="care-history-date">{new Date(log.logged_at).toLocaleString()}</span>
          {log.notes && <span className="care-history-notes">{log.notes}</span>}
        </li>
      ))}
    </ul>
  );
}
