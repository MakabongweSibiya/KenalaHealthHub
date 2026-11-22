import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://totusmassages.co.za"
).trim();

export const viewport: Viewport = {
  themeColor: "#135061",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Totus Massage & Aesthetics | Totus Massages — Luxury Massage Therapy & Skin Aesthetics",
    template: "%s | Totus Massage & Aesthetics",
  },
  description:
    "Totus Massage & Aesthetics (Totus Massages) offers bespoke therapeutic massage, deep tissue, Swedish, hot stone therapy, luxury facials, body contouring, and holistic skin aesthetics across Pretoria, Gauteng, and Southern Africa. Reserve seamlessly online.",
  applicationName: "Totus Massage & Aesthetics",
  keywords: [
    "Totus Massages",
    "Totus Massage",
    "Totus Massage and Aesthetics",
    "Totus Massage & Aesthetics",
    "totusmassages.co.za",
    "Totus Spa South Africa",
    "massage therapy Pretoria",
    "massage Pretoria East",
    "luxury massage South Africa",
    "massage Gauteng",
    "deep tissue massage Pretoria",
    "Swedish massage South Africa",
    "hot stone massage Pretoria",
    "aromatherapy massage",
    "aesthetics studio Pretoria",
    "luxury facials South Africa",
    "body contouring Pretoria",
    "skin rejuvenation aesthetics",
    "spa treatments Southern Africa",
    "online massage booking South Africa",
  ],
  authors: [{ name: "Totus Massage & Aesthetics", url: SITE_URL }],
  creator: "Totus Massage & Aesthetics",
  publisher: "Totus Massage & Aesthetics",
  category: "Health, Beauty & Wellness",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-ZA": SITE_URL,
      en: SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: SITE_URL,
    siteName: "Totus Massage & Aesthetics",
    title:
      "Totus Massage & Aesthetics | Totus Massages — Luxury Massage & Skin Aesthetics",
    description:
      "Your tranquil sanctuary for bespoke therapeutic massage, luxury facials, body contouring, and holistic skin aesthetics. Reserve your session online with instant confirmation.",
    images: [
      {
        url: "/totus-og.png",
        width: 1200,
        height: 630,
        alt: "Totus Massage & Aesthetics — Bespoke Massage & Luxury Skin Aesthetics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Totus Massage & Aesthetics | Luxury Massage & Skin Aesthetics",
    description:
      "Restorative therapeutic massage, skin rejuvenation, body contouring, and luxury aesthetic treatments. Book seamlessly online at totusmassages.co.za.",
    images: ["/totus-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/totus-emblem.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured Schema.org JSON-LD graph for maximum Google Rich Results & Local/Global SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Totus Massage & Aesthetics",
        alternateName: ["Totus Massages", "Totus Massage", "Totus Aesthetics"],
        inLanguage: "en-ZA",
        publisher: { "@id": `${SITE_URL}/#business` },
      },
      {
        "@type": ["DaySpa", "HealthAndBeautyBusiness", "LocalBusiness"],
        "@id": `${SITE_URL}/#business`,
        name: "Totus Massage & Aesthetics",
        alternateName: ["Totus Massages", "Totus Massage"],
        description:
          "Tranquil luxury sanctuary offering bespoke massage therapy, deep tissue, Swedish, aromatherapy, hot stone therapy, luxury facials, body contouring, and holistic skin aesthetics.",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/totus-emblem.png`,
        },
        image: `${SITE_URL}/totus-og.png`,
        telephone: "+27790118464",
        email: "totusmassages@gmail.com",
        priceRange: "R200 - R2500",
        currenciesAccepted: "ZAR",
        paymentAccepted: "PayFast, Credit Card, Debit Card, Instant EFT",
        areaServed: [
          { "@type": "City", name: "Pretoria" },
          { "@type": "AdministrativeArea", name: "Gauteng" },
          { "@type": "Country", name: "South Africa" },
          { "@type": "Place", name: "Southern Africa" },
        ],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Pretoria",
          addressRegion: "Gauteng",
          addressCountry: "ZA",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+27790118464",
          contactType: "reservations",
          areaServed: "ZA",
          availableLanguage: ["English"],
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Massage & Aesthetics Treatments",
          itemListElement: [
            { "@type": "OfferCatalog", name: "Therapeutic & Relaxation Massages" },
            { "@type": "OfferCatalog", name: "Luxury Facials & Skin Rejuvenation" },
            { "@type": "OfferCatalog", name: "Body Contouring & Holistic Aesthetics" },
            { "@type": "OfferCatalog", name: "Curated Wellness Products" },
          ],
        },
      },
    ],
  };

  return (
    <html lang="en-ZA" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#FAF9F6] text-zinc-900">
        {children}
      </body>
    </html>
  );
}
