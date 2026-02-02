import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  requestSession,
  getMySession,
  getPendingRequests,
  acceptSession,
  endSession
} from "../api/session";
import Chat from "./Chat";
import DailyCheckIn from "../components/DailyCheckIn";
import CopingStrategies from "../components/CopingStrategies";

function Dashboard() {
  const { auth, logout } = useContext(AuthContext);
  const [session, setSession] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [endedBy, setEndedBy] = useState(null);
  const [activeTab, setActiveTab] = useState("home"); // <-- New state for tabs: home, coping, checkin

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const WS_URL = API_URL.replace('http', 'ws');

  const fetchSession = useCallback(async () => {
    try {
      const res = await getMySession();
      setSession(res.data);
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        setSession(null);
      }
      return null;
    }
  }, []);

  const fetchPending = useCallback(async () => {
    if (auth.role !== "VOLUNTEER") return;
    try {
      const res = await getPendingRequests();
      setPending(res.data);
    } catch (err) {
      console.error("Fetch pending error:", err);
    }
  }, [auth.role]);

  const handleRequest = async () => {
    setError("");
    setEndedBy(null);
    setRequesting(true);
    
    try {
      const res = await requestSession();
      setSession(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Permission denied. Please ensure you're logged in as a seeker.");
      } else if (err.response?.status === 400) {
        setError(err.response.data?.detail || "You already have an active session");
        fetchSession();
      } else {
        setError("Failed to request session. Please try again.");
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleAccept = async (sessionId) => {
    try {
      await acceptSession(sessionId);
      await fetchSession();
      setPending([]);
      setEndedBy(null);
    } catch (err) {
      setError("Failed to accept session. It may have been taken.");
      fetchPending();
    }
  };

  const handleEnd = async () => {
    if (!window.confirm("Are you sure you want to end this session?")) return;
    
    try {
      await endSession(session.id);
      setSession(null);
      setEndedBy("self");
      setError("");
      
      if (auth.role === "VOLUNTEER") {
        await fetchPending();
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to end session");
    }
  };

  const { status: wsStatus } = useWebSocket(
    `${WS_URL}/ws/dashboard/?token=${auth.token}`,
    {
      onMessage: useCallback(async (data) => {
        if (data.type === "session_update" && data.event === "session_ended") {
          const endedByRole = data.data?.ended_by;
          if (endedByRole && endedByRole !== auth.role) {
            setSession(null);
            setEndedBy(endedByRole.toLowerCase());
            setError(`Session ended by ${endedByRole.toLowerCase()}`);
            if (auth.role === "VOLUNTEER") fetchPending();
          }
        }
        else if (data.type === "new_request" && auth.role === "VOLUNTEER") {
          fetchPending();
        }
        else if (data.type === "request_accepted" && auth.role === "SEEKER") {
          fetchSession();
        }
      }, [auth.role, fetchPending, fetchSession]),
      
      onConnect: useCallback(() => {
        fetchSession();
        if (auth.role === "VOLUNTEER") fetchPending();
      }, [fetchSession, fetchPending, auth.role]),
      
      reconnectInterval: 5000
    }
  );

  useEffect(() => {
    const init = async () => {
      await fetchSession();
      if (auth.role === "VOLUNTEER") await fetchPending();
      setLoading(false);
    };
    init();
  }, [fetchSession, fetchPending, auth.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-800 bg-gray-950/50 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-semibold tracking-wide">
            Anon<span className="text-blue-500">Care</span>
          </Link>
          
          {/* Navigation Tabs - Show only when no active session */}
          {!session && (
            <div className="hidden md:flex items-center gap-1 bg-gray-900/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("home")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === "home" 
                    ? "bg-gray-800 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab("coping")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === "coping" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                🧰 Coping Tools
              </button>
              <button
                onClick={() => setActiveTab("checkin")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === "checkin" 
                    ? "bg-emerald-600 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📋 Daily Check-in
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              wsStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              wsStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
              'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : wsStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`} />
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{auth.role}</span>
            <button onClick={logout} className="text-sm px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Session Ended Notification */}
        {endedBy && endedBy !== "self" && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-400">Session Ended</h3>
              <p className="text-sm text-yellow-500/80">The {endedBy} has ended the session.</p>
            </div>
            <button onClick={() => setEndedBy(null)} className="text-yellow-400 hover:text-yellow-300 text-xl">×</button>
          </div>
        )}

        {error && !error.includes("Session ended") && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex justify-between items-center">
            <span className="text-red-400 text-sm">{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">×</button>
          </div>
        )}

        {/* SEEKER VIEW - NO SESSION */}
        {auth.role === "SEEKER" && !session && (
          <>
            {/* TAB: HOME (Chat Request) */}
            {activeTab === "home" && (
              <div className="max-w-2xl mx-auto text-center py-20">
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold mb-3">Need someone to talk to?</h2>
                  <p className="text-gray-400 mb-8">Connect with a verified volunteer anonymously</p>
                  <button
                    onClick={handleRequest}
                    disabled={requesting || wsStatus !== "connected"}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition shadow-lg shadow-blue-600/20"
                  >
                    {requesting ? "Requesting..." : "Request Support Session"}
                  </button>
                  {wsStatus !== "connected" && (
                    <p className="mt-4 text-sm text-yellow-500">Connecting to server...</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: COPING STRATEGIES */}
            {activeTab === "coping" && <CopingStrategies />}

            {/* TAB: DAILY CHECK-IN */}
            {activeTab === "checkin" && (
              <div className="max-w-2xl mx-auto">
                <DailyCheckIn />
              </div>
            )}
          </>
        )}

        {/* VOLUNTEER VIEW - NO SESSION */}
        {auth.role === "VOLUNTEER" && !session && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Pending Requests</h2>
              <span className="text-sm text-gray-500">{pending.length} waiting</span>
            </div>
            {pending.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-400">No seekers waiting at the moment</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pending.map((p) => (
                  <div key={p.session_id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-between items-center hover:border-gray-700 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 font-mono text-sm">#{p.seeker_id}</div>
                      <div>
                        <h3 className="font-medium text-gray-200">Seeker #{p.seeker_id}</h3>
                        <p className="text-sm text-gray-500">Waiting for support...</p>
                      </div>
                    </div>
                    <button onClick={() => handleAccept(p.session_id)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition shadow-lg shadow-emerald-600/20">Accept</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE SESSION - Chat (Tabs hidden) */}
        {session && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${session.status === "ACTIVE" ? "bg-emerald-500" : "bg-yellow-500"}`} />
                  <div>
                    <span className="font-semibold text-gray-100">Session #{session.id}</span>
                    <span className={`ml-3 text-sm ${session.status === "ACTIVE" ? "text-emerald-400" : "text-yellow-400"}`}>{session.status}</span>
                  </div>
                </div>
                <button onClick={handleEnd} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm font-medium">End Session</button>
              </div>

              <div className="p-6">
                {session.status === "REQUESTED" ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Waiting for volunteer to accept...</p>
                  </div>
                ) : (
                  <Chat 
                    sessionId={session.id} 
                    token={auth.token} 
                    onSessionEnd={(endedByRole) => {
                      setSession(null);
                      setEndedBy(endedByRole?.toLowerCase() || 'peer');
                      if (auth.role === "VOLUNTEER") fetchPending();
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;