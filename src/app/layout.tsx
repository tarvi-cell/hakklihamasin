import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hakklihamasin",
  description: "Golfiturniiri äpp seltskonnale",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hakklihamasin",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Hakklihamasin",
    description: "Golfiturniiri äpp seltskonnale — skoorid, edetabel, lõbus!",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B4332" },
    { media: "(prefers-color-scheme: dark)", color: "#0f2920" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="et" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased overscroll-none`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="mx-auto max-w-lg min-h-dvh">
            {children}
          </div>
          <Toaster
            position="bottom-center"
            richColors
            toastOptions={{
              className: "!rounded-2xl !shadow-xl",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
