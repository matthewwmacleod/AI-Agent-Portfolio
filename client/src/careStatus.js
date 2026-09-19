const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(dateString) {
  if (!dateString) return null;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / DAY_MS);
}

// Returns { status, daysLeft } for a care action. status is one of:
// 'never', 'ok', 'due', 'overdue'
export function careStatus(lastDate, frequencyDays) {
  if (!lastDate) return { status: "never", daysLeft: null };
  const elapsed = daysSince(lastDate);
  const daysLeft = frequencyDays - elapsed;
  if (daysLeft < 0) return { status: "overdue", daysLeft };
  if (daysLeft === 0) return { status: "due", daysLeft };
  return { status: "ok", daysLeft };
}

export function wateringStatus(plant) {
  return careStatus(plant.last_watered, plant.watering_frequency_days);
}

export function fertilizingStatus(plant) {
  return careStatus(plant.last_fertilized, plant.fertilizing_frequency_days);
}
