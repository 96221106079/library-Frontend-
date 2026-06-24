import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "librarian") {
        navigate("/librarian-dashboard");
      } else {
        navigate("/home");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ text: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = formData;
    if (!email || !password) {
      setMessage({ text: "Please fill in both email and password.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      const response = await authAPI.login({ email, password });

      if (response.data.success) {
        // Clear all previous data to prevent session conflicts
        localStorage.clear();

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        const user = response.data.user;
        const setupDone = localStorage.getItem("setupDone");

        if (user.role === "librarian") {
          navigate("/librarian-dashboard");
        } else {
          navigate("/home");
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Login failed. Please try again.";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      // Send the credential (ID token) to our backend
      const response = await authAPI.googleLogin({
        credential: credentialResponse.credential,
      });

      if (response.data.success) {
        localStorage.clear();
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        const user = response.data.user;
        const setupDone = localStorage.getItem("setupDone");

        if (user.role === "librarian") {
          navigate("/librarian-dashboard");
        } else {
          navigate("/home");
        }
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      setMessage({
        text: "Google authentication failed. Please try again or use email.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLogged(false);
    setUser(null);
  };

  if (isLogged) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <h1>Welcome, {user?.name || user?.username || "User"}!</h1>
            <p>Authentication Successful.</p>
          </div>
          <button onClick={handleLogout} className="auth-btn btn-secondary" style={{ marginTop: 20 }}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">📚</div>
          <h1>Smart Library Auth</h1>
          <p>Sign in to your account</p>
        </div>

        {message.text && (
          <div className={`auth-message ${message.type}`} id="login-message">
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              type="email"
              id="login-email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading} id="login-submit-btn">
            <span>
              {loading && <span className="spinner" />}
              {loading ? "Signing in..." : "Login"}
            </span>
          </button>
        </form>

        <div className="auth-separator">
          <span>OR</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setMessage({
                text: "Google login failed. Please try again.",
                type: "error",
              });
            }}
            theme="filled_blue"
            shape="pill"
            width={300}
          />
        </div>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register" id="register-link">Create New Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
