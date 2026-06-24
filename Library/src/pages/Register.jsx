// ============================================
// Register Page Component (Updated)
// ============================================
// Uses the centralized API service for registration.
// Validates all fields client-side before sending.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { GoogleLogin } from "@react-oauth/google";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    libraryName: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ text: "", type: "" });
  };

  const validateForm = () => {
    const { name, username, email, password, confirmPassword, role, libraryName } = formData;
    if (!name || !username || !email || !password || !confirmPassword) return "All fields are required.";
    if (role === "librarian" && !libraryName) return "Library name is required for librarians.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) return setMessage({ text: validationError, type: "error" });

    try {
      setLoading(true);
      const res = await authAPI.register(formData);
      if (res.data.success) {
        setMessage({ text: "Success! Redirecting to login...", type: "success" });
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (error) {
      setMessage({ text: error.response?.data?.message || "Registration failed.", type: "error" });
    } finally { setLoading(false); }
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

        if (user.role === "librarian") {
          navigate("/librarian-dashboard");
        } else {
          navigate("/home");
        }
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      setMessage({
        text: "Google registration failed. Please try again or use the form.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">📚</div>
          <h1>Create Account</h1>
          <p>Join the Smart Hybrid Library</p>
        </div>

        {message.text && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <div className="form-group" style={{ display: 'none' }}>
            <label>Select Role</label>
            <div className="role-selection-modern">
               <label className={`role-radio-card active`}>
                  <input type="radio" name="role" value="user" checked={true} onChange={handleChange} />
                  <div className="role-card-content">👤 User</div>
               </label>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Registering..." : "Create Account"}
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
                text: "Google Registration failed. Please try again.",
                type: "error",
              });
            }}
            useOneTap
            auto_select
            theme="filled_blue"
            shape="pill"
            width={300}
          />
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;