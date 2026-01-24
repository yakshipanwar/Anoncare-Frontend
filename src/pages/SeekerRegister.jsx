import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerSeeker } from "../api/auth";

function SeekerRegister() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await registerSeeker({ username, password });
      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6 text-white">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center">
          Seeker Registration
        </h2>

        {/* 🔥 FORM MUST HAVE onSubmit */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-800"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {success && (
            <p className="text-green-400 text-sm text-center">
              Account created successfully. Redirecting to login…
            </p>
          )}
          <input
            type="password"
            className="w-full p-2 rounded bg-gray-800"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* 🔥 BUTTON MUST BE submit */}
          <button
            type="submit"
            disabled={success}
            className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default SeekerRegister;
