import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // Icons for password visibility
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Password Validation Function
  const validatePassword = (password) => {
    const minLength = /.{8,}/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;
    const number = /[0-9]/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (!minLength.test(password)) return "Password must be at least 8 characters long.";
    if (!upperCase.test(password)) return "Password must contain at least one uppercase letter.";
    if (!lowerCase.test(password)) return "Password must contain at least one lowercase letter.";
    if (!number.test(password)) return "Password must contain at least one number.";
    if (!specialChar.test(password)) return "Password must contain at least one special character.";

    return ""; // ✅ No errors
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
  };

  // ✅ Handle Email/Password Signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (passwordError) {
      toast.error("❌ Password is not strong enough.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Send verification email
      await sendEmailVerification(user);
      toast.success("📩 Verification email sent! Please check your inbox.", { autoClose: 3000 });

      // ✅ Log out the user to prevent auto-login before verification
      await signOut(auth);

      // ✅ Redirect to "Check your email" page
      navigate("/verify-email");
    } catch (err) {
      let errorMessage = "❌ Signup failed. ";
      if (err.code === "auth/email-already-in-use") {
        errorMessage += "Email is already registered.";
      } else if (err.code === "auth/weak-password") {
        errorMessage += "Password should be at least 6 characters.";
      } else {
        errorMessage += err.message;
      }
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Google Signup
  const handleGoogleSignup = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      // ✅ If Google account is not verified, sign out and show warning
      if (!result.user.emailVerified) {
        toast.warn("⚠️ Please verify your email before logging in.", { autoClose: 3000 });
        await signOut(auth);
        navigate("/verify-email");
      } else {
        toast.success(`✅ Welcome, ${result.user.displayName}!`, { autoClose: 2000 });
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("❌ Google signup failed: " + err.message, { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen py-20 bg-black">
      <div className="w-full sm:w-96 p-6 bg-gray-900 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#00df9a]">Sign Up</h2>

        <form onSubmit={handleSubmit} className="mt-4">
          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-400">Email</label>
            <input
              type="email"
              autoComplete="off"
              className="w-full mt-2 p-2 bg-black border-2 border-[#00df9a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00df9a] focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input with Eye Icon & Validation */}
          <div className="mb-4 relative">
            <label className="block text-lg font-medium text-gray-400">Create Password</label>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="w-full mt-2 p-2 bg-black border-2 border-[#00df9a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00df9a] focus:border-transparent pr-10"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
            />
            {/* Eye Button */}
            <button
              type="button"
              className="absolute top-10 right-3 text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
            </button>
            {/* Show password validation error */}
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-2 font-semibold rounded-lg transition duration-300 ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#00df9a] hover:bg-[#00b882]"
            }`}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        {/* Google Sign-Up Button */}
        <button
          onClick={handleGoogleSignup}
          className={`w-full mt-3 py-2 font-semibold rounded-lg transition duration-300 ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700 text-white"
          }`}
          disabled={loading}
        >
          {loading ? "Processing..." : "Sign Up with Google"}
        </button>

        {/* Login link */}
        <p className="mt-3 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-[#00df9a]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
