import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";

import AuthContext from "./context/AuthContext";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SeekerRegister from "./pages/SeekerRegister";
import VolunteerRegister from "./pages/VolunteerRegister";
import PendingApproval from "./pages/PendingApproval";

function PrivateRoute({ children }) {
  const { auth } = useContext(AuthContext);

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route path="/register/seeker" element={<SeekerRegister />} />
        <Route path="/register/volunteer" element={<VolunteerRegister />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/pending-approval"
          element={
            <PrivateRoute>
              <PendingApproval />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
