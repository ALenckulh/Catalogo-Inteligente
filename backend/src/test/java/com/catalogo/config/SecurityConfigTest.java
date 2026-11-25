package com.catalogo.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.catalogo.admin.controller.AdminUsuarioController;
import com.catalogo.admin.service.AdminUsuarioService;
import com.catalogo.auth.controller.AuthController;
import com.catalogo.auth.domain.TipoUsuario;
import com.catalogo.auth.entity.Usuario;
import com.catalogo.auth.repository.UsuarioRepository;
import com.catalogo.auth.security.JwtAuthenticationFilter;
import com.catalogo.auth.security.JwtService;
import com.catalogo.auth.service.AuthService;
import com.catalogo.catalog.controller.FavoritoController;
import com.catalogo.catalog.service.FavoritoService;
import com.catalogo.lgpd.controller.ContaController;
import com.catalogo.lgpd.service.ContaService;
import com.catalogo.visitante.service.MigracaoHistoricoService;

/** Regras de rota de verdade (SecurityConfig + filtro JWT), com os services mockados. */
@WebMvcTest(controllers = {
        ContaController.class, FavoritoController.class, AuthController.class, AdminUsuarioController.class
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class})
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    JwtService jwtService;
    @MockitoBean
    UsuarioRepository usuarioRepository;
    @MockitoBean
    ContaService contaService;
    @MockitoBean
    FavoritoService favoritoService;
    @MockitoBean
    AuthService authService;
    @MockitoBean
    MigracaoHistoricoService migracaoHistoricoService;
    @MockitoBean
    AdminUsuarioService adminUsuarioService;

    /** No MockMvc o filtro também entraria fora da cadeia de segurança e o contexto que ele monta seria descartado. */
    @TestConfiguration
    static class FiltroSoNaCadeia {
        @Bean
        FilterRegistrationBean<JwtAuthenticationFilter> jwtForaDoServlet(JwtAuthenticationFilter filtro) {
            FilterRegistrationBean<JwtAuthenticationFilter> registro = new FilterRegistrationBean<>(filtro);
            registro.setEnabled(false);
            return registro;
        }
    }

    @BeforeEach
    void setUp() {
        when(usuarioRepository.findById(anyLong())).thenAnswer(inv -> {
            TipoUsuario tipo = TipoUsuario.values()[((Long) inv.getArgument(0)).intValue()];
            return Optional.of(usuario(tipo));
        });
    }

    @ParameterizedTest
    @CsvSource({
            "GET,/api/conta", "PATCH,/api/conta", "DELETE,/api/conta", "GET,/api/conta/exportar",
            "POST,/api/conta/consentimentos", "POST,/api/conta/solicitacoes-lgpd",
            "GET,/api/favoritos", "POST,/api/favoritos/1", "DELETE,/api/favoritos/1", "POST,/api/auth/migrar-historico"
    })
    void rotaDeCliente(String metodo, String rota) throws Exception {
        mockMvc.perform(req(metodo, rota, TipoUsuario.ADMIN))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        verifyNoInteractions(contaService, favoritoService, migracaoHistoricoService);

        mockMvc.perform(req(metodo, rota, null)).andExpect(status().isUnauthorized());
        for (TipoUsuario tipo : new TipoUsuario[] {TipoUsuario.PF, TipoUsuario.PJ}) {
            mockMvc.perform(req(metodo, rota, tipo)).andExpect(result -> {
                int s = result.getResponse().getStatus();
                if (s == 401 || s == 403) {
                    throw new AssertionError(tipo + " barrado em " + rota + ": " + s);
                }
            });
        }
    }

    @Test
    void clienteNoAdmin403() throws Exception {
        for (TipoUsuario tipo : new TipoUsuario[] {TipoUsuario.PF, TipoUsuario.PJ}) {
            mockMvc.perform(req("GET", "/api/admin/usuarios", tipo))
                    .andExpect(status().isForbidden())
                    .andExpect(content().contentType("application/json;charset=UTF-8"));
        }
        mockMvc.perform(req("GET", "/api/admin/usuarios", TipoUsuario.ADMIN)).andExpect(status().isOk());
    }

    @Test
    void semTokenOuInvalido401EmUtf8() throws Exception {
        mockMvc.perform(req("GET", "/api/admin/usuarios", null))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType("application/json;charset=UTF-8"))
                .andExpect(jsonPath("$.message").value("Não autenticado"));
        mockMvc.perform(request(HttpMethod.GET, "/api/conta").header("Authorization", "Bearer a.b.c"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutValeParaTodosOsPapeis() throws Exception {
        for (TipoUsuario tipo : TipoUsuario.values()) {
            mockMvc.perform(req("POST", "/api/auth/logout", tipo)).andExpect(status().isOk());
        }
        mockMvc.perform(req("POST", "/api/auth/logout", null)).andExpect(status().isUnauthorized());
    }

    private MockHttpServletRequestBuilder req(String metodo, String rota, TipoUsuario tipo) {
        MockHttpServletRequestBuilder r = request(HttpMethod.valueOf(metodo), rota)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}");
        return tipo == null ? r : r.header("Authorization", "Bearer " + jwtService.generate(usuario(tipo)));
    }

    private static Usuario usuario(TipoUsuario tipo) {
        Usuario u = new Usuario();
        u.setId((long) tipo.ordinal());
        u.setTipo(tipo);
        u.setEmail(tipo + "@x.c");
        u.setSenhaHash("x");
        return u;
    }
}
