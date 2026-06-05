import "katex/dist/katex.min.css";

import { LabModeProvider } from "@/features/lab/context/LabModeContext";
import { UserProvider } from "@/features/lab/context/UserContext";

export default function LabLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LabModeProvider>
            <UserProvider>
                {children}
            </UserProvider>
        </LabModeProvider>
    );
}

