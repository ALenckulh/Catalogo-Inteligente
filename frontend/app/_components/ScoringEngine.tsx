const LAYERS = [
  {
    id: 1,
    label: "Camada 1",
    title: "Popularidade Global",
    subtitle: "Cold Start",
    description:
      "Fallback para usuários novos e anônimos. Transição gradual para o score pessoal conforme interações são acumuladas.",
    status: "implemented",
    color: "layer-blue",
  },
  {
    id: 2,
    label: "Camada 2",
    title: "Regras Ponderadas + Decay",
    subtitle: "Núcleo — Implementado",
    description:
      "Score pessoal com pesos por tipo de interação e decaimento exponencial calibrado por perfil de produto (B2B vs. uso geral). Pausa automática por evento de contato.",
    status: "implemented",
    color: "layer-violet",
  },
  {
    id: 3,
    label: "Camada 3",
    title: "Regras Sequenciais + Grafo/PPR",
    subtitle: "Trabalho Futuro",
    description:
      "Padrões de navegação e Personalized PageRank em grafo heterogêneo. Exige padrões observáveis em múltiplos usuários.",
    status: "future",
    color: "layer-gray",
  },
  {
    id: 4,
    label: "Camada 4",
    title: "Collaborative Filtering",
    subtitle: "Trabalho Futuro",
    description:
      "Matrix Factorization e KNN/Neighborhood. Alta precisão, mas exige volume significativo de interações.",
    status: "future",
    color: "layer-gray",
  },
];

const METRICS = [
  { label: "Cliques", weight: 0.3, icon: "👆" },
  { label: "Pesquisas", weight: 0.4, icon: "🔍" },
  { label: "Favoritos", weight: 0.5, icon: "⭐" },
  { label: "Tempo de página", weight: 0.4, icon: "⏱️" },
  { label: "Retorno entre sessões", weight: 0.6, icon: "🔄" },
  { label: "Contato iniciado", weight: 0.8, icon: "📞" },
];

export function ScoringEngine() {
  return (
    <section id="scoring" className="section section-dark" aria-labelledby="scoring-title">
      <div className="section-container">
        <div className="section-header">
          <h2 id="scoring-title" className="section-title">
            Motor de Scoring
          </h2>
          <p className="section-subtitle">
            Arquitetura em camadas — do cold start ao score pessoal calibrado para B2B.
          </p>
        </div>

        <div className="formula-block" aria-label="Fórmula do Score de Produto">
          <p className="formula-label">Score de Produto</p>
          <div className="formula-equation">
            <span>Score</span>
            <span className="formula-eq">=</span>
            <span className="formula-sigma">Σ</span>
            <span>
              peso<sub>i</sub> × evento<sub>i</sub> × e
              <sup>−λ × t<sub>i</sub></sup>
            </span>
          </div>
          <p className="formula-note">
            λ calibrado por perfil: menor para B2B de ciclo longo · maior para reposição frequente
          </p>
        </div>

        <div className="metrics-grid" role="list" aria-label="Métricas comportamentais e seus pesos">
          {METRICS.map((metric) => (
            <div key={metric.label} className="metric-card" role="listitem">
              <span className="metric-icon" aria-hidden="true">{metric.icon}</span>
              <span className="metric-name">{metric.label}</span>
              <div className="metric-bar-container" aria-label={`Peso: ${metric.weight}`}>
                <div
                  className="metric-bar"
                  style={{ width: `${metric.weight * 100}%` }}
                />
              </div>
              <span className="metric-weight-label">peso {metric.weight}</span>
            </div>
          ))}
        </div>

        <div className="layers-list" role="list" aria-label="Camadas da arquitetura de recomendação">
          {LAYERS.map((layer) => (
            <div key={layer.id} className={`layer-card ${layer.color}`} role="listitem">
              <div className="layer-header">
                <div className="layer-id">{layer.id}</div>
                <div>
                  <p className="layer-label">{layer.label}</p>
                  <h3 className="layer-title">{layer.title}</h3>
                </div>
                <span className={`layer-badge ${layer.status === "implemented" ? "badge-implemented" : "badge-future"}`}>
                  {layer.subtitle}
                </span>
              </div>
              <p className="layer-description">{layer.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
