import { useContext, useState } from "react";
import AuthContext from "./AuthContext";
import StatusMessage from "./StatusMessage";

export default function MFAVerificationForm({ cognitoUser, challengeName, onSuccess }) {
  const { respondToMfa, setAuthFlow } = useContext(AuthContext);
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
    setMessage("Verifying code...");
    setMessageType("info");

    try {
      const result = await respondToMfa(cognitoUser, code, challengeName);
      setMessage("MFA verification successful!");
      setMessageType("success");
      onSuccess(result);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Enter verification code</h2>
      <p className="muted">
        Enter the code from your authenticator app or SMS.
      </p>

      <div className="form-group">
        <label htmlFor="mfa-code">Verification code</label>
        <input
          id="mfa-code"
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
        {loading ? "Verifying..." : "Verify"}
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
