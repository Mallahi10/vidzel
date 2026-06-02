import React from "react";
import {
  Document, Page, View, Text,
  Svg, Path, Polygon, Rect, Circle, Line,
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

/* ── Styles ──────────────────────────────────────────────────────────── */
const S = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    padding: 0,
  },
  content: {
    position: "absolute",
    top: 36, left: 52, right: 52, bottom: 34,
    display: "flex",
    flexDirection: "column",
  },

  /* Logo row */
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

  /* Title */
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
    textTransform: "uppercase",
    marginBottom: 18,
  },

  /* Divider */
  dividerLine: {
    height: 0.75,
    backgroundColor: C.pale,
    marginBottom: 16,
    width: "65%",
  },
  dividerLineFull: {
    height: 0.75,
    backgroundColor: C.pale,
    marginBottom: 20,
  },

  /* Body */
  presentedLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 3,
    textTransform: "uppercase",
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

  /* Footer */
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
  },
  dateBlock: {},
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
    textTransform: "uppercase",
  },
  signBlock: {
    alignItems: "flex-end",
  },
  signName: {
    fontSize: 11,
    fontFamily: "Helvetica-Oblique",
    color: C.text,
    marginBottom: 3,
  },
  signLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});

/* ── Decorative corner shapes ────────────────────────────────────────── */
function TopRightShapes() {
  return (
    <Svg style={{ position: "absolute", top: 0, right: 0 }} width={260} height={240}>
      {/* Layer 1 — lightest, most rotated */}
      <Rect x={100} y={-50} width={220} height={220} rx={40} ry={40}
        fill={C.pale} opacity={0.7}
        transform="rotate(20, 210, 60)" />
      {/* Layer 2 */}
      <Rect x={120} y={-20} width={175} height={175} rx={30} ry={30}
        fill={C.light} opacity={0.85}
        transform="rotate(12, 208, 68)" />
      {/* Layer 3 — darkest, least rotated */}
      <Rect x={148} y={22} width={112} height={112} rx={20} ry={20}
        fill={C.soft} opacity={0.9}
        transform="rotate(5, 204, 78)" />
    </Svg>
  );
}

function BottomLeftShapes() {
  return (
    <Svg style={{ position: "absolute", bottom: 0, left: 0 }} width={210} height={185}>
      <Rect x={-50} y={35} width={205} height={205} rx={42} ry={42}
        fill={C.pale} opacity={0.7}
        transform="rotate(-22, 52, 138)" />
      <Rect x={-15} y={50} width={150} height={150} rx={28} ry={28}
        fill={C.soft} opacity={0.85}
        transform="rotate(-10, 60, 125)" />
    </Svg>
  );
}

/* ── Verified badge ──────────────────────────────────────────────────── */
function VerifiedBadge() {
  return (
    <Svg style={{ position: "absolute", right: 42, top: "35%" }} width={88} height={110}>
      {/* Outer ring */}
      <Circle cx={44} cy={44} r={40} stroke={C.deep} strokeWidth={2} fill={C.white} />
      {/* Inner ring */}
      <Circle cx={44} cy={44} r={33} stroke={C.soft} strokeWidth={0.75} fill="none" />
      {/* Checkmark */}
      <Path d="M 30 44 L 40 54 L 58 34"
        stroke={C.deep} strokeWidth={2.5}
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Stars row */}
      <Polygon points="44,80 46,86 52,86 47,90 49,96 44,92 39,96 41,90 36,86 42,86"
        fill={C.primary} />
      <Polygon points="26,80 27.5,85 33,85 28.5,88 30,94 26,91 22,94 23.5,88 19,85 24.5,85"
        fill={C.primary} />
      <Polygon points="62,80 63.5,85 69,85 64.5,88 66,94 62,91 58,94 59.5,88 55,85 60.5,85"
        fill={C.primary} />
      {/* Label */}
      <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: C.deep,
        textAlign: "center", letterSpacing: 1 }}
        x={44} y={70}>
        {"VERIFIED"}
      </Text>
    </Svg>
  );
}

/* ── Diamond logo icon ───────────────────────────────────────────────── */
function DiamondIcon() {
  return (
    <Svg width={18} height={18}>
      <Polygon points="9,1 17,9 9,17 1,9" fill={C.deep} />
      <Polygon points="9,4 14,9 9,14 4,9" fill={C.white} />
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

        {/* Decorative corner shapes */}
        <TopRightShapes />
        <BottomLeftShapes />

        {/* Verified badge */}
        <VerifiedBadge />

        {/* Main content */}
        <View style={S.content}>

          {/* Logo row */}
          <View style={S.logoRow}>
            <DiamondIcon />
            <View>
              <Text style={S.logoName}>VIDZEL</Text>
              <Text style={S.logoSub}>Virtual Impact & Development Zone</Text>
            </View>
          </View>

          {/* Certificate title */}
          <Text style={S.certTitle}>Certificate</Text>
          <Text style={S.certSubtitle}>Of Participation</Text>

          {/* Short divider */}
          <View style={S.dividerLine} />

          {/* Presented to */}
          <Text style={S.presentedLabel}>This certificate is presented to</Text>

          {/* Participant name */}
          <Text style={S.participantName}>{participantName}</Text>

          {/* Description */}
          <Text style={S.descriptionText}>
            {`For successfully completing the project "${projectTitle}" on the Vidzel Collaborative Impact Platform. This achievement demonstrates commitment, collaboration, and excellence.`}
          </Text>

          {/* Role · Org */}
          <Text style={S.roleLine}>{`${role}  ·  ${orgName}`}</Text>

          {/* Full divider */}
          <View style={S.dividerLineFull} />

          {/* Footer */}
          <View style={S.footer}>
            <View style={S.dateBlock}>
              <Text style={S.dateValue}>{date.toUpperCase()}</Text>
              <Text style={S.dateLabel}>Date</Text>
            </View>
            <View style={S.signBlock}>
              <Text style={S.signName}>Vidzel Platform</Text>
              <Text style={S.signLabel}>Signature</Text>
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
