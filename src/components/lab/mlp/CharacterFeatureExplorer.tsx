"use client";

import { useState } from "react";

import { motion } from "framer-motion";

/*
  CharacterFeatureExplorer
  Interactive card-sorting game. User drags/clicks letters into groups.
  The platform highlights shared features: "You just assigned coordinates!"
  Builds the intuition that letters can be described by features.
*/

interface Group {
    id: string;
    label: string;
    color: string;
    hint: string;
    members: string[];
}

const INITIAL_GROUPS: Group[] = [
    { id: "vowels", label: "Group A", color: "#a78bfa", hint: "Vowels", members: [] },
    { id: "common", label: "Group B", color: "#60a5fa", hint: "Common consonants", members: [] },
    { id: "rare", label: "Group C", color: "#f59e0b", hint: "Rare consonants", members: [] },
    { id: "special", label: "Group D", color: "#f43f5e", hint: "Punctuation & special", members: [] },
];

const ALL_CHARS = "abcdefghijklmnopqrstuvwxyz.".split("");

const SUGGESTED_MAPPING: Record<string, string> = {
    a: "vowels", e: "vowels", i: "vowels", o: "vowels", u: "vowels",
    t: "common", n: "common", s: "common", r: "common", h: "common", l: "common", d: "common",
    c: "common", m: "common", p: "common", f: "common", g: "common", w: "common", b: "common",
    y: "common", k: "rare", v: "rare", j: "rare", x: "rare", q: "rare", z: "rare",
    ".": "special",
};

export function CharacterFeatureExplorer() {
    const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
    const [unassigned, setUnassigned] = useState<string[]>([...ALL_CHARS]);
    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [showInsight, setShowInsight] = useState(false);
    const [autoSorted, setAutoSorted] = useState(false);

    const assignToGroup = (groupId: string) => {
        if (!selectedChar) return;
        setGroups(prev => prev.map(g =>
            g.id === groupId && !g.members.includes(selectedChar)
                ? { ...g, members: [...g.members, selectedChar] }
                : g
        ));
        setUnassigned(prev => prev.filter(c => c !== selectedChar));
        setSelectedChar(null);
    };

    const removeFromGroup = (groupId: string, char: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, members: g.members.filter(c => c !== char) }
                : g
        ));
        setUnassigned(prev => [...prev, char].sort());
    };

    const autoSort = () => {
        const newGroups = INITIAL_GROUPS.map(g => ({ ...g, members: [] as string[] }));
        for (const ch of ALL_CHARS) {
            const gid = SUGGESTED_MAPPING[ch] || "special";
            const group = newGroups.find(g => g.id === gid);
            if (group) group.members.push(ch);
        }
        setGroups(newGroups);
        setUnassigned([]);
        setAutoSorted(true);
        setTimeout(() => setShowInsight(true), 600);
    };

    const totalAssigned = groups.reduce((sum, g) => sum + g.members.length, 0);

    return (
        <div className="p-4 sm:p-5 space-y-4">
            {/* Unassigned characters */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        Characters to sort ({unassigned.length} remaining)
                    </p>
                    {unassigned.length > 0 && (
                        <button
                            onClick={autoSort}
                            className="text-[10px] font-mono text-violet-400/60 hover:text-violet-400 transition-colors"
                        >
                            Auto-sort for me
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                    {unassigned.map(ch => (
                        <motion.button
                            key={ch}
                            layout
                            onClick={() => setSelectedChar(selectedChar === ch ? null : ch)}
                            className="w-7 h-7 rounded text-xs font-mono font-bold transition-all"
                            style={{
                                backgroundColor: selectedChar === ch ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.04)",
                                color: selectedChar === ch ? "#a78bfa" : "rgba(255,255,255,0.4)",
                                borderWidth: 1,
                                borderColor: selectedChar === ch ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.08)",
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {ch === "." ? "·" : ch}
                        </motion.button>
                    ))}
                    {unassigned.length === 0 && !autoSorted && (
                        <p className="text-[10px] text-white/20 italic self-center">All characters assigned!</p>
                    )}
                </div>
                {selectedChar && (
                    <p className="text-[10px] text-violet-400/60 mt-1.5">
                        Click a group below to place &apos;{selectedChar}&apos;
                    </p>
                )}
            </div>

            {/* Groups */}
            <div className="grid grid-cols-2 gap-3">
                {groups.map(group => (
                    <motion.button
                        key={group.id}
                        onClick={() => assignToGroup(group.id)}
                        disabled={!selectedChar}
                        className="rounded-lg border p-3 text-left transition-all min-h-[80px]"
                        style={{
                            borderColor: selectedChar ? group.color + "40" : "rgba(255,255,255,0.06)",
                            backgroundColor: selectedChar ? group.color + "08" : "rgba(255,255,255,0.02)",
                            cursor: selectedChar ? "pointer" : "default",
                        }}
                        whileHover={selectedChar ? { scale: 1.02 } : {}}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color + "60" }} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: group.color }}>
                                {group.label}
                            </span>
                            {showInsight && (
                                <span className="text-[9px] font-mono text-white/20">
                                    ({group.hint})
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {group.members.map(ch => (
                                <motion.span
                                    key={ch}
                                    layout
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-mono font-bold cursor-pointer hover:opacity-60"
                                    style={{
                                        backgroundColor: group.color + "25",
                                        color: group.color,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromGroup(group.id, ch);
                                    }}
                                    title={`Remove '${ch}' from group`}
                                >
                                    {ch === "." ? "·" : ch}
                                </motion.span>
                            ))}
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-violet-500/40"
                        animate={{ width: `${(totalAssigned / ALL_CHARS.length) * 100}%` }}
                    />
                </div>
                <span className="text-[9px] font-mono text-white/25">{totalAssigned}/{ALL_CHARS.length}</span>
            </div>

            {/* Insight reveal */}
            {(totalAssigned >= ALL_CHARS.length * 0.7 || showInsight) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-violet-500/[0.2] bg-violet-500/[0.05] p-4"
                >
                    <p className="text-[10px] font-mono text-violet-400/70 uppercase tracking-widest mb-1">
                        Insight
                    </p>
                    <p className="text-sm text-white/60 leading-relaxed">
                        By sorting characters into groups, you just assigned each letter a <strong className="text-white/80">categorical feature</strong>.
                        Group A (vowels), Group B (common consonants), etc. — each group is like a dimension.
                        What if instead of categories, you assigned <em>numbers</em>? Then each letter would become a point in space,
                        and similar letters would be <strong className="text-white/80">close together</strong>.
                    </p>
                    {!showInsight && (
                        <button
                            onClick={() => setShowInsight(true)}
                            className="text-[10px] font-mono text-violet-400/60 hover:text-violet-400 mt-2 transition-colors"
                        >
                            Reveal group names →
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
}
