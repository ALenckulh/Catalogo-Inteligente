#!/usr/bin/env bash
# Recria as personas de demonstração (datas relativas a hoje) e recalcula as notas.
# Requer o Postgres do docker compose e o backend rodando.
#   bash database/seed/recarregar-demo.sh
set -euo pipefail
cd "$(dirname "$0")"

API="${API_URL:-http://localhost:8080/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@catalogo.local}"
ADMIN_SENHA="${ADMIN_SENHA:-admin123}"

MSYS_NO_PATHCONV=1 docker exec -i catalogo_postgres \
    psql -U "${POSTGRES_USER:-catalogo}" -d "${POSTGRES_DB:-catalogo}" -v ON_ERROR_STOP=1 -q < demo_personas.sql

TOKEN=$(curl -sf -X POST "$API/admin/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"senha\":\"$ADMIN_SENHA\"}" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then
    echo "Dados inseridos, mas o login admin falhou ($API). Suba o backend e rode de novo para recalcular as notas." >&2
    exit 1
fi

echo -n "Recálculo: "
curl -sf -X POST "$API/admin/configuracao/recalcular" -H "Authorization: Bearer $TOKEN"
echo
