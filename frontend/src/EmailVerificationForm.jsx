import { useContext, useState } from "react";
import AuthContext from "./AuthContext";
import StatusMessage from "./StatusMessage";

export default function EmailVerificationForm() {
  const { email, confirmEmail, setAuthFlow } = useContext(AuthContext);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      setMessage("Please enter the verification code");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Verifying email...");
    setMessageType("info");

    try {
      await confirmEmail(email, code);
      setMessage("Email verified! You can now sign in.");
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
      <h2>Verify your email</h2>
      <p className="muted">
        We sent a verification code to <strong>{email}</strong>
      </p>

      <div className="form-group">
        <label htmlFor="verification-code">Verification code</label>
        <input
          id="verification-code"
          type="text"
          placeholder="000000"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={loading}
          maxLength="6"
        />
      </div>

      <button type="submit" className="primary-btn" disabled={loading || code.length < 6}>
        {loading ? "Verifying..." : "Verify email"}
      </button>

      <p className="auth-link">
        <button
          type="button"
          onClick={() => setAuthFlow("signup")}
          className="link-btn"
          disabled={loading}
        >
          Back to signup
        </button>
      </p>

      {message && <StatusMessage type={messageType} text={message} />}
    </form>
  );
}
