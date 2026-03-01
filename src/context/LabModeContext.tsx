"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo,useState } from 'react';

export type LabMode = 'educational' | 'free';

interface LabModeContextType {
    mode: LabMode;
    setMode: (mode: LabMode) => void;
    /** True once the client has hydrated and localStorage has been read. */
    isInitialized: boolean;
    /** True if the user has explicitly chosen a mode at least once. */
    hasChosen: boolean;
    /** Mark that the user has made an explicit choice. */
    choose: (mode: LabMode) => void;
}

const LabModeContext = createContext<LabModeContextType | undefined>(undefined);

export function LabModeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<LabMode>('educational');
    const [hasChosen, setHasChosen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('lm-lab-mode') as LabMode;
        if (saved === 'educational' || saved === 'free') {
            setModeState(saved);
        }
        const chosen = localStorage.getItem('lm-lab-chosen');
        if (chosen === '1') {
            setHasChosen(true);
        }
        setIsInitialized(true);
    }, []);

    const setMode = useCallback((newMode: LabMode) => {
        setModeState(newMode);
        localStorage.setItem('lm-lab-mode', newMode);
    }, []);

    const choose = useCallback((newMode: LabMode) => {
        setModeState(newMode);
        setHasChosen(true);
        localStorage.setItem('lm-lab-mode', newMode);
        localStorage.setItem('lm-lab-chosen', '1');
    }, []);

    const value = useMemo(
        () => ({ mode, setMode, isInitialized, hasChosen, choose }),
        [mode, setMode, isInitialized, hasChosen, choose]
    );

    return (
        <LabModeContext.Provider value={value}>
            {children}
        </LabModeContext.Provider>
    );
}

export function useLabMode() {
    const context = useContext(LabModeContext);
    if (context === undefined) {
        throw new Error('useLabMode must be used within a LabModeProvider');
    }
    return context;
}
