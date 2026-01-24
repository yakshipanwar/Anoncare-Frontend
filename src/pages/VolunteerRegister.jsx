import { useState } from "react";
import { Link } from "react-router-dom";
import { registerVolunteer } from "../api/auth";

function VolunteerRegister() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [motivation, setMotivation] = useState("");
  const [idProof, setIdProof] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!idProof) {
    alert("Please upload an ID proof.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("motivation_text", motivation);
    formData.append("id_proof", idProof);

    await registerVolunteer(formData);

    alert(
      "Application submitted successfully.\nYour profile will be reviewed before approval."
    );

    // optional redirect
    window.location.href = "/login";
  } catch (err) {
    alert(
      err.response?.data?.detail ||
        "Registration failed. Please try again."
    );
  }
};

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg">

        <h2 className="text-2xl font-semibold text-center">
          Volunteer Registration
        </h2>
        <p className="mt-2 text-sm text-gray-400 text-center">
          Help others responsibly and anonymously.
        </p>

        {/* INFO */}
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 space-y-2">
          <p>• Volunteers are manually reviewed</p>
          <p>• This is not a therapist role</p>
          <p>• ID proof is used only for verification</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <div>
            <label className="text-sm text-gray-400">Username</label>
            
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">
              Why do you want to help?
            </label>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              required
              rows={4}
              className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* ID PROOF */}
          <div>
            <label className="text-sm text-gray-400">
              Upload ID Proof (PDF / Image)
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setIdProof(e.target.files[0])}
              required
              className="mt-2 w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:bg-gray-700 file:text-gray-200
                hover:file:bg-gray-600"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-lg font-medium transition"
          >
            Apply as Volunteer
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already registered?{" "}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VolunteerRegister;
