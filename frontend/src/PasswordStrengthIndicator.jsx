export default function PasswordStrengthIndicator({ validation }) {
  const requirements = [
    { key: "hasMin8", label: "8+ characters", value: validation.hasMin8 },
    { key: "hasLower", label: "Lowercase letter", value: validation.hasLower },
    { key: "hasUpper", label: "Uppercase letter", value: validation.hasUpper },
    { key: "hasNumber", label: "Number", value: validation.hasNumber },
    { key: "hasSymbol", label: "Symbol (!@#$%^&*)", value: validation.hasSymbol },
  ];

  const metCount = requirements.filter((r) => r.value).length;
  const strength = Math.round((metCount / requirements.length) * 100);

  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div
          className={`strength-fill ${
            strength < 40
              ? "weak"
              : strength < 80
                ? "medium"
                : "strong"
          }`}
          style={{ width: `${strength}%` }}
        />
      </div>
      <ul className="requirements-list">
        {requirements.map((req) => (
          <li key={req.key} className={req.value ? "met" : ""}>
            <span className="check">{req.value ? "✓" : "○"}</span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
