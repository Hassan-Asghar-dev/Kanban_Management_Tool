import React, { useState } from "react";
import { FaKey, FaEye, FaEyeSlash, FaEnvelope } from "react-icons/fa";
import { auth } from "../firebaseConfig";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";

const Settings = () => {
  const user = auth.currentUser;
  const userEmail = user?.email || "No Email Found";

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // Forgot Password State
  const [forgotMessage, setForgotMessage] = useState("");

  // Change Password Handler
  const handleChangePassword = async () => {
    if (!user) {
      setPasswordMessage("No user is signed in.");
      return;
    }

    setPasswordMessage("");

    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordMessage("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      setPasswordMessage(error.message);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async () => {
    if (!user) {
      setForgotMessage("No user is signed in.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      setForgotMessage("Password reset link sent to your email.");
    } catch (error) {
      setForgotMessage(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#121212] p-4">
      <div className="w-full max-w-2xl bg-[#1e1e2e] text-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">Settings</h2>

        <div className="space-y-6">
          {/* Change Password Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#00df9a]">Change Password</h3>

            {/* Old Password */}
            <div className="relative mt-2">
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current Password"
                className="w-full p-3 pr-10 rounded bg-gray-800 text-white"
              />
              <button
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showOldPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* New Password */}
            <div className="relative mt-2">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full p-3 pr-10 rounded bg-gray-800 text-white"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {passwordMessage && <p className="mt-2 text-sm text-red-500">{passwordMessage}</p>}

            <button
              onClick={handleChangePassword}
              className="mt-4 w-full flex justify-center items-center gap-2 bg-green-500 hover:bg-green-900 text-white px-4 py-2 rounded"
            >
              <FaKey /> Update Password
            </button>
          </div>

          {/* Forgot Password Section */}
          <div>
            <h3 className="text-lg font-semibold text-[#00df9a]">Forgot Password?</h3>
            <p className="text-sm text-gray-400">Reset your password via email.</p>

            <div className="relative mt-2">
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full p-3 rounded bg-gray-700 text-gray-400 cursor-not-allowed"
              />
              <FaEnvelope className="absolute right-3 top-3 text-gray-400" />
            </div>

            {forgotMessage && <p className="mt-2 text-sm text-red-500">{forgotMessage}</p>}

            <button
              onClick={handleForgotPassword}
              className="mt-4 w-full flex justify-center items-center gap-2 bg-blue-500 hover:bg-blue-900 text-white px-4 py-2 rounded"
            >
              <FaKey /> Send Reset Link
            </button>
          </div>

          {/* More Settings (Placeholder for Future Features) */}
          <div className="text-center text-gray-500 mt-6">
            <p>More settings will be added here...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;