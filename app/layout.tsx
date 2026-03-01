import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { PWAInstall } from "@/components/PWAInstall";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "Task Hub",
  description: "Role-based task management",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Task Hub" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="pb-20 md:pb-8">{children}</main>
          <PWAInstall />
          <SWRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
