/**
 * Certificate PDF generator — @react-pdf/renderer v4
 *
 * Signature font strategy:
 *  1. Try to load Great Vibes from /public/fonts/great-vibes.ttf (local file)
 *  2. If unavailable, fall back to the PDF built-in "Times-Italic"
 *
 * To enable Great Vibes:
 *   Download the TTF from Google Fonts and place it at:
 *   /public/fonts/great-vibes.ttf
 */

import React from "react";
import {
  Document, Page, View, Text,
  Svg, Path, Rect, Circle, Line,
  StyleSheet, Font, renderToBuffer,
} from "@react-pdf/renderer";
import { join } from "path";
import { existsSync } from "fs";

/* ── Signature font ─────────────────────────────────────────────────── */
let SIGNATURE_FONT = "Times-Italic"; // built-in fallback — always works

try {
  const localPath = join(process.cwd(), "public", "fonts", "great-vibes.ttf");
  if (existsSync(localPath)) {
    Font.register({ family: "GreatVibes", src: localPath });
    SIGNATURE_FONT = "GreatVibes";
    console.log("[cert] GreatVibes font loaded from local file");
  } else {
    console.log("[cert] GreatVibes not found → using Times-Italic");
  }
} catch (e) {
  console.warn("[cert] Font registration error, using Times-Italic:", e);
}

/* ── Palette ─────────────────────────────────────────────────────────── */
const C = {
  navy:    "#1e3a5f",
  deep:    "#395886",
  primary: "#638ECB",
  soft:    "#8AAEE0",
  light:   "#B1C9EF",
  pale:    "#D5DEEF",
  muted:   "#94A3B8",
  text:    "#1e293b",
  ink:     "#1a2744",
  white:   "#FFFFFF",
};

/* ── Styles ──────────────────────────────────────────────────────────── */
const S = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    padding: 0,
  },
  content: {
    position: "absolute",
    top: 38, left: 52, right: 52, bottom: 32,
    flexDirection: "column",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  logoTextBlock: { flexDirection: "column", gap: 1 },
  logoName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    letterSpacing: 1.8,
  },
  logoSub: {
    fontSize: 6.5,
    color: C.muted,
    letterSpacing: 0.6,
  },
  certTitle: {
    fontSize: 54,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    letterSpacing: -1.2,
    lineHeight: 1,
    marginBottom: 2,
  },
  certSubtitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 5.5,
    marginBottom: 16,
  },
  dividerShort: {
    height: 0.6,
    backgroundColor: C.pale,
    marginBottom: 14,
    width: "60%",
  },
  dividerFull: {
    height: 0.6,
    backgroundColor: C.pale,
    marginBottom: 18,
  },
  presentedLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 3.5,
    marginBottom: 5,
  },
  participantName: {
    fontSize: 34,
    fontFamily: "Times-Bold",
    color: C.deep,
    letterSpacing: 0.4,
    marginBottom: 9,
  },
  descText: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.7,
    maxWidth: 390,
    marginBottom: 4,
  },
  roleLine: {
    fontSize: 8.5,
    color: C.muted,
    letterSpacing: 0.6,
    marginBottom: 18,
  },

  /* Footer */
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dateBlock: {
    flexDirection: "column",
    width: 160,
  },
  dateLine: {
    height: 0.75,
    backgroundColor: C.deep,
    marginBottom: 6,
    width: "100%",
  },
  dateValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 2.5,
  },
  signBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
    width: 210,
  },
  signLine: {
    height: 0.75,
    backgroundColor: C.deep,
    marginBottom: 4,
    width: "100%",
  },
  signLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 2.5,
    textAlign: "right",
  },

  /* Badge */
  badgeWrap: {
    position: "absolute",
    right: 44,
    top: 148,
    alignItems: "center",
    width: 90,
  },
  badgeLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: -4,
    lineHeight: 1.5,
  },
});

/* ── Geometric shapes ────────────────────────────────────────────────── */
function TopRightShapes() {
  return (
    <Svg style={{ position: "absolute", top: 0, right: 0 }} width={260} height={240}>
      <Rect x={100} y={-50} width={220} height={220} rx={42} ry={42}
        fill={C.pale} opacity={0.65} transform="rotate(20, 210, 60)" />
      <Rect x={120} y={-18} width={178} height={178} rx={32} ry={32}
        fill={C.light} opacity={0.80} transform="rotate(12, 209, 71)" />
      <Rect x={150} y={24} width={112} height={112} rx={20} ry={20}
        fill={C.soft} opacity={0.90} transform="rotate(5, 206, 80)" />
    </Svg>
  );
}

function BottomLeftShapes() {
  return (
    <Svg style={{ position: "absolute", bottom: 0, left: 0 }} width={200} height={175}>
      <Rect x={-50} y={30} width={200} height={200} rx={42} ry={42}
        fill={C.pale} opacity={0.65} transform="rotate(-22, 50, 130)" />
      <Rect x={-15} y={48} width={148} height={148} rx={28} ry={28}
        fill={C.soft} opacity={0.80} transform="rotate(-10, 59, 122)" />
    </Svg>
  );
}

function VerifiedBadge() {
  return (
    <View style={S.badgeWrap}>
      <Svg width={86} height={86}>
        <Circle cx={43} cy={43} r={40} stroke={C.deep} strokeWidth={1.8} fill={C.white} />
        <Circle cx={43} cy={43} r={33} stroke={C.soft} strokeWidth={0.6} fill="none" />
        <Path d="M 27 43 L 39 55 L 60 33"
          stroke={C.deep} strokeWidth={2.5}
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={43} cy={7}  r={2}   fill={C.primary} />
        <Circle cx={55} cy={10} r={1.5} fill={C.light} />
        <Circle cx={31} cy={10} r={1.5} fill={C.light} />
      </Svg>
      <Text style={S.badgeLabel}>{"VERIFIED\nBY VIDZEL"}</Text>
    </View>
  );
}

function DiamondLogo() {
  return (
    <Svg width={18} height={18}>
      <Path d="M 9 1 L 17 9 L 9 17 L 1 9 Z" fill={C.deep} />
      <Path d="M 9 4.5 L 13.5 9 L 9 13.5 L 4.5 9 Z" fill={C.white} />
    </Svg>
  );
}

/* ── Export types ────────────────────────────────────────────────────── */
export interface CertificateData {
  participantName: string;
  projectTitle:    string;
  orgName:         string;
  role:            string;
  date:            string;
}

/* ── PDF Document ────────────────────────────────────────────────────── */
export function CertificateDocument({ data, signatureFont }: {
  data: CertificateData;
  signatureFont: string;
}) {
  const { participantName, projectTitle, orgName, role, date } = data;

  const signatureStyle = {
    fontFamily: signatureFont,
    fontSize:   signatureFont === "Times-Italic" ? 20 : 26,
    color:      C.ink,
    marginBottom: 3,
    textAlign:  "right" as const,
  };

  return (
    <Document
      title={`Certificate — ${participantName}`}
      author="Vidzel Platform"
      subject="Certificate of Participation"
    >
      <Page size="A4" orientation="landscape" style={S.page}>

        <TopRightShapes />
        <BottomLeftShapes />
        <VerifiedBadge />

        <View style={S.content}>

          {/* Logo */}
          <View style={S.logoRow}>
            <DiamondLogo />
            <View style={S.logoTextBlock}>
              <Text style={S.logoName}>VIDZEL</Text>
              <Text style={S.logoSub}>Virtual Impact & Development Zone</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={S.certTitle}>Certificate</Text>
          <Text style={S.certSubtitle}>OF PARTICIPATION</Text>
          <View style={S.dividerShort} />

          {/* Body */}
          <Text style={S.presentedLabel}>THIS CERTIFICATE IS PRESENTED TO</Text>
          <Text style={S.participantName}>{participantName}</Text>
          <Text style={S.descText}>
            {`For successfully completing the project "${projectTitle}" on the Vidzel Collaborative Impact Platform. This achievement demonstrates commitment, collaboration, and excellence.`}
          </Text>
          <Text style={S.roleLine}>{`${role}  ·  ${orgName}`}</Text>
          <View style={S.dividerFull} />

          {/* Footer */}
          <View style={S.footer}>

            <View style={S.dateBlock}>
              <View style={S.dateLine} />
              <Text style={S.dateValue}>{date}</Text>
              <Text style={S.dateLabel}>DATE OF ISSUE</Text>
            </View>

            <View style={S.signBlock}>
              <View style={S.signLine} />
              <Text style={signatureStyle}>Vidzel Platform</Text>
              <Text style={S.signLabel}>AUTHORIZED SIGNATURE</Text>
            </View>

          </View>
        </View>

      </Page>
    </Document>
  );
}

/* ── Renderer — with full try/catch ─────────────────────────────────── */
export async function renderCertificatePDF(data: CertificateData): Promise<Buffer> {
  // Primary attempt: with whatever font was registered (GreatVibes or Times-Italic)
  try {
    const buffer = await renderToBuffer(
      <CertificateDocument data={data} signatureFont={SIGNATURE_FONT} />
    );
    return buffer as Buffer;
  } catch (primaryErr) {
    console.error("[cert] Primary render failed:", primaryErr);

    // Fallback: force Times-Italic, skip any custom font
    try {
      console.log("[cert] Retrying with Times-Italic fallback...");
      const buffer = await renderToBuffer(
        <CertificateDocument data={data} signatureFont="Times-Italic" />
      );
      return buffer as Buffer;
    } catch (fallbackErr) {
      console.error("[cert] Fallback render also failed:", fallbackErr);
      throw fallbackErr;
    }
  }
}
