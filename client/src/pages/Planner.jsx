import { useEffect, useState } from "react";
import { api } from "../api.js";
import Modal from "../components/Modal.jsx";

export default function Planner() {
  const [beds, setBeds] = useState([]);
  const [plants, setPlants] = useState([]);
  const [activeBedId, setActiveBedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddBed, setShowAddBed] = useState(false);
  const [placingPlantId, setPlacingPlantId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [bedList, plantList] = await Promise.all([api.listBeds(), api.listPlants()]);
      setBeds(bedList);
      setPlants(plantList);
      setError("");
      setActiveBedId((prev) => prev || bedList[0]?.id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddBed(data) {
    const bed = await api.createBed(data);
    setBeds((prev) => [bed, ...prev]);
    setActiveBedId(bed.id);
    setShowAddBed(false);
  }

  async function handleDeleteBed(bed) {
    if (!confirm(`Delete bed "${bed.name}"? Plants in it will become unplaced.`)) return;
    await api.deleteBed(bed.id);
    setBeds((prev) => prev.filter((b) => b.id !== bed.id));
    setPlants((prev) => prev.map((p) => (p.bed_id === bed.id ? { ...p, bed_id: null, pos_x: null, pos_y: null } : p)));
    setActiveBedId((prev) => (prev === bed.id ? null : prev));
  }

  async function placeAt(bed, x, y) {
    if (!placingPlantId) return;
    try {
      const updated = await api.placePlant(bed.id, { plant_id: placingPlantId, x, y });
      setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setPlacingPlantId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function unplace(bed, plant) {
    try {
      const updated = await api.unplacePlant(bed.id, { plant_id: plant.id });
      setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setError(err.message);
    }
  }

  const activeBed = beds.find((b) => b.id === activeBedId) || null;
  const bedPlants = activeBed ? plants.filter((p) => p.bed_id === activeBed.id) : [];
  const unplacedPlants = plants.filter((p) => !p.bed_id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Garden Planner</h1>
          <p>Lay out your garden beds and place plants where they'll grow.</p>
        </div>
        <button className="btn" onClick={() => setShowAddBed(true)}>
          + New bed
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : beds.length === 0 ? (
        <div className="card empty-state">No garden beds yet. Create one to start planning your layout.</div>
      ) : (
        <div className="planner-layout">
          <div className="bed-tabs">
            {beds.map((bed) => (
              <button
                key={bed.id}
                className={bed.id === activeBedId ? "bed-tab active" : "bed-tab"}
                onClick={() => setActiveBedId(bed.id)}
              >
                {bed.name}
              </button>
            ))}
          </div>

          {activeBed && (
            <div className="planner-main">
              <div className="card">
                <div className="page-header" style={{ marginBottom: "0.75rem" }}>
                  <div>
                    <h3>{activeBed.name}</h3>
                    {activeBed.description && <p>{activeBed.description}</p>}
                  </div>
                  <button className="btn danger" onClick={() => handleDeleteBed(activeBed)}>
                    Delete bed
                  </button>
                </div>

                {placingPlantId && (
                  <div className="placing-hint">Click an empty cell to place the selected plant. <button className="link-toggle" onClick={() => setPlacingPlantId(null)}>Cancel</button></div>
                )}

                <div
                  className="bed-grid"
                  style={{ gridTemplateColumns: `repeat(${activeBed.width}, 1fr)` }}
                >
                  {Array.from({ length: activeBed.height }).map((_, y) =>
                    Array.from({ length: activeBed.width }).map((__, x) => {
                      const occupant = bedPlants.find((p) => p.pos_x === x && p.pos_y === y);
                      return (
                        <div
                          key={`${x}-${y}`}
                          className={`bed-cell ${occupant ? "occupied" : ""} ${placingPlantId && !occupant ? "placeable" : ""}`}
                          onClick={() => (occupant ? unplace(activeBed, occupant) : placeAt(activeBed, x, y))}
                          title={occupant ? `${occupant.name} — click to remove` : "Empty spot"}
                        >
                          {occupant ? occupant.name : ""}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Unplaced plants</h3>
                {unplacedPlants.length === 0 ? (
                  <p className="empty-state">All your plants are placed in a bed.</p>
                ) : (
                  <div className="unplaced-list">
                    {unplacedPlants.map((plant) => (
                      <button
                        key={plant.id}
                        className={placingPlantId === plant.id ? "unplaced-chip active" : "unplaced-chip"}
                        onClick={() => setPlacingPlantId(placingPlantId === plant.id ? null : plant.id)}
                      >
                        {plant.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddBed && (
        <Modal title="New garden bed" onClose={() => setShowAddBed(false)}>
          <BedForm onSubmit={handleAddBed} onCancel={() => setShowAddBed(false)} />
        </Modal>
      )}
    </div>
  );
}

function BedForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState(4);
  const [height, setHeight] = useState(4);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Bed name is required");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name, description, width: Number(width), height: Number(height) });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label htmlFor="bed-name">Name</label>
        <input id="bed-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Raised bed #1" />
      </div>
      <div className="field">
        <label htmlFor="bed-desc">Description</label>
        <input id="bed-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sunny corner by the fence" />
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="bed-width">Width (cells)</label>
          <input id="bed-width" type="number" min="1" max="12" value={width} onChange={(e) => setWidth(e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="bed-height">Height (cells)</label>
          <input id="bed-height" type="number" min="1" max="12" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Creating…" : "Create bed"}
        </button>
      </div>
    </form>
  );
}
