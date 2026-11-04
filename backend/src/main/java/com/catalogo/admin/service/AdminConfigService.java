package com.catalogo.admin.service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.catalogo.admin.dto.DecayPatchRequest;
import com.catalogo.admin.dto.ParametroDecayResponse;
import com.catalogo.admin.dto.PesoMetricaResponse;
import com.catalogo.admin.dto.PesosPatchRequest;
import com.catalogo.catalog.repository.CategoriaRepository;
import com.catalogo.scoring.entity.ParametroDecay;
import com.catalogo.scoring.entity.PesoMetrica;
import com.catalogo.scoring.repository.ParametroDecayRepository;
import com.catalogo.scoring.repository.PesoMetricaRepository;
import com.catalogo.shared.ApiException;

@Service
public class AdminConfigService {

    private final PesoMetricaRepository pesoMetricaRepository;
    private final ParametroDecayRepository parametroDecayRepository;
    private final CategoriaRepository categoriaRepository;

    public AdminConfigService(
            PesoMetricaRepository pesoMetricaRepository,
            ParametroDecayRepository parametroDecayRepository,
            CategoriaRepository categoriaRepository
    ) {
        this.pesoMetricaRepository = pesoMetricaRepository;
        this.parametroDecayRepository = parametroDecayRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<PesoMetricaResponse> listPesos() {
        return pesoMetricaRepository.findAll().stream().map(PesoMetricaResponse::from).toList();
    }

    @Transactional
    public List<PesoMetricaResponse> patchPesos(Long adminId, PesosPatchRequest request) {
        for (PesosPatchRequest.Item item : request.pesos()) {
            PesoMetrica p = pesoMetricaRepository.findById(item.tipoEvento())
                    .orElseGet(() -> {
                        PesoMetrica neu = new PesoMetrica();
                        neu.setTipoEvento(item.tipoEvento());
                        return neu;
                    });
            p.setPeso(item.peso());
            p.setAtualizadoEm(OffsetDateTime.now());
            p.setAtualizadoPor(adminId);
            pesoMetricaRepository.save(p);
        }
        return listPesos();
    }

    @Transactional(readOnly = true)
    public List<ParametroDecayResponse> listDecay() {
        List<ParametroDecayResponse> out = new ArrayList<>();
        for (ParametroDecay p : parametroDecayRepository.findAll()) {
            String nome = null;
            if (p.getCategoriaId() != null) {
                nome = categoriaRepository.findById(p.getCategoriaId()).map(c -> c.getNome()).orElse(null);
            }
            out.add(new ParametroDecayResponse(p.getCategoriaId(), nome, p.getLambda(), p.getBoostConversao()));
        }
        return out;
    }

    @Transactional
    public List<ParametroDecayResponse> patchDecay(Long adminId, DecayPatchRequest request) {
        for (DecayPatchRequest.Item item : request.items()) {
            ParametroDecay p;
            if (item.categoriaId() == null) {
                p = parametroDecayRepository.findGlobal().orElseGet(ParametroDecay::new);
                p.setCategoriaId(null);
            } else {
                if (!categoriaRepository.existsById(item.categoriaId())) {
                    throw new ApiException("NOT_FOUND", "Categoria não encontrada", HttpStatus.NOT_FOUND);
                }
                p = parametroDecayRepository.findByCategoriaId(item.categoriaId()).orElseGet(ParametroDecay::new);
                p.setCategoriaId(item.categoriaId());
            }
            p.setLambda(item.lambda());
            p.setBoostConversao(item.boostConversao());
            p.setAtualizadoEm(OffsetDateTime.now());
            p.setAtualizadoPor(adminId);
            parametroDecayRepository.save(p);
        }
        return listDecay();
    }
}
