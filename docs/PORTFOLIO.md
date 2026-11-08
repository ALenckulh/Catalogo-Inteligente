# Portfólio — Catálogo Inteligente

Documento curto de alinhamento com o [Playbook da Católica SC](https://github.com/CatolicaSC-Portfolio/The-Portfolio-Playbook).

## Linha de projeto

**Web Apps** — [direction oficial](https://github.com/CatolicaSC-Portfolio/The-Portfolio-Playbook/blob/main/directions/portfolio-directions-webapp.md).

O núcleo é uma aplicação web completa (Next.js + Spring Boot + PostgreSQL), com arquitetura em camadas, mensageria e área administrativa. A linha **IA** não é a linha oficial deste projeto: o motor entregue é **scoring por regras + decay**, não um pipeline ML/DL.

## Posicionamento (tema)

Não é um e-commerce genérico (carrinho, frete, pagamento). É um **catálogo B2B** focado em:

1. Coleta de comportamento de visitantes e usuários
2. Score de intenção de compra (Camadas 1 e 2)
3. **Leads priorizados** para o dono do catálogo
4. Conversão externa (ex. WhatsApp)

Isso diferencia o trabalho de lojas virtuais genéricas (tema marcado como evitar no Playbook).

## Diferenciais técnicos

| Item | Papel |
|------|--------|
| RabbitMQ | Eventos comportamentais assíncronos; API não bloqueia na gravação/score |
| Dashboard admin | KPIs, leads, detalhe por usuário, CRUD de produtos, pesos/λ |
| JWT | Auth consumidor e admin |
| LGPD | Consentimento, exportação, exclusão / solicitações |

## Documentação e run local

| Recurso | Onde |
|---------|------|
| Visão, RF, arquitetura, API | [frontend/docs/](../frontend/docs/) |
| Backend | [backend/README.md](../backend/README.md) |
| Banco + RabbitMQ | [database/README.md](../database/README.md) |
| Visão geral do repo | [README.md](../README.md) |

Wiki do GitHub: a popular a partir destes docs (fase posterior do plano de conformidade).

## CI / SonarCloud

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — jobs `backend`, `frontend`, `sonar` em push/PR para `main`.

Gates locais (também no CI):

- Backend: `./gradlew test jacocoTestCoverageVerification` (≥75%)
- Frontend: `npm run test:coverage` (≥25%)

### Configurar SonarCloud (uma vez)

1. Criar conta/projeto em [SonarCloud](https://sonarcloud.io) e importar o repo GitHub `ALenckulh/Catalogo-Inteligente`
2. No GitHub → **Settings → Secrets and variables → Actions**: criar `SONAR_TOKEN` (token do SonarCloud)
3. Conferir [`sonar-project.properties`](../sonar-project.properties): `sonar.organization` e `sonar.projectKey` devem bater com o projeto criado no SonarCloud (ajuste se o import gerar outros IDs)
4. Após o push, checks esperados: `backend`, `frontend`, `sonar`

Sem `SONAR_TOKEN`, os jobs de teste ainda validam o código; o job `sonar` falha até o secret existir.

## Pendências explícitas (fora deste alinhamento)

- **Hospedagem pública** em cloud permitida (AWS/GCP/Azure etc.) — obrigatória para Demo Day; **não** Vercel/Netlify/Render
- Observabilidade (Actuator) e Wiki — fases seguintes
- Poster + QR apontando para URL pública
