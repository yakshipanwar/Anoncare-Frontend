import { useEffect, useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { getMyVerificationStatus } from "../api/verification";

function PendingApproval() {
  const { auth } = useContext(AuthContext);
  const [status, setStatus] = useState("LOADING");

  useEffect(() => {
    getMyVerificationStatus(auth.token).then((res) => {
      setStatus(res.data.status);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-6 rounded-xl text-center">
        <h2 className="text-2xl font-semibold tracking-wide">
  Volunteer Application
</h2>

        {status === "PENDING" && (
          <p className="mt-4 text-gray-300 leading-relaxed">
  We review applications manually to ensure safety and trust.
  You’ll be notified once approved.
</p>
        )}

        {status === "REJECTED" && (
          <p className="mt-4 text-red-400">
            Your application was rejected.
          </p>
        )}

        {status === "APPROVED" && (
          <p className="mt-4 text-green-400">
            Approved! Please re-login.
          </p>
        )}
      </div>
    </div>
  );
}

export default PendingApproval;
