"""Hook SessionStart e SubagentStart da criacao-agentica: põe o método e o índice das skills no contexto.

Só age em projetos com docs/ESTADO.md ou docs/01-prd.md; nos demais, sai em silêncio.
- SessionStart (início, resume, clear, compact): índice das skills + estado atual do checar.py.
- SubagentStart: índice curto, para o subagente saber que skill chamar.
"""
import json
import pathlib
import re
import subprocess
import sys

CHECAR = pathlib.Path(__file__).resolve().parent.parent / "skills" / "criacao-agentica" / "scripts" / "checar.py"

INDICE = """Família de skills e quando chamar cada uma:
- criacao-agentica:criacao-agentica — o método: modos, documentos, TAR, ESTADO, verificação, git.
- criacao-agentica:ca-dados — tabela, migração, RLS, função, saldo, ledger, dinheiro, período, tenancy ou qualquer invariante (registro INV).
- criacao-agentica:ca-arquitetura — módulo novo, ligar, desligar ou remover módulo, fronteira entre módulos, "onde fica isto"."""


def raiz_do_projeto(cwd):
    r = subprocess.run(["git", "-C", cwd, "rev-parse", "--show-toplevel"], capture_output=True, text=True, encoding="utf-8")
    return pathlib.Path(r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else cwd)


def usa_metodo(raiz):
    return (raiz / "docs" / "ESTADO.md").exists() or (raiz / "docs" / "01-prd.md").exists()


def estado_do_checar(raiz):
    try:
        r = subprocess.run([sys.executable, str(CHECAR), str(raiz)], capture_output=True, text=True,
                           encoding="utf-8", timeout=20)
    except (OSError, subprocess.TimeoutExpired):
        return "checar.py não rodou; rode-o no \"Ao entrar\"."
    linhas, bloco = [], None
    for linha in r.stdout.splitlines():
        if linha.startswith(("RESUMO", "TAR por estado")):
            linhas.append(linha)
        elif linha.startswith(("PROBLEMAS", "FRONTEIRA", "PENDENTE")):
            bloco, contados = linha.split(" (")[0].split(":")[0], 0
            linhas.append(linha)
        elif bloco and linha.startswith("  ") and contados < 4:
            linhas.append(linha)
            contados += 1
    return "\n".join(linhas) or "checar.py sem saída."


def proxima_acao(raiz):
    try:
        texto = (raiz / "docs" / "ESTADO.md").read_text(encoding="utf-8")
    except OSError:
        return ""
    m = re.search(r"^## Próxima ação\s*\n+(.+?)(?:\n\n|\n## |\Z)", texto, re.M | re.S)
    return m.group(1).strip()[:600] if m else ""


def main():
    dados = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    raiz = raiz_do_projeto(dados.get("cwd") or ".")
    if not usa_metodo(raiz):
        return 0
    if dados.get("hook_event_name") == "SubagentStart":
        texto = ("[criacao-agentica] Este projeto segue o método criacao-agentica. Use os termos do GLOSSARY.md e os IDs "
                 "de docs/ (REQ, CA, TAR, INV). Se a sua tarefa tocar dados ou módulos, carregue a skill indicada antes de agir.\n"
                 + INDICE)
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "SubagentStart", "additionalContext": texto}}))
        return 0
    partes = ["[criacao-agentica] Este projeto segue o método criacao-agentica. Antes do primeiro passo, carregue a skill "
              "criacao-agentica:criacao-agentica e siga o \"Ao entrar\" dela.", INDICE,
              "Estado agora (checar.py):\n" + estado_do_checar(raiz)]
    acao = proxima_acao(raiz)
    if acao:
        partes.append("Próxima ação registrada no ESTADO:\n" + acao)
    # JSON com escapes ASCII: o console do Windows não é UTF-8
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "\n\n".join(partes)}}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
