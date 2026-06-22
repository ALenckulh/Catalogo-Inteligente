const PHASES = [
  {
    weeks: "1–4",
    title: "Fundação",
    items: [
      "Modelagem de dados (produto, categoria, interação, usuário)",
      "Implementação da Camada 1 — Popularidade Global",
      "Estrutura base de coleta de métricas comportamentais",
      "Geração do dataset sintético de interações B2B",
    ],
    color: "phase-blue",
  },
  {
    weeks: "5–8",
    title: "Motor de Scoring",
    items: [
      "Score de Produto com pesos por tipo de interação",
      "Decaimento exponencial (λ) calibrado por perfil de produto",
      "Pausa de decaimento por evento de contato com vendedor",
      "Transição gradual: fallback global → score pessoal",
    ],
    color: "phase-violet",
  },
  {
    weeks: "9–12",
    title: "Funcionalidades Avançadas",
    items: [
      "Score de Categoria — média log-ponderada + boost de conversão",
      "Faixa de preço: conversão vs. apenas visualização",
      "Histórico de compras com threshold mínimo (3 registros)",
      "Consentimento de cookies (conformidade LGPD)",
    ],
    color: "phase-indigo",
  },
  {
    weeks: "13–16",
    title: "Validação e Entrega",
    items: [
      "Testes de calibração de λ com dados sintéticos variando perfis",
      "Validação de edge cases e cenários de negociação",
      "Redação final do TCC",
      "Preparação e ensaio da defesa",
    ],
    color: "phase-purple",
  },
];

export function Timeline() {
  return (
    <section id="timeline" className="section section-dark" aria-labelledby="timeline-title">
      <div className="section-container">
        <div className="section-header">
          <h2 id="timeline-title" className="section-title">
            Cronograma
          </h2>
          <p className="section-subtitle">
            16 semanas de desenvolvimento a partir da apresentação do PAC VIII.
          </p>
        </div>

        <ol className="timeline-list" aria-label="Fases do desenvolvimento">
          {PHASES.map((phase, idx) => (
            <li key={phase.weeks} className={`timeline-item ${phase.color}`}>
              <div className="timeline-connector" aria-hidden="true">
                <div className="timeline-dot">{idx + 1}</div>
                {idx < PHASES.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-weeks">Semanas {phase.weeks}</span>
                  <h3 className="timeline-title-text">{phase.title}</h3>
                </div>
                <ul className="timeline-items" aria-label={`Entregas: ${phase.title}`}>
                  {phase.items.map((item) => (
                    <li key={item} className="timeline-task">
                      <span aria-hidden="true">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
