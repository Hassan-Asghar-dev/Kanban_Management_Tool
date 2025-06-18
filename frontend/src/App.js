import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebaseConfig";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import GanttChart from "./components/GanttChart";
import Roadmap from "./components/Roadmap";
import WorkDayTracker, { DashboardContext } from "./components/WorkDayTracker";
import Hero from "./pages/Hero";
import Company from "./pages/Company";
import GetStarted from "./pages/GetStarted";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Settings from "./pages/Settings";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

function App() {
  const [user, loading] = useAuthState(auth);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkVerification = async () => {
      if (loading) return;
      try {
        if (user) {
          await user.getIdToken(true);
          setIsVerified(user.emailVerified);
          const token = await user.getIdToken();
          const profileResponse = await axios.get(`${API_BASE_URL}/api/profile/`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
          if (!profileResponse.data) throw new Error(`Invalid profile data`);
          setUserName(profileResponse.data.name || user.email.split('@')[0]);
          setUserRole(profileResponse.data.role);
          console.log("User profile:", { name: profileResponse.data.name, role: profileResponse.data.role });
        } else {
          setIsVerified(false);
          setUserName("");
          setUserRole(null);
          setTasks([]);
        }
      } catch (error) {
        console.error("Error checking verification or fetching profile:", error.response?.data || error.message);
        toast.error("Failed to verify user or load profile");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkVerification();
  }, [user, loading]);

  const fetchTasks = useCallback(async () => {
    if (!user || !isVerified || !userName || !selectedTeamId) {
      setTasks([]);
      return;
    }
    setIsLoadingTasks(true);
    try {
      const token = await user.getIdToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/cards/?team_id=${selectedTeamId}&assigned_to=${encodeURIComponent(userName)}`,
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      if (!Array.isArray(response.data)) throw new Error("Invalid task data format");
      console.log("Fetched tasks from /api/cards/:", response.data);
      setTasks(
        response.data.map((task) => ({
          ...task,
          progress: task.progress ?? 0,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching tasks:", error.response?.data || error.message);
      toast.error(`Failed to fetch tasks: ${error.response?.data?.detail || error.message}`);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user, isVerified, userName, selectedTeamId]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white text-2xl">
        <div className="flex items-center space-x-3">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-[#00df9a]" />
          <h2 className="text-2xl font-semibold">Checking authentication...</h2>
        </div>
      </div>
    );
  }

  const allowedUnauthenticatedRoutes = ["/verify-email", "/login", "/signup", "/forgot-password"];
  if (user && !isVerified && !allowedUnauthenticatedRoutes.includes(location.pathname)) {
    return <Navigate to="/verify-email" replace />;
  }

  const showSidebar = user && isVerified;

  return (
    <DashboardContext.Provider value={{ tasks, isLoadingTasks, selectedTeamId, setSelectedTeamId, userRole, setTasks }}>
      <div className="bg-green-1000 min-h-screen flex">
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        {showSidebar ? <Sidebar /> : <Navbar />}
        <main className="flex-grow flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/login" element={showSidebar ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/signup" element={showSidebar ? <Navigate to="/dashboard" /> : <Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/verify-email"
                element={user && !isVerified ? <VerifyEmail /> : <Navigate to="/dashboard" />}
              />
              <Route path="/dashboard" element={showSidebar ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/profile" element={showSidebar ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/settings" element={showSidebar ? <Settings /> : <Navigate to="/login" />} />
              <Route path="/gantt/:teamId" element={showSidebar ? <GanttChart /> : <Navigate to="/login" />} />
              <Route
                path="/workday-tracker"
                element={showSidebar ? <WorkDayTracker /> : <Navigate to="/login" />}
              />
              <Route
                path="/get-started"
                element={showSidebar ? <Navigate to="/dashboard" /> : <GetStarted />}
              />
              <Route
                path="/"
                element={
                  showSidebar ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <>
                      <section id="home" className="min-h-screen flex items-center justify-center">
                        <Hero />
                      </section>
                      <hr className="border-t-8 border-black" />
                      <section
                        id="company"
                        className="min-h-screen flex items-center justify-center"
                        style={{ backgroundImage: "url('/assets/company-bg.jpeg')" }}
                      >
                        <Company />
                      </section>
                      <hr className="border-t-8 border-black" />
                      <section
                        id="contact"
                        className="min-h-screen flex items-center justify-center"
                        style={{ backgroundColor: "rgb(4,23,2)" }}
                      >
                        <Contact />
                      </section>
                    </>
                  )
                }
              />
              <Route path="*" element={<Navigate to={showSidebar ? "/dashboard" : "/login"} />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </DashboardContext.Provider>
  );
}

export default App;