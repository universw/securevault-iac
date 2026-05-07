import { useContext, useState } from "react";
import AuthContext from "./AuthContext";
import StatusMessage from "./StatusMessage";

export default function ForgotPasswordForm() {
  const { forgotPassword, setAuthFlow, setEmail } = useContext(AuthContext);
  const [email, setLocalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [step, setStep] = useState("request");

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Sending reset code...");
    setMessageType("info");

    try {
      await forgotPassword(email);
      setEmail(email);
      setStep("reset");
      setMessage("Check your email for the password reset code");
      setMessageType("success");
      setLoading(false);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
    }
  };

  if (step === "reset") {
    return <ResetPasswordForm email={email} onBack={() => setStep("request")} />;
  }

  return (
    <form onSubmit={handleRequest} className="auth-form">
      <h2>Reset your password</h2>
      <p className="muted">
        Enter your email and we'll send you a code to reset your password.
      </p>

      <div className="form-group">
        <label htmlFor="reset-email">Email</label>
        <input
          id="reset-email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setLocalEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? "Sending code..." : "Send reset code"}
      </button>

      <p className="auth-link">
        <button
          type="button"
          onClick={() => setAuthFlow("login")}
          className="link-btn"
          disabled={loading}
        >
          Back to sign in
        </button>
      </p>

      {message && <StatusMessage type={messageType} text={message} />}
    </form>
  );
}

function ResetPasswordForm({ email, onBack }) {
  const { confirmNewPassword, setAuthFlow } = useContext(AuthContext);
  const { validatePassword } = useContext(AuthContext);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) {
      setMessage("Please fill in all fields");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setMessage("Password must be 8+ characters with uppercase, lowercase, numbers, and symbols");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Resetting password...");
    setMessageType("info");

    try {
      await confirmNewPassword(email, code, newPassword);
      setMessage("Password reset successful! Redirecting to sign in...");
      setMessageType("success");
      setTimeout(() => {
        setAuthFlow("login");
      }, 2000);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Create new password</h2>
      <p className="muted">Enter the code from your email and your new password.</p>

      <div className="form-group">
        <label htmlFor="reset-code">Verification code</label>
        <input
          id="reset-code"
          type="text"
          placeholder="000000"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={loading}
          maxLength="6"
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirm-new-password">Confirm password</label>
        <input
          id="confirm-new-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? "Resetting..." : "Reset password"}
      </button>

      <p className="auth-link">
        <button
          type="button"
          onClick={onBack}
          className="link-btn"
          disabled={loading}
        >
          Back
        </button>
      </p>

      {message && <StatusMessage type={messageType} text={message} />}
    </form>
  );
}
