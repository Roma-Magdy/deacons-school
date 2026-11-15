import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../../_components/admin-header";
import ImportForm from "./import-form";

export const metadata = { title: text.admin.import.title };

export default function ImportPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <ImportContent />
    </Suspense>
  );
}

async function ImportContent() {
  await requireAdmin();
  return (
    <main className="page">
      <AdminHeader backHref="/admin/users" backLabel={text.admin.backToUsers} />
      <h1 className="page-title-single">{text.admin.import.title}</h1>
      <ImportForm />
    </main>
  );
}
