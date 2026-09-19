const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: options.body instanceof FormData ? options.headers : { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => request("/health"),

  listPlants: () => request("/plants"),
  getPlant: (id) => request(`/plants/${id}`),
  createPlant: (data) => request("/plants", { method: "POST", body: JSON.stringify(data) }),
  updatePlant: (id, data) => request(`/plants/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deletePlant: (id) => request(`/plants/${id}`, { method: "DELETE" }),
  logCare: (id, data) => request(`/plants/${id}/care`, { method: "POST", body: JSON.stringify(data) }),

  listBeds: () => request("/beds"),
  createBed: (data) => request("/beds", { method: "POST", body: JSON.stringify(data) }),
  updateBed: (id, data) => request(`/beds/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBed: (id) => request(`/beds/${id}`, { method: "DELETE" }),
  placePlant: (bedId, data) => request(`/beds/${bedId}/place`, { method: "POST", body: JSON.stringify(data) }),
  unplacePlant: (bedId, data) => request(`/beds/${bedId}/unplace`, { method: "POST", body: JSON.stringify(data) }),

  askAdvisor: ({ question, plantId, image }) => {
    const form = new FormData();
    if (question) form.append("question", question);
    if (plantId) form.append("plant_id", plantId);
    if (image) form.append("image", image);
    return request("/advisor/ask", { method: "POST", body: form });
  },
};
