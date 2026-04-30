export default function StatCard({ label, value, icon, accent = 'brand', sub }) {
  const accents = {
    brand: 'from-brand-500 to-brand-700 text-white',
    blue: 'from-sky-500 to-blue-600 text-white',
    green: 'from-emerald-500 to-teal-600 text-white',
    amber: 'from-amber-400 to-orange-500 text-white',
    red: 'from-rose-500 to-red-600 text-white',
    slate: 'from-slate-500 to-slate-700 text-white',
  };
  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-soft transition-shadow">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center shadow-md`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-2xl font-extrabold text-slate-900 leading-tight">
          {value}
        </div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
