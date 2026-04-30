export default function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${
          light ? 'bg-white' : 'bg-gradient-to-br from-brand-500 to-brand-700'
        }`}
      >
        <svg
          className={`w-5 h-5 ${light ? 'text-brand-700' : 'text-white'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 12l4 4L19 7"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          TeamTask
        </div>
        <div className={`text-[10px] uppercase tracking-widest ${light ? 'text-blue-200' : 'text-slate-400'}`}>
          Project Manager
        </div>
      </div>
    </div>
  );
}
