import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "../lib/i18n";

export default function PasswordField({
  id,
  name,
  value,
  onChange,
  autoComplete = "current-password",
  minLength = 6,
  required = true,
  placeholder,
  testId,
  className = "field-input",
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  const inputId = useMemo(() => id || name || testId || "password", [id, name, testId]);

  return (
    <div className="relative">
      <input
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`${className} pr-12`}
        data-testid={testId}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-rp-mute2 hover:text-rp-lavender transition-colors"
        aria-label={visible ? t("auth_hide_password") : t("auth_show_password")}
        aria-pressed={visible}
        tabIndex={-1}
        data-testid={testId ? `${testId}-toggle` : "password-toggle"}
      >
        {visible ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
