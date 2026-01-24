import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { requestSession, getMySession } from "../api/session";
import Chat from "./Chat";

function Dashboard() {
  const { auth, logout } = useContext(AuthContext);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSeeker = auth.role === "SEEKER";
  const isVolunteer = auth.role === "VOLUNTEER";

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getMySession(auth.token);
        setSession(res.data);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [auth.token]);

  const handleRequestSession = async () => {
    setError("");
    try {
      const res = await requestSession(auth.token);
      setSession(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to request session");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-medium">
              {isSeeker ? "Seeker Dashboard" : "Volunteer Dashboard"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isSeeker
                ? "You’re in a safe, anonymous support space"
                : "You’re providing anonymous peer support"}
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm transition"
          >
            Logout
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900/70 backdrop-blur border border-gray-800 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.6)]">

          {loading && (
            <p className="text-gray-400">Loading session…</p>
          )}

          {/* SEEKER — NO SESSION */}
          {isSeeker && !session && !loading && (
            <div className="text-center py-10">
              <p className="text-gray-300 mb-6">
                You don’t have an active support session.
              </p>
              <button
                onClick={handleRequestSession}
                className="bg-sky-600 hover:bg-sky-700 px-6 py-3 rounded-2xl transition"
              >
                Request Support Session
              </button>
            </div>
          )}

          {/* VOLUNTEER — NO SESSION */}
          {isVolunteer && !session && !loading && (
            <div className="text-center py-10">
              <p className="text-gray-400">
                Waiting for a seeker to request support…
              </p>
            </div>
          )}

          {/* SESSION EXISTS */}
          {session && (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-400">
                  Session ID: {session.id}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-300">
                  {session.status}
                </span>
              </div>

              {session.status === "REQUESTED" && (
                <p className="text-gray-400 mt-4">
                  {isSeeker
                    ? "Please wait while a volunteer joins…"
                    : "A seeker is waiting for you…"}
                </p>
              )}

              {session.status === "ACTIVE" && (
                <Chat sessionId={session.id} token={auth.token} />
              )}
            </>
          )}

          {error && (
            <p className="text-red-400 mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
