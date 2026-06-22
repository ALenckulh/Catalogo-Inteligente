const CARDS = [
  {
    icon: "🎯",
    title: "Problema",
    description:
      "Empresas B2B não conseguem identificar leads qualificados em catálogos digitais porque as negociações ocorrem fora da plataforma (WhatsApp, telefone) e os ciclos de decisão duram meses.",
  },
  {
    icon: "💡",
    title: "Solução",
    description:
      "Um motor de scoring que atribui intenção de compra a produtos e categorias a partir de dados comportamentais, funcionando a partir de uma única interação — sem massa crítica de usuários.",
  },
  {
    icon: "⚡",
    title: "Diferencial",
    description:
      "Decaimento temporal calibrado especificamente para ciclos B2B longos, com pausa automática durante negociações ativas — impedindo que leads reais sejam deprioritizados por inatividade passiva.",
  },
  {
    icon: "🔒",
    title: "Conformidade",
    description:
      "Conformidade com a LGPD por meio de consentimento explícito de cookies para usuários anônimos e checkbox de opt-in para usuários autenticados.",
  },
];

export function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="section-container">
        <div className="section-header">
          <h2 id="about-title" className="section-title">
            Sobre o Projeto
          </h2>
          <p className="section-subtitle">
            Um catálogo online com sistema de recomendação focado em ambientes B2B,
            com suporte complementar a B2C.
          </p>
        </div>

        <div className="cards-grid" role="list">
          {CARDS.map((card) => (
            <article key={card.title} className="card" role="listitem">
              <div className="card-icon" aria-hidden="true">{card.icon}</div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </article>
          ))}
        </div>

        <blockquote className="hypothesis-block">
          <p className="hypothesis-label">Hipótese Central</p>
          <p className="hypothesis-text">
            &ldquo;Um modelo de scoring baseado em regras ponderadas com decaimento
            temporal, calibrado para os ciclos de compra longos do B2B (e com pausa
            durante negociações ativas), é suficiente para gerar sinais de intenção de
            compra interpretáveis e úteis a partir de{" "}
            <strong>uma única interação do usuário</strong> — sem depender de volume
            real de usuários.&rdquo;
          </p>
        </blockquote>
      </div>
    </section>
  );
}
