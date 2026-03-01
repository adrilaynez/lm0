"use client"

import Link from "next/link"

import { ArrowRight, Calendar,Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/i18n/context"

interface Note {
    slug: string
    title: string
    description: string
    date: string
    tags?: string[]
}

interface NotesContentProps {
    notes: Note[]
}

export function NotesContent({ notes }: NotesContentProps) {
    const { t, language } = useI18n()

    const featuredNote = notes.find(n => n.title.includes("Geometry of Intelligence")) || notes[0]
    const otherNotes = notes.filter(n => n.slug !== featuredNote?.slug)

    const formatDate = (dateString: string, options: Intl.DateTimeFormatOptions) => {
        return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options)
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative py-20 px-4 border-b border-border/40 overflow-hidden">
                <div className="container mx-auto max-w-4xl text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-mono mb-4">
                        <span>{t("notes.hero.est")}</span>
                        <span className="w-1 h-1 bg-primary rounded-full" />
                        <span>{t("notes.hero.archive")}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif tracking-tight text-foreground">
                        {t("notes.hero.titlePrefix")} <br />
                        <span className="italic text-muted-foreground">{t("notes.hero.titleSuffix")}</span>
                    </h1>
                    <p
                        className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: t("notes.hero.description") }}
                    />
                </div>

                {/* Abstract Background Decoration */}
                <div className="absolute top-1/2 left-10 -translate-y-1/2 text-[10rem] opacity-5 font-serif select-none pointer-events-none">
                    ∫
                </div>
                <div className="absolute top-1/2 right-10 -translate-y-1/2 text-[10rem] opacity-5 font-serif select-none pointer-events-none">
                    ∑
                </div>
            </section>

            <section className="container py-16 mx-auto max-w-5xl px-4 space-y-16">

                {/* Featured Article */}
                {featuredNote && (
                    <div className="group relative">
                        <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-6">
                                <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    {t("notes.featured.badge")}
                                </Badge>
                                <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight group-hover:text-primary transition-colors">
                                    <Link href={`/notes/${featuredNote.slug}`}>
                                        {featuredNote.title}
                                    </Link>
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {featuredNote.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(featuredNote.date, { month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {t("notes.featured.readTime").replace("{minutes}", "15")}
                                    </span>
                                </div>
                            </div>
                            <Link href={`/notes/${featuredNote.slug}`} className="block overflow-hidden rounded-xl border border-border/50 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                                <div className="aspect-video bg-muted relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                                            {t("notes.featured.figure")}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                )}

                <div className="h-px bg-border/50 w-full" />

                {/* Article Grid */}
                <div>
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full" />
                        {t("notes.grid.title")}
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {otherNotes.map((note) => (
                            <Link key={note.slug} href={`/notes/${note.slug}`} className="group block h-full">
                                <Card className="h-full bg-card hover:bg-secondary/50 transition-colors border-border/50 p-6 flex flex-col">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                        <time dateTime={note.date}>
                                            {formatDate(note.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </time>
                                    </div>
                                    <h4 className="text-xl font-bold mb-3 font-serif group-hover:text-primary transition-colors">
                                        {note.title}
                                    </h4>
                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                                        {note.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {note.tags?.slice(0, 2).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-[10px] px-2 h-5 font-mono">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex justify-end text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

            </section>
        </div>
    )
}
