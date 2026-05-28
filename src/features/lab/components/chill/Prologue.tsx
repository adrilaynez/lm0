"use client";

import { FadeInView } from "@/features/lab/components/FadeInView";
import { useI18n } from "@/i18n/context";

/**
 * Editorial prologue. Three paragraphs (Shannon question, journey arc, intent),
 * followed by the "THE JOURNEY" divider before the first era.
 */
export function ChillPrologue() {
    const { t } = useI18n();

    return (
        <section className="prose" id="prologue">
            <FadeInView as="span" margin="-100px" className="kicker">
                {t("lab.landing.chill.prologue.kicker")}
            </FadeInView>
            <FadeInView as="p" margin="-100px">
                {t("lab.landing.chill.prologue.p1Lead")}{" "}
                <span className="em">{t("lab.landing.chill.prologue.p1Em")}</span>
                {t("lab.landing.chill.prologue.p1Tail")}
            </FadeInView>
            <FadeInView as="p" margin="-100px" className="muted">
                {t("lab.landing.chill.prologue.p2")}
            </FadeInView>
            <FadeInView as="p" margin="-100px" className="muted">
                {t("lab.landing.chill.prologue.p3")}
            </FadeInView>

            <FadeInView className="divider" style={{ marginTop: 80 }}>
                <span className="line" />
                <span>{t("lab.landing.chill.prologue.divider")}</span>
                <span className="line" />
            </FadeInView>
        </section>
    );
}
