export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 animate-fade-in">
      <div className="text-center animate-scale-in">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-brand mb-4"></div>
        <p className="text-slate-600 font-semibold text-lg">Loading...</p>
        <p className="text-slate-400 text-sm mt-2">Please wait</p>
      </div>
    </div>
  );
}
