import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

import Header from "../components/Header/Header";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Vidzel - Collaborative Impact Platform",
  description: "Virtual Impact & Development Zone for Engaged Leaders of Tomorrow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <Providers>
          <div className="appRoot">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}