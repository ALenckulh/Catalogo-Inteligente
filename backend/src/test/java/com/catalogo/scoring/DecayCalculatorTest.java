package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.OffsetDateTime;

import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

import com.catalogo.scoring.engine.DecayCalculator;

class DecayCalculatorTest {

    private final OffsetDateTime now = OffsetDateTime.parse("2026-06-01T12:00:00Z");
    private final double lambda = 0.01;

    @Test
    void under7DaysNoDecay() {
        assertEquals(1.0, DecayCalculator.interactionFactor(now.minusDays(3), now, lambda, false, false));
    }

    @Test
    void midBandExponential() {
        double f = DecayCalculator.interactionFactor(now.minusDays(30), now, lambda, false, false);
        assertTrue(f < 1.0 && f > 0.5);
    }

    @Test
    void after180NoConversionZero() {
        assertEquals(0.0, DecayCalculator.interactionFactor(now.minusDays(200), now, lambda, false, false));
    }

    @Test
    void contactPauseForcesOne() {
        assertEquals(1.0, DecayCalculator.interactionFactor(now.minusDays(100), now, lambda, false, true));
    }

    @Test
    void purchaseOlderThanTwoYearsHalf() {
        assertEquals(0.5, DecayCalculator.purchaseAgeFactor(now.minusDays(800).toLocalDate(), now));
        assertEquals(1.0, DecayCalculator.purchaseAgeFactor(now.minusDays(100).toLocalDate(), now));
    }

    /** 23h30 em Brasília já é o dia seguinte em UTC, que é como o banco devolve: o dia não pode mudar por isso. */
    @Test
    void diaEhODeBrasiliaEmQualquerFuso() {
        OffsetDateTime noite = OffsetDateTime.parse("2026-05-25T23:30:00-03:00");
        for (OffsetDateTime evento : new OffsetDateTime[] {noite, noite.withOffsetSameInstant(ZoneOffset.UTC)}) {
            for (OffsetDateTime agora : new OffsetDateTime[] {
                    OffsetDateTime.parse("2026-05-31T22:00:00-03:00"), OffsetDateTime.parse("2026-06-01T01:00:00Z")}) {
                // 6 dias de calendário em Brasília: ainda sem decaimento
                assertEquals(1.0, DecayCalculator.interactionFactor(evento, agora, lambda, false, false));
                assertTrue(DecayCalculator.withinDays(evento, agora, 6));
                assertFalse(DecayCalculator.withinDays(evento, agora, 5));
            }
        }
    }
}
