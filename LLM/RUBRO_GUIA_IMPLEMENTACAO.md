# RUBRO — GUIA DE IMPLEMENTAÇÃO
### Documento orientador para Pessoa 1 e Pessoa 2

---

## LEITURA OBRIGATÓRIA ANTES DE COMEÇAR

Antes de qualquer ação, ambas as pessoas devem ter lido:

| Documento | O que define |
|---|---|
| `CORE_CONTEXT.md` | Dados, módulos, APIs, instâncias, eventos base, fórmulas |
| `UI_CONTEXT.md` | Visual, paleta, tipografia, animações, layout, feedback |
| `GLOBAL_UI_STATES.md` | Estados globais, locks, transições, sincronização |
| `EVENT_SYSTEM_CONTEXT.md` | Filosofia de eventos, contratos, payloads, namespaces |
| `BATTLE_CONTEXT.md` | Sistema de combate, turnos, IA inimiga, regras de batalha |
| `PROMPT_IMPLEMENTADOR.md` | Governança, padrões e contratos de implementação |
| `RUBRO_PLANO_COMPLETO.md` | Visão geral do jogo, personagens, capítulos, mecânicas |

**Regra:** Em qualquer conflito entre documentos, os canônicos acima prevalecem. Em qualquer dúvida, consultar antes de implementar.

---

## PAPÉIS

### Pessoa 1 — Architect / Context Engineer

Produz e controla:
- documentos canônicos,
- prompts especializados por módulo,
- contratos e padrões globais,
- validação arquitetural das entregas da Pessoa 2.

Não implementa código diretamente.

### Pessoa 2 — Implementation Engineer

Recebe da Pessoa 1:
- prompt especializado,
- conjunto seletivo de documentos canônicos,
- contratos definidos.

Implementa o módulo usando as LLMs indicadas. Não altera arquitetura, contratos ou contexto canônico.

---

## FLUXO DE TRABALHO

```
Pessoa 1
  ↓ gera prompt especializado + seleciona documentos
Pessoa 2
  ↓ implementa módulo com LLM indicada
Pessoa 1
  ↓ valida arquitetura e integração
Pessoa 2
  ↓ corrige e refatora se necessário
```

---

## REGRA DE INJEÇÃO DE CONTEXTO

Pessoa 2 **nunca** recebe todos os documentos ao mesmo tempo.
A Pessoa 1 define exatamente quais documentos enviar para cada módulo.
Referência de contextos por módulo: seção **"Contextos por Sistema"** do `MULTI_AGENT_TEAM_GUIDE.md`.

---

## LLMs RECOMENDADAS

| Pessoa | IA Principal | IA Secundária | Finalidade secundária |
|---|---|---|---|
| Pessoa 1 | Claude | ChatGPT | Validação cruzada, UI, brainstorming |
| Pessoa 2 | ChatGPT | DeepSeek | Lógica, otimização, sistemas de combate |

---

## FASES E RESPONSABILIDADES

---

### FASE 1 — GOVERNANÇA DAS LLMs
**Responsável: Pessoa 1**
**Pré-requisito para todas as outras fases.**

Estes documentos definem como cada LLM deve se comportar em todo o projeto.
Sem eles, cada IA trabalha de forma diferente e os módulos divergem.

| Nº | Arquivo | O que define | Por que é crítico |
|---|---|---|---|
| 1 | `PROMPT_QA.md` | Como validar código, detectar conflitos, encontrar edge cases, exploits e validar integração | Sem isso, bugs arquiteturais passam despercebidos |
| 2 | `PROMPT_INTEGRADOR.md` | Como unir módulos, validar APIs, verificar compatibilidade e sincronizar sistemas | Sem isso, módulos não conversam corretamente |
| 3 | `PROMPT_REFATORADOR.md` | Como otimizar código, remover acoplamento, melhorar performance e estabilizar arquitetura | Sem isso, o projeto degrada rapidamente |
| 4 | `AI_RULES.md` | Regras obrigatórias para todas as LLMs: padrões globais, limitações, decisões proibidas | Sem isso, cada IA toma decisões conflitantes |

**Como produzir:**
Pessoa 1 redige cada documento com base nos padrões já definidos em `PROMPT_IMPLEMENTADOR.md` e nos contextos canônicos.
Pessoa 2 não participa desta fase.

---

### FASE 2 — INFRAESTRUTURA BASE
**Responsável: Pessoa 2 (com supervisão da Pessoa 1)**
**Esta é a fase mais crítica do código. Tudo depende dela.**

Os módulos desta fase não têm gameplay — eles são a fundação que todos os outros sistemas usam.
Implementar nesta ordem exata. Cada módulo depende do anterior.

| Nº | Arquivo | Responsabilidade | Depende de |
|---|---|---|---|
| 5 | `eventBus.js` | Sistema global de eventos. Emissão, consumo e sincronização entre módulos | — |
| 6 | `stateManager.js` | Estados globais, transições, overlays e locks. Implementa `GLOBAL_UI_STATES.md` | `eventBus.js` |
| 7 | `renderManager.js` | Camadas, renderização, prioridades e invalidação visual | `eventBus.js`, `stateManager.js` |
| 8 | `inputManager.js` | Teclado, inputs, bloqueios e prioridades de input | `eventBus.js`, `stateManager.js` |
| 9 | `transitionManager.js` | Fades, transições, animações globais e troca de estados | `eventBus.js`, `stateManager.js`, `renderManager.js` |

**Contextos que Pessoa 2 deve receber para esta fase:**
- `CORE_CONTEXT.md`
- `EVENT_SYSTEM_CONTEXT.md`
- `GLOBAL_UI_STATES.md`
- `PROMPT_IMPLEMENTADOR.md`

**Validação obrigatória (Pessoa 1):**
Antes de avançar para a Fase 3, confirmar que:
- `eventBus.js` emite e consome eventos com namespace `rubro:`.
- `stateManager.js` garante exatamente 1 estado primário ativo por instante.
- Nenhum módulo desta fase importa `main.js`.
- Nenhuma dependência circular existe no grafo da fase.

---

### FASE 3 — CORE GAMEPLAY
**Responsável: Pessoa 2 (com supervisão da Pessoa 1)**
**Pré-requisito: Fase 2 validada e estável.**

| Nº | Arquivo | Responsabilidade | Depende de |
|---|---|---|---|
| 10 | `battleSystem.js` | Sistema principal de combate: turnos, ataques, ordem e resolução | Fase 2 completa |
| 11 | `damageSystem.js` | Cálculo de dano, resistências, modificadores e efeitos | `battleSystem.js` |
| 12 | `turnManager.js` | Fluxo de turnos, prioridade e ordem de ações | `battleSystem.js` |
| 13 | `statusEffectSystem.js` | Veneno, infecção, mutações, buffs e debuffs | `damageSystem.js`, `turnManager.js` |
| 14 | `virusAI.js` | IA inimiga: decisões, comportamento e padrões táticos | `battleSystem.js`, `turnManager.js` |
| 15 | `entitySystem.js` | Stats, atributos, componentes e identidade biológica das entidades | Fase 2 completa |

**Contextos que Pessoa 2 deve receber para esta fase:**
- `CORE_CONTEXT.md`
- `BATTLE_CONTEXT.md`
- `EVENT_SYSTEM_CONTEXT.md`
- `PROMPT_IMPLEMENTADOR.md`

**Atenção especial:**
- A fórmula de dano canônica está em `CORE_CONTEXT §4.3`. Implementar exatamente — sem modificações.
- Atributos base de `Personagem` são imutáveis em runtime. Buffs/debuffs usam atributos efetivos, nunca modificam a base.
- `virusAI.js` deve ter comentários explicando cada critério de decisão da IA.

---

### FASE 4 — UI OPERACIONAL
**Responsável: Pessoa 2 (com supervisão da Pessoa 1)**
**Pré-requisito: Fase 3 validada.**

| Nº | Arquivo | Responsabilidade | Depende de |
|---|---|---|---|
| 16 | `battleHUD.js` | HUD do combate: HP, status, turnos e feedback visual | Fases 2 e 3 |
| 17 | `dialogueManager.js` | Sistema de diálogos: caixas, fluxo e eventos narrativos | Fase 2 |
| 18 | `menuSystem.js` | Menus: inventário, pause, settings e seleção | Fase 2 |
| 19 | `notificationSystem.js` | Feedback: dano flutuante, alertas, status, eventos críticos | Fase 2 |
| 20 | `animationController.js` | Sprites, efeitos, timing e sincronização visual | Fases 2 e 3 |

**Contextos que Pessoa 2 deve receber para esta fase:**
- `CORE_CONTEXT.md`
- `UI_CONTEXT.md`
- `GLOBAL_UI_STATES.md`
- `EVENT_SYSTEM_CONTEXT.md`
- `PROMPT_IMPLEMENTADOR.md`

**Regras visuais inegociáveis (de `UI_CONTEXT.md`):**
- Máximo 3 elementos animados simultaneamente (exceto idle).
- Máximo 2 overlays simultâneos.
- Máximo 30 partículas no canvas.
- Máximo 1 número flutuante de dano por frame por personagem.
- Sem gradientes decorativos, sem `filter: shadow` além dos definidos.

---

### FASE 5 — MUNDO E PROGRESSÃO
**Responsável: Pessoa 2 (com supervisão da Pessoa 1)**
**Pré-requisito: Fase 4 validada.**

| Nº | Arquivo | Responsabilidade | Depende de |
|---|---|---|---|
| 21 | `worldManager.js` | Regiões, mapas, navegação e carregamento | Fases 2 e 4 |
| 22 | `encounterSystem.js` | Encontros, batalhas e triggers biológicos | Fases 2, 3 e 5 (worldManager) |
| 23 | `progressionSystem.js` | Evolução de personagens, progressão e desbloqueios | Fases 2 e 3 |
| 24 | `saveSystem.js` | Save e load do estado completo do jogo | Fase 5 (progressionSystem) |
| 25 | `cutsceneManager.js` | Eventos narrativos, pacing e transições dramáticas | Fases 2 e 4 |

**Persistência:** `localStorage` (save único). Confirmar antes de sobrescrever slot existente.
Todo objeto persistível deve implementar `toJSON()`.

---

### FASE 6 — CONTEÚDO
**Responsável: Pessoa 1 (definição) + Pessoa 2 (implementação)**
**Pré-requisito: Fases 2 a 5 validadas.**

Esta fase usa as estruturas das fases anteriores para popular o jogo com entidades, ataques, regiões e narrativa.

| Nº | Entregável | O que criar |
|---|---|---|
| 26 | Entidades | Vírus, bactérias, agentes imunes, bosses — conforme `RUBRO_PLANO_COMPLETO.md §2` |
| 27 | Ataques | Infecções, mutações, adaptações, simbioses — conforme `CORE_CONTEXT §6` e `BATTLE_CONTEXT` |
| 28 | Regiões | Tecidos, órgãos, ambientes biológicos — conforme capítulos de `RUBRO_PLANO_COMPLETO.md §5` |
| 29 | Bosses | Cada boss com: filosofia, mecânica própria, identidade visual e impacto narrativo |
| 30 | Narrativa jogável | Diálogos, eventos, progressão emocional — incluindo todas as falas do Professor Imuno |

**Regra:** Nenhuma entidade, tipo ou mecânica pode ser inventada. Toda adição deve estar referenciada nos documentos canônicos.

---

### FASE 7 — ÁUDIO
**Responsável: Pessoa 2 (implementação técnica) + Pessoa 1 (direção)**

| Nº | Entregável | Escopo |
|---|---|---|
| 31 | Sistema de áudio | Música, SFX e feedback sonoro integrados ao `eventBus.js` |
| 32 | Direção sonora | Identidade auditiva do jogo: tensão biológica e feedback emocional por fase/estado |

**Nota:** O sistema de áudio deve responder a eventos `rubro:*` — nunca acionar som diretamente de módulos de gameplay.

---

### FASE 8 — POLIMENTO
**Responsável: Pessoa 2 (execução) + Pessoa 1 (validação)**
**Pré-requisito: Fases 1 a 7 funcionando de ponta a ponta.**

| Nº | Entregável | Foco |
|---|---|---|
| 33 | Balanceamento | Dano, progressão, IA inimiga e curvas de dificuldade por capítulo |
| 34 | Feedback visual | Readability, impacto de ataques e timing de animações |
| 35 | Otimização | Performance, uso de memória e eficiência da renderização |
| 36 | QA massivo | Encontrar exploits, bugs e inconsistências usando `PROMPT_QA.md` |

---

### FASE 9 — FINALIZAÇÃO
**Responsável: Pessoa 2 (implementação) + Pessoa 1 (validação final)**

| Nº | Entregável |
|---|---|
| 37 | Tela de Game Over |
| 38 | Tela de Créditos |
| 39 | Tela de Configurações |
| 40 | Tutorial inicial (Capítulo 0 → 1) |
| 41 | Build final do projeto |
| 42 | Testes completos de fluxo (início → epílogo) |

---

### FASE 10 — DOCUMENTAÇÃO ACADÊMICA
**Responsável: Pessoa 1**
**Muito importante. Deve ser atualizada progressivamente durante todo o projeto — não apenas ao final.**

| Nº | Arquivo | O que documentar |
|---|---|---|
| 43 | `CASE_STUDIES.md` | Prompts utilizados, erros gerados, melhorias aplicadas, iterações por módulo |
| 44 | `LLM_LIMITATIONS.md` | Falhas das IAs, limitações encontradas, conflitos entre outputs, inconsistências |
| 45 | Arquitetura final | Pipeline multiagente completo, integração humano+LLM, fluxo operacional documentado |

**Recomendação:** Registrar ao final de cada módulo entregue, enquanto o contexto ainda está fresco.

---

## CHECKLIST DE PROGRESSO

Use esta tabela para rastrear o estado de cada entregável.

| Fase | Nº | Arquivo / Entregável | Status |
|---|---|---|---|
| 1 | 1 | `PROMPT_QA.md` | ⬜ |
| 1 | 2 | `PROMPT_INTEGRADOR.md` | ⬜ |
| 1 | 3 | `PROMPT_REFATORADOR.md` | ⬜ |
| 1 | 4 | `AI_RULES.md` | ⬜ |
| 2 | 5 | `eventBus.js` | ⬜ |
| 2 | 6 | `stateManager.js` | ⬜ |
| 2 | 7 | `renderManager.js` | ⬜ |
| 2 | 8 | `inputManager.js` | ⬜ |
| 2 | 9 | `transitionManager.js` | ⬜ |
| 3 | 10 | `battleSystem.js` | ⬜ |
| 3 | 11 | `damageSystem.js` | ⬜ |
| 3 | 12 | `turnManager.js` | ⬜ |
| 3 | 13 | `statusEffectSystem.js` | ⬜ |
| 3 | 14 | `virusAI.js` | ⬜ |
| 3 | 15 | `entitySystem.js` | ⬜ |
| 4 | 16 | `battleHUD.js` | ⬜ |
| 4 | 17 | `dialogueManager.js` | ⬜ |
| 4 | 18 | `menuSystem.js` | ⬜ |
| 4 | 19 | `notificationSystem.js` | ⬜ |
| 4 | 20 | `animationController.js` | ⬜ |
| 5 | 21 | `worldManager.js` | ⬜ |
| 5 | 22 | `encounterSystem.js` | ⬜ |
| 5 | 23 | `progressionSystem.js` | ⬜ |
| 5 | 24 | `saveSystem.js` | ⬜ |
| 5 | 25 | `cutsceneManager.js` | ⬜ |
| 6 | 26 | Entidades | ⬜ |
| 6 | 27 | Ataques | ⬜ |
| 6 | 28 | Regiões | ⬜ |
| 6 | 29 | Bosses | ⬜ |
| 6 | 30 | Narrativa jogável | ⬜ |
| 7 | 31 | Sistema de áudio | ⬜ |
| 7 | 32 | Direção sonora | ⬜ |
| 8 | 33 | Balanceamento | ⬜ |
| 8 | 34 | Feedback visual | ⬜ |
| 8 | 35 | Otimização | ⬜ |
| 8 | 36 | QA massivo | ⬜ |
| 9 | 37 | Tela de Game Over | ⬜ |
| 9 | 38 | Tela de Créditos | ⬜ |
| 9 | 39 | Tela de Configurações | ⬜ |
| 9 | 40 | Tutorial inicial | ⬜ |
| 9 | 41 | Build final | ⬜ |
| 9 | 42 | Testes completos | ⬜ |
| 10 | 43 | `CASE_STUDIES.md` | ⬜ |
| 10 | 44 | `LLM_LIMITATIONS.md` | ⬜ |
| 10 | 45 | Arquitetura final documentada | ⬜ |

---

## REGRAS OPERACIONAIS — RESUMO RÁPIDO

### Pessoa 1

- Produz todos os documentos de governança (Fase 1) antes de qualquer implementação.
- Seleciona quais documentos enviar para cada módulo — nunca todos de uma vez.
- Valida cada módulo antes de autorizar o avanço de fase.
- Atualiza a documentação acadêmica progressivamente (Fase 10).
- Nunca altera código implementado diretamente — comunica via prompt de refatoração.

### Pessoa 2

- Lê o prompt especializado e os documentos selecionados antes de iniciar cada módulo.
- Começa todo output com o cabeçalho de identificação obrigatório:
  ```
  // LLM N — arquivo: js/nome-arquivo.js
  // Documentos lidos: [lista]
  // Dependências: [módulos importados]
  // Exporta: [lista de exports]
  ```
- Implementa exatamente o que os documentos definem. Não inventa. Não improvisa.
- Não altera a assinatura de APIs já definidas em outros módulos.
- Nunca importa `main.js` em nenhum outro arquivo.
- Usa apenas `const` e `let` — nunca `var`. Sem TypeScript, sem frameworks externos.
- Em caso de dúvida: para, anota a ambiguidade e comunica à Pessoa 1 antes de implementar.

### Regra de Ouro (de `PROMPT_IMPLEMENTADOR.md §26.3`)

> Se não está nos documentos canônicos, não existe no projeto.
> Não inventar. Não improvisar. Consultar o documento canônico correspondente.

---

*RUBRO_GUIA_IMPLEMENTACAO.md — v1.0*
*Orientador operacional — Pessoa 1 + Pessoa 2 — pipeline multiagente*
