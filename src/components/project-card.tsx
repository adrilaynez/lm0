"use client"

import Link from "next/link"

import { ExternalLink,Github } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/i18n/context"

interface ProjectCardProps {
    title: string
    description: string
    tags: string[]
    githubUrl?: string
    demoUrl?: string
    image?: string
}

export function ProjectCard({
    title,
    description,
    tags,
    githubUrl,
    demoUrl,
    featured = false,
    onClick,
}: ProjectCardProps & { featured?: boolean; onClick?: () => void }) {
    const { t } = useI18n()
    return (
        <Card
            className={`flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg group ${featured ? "border-primary/20 bg-primary/5 scale-[1.01]" : "hover:-translate-y-1"
                }`}
            onClick={onClick}
        >
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className={featured ? "text-2xl" : ""}>{title}</CardTitle>
                    {featured && <Badge variant="default" className="bg-primary/20 text-primary border-primary/50">{t("projects.flagship.featured")}</Badge>}
                </div>
                <CardDescription className={`line-clamp-2 ${featured ? "text-base" : ""}`}>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-mono text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                {githubUrl && (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={githubUrl} target="_blank" rel="noreferrer">
                            <Github className="mr-2 h-4 w-4" />
                            {t("common.code")}
                        </Link>
                    </Button>
                )}
                {demoUrl && (
                    <Button size="sm" variant={featured ? "default" : "secondary"} asChild>
                        <Link href={demoUrl} target={demoUrl.startsWith("/") ? "_self" : "_blank"} rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {featured ? t("common.viewCaseStudy") : t("common.liveDemo")}
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
