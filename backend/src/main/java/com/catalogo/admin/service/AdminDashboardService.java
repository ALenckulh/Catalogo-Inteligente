package com.catalogo.admin.service;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.admin.domain.NivelInteresse;
import com.catalogo.admin.dto.AdminDashboardResponse;
import com.catalogo.admin.dto.AdminDashboardSeries;
import com.catalogo.admin.dto.AdminKpis;
import com.catalogo.admin.dto.AdminLeadItem;
import com.catalogo.admin.dto.ContatoPorDiaItem;
import com.catalogo.admin.dto.LeadsPorCategoriaItem;
import com.catalogo.admin.dto.ScoreFaixaItem;
import com.catalogo.admin.repository.AdminAnalyticsRepository;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.catalog.repository.ProdutoRepository;

@Service
public class AdminDashboardService {

    private static final int LEADS_LIMIT = 10;
    private static final int CONTATOS_SERIE_DIAS = 14;

    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final AdminAnalyticsRepository analyticsRepository;

    public AdminDashboardService(
            UsuarioRepository usuarioRepository,
            ProdutoRepository produtoRepository,
            AdminAnalyticsRepository analyticsRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.analyticsRepository = analyticsRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard() {
        OffsetDateTime since7 = OffsetDateTime.now().minusDays(7);
        OffsetDateTime since14Dias = LocalDate.now()
                .minusDays(CONTATOS_SERIE_DIAS - 1L)
                .atStartOfDay(ZoneId.systemDefault())
                .toOffsetDateTime();

        AdminKpis kpis = new AdminKpis(
                usuarioRepository.countByTipoNotAndDeletedAtIsNull(TipoUsuario.ADMIN),
                produtoRepository.countByAtivoTrue(),
                analyticsRepository.countContatosSince(since7),
                analyticsRepository.countLeadsScoreAlto(NivelInteresse.ALTO)
        );

        List<AdminLeadItem> leads = new ArrayList<>();
        for (Object[] row : analyticsRepository.topLeads(LEADS_LIMIT)) {
            leads.add(new AdminLeadItem(
                    ((Number) row[0]).longValue(),
                    row[1] != null ? String.valueOf(row[1]) : null,
                    TipoUsuario.valueOf(String.valueOf(row[2])),
                    row[3] != null ? String.valueOf(row[3]) : null,
                    row[4] != null ? String.valueOf(row[4]) : null,
                    toBigDecimal(row[5]),
                    row[6] != null ? String.valueOf(row[6]) : null,
                    toOffset(row[7])
            ));
        }

        List<ScoreFaixaItem> dist = analyticsRepository.scoreDistribution(NivelInteresse.ALTO, NivelInteresse.MORNO_MIN).stream()
                .map(r -> new ScoreFaixaItem(String.valueOf(r[0]), ((Number) r[1]).longValue()))
                .toList();
        List<ContatoPorDiaItem> porDia = analyticsRepository.contatosPorDia(since14Dias).stream()
                .map(r -> new ContatoPorDiaItem(toLocalDate(r[0]), ((Number) r[1]).longValue()))
                .toList();
        List<LeadsPorCategoriaItem> porCat = analyticsRepository.leadsPorCategoria().stream()
                .map(r -> new LeadsPorCategoriaItem(String.valueOf(r[0]), ((Number) r[1]).longValue()))
                .toList();

        return new AdminDashboardResponse(kpis, leads, new AdminDashboardSeries(dist, porDia, porCat));
    }

    private static BigDecimal toBigDecimal(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof BigDecimal bd) {
            return bd;
        }
        return BigDecimal.valueOf(((Number) o).doubleValue());
    }

    private static OffsetDateTime toOffset(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof OffsetDateTime odt) {
            return odt;
        }
        if (o instanceof Timestamp ts) {
            return ts.toInstant().atOffset(ZoneOffset.UTC);
        }
        return OffsetDateTime.parse(String.valueOf(o));
    }

    private static LocalDate toLocalDate(Object o) {
        if (o instanceof LocalDate ld) {
            return ld;
        }
        if (o instanceof Date d) {
            return d.toLocalDate();
        }
        return LocalDate.parse(String.valueOf(o));
    }
}
