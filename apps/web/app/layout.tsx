import { pretendard } from "@/styles/font";

import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ko" suppressHydrationWarning>
        <body className={`${pretendard.variable} font-sans antialiased `}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
