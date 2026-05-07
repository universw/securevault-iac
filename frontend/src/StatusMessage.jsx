export default function StatusMessage({ type, text }) {
  return (
    <div className={`status-message ${type}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}
