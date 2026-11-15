import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listBranches } from "@/lib/branches";
import { text } from "@/lib/strings";
import AdminHeader, { AdminFallback } from "../../_components/admin-header";
import CreateUserForm from "./create-form";

export const metadata = { title: text.admin.users.add };

export default function NewUserPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <NewUserContent />
    </Suspense>
  );
}

async function NewUserContent() {
  await requireAdmin();
  const branches = await listBranches();
  return (
    <main className="page">
      <AdminHeader backHref="/admin/users" backLabel={text.admin.backToUsers} />
      <h1 className="page-title-single">{text.admin.users.add}</h1>
      <CreateUserForm branches={branches} />
    </main>
  );
}
