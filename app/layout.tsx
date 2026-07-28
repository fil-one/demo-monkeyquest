import type { Metadata } from "next";
import { headers } from "next/headers";
import { Archivo, DM_Sans } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description =
    "The official trailer site for Monkey Quest, an original animated adventure beyond the canopy.";

  return {
    title: "Monkey Quest",
    description,
    openGraph: {
      description,
      images: [
        {
          alt: "Monkey Quest",
          height: 941,
          url: new URL("/og.png", origin).toString(),
          width: 1672,
        },
      ],
      siteName: "Monkey Quest",
      title: "Monkey Quest",
      type: "website",
      url: origin,
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: [new URL("/og.png", origin).toString()],
      title: "Monkey Quest",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
