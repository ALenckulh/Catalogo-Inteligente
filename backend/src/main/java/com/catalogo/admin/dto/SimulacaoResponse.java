package com.catalogo.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.catalogo.admin.domain.NivelInteresse;

/**
 * Resultado da simulação de parâmetros de score: impacto nos clientes atuais e precisão
 * medida em backtest no histórico real. Percentuais são frações (0–1); null = indefinido.
 */
public record SimulacaoResponse(Impacto impacto, Precisao precisao) {

    public record NivelContagem(NivelInteresse nivel, long quantidade) {
    }

    public record MudancaCliente(
            Long usuarioId,
            String nome,
            NivelInteresse nivelAtual,
            NivelInteresse nivelProposto,
            Double notaAtual,
            Double notaProposta
    ) {
    }

    /** Quantos clientes têm a categoria como favorita (maior nota de categoria). */
    public record CategoriaContagem(Long categoriaId, String nome, long quantidade) {
    }

    /** Categoria favorita do cliente hoje e com os ajustes; null = nenhuma. */
    public record MudancaCategoria(Long usuarioId, String nome, String categoriaAtual, String categoriaProposta) {
    }

    public record Impacto(
            int clientesAnalisados,
            List<NivelContagem> atual,
            List<NivelContagem> proposta,
            Double notaMediaAtual,
            Double notaMediaProposta,
            int mudamDeNivel,
            List<MudancaCliente> mudancas,
            int mudamDeCategoria,
            List<CategoriaContagem> categoriasAtual,
            List<CategoriaContagem> categoriasProposta,
            List<MudancaCategoria> mudancasCategoria
    ) {
    }

    public enum Confianca { BAIXA, MEDIA, ALTA }

    public record Metricas(
            Double precisaoQuentes,
            Double recallQuentes,
            Double auc,
            Double acertoTop3,
            int quentes
    ) {
    }

    /** {@code corte} null quando não há histórico suficiente para o backtest. */
    public record Precisao(
            OffsetDateTime corte,
            int amostras,
            int conversoes,
            Confianca confianca,
            Metricas atual,
            Metricas proposta
    ) {
    }
}
