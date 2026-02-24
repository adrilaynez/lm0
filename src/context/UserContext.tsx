"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

interface UserContextType {
    anonId: string;
    displayName: string;
    setDisplayName: (name: string) => void;
    isInitialized: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const ANON_ID_KEY = "lm-lab-anon-id";
const NAME_KEY = "lm-lab-name";

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [anonId, setAnonId] = useState("");
    const [displayName, setDisplayNameState] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        let id = localStorage.getItem(ANON_ID_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(ANON_ID_KEY, id);
        }
        setAnonId(id);

        const name = localStorage.getItem(NAME_KEY) ?? "";
        setDisplayNameState(name);

        setIsInitialized(true);
    }, []);

    const setDisplayName = useCallback((name: string) => {
        const trimmed = name.trim();
        setDisplayNameState(trimmed);
        if (trimmed) {
            localStorage.setItem(NAME_KEY, trimmed);
        } else {
            localStorage.removeItem(NAME_KEY);
        }
    }, []);

    const value = useMemo(
        () => ({ anonId, displayName, setDisplayName, isInitialized }),
        [anonId, displayName, setDisplayName, isInitialized]
    );

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
