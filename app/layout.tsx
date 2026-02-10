import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForFor - Föreningsförsäljning",
  description: "Door-to-door kampanjhantering för svenska sportklubbar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
