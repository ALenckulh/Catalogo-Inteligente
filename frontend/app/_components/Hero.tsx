"use client";

import { useEffect, useRef } from "react";

const TECH_BADGES = [
  { label: "Next.js 16", color: "badge-neutral" },
  { label: "React 19", color: "badge-blue" },
  { label: "Python", color: "badge-yellow" },
  { label: "TypeScript", color: "badge-blue" },
  { label: "B2B", color: "badge-violet" },
  { label: "LGPD", color: "badge-green" },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMouse = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mouse-x", `${x}%`);
      el.style.setProperty("--mouse-y", `${y}%`);
    };
    el.addEventListener("mousemove", handleMouse);
    return () => el.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <section ref={containerRef} className="hero-section" aria-labelledby="hero-title">
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          PAC VIII — 2026/1 · Centro Universitário Católica de SC
        </div>

        <h1 id="hero-title" className="hero-title">
          Catálogo B2B
          <span className="hero-title-accent"> Inteligente</span>
        </h1>

        <p className="hero-subtitle">
          Sistema de recomendação baseado em scoring com decaimento temporal
          exponencial — predizendo intenção de compra a partir de{" "}
          <strong>uma única interação</strong>, sem depender de volume de dados.
        </p>

        <div className="hero-badges" role="list" aria-label="Tecnologias utilizadas">
          {TECH_BADGES.map((badge) => (
            <span key={badge.label} className={`badge ${badge.color}`} role="listitem">
              {badge.label}
            </span>
          ))}
        </div>

        <div className="hero-cta">
          <a href="#scoring" className="btn-primary">
            Ver o Motor de Scoring
          </a>
          <a
            href="https://github.com/ALenckulh/Catalogo-Inteligente"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            GitHub
          </a>
        </div>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="score-card">
          <div className="score-card-header">
            <span className="score-label">Score de Intenção</span>
            <span className="score-status active">● Negociação ativa</span>
          </div>
          <div className="score-value">87.4</div>
          <div className="score-formula">
            <code>Σ peso × evento × e<sup>−λt</sup></code>
          </div>
          <div className="score-metrics">
            {[
              { label: "Cliques", value: 12, weight: "0.3" },
              { label: "Favoritos", value: 3, weight: "0.5" },
              { label: "Contatos", value: 2, weight: "0.8" },
              { label: "Tempo", value: "4.2h", weight: "0.4" },
            ].map((m) => (
              <div key={m.label} className="score-metric-row">
                <span className="metric-label">{m.label}</span>
                <span className="metric-value">{m.value}</span>
                <span className="metric-weight">×{m.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
