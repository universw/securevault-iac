import { useEffect, useState } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

function App() {
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("");
  const [idToken, setIdToken] = useState(localStorage.getItem("idToken") || "");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const isLoggedIn = Boolean(idToken);

  useEffect(() => {
    if (isLoggedIn) {
      fetchFiles(idToken);
    }
  }, [idToken]);

  const authHeaders = (token = idToken) => ({
    Authorization: `Bearer ${token}`,
  });

  const handleLogin = () => {
    setMessage("Logging in...");

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
        setMessage("Login successful!");
      },

      onFailure: (err) => {
        console.error(err);
        setMessage(err.message || "Login failed");
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("idToken");
    setIdToken("");
    setFiles([]);
    setSelectedFile(null);
    setMessage("Logged out");
  };

  const fetchFiles = async (token = idToken) => {
    try {
      setMessage("Loading files...");

      const response = await fetch(`${API_BASE_URL}/files`, {
        headers: authHeaders(token),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load files");
      }

      setFiles(data.files || []);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  const handleUpload = async () => {
    try {
      if (!selectedFile) {
        setMessage("Please choose a file first");
        return;
      }

      setMessage("Creating upload URL...");

      const uploadUrlResponse = await fetch(`${API_BASE_URL}/upload-url`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type || "application/octet-stream",
        }),
      });

      const uploadUrlData = await uploadUrlResponse.json();

      if (!uploadUrlResponse.ok) {
        throw new Error(uploadUrlData.error || "Failed to create upload URL");
      }

      setMessage("Uploading file to S3...");

      const s3UploadResponse = await fetch(uploadUrlData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!s3UploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      setMessage("Confirming upload...");

      const confirmResponse = await fetch(
        `${API_BASE_URL}/files/${uploadUrlData.fileId}/confirm`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      const confirmData = await confirmResponse.json();

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || "Failed to confirm upload");
      }

      setSelectedFile(null);
      setMessage("Upload successful!");
      await fetchFiles();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      setMessage("Creating download URL...");

      const response = await fetch(`${API_BASE_URL}/download-url/${fileId}`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create download URL");
      }

      window.open(data.downloadUrl, "_blank");
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      setMessage("Deleting file...");

      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file");
      }

      setMessage("File deleted");
      await fetchFiles();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <Page>
        <Card width="420px">
          <h1 style={styles.title}>SecureVault</h1>
          <p style={styles.subtitle}>Secure cloud file storage</p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button onClick={handleLogin} style={styles.primaryButton}>
            Login
          </button>

          {message && <p style={styles.message}>{message}</p>}
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <div style={styles.dashboard}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>SecureVault</h1>
            <p style={styles.subtitle}>Authenticated file dashboard</p>
          </div>

          <button onClick={handleLogout} style={styles.secondaryButton}>
            Logout
          </button>
        </div>

        <Card width="100%">
          <h2 style={styles.sectionTitle}>Upload file</h2>

          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={styles.fileInput}
          />

          <button onClick={handleUpload} style={styles.primaryButton}>
            Upload
          </button>

          {message && <p style={styles.message}>{message}</p>}
        </Card>

        <Card width="100%">
          <div style={styles.filesHeader}>
            <h2 style={styles.sectionTitle}>My files</h2>

            <button onClick={() => fetchFiles()} style={styles.secondaryButton}>
              Refresh
            </button>
          </div>

          {files.length === 0 ? (
            <p style={styles.subtitle}>No files uploaded yet.</p>
          ) : (
            <div style={styles.fileList}>
              {files.map((file) => (
                <div key={file.fileId} style={styles.fileRow}>
                  <div>
                    <strong>{file.fileName || file.fileId}</strong>
                    <p style={styles.fileMeta}>
                      Status: {file.status || "unknown"}
                    </p>
                  </div>

                  <div style={styles.fileActions}>
                    <button
                      onClick={() => handleDownload(file.fileId)}
                      style={styles.smallButton}
                    >
                      Download
                    </button>

                    <button
                      onClick={() => handleDelete(file.fileId)}
                      style={styles.dangerButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}

function Page({ children }) {
  return <div style={styles.page}>{children}</div>;
}

function Card({ children, width }) {
  return <div style={{ ...styles.card, width }}>{children}</div>;
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    fontFamily: "Arial",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px",
  },
  dashboard: {
    width: "100%",
    maxWidth: "900px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  card: {
    padding: "32px",
    borderRadius: "16px",
    background: "#1e293b",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "40px",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "#94a3b8",
  },
  sectionTitle: {
    margin: "0 0 16px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "none",
    boxSizing: "border-box",
    fontSize: "16px",
  },
  fileInput: {
    display: "block",
    marginBottom: "16px",
  },
  primaryButton: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
  smallButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
  },
  message: {
    marginTop: "16px",
    color: "#94a3b8",
  },
  filesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  fileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderRadius: "12px",
    background: "#0f172a",
  },
  fileMeta: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "14px",
  },
  fileActions: {
    display: "flex",
    gap: "8px",
  },
};

export default App;