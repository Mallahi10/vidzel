export const runtime = "nodejs"; // react-pdf needs Node.js, not edge

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderCertificatePDF } from "@/lib/certificateGenerator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const userId    = searchParams.get("userId");

  if (!projectId || !userId) {
    return NextResponse.json({ error: "Missing projectId or userId" }, { status: 400 });
  }

  /* 1 ── Fetch certificate row */
  const { data: cert, error: certErr } = await supabaseAdmin
    .from("certificates")
    .select("user_name, project_title, role, organization_email, issued_at")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (certErr || !cert) {
    console.error("[pdf] Certificate not found:", certErr?.message);
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  /* 2 ── Build PDF data */
  const issuedDate = cert.issued_at
    ? new Date(cert.issued_at).toLocaleDateString("en-US", {
        day: "numeric", month: "long", year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const roleLabel = cert.role
    ? cert.role.charAt(0).toUpperCase() + cert.role.slice(1)
    : "Participant";

  const data = {
    participantName: cert.user_name  ?? "Participant",
    projectTitle:    cert.project_title ?? "Project",
    orgName:         cert.organization_email ?? "Vidzel Organization",
    role:            roleLabel,
    date:            issuedDate,
  };

  console.log("[pdf] Generating PDF for:", data.participantName, "—", data.projectTitle);

  /* 3 ── Generate PDF buffer */
  try {
    const pdfBuffer = await renderCertificatePDF(data);

    const filename = `Vidzel_Certificate_${data.participantName.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(pdfBuffer.length),
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    console.error("[pdf] PDF generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
