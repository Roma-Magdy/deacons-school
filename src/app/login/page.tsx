import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SCHOOL_NAME, text } from "@/lib/strings";
import LoginForm from "./login-form";

export const metadata = { title: text.login.pageTitle };

// If someone who is already logged in opens this page, send them to their home page.
async function RedirectIfLoggedIn() {
  if (await getCurrentUser()) redirect("/home");
  return null;
}

export default function LoginPage() {
  return (
    <main className="login-wrap">
      <div className="login-card">
        <Image src="/logo.png" alt={SCHOOL_NAME} width={560} height={640} priority className="login-logo" />
        <p className="muted">{text.login.subtitle}</p>
        <LoginForm />
      </div>
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
    </main>
  );
}
