"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide global Navbar/Footer on the lab landing AND any nested lab route.
    // The chill-lab landing has its own LM·LAB masthead + colophon.
    const isLabRoute = pathname?.startsWith("/lab") ?? false;

    return (
        <div className="relative flex min-h-screen flex-col">
            {!isLabRoute && <Navbar />}
            <main className="flex-1">{children}</main>
            {!isLabRoute && <Footer />}
        </div>
    );
}
