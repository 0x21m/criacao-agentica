"""Hook PreToolUse da criacao-agentica para a ferramenta Agent: confere modelo e briefing de cada delegação.

Só age em projetos com docs/ESTADO.md ou docs/01-prd.md; nos demais, sai em silêncio.
- Agente genérico (general-purpose, Explore, Plan) sem `model` herda o modelo da sessão, quase sempre o mais caro.
- O briefing precisa das linhas Objetivo:, Pronto quando:, Resposta: e Pare quando: (references/orquestracao.md).
Nível transacional: recusa (deny). Demais níveis: avisa no contexto e deixa seguir.
"""
import json
import pathlib
import re
import subprocess
import sys
import unicodedata

GENERICOS = {"", "general-purpose", "explore", "plan", "claude"}
LINHAS = ("Objetivo:", "Pronto quando:", "Resposta:", "Pare quando:")


def sem_acento(texto):
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn").lower()


def raiz_do_projeto(cwd):
    r = subprocess.run(["git", "-C", cwd, "rev-parse", "--show-toplevel"], capture_output=True, text=True, encoding="utf-8")
    return pathlib.Path(r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else cwd)


def nivel(raiz):
    try:
        texto = (raiz / "docs" / "ESTADO.md").read_text(encoding="utf-8")
    except OSError:
        return ""
    m = re.search(r"^N[ií]vel:\s*(\S+)", texto, re.M)
    return sem_acento(m.group(1)) if m else ""


def problemas(entrada):
    tipo = (entrada.get("subagent_type") or "").strip()
    if tipo == "fork":
        return []  # a cópia da conversa herda contexto e modelo por desenho
    achados = []
    if not entrada.get("model") and tipo.lower() in GENERICOS:
        achados.append("sem `model`: o agente genérico herda o modelo da sessão; escolha pela tabela de references/orquestracao.md")
    texto = sem_acento(entrada.get("prompt") or "")
    faltam = [l for l in LINHAS if sem_acento(l) not in texto]
    if faltam:
        achados.append("briefing sem as linhas " + ", ".join(faltam))
    return achados


def main():
    dados = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    raiz = raiz_do_projeto(dados.get("cwd") or ".")
    if not ((raiz / "docs" / "ESTADO.md").exists() or (raiz / "docs" / "01-prd.md").exists()):
        return 0
    achados = problemas(dados.get("tool_input") or {})
    if not achados:
        return 0
    motivo = "criacao-agentica: delegação incompleta: " + "; ".join(achados) + "."
    saida = {"hookEventName": "PreToolUse"}
    if nivel(raiz) == "transacional":
        saida.update(permissionDecision="deny", permissionDecisionReason=motivo + " Complete e delegue de novo.")
    else:
        saida["additionalContext"] = motivo + " Segue por ser nível abaixo de transacional; corrija nas próximas."
    print(json.dumps({"hookSpecificOutput": saida}))  # ASCII com escapes: o console do Windows não é UTF-8
    return 0


if __name__ == "__main__":
    sys.exit(main())
