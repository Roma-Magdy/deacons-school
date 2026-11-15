import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export const metadata = { title: "تسجيل الدخول" };

// If someone who is already logged in opens this page, send them to their home page.
async function RedirectIfLoggedIn() {
  if (await getCurrentUser()) redirect("/home");
  return null;
}

export default function LoginPage() {
  return (
    <main className="center-card">
      <h1>مدرسة الشمامسة</h1>
      <p className="muted">سجّل دخولك برقم الهاتف وكلمة المرور</p>
      <LoginForm />
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
    </main>
  );
}
