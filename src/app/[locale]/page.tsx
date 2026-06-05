"use client";

import { useCallback, useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { AboutFace } from "./_components/about-face";
import { HomeFace } from "./_components/home-face";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const [flipped, setFlipped] = useState(false);

  const openAbout = useCallback(() => {
    setFlipped(true);
    window.history.pushState(null, "", "/?view=about");
  }, []);

  const closeAbout = useCallback(() => {
    setFlipped(false);
    window.history.pushState(null, "", "/");
  }, []);

  useEffect(() => {
    // Honour ?view=about on first load (e.g. linked from another page).
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "about") setFlipped(true);

    const onPop = () => {
      const p = new URLSearchParams(window.location.search);
      setFlipped(p.get("view") === "about");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFlipped(false);
        window.history.pushState(null, "", "/");
      }
    };

    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      {/* Desktop: true 3D card flip */}
      <div
        className="hidden lg:block h-[100dvh] overflow-hidden"
        style={{ perspective: "2000px" }}
      >
        <motion.div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden" }}
            aria-hidden={flipped}
          >
            <HomeFace onAbout={openAbout} />
          </div>
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            aria-hidden={!flipped}
          >
            <AboutFace onClose={closeAbout} active={flipped} />
          </div>
        </motion.div>
      </div>

      {/* Mobile / tablet: cross-fade + slide (a vertical flip reads poorly here) */}
      <div className="lg:hidden">
        <AnimatePresence mode="wait" initial={false}>
          {flipped ? (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <AboutFace onClose={closeAbout} active={flipped} />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <HomeFace onAbout={openAbout} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
