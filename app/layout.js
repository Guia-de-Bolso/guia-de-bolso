import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import { NATIVE_OFFLINE_BOOT_SCRIPT } from "@/lib/nativeOfflineBoot";
import { DEFAULT_SITE_METADATA, getMetadataBase } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: getMetadataBase(),
  ...DEFAULT_SITE_METADATA,
};

/** Safe areas no WebView nativo (Capacitor) e mobile. */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Root HTML layout with global fonts and metadata for the app.
 * @param {{ children: import("react").ReactNode }} props - Layout children.
 * @returns {import("react").ReactElement}
 */
export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: NATIVE_OFFLINE_BOOT_SCRIPT }} />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
