import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { scroller, animateScroll as scroll } from "react-scroll";

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await currentUser.reload();
        setUser(auth.currentUser);
        setIsVerified(auth.currentUser?.emailVerified || false);
      } else {
        setUser(null);
        setIsVerified(false);
      }
      
    });

    return () => unsubscribe();
  }, [auth]);

  const handleNav = () => setNav(!nav);
  const closeNav = () => setNav(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  const handleScroll = (section) => {
    if (location.pathname === "/") {
      scroller.scrollTo(section, { smooth: true, duration: 800, offset: -70 });
    } else {
      navigate("/");
      setTimeout(() => {
        scroller.scrollTo(section, { smooth: true, duration: 800, offset: -70 });
      }, 500);
    }
    closeNav();
  };

  const handleHomeClick = () => {
    if (location.pathname === "/") {
      scroll.scrollToTop({ smooth: true, duration: 800 });
    } else {
      navigate("/");
      setTimeout(() => scroll.scrollToTop({ smooth: true, duration: 800 }), 500);
    }
    closeNav();
  };

  return (
    <div className="fixed top-0 w-full z-50 flex justify-between items-center h-15 px-4 text-white bg-black">
      <h1 className="text-3xl font-bold text-[#1F7D53]">KANBANIZE</h1>

      {/* Desktop Navigation */}
      <ul className="hidden md:flex">
        {!user ? (
          <>
            <li className="p-4">
              <button onClick={handleHomeClick} className="hover:text-[#255F38] transition-all cursor-pointer">
                Home
              </button>
            </li>
            <li className="p-4">
              <button onClick={() => handleScroll("company")} className="hover:text-[#255F38] transition-all cursor-pointer">
                About
              </button>
            </li>
            <li className="p-4">
              <button onClick={() => handleScroll("contact")} className="hover:text-[#255F38] transition-all cursor-pointer">
                Contact
              </button>
            </li>
            <li className="p-4">
              <Link to="/login" className="bg-[#1F7D53] text-black px-4 py-2 rounded-md hover:bg-[#255F38] transition-all">
                Login
              </Link>
            </li>
            <li className="p-4">
              <Link
                to="/signup"
                className="border-2 border-[#1F7D53] text-[#1F7D53] px-4 py-2 rounded-md hover:bg-[#255F38] hover:text-black transition-all"
              >
                Sign Up
              </Link>
            </li>
          </>
        ) : isVerified ? (
          <ul className="flex items-center gap-4">
          <li>
            <Link to="/dashboard" className="border-2 border-[#00df9a] text-[#00df9a] px-4 py-2 rounded-md hover:bg-[#00df9a] hover:text-black transition-all">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/profile" className="border-2 border-[#00df9a] text-[#00df9a] px-4 py-2 rounded-md hover:bg-[#00df9a] hover:text-black transition-all">
              Profile
            </Link>
          </li>
          <li>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-all">
              Logout
            </button>
          </li>
        </ul>
        
        ) : (
          <li className="p-4 text-yellow-400 font-semibold">Verify Your Email</li>
        )}
      </ul>

      {/* Mobile Navigation */}
      <div onClick={handleNav} className="block md:hidden">
        {nav ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />}
      </div>

      <ul
        className={
          nav
            ? "fixed left-0 top-0 w-[60%] h-full border-r border-gray-900 bg-[#000300] ease-in-out duration-500"
            : "ease-in-out duration-500 fixed left-[-100%]"
        }
      >
        <h1 className="w-full text-3xl font-bold text-[#00df9a] m-4">KANBANIZE</h1>

        {!user ? (
          <>
            <li className="p-4 border-b border-gray-600">
              <button onClick={handleHomeClick} className="hover:text-[#00df9a] w-full text-left">
                Home
              </button>
            </li>
            <li className="p-4 border-b border-gray-600">
              <button onClick={() => handleScroll("company")} className="hover:text-[#00df9a] w-full text-left">
                About
              </button>
            </li>
            <li className="p-4 border-b border-gray-600">
              <button onClick={() => handleScroll("contact")} className="hover:text-[#00df9a] w-full text-left">
                Contact
              </button>
            </li>
            <li className="p-4 border-b border-gray-600">
              <Link to="/login" onClick={closeNav} className="hover:text-[#00df9a]">
                Login
              </Link>
            </li>
            <li className="p-4">
              <Link to="/signup" onClick={closeNav} className="hover:text-[#00df9a]">
                Sign Up
              </Link>
            </li>
          </>
        ) : isVerified ? (
          <>
            <li className="p-4 border-b border-gray-600">
              <Link to="/dashboard" onClick={closeNav} className="hover:text-[#00df9a]">
                Dashboard
              </Link>
            </li>
            <li className="p-4 border-b border-gray-600">
              <Link to="/profile" onClick={closeNav} className="hover:text-[#00df9a]">
                Profile
              </Link>
            </li>
            <li className="p-4">
              <button onClick={() => { handleLogout(); closeNav(); }} className="text-red-500 hover:text-red-700">
                Logout
              </button>
            </li>
          </>
        ) : (
          <li className="p-4 text-yellow-400 font-semibold">Verify Your Email</li>
        )}
      </ul>
    </div>
  );
};

export default Navbar;
