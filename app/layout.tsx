import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Totus Massage & Aesthetics | Luxury Spa, Massage & Beauty Treatments",
  description:
    "Bespoke massage therapy, body treatments, facials, and luxury aesthetics at Totus Massage & Aesthetics. Reserve your studio or mobile spa appointment online.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-[#FAF9F6] text-zinc-900">
        {children}
      </body>
    </html>
  );
}
