package com.catalogo.scoring;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.OffsetDateTime;

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
        assertEquals(0.5, DecayCalculator.purchaseAgeFactor(now.minusDays(800), now));
        assertEquals(1.0, DecayCalculator.purchaseAgeFactor(now.minusDays(100), now));
    }
}
