import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GetStarted = () => {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-1100 to-black text-white"
    style={{ backgroundImage: "url('/assets/hero-bg.png')"}}
    >
      <motion.h1 
        className="text-5xl font-extrabold mb-8 font-sans tracking-wide text-center bg-clip-text text-transparent bg-gradient-to-r from-[#09010D] to-[#5D8736]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Start Your Project With Us!
      </motion.h1>

      <motion.p 
        className="text-lg text-gray-300 mb-10 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Join now and experience seamless project management with our powerful Kanban tools.
      </motion.p>

      <div className="flex space-x-6">
        <Link to="/login">
          <motion.button
            className="px-8 py-3 text-lg font-semibold rounded-lg shadow-lg bg-[#5D8736] text-gray-900 hover:bg-[#123524] hover:scale-105 transition-transform duration-300 ease-in-out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Login
          </motion.button>
        </Link>

        <Link to="/signup">
          <motion.button
            className="px-8 py-3 text-lg font-semibold rounded-lg shadow-lg bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 transition-transform duration-300 ease-in-out"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign Up
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default GetStarted;
