const REFS = [
  {
    id: 1,
    authors: "LINDEN, G.; SMITH, B.; YORK, J.",
    title: "Amazon.com Recommendations: Item-to-Item Collaborative Filtering",
    venue: "IEEE Internet Computing, v. 7, n. 1, 2003",
    url: "https://doi.org/10.1109/MIC.2003.1167344",
  },
  {
    id: 2,
    authors: "YING, R. et al.",
    title: "Graph Convolutional Neural Networks for Web-Scale Recommender Systems",
    venue: "ACM SIGKDD, 2018",
    url: "https://doi.org/10.1145/3219819.3219890",
  },
  {
    id: 3,
    authors: "GOMEZ-URIBE, C. A.; HUNT, N.",
    title: "The Netflix Recommender System: Algorithms, Business Value, and Innovation",
    venue: "ACM TMIS, v. 6, n. 4, 2015",
    url: "https://doi.org/10.1145/2843948",
  },
  {
    id: 4,
    authors: "KOREN, Y.; BELL, R.; VOLINSKY, C.",
    title: "Matrix Factorization Techniques for Recommender Systems",
    venue: "IEEE Computer, v. 42, n. 8, 2009",
    url: "https://doi.org/10.1109/MC.2009.263",
  },
];

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="footer-project-name">Catálogo Inteligente</h2>
            <p className="footer-project-desc">
              Predição de Intenção de Compra em Catálogos B2B
            </p>
          </div>

          <div className="footer-author">
            <p className="footer-author-name">Ana Paula Lenckulh</p>
            <a
              href="mailto:lenckulh.ola@gmail.com"
              className="footer-author-email"
              aria-label="Email da autora"
            >
              lenckulh.ola@gmail.com
            </a>
            <p className="footer-institution">
              Centro Universitário Católica de Santa Catarina
              <br />
              Jaraguá do Sul, SC, Brasil
            </p>
          </div>

          <div className="footer-links">
            <p className="footer-links-title">Links</p>
            <nav aria-label="Links do projeto">
              <a
                href="https://github.com/ALenckulh/Catalogo-Inteligente"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                GitHub
              </a>
              <a href="#about" className="footer-link">Sobre o Projeto</a>
              <a href="#scoring" className="footer-link">Motor de Scoring</a>
              <a href="#models" className="footer-link">Modelos</a>
              <a href="#timeline" className="footer-link">Cronograma</a>
            </nav>
          </div>
        </div>

        <div className="footer-refs">
          <h3 className="footer-refs-title">Referências</h3>
          <ol className="refs-list">
            {REFS.map((ref) => (
              <li key={ref.id} className="ref-item">
                <span className="ref-authors">{ref.authors}</span>{" "}
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ref-title"
                >
                  {ref.title}
                </a>
                . <span className="ref-venue">{ref.venue}.</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="footer-bottom">
          <p>
            PAC VIII — 2026/1 · SBC Computing Reviews · Licença MIT
          </p>
        </div>
      </div>
    </footer>
  );
}
