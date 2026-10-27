# Banco de Dados — Catálogo Inteligente

Ambiente local do PostgreSQL com migrações versionadas via Flyway, materializando o modelo documentado em [frontend/docs/08-MODELO-DE-DADOS.md](../frontend/docs/08-MODELO-DE-DADOS.md).

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) rodando no Windows.
- Terminal (PowerShell ou Git Bash).

## Setup inicial

```bash
cp .env.example .env
```

Edite `.env` se quiser alterar usuário/senha padrão.

## Subir o banco e aplicar as migrações

```bash
docker compose up -d postgres
docker compose run --rm flyway migrate
```

Na primeira execução, o Flyway aplica V001 → V011 em ordem. O comando `migrate` é idempotente: nas execuções seguintes só aplica migrações novas.

## RabbitMQ (API / eventos)

Necessário para o backend Spring (`spring-boot-starter-amqp`):

```bash
docker compose up -d rabbitmq
```

| Campo | Valor |
|---|---|
| AMQP | `localhost:5672` |
| Management UI | <http://localhost:15672> |
| User / Password | `guest` / `guest` (ou `.env`) |

Subir Postgres + Rabbit juntos:

```bash
docker compose up -d postgres rabbitmq
```


### Comandos úteis

```bash
docker compose run --rm flyway info          # mostra o status de cada migração
docker compose run --rm flyway validate      # valida que as migrações batem com o histórico
docker compose logs -f postgres              # acompanha logs do banco
docker compose down                          # para tudo (mantém os dados)
docker compose down -v                       # para tudo E apaga os dados (recomeça do zero)
```

## pgAdmin (opcional)

```bash
docker compose --profile tools up -d pgadmin
```

Acesse: <http://localhost:5050>

Login padrão: `admin@catalogo.local` / `admin` (configurável no `.env`).

Para conectar ao banco dentro do pgAdmin, cadastre um servidor com:
- Host: `postgres`
- Porta: `5432`
- Database: `catalogo`
- User/Password: conforme `.env`

## Conectar via psql ou DBeaver (direto do host)

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Porta | `5432` |
| Database | `catalogo` |
| User | `catalogo` |
| Password | `catalogo` (ou o que estiver em `.env`) |

Via `psql` dentro do próprio container:

```bash
docker compose exec postgres psql -U catalogo -d catalogo
```

## Credenciais do admin (seed)

Criadas pelo `V011__seed_demo_data.sql`. **Para desenvolvimento apenas** — alterar antes de qualquer deploy.

- **E-mail:** `admin@catalogo.local`
- **Senha:** `admin123`

O hash é gerado em tempo de seed com `crypt('admin123', gen_salt('bf', 10))` (pgcrypto), produzindo um bcrypt `$2a$` compatível com `BCryptPasswordEncoder` do Spring Security.

## Estrutura dos arquivos

```
database/
├── docker-compose.yml         # postgres + flyway + pgadmin
├── .env.example               # variáveis (copiar para .env)
└── migrations/
    ├── V001__create_enums.sql
    ├── V002__create_core_tables.sql        # usuario, visitante, consentimento_lgpd
    ├── V003__create_catalog_tables.sql     # categoria, produto, produto_imagem, favorito
    ├── V004__create_behavior_tables.sql    # sessao, evento, compra
    ├── V005__create_scoring_tables.sql     # scores + grafo
    ├── V006__create_config_tables.sql      # peso_metrica, parametro_decay
    ├── V007__create_lgpd_tables.sql        # solicitacao_lgpd
    ├── V008__create_indexes.sql
    ├── V009__create_updated_at_trigger.sql
    ├── V010__seed_config.sql               # pesos padrão + λ global
    ├── V011__seed_demo_data.sql            # admin + categorias + produtos
    └── V012__align_scoring_decay_auth.sql  # XOR scores, boost_conversao, favorito.deleted_at, password_reset_token
```

Após puxar o repositório com V012 (ou qualquer migração nova):

```bash
docker compose run --rm flyway migrate
```

## Adicionando novas migrações

1. Crie um novo arquivo em `migrations/` seguindo a convenção `V{numero}__{descricao}.sql`.
   - Exemplo: `V013__add_coluna_x_em_produto.sql`.
2. Rode `docker compose run --rm flyway migrate`.

**Nunca** edite uma migração que já foi aplicada no histórico — o Flyway detecta e rejeita. Sempre faça uma nova migração para alterar o schema.

## Verificação rápida

Após `flyway migrate`, conecte via psql e cheque:

```sql
-- 7 enums
\dT+

-- 18 tabelas (incl. password_reset_token a partir de V012)
\dt

-- Pesos de métrica populados
SELECT * FROM peso_metrica;

-- Admin seed
SELECT id, email, tipo FROM usuario WHERE tipo = 'ADMIN';

-- Produtos de exemplo
SELECT p.nome, c.nome AS categoria, p.preco
  FROM produto p
  JOIN categoria c ON c.id = p.categoria_id
 ORDER BY p.id;
```

## Troubleshooting

- **"port 5432 already in use":** você já tem um Postgres instalado no Windows ocupando a porta. Pare o serviço local ou mude a porta exposta em `docker-compose.yml` (`"5433:5432"`, por exemplo).
- **Flyway reclamando de "checksum mismatch":** uma migração foi editada depois de aplicada. Para desenvolvimento, derrube com `docker compose down -v` e aplique tudo de novo. Em produção, isso jamais deve acontecer.
- **pgAdmin não abre:** confirme que subiu com o perfil `tools` (`docker compose --profile tools up -d pgadmin`).
