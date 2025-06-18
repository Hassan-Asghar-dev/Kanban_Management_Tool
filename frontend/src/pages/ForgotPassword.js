import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Import Firebase config
import { toast } from "react-toastify"; // For notifications

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("❌ Please enter your email.");
      return;
    }

    setLoading(true); // Set loading to true when the reset is being processed
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("✅ Password reset email sent!");
    } catch (err) {
      toast.error("❌ Error sending reset email: " + err.message);
    } finally {
      setLoading(false); // Set loading to false after the request is complete
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen py-20 bg-green1100">
      <div className="w-full sm:w-96 p-8 bg-gray-900 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#00df9a]">Forgot Password</h2>

        <form onSubmit={handleResetPassword} className="mt-6">
          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-400">Enter your email</label>
            <input
              type="email"
              className="w-full mt-2 p-3 bg-black border-2 border-[#00df9a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00df9a] focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#00df9a] text-black font-semibold rounded-lg hover:bg-[#00b882] transition duration-300"
            disabled={loading} // Disable the button while loading
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
