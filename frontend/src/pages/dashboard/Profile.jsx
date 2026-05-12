import { useAuth } from "../../lib/auth";
import useTitle from "../../lib/useTitle";

export default function Profile() {
  useTitle("Profile");
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-[700px] mx-auto" data-testid="profile-page">
      <p className="eyebrow mb-3">Profile</p>
      <h1 className="heading-xl mb-12">Your details.</h1>
      <div className="space-y-7">
        <Field label="Name" value={user.name} />
        <Field label="Email" value={user.email} />
        <Field label="Role" value={user.role} />
        <Field label="Language" value={user.lang.toUpperCase()} />
        <Field label="Balance" value={`${user.credits} credits`} />
        <Field label="Member since" value={new Date(user.created_at).toLocaleDateString()} />
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
