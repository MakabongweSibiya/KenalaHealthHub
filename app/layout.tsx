import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kenalahealthhub.co.za";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Totus Massage & Aesthetics | Luxury Massage Therapy, Spa & Aesthetics Treatments",
    template: "%s | Totus Massage & Aesthetics",
  },
  description:
    "Totus Massage & Aesthetics offers bespoke therapeutic massage, deep tissue, Swedish, hot stone massage, luxury facials, body contouring, and holistic skin aesthetics in Pretoria East and mobile spa visits across Gauteng. Book online seamlessly.",
  keywords: [
    "Totus Massage and Aesthetics",
    "Totus Massage",
    "massage therapy Pretoria",
    "massage Pretoria East",
    "deep tissue massage Pretoria",
    "Swedish massage Pretoria",
    "hot stone massage South Africa",
    "aromatherapy massage",
    "mobile massage therapist Pretoria",
    "aesthetics studio Pretoria East",
    "luxury facials Pretoria",
    "body contouring Pretoria",
    "skin aesthetics South Africa",
    "spa treatments near me",
    "relaxation massage booking online",
    "holistic spa sanctuary Gauteng",
  ],
  authors: [{ name: "Totus Massage & Aesthetics" }],
  creator: "Totus Massage & Aesthetics",
  publisher: "Totus Massage & Aesthetics",
  category: "Health, Beauty & Wellness",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: SITE_URL,
    siteName: "Totus Massage & Aesthetics",
    title: "Totus Massage & Aesthetics | Luxury Massage Therapy & Skin Aesthetics",
    description:
      "Experience bespoke therapeutic massage, luxury facials, body sculpting, and holistic aesthetics. Reserve your studio or mobile session online with instant booking confirmation.",
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
    title: "Totus Massage & Aesthetics | Luxury Spa, Massage & Aesthetics",
    description:
      "Restorative therapeutic massage, skin rejuvenation, body contouring, and luxury aesthetic treatments. Book your session seamlessly online.",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DaySpa",
    name: "Totus Massage & Aesthetics",
    description:
      "Tranquil luxury sanctuary offering bespoke massage therapy, deep tissue, Swedish, aromatherapy, hot stone therapy, luxury facials, body contouring, and skin aesthetics in-studio and via mobile spa sessions.",
    url: SITE_URL,
    logo: `${SITE_URL}/totus-emblem.png`,
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
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pretoria East",
      addressRegion: "Gauteng",
      addressCountry: "ZA",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "17:00",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Massage & Aesthetics Treatments",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Therapeutic & Relaxation Massages" },
        { "@type": "OfferCatalog", name: "Luxury Facials & Skin Rejuvenation" },
        { "@type": "OfferCatalog", name: "Body Contouring & Holistic Aesthetics" },
        { "@type": "OfferCatalog", name: "Mobile Spa & Private Home Sessions" },
      ],
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#FAF9F6] text-zinc-900">
        {children}
      </body>
    </html>
  );
}
