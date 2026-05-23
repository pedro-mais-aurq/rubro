# EVENT_SYSTEM_CONTEXT.md — RUBRO
> Documento canônico do sistema global de eventos.  
> Leitura obrigatória para toda LLM responsável por: `eventBus.js`, `turnos.js`, `main.js`, `sprites.js`, `capitulos.js`, `dano.js`, combate, HUD, animações, input, transições, IA e sincronização visual.  
> Autoridade subordinada a CORE_CONTEXT.md, UI_CONTEXT.md e GLOBAL_UI_STATES.md. Em caso de conflito, esses documentos prevalecem.

---

## 0. Hierarquia de Autoridade

```
CORE_CONTEXT.md          ← dados, módulos, APIs, convenções, eventos base (§11)
UI_CONTEXT.md            ← visual, paleta, timing de animações, feedback
GLOBAL_UI_STATES.md      ← estados globais, locks, transições, sincronização
EVENT_SYSTEM_CONTEXT.md  ← filosofia, contratos, namespaces, payloads, regras
(implementações LLM)     ← geradas a partir dos quatro documentos acima
```

Ambiguidades de evento → este documento.  
Ambiguidades de estado → GLOBAL_UI_STATES.md.  
Ambiguidades de dados ou lógica → CORE_CONTEXT.md.  
Ambiguidades visuais → UI_CONTEXT.md.

---

## 1. Filosofia do Sistema de Eventos

### 1.1 Princípios Fundamentais

| Princípio | Definição operacional |
|---|---|
| **Desacoplamento total** | Nenhum módulo referencia outro diretamente para comunicar mudanças de estado — toda comunicação entre módulos passa por eventos |
| **Fluxo unidirecional** | Eventos fluem de emissores para listeners; listeners nunca respondem sincronamente ao emissor via evento |
| **Contrato explícito** | Todo evento possui namespace, payload, emissor e consumidor canônicos documentados — nenhum evento implícito ou anônimo |
| **Rastreabilidade garantida** | Todo evento deve ser logável e identificável; o sistema suporta modo de debug sem alterar comportamento |
| **Consistência com estados** | Nenhum evento é emitido ou consumido fora do estado global que o autoriza (ver GLOBAL_UI_STATES §19.3) |
| **Sem side-effects em listeners** | Listeners não emitem eventos durante a própria execução de resposta a um evento, a menos que explicitamente documentado como cadeia autorizada |
| **Sem polling** | Nenhum módulo consulta estado de outro módulo em loop — toda comunicação é reativa via evento |

### 1.2 Modelo de Comunicação

O sistema adota o padrão **Event Bus via DOM nativo**:

```js
// Emissão
document.dispatchEvent(new CustomEvent('rubro:nome-evento', { detail: payload }));

// Escuta
document.addEventListener('rubro:nome-evento', (e) => handler(e.detail));
```

- **Sem biblioteca externa** — apenas DOM CustomEvent nativo (ES6+)
- **Sem `import` cruzado entre módulos para comunicação** — módulos se comunicam exclusivamente via eventos
- **O `document` é o único bus** — nenhum outro objeto serve como ponto de escuta global

### 1.3 Invariantes do Sistema

1. Todo evento `rubro:*` está registrado neste documento e em CORE_CONTEXT §11.
2. Nenhum módulo emite evento que não está na lista de emissores autorizados desse evento.
3. Nenhum módulo escuta evento que não está na lista de consumidores autorizados.
4. `GameStateManager` é o único emissor de `rubro:input-desativado` e `rubro:input-ativado`.
5. Eventos emitidos fora do estado global esperado são descartados silenciosamente pelo consumidor.
6. Novos eventos devem ser registrados em CORE_CONTEXT §11 **antes** de serem emitidos ou consumidos.

---

## 2. Arquitetura Orientada a Eventos

### 2.1 Fluxo Global de Comunicação

```
[Input do Jogador]
       │
       ▼
  [main.js — captura input]
       │
       ├─ emite rubro:trocar-personagem ──────────────────► turnos.js
       ├─ chama GerenciadorTurnos.jogadorEscolheuAtaque()
       └─ emite rubro:input-desativado ───────────────────► main.js (self)
                                                             (remove handlers)

[GerenciadorTurnos — executa turno]
       │
       ├─ emite rubro:personagem-ko ─────────────────────► main.js, sprites.js
       ├─ emite rubro:status-aplicado ──────────────────► main.js
       ├─ emite rubro:xp-ganho ─────────────────────────► capitulos.js
       └─ emite rubro:fim-batalha ──────────────────────► main.js

[capitulos.js — processa fim de capítulo]
       │
       ├─ emite rubro:evolucao ─────────────────────────► main.js, sprites.js
       └─ emite rubro:capitulo-concluido ──────────────► main.js

[GameStateManager — gerencia estados]
       │
       ├─ emite rubro:input-desativado ────────────────► main.js
       └─ emite rubro:input-ativado ────────────────────► main.js
```

### 2.2 Módulos Participantes

| Módulo | Papel no sistema de eventos |
|---|---|
| `main.js` | Consumidor central de eventos de gameplay; emite eventos de input; coordena UI em resposta |
| `turnos.js` | Emissor primário de eventos de combate (`rubro:fim-batalha`, `rubro:personagem-ko`, `rubro:status-aplicado`, `rubro:xp-ganho`) |
| `dano.js` | Emissor de `rubro:status-aplicado`; não escuta eventos — opera por chamada direta |
| `capitulos.js` | Consumidor de `rubro:xp-ganho`; emissor de `rubro:evolucao` e `rubro:capitulo-concluido` |
| `sprites.js` | Consumidor de `rubro:personagem-ko` e `rubro:evolucao` para animações visuais |
| `GameStateManager` | Emissor exclusivo de `rubro:input-desativado` e `rubro:input-ativado`; árbitro de locks |

> `personagens.js`, `tipos.js`, `ataques.js`, `balanceamento.js` **não participam do sistema de eventos** — operam via chamada direta e retorno de valores.

---

## 3. Estrutura de Namespaces

### 3.1 Convenção de Nomenclatura

Todos os eventos seguem o padrão `rubro:{categoria}-{acao}` em **kebab-case** (conforme CORE_CONTEXT §5):

```
rubro:{categoria}-{acao}
```

- `rubro:` — prefixo obrigatório; identifica o sistema globalmente
- `{categoria}` — domínio do evento (ex.: `fim`, `personagem`, `status`, `input`, `evolucao`, `xp`, `capitulo`, `trocar`)
- `{acao}` — o que ocorreu, em forma substantiva ou verbal no passado

### 3.2 Categorias de Namespace

| Prefixo canônico | Domínio | Exemplos |
|---|---|---|
| `rubro:fim-*` | Resultados terminais de fase ou batalha | `rubro:fim-batalha` |
| `rubro:personagem-*` | Estado de personagens | `rubro:personagem-ko` |
| `rubro:status-*` | Aplicação de status | `rubro:status-aplicado` |
| `rubro:evolucao` | Evolução de personagem | `rubro:evolucao` |
| `rubro:xp-*` | Progressão de XP | `rubro:xp-ganho` |
| `rubro:capitulo-*` | Progressão de capítulo | `rubro:capitulo-concluido` |
| `rubro:trocar-*` | Trocas de personagem | `rubro:trocar-personagem` |
| `rubro:input-*` | Controle de input global | `rubro:input-desativado`, `rubro:input-ativado` |

### 3.3 Regras de Extensão de Namespace

- Novos eventos devem seguir os prefixos existentes se pertencerem ao mesmo domínio.
- Novos domínios devem ser aprovados e registrados em CORE_CONTEXT §11 antes de uso.
- Nunca criar eventos com namespace genérico (`rubro:update`, `rubro:change`) — toda ação deve ser semanticamente explícita.
- Nunca criar dois eventos com semântica idêntica em namespaces distintos.

---

## 4. Catálogo Canônico de Eventos

> Fonte primária: CORE_CONTEXT §11. Este catálogo é extensão com contratos completos.

---

### 4.1 `rubro:fim-batalha`

| Campo | Valor |
|---|---|
| **Categoria** | BATTLE_EVENTS |
| **Prioridade** | Crítica — terminal |
| **Escopo** | Global |
| **Persistência** | Não — evento único por batalha |
| **Emissor autorizado** | `turnos.js` (GerenciadorTurnos) |
| **Consumidores autorizados** | `main.js` |
| **Estado que autoriza emissão** | `BATTLE.FIM_BATALHA` |
| **Estado que autoriza consumo** | `BATTLE` (qualquer subestado) |

**Payload:**
```js
{
  resultado: 'VITORIA' | 'DERROTA'
}
```

**Impacto sistêmico:**
- `main.js` inicia sequência pós-batalha: DIALOGUE de resultado → TRANSITION → OVERWORLD (vitória) ou GAME_OVER (derrota).
- Jamais emitido mais de uma vez por instância de batalha.
- Se emitido em estado fora de BATTLE: descartado silenciosamente por `main.js`.

**Regras de cancelamento:** Não cancelável. Evento terminal.

---

### 4.2 `rubro:personagem-ko`

| Campo | Valor |
|---|---|
| **Categoria** | BATTLE_EVENTS |
| **Prioridade** | Alta |
| **Escopo** | Global |
| **Persistência** | Não |
| **Emissor autorizado** | `turnos.js` |
| **Consumidores autorizados** | `main.js`, `sprites.js` |
| **Estado que autoriza emissão** | `BATTLE.EXECUCAO`, `BATTLE.FIM_TURNO` |

**Payload:**
```js
{
  personagem: String  // nome canônico (ex.: 'NEUTRO', 'VIRU_PRIME')
}
```

**Impacto sistêmico:**
- `sprites.js`: inicia animação `KO` (queda + grayscale, 600ms).
- `main.js`: exibe vinheta vermelha, mensagem "NOME DESMONTADO!", avalia se GAME_OVER.
- Pode ser emitido múltiplas vezes na mesma batalha (um por personagem derrotado).

**Regras anti-loop:** `sprites.js` não emite nenhum evento como resposta a este.

---

### 4.3 `rubro:status-aplicado`

| Campo | Valor |
|---|---|
| **Categoria** | BATTLE_EVENTS / STATE_EVENTS |
| **Prioridade** | Média |
| **Escopo** | Global |
| **Persistência** | Não |
| **Emissor autorizado** | `dano.js` (via `aplicarStatus` em `personagens.js`), `turnos.js` |
| **Consumidores autorizados** | `main.js` |
| **Estado que autoriza emissão** | `BATTLE.EXECUCAO` |

**Payload:**
```js
{
  personagem: String,   // nome canônico do personagem afetado
  status: String        // valor canônico: 'INFECTADO' | 'ENVENENADO' | 'INFLAMADO' | 'SUPRIMIDO' | 'MARCA_ANTICORPO' | 'MULTIPLICANDO'
}
```

**Impacto sistêmico:**
- `main.js`: exibe ícone de status no HUD (escala 0→1, 150ms), overlay de cor sobre sprite (200ms fade-in → 200ms fade-out).
- Cor do indicador visual conforme UI_CONTEXT §7.3.

---

### 4.4 `rubro:evolucao`

| Campo | Valor |
|---|---|
| **Categoria** | STATE_EVENTS / ANIMATION_EVENTS |
| **Prioridade** | Alta |
| **Escopo** | Global |
| **Persistência** | Não |
| **Emissor autorizado** | `capitulos.js` |
| **Consumidores autorizados** | `main.js`, `sprites.js` |
| **Estado que autoriza emissão** | `BATTLE.FIM_BATALHA` |

**Payload:**
```js
{
  de: String,   // ID da instância pré-evolução (ex.: 'NEUTRO')
  para: String  // ID da instância pós-evolução (ex.: 'NEUTRO_REX')
}
```

**Impacto sistêmico:**
- `main.js`: inicia sequência de evolução (~1500ms): fade preto → silhueta branca pulsante → crossfade para novo sprite → texto de evolução.
- `sprites.js`: carrega novo sprite e executa crossfade.
- `ANIMATION_LOCK` ativo durante toda a sequência — `turnos.js` não avança.

---

### 4.5 `rubro:xp-ganho`

| Campo | Valor |
|---|---|
| **Categoria** | GAMEPLAY_EVENTS |
| **Prioridade** | Média |
| **Escopo** | Global |
| **Persistência** | Não |
| **Emissor autorizado** | `turnos.js` |
| **Consumidores autorizados** | `capitulos.js` |
| **Estado que autoriza emissão** | `BATTLE.FIM_BATALHA` |

**Payload:**
```js
{
  personagem: String,  // nome canônico do AgentImune
  xp: Number          // quantidade de XP concedida
}
```

**Impacto sistêmico:**
- `capitulos.js`: chama `ganharXP(xp)` no personagem → verifica `podeEvoluir()` → emite `rubro:evolucao` se aplicável.
- `main.js`: anima barra de XP (propagação esquerda→direita, 300ms); notificação de nível se subiu.
- Pode ser emitido uma vez por personagem do time ativo.

---

### 4.6 `rubro:capitulo-concluido`

| Campo | Valor |
|---|---|
| **Categoria** | GAMEPLAY_EVENTS |
| **Prioridade** | Alta |
| **Escopo** | Global |
| **Persistência** | Não |
| **Emissor autorizado** | `capitulos.js` |
| **Consumidores autorizados** | `main.js` |
| **Estado que autoriza emissão** | `OVERWORLD` (pós-batalha, após retorno de BATTLE) |

**Payload:**
```js
{
  id: Number  // id do capítulo concluído (0–7)
}
```

**Impacto sistêmico:**
- `main.js`: dispara `animarTransicaoCapitulo(nomeLocal)`, atualiza overworld, verifica desbloqueios.
- Save em `localStorage` ocorre **após** este evento ser processado com sucesso.

---

### 4.7 `rubro:trocar-personagem`

| Campo | Valor |
|---|---|
| **Categoria** | INPUT_EVENTS |
| **Prioridade** | Alta |
| **Escopo** | Global |
| **Persistência** | Não |
| **Emissor autorizado** | `main.js` (em resposta ao input do jogador via `#btn-trocar`) |
| **Consumidores autorizados** | `turnos.js` |
| **Estado que autoriza emissão** | `BATTLE.ESCOLHA_ACAO` |

**Payload:**
```js
{
  index: Number  // índice do personagem no timeJogador (0–N)
}
```

**Impacto sistêmico:**
- `turnos.js`: chama `jogadorEscolheuTrocar(index)` → registra ação para o turno.
- `main.js`: atualiza `#sprite-aliado`, `#nome-aliado`, `#barra-hp-aliado`, `#barra-xp-aliado`, `#menu-ataques` simultaneamente (conforme UI_CONTEXT §12.4).
- `ANIMATION_LOCK` ativo durante animação de troca (400ms).

---

### 4.8 `rubro:input-desativado`

| Campo | Valor |
|---|---|
| **Categoria** | SYSTEM_EVENTS |
| **Prioridade** | Máxima (sistema) |
| **Escopo** | Global |
| **Persistência** | Não — flag de estado |
| **Emissor autorizado** | `GameStateManager` exclusivamente |
| **Consumidores autorizados** | `main.js` |
| **Estado que autoriza emissão** | Qualquer transição para estado bloqueante |

**Payload:** `{}` (sem dados)

**Impacto sistêmico:**
- `main.js`: remove todos os event listeners de input do DOM (`INPUT_LOCK` ativo).
- Handlers não são apenas desabilitados — são removidos do DOM (conforme GLOBAL_UI_STATES §18).

---

### 4.9 `rubro:input-ativado`

| Campo | Valor |
|---|---|
| **Categoria** | SYSTEM_EVENTS |
| **Prioridade** | Máxima (sistema) |
| **Escopo** | Global |
| **Persistência** | Não |
| **Emissor autorizado** | `GameStateManager` exclusivamente |
| **Consumidores autorizados** | `main.js` |
| **Estado que autoriza emissão** | Qualquer transição de saída de estado bloqueante |

**Payload:** `{}` (sem dados)

**Impacto sistêmico:**
- `main.js`: readiciona handlers de input correspondentes ao estado atual.
- Apenas os handlers do estado ativo são registrados — nunca handlers de estados anteriores.

---

## 5. Categorias de Eventos

### 5.1 GAMEPLAY_EVENTS

**Objetivo:** Comunicar progressão de jogo — XP, capítulos, desbloqueios.  
**Prioridade:** Média–Alta.  
**Escopo:** Global.  
**Persistência:** Não — transitórios.  
**Propagação:** Emitidos após resolução de combate; consumidos em OVERWORLD ou FIM_BATALHA.  
**Listeners permitidos:** `capitulos.js`, `main.js`.  
**Regras de cancelamento:** Não canceláveis — representam fatos já ocorridos no modelo de dados.  
**Payload esperado:** Identificadores canônicos de personagem, capítulo ou quantidade numérica.  
**Impacto sistêmico:** Podem disparar cadeias autorizadas (`rubro:xp-ganho` → `rubro:evolucao`).

| Evento | Emissor | Consumidores |
|---|---|---|
| `rubro:xp-ganho` | `turnos.js` | `capitulos.js` |
| `rubro:capitulo-concluido` | `capitulos.js` | `main.js` |

---

### 5.2 UI_EVENTS

**Objetivo:** Comunicar mudanças de estado de UI que afetam renderização ou input.  
**Prioridade:** Alta.  
**Escopo:** Global.  
**Persistência:** Não.  
**Propagação:** Emitidos pelo `GameStateManager`; consumidos por `main.js`.  
**Listeners permitidos:** `main.js` exclusivamente.  
**Regras de cancelamento:** Não canceláveis.  
**Payload esperado:** Vazio `{}` ou referência de estado.  
**Impacto sistêmico:** Controlam `INPUT_LOCK`; jamais emitidos por módulos de gameplay.

| Evento | Emissor | Consumidores |
|---|---|---|
| `rubro:input-desativado` | `GameStateManager` | `main.js` |
| `rubro:input-ativado` | `GameStateManager` | `main.js` |

---

### 5.3 BATTLE_EVENTS

**Objetivo:** Comunicar resultados e ocorrências dentro do combate em turnos.  
**Prioridade:** Alta–Crítica.  
**Escopo:** Global.  
**Persistência:** Não — transitórios, um por ocorrência.  
**Propagação:** Emitidos por `turnos.js` ou `dano.js` durante subestados de BATTLE; consumidos por `main.js` e `sprites.js`.  
**Listeners permitidos:** `main.js`, `sprites.js`.  
**Regras de cancelamento:** Não canceláveis — representam resultado já computado.  
**Payload esperado:** Nomes canônicos de personagens, status, resultado.  
**Impacto sistêmico:** Disparam animações, atualizações de HUD, sequências de estado.

| Evento | Emissor | Consumidores |
|---|---|---|
| `rubro:fim-batalha` | `turnos.js` | `main.js` |
| `rubro:personagem-ko` | `turnos.js` | `main.js`, `sprites.js` |
| `rubro:status-aplicado` | `dano.js` / `turnos.js` | `main.js` |

---

### 5.4 STATE_EVENTS

**Objetivo:** Comunicar mudanças de estado de personagens (evolução) que impactam renderização e dados.  
**Prioridade:** Alta.  
**Escopo:** Global.  
**Persistência:** Não.  
**Propagação:** Emitidos por `capitulos.js` durante FIM_BATALHA; consumidos por `main.js` e `sprites.js`.  
**Listeners permitidos:** `main.js`, `sprites.js`.  
**Regras de cancelamento:** Não canceláveis.  
**Payload esperado:** IDs canônicos de instância pré e pós-evolução.  
**Impacto sistêmico:** Ativa `ANIMATION_LOCK`; inicia sequência visual de ~1500ms.

| Evento | Emissor | Consumidores |
|---|---|---|
| `rubro:evolucao` | `capitulos.js` | `main.js`, `sprites.js` |

---

### 5.5 INPUT_EVENTS

**Objetivo:** Comunicar ações de gameplay originadas do input do jogador para módulos de lógica.  
**Prioridade:** Alta (somente quando `INPUT_LOCK` inativo).  
**Escopo:** Global.  
**Persistência:** Não.  
**Propagação:** Emitidos por `main.js` em resposta ao input do jogador; consumidos por `turnos.js`.  
**Listeners permitidos:** `turnos.js`.  
**Regras de cancelamento:** Descartados automaticamente se `INPUT_LOCK` ativo (handlers inexistentes).  
**Payload esperado:** Índice ou identificador da ação.  
**Impacto sistêmico:** Registra ação do jogador no `GerenciadorTurnos`; inicia transição de subestado.

| Evento | Emissor | Consumidores |
|---|---|---|
| `rubro:trocar-personagem` | `main.js` | `turnos.js` |

> Nota: ações de ataque, item e fuga são comunicadas via chamada direta de método (`GerenciadorTurnos.jogadorEscolheuAtaque()`, etc.) — não via evento — pois requerem retorno síncrono de validação.

---

### 5.6 ANIMATION_EVENTS

**Objetivo:** Sincronizar conclusão de sequências visuais com a lógica de `turnos.js`.  
**Prioridade:** Operacional (controla fluxo de turno).  
**Escopo:** Local — callback direto, não via CustomEvent.  
**Persistência:** Não.  
**Propagação:** `main.js` e `sprites.js` invocam `onAnimacao(tipo)` diretamente após concluir animação.  
**Listeners permitidos:** `GerenciadorTurnos` (registra os callbacks).  
**Regras de cancelamento:** Se `onAnimacao` não for invocado em tempo (duração máxima + 500ms tolerância), `turnos.js` prossegue autonomamente e registra `console.warn`.

**Callback:**
```js
onAnimacao(tipo)
// tipo: 'ATAQUE' | 'CRITICO' | 'STATUS' | 'KO' | 'EVOLUCAO' | 'TROCA' | 'TRANSICAO'
```

**Timings máximos (conforme GLOBAL_UI_STATES §15.1 e UI_CONTEXT §12.3):**

| Tipo | Duração máxima |
|---|---|
| `ATAQUE` | 800ms |
| `CRITICO` | 1200ms |
| `STATUS` | 600ms |
| `KO` | 1000ms |
| `EVOLUCAO` | 1500ms |
| `TROCA` | 400ms |
| `TRANSICAO` | 1800ms |

---

### 5.7 DIALOGUE_EVENTS

**Objetivo:** Controlar abertura, progressão e fechamento de sequências de diálogo.  
**Prioridade:** Alta — sobrepõe gameplay.  
**Escopo:** Gerenciado via chamadas diretas a `main.js`; não via CustomEvent.  
**Persistência:** Não.  
**Propagação:** `GerenciadorCapitulos` e `GerenciadorTurnos` chamam funções de `main.js` diretamente:

```js
mostrarDialogo(texto, personagem)   // abre DIALOGUE
fecharDialogo()                     // encerra DIALOGUE
mostrarCardProfImuno(dados)         // card educacional (não ativa DIALOGUE)
```

**Regras:**
- DIALOGUE não empilha — abrir quando DIALOGUE ativo encerra o anterior primeiro.
- Card do Prof. Imuno (`mostrarCardProfImuno`) é componente de exibição puro — não altera estado global.
- Fila FIFO: máximo 8 mensagens; excesso descartado com `console.warn`.

---

### 5.8 SYSTEM_EVENTS

**Objetivo:** Comunicar operações críticas de sistema (boot, loading, controle de input).  
**Prioridade:** Máxima.  
**Escopo:** Global.  
**Persistência:** Não.  
**Propagação:** Emitidos exclusivamente pelo `GameStateManager`.  
**Listeners permitidos:** `main.js`.  
**Regras de cancelamento:** Não canceláveis — são instruções de sistema.

| Evento | Emissor | Consumidores |
|---|---|---|
| `rubro:input-desativado` | `GameStateManager` | `main.js` |
| `rubro:input-ativado` | `GameStateManager` | `main.js` |

---

## 6. Estrutura dos Payloads

### 6.1 Convenções Gerais

- Payloads são objetos JavaScript planos (`{}`), nunca classes, Promises ou referências a instâncias.
- Strings de personagem usam **IDs canônicos de instância** em `UPPER_SNAKE_CASE` (ex.: `'NEUTRO'`, `'VIRU_PRIME'`) — conforme CORE_CONTEXT §8.
- Strings de status usam os valores canônicos de `EfeitoEspecial.tipo` — conforme CORE_CONTEXT §6.3.
- Strings de resultado usam literais `'VITORIA'` ou `'DERROTA'` — nunca valores booleanos.
- Índices numéricos referem-se a posições em arrays canônicos (`timeJogador`).
- Payloads vazios são representados como `{}` — nunca `null` ou `undefined`.

### 6.2 Tabela de Payloads Canônicos

| Evento | Payload | Tipos |
|---|---|---|
| `rubro:fim-batalha` | `{ resultado }` | `'VITORIA' \| 'DERROTA'` |
| `rubro:personagem-ko` | `{ personagem }` | `String` (ID canônico) |
| `rubro:status-aplicado` | `{ personagem, status }` | `String, String` (IDs canônicos) |
| `rubro:evolucao` | `{ de, para }` | `String, String` (IDs canônicos) |
| `rubro:xp-ganho` | `{ personagem, xp }` | `String, Number` |
| `rubro:capitulo-concluido` | `{ id }` | `Number` (0–7) |
| `rubro:trocar-personagem` | `{ index }` | `Number` (índice em timeJogador) |
| `rubro:input-desativado` | `{}` | — |
| `rubro:input-ativado` | `{}` | — |

### 6.3 Acesso ao Payload em Listeners

```js
document.addEventListener('rubro:fim-batalha', (e) => {
  const { resultado } = e.detail;
  // resultado: 'VITORIA' | 'DERROTA'
});
```

---

## 7. Regras de Emissão

1. **Apenas emissores autorizados** — cada evento tem um único emissor canônico; nenhum outro módulo emite o mesmo evento.
2. **Apenas no estado autorizado** — o emissor verifica internamente se o estado global permite a emissão; se não, silencia.
3. **Payload completo** — nunca emitir com campos ausentes; payload parcial é inválido.
4. **Sem emissão redundante** — um evento não deve ser emitido duas vezes para o mesmo fato (ex.: `rubro:fim-batalha` uma vez por batalha).
5. **Sem emissão em loop** — nenhum listener emite o mesmo evento ou um evento que causaria a re-emissão do evento original.
6. **Sem emissão síncrona em resposta a evento** — se um listener precisa disparar um evento em cadeia, este deve ser documentado como cadeia autorizada (ver §8).

---

## 8. Cadeias de Eventos Autorizadas

Cadeias são sequências onde um evento dispara a emissão de outro evento como consequência esperada e documentada.

### 8.1 Cadeia de XP → Evolução

```
rubro:xp-ganho
  └─ capitulos.js: ganharXP() → podeEvoluir()
       └─ (se evolução disponível) emite rubro:evolucao
```

- A emissão de `rubro:evolucao` por `capitulos.js` é a única cadeia autorizada de evento→evento.
- `rubro:evolucao` nunca é emitido diretamente por `turnos.js`.

### 8.2 Cadeia de FIM_BATALHA → Capitulo Concluído

```
rubro:fim-batalha { resultado: 'VITORIA' }
  └─ main.js: chama capitulos.js.finalizarCapitulo()
       └─ capitulos.js emite rubro:capitulo-concluido
```

- `rubro:capitulo-concluido` só é emitido em resultado de vitória.

### 8.3 Cadeias Proibidas

- `rubro:personagem-ko` **não** pode disparar `rubro:fim-batalha` diretamente — `turnos.js` verifica `verificarFimBatalha()` após o KO e emite `rubro:fim-batalha` separadamente.
- `rubro:status-aplicado` **não** pode disparar `rubro:personagem-ko` — dano de status é processado em `BATTLE.FIM_TURNO` pela lógica de `turnos.js`, não por evento.

---

## 9. Regras de Escuta

1. **Apenas consumidores autorizados** — módulos não registram listeners para eventos que não estão em sua lista canônica.
2. **Verificação de estado antes de processar** — todo listener verifica se o estado global ativo autoriza o consumo; se não, retorna sem executar.
3. **Listeners removidos durante `INPUT_LOCK`** — conforme GLOBAL_UI_STATES §16, handlers de input são removidos do DOM (não apenas desabilitados) quando `INPUT_LOCK` ativo.
4. **Sem listeners anônimos em produção** — toda função de handler é nomeada para permitir remoção via `removeEventListener`.
5. **Listeners de sistema são permanentes** — `rubro:input-desativado` e `rubro:input-ativado` são os únicos eventos com listeners que nunca são removidos.

---

## 10. Regras de Cancelamento e Invalidação

### 10.1 Eventos Não Canceláveis

Todos os eventos `rubro:*` são não canceláveis por design — representam fatos já computados no modelo de dados. Não existe mecanismo de `event.preventDefault()` aplicável.

### 10.2 Invalidação Visual

Eventos que requerem re-renderização forçada de elementos de HUD:

| Evento | Elementos invalidados | Comportamento |
|---|---|---|
| `rubro:personagem-ko` | `#sprite-aliado` ou `#sprite-inimigo`, `#barra-hp-*` | Animação KO; barra para 0 |
| `rubro:status-aplicado` | Indicador de status no HUD | Ícone aparece com escala 0→1, 150ms |
| `rubro:evolucao` | `#sprite-aliado`, `#nome-aliado` | Sequência de evolução; crossfade de sprite |
| `rubro:xp-ganho` | `#barra-xp-aliado` | Propagação esquerda→direita, 300ms |
| `rubro:trocar-personagem` | `#sprite-aliado`, `#nome-aliado`, `#barra-hp-aliado`, `#barra-xp-aliado`, `#menu-ataques` | Invalidação simultânea de todos os elementos |

### 10.3 Descarte Silencioso

Eventos recebidos fora do estado autorizado são **descartados silenciosamente** — sem log de erro, sem execução parcial. Esta é a única forma de "cancelamento" suportada.

---

## 11. Regras de Sincronização

### 11.1 Sincronização de Animação com Lógica de Turno

`turnos.js` **não avança** para o próximo passo do turno enquanto `ANIMATION_LOCK` estiver ativo. O lock é liberado apenas quando `main.js` ou `sprites.js` invocam o callback `onAnimacao(tipo)`.

```
turnos.js emite resultado
    │
    ├─ main.js/sprites.js inicia animação (ANIMATION_LOCK ativo)
    │       │
    │       └─ animação conclui → invoca onAnimacao(tipo)
    │                               │
    │                               └─ turnos.js libera ANIMATION_LOCK → avança
    │
    └─ se onAnimacao não invocado em (duração_máxima + 500ms):
           turnos.js prossegue autonomamente + console.warn
```

### 11.2 Sincronização de Estado ↔ Eventos

Conforme GLOBAL_UI_STATES §15.2:

| Evento | Estado que autoriza emissão | Estados que autorizam consumo |
|---|---|---|
| `rubro:fim-batalha` | `BATTLE.FIM_BATALHA` | `BATTLE` |
| `rubro:personagem-ko` | `BATTLE.EXECUCAO`, `BATTLE.FIM_TURNO` | `BATTLE` |
| `rubro:status-aplicado` | `BATTLE.EXECUCAO` | `BATTLE` |
| `rubro:evolucao` | `BATTLE.FIM_BATALHA` | `BATTLE.FIM_BATALHA` |
| `rubro:xp-ganho` | `BATTLE.FIM_BATALHA` | `BATTLE.FIM_BATALHA` |
| `rubro:capitulo-concluido` | `OVERWORLD` | `OVERWORLD` |
| `rubro:trocar-personagem` | `BATTLE.ESCOLHA_ACAO` | `BATTLE.ESCOLHA_ACAO` |
| `rubro:input-desativado` | Qualquer transição bloqueante | Qualquer |
| `rubro:input-ativado` | Saída de estado bloqueante | Qualquer |

### 11.3 Ordem de Execução em Sequências Críticas

**Sequência de turno completo (ordem garantida):**

```
1. rubro:input-desativado (GameStateManager → BATTLE.EXECUCAO)
2. Executar ação do mais rápido
   ├─ rubro:status-aplicado (se efeito especial aplicado)
   ├─ rubro:personagem-ko (se alvo chegou a 0 HP)
   └─ onAnimacao('ATAQUE') ou onAnimacao('CRITICO')
3. verificarFimBatalha() — se resultado: → rubro:fim-batalha
4. Executar ação do mais lento (mesma sequência)
5. verificarFimBatalha()
6. Aplicar efeitos de status (BATTLE.FIM_TURNO)
   └─ rubro:personagem-ko (se status causou KO)
7. rubro:input-ativado (GameStateManager → BATTLE.ESCOLHA_ACAO)
```

---

## 12. Regras Anti-Loop

1. **Proibição de auto-escuta:** Nenhum módulo emite um evento para o qual ele mesmo é listener.
2. **Proibição de eco:** Nenhum listener emite o mesmo evento que recebeu, mesmo com payload diferente.
3. **Cadeias máximas:** Nenhuma cadeia de eventos possui profundidade maior que 2 (evento A → evento B → fim). Profundidade 3 ou mais é proibida.
4. **Status não emitem eventos:** `aplicarStatus()` em `personagens.js` nunca dispara CustomEvent — apenas altera dados. O evento `rubro:status-aplicado` é responsabilidade do chamador (`dano.js` ou `turnos.js`).
5. **KO não dispara FIM_BATALHA diretamente:** `rubro:personagem-ko` e `rubro:fim-batalha` são eventos independentes; a verificação de fim de batalha é feita por chamada direta a `verificarFimBatalha()` após cada KO.

---

## 13. Regras Anti-Conflito

1. **Unicidade de emissor:** Dois módulos nunca emitem o mesmo evento — cada evento tem exatamente um emissor canônico.
2. **Sem sobreposição de estado:** Eventos de BATTLE não são processados enquanto estado primário é OVERWORLD e vice-versa.
3. **Fila de diálogo:** Máximo 8 mensagens pendentes; excesso descartado — evita backlog que confundiria o estado de DIALOGUE.
4. **ANIMATION_LOCK exclusivo:** Apenas uma sequência de animação pode ativar `ANIMATION_LOCK` por vez — nova sequência aguarda `onAnimacao` da sequência anterior.
5. **Evolução não empilha:** Se dois personagens evoluem na mesma FIM_BATALHA, as evoluções são processadas sequencialmente — uma por vez.

---

## 14. Contratos entre Módulos

### 14.1 `turnos.js` ↔ `main.js`

| Direção | Mecanismo | Contrato |
|---|---|---|
| `turnos.js` → `main.js` | CustomEvent | `rubro:fim-batalha`, `rubro:personagem-ko`, `rubro:status-aplicado`, `rubro:xp-ganho` |
| `main.js` → `turnos.js` | CustomEvent | `rubro:trocar-personagem` |
| `main.js` → `turnos.js` | Chamada direta | `jogadorEscolheuAtaque(i)`, `jogadorEscolheuItem(item)`, `jogadorEscolheuFugir()` |
| `turnos.js` → `main.js` | Callbacks registrados | `onMensagem(texto)`, `onAnimacao(tipo)`, `onFimBatalha(resultado)` |

**Regra de callbacks:**  
`main.js` registra os callbacks ao instanciar `GerenciadorTurnos`. Os callbacks são a única comunicação síncrona bidirecional autorizada entre estes módulos.

### 14.2 `turnos.js` ↔ `capitulos.js`

| Direção | Mecanismo | Contrato |
|---|---|---|
| `turnos.js` → `capitulos.js` | CustomEvent | `rubro:xp-ganho` |
| `capitulos.js` → sistema | CustomEvent | `rubro:evolucao`, `rubro:capitulo-concluido` |

### 14.3 `sprites.js` ↔ sistema

| Direção | Mecanismo | Contrato |
|---|---|---|
| Sistema → `sprites.js` | CustomEvent | `rubro:personagem-ko`, `rubro:evolucao` |
| `sprites.js` → `turnos.js` | Callback direto | `onAnimacao('KO')`, `onAnimacao('EVOLUCAO')` |

**Regra:** `sprites.js` nunca emite CustomEvents — apenas consome e invoca callbacks.

### 14.4 `dano.js` ↔ sistema

- `dano.js` **não** participa do sistema de eventos como listener.
- `dano.js` **pode** disparar `rubro:status-aplicado` como parte de `aplicarStatus()` quando chamado por `turnos.js`.
- Alternativamente, `turnos.js` pode emitir `rubro:status-aplicado` após chamar `dano.js` — a responsabilidade é de `turnos.js` como orquestrador.

### 14.5 `GameStateManager` ↔ todos os módulos

- `GameStateManager` é o único emissor de `rubro:input-desativado` e `rubro:input-ativado`.
- Nenhum módulo acessa `GameStateManager` diretamente para ler o estado — o estado é inferido pelo contexto de execução e pelos eventos recebidos.
- `GameStateManager` não emite eventos de gameplay.

---

## 15. Integração com GLOBAL_UI_STATES

### 15.1 Roteamento de Eventos por Estado

Conforme GLOBAL_UI_STATES §19.3, `main.js` processa eventos condicionalmente ao estado ativo:

| Estado ativo | Eventos processados ativamente |
|---|---|
| `BATTLE` (qualquer subestado) | `rubro:fim-batalha`, `rubro:personagem-ko`, `rubro:status-aplicado`, `rubro:evolucao`, `rubro:xp-ganho` |
| `OVERWORLD` | `rubro:capitulo-concluido` |
| Qualquer | `rubro:input-desativado`, `rubro:input-ativado` |

Eventos recebidos fora do estado autorizado: descarte silencioso.

### 15.2 Locks e Eventos

| Lock | Ativado por evento | Desativado por evento |
|---|---|---|
| `INPUT_LOCK` | `rubro:input-desativado` | `rubro:input-ativado` |
| `ANIMATION_LOCK` | Início de sequência de animação (interno, sem evento) | Callback `onAnimacao(tipo)` |
| `SAVE_LOCK` | Gerenciado internamente pelo `GameStateManager` baseado no estado | — |

### 15.3 Sincronização de Subestados de BATTLE

Os subestados de BATTLE não emitem CustomEvents entre si — são gerenciados internamente por `GerenciadorTurnos`. O sistema de eventos é o canal de comunicação **para fora** de `turnos.js`, não entre seus subestados internos.

---

## 16. Integração com Gameplay

### 16.1 Ciclo de Turno e Eventos

```
BATTLE.ESCOLHA_ACAO
  ├─ input do jogador → main.js captura
  │   ├─ LUTAR: jogadorEscolheuAtaque(i)        [chamada direta]
  │   ├─ ITENS: jogadorEscolheuItem(item)        [chamada direta]
  │   ├─ TROCAR: emite rubro:trocar-personagem   [CustomEvent]
  │   └─ FUGIR: jogadorEscolheuFugir()           [chamada direta]
  └─ GameStateManager emite rubro:input-desativado
       └─ BATTLE.EXECUCAO
            ├─ dano calculado → rubro:status-aplicado (se aplicável)
            ├─ HP = 0 → rubro:personagem-ko
            └─ verificarFimBatalha()
                 ├─ null → BATTLE.FIM_TURNO
                 │    ├─ aplicarEfeitosStatus()
                 │    │    └─ rubro:personagem-ko (se status causou KO)
                 │    ├─ verificarFimBatalha()
                 │    │    ├─ null → GameStateManager emite rubro:input-ativado
                 │    │    │          └─ BATTLE.ESCOLHA_ACAO
                 │    │    └─ resultado → BATTLE.FIM_BATALHA
                 │    └─ notificações XP/nível
                 └─ resultado → BATTLE.FIM_BATALHA
                        ├─ rubro:fim-batalha
                        ├─ rubro:xp-ganho (por personagem)
                        └─ (via capitulos.js) rubro:evolucao, rubro:capitulo-concluido
```

### 16.2 IA Inimiga e Eventos

A IA inimiga (`calcularAcaoIA()` em `turnos.js`) **não emite eventos** — opera internamente. Os eventos de resultado (dano, KO, status) são emitidos pela mesma lógica de turno independentemente de quem executou a ação.

---

## 17. Regras de Desacoplamento

1. **Módulos de dados puros não participam de eventos:** `personagens.js`, `tipos.js`, `ataques.js`, `balanceamento.js` operam via importação e chamada direta — nunca via CustomEvent.
2. **`sprites.js` é consumidor puro:** nunca emite CustomEvents; apenas reage e invoca callbacks.
3. **`main.js` é o único orquestrador de UI:** nenhum outro módulo manipula o DOM diretamente além de `sprites.js` (canvas e `<img>`).
4. **Sem imports cruzados para comunicação:** se módulo A precisa notificar módulo B de um fato, usa evento — não importa B e chama método.
5. **Sem referências globais compartilhadas:** o estado de batalha vive em `GerenciadorTurnos`; o estado de capítulo vive em `GerenciadorCapitulos`; o estado de UI vive em `GameStateManager`. Nenhum módulo acessa o estado interno de outro módulo diretamente.

---

## 18. Regras de Debugabilidade e Rastreabilidade

### 18.1 Logging de Eventos

Todo evento `rubro:*` **deve** ser logado em modo debug. Implementação sugerida para `main.js`:

```js
const DEBUG = true; // false em produção

function logEvento(nome, payload) {
  if (DEBUG) console.log(`[RUBRO EVENT] ${nome}`, payload, `| estado: ${GameStateManager.current}`);
}

document.addEventListener('rubro:fim-batalha', (e) => {
  logEvento('rubro:fim-batalha', e.detail);
  // ... processamento
});
```

### 18.2 Rastreabilidade de Cadeias

Cadeias autorizadas devem ser logadas com prefixo de cadeia:

```js
// Em capitulos.js, ao emitir rubro:evolucao como consequência de rubro:xp-ganho:
if (DEBUG) console.log('[RUBRO CHAIN] rubro:xp-ganho → rubro:evolucao', { de, para });
```

### 18.3 Identificação de Violações

O sistema deve registrar `console.error` (não `console.warn`) nas seguintes situações:
- Evento emitido fora do estado autorizado (antes do descarte silencioso).
- Evento com payload incompleto ou tipos incorretos.
- `onAnimacao` invocado com tipo não reconhecido.
- Cadeia de profundidade > 2 detectada.

### 18.4 Identificação de Listeners Ativos

Em modo debug, `main.js` mantém um registro interno de listeners ativos:

```js
const _listenersAtivos = new Set(); // ex.: 'rubro:fim-batalha', 'rubro:personagem-ko'
```

Isso permite verificar, a qualquer momento, quais eventos estão sendo escutados e detectar vazamentos de listeners (listeners não removidos após troca de estado).

---

## 19. Regras de Escalabilidade

1. **Novos módulos** que precisam reagir a eventos existentes devem ser adicionados à lista de consumidores autorizados neste documento e em CORE_CONTEXT §11 antes de registrar o listener.
2. **Novos eventos** devem passar pelo processo de registro completo: CORE_CONTEXT §11 + este documento (seções 4, 5, 6, 7, 11, 14) + GLOBAL_UI_STATES §19.3.
3. **Nunca reutilizar** um evento existente com payload diferente — criar novo evento com nome semântico adequado.
4. **Novos cadeias autorizadas** devem ser documentadas explicitamente em §8.
5. **O modelo de bus único via `document`** suporta qualquer número de módulos e eventos sem alteração estrutural — a escalabilidade é garantida pelo design.

---

## 20. Glossário

| Termo | Definição |
|---|---|
| **Event Bus** | Canal de comunicação global via `document.dispatchEvent` / `document.addEventListener` |
| **CustomEvent** | Evento DOM nativo com payload em `event.detail` |
| **Emissor** | Módulo autorizado a disparar um evento específico |
| **Consumidor** | Módulo autorizado a escutar e processar um evento específico |
| **Cadeia autorizada** | Sequência documentada onde evento A dispara evento B como consequência direta |
| **ANIMATION_LOCK** | Flag de lock ativa enquanto sequência de animação aguarda callback `onAnimacao` |
| **INPUT_LOCK** | Flag de lock que remove handlers de input do DOM |
| **Descarte silencioso** | Evento recebido fora do estado autorizado é ignorado sem erro |
| **Callback `onAnimacao`** | Função registrada por `GerenciadorTurnos`; invocada por `main.js` ou `sprites.js` ao concluir animação |
| **Namespace** | Prefixo `rubro:{categoria}` que classifica e identifica cada evento |
| **Payload canônico** | Estrutura de dados definida e imutável para cada evento |
| **GameStateManager** | Árbitro central de estados; único emissor de eventos de input e locks |

---

*EVENT_SYSTEM_CONTEXT.md — RUBRO v1.0*  
*Documento canônico do sistema global de eventos — complementa CORE_CONTEXT.md, UI_CONTEXT.md e GLOBAL_UI_STATES.md*  
*Gerado para consumo por pipeline multiagente LLM*
