package com.catalogo.scoring.engine;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Decay rules from frontend/docs/04-ESPECIFICACAO-TECNICA.md §5.2–5.4.
 */
public final class DecayCalculator {

    public static final int PAUSE_CONTACT_DAYS = 60;
    public static final int PURCHASE_HALF_YEARS = 2;

    private DecayCalculator() {
    }

    /**
     * @param ocorridoEm         event time
     * @param now                reference
     * @param lambda             decay rate
     * @param hasConversionEver  product had conversion (any age) — affects 91–180 / >180 bands
     * @param contactWithinPause CONTATO on product within last 60 days → factor 1.0
     */
    public static double interactionFactor(
            OffsetDateTime ocorridoEm,
            OffsetDateTime now,
            double lambda,
            boolean hasConversionEver,
            boolean contactWithinPause
    ) {
        if (contactWithinPause) {
            return 1.0;
        }
        long days = ChronoUnit.DAYS.between(ocorridoEm.toLocalDate(), now.toLocalDate());
        if (days < 0) {
            days = 0;
        }
        if (days < 7) {
            return 1.0;
        }
        if (days <= 90) {
            return Math.exp(-lambda * days);
        }
        if (days <= 180) {
            if (hasConversionEver) {
                return Math.exp(-lambda * days);
            }
            return Math.exp(-lambda * days * 2.0);
        }
        if (hasConversionEver) {
            return Math.exp(-lambda * days);
        }
        return 0.0;
    }

    /** Purchase age factor: full until 2 years, then 0.5. */
    public static double purchaseAgeFactor(OffsetDateTime compraEm, OffsetDateTime now) {
        long days = ChronoUnit.DAYS.between(compraEm.toLocalDate(), now.toLocalDate());
        if (days > PURCHASE_HALF_YEARS * 365L) {
            return 0.5;
        }
        return 1.0;
    }

    public static boolean withinDays(OffsetDateTime when, OffsetDateTime now, int days) {
        if (when == null) {
            return false;
        }
        return ChronoUnit.DAYS.between(when.toLocalDate(), now.toLocalDate()) <= days;
    }
}
