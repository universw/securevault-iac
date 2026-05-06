import { useEffect, useRef, useState } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

function App() {
  const fileInputRef = useRef(null);

  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("");
  const [idToken, setIdToken] = useState(localStorage.getItem("idToken") || "");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = Boolean(idToken);

  useEffect(() => {
    if (isLoggedIn) {
      fetchFiles(idToken);
    }
  }, [idToken]);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const authHeaders = (token = idToken) => ({
    Authorization: `Bearer ${token}`,
  });

  const handleLogin = () => {
    if (!email || !password) {
      showMessage("Please enter email and password.", "error");
      return;
    }

    setLoading(true);
    showMessage("Signing you in...", "info");

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const token = result.getIdToken().getJwtToken();
        localStorage.setItem("idToken", token);
        setIdToken(token);
        setPassword("");
        showMessage("Login successful.", "success");
        setLoading(false);
      },
      onFailure: (err) => {
        console.error(err);
        showMessage(err.message || "Login failed.", "error");
        setLoading(false);
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("idToken");
    setIdToken("");
    setFiles([]);
    setSelectedFile(null);
    showMessage("Logged out.", "info");
  };

  const fetchFiles = async (token = idToken) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/files`, {
        headers: authHeaders(token),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load files.");
      }

      setFiles(data.files || []);
      setLoading(false);
    } catch (error) {
      console.error(error);
      showMessage(error.message, "error");
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      if (!selectedFile) {
        showMessage("Please choose a file first.", "error");
        return;
      }

      setLoading(true);
      showMessage("Preparing secure upload...", "info");

      const uploadUrlResponse = await fetch(`${API_BASE_URL}/upload-url`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name.trim(),
          contentType: selectedFile.type || "application/octet-stream",
        }),
      });

      const uploadUrlData = await uploadUrlResponse.json();

      if (!uploadUrlResponse.ok) {
        throw new Error(uploadUrlData.error || "Failed to create upload URL.");
      }

      showMessage("Uploading to encrypted cloud storage...", "info");

      const s3UploadResponse = await fetch(uploadUrlData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!s3UploadResponse.ok) {
        throw new Error("Failed to upload file to S3.");
      }

      showMessage("Finalizing upload...", "info");

      const confirmResponse = await fetch(
        `${API_BASE_URL}/files/${uploadUrlData.fileId}/confirm`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || "Failed to confirm upload.");
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchFiles();
      showMessage("File uploaded successfully.", "success");
    } catch (error) {
      console.error(error);
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      setLoading(true);
      showMessage("Creating secure download link...", "info");

      const response = await fetch(`${API_BASE_URL}/download-url/${fileId}`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create download URL.");
      }

      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
      showMessage("Download link opened.", "success");
    } catch (error) {
      console.error(error);
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId, fileName) => {
    const confirmed = window.confirm(`Delete "${fileName || fileId}"?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      showMessage("Deleting file...", "info");

      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file.");
      }

      await fetchFiles();
      showMessage("File deleted.", "success");
    } catch (error) {
      console.error(error);
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="auth-page">
        <section className="auth-hero">
          <div className="brand-pill">🔐 SecureVault</div>
          <h1>Private cloud storage for your important files.</h1>
          <p>
            Upload, manage, and download files securely using AWS Cognito, S3,
            DynamoDB, ECS, API Gateway, and Terraform.
          </p>

          <div className="hero-grid">
            <div>✅ JWT protected API</div>
            <div>✅ Private S3 storage</div>
            <div>✅ User-isolated files</div>
            <div>✅ Cloud-native backend</div>
          </div>
        </section>

        <section className="auth-card">
          <h2>Sign in</h2>
          <p className="muted">Access your SecureVault dashboard.</p>

          <label>Email</label>
          <input
            type="email"
            placeholder="testuser@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <button className="primary-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {message && <StatusMessage type={messageType} text={message} />}
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="topbar">
        <div>
          <div className="brand">🔐 SecureVault</div>
          <p>Secure file dashboard</p>
        </div>

        <button className="ghost-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <section className="dashboard-layout">
        <div className="upload-panel">
          <div className="panel-header">
            <div>
              <h2>Upload a file</h2>
              <p>Files are uploaded directly to private S3 storage.</p>
            </div>
          </div>

          <div className="upload-box">
            <div className="upload-icon">📄</div>
            <div>
              <strong>{selectedFile ? selectedFile.name : "Choose a file"}</strong>
              <p>
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} • ${
                      selectedFile.type || "Unknown type"
                    }`
                  : "PDF, text, images, documents, and more"}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <button className="primary-btn" onClick={handleUpload} disabled={loading}>
            {loading ? "Working..." : "Upload securely"}
          </button>

          {message && <StatusMessage type={messageType} text={message} />}
        </div>

        <div className="files-panel">
          <div className="panel-header">
            <div>
              <h2>My files</h2>
              <p>{files.length} file{files.length === 1 ? "" : "s"} stored</p>
            </div>

            <button className="ghost-btn" onClick={() => fetchFiles()} disabled={loading}>
              Refresh
            </button>
          </div>

          {files.length === 0 ? (
            <div className="empty-state">
              <div>🗂️</div>
              <h3>No files yet</h3>
              <p>Upload your first file to start using SecureVault.</p>
            </div>
          ) : (
            <div className="file-list">
              {files.map((file) => (
                <article className="file-card" key={file.fileId}>
                  <div className="file-info">
                    <div className="file-avatar">{getFileIcon(file.fileName)}</div>

                    <div>
                      <h3>{file.fileName || file.fileId}</h3>
                      <div className="file-meta">
                        <span className={`badge ${file.status === "uploaded" ? "ok" : "warn"}`}>
                          {file.status || "unknown"}
                        </span>
                        {file.uploadedAt && <span>{formatDate(file.uploadedAt)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="file-actions">
                    <button
                      className="secondary-btn"
                      onClick={() => handleDownload(file.fileId)}
                      disabled={loading || file.status !== "uploaded"}
                    >
                      Download
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => handleDelete(file.fileId, file.fileName)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusMessage({ type, text }) {
  return <div className={`status-message ${type}`}>{text}</div>;
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${sizes[index]}`;
}

function getFileIcon(fileName = "") {
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "IMG";
  if (name.endsWith(".txt")) return "TXT";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "DOC";
  return "FILE";
}

export default App;