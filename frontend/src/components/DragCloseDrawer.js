import React, { useState } from "react";
import { motion } from "framer-motion";
import { Flag, Calendar, UserPlus, Edit, CheckCircle } from "lucide-react";

export const DragCloseDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md"
        onClick={() => setIsOpen(true)}
      >
        WANT HELP ??
      </button>

      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 100 }}
          className="fixed bottom-0 left-0 w-full bg-gray-800 p-6 shadow-xl text-white flex flex-col items-center"
        >
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">📌 INSTRUCTIONS!!</h1>

            <div className="space-y-3 text-base text-left">
              <div className="flex items-center gap-2">
                <Flag className="text-green-400" />
                <p>
                  Set a priority level —{" "}
                  <span className="text-green-400 font-semibold">Low</span>,{" "}
                  <span className="text-yellow-400 font-semibold">Medium</span>, or{" "}
                  <span className="text-red-500 font-semibold">High</span>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="text-yellow-400" />
                <p>
                  Set a <span className="font-semibold text-yellow-300">deadline</span> for each task.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <UserPlus className="text-blue-400" />
                <p>
                  Assign tasks to yourself or share them via an{" "}
                  <span className="font-semibold text-blue-300">invitation link</span>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Edit className="text-purple-400" />
                <p>
                  Edit task descriptions anytime and update their{" "}
                  <span className="font-semibold text-purple-300">every detail</span>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-300" />
                <p>
                  Enter the <span className="font-semibold text-green-200">progress</span> of a task anytime, and you can also{" "}
                  <span className="text-green-400 font-semibold">mark</span> or{" "}
                  <span className="text-red-400 font-semibold">unmark</span> it as{" "}
                  <span className="font-semibold text-green-300">100%</span> completed.
                </p>
              </div>
            </div>

            <button
              className="mt-4 bg-red-500 hover:bg-red-600 py-2 px-4 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
};
