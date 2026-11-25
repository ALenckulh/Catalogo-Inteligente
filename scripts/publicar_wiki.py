"""Gera as páginas da Wiki do GitHub a partir de docs/ e do README, e publica.

    python scripts/publicar_wiki.py --saida pasta   # só gera as páginas, sem publicar
    python scripts/publicar_wiki.py                 # gera e envia para a Wiki

A fonte é o repositório: edite docs/ e rode de novo. Só entram as páginas de GRUPOS.
Antes da primeira publicação, crie uma página qualquer na aba Wiki do GitHub; até lá
o repositório da Wiki não existe.
"""
import argparse
import pathlib
import posixpath
import re
import subprocess
import sys
import tempfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
GITHUB = "https://github.com/ALenckulh/Catalogo-Inteligente"

# Grupo da barra lateral -> (arquivo, página da Wiki, título). Lista fechada de propósito.
GRUPOS = {
    "Projeto": [
        ("README.md", "Home", "Início"),
        ("docs/01-VISAO-GERAL.md", "Visao-Geral", "Visão geral"),
        ("docs/02-REQUISITOS.md", "Requisitos", "Requisitos"),
        ("docs/14-CASOS-DE-USO.md", "Casos-de-Uso", "Casos de uso"),
        ("docs/13-MUDANCAS-DE-ESCOPO.md", "Mudancas-de-Escopo", "Mudanças de escopo"),
        ("docs/06-METODOLOGIA-E-CRONOGRAMA.md", "Metodologia", "Metodologia"),
    ],
    "Arquitetura": [
        ("docs/05-ARQUITETURA.md", "Arquitetura", "Visão C4"),
        ("docs/12-ARQUITETURA-BACKEND.md", "Arquitetura-Backend", "Backend"),
        ("docs/10-ARQUITETURA-FRONTEND.md", "Arquitetura-Frontend", "Frontend"),
        ("docs/08-MODELO-DE-DADOS.md", "Modelo-de-Dados", "Modelo de dados"),
        ("docs/11-API-ENDPOINTS.md", "API", "API"),
    ],
    "Produto": [
        ("docs/04-ESPECIFICACAO-TECNICA.md", "Especificacao-Tecnica", "Especificação do score"),
        ("docs/03-PAGINAS-E-UX.md", "Paginas-e-UX", "Páginas e UX"),
        ("docs/09-NORMAS-DE-USABILIDADE.md", "Normas-de-Usabilidade", "Normas de usabilidade"),
    ],
    "Padrões do frontend": [
        ("docs/padroes/PAGES.md", "Padrao-Paginas", "Páginas"),
        ("docs/padroes/HOOKS.md", "Padrao-Hooks", "Hooks"),
        ("docs/padroes/CONTEXTS.md", "Padrao-Contexts", "Contexts"),
        ("docs/padroes/SERVICES.md", "Padrao-Services", "Services"),
        ("docs/padroes/FORMATTERS.md", "Padrao-Formatters", "Formatters"),
    ],
    "Portfólio": [
        ("docs/PORTFOLIO.md", "Portfolio", "Portfólio"),
        ("docs/07-REFERENCIAS.md", "Referencias", "Referências"),
    ],
}
PAGINAS = {arq: pag for itens in GRUPOS.values() for arq, pag, _ in itens}
PAGINAS["docs/README.md"] = "Home"  # o índice de docs/ vira a própria barra lateral
SENHAS_DEMO = ("admin123", "demo123", "senha123")

LINK = re.compile(r"(\]\()([^)\s]+)(\))")


def converter_link(alvo: str, pasta: str) -> str:
    """Link relativo do repositório -> página da Wiki ou arquivo no GitHub."""
    if re.match(r"(https?:|mailto:|#)", alvo):
        return alvo
    caminho, _, ancora = alvo.partition("#")
    rel = posixpath.normpath(posixpath.join(pasta, caminho))
    sufixo = f"#{ancora}" if ancora else ""
    if rel in PAGINAS:
        return PAGINAS[rel] + sufixo
    local = RAIZ / rel
    if not local.exists():
        raise ValueError(f"link quebrado: {alvo}")
    return f"{GITHUB}/{'tree' if local.is_dir() else 'blob'}/main/{rel}{sufixo}"


def converter(arquivo: str) -> str:
    pasta = posixpath.dirname(arquivo)
    saida, em_codigo = [], False
    for linha in (RAIZ / arquivo).read_text(encoding="utf-8").splitlines():
        if linha.lstrip().startswith("```"):
            em_codigo = not em_codigo
        elif not em_codigo:
            linha = LINK.sub(lambda m: m[1] + converter_link(m[2], pasta) + m[3], linha)
        saida.append(linha)
    texto = "\n".join(saida) + "\n"
    for senha in SENHAS_DEMO:
        if senha in texto:
            raise ValueError(f"senha de demonstração na página: {senha}")
    return texto


def gerar(destino: pathlib.Path) -> int:
    erros = []
    paginas = {}
    for itens in GRUPOS.values():
        for arquivo, pagina, _ in itens:
            try:
                paginas[pagina] = converter(arquivo)
            except (ValueError, OSError) as e:
                erros.append(f"{arquivo}: {e}")
    if erros:
        sys.exit("Nada foi gerado:\n  " + "\n  ".join(erros))
    paginas["_Sidebar"] = "\n\n".join(
        f"**{grupo}**\n\n" + "\n".join(f"- [{titulo}]({pagina})" for _, pagina, titulo in itens)
        for grupo, itens in GRUPOS.items()
    ) + "\n"
    destino.mkdir(parents=True, exist_ok=True)
    for pagina, texto in paginas.items():
        (destino / f"{pagina}.md").write_text(texto, encoding="utf-8", newline="\n")
    return len(paginas)


def git(*args: str, cwd: pathlib.Path) -> str:
    r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, encoding="utf-8")
    if r.returncode:
        sys.exit(f"git {args[0]} falhou:\n{r.stderr.strip()}")
    return r.stdout.strip()


def publicar(mensagem: str) -> None:
    origem = git("remote", "get-url", "origin", cwd=RAIZ)
    url = re.sub(r"(\.git)?$", ".wiki.git", origem, count=1)
    with tempfile.TemporaryDirectory() as tmp:
        wiki = pathlib.Path(tmp) / "wiki"
        git("clone", "-q", url, str(wiki), cwd=RAIZ)
        total = gerar(wiki)
        git("add", "-A", cwd=wiki)
        if not git("status", "--porcelain", cwd=wiki):
            print("Nada mudou na Wiki.")
            return
        for chave in ("user.name", "user.email"):
            git("config", chave, git("config", chave, cwd=RAIZ), cwd=wiki)
        git("commit", "-q", "-m", mensagem, cwd=wiki)
        git("push", "-q", cwd=wiki)
        print(f"{total} páginas publicadas em {GITHUB}/wiki")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--saida", type=pathlib.Path, help="gera as páginas nesta pasta e não publica")
    p.add_argument("-m", "--mensagem", default="docs: atualiza a Wiki a partir de docs/")
    args = p.parse_args()
    if args.saida:
        print(f"{gerar(args.saida)} páginas geradas em {args.saida}")
    else:
        publicar(args.mensagem)
