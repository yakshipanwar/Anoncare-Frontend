import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100 flex flex-col">
      {/* NAVBAR */}
      <header className="px-8 py-3 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-2xl font-semibold tracking-wide">
          Anon<span className="text-blue-500">Care</span>
        </h1>
        <Link
          to="/login"
          className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
        >
          Login
        </Link>
      </header>

      {/* HERO */}
      <main className="flex-1 flex items-center justify-center px-6 pt-14">
        <div className="max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight">
            Anonymous support,
            <span className="block text-blue-400 mt-3">
              built on human connection
            </span>
          </h2>

          <p className="mt-8 text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
            AnonCare is a safe space to talk anonymously with real people who
            listen — without judgment, pressure, or exposure.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              to="/register/seeker"
              className="px-10 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-600/20"
            >
              I Need Support
            </Link>

            <Link
              to="/register/volunteer"
              className="px-10 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition font-medium shadow-lg shadow-emerald-600/20"
            >
              I Want to Help
            </Link>
          </div>
        </div>
      </main>

      {/* INFO GRID */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
          {/* CARD 1 */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">
              What AnonCare Is
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Anonymous peer support</li>
              <li>• Real human conversations</li>
              <li>• Verified volunteers</li>
              <li>• No identity pressure</li>
            </ul>
          </div>

          {/* CARD 2 */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition">
            <h3 className="text-lg font-semibold mb-3 text-red-400">
              What It Is Not
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Not therapy</li>
              <li>• Not medical advice</li>
              <li>• Not crisis services</li>
              <li>• Not a professional substitute</li>
            </ul>
          </div>

          {/* CARD 3 */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">
              Safety First
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Do not share personal details</li>
              <li>• Stay anonymous</li>
              <li>• Respect boundaries</li>
              <li>• Seek professionals if needed</li>
            </ul>
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 text-sm leading-relaxed text-center">
            AnonCare is designed for emotional support and shared understanding.
            It does not provide medical, psychiatric, or emergency assistance.
            If you are in immediate danger, please contact local emergency
            services or a licensed professional.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-6 text-center text-gray-500 text-sm border-t border-gray-800">
        © {new Date().getFullYear()} AnonCare · Built with care, not claims
      </footer>
    </div>
  );
}

export default Landing;
