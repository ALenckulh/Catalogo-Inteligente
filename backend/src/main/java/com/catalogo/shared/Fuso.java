package com.catalogo.shared;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

/** O "dia" do negócio é o de Brasília, qualquer que seja o fuso do servidor ou o que o banco devolve (UTC). */
public final class Fuso {

    public static final ZoneId ZONA = ZoneId.of("America/Sao_Paulo");

    private Fuso() {
    }

    public static LocalDate dia(OffsetDateTime instante) {
        return instante.atZoneSameInstant(ZONA).toLocalDate();
    }

    public static LocalDate hoje() {
        return LocalDate.now(ZONA);
    }

    public static OffsetDateTime inicioDoDia(LocalDate dia) {
        return dia.atStartOfDay(ZONA).toOffsetDateTime();
    }
}
