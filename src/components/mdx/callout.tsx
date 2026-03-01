import { AlertTriangle, CheckCircle,Info, Terminal } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CalloutProps {
    icon?: string
    title?: string
    children?: React.ReactNode
    type?: "default" | "info" | "warning" | "success" | "danger"
}

export function Callout({
    title,
    children,
    icon,
    type = "default",
}: CalloutProps) {
    let IconComponent = Terminal
    let variant: "default" | "destructive" = "default"
    let className = ""

    if (type === "info") {
        IconComponent = Info
        className = "border-blue-500/50 text-blue-600 dark:text-blue-400 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400"
    } else if (type === "warning") {
        IconComponent = AlertTriangle
        className = "border-yellow-500/50 text-yellow-600 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400"
    } else if (type === "success") {
        IconComponent = CheckCircle
        className = "border-green-500/50 text-green-600 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400"
    } else if (type === "danger") {
        IconComponent = AlertTriangle
        variant = "destructive"
    }

    return (
        <Alert variant={variant} className={`my-6 ${className}`}>
            {icon ? <span className="mr-4 text-2xl">{icon}</span> : <IconComponent className="h-4 w-4" />}
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{children}</AlertDescription>
        </Alert>
    )
}
