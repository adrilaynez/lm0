"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// import { buttonVariants } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { cn } from "@/lib/utils"

const navItems = [
    { name: "Home", href: "/" },
    { name: "Projects", href: "/projects" },
    { name: "Lab", href: "/lab" },
    { name: "Notes", href: "/notes" },
]

export function Navbar() {
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-8 mx-auto">
                <div className="flex items-center">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block font-mono text-lg tracking-tighter">
                            adrian.laynez
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "transition-colors hover:text-foreground/80",
                                    pathname === item.href ? "text-foreground" : "text-foreground/60"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}
