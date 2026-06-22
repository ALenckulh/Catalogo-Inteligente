const MODELS = [
  {
    name: "KNN / Neighborhood",
    interpretability: "Alta",
    sparsity: "Média",
    minData: "Baixo",
    anon: "Sim",
    coldStart: "Sim",
    b2bCalib: "✗",
    scalability: "Baixa",
    status: "future",
    statusLabel: "Trabalho futuro",
  },
  {
    name: "Grafo / PPR",
    interpretability: "Média",
    sparsity: "Alta",
    minData: "Baixo",
    anon: "Sim",
    coldStart: "Sim",
    b2bCalib: "✗",
    scalability: "Média",
    status: "future",
    statusLabel: "Trabalho futuro",
  },
  {
    name: "Regras + Decay",
    interpretability: "Alta",
    sparsity: "Alta",
    minData: "Nenhum",
    anon: "Sim",
    coldStart: "Sim (fallback)",
    b2bCalib: "✓ Núcleo",
    scalability: "Alta",
    status: "implemented",
    statusLabel: "✓ Implementado",
  },
  {
    name: "Regras Sequenciais",
    interpretability: "Alta",
    sparsity: "Média",
    minData: "Baixo",
    anon: "Sim",
    coldStart: "Sim",
    b2bCalib: "✗",
    scalability: "Alta",
    status: "future",
    statusLabel: "Trabalho futuro",
  },
  {
    name: "Matrix Factorization",
    interpretability: "Baixa",
    sparsity: "Baixa",
    minData: "Alto",
    anon: "Não",
    coldStart: "Não",
    b2bCalib: "✗",
    scalability: "Alta",
    status: "future",
    statusLabel: "Trabalho futuro",
  },
];

const HEADERS = [
  "Modelo",
  "Interpretabilidade",
  "Resistência esparsidade",
  "Vol. mín. dados",
  "Usuário anônimo",
  "Cold start",
  "Calibração B2B",
  "Escalabilidade",
  "Status",
];

export function ModelsTable() {
  return (
    <section id="models" className="section" aria-labelledby="models-title">
      <div className="section-container">
        <div className="section-header">
          <h2 id="models-title" className="section-title">
            Comparação de Modelos
          </h2>
          <p className="section-subtitle">
            Por que regras ponderadas com decaimento temporal foram escolhidas como
            núcleo — e as demais técnicas adiadas para quando houver dados reais.
          </p>
        </div>

        <div className="table-wrapper" role="region" aria-label="Tabela comparativa de modelos de recomendação" tabIndex={0}>
          <table className="models-table">
            <thead>
              <tr>
                {HEADERS.map((h) => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map((model) => (
                <tr
                  key={model.name}
                  className={model.status === "implemented" ? "row-highlight" : ""}
                >
                  <td className="model-name">{model.name}</td>
                  <td>{model.interpretability}</td>
                  <td>{model.sparsity}</td>
                  <td>{model.minData}</td>
                  <td>{model.anon}</td>
                  <td>{model.coldStart}</td>
                  <td className={model.b2bCalib.startsWith("✓") ? "cell-positive" : "cell-negative"}>
                    {model.b2bCalib}
                  </td>
                  <td>{model.scalability}</td>
                  <td>
                    <span className={`table-badge ${model.status === "implemented" ? "badge-implemented" : "badge-future"}`}>
                      {model.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
