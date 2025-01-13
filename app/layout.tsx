import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title:
    "Ökobilanzierung: MAS FHNW Digitales Bauen CAS Integriertes Projektmanagement",
  description: "Calculate LCA for construction elements",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-gradient-mesh dark:bg-gradient-mesh-dark selection:bg-[#7aa2f7]/20 dark:selection:bg-[#7aa2f7]/30"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
