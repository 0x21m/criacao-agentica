<!-- Modelo da skill criacao-agentica. Copie para docs/02-trd.md e preencha.
Substitua os colchetes. Use [DESCONHECIDO] quando faltar informação e
[NÃO SE APLICA — motivo] quando o campo não fizer sentido. Preencha você mesmo
o que puder e marque [ASSUMIDO]; um contrato cheio de vazios devolve o trabalho. -->

# TRD — [produto]
O que é: Contrato técnico: como o sistema sustenta o resultado do PRD.
Governa: Arquitetura, integrações, restrições e requisitos técnicos.
Não duplica: Regras de negócio reescritas.
Versão e PRD de referência: [versões]

## Base existente
Repositório e arquitetura atual: [referências ou projeto novo]
O que preservar: [contratos, funcionalidades e restrições]

## Plataforma e componentes
Plataformas e navegadores suportados: [escopo]
Frontend: [tecnologia, versão ou política de versão e motivo]
Backend: [tecnologia, runtime e responsabilidade]
Persistência: [tecnologia, região quando pertinente e motivo]
Hospedagem: [componentes e ambientes]
Fluxo dos dados: [origem → processamento → persistência → resposta]
Fronteiras de confiança: [cliente, servidor e terceiros]

## Identidade e acesso
Autenticação: [provedor e mecanismo ou [NÃO SE APLICA — motivo]]
Papéis e autorização: [referência ao modelo do schema]
Sessão: [expiração, renovação e revogação conforme necessidade]

## Integrações
Por integração: [provedor, finalidade, contrato, timeout, limites,
falhas, repetição segura quando aplicável e responsável pela credencial]
Documentação primária: [URL, data e capacidade verificada]
Credenciais: [nomes/referências; nunca valores secretos]

## Requisitos técnicos verificáveis
Desempenho: [métrica, alvo, cenário, dispositivo e forma de medição]
Confiabilidade: [objetivo e evidência possível nesta fase]
Backup e recuperação: [abrangência, frequência e teste de restauração]
Dados sensíveis: [minimização e referência às regras do schema]
Logs: [eventos necessários, retenção e dados que devem ser omitidos]

## Ambientes e entrega
Desenvolvimento/homologação/produção: [diferenças e configuração]
Instalação, execução, verificação e build: [comandos reais após validação]
Entrega: [pipeline, responsáveis e estratégia de recuperação]

## Decisões técnicas
DEC-[ID]: [contexto, decisão, motivo, alternativas, consequências,
estado e condição que justificaria revisar a escolha]
## Perguntas e lacunas
LAC-[ID] [marcador] [descrição]
Refs: [IDs] | Impacto: [bloqueia-tarefa TAR-IDs / bloqueia-futura / não-bloqueia]
Resolução: [pesquisa / protótipo / entrevista / tarefa manual]
Proposta: [recomendação] | Responsável: [quem decide] | Estado: [aberta/resolvida por DEC-ID ou ADR-NNNN]

<!-- Pronto para uso: o agente consegue preparar e executar a solução sem escolher sozinho componentes estruturais. Metas numéricas precisam de contexto: latência de API, resposta visual e carregamento inicial são medidas diferentes. -->
