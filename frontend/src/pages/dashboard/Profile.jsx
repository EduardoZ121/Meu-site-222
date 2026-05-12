import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import useTitle from "../../lib/useTitle";

export default function Profile() {
  const { t } = useI18n();
  useTitle(t("sidebar_profile"));
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-[700px] mx-auto" data-testid="profile-page">
      <p className="eyebrow mb-3">{t("prof_eyebrow")}</p>
      <h1 className="heading-xl mb-12">{t("prof_title")}</h1>
      <div className="space-y-7">
        <Field label={t("prof_name")} value={user.name} />
        <Field label={t("prof_email")} value={user.email} />
        <Field label={t("prof_role")} value={user.role} />
        <Field label={t("prof_language")} value={user.lang.toUpperCase()} />
        <Field label={t("prof_balance")} value={`${user.credits} ${t("credits")}`} />
        <Field label={t("prof_since")} value={new Date(user.created_at).toLocaleDateString()} />
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="border-b border-rp-border pb-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-rp-mute2 mb-1.5">{label}</p>
      <p className="text-rp-text font-heading text-2xl">{value}</p>
    </div>
  );
}
