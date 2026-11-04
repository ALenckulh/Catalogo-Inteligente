package com.catalogo.admin.dto;

import java.util.List;

public record AdminDashboardSeries(
        List<ScoreFaixaItem> distribuicaoScores,
        List<ContatoPorDiaItem> contatosPorDia,
        List<LeadsPorCategoriaItem> leadsPorCategoria
) {
}
