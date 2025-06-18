import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";

const Footer = () => {
  const [user] = useAuthState(auth);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user has reached the bottom of the page
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
        setShowFooter(true);
      } else {
        setShowFooter(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (user || !showFooter) return null; // Hide footer if user is logged in or not at bottom

  return (
    <footer className="bg-black text-white text-center py-4 w-full">
      <p className="text-sm">&copy; {new Date().getFullYear()} KANBANIZ. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
