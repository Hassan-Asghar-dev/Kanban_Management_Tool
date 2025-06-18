import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Briefcase, BarChart, Users, CheckCircle } from "lucide-react";

const Company = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <div
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center px-6  text-gray-800 py-16"
    >
      {/* Heading Section */}
      <motion.h1
        className="text-4xl md:text-5xl font-bold text-emerald-600 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        About Our Company
      </motion.h1>

      {/* Description Paragraph */}
      <motion.p
        className="text-lg text-gray-600 max-w-3xl text-center mb-12 leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Welcome to Kanbanize! We provide cutting-edge project management solutions to help teams stay organized, 
        track progress, and improve productivity using Kanban boards. Our platform offers intuitive workflows, 
        real-time collaboration, and advanced analytics to streamline project execution. Whether you're managing 
        software development, marketing campaigns, or business operations, Kanbanize empowers teams to work smarter, 
        prioritize tasks efficiently, and achieve their goals with greater transparency and agility.
      </motion.p>

      {/* Feature Icons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {[ 
          { 
            Icon: Briefcase, 
            text: "Empowering businesses with efficient workflows.", 
            color: "text-amber-500" 
          },
          { 
            Icon: BarChart, 
            text: "Data-driven insights for better decision-making.", 
            color: "text-blue-500" 
          },
          { 
            Icon: Users, 
            text: "Seamless team collaboration and communication.", 
            color: "text-violet-500" 
          },
          { 
            Icon: CheckCircle, 
            text: "Reliable and scalable Kanban solutions.", 
            color: "text-emerald-500" 
          }
        ].map((item, index) => (
          <motion.div
            key={index}
            className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.7 + index * 0.3, duration: 0.8, ease: "easeOut" }}
          >
            <item.Icon className={`w-6 h-6 mt-1 flex-shrink-0 ${item.color}`} />
            <span className="text-gray-700">{item.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Company;