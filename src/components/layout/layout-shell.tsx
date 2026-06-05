"use client";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { usePathname } from "@/i18n/navigation";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide global Navbar/Footer on the lab landing AND any nested lab route.
    // The chill-lab landing has its own LM·LAB masthead + colophon.
    const isLabRoute = pathname?.startsWith("/lab") ?? false;
    const isLatentSpace = pathname?.startsWith("/latent-space") ?? false;
    const isProjects = pathname?.startsWith("/projects") ?? false;
    const isLanding = pathname === "/";
    const hideChrome = isLabRoute || isLatentSpace || isProjects || isLanding;

    return (
        <div className="relative flex min-h-screen flex-col">
            {!hideChrome && <Navbar />}
            <main className="flex-1">{children}</main>
            {!hideChrome && <Footer />}
        </div>
    );
}
