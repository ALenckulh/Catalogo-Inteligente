package com.catalogo.admin.dto;

import java.util.List;

public record AdminDashboardResponse(
        AdminKpis kpis,
        List<AdminLeadItem> leads,
        AdminDashboardSeries series
) {
}
