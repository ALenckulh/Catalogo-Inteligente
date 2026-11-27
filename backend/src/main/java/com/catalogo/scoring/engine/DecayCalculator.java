package com.catalogo.scoring.engine;

import com.catalogo.shared.Fuso;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Regras de decaimento de docs/04-ESPECIFICACAO-TECNICA.md §5.2–5.4.
 * Interesse antigo vale menos: fator e^(−λ·dias). Com λ = 0,01 a meia-vida é ln2/λ ≈ 69 dias
 * (ex.: 30 dias → e^(−0,3) ≈ 0,74).
 */
public final class DecayCalculator {

    public static final int PURCHASE_HALF_YEARS = 2;

    private DecayCalculator() {
    }

    /**
     * Faixas: &lt; 7 dias = 1,0; 7–90 = e^(−λd); 91–180 = e^(−λd) com conversão, senão e^(−2λd);
     * &gt; 180 = e^(−λd) com conversão, senão 0. Contato ou compra dentro da pausa configurada (60 dias por padrão) = 1,0.
     *
     * @param ocorridoEm         event time
     * @param now                reference
     * @param lambda             decay rate
     * @param hasConversionEver  product had conversion (any age) — affects 91–180 / >180 bands
     * @param contactWithinPause contato ou compra do produto dentro da pausa → fator 1,0
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
        long days = ChronoUnit.DAYS.between(Fuso.dia(ocorridoEm), Fuso.dia(now));
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
    public static double purchaseAgeFactor(LocalDate compra, OffsetDateTime now) {
        long days = ChronoUnit.DAYS.between(compra, Fuso.dia(now));
        if (days > PURCHASE_HALF_YEARS * 365L) {
            return 0.5;
        }
        return 1.0;
    }

    public static boolean withinDays(OffsetDateTime when, OffsetDateTime now, int days) {
        return when != null && withinDays(Fuso.dia(when), now, days);
    }

    public static boolean withinDays(LocalDate dia, OffsetDateTime now, int days) {
        return ChronoUnit.DAYS.between(dia, Fuso.dia(now)) <= days;
    }
}
