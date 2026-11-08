# Padrão — Formatters

Convenções para formatação de valores exibidos na UI. Complementa [../09-NORMAS-DE-USABILIDADE.md](../09-NORMAS-DE-USABILIDADE.md) §6.1 e [../10-ARQUITETURA-FRONTEND.md](../10-ARQUITETURA-FRONTEND.md).

---

## 1. Onde mora

Tudo em `lib/formatters.ts`. Funções puras — **não** são hooks.

Datas usam **dayjs** (já dependência do antd) com locale `pt-br`.

## 2. Funções

| Função | Uso |
|---|---|
| `toMoney(n)` | Número com 2 casas, pt-BR (`1.234,56`) |
| `toMoneyBRL(n)` | Prefixo `R$` + `toMoney` |
| `formatCpf` / `formatCnpj` | Máscara de exibição (não valida dígitos) |
| `formatTelefone` | `(47) 99999-0001` |
| `formatDate` / `formatDateTime` | dayjs; inválido → `—` |
| `onlyDigits` | Strip para inputs / payloads |

## 3. Regras

- Monetário / % / média na UI: **sempre 2 casas** via `toMoney` (ou equivalente).
- Não hardcode `toLocaleString` espalhado — passa pelo formatter.
- Validação de CPF/CNPJ (dígito verificador) fica fora deste arquivo até precisar; formatters só mascaram.

## 4. Exemplo

```tsx
import { toMoneyBRL, formatDate } from '@/lib/formatters'

<Text>{toMoneyBRL(produto.preco)}</Text>
<Text>{formatDate(produto.updatedAt)}</Text>
```

## 5. Checklist

- [ ] Valor monetário usa `toMoney` / `toMoneyBRL`
- [ ] Data usa `formatDate` / `formatDateTime` (não `new Date().toLocale…` solto)
- [ ] Sem lib extra de máscara — dayjs + funções locais
