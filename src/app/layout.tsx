import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ArchiveStatisticsProvider } from "@/contexts/ArchiveStatisticsContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Bland.video - Browse Banned Videos",
  description: "banned.video browser",
};

// app/layout.tsx

// globals.css includes @tailwind directives
// adjust the path if necessary
import "@/app/globals.css";
import {Providers} from "./providers";
import MainNavBar from "@/components/MainNavBar";
import Footer from "@/components/Footer";

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
    <html lang="en" className='dark'>
      <body>
        <Providers>
            <MainNavBar />
            <ArchiveStatisticsProvider>
               {children}
            </ArchiveStatisticsProvider>
            <Footer />
        </Providers>
      </body>
    </html>
  )
};