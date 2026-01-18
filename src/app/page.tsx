export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8">
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="text-6xl mb-8">✈️</div>
        <h1 className="text-5xl font-bold text-white mb-4">TripPlanner</h1>
        <p className="text-xl text-slate-300 mb-8 max-w-md">
          Plan amazing trips together with friends and family. Coordinate everything in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all">
            Get Started
          </button>
          <button className="border-2 border-white/20 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all">
            Sign In
          </button>
        </div>
      </div>
      <footer className="text-sm text-gray-500">
        © 2025 TripPlanner
      </footer>
    </div>
  );
}