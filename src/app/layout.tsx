import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers/ConvexProvider";

export const metadata: Metadata = {
  title: "TarsLink – Real-time Chat",
  description: "Real-time messaging app built with Next.js, Convex & Clerk",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
