import React from "react";
import {
  Document, Page, View, Text,
  Svg, Path, Rect, Circle, Line,
  StyleSheet, renderToBuffer,
} from "@react-pdf/renderer";

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
  white:   "#FFFFFF",
};

const S = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    padding: 0,
  },
  content: {
    position: "absolute",
    top: 36, left: 52, right: 52, bottom: 34,
    flexDirection: "column",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 8,
  },
  logoName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    letterSpacing: 1.5,
  },
  logoSub: {
    fontSize: 7,
    color: C.muted,
    letterSpacing: 0.5,
  },
  certTitle: {
    fontSize: 52,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    letterSpacing: -1,
    lineHeight: 1,
    marginBottom: 2,
  },
  certSubtitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 5,
    marginBottom: 18,
  },
  dividerShort: {
    height: 0.75,
    backgroundColor: C.pale,
    marginBottom: 16,
    width: "65%",
  },
  dividerFull: {
    height: 0.75,
    backgroundColor: C.pale,
    marginBottom: 20,
  },
  presentedLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 3,
    marginBottom: 6,
  },
  participantName: {
    fontSize: 34,
    fontFamily: "Times-Bold",
    color: C.deep,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 10.5,
    color: C.text,
    lineHeight: 1.65,
    maxWidth: 380,
    marginBottom: 5,
  },
  roleLine: {
    fontSize: 9,
    color: C.muted,
    letterSpacing: 0.5,
    marginBottom: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  dateValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  dateLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 2,
  },
  signName: {
    fontSize: 11,
    fontFamily: "Helvetica-Oblique",
    color: C.text,
    marginBottom: 3,
    textAlign: "right",
  },
  signLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 2,
    textAlign: "right",
  },
  /* Badge */
  badgeWrap: {
    position: "absolute",
    right: 44,
    top: 140,
    alignItems: "center",
    width: 90,
  },
  badgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.deep,
    letterSpacing: 0.8,
    textAlign: "center",
    marginTop: -6,
    lineHeight: 1.5,
  },
});

/* ── Geometric corner shapes ─────────────────────────────────────────── */
function TopRightShapes() {
  return (
    <Svg style={{ position: "absolute", top: 0, right: 0 }} width={260} height={240}>
      <Rect x={100} y={-50} width={220} height={220} rx={40} ry={40}
        fill={C.pale} opacity={0.7} transform="rotate(20, 210, 60)" />
      <Rect x={120} y={-20} width={175} height={175} rx={30} ry={30}
        fill={C.light} opacity={0.85} transform="rotate(12, 208, 68)" />
      <Rect x={148} y={22} width={112} height={112} rx={20} ry={20}
        fill={C.soft} opacity={0.9} transform="rotate(5, 204, 78)" />
    </Svg>
  );
}

function BottomLeftShapes() {
  return (
    <Svg style={{ position: "absolute", bottom: 0, left: 0 }} width={210} height={185}>
      <Rect x={-50} y={35} width={205} height={205} rx={42} ry={42}
        fill={C.pale} opacity={0.7} transform="rotate(-22, 52, 138)" />
      <Rect x={-15} y={50} width={150} height={150} rx={28} ry={28}
        fill={C.soft} opacity={0.85} transform="rotate(-10, 60, 125)" />
    </Svg>
  );
}

/* ── Verified badge (SVG circle + checkmark, text outside SVG) ───────── */
function VerifiedBadge() {
  return (
    <View style={S.badgeWrap}>
      <Svg width={90} height={90}>
        <Circle cx={45} cy={45} r={41} stroke={C.deep} strokeWidth={2} fill={C.white} />
        <Circle cx={45} cy={45} r={34} stroke={C.soft} strokeWidth={0.75} fill="none" />
        {/* Checkmark */}
        <Path d="M 28 45 L 40 57 L 62 35"
          stroke={C.deep} strokeWidth={2.5}
          fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Top tick marks */}
        <Line x1={45} y1={8} x2={45} y2={14} stroke={C.primary} strokeWidth={1.5} />
        <Line x1={55} y1={10} x2={52} y2={15} stroke={C.primary} strokeWidth={1.5} />
        <Line x1={35} y1={10} x2={38} y2={15} stroke={C.primary} strokeWidth={1.5} />
      </Svg>
      <Text style={S.badgeText}>VERIFIED{"\n"}BY VIDZEL</Text>
    </View>
  );
}

/* ── Diamond logo icon using Path ────────────────────────────────────── */
function DiamondIcon() {
  return (
    <Svg width={18} height={18}>
      {/* Outer diamond */}
      <Path d="M 9 1 L 17 9 L 9 17 L 1 9 Z" fill={C.deep} />
      {/* Inner diamond (white cutout) */}
      <Path d="M 9 4 L 14 9 L 9 14 L 4 9 Z" fill={C.white} />
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
}

/* ── PDF Document ────────────────────────────────────────────────────── */
export function CertificateDocument({ data }: { data: CertificateData }) {
  const { participantName, projectTitle, orgName, role, date } = data;

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
            <DiamondIcon />
            <View>
              <Text style={S.logoName}>VIDZEL</Text>
              <Text style={S.logoSub}>Virtual Impact & Development Zone</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={S.certTitle}>Certificate</Text>
          <Text style={S.certSubtitle}>OF PARTICIPATION</Text>
          <View style={S.dividerShort} />

          {/* Presented to */}
          <Text style={S.presentedLabel}>THIS CERTIFICATE IS PRESENTED TO</Text>
          <Text style={S.participantName}>{participantName}</Text>

          {/* Description */}
          <Text style={S.descriptionText}>
            {`For successfully completing the project "${projectTitle}" on the Vidzel Collaborative Impact Platform. This achievement demonstrates commitment, collaboration, and excellence.`}
          </Text>
          <Text style={S.roleLine}>{`${role}  ·  ${orgName}`}</Text>

          <View style={S.dividerFull} />

          {/* Footer */}
          <View style={S.footer}>
            <View>
              <Text style={S.dateValue}>{date.toUpperCase()}</Text>
              <Text style={S.dateLabel}>DATE</Text>
            </View>
            <View>
              <Text style={S.signName}>Vidzel Platform</Text>
              <Text style={S.signLabel}>SIGNATURE</Text>
            </View>
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
