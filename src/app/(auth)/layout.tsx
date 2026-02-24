import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "../globals.css";

import Header from "@/components/Header/Header";
import { Providers } from "../providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Vidzel - Collaborative Impact Platform",
  description:
    "Virtual Impact & Development Zone for Engaged Leaders of Tomorrow.",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable}`}
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#e6ebf5", // ✅ unified logo-aligned platform canvas
          color: "#111827",
        }}
      >
        <Providers>
          <div
            className="appRoot"
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "transparent",
            }}
          >
            <Header />
            <main style={{ flex: 1 }}>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}