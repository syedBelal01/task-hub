export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
            TH
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 truncate">Task Hub</div>
            <div className="text-sm text-slate-500">Starting…</div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div className="text-sm font-medium text-slate-700">Loading…</div>
        </div>
      </div>
    </div>
  );
}

