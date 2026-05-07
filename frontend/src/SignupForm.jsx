import { useContext, useState, useEffect } from "react";
import AuthContext from "./AuthContext";
import StatusMessage from "./StatusMessage";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";

export default function SignupForm() {
  const { signup, setAuthFlow, setEmail } = useContext(AuthContext);
  const { validatePassword } = useContext(AuthContext);
  const [email, setLocalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [passwordValidation, setPasswordValidation] = useState({
    valid: false,
    hasMin8: false,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSymbol: false,
  });

  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation({
        valid: false,
        hasMin8: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        hasSymbol: false,
      });
    }
  }, [password, validatePassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setMessage("Please fill in all fields");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Creating your account...");
    setMessageType("info");

    try {
      const result = await signup(email, password, confirmPassword);
      setEmail(email);
      setAuthFlow("verify-email");
      setMessage("Account created! Check your email for verification code");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setLocalEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {password && <PasswordStrengthIndicator validation={passwordValidation} />}
      </div>

      <div className="form-group">
        <label htmlFor="confirm-password">Confirm password</label>
        <input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="validation-error">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        className="primary-btn"
        disabled={loading || !passwordValidation.valid}
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="auth-link">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => setAuthFlow("login")}
          className="link-btn"
          disabled={loading}
        >
          Sign in instead
        </button>
      </p>

      {message && <StatusMessage type={messageType} text={message} />}
    </form>
  );
}
