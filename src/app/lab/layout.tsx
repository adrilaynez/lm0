import { LabModeProvider } from "@/context/LabModeContext";
import { UserProvider } from "@/context/UserContext";

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

