"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLabModelRoute = pathname?.startsWith("/lab/") && pathname !== "/lab";

    return (
        <div className="relative flex min-h-screen flex-col">
            {!isLabModelRoute && <Navbar />}
            <main className="flex-1">{children}</main>
            {!isLabModelRoute && <Footer />}
        </div>
    );
}
