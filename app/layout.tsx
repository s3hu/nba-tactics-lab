import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "NBA TACTICS LAB | NBA戦術・分析メディア",
    template: "%s | NBA TACTICS LAB",
  },
  description:
    "NBAの試合戦術、セットオフェンス、ディフェンススキームを徹底解説する専門メディア。試合観戦が一段深くなる分析をお届けします。",
  openGraph: {
    title: "NBA TACTICS LAB | NBA戦術・分析メディア",
    description:
      "NBAの試合戦術、セットオフェンス、ディフェンススキームを徹底解説する専門メディア。",
    siteName: "NBA TACTICS LAB",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-[#0d0f12] text-zinc-100 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}