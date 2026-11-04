"""Hook PreToolUse da criacao-agentica: impõe as regras de git do método.

Só age em projetos com docs/ESTADO.md; nos demais, sai em silêncio.
- commit com TAR concluída sem registro completo: barrado (deny), com o que falta;
- push, ou commit/merge na main ou master: pede a confirmação da pessoa (ask).
Sucesso é silencioso: sem saída, a permissão segue o fluxo normal.
"""
import json
import pathlib
import re
import subprocess
import sys

# shortcut: lê só `cd X &&` e `git -C X` simples, sem variáveis nem subshell; basta para os comandos do agente
GIT = re.compile(r"\bgit((?:\s+-C\s+\S+)*)\s+(commit|merge|push)\b")
CD = re.compile(r"\bcd\s+(\"[^\"]+\"|'[^']+'|\S+)\s*(?:&&|;)")
TAR_SEM_REGISTRO = re.compile(r"^\s+- (TAR-\S+ está .+)$", re.M)
CHECAR = pathlib.Path(__file__).resolve().parent.parent / "skills" / "criacao-agentica" / "scripts" / "checar.py"


def git(pasta, *args):
    r = subprocess.run(["git", "-C", str(pasta), *args], capture_output=True, text=True, encoding="utf-8")
    return r.stdout.strip() if r.returncode == 0 else ""


def acoes(comando, cwd):
    for m in GIT.finditer(comando):
        pasta = pathlib.Path(cwd)
        for cd in CD.finditer(comando, 0, m.start()):
            pasta = pasta / cd.group(1).strip("\"'")
        for c in re.findall(r"-C\s+(\S+)", m.group(1)):
            pasta = pasta / c.strip("\"'")
        yield m.group(2), pasta


def tar_sem_registro(raiz):
    r = subprocess.run([sys.executable, str(CHECAR), raiz], capture_output=True, text=True, encoding="utf-8")
    return TAR_SEM_REGISTRO.findall(r.stdout)


def decidir(decisao, motivo):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decisao,
        "permissionDecisionReason": motivo,
    }}))  # ASCII com escapes: o console do Windows não é UTF-8
    return 0


def main():
    dados = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    comando = (dados.get("tool_input") or {}).get("command") or ""
    pedidos = []
    for verbo, pasta in acoes(comando, dados.get("cwd") or "."):
        raiz = git(pasta, "rev-parse", "--show-toplevel")
        if not raiz or not (pathlib.Path(raiz) / "docs" / "ESTADO.md").exists():
            continue
        if verbo == "commit":
            faltas = tar_sem_registro(raiz)
            if faltas:
                return decidir("deny", "criacao-agentica: commit barrado. TAR marcada concluída sem registro completo:\n- "
                               + "\n- ".join(faltas)
                               + "\nRegistre o resultado de cada CA e responda os achados deve-corrigir, "
                               "ou volte a TAR para 'em execução'; depois faça o commit de novo.")
        ramo = git(pasta, "branch", "--show-current")
        if verbo == "push":
            pedidos.append("push envia o trabalho para fora")
        elif ramo in ("main", "master"):
            pedidos.append(f"{verbo} na {ramo} integra na base")
    if pedidos:
        return decidir("ask", "criacao-agentica: " + "; ".join(dict.fromkeys(pedidos))
                       + ". Pede a aprovação da pessoa (autonomia em docs/README.md).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
