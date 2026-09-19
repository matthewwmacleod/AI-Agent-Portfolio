const LABELS = {
  never: "Never logged",
  ok: (days) => `Due in ${days}d`,
  due: () => "Due today",
  overdue: (days) => `${Math.abs(days)}d overdue`,
};

export default function StatusPill({ status, daysLeft }) {
  const label = typeof LABELS[status] === "function" ? LABELS[status](daysLeft) : LABELS[status];
  return <span className={`pill ${status}`}>{label}</span>;
}
