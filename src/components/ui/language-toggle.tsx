"use client";

import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
    className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
    const { language, setLanguage, t } = useI18n();

    const toggle = () => {
        setLanguage(language === 'en' ? 'es' : 'en');
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn("gap-2 text-xs font-mono tracking-widest text-muted-foreground hover:text-foreground", className)}
            aria-label={t("common.toggleLanguage")}
        >
            <Globe className="h-3.5 w-3.5" />
            <span className={cn(language === 'en' ? "text-primary font-bold" : "opacity-50")}>EN</span>
            <span className="opacity-30">/</span>
            <span className={cn(language === 'es' ? "text-primary font-bold" : "opacity-50")}>ES</span>
        </Button>
    );
}
