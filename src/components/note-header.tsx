"use client"

import Link from "next/link"

import { ArrowLeft } from "lucide-react"

import { useI18n } from "@/i18n/context"

interface NoteHeaderProps {
    title: string
    date?: string
}

export function NoteHeader({ title, date }: NoteHeaderProps) {
    const { t, language } = useI18n()

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="space-y-4">
            <Link
                href="/notes"
                className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("notes.backToNotes")}
            </Link>
            <div className="space-y-4">
                <h1 className="inline-block font-heading text-4xl tracking-tight lg:text-5xl">
                    {title}
                </h1>
                {date && (
                    <time
                        dateTime={date}
                        className="block text-sm text-muted-foreground"
                    >
                        {formatDate(date)}
                    </time>
                )}
            </div>
        </div>
    )
}
