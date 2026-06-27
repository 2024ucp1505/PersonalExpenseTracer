// StatCard is now inlined inside Dashboard.jsx with Tailwind classes.
// This file is kept as a minimal re-export for backwards compatibility.
export default function StatCard({ icon, label, value }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
