import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import Nav from '@/components/Nav'
import { SpeedInsights } from "@vercel/speed-insights/next"

// Import Clerk and the Dark Theme
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export const metadata: Metadata = {
  title: "F1 ELO",
  description: "F1 ELO Ratings — Live & Historical",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Wrap the app and set the primary color to your signature F1 red
    <ClerkProvider appearance={{ baseTheme: dark, variables: { colorPrimary: '#e8001e' } }}>
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,300;0,400;0,600;0,700;0,900;1,400;1,700&display=swap" rel="stylesheet" />
        </head>
        <body style={{ margin: 0, padding: 0, background: '#0d0d10' }}>
          <Nav />
          
          {/* Pushes your pages down so the fixed navbar doesn't cover the top content */}
          <main style={{ paddingTop: '64px' }}>
            {children}
          </main>
          
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}