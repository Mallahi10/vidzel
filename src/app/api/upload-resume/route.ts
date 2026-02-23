export const runtime = "nodejs";

import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const blob = await put(file.name, file, { access: "public" });

  return Response.json({
    url: blob.url,
    fileName: file.name,
  });
}