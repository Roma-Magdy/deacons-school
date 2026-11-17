import { Suspense } from "react";
import { accountText as t } from "@/lib/account-text";
import { requireUser } from "@/lib/auth";
import AdminHeader, { AdminFallback } from "../admin/_components/admin-header";
import PasswordForm from "./password-form";

export const metadata = { title: t.title };

export default function PasswordPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <PasswordContent />
    </Suspense>
  );
}

async function PasswordContent() {
  const user = await requireUser();
  // Right after a new account's first login (or an admin's password reset) the screen is the welcome version, with "later".
  const first = user.passwordPrompt;

  return (
    <main className="page">
      <AdminHeader backHref="/home" backLabel={t.back} />
      <h1 className="page-title-single">{first ? t.welcomeTitle : t.title}</h1>
      <p className="muted">{first ? t.welcomeIntro : t.intro}</p>
      <PasswordForm first={first} />
    </main>
  );
}
