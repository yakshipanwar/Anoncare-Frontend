import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { loginUser } from "../api/auth";
import { getMyVerificationStatus } from "../api/verification";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Login API
      const res = await loginUser(username, password);

      const { access, role } = res.data;
      console.log("ROLE:", role);

      login({ token: access, role });

      if (role === "VOLUNTEER") {
        const statusRes = await getMyVerificationStatus(access);

        login({
          token: access,
          role: role,
          verificationStatus: statusRes.data.status, // 🔥 REQUIRED
        });

        if (statusRes.data.status !== "APPROVED") {
          navigate("/pending-approval");
          return;
        }
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-semibold text-center">Welcome Back</h2>
        <p className="mt-2 text-sm text-gray-400 text-center">
          Login to continue to AnonCare
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2.5 rounded-lg font-medium transition"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don’t have an account?{" "}
          <Link to="/" className="text-blue-400 hover:underline">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
