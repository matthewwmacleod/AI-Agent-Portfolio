import { useState } from "react";

const SUNLIGHT_OPTIONS = ["full sun", "partial", "shade"];

const DEFAULTS = {
  name: "",
  species: "",
  sunlight: "partial",
  watering_frequency_days: 7,
  fertilizing_frequency_days: 30,
  planted_date: "",
  notes: "",
};

export default function PlantForm({ initial, onSubmit, onCancel, submitLabel = "Add plant" }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Plant name is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        watering_frequency_days: Number(form.watering_frequency_days) || 1,
        fertilizing_frequency_days: Number(form.fertilizing_frequency_days) || 1,
      });
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
        <label htmlFor="pf-name">Name</label>
        <input id="pf-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Cherry tomato" />
      </div>

      <div className="field">
        <label htmlFor="pf-species">Species</label>
        <input
          id="pf-species"
          value={form.species}
          onChange={(e) => update("species", e.target.value)}
          placeholder="Solanum lycopersicum"
        />
      </div>

      <div className="field">
        <label htmlFor="pf-sunlight">Sunlight</label>
        <select id="pf-sunlight" value={form.sunlight} onChange={(e) => update("sunlight", e.target.value)}>
          {SUNLIGHT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="pf-water">Water every (days)</label>
          <input
            id="pf-water"
            type="number"
            min="1"
            value={form.watering_frequency_days}
            onChange={(e) => update("watering_frequency_days", e.target.value)}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="pf-fertilize">Fertilize every (days)</label>
          <input
            id="pf-fertilize"
            type="number"
            min="1"
            value={form.fertilizing_frequency_days}
            onChange={(e) => update("fertilizing_frequency_days", e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="pf-planted">Planted date</label>
        <input id="pf-planted" type="date" value={form.planted_date || ""} onChange={(e) => update("planted_date", e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="pf-notes">Notes</label>
        <textarea id="pf-notes" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        {onCancel && (
          <button type="button" className="btn secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
