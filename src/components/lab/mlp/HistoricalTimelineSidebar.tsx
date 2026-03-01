"use client";

/*
  HistoricalTimelineSidebar
  Visual timeline from Bengio 2003 → RNNs → LSTMs → Attention → Transformers → GPT.
  Shows the MLP's place in the history of language modeling.
*/

const EVENTS = [
    { year: "2003", label: "Bengio et al.", desc: "Neural Probabilistic Language Model — the MLP approach we just explored", highlight: true, color: "violet" },
    { year: "2010", label: "RNNs revived", desc: "Mikolov applies RNNs to language modeling — sequential memory replaces fixed windows", color: "emerald" },
    { year: "2014", label: "LSTMs & GRUs", desc: "Gated recurrent units solve vanishing gradients in sequence models", color: "emerald" },
    { year: "2014", label: "Seq2Seq", desc: "Sutskever et al. — encoder-decoder for machine translation", color: "amber" },
    { year: "2015", label: "Attention", desc: "Bahdanau et al. — attend to relevant parts of the input dynamically", color: "amber" },
    { year: "2017", label: "Transformer", desc: "Vaswani et al. — 'Attention Is All You Need' — self-attention replaces recurrence entirely", color: "rose" },
    { year: "2018", label: "GPT & BERT", desc: "Large-scale pre-trained Transformers — language understanding at scale", color: "rose" },
    { year: "2020+", label: "GPT-3 → LLMs", desc: "Scaling laws, emergent abilities, and the era of large language models", color: "rose" },
];

const COLOR_MAP: Record<string, string> = {
    violet: "rgb(139,92,246)",
    emerald: "rgb(16,185,129)",
    amber: "rgb(245,158,11)",
    rose: "rgb(244,63,94)",
};

export function HistoricalTimelineSidebar() {
    return (
        <div className="p-5 sm:p-6">
            <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/30 via-emerald-500/20 to-rose-500/30" />

                <div className="space-y-4">
                    {EVENTS.map((ev, i) => (
                        <div key={i} className="relative">
                            {/* Dot */}
                            <div
                                className={`absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                                    ev.highlight ? "ring-2 ring-offset-1 ring-offset-transparent" : ""
                                }`}
                                style={{
                                    backgroundColor: ev.highlight ? COLOR_MAP[ev.color] : "transparent",
                                    borderColor: COLOR_MAP[ev.color],
                                    ...(ev.highlight ? { ringColor: `${COLOR_MAP[ev.color]}40` } : {}),
                                }}
                            />
                            <div className="flex items-start gap-2">
                                <span className="text-[9px] font-mono font-bold w-10 flex-shrink-0 mt-0.5" style={{ color: COLOR_MAP[ev.color] }}>
                                    {ev.year}
                                </span>
                                <div>
                                    <p className={`text-[11px] font-mono font-bold ${ev.highlight ? "text-violet-300" : "text-white/40"}`}>
                                        {ev.label}
                                    </p>
                                    <p className="text-[10px] text-white/25 leading-relaxed">{ev.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
