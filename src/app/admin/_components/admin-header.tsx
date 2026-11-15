import Image from "next/image";
import Link from "next/link";
import { text } from "@/lib/strings";

export default function AdminHeader({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <header className="header">
      <div className="brand">
        <Image src="/logo.png" alt="" width={44} height={50} />
        <span>{text.appShortName}</span>
      </div>
      <Link href={backHref} className="button secondary">
        {backLabel}
      </Link>
    </header>
  );
}

export function AdminFallback() {
  return (
    <main className="page">
      <p className="muted">{text.admin.loading}</p>
    </main>
  );
}
