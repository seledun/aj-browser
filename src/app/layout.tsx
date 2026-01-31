import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ArchiveStatisticsProvider } from "@/contexts/ArchiveStatisticsContext";
import { HeroUIProvider } from "@heroui/system";

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
  title: "Informatiks Wars",
  description: "banned.video browser",
};

// app/layout.tsx

// globals.css includes @tailwind directives
// adjust the path if necessary
import "@/app/globals.css";
import {Providers} from "./providers";

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
    <html lang="en" className='dark'>
      <body>
        <Providers>
            <ArchiveStatisticsProvider>
               {children}
            </ArchiveStatisticsProvider>
        </Providers>
      </body>
    </html>
  )
};