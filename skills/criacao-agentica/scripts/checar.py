#!/usr/bin/env python3
"""Checa a rastreabilidade dos documentos da metodologia de criação agêntica.

Uso: python checar.py [raiz-do-projeto] [--estrito]
     raiz padrão: diretório atual. Com --estrito, sai com código 1 se houver problema.

Só lê. Varre docs/ (recursivo, exceto docs/agents/) e GLOSSARY.md. Imprime
PROBLEMAS (inconsistências que a máquina consegue ver), FRONTEIRA (tarefas
prontas para começar) e PENDENTE (o que o estado pede agora). As convenções
que ele lê estão em references/modelos/README.md.
"""
import pathlib
import re
import sys
import unicodedata

PREFIXOS = ("REQ", "RN", "CA", "FLX", "DEC", "ADR", "TAR", "LAC", "INV")
ID = re.compile(r"\b(?:%s)-\d{3,}\b" % "|".join(PREFIXOS))
# Define um ID: no começo da linha ou de um título. Itens de lista e tabelas só referenciam.
DEF = re.compile(r"^(#{1,6}\s+)?(?:\*\*)?((?:%s)-\d{3,})\b" % "|".join(PREFIXOS))
TITULO = re.compile(r"^(#{1,6})\s")
ADR_ARQ = re.compile(r"^(\d{4})-")
SO_REFERENCIA = {"ESTADO.md"}
SEM_GLOSSARIO = {"brief.md"}  # texto literal da pessoa: não se corrige
CONCLUIDA = {"concluida", "integrada", "publicada"}
ROTULO = {"concluida": "concluída", "integrada": "integrada", "publicada": "publicada"}


def norm(texto):
    sem_acento = unicodedata.normalize("NFD", texto)
    return "".join(c for c in sem_acento if unicodedata.category(c) != "Mn").lower()


def prefixo(i):
    return i.split("-")[0]


def arquivos(raiz):
    docs = raiz / "docs"
    lista = [p for p in sorted(docs.rglob("*.md")) if "agents" not in p.relative_to(docs).parts]
    return lista


def ler(raiz):
    blocos, refs, duplicados = {}, [], []
    for arq in arquivos(raiz):
        nome = arq.relative_to(raiz).as_posix()
        linhas = arq.read_text(encoding="utf-8").splitlines()
        atual, nivel = None, 0
        m_adr = ADR_ARQ.match(arq.name) if arq.parent.name == "adr" else None
        if m_adr:
            atual, nivel = f"ADR-{m_adr.group(1)}", 0
            blocos[atual] = {"arq": nome, "linha": 1, "texto": [], "refs": set()}
        em_cerca = em_comentario = False
        for n, linha in enumerate(linhas, 1):
            s = linha.strip()
            if s.startswith("```"):
                em_cerca = not em_cerca
                continue
            if em_comentario or s.startswith("<!--"):
                em_comentario = "-->" not in s
                continue
            if em_cerca:
                continue
            t = TITULO.match(s)
            d = DEF.match(s) if arq.name not in SO_REFERENCIA and not m_adr else None
            # Arquivo de tarefa ou de ticket de decisão define só o próprio ID.
            if d and arq.parent.name == "tarefas" and prefixo(d.group(2)) != "TAR":
                d = None
            if d and "mapas" in arq.parts and prefixo(d.group(2)) != "LAC":
                d = None
            if d:
                atual = d.group(2)
                nivel = len(d.group(1).strip()) if d.group(1) else 99
                if atual in blocos:
                    duplicados.append((atual, nome, n, blocos[atual]))
                blocos[atual] = {"arq": nome, "linha": n, "texto": [], "refs": set()}
            elif t and atual and len(t.group(1)) <= nivel:
                atual = None
            if atual:
                blocos[atual]["texto"].append(s)
            for m in ID.finditer(s):
                alvo = m.group(0)
                if d and m.start() == s.find(d.group(2)) and alvo == d.group(2):
                    continue
                refs.append((alvo, nome, n, atual))
                if atual:
                    blocos[atual]["refs"].add(alvo)
    return blocos, refs, duplicados


def campo(bloco, nome):
    for s in bloco["texto"]:
        if norm(s).startswith(nome + ":"):
            return s.split(":", 1)[1].strip()
    return ""


def estado_tar(bloco):
    e = norm(campo(bloco, "estado")).strip(" [].")
    for chave in ("a fazer", "em execucao", "em revisao"):
        if e.startswith(chave):
            return chave
    return e.split(" ")[0] if e else ""


def bloqueios(bloco):
    return ID.findall(campo(bloco, "bloqueada por"))


def lac_resolvida(bloco):
    return "resolvida" in norm(" ".join(bloco["texto"]))


def verificacoes(bloco):
    """CA-ID -> resultado normalizado, a partir de linhas '- CA-xxx: resultado'."""
    res = {}
    for s in bloco["texto"]:
        m = re.match(r"^[-*]\s*(CA-\d{3,})\s*:\s*(.+)", s)
        if m:
            r = norm(m.group(2))
            for chave in ("nao atendido", "atendido", "nao verificavel"):
                if r.startswith(chave):
                    res[m.group(1)] = chave
                    break
    return res


def achados_abertos(bloco):
    """Linhas '- [deve-corrigir] ... — <resposta>' sem 'corrigido' nem 'descartado' depois do travessão."""
    abertos = []
    for s in bloco["texto"]:
        m = re.match(r"^[-*]\s*\[deve-corrigir\]\s*(.+)", norm(s))
        if m:
            resposta = re.split(r"\s[—–-]\s", m.group(1))[-1] if re.search(r"\s[—–-]\s", m.group(1)) else ""
            if "corrigido" not in resposta and "descartado" not in resposta:
                abertos.append(s.split("]", 1)[1].strip()[:60])
    return abertos


def termos_proibidos(raiz):
    glossario = raiz / "GLOSSARY.md"
    if not glossario.exists():
        return [], ["GLOSSARY.md não existe na raiz; nomes de domínio não têm referência"]
    termos, termo_atual = [], None
    for s in glossario.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\*\*(.+?)\*\*\s*:", s.strip())
        if m:
            termo_atual = m.group(1)
        m = re.match(r"^_(?:evitar|avoid)_\s*:\s*(.+)", norm(s.strip()))
        if m and termo_atual:
            bruto = s.split(":", 1)[1]
            for termo in bruto.split(","):
                termo = termo.strip().strip(".")
                if termo and "[" not in termo:
                    termos.append((termo, termo_atual))
    achados = []
    for termo, canonico in termos:
        padrao = re.compile(r"(?<!\w)%s(?!\w)" % re.escape(norm(termo)))
        for arq in arquivos(raiz):
            if arq.name in SEM_GLOSSARIO:
                continue
            for n, s in enumerate(arq.read_text(encoding="utf-8").splitlines(), 1):
                if padrao.search(norm(s)):
                    achados.append(f"{arq.relative_to(raiz).as_posix()}:{n} usa \"{termo}\"; "
                                   f"o termo canônico é \"{canonico}\"")
    return achados, []


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    estrito = "--estrito" in sys.argv
    raiz = pathlib.Path(args[0] if args else ".")
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if not (raiz / "docs").is_dir():
        print(f"{raiz / 'docs'} não encontrada. O projeto ainda não adotou o método: modo Iniciar ou Adotar.")
        return 0

    blocos, refs, duplicados = ler(raiz)
    problemas, pendente = [], []
    ids = lambda p: sorted(i for i in blocos if prefixo(i) == p)

    if not (raiz / "docs" / "ESTADO.md").exists():
        problemas.append("docs/ESTADO.md não existe; a próxima sessão não terá ponto de retomada")
    if (raiz / "docs" / "agents").is_dir() and not (raiz / "docs" / "agents" / "issue-tracker.md").exists():
        problemas.append("docs/agents/issue-tracker.md não existe; as skills do motor não sabem onde gravar")

    for i, arq, n, antigo in duplicados:
        problemas.append(f"{i} definido duas vezes: {antigo['arq']}:{antigo['linha']} e {arq}:{n}")

    vistos = set()
    for alvo, arq, n, _ in refs:
        if alvo not in blocos and alvo not in vistos:
            vistos.add(alvo)
            problemas.append(f"{arq}:{n} referencia {alvo}, que não está definido em lugar nenhum")

    adiado = lambda i: "[adiado" in norm(" ".join(blocos[i]["texto"]))

    # REQ -> CA
    for req in ids("REQ"):
        if adiado(req):
            continue
        tem_ca = any(prefixo(r) == "CA" for r in blocos[req]["refs"]) or any(
            req in blocos[ca]["refs"] for ca in ids("CA"))
        if not tem_ca:
            problemas.append(f"{req} ({blocos[req]['arq']}:{blocos[req]['linha']}) não tem critério de aceite")
            pendente.append(f"Especificar critérios de aceite de {req}")

    # CA -> TAR
    tars = ids("TAR")
    for ca in ids("CA"):
        if adiado(ca):
            continue
        if not any(ca in blocos[t]["refs"] for t in tars):
            problemas.append(f"{ca} ({blocos[ca]['arq']}:{blocos[ca]['linha']}) não é implementado por nenhuma TAR")
            pendente.append(f"Fatiar em TAR o que implementa {ca}")

    # LAC: o que bloqueia o quê
    lacs_abertas = [l for l in ids("LAC") if not lac_resolvida(blocos[l])]
    bloqueia = {}
    for lac in lacs_abertas:
        if "bloqueia-tarefa" in norm(" ".join(blocos[lac]["texto"])):
            for t in blocos[lac]["refs"]:
                if prefixo(t) == "TAR":
                    bloqueia.setdefault(t, set()).add(lac)
    for t in tars:
        for b in bloqueios(blocos[t]):
            if prefixo(b) == "LAC" and b in lacs_abertas:
                bloqueia.setdefault(t, set()).add(b)
    por_lac = {}
    for t, ls in bloqueia.items():
        for l in ls:
            por_lac.setdefault(l, set()).add(t)
    for lac in sorted(por_lac):
        tipo = campo(blocos[lac], "resolucao") or campo(blocos[lac], "resolução")
        tipo = f" (resolução: {tipo})" if tipo and "[" not in tipo else ""
        pendente.append(f"Decidir {lac}{tipo} — bloqueia {', '.join(sorted(por_lac[lac]))}")
    # Tickets de decisão de mapas (wayfinder) prontos para resolver
    decisoes = []
    for lac in lacs_abertas:
        if lac in por_lac or "mapas" not in blocos[lac]["arq"].split("/"):
            continue
        if "reivindicada" in norm(campo(blocos[lac], "estado")):
            continue
        if all(b not in lacs_abertas for b in bloqueios(blocos[lac])):
            tipo = campo(blocos[lac], "resolucao") or campo(blocos[lac], "resolução")
            decisoes.append(f"{lac} ({tipo})" if tipo else lac)
    if decisoes:
        pendente.append("Decisões na fronteira dos mapas: " + ", ".join(decisoes))

    # TAR: estado, evidência e fronteira
    contagem, fronteira, esperando = {}, [], []
    for t in tars:
        est = estado_tar(blocos[t])
        contagem[est or "sem estado"] = contagem.get(est or "sem estado", 0) + 1
        cas = sorted(r for r in blocos[t]["refs"] if prefixo(r) == "CA")
        if est in CONCLUIDA:
            rotulo = ROTULO[est]
            ver = verificacoes(blocos[t])
            sem_resultado = [ca for ca in cas if ca not in ver]
            reprovados = [ca for ca in cas if ver.get(ca) == "nao atendido"]
            if not ver:
                problemas.append(f"{t} está {rotulo} sem nenhuma verificação registrada")
            else:
                for ca in sem_resultado:
                    problemas.append(f"{t} está {rotulo}, mas {ca} não tem resultado de verificação")
            for ca in reprovados:
                problemas.append(f"{t} está {rotulo} com {ca} não atendido")
            abertos = achados_abertos(blocos[t])
            for a in abertos:
                problemas.append(f"{t} está {rotulo} com achado deve-corrigir sem resposta: {a}")
            if abertos:
                pendente.append(f"Responder os achados de {t}: corrigir ou descartar com motivo")
            elif reprovados:
                pendente.append(f"Corrigir {t} ({', '.join(reprovados)} não atendido) ou reabri-la")
            elif not ver or sem_resultado:
                pendente.append(f"Registrar a verificação de {t}")
            elif est == "concluida":
                pendente.append(f"Integrar {t}")
            continue
        if est == "em revisao":
            pendente.append(f"Revisar {t}")
            continue
        if est in ("em execucao", "descartada"):
            continue
        motivos = sorted(bloqueia.get(t, set()))
        for b in bloqueios(blocos[t]):
            if prefixo(b) == "TAR" and (b not in blocos or estado_tar(blocos[b]) not in CONCLUIDA):
                motivos.append(b)
        if motivos:
            esperando.append(f"{t} ← {', '.join(sorted(set(motivos)))}")
        else:
            fronteira.append(t)

    achados, avisos = termos_proibidos(raiz)
    problemas.extend(avisos + achados)

    resumo = " · ".join(f"{p} {len(ids(p))}" for p in PREFIXOS if ids(p))
    print(f"RESUMO: {resumo or 'nenhum ID definido'}")
    if contagem:
        print("TAR por estado: " + ", ".join(f"{k} {v}" for k, v in sorted(contagem.items())))
    print()
    print(f"PROBLEMAS ({len(problemas)}):")
    for p in problemas:
        print(f"  - {p}")
    if not problemas:
        print("  nenhum")
    print()
    print("FRONTEIRA (prontas para começar; a de menor número primeiro):")
    print("  " + (", ".join(fronteira) if fronteira else "vazia"))
    if esperando:
        print("  esperando: " + "; ".join(esperando))
    print()
    print("PENDENTE (o que o estado pede; ofereça, não execute por conta própria):")
    for p in pendente:
        print(f"  - {p}")
    if not pendente:
        print("  nada pendente pelos documentos")
    return 1 if estrito and problemas else 0


if __name__ == "__main__":
    sys.exit(main())
