import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DELU AI V2",
  description: "NGX market intelligence, education and AI guidance."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
