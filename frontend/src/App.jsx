import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthProvider } from "./AuthContext";
import AuthContext from "./AuthContext";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import EmailVerificationForm from "./EmailVerificationForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api" : ""))
  .replace(/\/$/, "");
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const missingConfig = [
  !API_BASE_URL && "VITE_API_BASE_URL",
  !import.meta.env.VITE_COGNITO_USER_POOL_ID && "VITE_COGNITO_USER_POOL_ID",
  !import.meta.env.VITE_COGNITO_CLIENT_ID && "VITE_COGNITO_CLIENT_ID",
].filter(Boolean);

function AppContent() {
  const { isLoggedIn, idToken, authFlow, logout } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedVaultFile, setSelectedVaultFile] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [preview, setPreview] = useState(null);
  const uploadedCount = files.filter((file) => file.status === "uploaded").length;
  const pendingCount = files.length - uploadedCount;
  const latestFile = getLatestFile(files);
  const totalStoredBytes = files.reduce(
    (total, file) => total + Number(file.fileSize || file.size || 0),
    0
  );

  const visibleFiles = useMemo(() => {
    return files
      .filter((file) => {
        const query = searchTerm.trim().toLowerCase();
        const name = (file.fileName || file.fileId || "").toLowerCase();
        const matchesSearch = !query || name.includes(query);
        const matchesStatus = statusFilter === "all" || file.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return (a.fileName || "").localeCompare(b.fileName || "");
        }

        if (sortBy === "oldest") {
          return getTime(a.uploadedAt || a.createdAt) - getTime(b.uploadedAt || b.createdAt);
        }

        return getTime(b.uploadedAt || b.createdAt) - getTime(a.uploadedAt || a.createdAt);
      });
  }, [files, searchTerm, sortBy, statusFilter]);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const ensureConfigured = () => {
    if (missingConfig.length > 0) {
      throw new Error(`Missing frontend configuration: ${missingConfig.join(", ")}`);
    }
  };

  const authHeaders = useCallback(
    (token = idToken) => ({
      Authorization: `Bearer ${token}`,
    }),
    [idToken]
  );

  const fetchFiles = useCallback(
    async (token = idToken) => {
      try {
        ensureConfigured();
        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/files`, {
          headers: authHeaders(token),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load files.");
        }

        setFiles(data.files || []);
      } catch (error) {
        console.error(error);
        showMessage(error.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, idToken]
  );

  useEffect(() => {
    if (isLoggedIn) {
      Promise.resolve().then(() => fetchFiles(idToken));
    }
  }, [fetchFiles, idToken, isLoggedIn]);

  useEffect(() => {
    if (!pendingDelete && !preview) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPendingDelete(null);
        setPreview(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDelete, preview]);

  useEffect(() => {
    if (!selectedVaultFile) return;
    const freshFile = files.find((file) => file.fileId === selectedVaultFile.fileId);
    setSelectedVaultFile(freshFile || null);
  }, [files, selectedVaultFile]);

  const handleLogout = () => {
    logout();
    setFiles([]);
    setSelectedFile(null);
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedVaultFile(null);
    setPendingDelete(null);
    setPreview(null);
    showMessage("Logged out.", "info");
  };

  const handleFileSelection = (file) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showMessage(`Choose a file smaller than ${formatBytes(MAX_FILE_SIZE_BYTES)}.`, "error");
      return;
    }

    setSelectedFile(file);
    showMessage(`${file.name} is ready to upload.`, "info");
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    handleFileSelection(event.dataTransfer.files?.[0]);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createAccessUrl = async (fileId) => {
    ensureConfigured();

    const response = await fetch(`${API_BASE_URL}/download-url/${fileId}`, {
      headers: authHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create secure access URL.");
    }

    return data;
  };

  const handleUpload = async () => {
    try {
      ensureConfigured();

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
          fileSize: selectedFile.size,
        }),
      });

      const uploadUrlData = await uploadUrlResponse.json();

      if (!uploadUrlResponse.ok) {
        throw new Error(uploadUrlData.error || "Failed to create upload URL.");
      }

      showMessage("Uploading to private S3 storage...", "info");

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

      clearSelectedFile();
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

      const data = await createAccessUrl(fileId);

      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
      showMessage("Download link opened.", "success");
    } catch (error) {
      console.error(error);
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (file) => {
    try {
      setPreview({
        file,
        url: "",
        kind: getPreviewKind(file),
        text: "",
        loading: true,
        error: "",
      });
      showMessage("Creating secure preview link...", "info");

      const data = await createAccessUrl(file.fileId);
      const kind = getPreviewKind(file);

      if (kind === "text") {
        const textResponse = await fetch(data.downloadUrl);
        if (!textResponse.ok) {
          throw new Error("Could not load text preview.");
        }

        const text = await textResponse.text();
        setPreview({
          file,
          url: data.downloadUrl,
          kind,
          text: text.slice(0, 20000),
          loading: false,
          error: text.length > 20000 ? "Preview is truncated to the first 20,000 characters." : "",
        });
      } else {
        setPreview({
          file,
          url: data.downloadUrl,
          kind,
          text: "",
          loading: false,
          error: "",
        });
      }

      showMessage("Preview link ready.", "success");
    } catch (error) {
      console.error(error);
      setPreview((current) =>
        current
          ? {
              ...current,
              loading: false,
              error: error.message,
            }
          : null
      );
      showMessage(error.message, "error");
    }
  };

  const copyFileId = async (fileId) => {
    try {
      await navigator.clipboard.writeText(fileId);
      showMessage("File ID copied.", "success");
    } catch (error) {
      console.error(error);
      showMessage("Could not copy file ID.", "error");
    }
  };

  const handleDelete = async (file) => {
    try {
      ensureConfigured();
      setLoading(true);
      showMessage("Deleting file...", "info");

      const response = await fetch(`${API_BASE_URL}/files/${file.fileId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file.");
      }

      await fetchFiles();
      showMessage("File deleted.", "success");
      setPendingDelete(null);
      setSelectedVaultFile((current) => (current?.fileId === file.fileId ? null : current));
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
          <div className="brand-lockup">
            <span className="brand-glyph">SV</span>
            <span>SecureVault</span>
          </div>
          <h1>Private cloud storage for files that matter.</h1>
          <p>
            A secure file vault backed by Cognito authentication, short-lived S3
            links, user-isolated metadata, and infrastructure managed with Terraform.
          </p>

          <div className="security-flow" aria-label="Secure upload flow">
            <FlowStep eyebrow="Auth" title="Cognito session" text="Every file action requires a verified JWT." />
            <FlowStep eyebrow="Upload" title="Presigned S3 link" text="Files move directly into private object storage." />
            <FlowStep eyebrow="Track" title="DynamoDB metadata" text="Records stay partitioned per authenticated user." />
          </div>
        </section>

        <section className="auth-card" aria-label="Sign in">
          <div className="auth-card-header">
            <span className="status-dot" aria-hidden="true" />
            <span>Secure session</span>
          </div>

          {authFlow === "login" && <LoginForm />}
          {authFlow === "signup" && <SignupForm />}
          {authFlow === "verify-email" && <EmailVerificationForm />}
          {authFlow === "forgot-password" && <ForgotPasswordForm />}

          {missingConfig.length > 0 && (
            <p className="config-note">Configure the frontend environment before signing in.</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="topbar">
        <div className="topbar-brand">
          <span className="brand-glyph">SV</span>
          <div>
            <div className="brand">SecureVault</div>
            <p>Protected file operations dashboard</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="ghost-btn" onClick={() => fetchFiles()} disabled={loading}>
            Refresh
          </button>
          <button className="ghost-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <section className="summary-grid" aria-label="Vault summary">
        <MetricCard label="Total files" value={files.length} detail="Tracked records" />
        <MetricCard label="Uploaded" value={uploadedCount} detail="Ready to download" tone="success" />
        <MetricCard label="Pending" value={pendingCount} detail="Awaiting confirmation" tone="warning" />
        <MetricCard label="Known size" value={formatBytes(totalStoredBytes)} detail="When metadata includes size" />
      </section>

      <section className={`dashboard-layout ${selectedVaultFile ? "with-details" : ""}`}>
        <aside className="upload-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Direct upload</span>
              <h2>Upload file</h2>
              <p>Choose or drop a file to request a short-lived private S3 link.</p>
            </div>
          </div>

          <div
            className={`upload-box ${dragActive ? "active" : ""}`}
            onDragEnter={handleDragEnter}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">{selectedFile ? getFileIcon(selectedFile.name) : "ADD"}</div>
            <div>
              <strong>{selectedFile ? selectedFile.name : "Drop a file here"}</strong>
              <p>
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} / ${
                      selectedFile.type || "Unknown type"
                    }`
                  : `Up to ${formatBytes(MAX_FILE_SIZE_BYTES)} per file`}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              aria-label="Choose a file to upload"
              onChange={(e) => handleFileSelection(e.target.files?.[0])}
            />
          </div>

          <div className="upload-actions">
            <button className="primary-btn" onClick={handleUpload} disabled={loading || !selectedFile}>
              {loading ? "Working" : "Upload securely"}
            </button>
            {selectedFile && (
              <button className="ghost-btn" onClick={clearSelectedFile} disabled={loading}>
                Clear
              </button>
            )}
          </div>

          <div className="upload-checklist" aria-label="Upload safeguards">
            <span>JWT required</span>
            <span>Private bucket</span>
            <span>5 minute links</span>
          </div>

          {message && <StatusMessage type={messageType} text={message} />}
        </aside>

        <section className="files-panel">
          <div className="panel-header files-header">
            <div>
              <span className="panel-kicker">Vault contents</span>
              <h2>Files</h2>
              <p>
                {visibleFiles.length} shown from {files.length} stored
              </p>
            </div>

            {latestFile && (
              <div className="latest-chip">
                <span>Latest</span>
                <strong>{latestFile.fileName || latestFile.fileId}</strong>
              </div>
            )}
          </div>

          <div className="file-toolbar">
            <label className="search-field">
              <span>Search</span>
              <input
                type="search"
                placeholder="Find by filename"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="uploaded">Uploaded</option>
                <option value="pending">Pending</option>
              </select>
            </label>

            <label>
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {loading && files.length === 0 ? (
            <div className="skeleton-list" aria-label="Loading files">
              <div />
              <div />
              <div />
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              label="EMPTY"
              title="No files yet"
              text="Upload your first file to start using SecureVault."
            />
          ) : visibleFiles.length === 0 ? (
            <EmptyState
              label="NONE"
              title="No matching files"
              text="Adjust your search or filter to see more results."
            />
          ) : (
            <div className="file-list">
              {visibleFiles.map((file) => (
                <article
                  className={`file-row ${selectedVaultFile?.fileId === file.fileId ? "selected" : ""}`}
                  key={file.fileId}
                >
                  <button
                    className="file-main file-open-btn"
                    type="button"
                    onClick={() => setSelectedVaultFile(file)}
                    aria-label={`View details for ${file.fileName || file.fileId}`}
                  >
                    <div className="file-avatar">{getFileIcon(file.fileName)}</div>
                    <div>
                      <h3>{file.fileName || file.fileId}</h3>
                      <div className="file-meta">
                        <span className={`badge ${file.status === "uploaded" ? "ok" : "warn"}`}>
                          {file.status || "unknown"}
                        </span>
                        <span>{formatDate(file.uploadedAt || file.createdAt)}</span>
                        {file.fileSize && <span>{formatBytes(file.fileSize)}</span>}
                        {file.contentType && <span>{file.contentType}</span>}
                      </div>
                    </div>
                  </button>

                  <div className="file-actions">
                    <button
                      className="ghost-btn"
                      onClick={() => {
                        setSelectedVaultFile(file);
                        handlePreview(file);
                      }}
                      disabled={loading || file.status !== "uploaded"}
                    >
                      Preview
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => handleDownload(file.fileId)}
                      disabled={loading || file.status !== "uploaded"}
                    >
                      Download
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => setPendingDelete(file)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {selectedVaultFile && (
          <FileDetails
            file={selectedVaultFile}
            loading={loading}
            onClose={() => setSelectedVaultFile(null)}
            onCopyFileId={copyFileId}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={(file) => setPendingDelete(file)}
          />
        )}
      </section>

      {pendingDelete && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingDelete(null)}>
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="danger-kicker">Delete file</span>
            <h2 id="delete-title">{pendingDelete.fileName || pendingDelete.fileId}</h2>
            <p>This removes the file object and its metadata from your vault.</p>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setPendingDelete(null)} disabled={loading}>
                Cancel
              </button>
              <button className="danger-btn" onClick={() => handleDelete(pendingDelete)} disabled={loading}>
                {loading ? "Deleting" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}

      {preview && (
        <PreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
          onDownload={() => handleDownload(preview.file.fileId)}
        />
      )}
    </main>
  );
}

function FileDetails({
  file,
  loading,
  onClose,
  onCopyFileId,
  onPreview,
  onDownload,
  onDelete,
}) {
  const kind = getPreviewKind(file);

  return (
    <aside className="details-panel" aria-label="File details">
      <div className="details-header">
        <div className="file-avatar large">{getFileIcon(file.fileName)}</div>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Close file details">
          x
        </button>
      </div>

      <h2>{file.fileName || file.fileId}</h2>
      <div className="file-meta details-meta">
        <span className={`badge ${file.status === "uploaded" ? "ok" : "warn"}`}>
          {file.status || "unknown"}
        </span>
        <span>{kind === "unsupported" ? "Download only" : "Preview ready"}</span>
      </div>

      <dl className="details-list">
        <div>
          <dt>File ID</dt>
          <dd>{file.fileId}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{file.contentType || inferTypeLabel(file.fileName)}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{file.fileSize ? formatBytes(file.fileSize) : "Unknown size"}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(file.createdAt)}</dd>
        </div>
        <div>
          <dt>Uploaded</dt>
          <dd>{formatDate(file.uploadedAt)}</dd>
        </div>
      </dl>

      <div className="details-actions">
        <button
          className="primary-btn"
          onClick={() => onPreview(file)}
          disabled={loading || file.status !== "uploaded"}
        >
          Preview
        </button>
        <button
          className="secondary-btn"
          onClick={() => onDownload(file.fileId)}
          disabled={loading || file.status !== "uploaded"}
        >
          Download
        </button>
        <button className="ghost-btn" onClick={() => onCopyFileId(file.fileId)}>
          Copy ID
        </button>
        <button className="danger-btn" onClick={() => onDelete(file)} disabled={loading}>
          Delete
        </button>
      </div>
    </aside>
  );
}

function PreviewModal({ preview, onClose, onDownload }) {
  const { file, url, kind, text, loading, error } = preview;

  return (
    <div className="modal-backdrop preview-backdrop" role="presentation" onClick={onClose}>
      <section
        className="preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="preview-header">
          <div>
            <span className="panel-kicker">Secure preview</span>
            <h2 id="preview-title">{file.fileName || file.fileId}</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close preview">
            x
          </button>
        </header>

        <div className="preview-surface">
          {loading && <div className="preview-state">Preparing preview...</div>}

          {!loading && error && (
            <div className="preview-state error">
              <strong>Preview unavailable</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && kind === "image" && (
            <img className="preview-image" src={url} alt={file.fileName || "File preview"} />
          )}

          {!loading && !error && kind === "pdf" && (
            <iframe className="preview-frame" src={url} title={file.fileName || "PDF preview"} />
          )}

          {!loading && !error && kind === "text" && (
            <pre className="preview-text">{text || "No text content available."}</pre>
          )}

          {!loading && !error && kind === "unsupported" && (
            <div className="preview-state">
              <strong>No browser preview for this file type</strong>
              <p>You can still open a temporary secure download link.</p>
            </div>
          )}
        </div>

        <div className="preview-actions">
          <button className="ghost-btn" onClick={onClose}>
            Close
          </button>
          <button className="secondary-btn" onClick={onDownload} disabled={loading}>
            Download
          </button>
        </div>
      </section>
    </div>
  );
}

function FlowStep({ eyebrow, title, text }) {
  return (
    <article>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

function MetricCard({ label, value, detail, tone = "neutral" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function EmptyState({ label, title, text }) {
  return (
    <div className="empty-state">
      <div>{label}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function StatusMessage({ type, text }) {
  return (
    <div className={`status-message ${type}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not uploaded yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTime(value) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function getLatestFile(files) {
  return [...files].sort(
    (a, b) => getTime(b.uploadedAt || b.createdAt) - getTime(a.uploadedAt || a.createdAt)
  )[0];
}

function getPreviewKind(file = {}) {
  const contentType = (file.contentType || "").toLowerCase();
  const fileName = (file.fileName || "").toLowerCase();

  if (contentType.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(fileName)) {
    return "image";
  }

  if (contentType === "application/pdf" || fileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("xml") ||
    /\.(txt|md|csv|json|xml|log|yml|yaml)$/.test(fileName)
  ) {
    return "text";
  }

  return "unsupported";
}

function inferTypeLabel(fileName = "") {
  const icon = getFileIcon(fileName);
  if (icon === "FILE") return "Unknown type";
  return `${icon} file`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${sizes[index]}`;
}

function getFileIcon(fileName = "") {
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "IMG";
  if (name.endsWith(".txt")) return "TXT";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "DOC";
  if (name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".gz")) return "ZIP";
  return "FILE";
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
