# GLOBAL_UI_STATES.md — RUBRO
> Documento canônico de estados globais de UI e gameplay.  
> Leitura obrigatória para toda LLM responsável por: gerenciamento de estados, renderização, navegação, overlays, combate, diálogos, transições, input handling e sincronização visual.  
> Autoridade subordinada a CORE_CONTEXT.md e UI_CONTEXT.md. Em caso de conflito, esses documentos prevalecem.

---

## 0. Hierarquia de Autoridade

```
CORE_CONTEXT.md         ← dados, lógica, módulos, eventos globais
UI_CONTEXT.md           ← visual, paleta, tipografia, layout, animações
GLOBAL_UI_STATES.md     ← estados globais, transições, locks, integração
(implementações LLM)    ← geradas a partir dos três documentos acima
```

Ambiguidades de estado → este documento.  
Ambiguidades visuais → UI_CONTEXT.md.  
Ambiguidades de dados ou lógica → CORE_CONTEXT.md.

---

## 1. Filosofia do Sistema de Estados

### 1.1 Princípios Fundamentais

| Princípio | Definição operacional |
|---|---|
| **Estado único ativo** | Apenas um estado primário ativo em qualquer instante; PAUSE é sobreposição, não substituição |
| **Hierarquia explícita** | Todo estado tem prioridade numérica; conflitos resolvidos deterministicamente |
| **Input controlado por estado** | Nenhum handler de input existe fora do contrato do estado ativo |
| **Renderização orientada por estado** | Cada estado declara exatamente o que renderiza; nada é exibido sem autorização do estado ativo |
| **Transição atômica** | Mudanças de estado são operações atômicas — sem estado parcialmente ativado |
| **Fallback explícito** | Todo estado define o estado de retorno em caso de erro ou interrupção |
| **Sem estado implícito** | Nenhum comportamento pode depender de inferência sobre o estado — o estado é sempre lido de `GameStateManager.current` |

### 1.2 Responsabilidades do Sistema

O sistema de estados é o árbitro central de:
- **O que o jogador pode fazer** (input permitido)
- **O que está visível na tela** (renderização autorizada)
- **Quais overlays estão ativos** (camadas z-index)
- **Quais módulos recebem eventos** (roteamento de eventos)
- **Quando animações podem iniciar** (sincronização de timing)
- **Quando o save pode ocorrer** (locks de persistência)

### 1.3 Contratos Invioláveis

1. `TRANSITION` e `LOADING` sempre bloqueiam input completamente.
2. `PAUSE` nunca destrói o estado subjacente — congela sem desmontá-lo.
3. `BATTLE.EXECUCAO` nunca aceita input do jogador.
4. Nenhum estado pode ativar outro sem passar pelo `GameStateManager`.
5. Eventos `rubro:input-desativado` e `rubro:input-ativado` são emitidos exclusivamente pelo `GameStateManager` durante transições.
6. O estado `BOOT` é o único estado que pode existir sem um estado anterior.

---

## 2. Estrutura Hierárquica dos Estados

### 2.1 Árvore de Estados

```
ROOT
├── BOOT                          [transitório, absoluto]
├── MAIN_MENU                     [primário]
│   └── SETTINGS                  [overlay sobre MAIN_MENU]
├── LOADING                       [transitório, bloqueante]
├── TRANSITION                    [transitório, bloqueante]
├── OVERWORLD                     [primário, persistente]
│   ├── DIALOGUE (overworld)      [overlay sobre OVERWORLD]
│   ├── INVENTORY                 [overlay sobre OVERWORLD]
│   ├── SETTINGS                  [overlay sobre OVERWORLD via PAUSE]
│   └── PAUSE                     [sobreposição]
├── CUTSCENE                      [primário, transitório]
│   └── DIALOGUE (cutscene)       [overlay sobre CUTSCENE]
├── BATTLE                        [primário, persistente]
│   ├── BATTLE.ESCOLHA_ACAO       [subestado ativo — input habilitado]
│   ├── BATTLE.EXECUCAO           [subestado ativo — input bloqueado]
│   ├── BATTLE.FIM_TURNO          [subestado ativo — input bloqueado]
│   ├── BATTLE.FIM_BATALHA        [subestado terminal]
│   ├── DIALOGUE (battle)         [overlay sobre BATTLE]
│   └── PAUSE                     [sobreposição]
└── GAME_OVER                     [primário, terminal]
```

### 2.2 Classificação de Estados

| Classificação | Descrição | Estados |
|---|---|---|
| **Primário** | Estado principal ativo; define contexto de gameplay | MAIN_MENU, OVERWORLD, BATTLE, CUTSCENE, GAME_OVER |
| **Overlay** | Sobrepõe sem destruir o primário; não altera contexto | DIALOGUE, INVENTORY, SETTINGS, PAUSE |
| **Transitório** | Dura apenas enquanto a operação é executada | BOOT, LOADING, TRANSITION |
| **Bloqueante** | Impede qualquer input do jogador | BOOT, LOADING, TRANSITION, BATTLE.EXECUCAO, BATTLE.FIM_TURNO, CUTSCENE |
| **Persistente** | Mantém estado entre sub-transições | OVERWORLD, BATTLE |
| **Terminal** | Não retorna ao estado anterior; encerra o fluxo corrente | BATTLE.FIM_BATALHA, GAME_OVER |

---

## 3. Definição Canônica de Cada Estado

### 3.1 Esquema de Definição

Cada estado é definido pelos seguintes campos:

| Campo | Descrição |
|---|---|
| `objetivo` | O que o estado realiza funcionalmente |
| `responsabilidade` | Qual módulo gerencia a lógica interna |
| `prioridade` | Valor numérico (maior = mais prioritário); usado para resolver conflitos |
| `persistência` | Se o estado serializa dados via `localStorage` |
| `renderização` | Elementos HTML/Canvas ativos durante o estado |
| `input` | Handlers aceitos pelo estado |
| `overlays_permitidos` | Estados que podem sobrepor este |
| `estados_compatíveis` | Subestados que podem coexistir |
| `transições_válidas` | Destinos válidos a partir deste estado |
| `bloqueios` | Operações proibidas enquanto o estado estiver ativo |
| `fallback` | Estado de retorno em caso de erro |

---

### 3.2 BOOT

| Campo | Valor |
|---|---|
| **Objetivo** | Inicializar o motor, pré-carregar todos os assets via `preCarregarTodos()`, instanciar módulos obrigatórios |
| **Responsabilidade** | `main.js` → `JogoRUBRO.iniciar()` |
| **Prioridade** | 100 (absoluta — nenhum outro estado pode interrompê-lo) |
| **Persistência** | Não — nenhum dado de jogo existe ainda |
| **Renderização** | Overlay de loading fullscreen (z-index 80); sem HUD, sem menus |
| **Input** | Nenhum |
| **Overlays permitidos** | Nenhum |
| **Estados compatíveis** | Nenhum |
| **Transições válidas** | → `MAIN_MENU` (ao concluir carregamento) |
| **Bloqueios** | Save proibido; eventos de gameplay ignorados |
| **Fallback** | Permanecer em BOOT; exibir mensagem de erro no overlay |

**Eventos esperados durante BOOT:**
- Nenhum evento `rubro:*` é emitido nem consumido.
- Ao concluir: `GameStateManager.transition(BOOT → MAIN_MENU)`.

---

### 3.3 MAIN_MENU

| Campo | Valor |
|---|---|
| **Objetivo** | Apresentar opções de novo jogo, continuar e configurações |
| **Responsabilidade** | `main.js` → orquestração; `capitulos.js` → verificação de save |
| **Prioridade** | 70 |
| **Persistência** | Não — sem contexto de jogo ativo |
| **Renderização** | Tela fullscreen: logo RUBRO, menu (NOVO JOGO / CONTINUAR / CONFIGURAÇÕES), versão; partículas idle no background |
| **Input** | Arrow keys / clique / toque para navegar; Enter / Space / clique para selecionar |
| **Overlays permitidos** | `SETTINGS` |
| **Estados compatíveis** | Nenhum |
| **Transições válidas** | → `LOADING` → `OVERWORLD` (Novo Jogo); → `LOADING` → `OVERWORLD` (Continuar); → `SETTINGS` |
| **Bloqueios** | `CONTINUAR` desabilitado se `localStorage` sem save válido; save proibido |
| **Fallback** | Permanecer em MAIN_MENU |

**Regras de renderização:**
- `CONTINUAR` exibe texto `--color-text-dim` e sem cursor de seleção se save ausente.
- Partículas idle: Canvas z-index 0, máximo 10 partículas simultâneas, sem interação.

---

### 3.4 LOADING

| Campo | Valor |
|---|---|
| **Objetivo** | Executar operações assíncronas pesadas (carregamento de capítulo, assets) sem expor progresso ao jogador |
| **Responsabilidade** | `main.js` coordena; `sprites.js` e `capitulos.js` executam |
| **Prioridade** | 90 |
| **Persistência** | Não — transitório |
| **Renderização** | Overlay de loading fullscreen (z-index 80): fundo `--color-bg` sólido, ícone celular animado, texto "CARREGANDO..." |
| **Input** | Nenhum |
| **Overlays permitidos** | Nenhum |
| **Estados compatíveis** | Nenhum |
| **Transições válidas** | → qualquer estado destino ao concluir a operação assíncrona |
| **Bloqueios** | Toda interação do jogador; save proibido durante loading |
| **Fallback** | → `MAIN_MENU` em caso de falha crítica de carregamento |

**Contrato de ativação:**
- Sempre precedido de `rubro:input-desativado`.
- Sempre encerrado com `rubro:input-ativado` após transição para o estado destino.

---

### 3.5 TRANSITION

| Campo | Valor |
|---|---|
| **Objetivo** | Executar animação de transição visual entre dois estados sem manter gameplay |
| **Responsabilidade** | `main.js` → `animarTransicaoCapitulo()` ou fade genérico |
| **Prioridade** | 85 |
| **Persistência** | Não — dura exatamente a duração da animação |
| **Renderização** | Animação de iris / fade / wipe conforme destino (ver UI_CONTEXT §13.4); nenhum HUD ativo durante a transição |
| **Input** | Nenhum |
| **Overlays permitidos** | Nenhum |
| **Estados compatíveis** | Nenhum |
| **Transições válidas** | → qualquer estado destino ao concluir animação |
| **Bloqueios** | Toda interação; save proibido |
| **Fallback** | → estado destino imediatamente (pular animação) em caso de timeout > 3000ms |

**Timings canônicos por origem→destino:**

| Origem → Destino | Animação | Duração |
|---|---|---|
| OVERWORLD → BATTLE | Fade preto | 300ms |
| BATTLE → OVERWORLD | Fade preto | 300ms |
| Capítulo N → N+1 | Iris-out + texto + iris-in | 1800ms |
| Qualquer → LOADING | Fade preto | 200ms |
| Qualquer → PAUSE | Escurecimento 75% | 150ms |

---

### 3.6 OVERWORLD

| Campo | Valor |
|---|---|
| **Objetivo** | Exibir mapa de progressão de capítulos, painel do time, acesso ao inventário e início de capítulo |
| **Responsabilidade** | `main.js` + `capitulos.js` (GerenciadorCapitulos) |
| **Prioridade** | 50 |
| **Persistência** | Sim — estado de save ativo; dados persistidos em `localStorage` |
| **Renderização** | Mapa de capítulos, painel do time ativo, botão de inventário; sem HUD de batalha |
| **Input** | Navegação no mapa, seleção de capítulo, acesso ao inventário, abertura de pausa |
| **Overlays permitidos** | `DIALOGUE`, `INVENTORY`, `PAUSE` |
| **Estados compatíveis** | Nenhum |
| **Transições válidas** | → `TRANSITION` → `DIALOGUE` (início de capítulo); → `TRANSITION` → `BATTLE`; → `INVENTORY`; → `SETTINGS` (via PAUSE); → `PAUSE` |
| **Bloqueios** | Nenhum durante input ativo; input bloqueado durante `DIALOGUE` sobreposto |
| **Fallback** | Permanecer em OVERWORLD |

**Regras de persistência:**
- Save automático disparado apenas ao concluir `BATTLE.FIM_BATALHA` e retornar ao OVERWORLD.
- Nunca salvar durante TRANSITION ou LOADING.

---

### 3.7 DIALOGUE

> Estado de overlay — não substitui o estado primário subjacente.

| Campo | Valor |
|---|---|
| **Objetivo** | Exibir sequências de diálogo narrativo ou educacional (Prof. Imuno) sobre o estado ativo |
| **Responsabilidade** | `main.js` → `mostrarDialogo()` / `fecharDialogo()` / `mostrarCardProfImuno()` |
| **Prioridade** | 65 |
| **Persistência** | Não — temporário; conteúdo descartado ao fechar |
| **Renderização** | `#caixa-dialogo` ativo (z-index 40); estado primário subjacente permanece renderizado mas congelado; avatar visível apenas em diálogos narrativos |
| **Input** | Avançar diálogo (Enter / Space / clique / toque); pular diálogo se não narrativo crítico |
| **Overlays permitidos** | Nenhum (DIALOGUE não empilha sobre si mesmo) |
| **Estados compatíveis** | OVERWORLD, BATTLE, CUTSCENE (qualquer um como subjacente) |
| **Transições válidas** | → estado primário subjacente ao concluir ou fechar |
| **Bloqueios** | Input de gameplay do estado subjacente bloqueado enquanto DIALOGUE ativo; `rubro:input-desativado` emitido na abertura, `rubro:input-ativado` ao fechar |
| **Fallback** | → estado primário subjacente |

**Tipos de diálogo e comportamentos:**

| Contexto | Fonte | Typo | Avatar | Avanço |
|---|---|---|---|---|
| Narrativa/cutscene | Rajdhani 16px | 30ms/char | Sim | Input do jogador |
| Prof. Imuno | Rajdhani 16px | 25ms/char | Sim | Input ou qualquer ação de batalha |
| Resultado de ação | Press Start 2P 10px | Instantâneo | Não | Automático (800ms) |
| KO / Evolução | Press Start 2P 10px | Instantâneo | Não | Automático |

**Fila de mensagens:**
- Máximo 8 mensagens pendentes; excesso descartado com `console.warn`.
- Mensagens de batalha: FIFO, mínimo 800ms por mensagem, avanço automático.
- Mensagens narrativas: aguardam input; sem avanço automático.

---

### 3.8 BATTLE

| Campo | Valor |
|---|---|
| **Objetivo** | Gerenciar combate turno a turno entre o time do jogador e o inimigo ativo do capítulo |
| **Responsabilidade** | `turnos.js` (GerenciadorTurnos) + `main.js` (UI) |
| **Prioridade** | 60 |
| **Persistência** | Sim — estado de batalha mantido em `GerenciadorTurnos`; não persiste em `localStorage` (save apenas pós-batalha) |
| **Renderização** | HUD completo: sprites, barras HP/XP, badges de tipo, indicadores de status, `#caixa-dialogo`, `#menu-acao` ou `#menu-ataques` |
| **Input** | Depende do subestado ativo (ver §4) |
| **Overlays permitidos** | `DIALOGUE`, `PAUSE` |
| **Estados compatíveis** | `BATTLE.ESCOLHA_ACAO`, `BATTLE.EXECUCAO`, `BATTLE.FIM_TURNO`, `BATTLE.FIM_BATALHA` |
| **Transições válidas** | → `DIALOGUE` (mensagens pós-turno); → `PAUSE`; → `TRANSITION` → `OVERWORLD` (pós FIM_BATALHA) |
| **Bloqueios** | Save proibido durante BATTLE; `BATTLE.EXECUCAO` bloqueia input via `rubro:input-desativado` |
| **Fallback** | Permanecer em BATTLE.ESCOLHA_ACAO |

---

### 3.9 INVENTORY

| Campo | Valor |
|---|---|
| **Objetivo** | Exibir, gerenciar e usar itens do jogador |
| **Responsabilidade** | `main.js` (UI) + `capitulos.js` (dados de itens do save) |
| **Prioridade** | 55 |
| **Persistência** | Não — snapshot do save; alterações persistidas ao fechar |
| **Renderização** | Overlay sobre OVERWORLD; lista de itens com quantidade, descrição, botão de uso |
| **Input** | Navegar lista (arrow keys / clique), usar item (Enter / clique), fechar (Escape / botão) |
| **Overlays permitidos** | Nenhum |
| **Estados compatíveis** | OVERWORLD (como subjacente) |
| **Transições válidas** | → `OVERWORLD` |
| **Bloqueios** | Uso de item com quantidade 0 bloqueado com feedback imediato |
| **Fallback** | → `OVERWORLD` |

> Nota: INVENTORY não é acessível durante BATTLE. Uso de itens em batalha é feito via `#btn-itens` no menu de ação, que não ativa o estado INVENTORY — opera diretamente via `GerenciadorTurnos.jogadorEscolheuItem()`.

---

### 3.10 PAUSE

| Campo | Valor |
|---|---|
| **Objetivo** | Suspender o estado atual sem destruí-lo; oferecer acesso a configurações ou saída ao menu principal |
| **Responsabilidade** | `main.js` |
| **Prioridade** | 80 (máxima entre estados não-bloqueantes de sistema) |
| **Persistência** | Sim — congela o estado subjacente sem desmontá-lo |
| **Renderização** | Overlay 75% opaco (`rgba(0,0,0,0.75)`) sobre estado ativo; menu centralizado: CONTINUAR / CONFIGURAÇÕES / MENU PRINCIPAL |
| **Input** | Navegar menu (arrow keys / clique / toque), selecionar (Enter / Space / clique), fechar pausa (Escape ou CONTINUAR) |
| **Overlays permitidos** | `SETTINGS` |
| **Estados compatíveis** | OVERWORLD, BATTLE (qualquer subestado exceto EXECUCAO e FIM_TURNO) |
| **Transições válidas** | → estado subjacente (CONTINUAR ou Escape); → `SETTINGS`; → `MAIN_MENU` (com confirmação) |
| **Bloqueios** | Proibido em: `LOADING`, `TRANSITION`, `CUTSCENE`, `BOOT`, `BATTLE.EXECUCAO`, `BATTLE.FIM_TURNO` |
| **Fallback** | → estado subjacente |

**Regra de ativação:**
- Ativado por keypress de pausa (ex.: `Escape` ou tecla P) **apenas** se o estado atual não está em lista de bloqueio.
- Animações em curso **não são interrompidas** — o estado visual congela; timers CSS pausam via `animation-play-state: paused`.

---

### 3.11 SETTINGS

| Campo | Valor |
|---|---|
| **Objetivo** | Permitir ajuste de volume de música, volume de efeitos, velocidade de texto e modo de redução de movimento |
| **Responsabilidade** | `main.js` |
| **Prioridade** | 75 |
| **Persistência** | Sim — configurações persistidas em `localStorage` separado do save de jogo |
| **Renderização** | Overlay sobre MAIN_MENU ou PAUSE; sliders de volume, seletor de velocidade de texto, toggle de movimento reduzido |
| **Input** | Ajustar parâmetros (sliders / arrow keys), fechar (Escape ou botão Voltar) |
| **Overlays permitidos** | Nenhum |
| **Estados compatíveis** | MAIN_MENU, PAUSE (como subjacente) |
| **Transições válidas** | → estado subjacente (MAIN_MENU ou PAUSE) |
| **Bloqueios** | Nenhum além dos herdados do estado subjacente |
| **Fallback** | → estado subjacente |

**Parâmetros canônicos de configuração:**

| Parâmetro | Tipo | Valores | Default |
|---|---|---|---|
| `volumeMusica` | Number | 0–100 | 80 |
| `volumeEfeitos` | Number | 0–100 | 80 |
| `velocidadeTexto` | Enum | `LENTO` (30ms) / `NORMAL` (25ms) / `INSTANTANEO` | `NORMAL` |
| `reducaoMovimento` | Boolean | true / false | false |

---

### 3.12 CUTSCENE

| Campo | Valor |
|---|---|
| **Objetivo** | Exibir sequências cinemáticas narrativas com sprites, diálogos e música |
| **Responsabilidade** | `main.js` → `mostrarTelaCutscene(cenas[], callback)` |
| **Prioridade** | 65 |
| **Persistência** | Não — transitório |
| **Renderização** | Fullscreen ou overlay com sprites e caixa de diálogo; z-index 80 |
| **Input** | Pular cutscene (Enter / Space — com confirmação se narrativa crítica); avançar cena individualmente |
| **Overlays permitidos** | `DIALOGUE` (para falas das cenas) |
| **Estados compatíveis** | `DIALOGUE` como subestado interno |
| **Transições válidas** | → `OVERWORLD`; → `BATTLE` (ao concluir o array de cenas, executa callback) |
| **Bloqueios** | PAUSE proibido durante CUTSCENE |
| **Fallback** | → executa callback imediatamente e vai para destino |

---

### 3.13 GAME_OVER

| Campo | Valor |
|---|---|
| **Objetivo** | Sinalizar derrota do jogador (time completamente desmontado); oferecer retorno ao menu principal |
| **Responsabilidade** | `main.js` (acionado por `rubro:fim-batalha` com `resultado: 'DERROTA'` e sem personagens vivos) |
| **Prioridade** | 70 |
| **Persistência** | Não — save não é gravado em GAME_OVER |
| **Renderização** | Tela fullscreen: fundo preto, texto "GAME OVER" em Press Start 2P 16px `--color-primary`, opção TENTAR NOVAMENTE / MENU PRINCIPAL |
| **Input** | Selecionar opção (Enter / clique) |
| **Overlays permitidos** | Nenhum |
| **Estados compatíveis** | Nenhum |
| **Transições válidas** | → `LOADING` → `OVERWORLD` (Tentar Novamente — restaura save anterior); → `MAIN_MENU` |
| **Bloqueios** | Save proibido |
| **Fallback** | → `MAIN_MENU` |

---

## 4. Subestados de BATTLE

Os subestados de BATTLE são gerenciados internamente por `GerenciadorTurnos`. A UI reage a eles via callbacks e eventos — não os controla diretamente.

### 4.1 BATTLE.ESCOLHA_ACAO

| Campo | Valor |
|---|---|
| **Objetivo** | Aguardar a escolha de ação do jogador para o turno atual |
| **Prioridade** | 60.1 |
| **Input** | `#btn-lutar`, `#btn-itens`, `#btn-trocar`, `#btn-fugir`; navegação e seleção no `#menu-ataques` se LUTAR foi selecionado |
| **Renderização** | `#menu-acao` ou `#menu-ataques` visível; HUD completo; `#caixa-dialogo` com texto de prompt |
| **Bloqueios** | Ataques com PP = 0 não selecionáveis; `#btn-fugir` desabilitado em batalhas de boss |
| **Transição interna** | → `BATTLE.EXECUCAO` ao confirmar ação |

### 4.2 BATTLE.EXECUCAO

| Campo | Valor |
|---|---|
| **Objetivo** | Executar as ações do jogador e do inimigo, processar dano, aplicar status, exibir animações |
| **Prioridade** | 60.4 (mais alta entre subestados — bloqueia input) |
| **Input** | Nenhum — `rubro:input-desativado` ativo |
| **Renderização** | Animações de sprite (`ATACAR`, `RECEBER_DANO`), partículas, números flutuantes, atualização de barras HP |
| **Bloqueios** | Todo input do jogador; PAUSE bloqueado |
| **Transição interna** | → `BATTLE.FIM_TURNO` ao concluir execução; → `BATTLE.FIM_BATALHA` se condição de fim detectada |

**Sequência de execução por turno:**
1. Determinar ordem (velocidade do personagem ativo vs inimigo)
2. Executar ação do mais rápido → emitir animações → aguardar callback `onAnimacao`
3. Verificar `verificarFimBatalha()` → se resultado ≠ null → `BATTLE.FIM_BATALHA`
4. Executar ação do mais lento → emitir animações → aguardar callback
5. Verificar `verificarFimBatalha()` novamente
6. → `BATTLE.FIM_TURNO`

### 4.3 BATTLE.FIM_TURNO

| Campo | Valor |
|---|---|
| **Objetivo** | Aplicar efeitos de status por turno, exibir notificações de XP e nível, processar desbloqueios |
| **Prioridade** | 60.3 |
| **Input** | Nenhum — `rubro:input-desativado` ativo |
| **Renderização** | Feedback de dano de status (pulsos, névoas), notificações de XP (acima do painel aliado), notificação de nível (centro da tela) |
| **Bloqueios** | Todo input do jogador |
| **Transição interna** | → `BATTLE.ESCOLHA_ACAO` após processar todos os efeitos e notificações; → `BATTLE.FIM_BATALHA` se status causou KO final |

**Sequência de FIM_TURNO:**
1. `aplicarEfeitosStatus()` — feedback visual para cada dano de status
2. `verificarFimBatalha()` — se resultado ≠ null → `BATTLE.FIM_BATALHA`
3. Processar fila de notificações (XP, nível)
4. Emitir `rubro:input-ativado`
5. → `BATTLE.ESCOLHA_ACAO`

### 4.4 BATTLE.FIM_BATALHA

| Campo | Valor |
|---|---|
| **Objetivo** | Processar resultado da batalha (vitória ou derrota), distribuir XP, verificar evoluções, preparar retorno ao overworld |
| **Prioridade** | 60.5 (terminal — não retorna a subestados anteriores) |
| **Input** | Nenhum durante processamento; avançar diálogo ao exibir resultado |
| **Renderização** | Exibir `rubro:fim-batalha` resultado via DIALOGUE; sequência de evolução se aplicável; XP ganho |
| **Bloqueios** | Todo input de gameplay; save adiado até retorno ao OVERWORLD |
| **Transição** | → `DIALOGUE` (resultado) → `TRANSITION` → `OVERWORLD` (vitória/derrota) → `GAME_OVER` (derrota sem save restaurável) |

**Sequência de FIM_BATALHA (vitória):**
1. Emitir `rubro:fim-batalha` `{ resultado: 'VITORIA' }`
2. Exibir DIALOGUE com resultado e XP ganho
3. Para cada personagem: `ganharXP(xp)` → `podeEvoluir()` → sequência de evolução se aplicável
4. `capitulos.js` → `finalizarCapitulo(resultado)` → `verificarDesbloqueios()`
5. TRANSITION → OVERWORLD → save em `localStorage`

**Sequência de FIM_BATALHA (derrota):**
1. Emitir `rubro:fim-batalha` `{ resultado: 'DERROTA' }`
2. Feedback de KO do último personagem (vinheta vermelha, sprite grayscale)
3. DIALOGUE com resultado
4. → `GAME_OVER` (sem save)

---

## 5. Regras de Prioridade entre Estados

### 5.1 Tabela de Prioridade

| Prioridade | Estado | Pode ser interrompido por |
|---|---|---|
| 100 | BOOT | Ninguém |
| 90 | LOADING | Ninguém |
| 85 | TRANSITION | Ninguém |
| 80 | PAUSE | SETTINGS |
| 75 | SETTINGS | Ninguém (enquanto ativo) |
| 70 | MAIN_MENU, GAME_OVER | LOADING, TRANSITION |
| 65 | DIALOGUE, CUTSCENE | TRANSITION (apenas via callback) |
| 60.5 | BATTLE.FIM_BATALHA | Ninguém |
| 60.4 | BATTLE.EXECUCAO | Ninguém |
| 60.3 | BATTLE.FIM_TURNO | Ninguém |
| 60.1 | BATTLE.ESCOLHA_ACAO | DIALOGUE, PAUSE |
| 60 | BATTLE | DIALOGUE, PAUSE, TRANSITION |
| 55 | INVENTORY | Ninguém (enquanto ativo) |
| 50 | OVERWORLD | DIALOGUE, INVENTORY, PAUSE, TRANSITION |

### 5.2 Regra de Resolução de Conflito

Se dois estados tentam ativar simultaneamente:
1. O estado de maior prioridade vence.
2. Se prioridades iguais: o estado solicitante mais recente vence.
3. O estado perdedor é descartado silenciosamente (sem erro, sem log desnecessário).

---

## 6. Regras de Transição

### 6.1 Contrato de Transição

Toda transição entre estados segue este protocolo:

```
1. GameStateManager.transition(origem, destino)
2.   → emitir rubro:input-desativado
3.   → executar lógica de saída do estado origem (cleanup, congelo)
4.   → ativar TRANSITION se animação visual necessária
5.   → executar lógica de entrada do estado destino (setup, renderização)
6.   → emitir rubro:input-ativado (se destino aceita input)
7.   → atualizar GameStateManager.current = destino
```

### 6.2 Mapa de Transições Válidas

```
BOOT             → MAIN_MENU
MAIN_MENU        → LOADING, SETTINGS
LOADING          → qualquer estado destino
TRANSITION       → qualquer estado destino
OVERWORLD        → TRANSITION→DIALOGUE→BATTLE, INVENTORY, PAUSE, SETTINGS (via PAUSE)
DIALOGUE         → estado primário subjacente
BATTLE           → DIALOGUE, PAUSE, TRANSITION→OVERWORLD
BATTLE.ESCOLHA   → BATTLE.EXECUCAO
BATTLE.EXECUCAO  → BATTLE.FIM_TURNO, BATTLE.FIM_BATALHA
BATTLE.FIM_TURNO → BATTLE.ESCOLHA_ACAO, BATTLE.FIM_BATALHA
BATTLE.FIM_BATALHA → DIALOGUE→TRANSITION→OVERWORLD, GAME_OVER
INVENTORY        → OVERWORLD
PAUSE            → estado subjacente, SETTINGS, LOADING→MAIN_MENU
SETTINGS         → estado subjacente
CUTSCENE         → OVERWORLD, BATTLE (via callback)
GAME_OVER        → LOADING→OVERWORLD, MAIN_MENU
```

### 6.3 Transições Proibidas

| Origem | Destino proibido | Motivo |
|---|---|---|
| BATTLE.EXECUCAO | PAUSE | Input bloqueado; não interrompível |
| BATTLE.FIM_TURNO | PAUSE | Input bloqueado; não interrompível |
| CUTSCENE | PAUSE | Cinemáticas não são pausáveis |
| LOADING | qualquer exceto destino da operação | Carregamento é atômico |
| TRANSITION | qualquer exceto destino definido | Transição é atômica |
| BOOT | qualquer exceto MAIN_MENU | Inicialização é sequencial |
| qualquer | BOOT | BOOT só ocorre na inicialização |

---

## 7. Regras de Input

### 7.1 Matriz de Input por Estado

| Estado | Teclado aceito | Mouse/Toque aceito | Rubro eventos gerados |
|---|---|---|---|
| BOOT | Nenhum | Nenhum | Nenhum |
| MAIN_MENU | Arrow keys, Enter, Space | Clique | Nenhum |
| LOADING | Nenhum | Nenhum | Nenhum |
| TRANSITION | Nenhum | Nenhum | Nenhum |
| OVERWORLD | Arrow keys, Enter, Space, Escape (pause) | Clique, toque | Nenhum direto |
| DIALOGUE | Enter, Space, Escape | Clique, toque | Nenhum direto |
| BATTLE.ESCOLHA | Arrow keys, Enter, Space, Escape (pause) | Clique, toque | `rubro:trocar-personagem` |
| BATTLE.EXECUCAO | Nenhum | Nenhum | Nenhum |
| BATTLE.FIM_TURNO | Nenhum | Nenhum | Nenhum |
| BATTLE.FIM_BATALHA | Enter, Space (avançar diálogo) | Clique | Nenhum |
| INVENTORY | Arrow keys, Enter, Escape | Clique, toque | Nenhum |
| PAUSE | Arrow keys, Enter, Escape | Clique, toque | Nenhum |
| SETTINGS | Arrow keys, Enter, Escape | Clique, arrasto (sliders) | Nenhum |
| CUTSCENE | Enter, Space (pular/avançar) | Clique | Nenhum |
| GAME_OVER | Arrow keys, Enter | Clique | Nenhum |

### 7.2 Regras de Lock de Input

1. `rubro:input-desativado` remove **todos** os event listeners ativos — nunca apenas oculta elementos.
2. `rubro:input-ativado` reinstala apenas os listeners do **estado atual**.
3. Nenhum módulo além de `main.js` (GameStateManager) pode emitir `rubro:input-desativado` ou `rubro:input-ativado`.
4. Ataques com PP = 0: não removidos da UI, mas não selecionáveis — feedback imediato `Press Start 2P` 8px `#CC2233` "SEM PP!" na caixa de diálogo.
5. `#btn-fugir` desabilitado estruturalmente em batalhas de boss — não pode ser reabilitado por código de módulo.
6. A seta `▸` sempre reflete o elemento com foco ativo — nunca ambígua.

### 7.3 Confirmações Obrigatórias

| Ação | Confirmação requerida |
|---|---|
| Fugir da batalha (não-boss) | 1 passo: "FUGIR?" com [SIM] [NÃO] |
| Ir para MENU PRINCIPAL via PAUSE | 1 passo: "SAIR PARA O MENU? PROGRESSO SERÁ PERDIDO" com [SIM] [NÃO] |
| Pular cutscene crítica | 1 passo: "PULAR CUTSCENE?" com [SIM] [NÃO] |

---

## 8. Regras de Renderização

### 8.1 Autorização de Renderização por Estado

| Elemento | BOOT | MAIN_MENU | OVERWORLD | BATTLE | DIALOGUE | PAUSE | CUTSCENE | LOADING |
|---|---|---|---|---|---|---|---|---|
| Background cenário | ✗ | ✗ | ✓ | ✓ | Herdado | Congelado | ✓ | ✗ |
| `#sprite-inimigo` | ✗ | ✗ | ✗ | ✓ | Herdado | Congelado | ✗ | ✗ |
| `#sprite-aliado` | ✗ | ✗ | ✗ | ✓ | Herdado | Congelado | ✗ | ✗ |
| Canvas partículas | ✗ | ✓ (idle) | ✗ | ✓ | Herdado | Congelado | ✗ | ✗ |
| HUD (barras, badges) | ✗ | ✗ | ✗ | ✓ | Herdado | Congelado | ✗ | ✗ |
| `#caixa-dialogo` | ✗ | ✗ | ✓ (se ativo) | ✓ | ✓ | ✗ | ✓ | ✗ |
| `#menu-acao` | ✗ | ✗ | ✗ | ✓ (ESCOLHA) | ✗ | ✗ | ✗ | ✗ |
| Overlay fullscreen | Loading | Logo+menu | ✗ | ✗ | ✗ | 75% opaco | Cenas | Loading |
| Números flutuantes | ✗ | ✗ | ✗ | ✓ | ✗ | Congelado | ✗ | ✗ |

**Regra de herança:** estados de overlay (DIALOGUE, INVENTORY, PAUSE) herdam a renderização do estado primário subjacente e adicionam sua própria camada. "Congelado" = renderizado mas sem atualização de lógica.

### 8.2 Ordem de Renderização (z-index canônica)

```
z:  0 — Background (cenário)
z: 10 — #sprite-inimigo, #sprite-aliado
z: 20 — Canvas de partículas
z: 30 — HUD (barras HP/XP, badges, status)
z: 40 — #caixa-dialogo
z: 50 — #menu-acao, #menu-ataques
z: 60 — Overlays de feedback (números flutuantes, flashes, vinhetas)
z: 70 — Overlays de estado (KO vinheta, evolução, transição)
z: 80 — Fullscreen (cutscenes, loading, main menu, GAME_OVER)
z: 90 — PAUSE overlay
```

Nenhum componente futuro pode usar z-index entre 60–90 sem registrar aqui.

### 8.3 Invalidação de Renderização

Situações que exigem invalidação e re-renderização imediata:

| Evento | Elementos a invalidar |
|---|---|
| Troca de personagem ativo | `#sprite-aliado`, `#nome-aliado`, `#barra-hp-aliado`, `#barra-xp-aliado`, `#menu-ataques` — todos simultaneamente |
| Dano/cura recebido | `#barra-hp-[aliado|inimigo]`, número flutuante |
| Status aplicado/removido | Indicador de status no HUD do personagem afetado |
| XP ganho | `#barra-xp-aliado` |
| Evolução | `#sprite-aliado`, `#nome-aliado`, badge de tipo |
| Mudança de subestado BATTLE | `#menu-acao` / `#menu-ataques` (visibilidade) |

**Regras de atualização de barras:**
- Barras de HP nunca exibem valores negativos — clampar em 0.
- PP nunca exibe valor negativo — exibir 0 se PP = 0.
- Barras nunca saltam valores — sempre animadas (200ms linear para HP, 300ms propagação para XP).

### 8.4 Limites Anti-Poluição Visual

Conforme UI_CONTEXT §17:
- Máximo 3 elementos animados simultaneamente na tela de batalha (exceto idle).
- Máximo 2 overlays simultâneos — fechar o anterior antes de abrir o próximo.
- Máximo 1 número flutuante por frame por personagem.
- Máximo 30 partículas simultâneas no Canvas.
- Máximo 2 ícones de status visíveis por personagem no HUD.
- Máximo 2 linhas de texto visíveis na caixa de diálogo.

---

## 9. Estados Bloqueantes

Estados que bloqueiam **completamente** qualquer input e não podem ser interrompidos por PAUSE:

| Estado | Duração típica | Encerramento |
|---|---|---|
| BOOT | Até assets carregados | Conclusão de `preCarregarTodos()` |
| LOADING | Até operação assíncrona | Callback de conclusão |
| TRANSITION | Duração da animação (150–1800ms) | Timer exato da animação |
| BATTLE.EXECUCAO | ≤ 1200ms por ação | Callback `onAnimacao` |
| BATTLE.FIM_TURNO | Duração dos efeitos de status | Conclusão da fila de efeitos |
| CUTSCENE | Duração da sequência | Conclusão do array de cenas ou pulo |

**Invariante:** durante qualquer estado bloqueante, `rubro:input-desativado` **deve** estar ativo. Verificação: se `GameStateManager.isBlocking() === true` e `rubro:input-ativado` foi emitido sem `rubro:input-desativado` subsequente, é um bug crítico.

---

## 10. Estados de Sobreposição (Overlays)

Estados que coexistem com um estado primário sem destruí-lo:

| Overlay | Sobrepõe | Congela subjacente? | Remove ao fechar? |
|---|---|---|---|
| PAUSE | Qualquer primário (exceto bloqueantes) | Sim — animações pausam | Sim — subjacente retoma |
| DIALOGUE | OVERWORLD, BATTLE, CUTSCENE | Sim — gameplay pausa | Sim — subjacente retoma |
| INVENTORY | OVERWORLD | Sim | Sim |
| SETTINGS | MAIN_MENU, PAUSE | Sim | Sim |

**Regra de empilhamento:** máximo 1 overlay por vez (exceto SETTINGS sobre PAUSE, que é o único empilhamento duplo permitido). Tentar abrir um segundo overlay descarta o primeiro com `fecharDialogo()` ou equivalente.

---

## 11. Estados Temporários

Estados que existem por uma duração definida e encerram autonomamente:

| Estado | Duração | Encerramento automático |
|---|---|---|
| TRANSITION | Exatamente a duração da animação | Sim — timer |
| LOADING | Até conclusão assíncrona | Sim — callback |
| BOOT | Até assets prontos | Sim — callback de `preCarregarTodos()` |
| BATTLE.EXECUCAO | ≤ 1200ms por evento | Sim — `onAnimacao` callback |
| BATTLE.FIM_TURNO | Duração da fila de efeitos | Sim — fila drenada |

Nenhum estado temporário pode permanecer ativo indefinidamente. Se timeout exceder 3000ms em TRANSITION ou 10000ms em LOADING, executar fallback.

---

## 12. Regras de Persistência

### 12.1 Quando Salvar

| Momento | Operação | Estado ativo |
|---|---|---|
| Ao retornar ao OVERWORLD pós-vitória | Save completo em `localStorage` | OVERWORLD (logo após ativar) |
| Ao alterar configurações | Save de configurações (slot separado) | SETTINGS |

### 12.2 Quando NÃO Salvar

| Estado ativo | Motivo |
|---|---|
| BATTLE (qualquer subestado) | Estado de batalha não é persistível |
| LOADING | Operação assíncrona em curso |
| TRANSITION | Estado visual intermediário |
| BOOT | Nenhum estado de jogo existe |
| GAME_OVER | Derrota não é serializada |

### 12.3 Estrutura do Save (conforme CORE_CONTEXT §6.6)

```js
{
  capituloAtual: Number,
  timeJogador: Personagem[],   // toJSON() de cada AgentImune
  itens: Object,
  xpCadaPersonagem: Object     // { nome: xpTotal }
}
```

Save de configurações (slot separado, chave `rubro:config`):
```js
{
  volumeMusica: Number,
  volumeEfeitos: Number,
  velocidadeTexto: String,
  reducaoMovimento: Boolean
}
```

---

## 13. Sistema de Pause

### 13.1 Regras de Ativação

- Tecla de pausa (`Escape` ou `P`) capturada em nível global pelo `GameStateManager`.
- Ativação só ocorre se `GameStateManager.isPausable() === true`.

**`isPausable()` retorna `false` em:**
- BOOT, LOADING, TRANSITION
- CUTSCENE
- BATTLE.EXECUCAO
- BATTLE.FIM_TURNO
- BATTLE.FIM_BATALHA
- GAME_OVER

### 13.2 Comportamento de Congelamento

1. Emite `rubro:input-desativado`.
2. Aplica `animation-play-state: paused` em todos os elementos animados.
3. Renderiza overlay PAUSE (z-index 90).
4. Instala listeners exclusivos do menu de pausa.

### 13.3 Comportamento de Retomada

1. Remove overlay PAUSE.
2. Aplica `animation-play-state: running` em todos os elementos congelados.
3. Emite `rubro:input-ativado`.
4. Restaura listeners do estado subjacente.

---

## 14. Sistema de Overlays e Modais

### 14.1 Hierarquia de Overlays

Ver §8.2 para z-index completo. Regra adicional:

> Nenhum overlay pode ser renderizado sem que seu estado correspondente esteja ativo em `GameStateManager`. Overlays "soltos" (renderizados sem estado) são bugs críticos.

### 14.2 Modal de Confirmação

Usado para ações irreversíveis (ver §7.3). Comportamento:

- Renderizado sobre o overlay atual (z-index máximo do contexto + 1).
- Input: apenas as opções do modal respondem.
- Fechar sem confirmar (Escape): cancela a ação; retorna ao estado pré-modal sem mudança.
- Confirmar: executa a ação e dispara a transição correspondente.

### 14.3 Card Educacional (Prof. Imuno)

- Ativado por `mostrarCardProfImuno(dados)`.
- Overlay lateral direito durante BATTLE; centralizado durante OVERWORLD.
- Não bloqueia gameplay de batalha — input de batalha encerra o card.
- Não ativa estado DIALOGUE — é um componente de exibição puro.
- z-index: 60 (overlays de feedback).

---

## 15. Regras de Sincronização

### 15.1 Sincronização Visual com Gameplay

O módulo `turnos.js` **deve** aguardar o callback `onAnimacao` antes de avançar para o próximo evento de combate. A UI **deve** invocar `onAnimacao` ao concluir cada sequência de animação.

| Evento de combate | UI inicia em | Duração máxima | Callback ao fim |
|---|---|---|---|
| Ataque executado | 0ms | 800ms | `onAnimacao('ATAQUE')` |
| Ataque crítico | 0ms | 1200ms | `onAnimacao('CRITICO')` |
| Status aplicado | 0ms | 600ms | `onAnimacao('STATUS')` |
| KO | 0ms | 1000ms | `onAnimacao('KO')` |
| Evolução | 0ms | 1500ms | `onAnimacao('EVOLUCAO')` |
| Troca de personagem | 0ms | 400ms | `onAnimacao('TROCA')` |
| Transição de capítulo | 0ms | 1800ms | `onAnimacao('TRANSICAO')` |

Se a UI não invocar `onAnimacao` dentro da duração máxima + 500ms de tolerância, `turnos.js` deve prosseguir autonomamente e registrar warning.

### 15.2 Sincronização de Estado ↔ Eventos

| Evento global | Estado que pode emiti-lo | Estados que consomem |
|---|---|---|
| `rubro:fim-batalha` | BATTLE.FIM_BATALHA | `main.js` (→ GAME_OVER ou →DIALOGUE) |
| `rubro:personagem-ko` | BATTLE.EXECUCAO, BATTLE.FIM_TURNO | `main.js`, `sprites.js` |
| `rubro:status-aplicado` | BATTLE.EXECUCAO | `main.js` |
| `rubro:evolucao` | BATTLE.FIM_BATALHA | `main.js`, `sprites.js` |
| `rubro:xp-ganho` | BATTLE.FIM_BATALHA | `capitulos.js` |
| `rubro:capitulo-concluido` | OVERWORLD (pós-batalha) | `main.js` |
| `rubro:trocar-personagem` | BATTLE.ESCOLHA_ACAO | `turnos.js` |
| `rubro:input-desativado` | GameStateManager (transições) | `main.js` |
| `rubro:input-ativado` | GameStateManager (transições) | `main.js` |

---

## 16. Locks Operacionais

Locks são flags booleanas gerenciadas exclusivamente pelo `GameStateManager`. Nenhum módulo lê ou escreve locks diretamente.

| Lock | Ativo em | Efeito |
|---|---|---|
| `INPUT_LOCK` | BOOT, LOADING, TRANSITION, BATTLE.EXECUCAO, BATTLE.FIM_TURNO | Todos os event listeners removidos |
| `SAVE_LOCK` | BATTLE, LOADING, TRANSITION, BOOT, GAME_OVER | `localStorage.setItem` bloqueado para dados de jogo |
| `PAUSE_LOCK` | BOOT, LOADING, TRANSITION, CUTSCENE, BATTLE.EXECUCAO, BATTLE.FIM_TURNO, BATTLE.FIM_BATALHA | Tecla de pausa ignorada |
| `ANIMATION_LOCK` | Durante qualquer sequência com `onAnimacao` pendente | `turnos.js` não avança; novo evento de combate não inicia |
| `OVERLAY_LOCK` | Quando 2 overlays já estão ativos | Terceiro overlay descartado |

---

## 17. Regras de Fallback

| Situação | Fallback |
|---|---|
| TRANSITION excede 3000ms | Pular animação; ativar estado destino imediatamente |
| LOADING excede 10000ms | → MAIN_MENU com mensagem de erro no overlay |
| `onAnimacao` não invocado em tempo | `turnos.js` prossegue; warning no console |
| Fila de diálogos com > 8 mensagens | Descartar excedente; `console.warn` |
| Estado desconhecido em `GameStateManager` | → MAIN_MENU; erro crítico registrado |
| Save corrompido no `localStorage` | `novoJogo()` — estado de save descartado |
| Sprite não carregado | `gerarSpriteSVG(personagem)` (fallback SVG de `sprites.js`) |
| PP = 0 e jogador seleciona ataque | Feedback imediato; ação não executada; retorna a BATTLE.ESCOLHA_ACAO |

---

## 18. Regras Anti-Conflito

1. **Estados mutuamente exclusivos:** BATTLE e OVERWORLD nunca estão ativos simultaneamente — apenas um pode ser o primário.
2. **DIALOGUE não empilha:** abrir DIALOGUE enquanto DIALOGUE ativo encerra o anterior antes.
3. **PAUSE não empilha:** pressionar pausa durante PAUSE encerra PAUSE (toggle).
4. **Eventos de input ignorados durante bloqueio:** `INPUT_LOCK` ativo = handlers inexistentes no DOM; não apenas desabilitados.
5. **Transições não interrompíveis:** nenhum evento de gameplay pode cancelar TRANSITION ou LOADING.
6. **GAME_OVER não aceita save:** `SAVE_LOCK` permanece ativo em GAME_OVER.
7. **Subestados de BATTLE são exclusivos:** apenas um subestado ativo por vez; transição entre eles é gerenciada unicamente por `GerenciadorTurnos`.

---

## 19. Integração com EVENT_SYSTEM

### 19.1 Princípios de Integração

- Todos os eventos seguem o padrão `document.dispatchEvent(new CustomEvent(nome, { detail: payload }))`.
- `GameStateManager` é o único consumidor autorizado de `rubro:input-desativado` e `rubro:input-ativado` para re-roteamento de listeners.
- Eventos de combate (`rubro:fim-batalha`, `rubro:personagem-ko`, etc.) são consumidos por `main.js` que atualiza a UI conforme o estado ativo.
- Nenhum módulo consome eventos se não for o responsável pelo estado ativo correspondente.

### 19.2 Novos Eventos — Regra de Registro

> Todo novo evento `rubro:*` deve ser registrado em CORE_CONTEXT.md §11 **antes** de ser emitido ou consumido por qualquer módulo. Emitir evento não registrado é violação do contrato multiagente.

### 19.3 Roteamento de Eventos por Estado

| Estado ativo | Eventos que `main.js` processa ativamente |
|---|---|
| BATTLE (qualquer subestado) | `rubro:fim-batalha`, `rubro:personagem-ko`, `rubro:status-aplicado`, `rubro:evolucao`, `rubro:xp-ganho` |
| OVERWORLD | `rubro:capitulo-concluido` |
| Qualquer | `rubro:input-desativado`, `rubro:input-ativado` |

Eventos emitidos fora do estado esperado são descartados silenciosamente pelo `main.js`.

---

## 20. Escalabilidade Futura

### 20.1 Pontos de Extensão de Estados

| Extensão | Protocolo |
|---|---|
| Novo estado primário | Definir todos os campos de §3.1; registrar em §2.1; definir transições em §6.2; registrar prioridade em §5.1 |
| Novo subestado de BATTLE | Definir em §4; atualizar sequências de FIM_TURNO e EXECUCAO; registrar locks em §16 |
| Novo overlay | Definir z-index em §8.2; registrar em §10; garantir não empilhamento indevido |
| Novo evento global | Registrar em CORE_CONTEXT §11; definir consumidor em §19.3 |
| Novo lock operacional | Registrar em §16; garantir que `GameStateManager` o controla exclusivamente |

### 20.2 Restrições de Extensão

- Nenhum novo estado pode usar z-index entre 60–90 sem registro em §8.2.
- Nenhum novo estado pode emitir `rubro:input-desativado` ou `rubro:input-ativado` diretamente — apenas via `GameStateManager`.
- Nenhum novo overlay pode sobrepor PAUSE (z-index 90 é reservado para PAUSE).
- Novos estados de BATTLE devem ser subestados internos — não estados primários independentes.
- Toda extensão deve manter a invariante: exatamente 1 estado primário ativo por instante.

### 20.3 Integração Multiagente

Este documento é consumido por LLMs nas seguintes responsabilidades:

| LLM | Arquivo | Dependência neste documento |
|---|---|---|
| LLM 4 | `turnos.js` | Subestados de BATTLE (§4); callbacks `onAnimacao`; locks ANIMATION_LOCK |
| LLM 6 | `index.html`, `css/*.css` | IDs canônicos por estado (§8.1); z-index (§8.2) |
| LLM 7 | `sprites.js` | Animações por subestado (§4); fallback (§17) |
| LLM 8 | `capitulos.js` | OVERWORLD persistência (§3.6); BATTLE.FIM_BATALHA sequência (§4.4) |
| LLM 9 | `main.js` | Todos os estados, transições, locks, eventos e renderização |

---

## 21. Glossário de Termos do Sistema de Estados

| Termo | Definição |
|---|---|
| **Estado primário** | Estado que define o contexto principal de gameplay; apenas 1 ativo |
| **Overlay** | Estado que sobrepõe o primário sem destruí-lo |
| **Subestado** | Subdivisão interna de um estado primário (ex.: BATTLE.EXECUCAO) |
| **Transitório** | Estado que existe por duração definida e encerra autonomamente |
| **Bloqueante** | Estado que impede qualquer input do jogador |
| **Persistente** | Estado que mantém dados entre sub-transições |
| **Terminal** | Estado que não retorna ao anterior; encerra o fluxo |
| **Lock** | Flag booleana gerenciada pelo GameStateManager que bloqueia operações |
| **Fallback** | Estado de retorno em caso de erro ou timeout |
| **Invalidação** | Re-renderização forçada de elementos após mudança de dados |
| **`onAnimacao`** | Callback que sinaliza conclusão de sequência visual ao `turnos.js` |
| **`GameStateManager`** | Árbitro central de estados; único emissor de locks e eventos de input |

---

*GLOBAL_UI_STATES.md — RUBRO v1.0*  
*Documento canônico de estados globais — complementa CORE_CONTEXT.md e UI_CONTEXT.md*  
*Gerado para consumo por pipeline multiagente LLM*
