import { db } from "@/lib/db";

/** Serves an uploaded shape picture. The address carries a ?v= number that changes with every upload, so browsers can cache it for good. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return new Response("Not found", { status: 404 });

  const { rows } = await db.query("select image_data from shapes where id = $1 and image_data is not null", [id]);
  if (!rows[0]) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(rows[0].image_data as Buffer), {
    headers: {
      // Always a PNG: uploads are checked on the server. nosniff stops a browser from guessing anything else.
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
