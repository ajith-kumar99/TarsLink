import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers/ConvexProvider";
import ThemeProvider from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "TarsLink – Real-time Chat",
  description: "Real-time messaging app built with Next.js, Convex & Clerk",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Prevent theme flicker on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('tarslink-theme');
                  if (t === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (t === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
