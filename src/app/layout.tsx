import type { Metadata } from "next";
import "./globals.css";
import { ArchiveStatisticsProvider } from "@/contexts/ArchiveStatisticsContext";

export const metadata: Metadata = {
  title: "bland.video - banned.video archive browser",
  description: "banned.video browser",
};

// app/layout.tsx

// globals.css includes @tailwind directives
// adjust the path if necessary
import "@/app/globals.css";
import { Providers } from "./providers";
import MainNavBar from "@/components/MainNavBar";
import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className='dark'>
      <body>
        <Providers>
          <ArchiveStatisticsProvider>
            <MainNavBar />
            {children}
            <Footer />
          </ArchiveStatisticsProvider>

        </Providers>
      </body>
    </html>
  )
}