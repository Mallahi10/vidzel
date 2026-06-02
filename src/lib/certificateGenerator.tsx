import React from "react";
import {
  Document, Page, View, Text, Svg,
  Path, Line, Circle, Rect,
  StyleSheet, renderToBuffer,
} from "@react-pdf/renderer";

/* ── Palette ─────────────────────────────────────────────────────────── */
const C = {
  navy:    "#1e3a5f",
  deep:    "#395886",
  primary: "#638ECB",
  soft:    "#8AAEE0",
  muted:   "#94A3B8",
  light:   "#D5DEEF",
  cream:   "#FAFAFA",
  text:    "#1e293b",
};

/* ── Styles ──────────────────────────────────────────────────────────── */
const S = StyleSheet.create({
  page: {
    backgroundColor: C.cream,
    padding: 0,
    fontFamily: "Helvetica",
  },

  /* Double border frame */
  outerFrame: {
    position: "absolute",
    top: 22, left: 22, right: 22, bottom: 22,
    border: "2.5pt solid #395886",
  },
  innerFrame: {
    position: "absolute",
    top: 30, left: 30, right: 30, bottom: 30,
    border: "0.75pt solid #8AAEE0",
  },

  /* Main content area */
  content: {
    position: "absolute",
    top: 38, left: 38, right: 38, bottom: 38,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 28,
    paddingHorizontal: 40,
    paddingBottom: 22,
  },

  /* Header */
  logoText: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    letterSpacing: 6,
    textAlign: "center",
    marginBottom: 3,
  },
  logoSub: {
    fontSize: 7.5,
    color: C.muted,
    letterSpacing: 2.5,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  certTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    letterSpacing: 4,
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 16,
  },

  /* Body */
  presentsLabel: {
    fontSize: 10.5,
    color: C.muted,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    marginBottom: 6,
  },
  participantName: {
    fontSize: 38,
    fontFamily: "Times-Bold",
    color: C.navy,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
  },
  completedLabel: {
    fontSize: 10.5,
    color: C.text,
    fontFamily: "Helvetica",
    textAlign: "center",
    marginBottom: 6,
  },
  projectTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    textAlign: "center",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 0,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 9,
    color: C.muted,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  dot: {
    fontSize: 9,
    color: C.light,
    marginHorizontal: 6,
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 44,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signatureBlock: {
    alignItems: "center",
    width: 130,
  },
  signatureLine: {
    borderTop: "0.75pt solid #395886",
    width: 110,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: C.muted,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  dateBlock: {
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 7.5,
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    textAlign: "center",
  },
  badgeBlock: {
    alignItems: "center",
    width: 130,
  },
});

/* ── Ornamental divider ──────────────────────────────────────────────── */
function Divider({ width = 320 }: { width?: number }) {
  const cx = width / 2;
  return (
    <Svg height="16" width={width} style={{ marginBottom: 10 }}>
      <Line x1={0}      y1={8} x2={cx - 14} y2={8} stroke={C.soft}  strokeWidth={0.6} />
      <Circle cx={cx - 6} cy={8} r={2} fill={C.primary} />
      <Circle cx={cx}      cy={8} r={3} fill={C.deep}    />
      <Circle cx={cx + 6} cy={8} r={2} fill={C.primary} />
      <Line x1={cx + 14} y1={8} x2={width}  y2={8} stroke={C.soft}  strokeWidth={0.6} />
    </Svg>
  );
}

/* ── Corner ornament ─────────────────────────────────────────────────── */
function CornerOrnaments() {
  const s = 18;
  const pageW = 841.89;
  const pageH = 595.28;
  const m = 30;

  return (
    <Svg style={{ position: "absolute", top: 0, left: 0 }} width={pageW} height={pageH}>
      {/* Top-left */}
      <Path d={`M ${m} ${m + s} L ${m} ${m} L ${m + s} ${m}`}
        stroke={C.deep} strokeWidth={1.5} fill="none" />
      {/* Top-right */}
      <Path d={`M ${pageW - m - s} ${m} L ${pageW - m} ${m} L ${pageW - m} ${m + s}`}
        stroke={C.deep} strokeWidth={1.5} fill="none" />
      {/* Bottom-left */}
      <Path d={`M ${m} ${pageH - m - s} L ${m} ${pageH - m} L ${m + s} ${pageH - m}`}
        stroke={C.deep} strokeWidth={1.5} fill="none" />
      {/* Bottom-right */}
      <Path d={`M ${pageW - m - s} ${pageH - m} L ${pageW - m} ${pageH - m} L ${pageW - m} ${pageH - m - s}`}
        stroke={C.deep} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

/* ── Verified badge ──────────────────────────────────────────────────── */
function VerifiedBadge() {
  return (
    <Svg height="52" width="130">
      {/* Outer ring */}
      <Circle cx={65} cy={26} r={24} stroke={C.deep} strokeWidth={1.2} fill="none" />
      {/* Inner ring */}
      <Circle cx={65} cy={26} r={20} stroke={C.soft} strokeWidth={0.5} fill="rgba(57,88,134,0.04)" />
      {/* Checkmark */}
      <Path d="M 56 26 L 62 32 L 74 20" stroke={C.deep} strokeWidth={1.8}
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ── Export types ────────────────────────────────────────────────────── */
export interface CertificateData {
  participantName:  string;
  projectTitle:     string;
  orgName:          string;
  role:             string;
  date:             string;
  message?:         string;
}

/* ── PDF Document ────────────────────────────────────────────────────── */
export function CertificateDocument({ data }: { data: CertificateData }) {
  const {
    participantName,
    projectTitle,
    orgName,
    role,
    date,
  } = data;

  return (
    <Document
      title={`Certificate — ${participantName}`}
      author="Vidzel Platform"
      subject="Certificate of Participation"
    >
      <Page size="A4" orientation="landscape" style={S.page}>

        {/* ── Double border ── */}
        <View style={S.outerFrame} />
        <View style={S.innerFrame} />

        {/* ── Corner ornaments ── */}
        <CornerOrnaments />

        {/* ── Main content ── */}
        <View style={S.content}>

          {/* Logo */}
          <Text style={S.logoText}>VIDZEL</Text>
          <Text style={S.logoSub}>Virtual Impact & Development Zone for Engaged Leaders</Text>

          {/* Title */}
          <Text style={S.certTitle}>Certificate of Participation</Text>

          {/* Top divider */}
          <Divider width={340} />

          {/* Presented to */}
          <Text style={S.presentsLabel}>This is proudly presented to</Text>

          {/* Participant name */}
          <Text style={S.participantName}>{participantName}</Text>

          {/* Completion text */}
          <Text style={S.completedLabel}>for successfully completing</Text>

          {/* Project title */}
          <Text style={S.projectTitle}>"{projectTitle}"</Text>

          {/* Meta: role · org */}
          <View style={S.metaRow}>
            <Text style={S.metaText}>{role}</Text>
            <Text style={S.dot}> · </Text>
            <Text style={S.metaText}>{orgName}</Text>
          </View>

          {/* Bottom divider */}
          <Divider width={260} />

        </View>

        {/* ── Footer ── */}
        <View style={S.footer}>

          {/* Signature block */}
          <View style={S.signatureBlock}>
            <View style={S.signatureLine} />
            <Text style={S.signatureLabel}>Authorized by Vidzel Platform</Text>
          </View>

          {/* Date center */}
          <View style={S.dateBlock}>
            <Text style={S.dateLabel}>Date of Issue</Text>
            <Text style={S.dateValue}>{date}</Text>
          </View>

          {/* Verified badge */}
          <View style={S.badgeBlock}>
            <VerifiedBadge />
            <Text style={{ fontSize: 7, color: C.muted, textAlign: "center",
              letterSpacing: 1, marginTop: 3 }}>
              VERIFIED BY VIDZEL
            </Text>
          </View>

        </View>

      </Page>
    </Document>
  );
}

/* ── Renderer ────────────────────────────────────────────────────────── */
export async function renderCertificatePDF(data: CertificateData): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument data={data} />) as Promise<Buffer>;
}
