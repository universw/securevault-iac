import { useContext, useState } from "react";
import AuthContext from "./AuthContext";
import MFAVerificationForm from "./MFAVerificationForm";
import StatusMessage from "./StatusMessage";

export default function LoginForm() {
  const { login, setAuthFlow, setEmail } = useContext(AuthContext);
  const [email, setLocalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [mfaState, setMfaState] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please enter email and password");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Signing you in...");
    setMessageType("info");

    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        setEmail(email);
        setMfaState({
          cognitoUser: result.cognitoUser,
          challengeName: result.challengeName,
        });
      } else {
        setMessage("Login successful");
        setMessageType("success");
        setLoading(false);
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
    }
  };

  if (mfaState) {
    return (
      <MFAVerificationForm
        cognitoUser={mfaState.cognitoUser}
        challengeName={mfaState.challengeName}
        onSuccess={() => {
          setMessage("Login successful!");
          setMessageType("success");
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setLocalEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <button type="submit" className="primary-btn" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="auth-link">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => setAuthFlow("signup")}
          className="link-btn"
          disabled={loading}
        >
          Create one
        </button>
      </p>

      <p className="auth-link">
        <button
          type="button"
          onClick={() => setAuthFlow("forgot-password")}
          className="link-btn"
          disabled={loading}
        >
          Forgot your password?
        </button>
      </p>

      {message && <StatusMessage type={messageType} text={message} />}
    </form>
  );
}
