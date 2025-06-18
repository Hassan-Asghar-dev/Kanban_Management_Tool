import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // ✅ New state to check auth status
  const navigate = useNavigate();

  // ✅ Check Firebase Auth state on load (show loading screen until checked)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await user.reload(); // Refresh user state
        if (user.emailVerified) {
          navigate("/dashboard"); // ✅ Redirect verified users
        } else {
          await signOut(auth);
          navigate("/verify-email");
        }
      }
      setCheckingAuth(false); // ✅ Firebase check is done
    });

    return () => unsubscribe();
  }, [navigate]);

  // ✅ Handle Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user) {
        toast.error("❌ Login failed. Please try again.");
        return;
      }

      await user.reload();

      if (!user.emailVerified) {
        toast.warn("⚠️ Please verify your email before logging in.");
        await signOut(auth);
        navigate("/verify-email");
        return;
      }

      toast.success("🎉 Login successful!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("❌ Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) {
        toast.error("❌ Google login failed. Please try again.");
        return;
      }

      await user.reload();

      if (!user.emailVerified) {
        await signOut(auth);
        toast.warn("⚠️ Please verify your email before logging in.");
        navigate("/verify-email");
        return;
      }

      toast.success(`✅ Welcome, ${user.displayName}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error("❌ Google login failed. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  //  Show loading screen while Firebase checks authentication state
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white text-2xl">
     
        <h2 className="text-2xl font-semibold"> authentication...</h2>
      </div>
    
    
    );
  }
  

  return (
    <div className="flex flex-col justify-center items-center min-h-screen py-20 "
    style={{ backgroundColor: "rgb(10, 8, 10)"}}
    >
      <div className="w-full sm:w-96 p-8 bg-gray-900 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-[#00df9a]">Login</h2>

        <form onSubmit={handleLogin} className="mt-6">
          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-400">Email</label>
            <input
              type="email"
              className="w-full mt-2 p-3 bg-black border-2 border-[#00df9a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00df9a] focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-6 relative">
            <label className="block text-lg font-medium text-gray-400">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full mt-2 p-3 pr-10 bg-black border-2 border-[#00df9a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00df9a] focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-11 text-gray-400"
            >
              {showPassword ? <AiFillEyeInvisible size={22} /> : <AiFillEye size={22} />}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className={`w-full py-3 font-semibold rounded-lg transition duration-300 ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#00df9a] hover:bg-[#00b882]"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className={`w-full mt-3 py-2 font-semibold rounded-lg transition duration-300 ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700 text-white"
          }`}
          disabled={loading}
        >
          {loading ? "Processing..." : "Login with Google"}
        </button>

        {/* Forgot Password */}
        <p className="mt-3 text-center text-sm text-gray-400">
          <Link to="/forgot-password" className="text-[#00df9a]">Forgot Password?</Link>
        </p>

        {/* Sign up link */}
        <p className="mt-4 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-[#00df9a]">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
