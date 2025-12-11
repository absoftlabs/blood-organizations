import type { Metadata } from "next";
import { Anek_Bangla } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Common/Header";

const anekBangla = Anek_Bangla({
  variable: "--font-anek-bangla",
  subsets: ["bengali"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "মানবতায় রক্তদান ব্লাড ব্যাংক",
  description: "যদি হই রক্তদাতা, বেঁচে যায় মানবতা।",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" data-theme="light" suppressHydrationWarning>
      <body className={`${anekBangla.variable} antialiased`}>
        <header>
          <Header />
        </header>
        <div className="min-h-screen">
          {children}
        </div>

        <Toaster position="top-center" />
      </body>
    </html>
  );
}
