import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thiệp Mời Lễ Tốt Nghiệp | Cung Nguyễn Bích Trâm",
  description: "Trân trọng kính mời bạn đến tham dự Lễ Tốt Nghiệp Cử Nhân của Cung Nguyễn Bích Trâm - Trường Đại học FPT!",
  keywords: ["thiệp mời tốt nghiệp", "graduation invitation", "fpt university", "Cung Nguyễn Bích Trâm", "lễ tốt nghiệp"],
  authors: [{ name: "Cung Nguyễn Bích Trâm" }],
  openGraph: {
    title: "Thiệp Mời Lễ Tốt Nghiệp Cử Nhân 🎓 - Cung Nguyễn Bích Trâm",
    description: "Trân trọng kính mời bạn đến tham dự Lễ Tốt Nghiệp tại Trường Đại học FPT!",
    type: "website",
    images: ["/anh1.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${playfairDisplay.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={beVietnamPro.className}>
        {children}
      </body>
    </html>
  );
}
