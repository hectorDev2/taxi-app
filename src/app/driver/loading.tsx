export default function DriverLoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-white/80 text-sm">Cargando...</p>
      </div>
    </div>
  );
}
