import { useState, useContext, createContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { LogOut, User, LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";

const SidebarContext = createContext();

const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  if (!user) return null;

  return (
    <aside
      className={`border-r shadow-sm transition-all bg-white fixed inset-y-0 left-0 flex-shrink-0 ${
        expanded ? "w-64" : "w-20"
      }`}
      style={{ minHeight: "100vh" }}
    >
      <nav className="h-full flex flex-col border-r shadow-sm">
        {/* Sidebar Header */}
        <div className="p-4 pb-2 flex justify-between items-center">
  {expanded && (
    <h1 className="text-xl font-bold truncate text-black">
      <span className="text-green-500">Welcome,<br /><br /></span>
      {user?.email ? 
  user.email.split('@')[0]
    .replace(/[0-9]/g, '')
    .split('.')[0]               // Take just the first part
    .charAt(0).toUpperCase() + 
    user.email.split('@')[0]
      .replace(/[0-9]/g, '')
      .split('.')[0]
      .slice(1)
  : "User"}
    </h1>
  )}
</div>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setExpanded((curr) => !curr)}
          className="p-2 rounded-lg bg-gray-50 hover:bg-black absolute top-4 -right-5 border border-gray-300"
        >
          {expanded ? "←" : "→"}
        </button>

        <SidebarContext.Provider value={{ expanded }}>
          {/* Sidebar Items */}
          <ul className="flex-1 px-4 list-none">
            <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" to="/dashboard" />
          </ul>

          {/* Settings (Moved Above Logout) */}
          <div className="border-t p-3">
          <SidebarItem icon={<User size={20} />} text="Profile" to="/profile" />

            <SidebarItem icon={<SettingsIcon size={20} />} text="Settings" to="/settings" />
          </div>

          {/* Logout Section */}
          <div className="border-t p-3">
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-red-600 font-semibold hover:bg-red-100 p-2 rounded-md transition mt-2"
            >
              <LogOut size={20} />
              {expanded && <span className="ml-3">Logout</span>}
            </button>
          </div>
        </SidebarContext.Provider>
      </nav>
    </aside>
  );
};

// Sidebar Item Component
const SidebarItem = ({ icon, text, to }) => {
  const { expanded } = useContext(SidebarContext);

  return (
    <li className="list-none">
      <NavLink
        to={to}
        className="flex items-center w-full p-3 my-1 rounded-md hover:bg-[rgb(0,128,0)] hover:text-white transition"
      >
        {icon}
        <span className={`ml-3 transition-all ${expanded ? "block" : "hidden"}`}>{text}</span>
      </NavLink>
    </li>
  );
};

export default Sidebar;
