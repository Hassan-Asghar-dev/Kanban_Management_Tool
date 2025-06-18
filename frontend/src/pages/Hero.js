import React from "react";
import { ReactTyped } from "react-typed";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowRight } from "react-icons/hi";
import { motion } from "framer-motion";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div
      className="text-white w-full min-h-screen flex justify-center items-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/hero-bg.jpeg')" }} // Set background image
    >
      {/* Optional Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="w-full max-w-[800px] mx-auto text-center flex flex-col justify-center items-center relative">
        <motion.p
          className="md:text-3xl sm:text-2xl text-[#169976] font-bold p-2 mt-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          KANBANIZE
        </motion.p>

        <motion.h1
          className="md:text-2xl sm:text-1xl text-4xl font-bold md:py-6 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          A Tool That Helps You Execute Your Project
        </motion.h1>

        <motion.div
          className="flex flex-col items-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <p className="md:text-2xl sm:text-1xl text-xl font-bold py-4">
            Track Your Project at Every Stage
          </p>

          <ReactTyped
            className="md:text-5xl sm:text-4xl text-xl font-bold md:pl-4 pl-2 text-[#169976]"
            strings={["BACKLOG", "PLANNED", "IN PROGRESS", "REVIEW", "DONE"]}
            typeSpeed={120}
            backSpeed={140}
            loop
          />
        </motion.div>

        <div className="mt-8">
        <button
        className="text-white px-6 py-3 rounded-md flex items-center justify-center gap-2 transition duration-300"
        style={{
        backgroundColor: "rgb(5, 101, 16)", // Normal state (Green)
        transition: "background-color 0.3s ease",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "rgb(4, 50, 13)")} // Hover state (Darker Green)
        onMouseLeave={(e) => (e.target.style.backgroundColor = "rgb(5, 101, 16)")} // Back to Normal
        onClick={() => navigate("/get-started")}
      >
       Get Started <HiOutlineArrowRight size={20} />
      </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;