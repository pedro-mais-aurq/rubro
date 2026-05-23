# UI_CONTEXT.md — RUBRO
> Documento canônico de arquitetura visual e de interface.  
> Leitura obrigatória para toda LLM responsável por: HTML, CSS, HUD, menus, overlays, animações, transições, estados visuais, feedback, diálogos, renderização ou integração UI/gameplay.  
> Complementa e não contradiz CORE_CONTEXT.md.

---

## 0. Hierarquia de Autoridade

```
CORE_CONTEXT.md       ← autoridade máxima (dados, lógica, módulos)
UI_CONTEXT.md         ← autoridade visual e sistêmica de interface
(arquivos de implementação gerados por LLMs)
```

Qualquer ambiguidade visual deve ser resolvida consultando este documento.  
Qualquer ambiguidade de dados ou lógica deve ser resolvida consultando CORE_CONTEXT.md.

---

## 1. Filosofia Visual Global

RUBRO é um RPG biológico. A interface é uma extensão da narrativa: o jogador opera dentro de um organismo vivo.

**Princípios inegociáveis:**

| Princípio | Definição operacional |
|---|---|
| Biologia visível | Formas orgânicas, pulsos, texturas celulares — nunca geométrico-frio |
| Pixel-art funcional | Bordas nítidas, resolução contida, sem anti-aliasing decorativo |
| Minimalismo operacional | Apenas o necessário. Cada elemento da tela justifica sua presença |
| Tensão controlada | A interface deve comunicar urgência sem criar ansiedade visual |
| Leitura instantânea | O estado do combate deve ser compreensível em menos de 1 segundo |
| Feedback orgânico | Reações visuais parecem biológicas — pulso, propagação, contração |

**A interface NÃO deve jamais parecer:**
- Sci-fi tecnológica ou cyberpunk
- Dashboard moderna ou app mobile
- MMORPG com excesso de HUD
- Interface "limpa" sem personalidade biológica
- Pixel-art genérica sem identidade temática

---

## 2. Sistema de Cores Canônico

### 2.1 Paleta Base

| Token | Valor Hex | Uso |
|---|---|---|
| `--color-bg` | `#0A0F1E` | Fundo global — azul-marinho profundo |
| `--color-primary` | `#CC2233` | Ação primária, HP crítico, perigo, vírus |
| `--color-secondary` | `#00CCFF` | HP aliado, bioluminescência, destaque imunológico |
| `--color-text` | `#FFFFFF` | Texto principal |
| `--color-text-dim` | `#8899AA` | Texto secundário, desabilitado, rótulos |
| `--color-surface` | `#111827` | Superfície de painéis, caixas, menus |
| `--color-border` | `#1E2A3A` | Bordas de painéis e separadores |
| `--color-border-active` | `#CC2233` | Borda de elemento selecionado |

### 2.2 Paleta de Tipos Biológicos

Cada tipo biológico possui uma cor semântica usada em badges, ícones de ataque e partículas.

| Tipo | Cor | Hex |
|---|---|---|
| `FAGOCITO` | Laranja-âmbar | `#FF8800` |
| `CITOTOXICO` | Verde-veneno | `#44FF44` |
| `HUMORAL` | Azul-anticorpo | `#00CCFF` |
| `COORDENADOR` | Dourado | `#FFD700` |
| `SINALIZADOR` | Magenta | `#FF44CC` |
| `VIRUS_EXTRACELULAR` | Vermelho-sangue | `#CC2233` |
| `VIRUS_INTRACELULAR` | Roxo-escuro | `#7722CC` |
| `VIRUS_MUTANTE` | Verde-tóxico | `#99FF00` |
| `TOXINA` | Marrom-pútrido | `#886611` |

### 2.3 Paleta de Feedback

| Estado | Cor | Hex |
|---|---|---|
| Dano recebido | Vermelho-flash | `#FF2244` |
| Cura | Verde-pulso | `#00FF88` |
| Crítico | Amarelo-brilho | `#FFFF00` |
| Status aplicado | Roxo-névoa | `#CC44FF` |
| Super efetivo | Vermelho-laranja | `#FF6600` |
| Pouco efetivo | Cinza-azulado | `#445566` |
| Imune | Branco-sólido | `#FFFFFF` |
| KO | Preto com vinheta vermelha | `#000000` + `#CC2233` |
| XP ganho | Azul-ciano | `#00CCFF` |

---

## 3. Tipografia

### 3.1 Fontes

| Fonte | Fonte Google | Uso |
|---|---|---|
| `Press Start 2P` | Sim | Combate: nomes, HP, PP, menus de ação, mensagens de batalha |
| `Rajdhani` | Sim | Educacional: falas do Prof. Imuno, descrições biológicas, tooltips |

### 3.2 Hierarquia Tipográfica

| Nível | Fonte | Tamanho base | Uso |
|---|---|---|---|
| T1 | Press Start 2P | 16px | Título de capítulo, tela de evolução |
| T2 | Press Start 2P | 12px | Nome de personagem, nome de ataque |
| T3 | Press Start 2P | 10px | HP numérico, PP, rótulos de menu |
| T4 | Press Start 2P | 8px | Mensagens de batalha, feedback de efetividade |
| E1 | Rajdhani | 18px | Texto principal do Prof. Imuno |
| E2 | Rajdhani | 14px | Descrições de tipo, cards educacionais |
| E3 | Rajdhani | 12px | Dados secundários, tooltips |

### 3.3 Regras de Legibilidade

- Nunca renderizar `Press Start 2P` abaixo de 8px — ilegível em pixel-art
- Espaçamento de linha mínimo: 1.6× o tamanho da fonte
- Texto sobre fundo escuro: sempre `#FFFFFF` ou `--color-text-dim`
- Texto sobre cor de tipo: verificar contraste mínimo 4.5:1
- Nunca usar italic em `Press Start 2P`
- `Rajdhani` pode usar `font-weight: 300–700`

---

## 4. Estrutura do HUD de Batalha

O HUD é composto por camadas independentes (z-index controlado). Cada camada é um componente isolado.

### 4.1 Layout Canônico

```
┌─────────────────────────────────────────────┐
│  [ÁREA INIMIGO — top 45% da tela]           │
│  ┌──────────────┐    ┌───────────────────┐  │
│  │ #info-inimigo│    │  #sprite-inimigo  │  │
│  │ nome + HP    │    │  (lado direito)   │  │
│  └──────────────┘    └───────────────────┘  │
├─────────────────────────────────────────────┤
│  [ÁREA ALIADO — 45% a 65%]                  │
│  ┌──────────────────┐   ┌────────────────┐  │
│  │  #sprite-aliado  │   │ #info-aliado   │  │
│  │  (lado esquerdo) │   │ nome+HP+XP     │  │
│  └──────────────────┘   └────────────────┘  │
├─────────────────────────────────────────────┤
│  [CAIXA DE DIÁLOGO — 65% a 78%]            │
│  #caixa-dialogo → #texto-dialogo            │
├─────────────────────────────────────────────┤
│  [MENU DE AÇÃO / ATAQUES — 78% a 100%]     │
│  #menu-acao  |  #menu-ataques               │
└─────────────────────────────────────────────┘
```

IDs HTML canônicos (definidos em CORE_CONTEXT §14):
- `#tela-batalha`, `#area-inimigo`, `#area-aliado`
- `#sprite-inimigo`, `#nome-inimigo`, `#barra-hp-inimigo`
- `#sprite-aliado`, `#nome-aliado`, `#barra-hp-aliado`, `#barra-xp-aliado`
- `#caixa-dialogo`, `#texto-dialogo`
- `#menu-acao`, `#btn-lutar`, `#btn-itens`, `#btn-trocar`, `#btn-fugir`
- `#menu-ataques` (grid 2×2)

### 4.2 Barra de HP

```
[NOME          Lv.16]
[████████░░░░░░░░░] 48 / 80
```

**Comportamento por threshold:**

| HP % | Cor da barra | Comportamento |
|---|---|---|
| > 50% | `#00CC44` (verde) | Estático |
| 25–50% | `#FFCC00` (amarelo) | Estático |
| < 25% | `#CC2233` (vermelho) | Pulso lento — 1.5s período |
| 0% | `#333333` (cinza) | Sem animação — KO |

- Transição de cor: interpolação direta, sem gradiente suave — comportamento de pixel-art
- A barra tem bordas nítidas (sem border-radius além de 2px)
- HP numérico sempre visível — nunca ocultar por falta de espaço

### 4.3 Barra de XP

- Visível apenas no painel aliado, abaixo do HP
- Cor: `--color-secondary` (`#00CCFF`)
- Sem número numérico exibido durante batalha
- Ao ganhar XP: preenche com animação de propagação da esquerda para a direita (300ms)
- Se nível sobe durante preenchimento: barra esvazia, pulso de nível, reinicia

### 4.4 Badge de Tipo

- Exibido ao lado do nome do personagem
- Cor de fundo = cor canônica do tipo (§2.2)
- Texto: nome do tipo em `Press Start 2P` 6px
- Border: 1px solid `--color-border`
- Nunca truncar o nome do tipo

### 4.5 Indicador de Status Ativo

- Ícone de status abaixo do nome, ao lado do badge de tipo
- Um slot por status ativo (máximo 2 simultâneos visíveis)
- Cor de borda do ícone = cor do status (ver §7.3)
- Ao aplicar: aparece com escala de 0→1 em 150ms
- Ao remover: desaparece com fade-out em 100ms

---

## 5. Menu de Ação

### 5.1 Estrutura

```
┌──────────────┬──────────────┐
│  ▸ LUTAR     │    ITENS     │
├──────────────┼──────────────┤
│    TROCAR    │    FUGIR     │
└──────────────┴──────────────┘
```

- Grid 2×2, bordas nítidas
- Seleção atual: borda `--color-border-active` + seta `▸` à esquerda
- Sem hover state estilo web — cursor de jogo (pixelado)
- Cada botão: `Press Start 2P` 10px
- Estado desabilitado: texto `--color-text-dim`, sem cursor de seleção
- `#btn-fugir` desabilitado em batalhas de boss

### 5.2 Menu de Ataques

Grid 2×2 para os 4 ataques do personagem ativo:

```
┌─────────────────────┬─────────────────────┐
│ NOME_ATAQUE         │ NOME_ATAQUE         │
│ [TIPO]     PP: X/Y  │ [TIPO]     PP: X/Y  │
├─────────────────────┼─────────────────────┤
│ NOME_ATAQUE         │ NOME_ATAQUE         │
│ [TIPO]     PP: X/Y  │ [TIPO]     PP: X/Y  │
└─────────────────────┴─────────────────────┘
```

- Nome do ataque: `Press Start 2P` 8px
- Badge de tipo: cor canônica do tipo (§2.2)
- PP: `Press Start 2P` 8px — vermelho se PP = 0
- Ataque com PP = 0: texto dim, não selecionável
- Selecionado: borda `--color-border-active`

### 5.3 Navegação

- Seta `▸` segue o elemento selecionado
- Input: teclado (arrow keys + Enter/Space) + clique/toque
- Transição entre `#menu-acao` e `#menu-ataques`: fade + slide vertical (150ms)
- Retornar ao `#menu-acao` com Escape ou botão Back

---

## 6. Sistema de Caixa de Diálogo

### 6.1 Estrutura

```
┌─────────────────────────────────────────────┐
│ [AVATAR  ] TEXTO DA MENSAGEM aqui...       ▸ │
└─────────────────────────────────────────────┘
```

- Fundo: `--color-surface` com borda `--color-border` (2px)
- Fonte: `Press Start 2P` 10px para mensagens de batalha
- Fonte: `Rajdhani` 16px para diálogos narrativos e Prof. Imuno
- Seta `▸` pisca a cada 600ms para indicar "pressione para continuar"
- Avatar (16×16px sprite) visível apenas em diálogos narrativos — não em mensagens de batalha

### 6.2 Tipos de Mensagem

| Tipo | Fonte | Velocidade de typo | Avatar |
|---|---|---|---|
| Resultado de ação | Press Start 2P | Instantâneo | Não |
| Efetividade | Press Start 2P | Instantâneo | Não |
| Status aplicado | Press Start 2P | Instantâneo | Não |
| Narrativa/diálogo | Rajdhani | 30ms por caractere | Sim |
| Prof. Imuno | Rajdhani | 25ms por caractere | Sim |
| KO / evolução | Press Start 2P | Instantâneo | Não |

### 6.3 Fila de Mensagens

- Mensagens de batalha formam uma fila FIFO
- Cada mensagem exibida por mínimo 800ms antes de avançar automaticamente
- Mensagens narrativas aguardam input do jogador (sem avanço automático)
- Fila não pode ter mais de 8 mensagens pendentes — excess é descartado com log de warning
- Input desabilitado durante exibição de fila de mensagens de combate

---

## 7. Sistema de Feedback Visual

### 7.1 Feedback de Dano

**Sequência canônica ao receber dano:**

1. Sprite pisca: alterna transparência 100%→0%→100% (3 ciclos, 80ms por ciclo)
2. Número de dano flutua sobre o sprite: aparece em 50ms, sobe 20px, fade-out em 400ms
3. Barra de HP decrementa com animação linear (200ms)
4. Se crítico: número amarelo (`#FFFF00`) + tamanho 1.5× + texto "CRÍTICO!" acima
5. Se super efetivo: texto "SUPER EFETIVO!" em laranja (`#FF6600`) na caixa de diálogo
6. Se pouco efetivo: texto "POUCO EFETIVO..." em cinza-azulado (`#445566`)
7. Se imune: texto "SEM EFEITO" em branco sólido

**Timing total do evento de dano:** ≤ 800ms (sem crítico) | ≤ 1200ms (com crítico)

### 7.2 Feedback de Cura

1. Barra de HP incrementa com propagação verde da esquerda para a direita (300ms)
2. Número verde (`#00FF88`) flutua sobre o sprite (mesmo timing do dano, sentido para cima)
3. Partículas verdes (tipo CURA via `criarParticulas`) dispersam em torno do sprite (500ms)

### 7.3 Feedback de Status

| Status | Cor indicador | Efeito visual por turno |
|---|---|---|
| `INFECTADO` | `#CC2233` | Pulso vermelho no sprite (300ms) |
| `ENVENENADO` | `#886611` | Névoa marrom-pútrida sobre sprite |
| `INFLAMADO` | `#FF4400` | Borda laranja-flamejante no painel |
| `SUPRIMIDO` | `#445566` | Sprite levemente dessaturado |
| `MARCA_ANTICORPO` | `#00CCFF` | Borda ciano pulsante |
| `MULTIPLICANDO` | `#99FF00` | Clone fantasma atrás do sprite inimigo |

Ao aplicar status: overlay de cor do status sobre o sprite (200ms fade-in → 200ms fade-out).  
Ao sofrer dano de status por turno: mesmo feedback de dano, com número na cor do status.

### 7.4 Feedback de KO

1. Sprite desce 30px abaixo da posição original (300ms ease-in)
2. Sprite aplica filter grayscale(100%) simultâneo à descida
3. Vinheta vermelha na borda da tela (fade-in 200ms → permanece até troca)
4. Mensagem "NOME DESMONTADO!" na caixa de diálogo
5. Se era o único personagem aliado vivo: transição para estado DERROTA

### 7.5 Feedback de Evolução

1. Tela escurece (fade-in preto 300ms)
2. Sprite do personagem em silhueta branca pulsante (500ms)
3. Texto "NOME está evoluindo!" em `Press Start 2P` 12px centralizado
4. Silhueta transiciona para novo sprite (crossfade 400ms)
5. Tela volta ao normal (fade-out preto 300ms)
6. Mensagem de evolução na caixa de diálogo
7. Evento `rubro:evolucao` disparado

**Timing total da sequência de evolução:** ~1500ms

---

## 8. Sistema de Overlays

### 8.1 Hierarquia de Z-Index

| Camada | Z-index | Componentes |
|---|---|---|
| Background | 0 | Cenário de batalha |
| Sprites | 10 | `#sprite-inimigo`, `#sprite-aliado` |
| Partículas | 20 | Canvas de partículas |
| HUD | 30 | Barras HP/XP, badges, status |
| Caixa de diálogo | 40 | `#caixa-dialogo` |
| Menus | 50 | `#menu-acao`, `#menu-ataques` |
| Overlays de feedback | 60 | Números flutuantes, flashes |
| Overlays de estado | 70 | KO vinheta, evolução, transição |
| Fullscreen | 80 | Cutscenes, loading, main menu |
| Pausa | 90 | Overlay de pausa |

### 8.2 Overlay de Pausa

- Fundo: `rgba(0, 0, 0, 0.75)` sobre o estado atual
- Menu centralizado: `CONTINUAR` / `CONFIGURAÇÕES` / `MENU PRINCIPAL`
- Não interrompe animações em curso — congela estado visual
- `Press Start 2P` 10px para itens do menu
- Acessível em qualquer estado exceto `LOADING`, `CUTSCENE`, `TRANSITION`

### 8.3 Overlay de Loading

- Fundo: `--color-bg` sólido
- Indicador: ícone celular animado (partícula única em loop) centralizado
- Texto: "CARREGANDO..." `Press Start 2P` 8px abaixo do ícone
- Sem barra de progresso — não expõe dados de carregamento ao jogador

### 8.4 Overlay de Transição entre Capítulos

Acionado por `animarTransicaoCapitulo(nomeLocal)`:

1. Iris-out circular (contração do centro para bordas) em preto — 400ms
2. Texto do local centralizado em branco — `Press Start 2P` 12px — permanece 1000ms
3. Iris-in circular (expansão do centro) — 400ms
4. Novo estado renderizado

**Timing total:** ~1800ms

---

## 9. Sistema de Notificações

### 9.1 Tipos

| Tipo | Posição | Duração | Cor |
|---|---|---|---|
| XP ganho | Acima do painel aliado | 1200ms | `#00CCFF` |
| Item usado | Caixa de diálogo | Até próxima ação | `#FFFFFF` |
| Nível subiu | Centro da tela | 1500ms | `#FFD700` |
| Desbloqueio | Centro da tela | 2000ms | `#FFD700` |
| Erro (PP = 0) | Caixa de diálogo | 800ms | `#CC2233` |

### 9.2 Comportamento

- Notificações de XP e nível são enfileiradas após o evento `rubro:xp-ganho`
- Notificações não interrompem o fluxo de batalha — são exibidas em momentos de pausa natural (FIM_TURNO)
- Nunca empilhar mais de 2 notificações simultâneas na tela

---

## 10. Sistema Global de Estados

### 10.1 Estados Canônicos

| Estado | Descrição | Input permitido |
|---|---|---|
| `BOOT` | Inicialização, preload de assets | Nenhum |
| `MAIN_MENU` | Menu principal | Navegação, seleção |
| `OVERWORLD` | Mapa/progressão entre capítulos | Navegação |
| `BATTLE` | Combate em turnos | Ações de batalha |
| `DIALOGUE` | Cutscene narrativa ou Prof. Imuno | Avançar diálogo |
| `INVENTORY` | Gerenciamento de itens | Navegação, uso |
| `PAUSE` | Pausa sobreposta ao estado anterior | Menu de pausa |
| `CUTSCENE` | Sequência cinemática | Pular (com confirmação) |
| `SETTINGS` | Configurações | Ajuste de parâmetros |
| `TRANSITION` | Transição entre estados | Nenhum |
| `LOADING` | Carregamento de assets/dados | Nenhum |

### 10.2 Definição por Estado

#### BOOT
- **Objetivo:** Carregar todos os assets via `preCarregarTodos()`, inicializar módulos
- **Prioridade:** Absoluta — bloqueia qualquer outro estado
- **Persistência:** Não — transitório
- **Renderização:** Overlay de loading
- **Transições válidas:** → `MAIN_MENU`

#### MAIN_MENU
- **Objetivo:** Apresentar opções de novo jogo / continuar / configurações
- **Prioridade:** Alta
- **Persistência:** Não — sem estado de jogo ativo
- **Renderização:** Tela fullscreen com logo, menu, versão
- **Transições válidas:** → `LOADING` → `OVERWORLD`, → `SETTINGS`

#### OVERWORLD
- **Objetivo:** Exibir progressão de capítulos, escolha de time, acesso ao inventário
- **Prioridade:** Média
- **Persistência:** Sim — estado de save ativo
- **Renderização:** Mapa de capítulos + painel de time
- **Transições válidas:** → `DIALOGUE`, → `BATTLE`, → `INVENTORY`, → `SETTINGS`, → `PAUSE`

#### BATTLE
- **Objetivo:** Gerenciar combate turno a turno
- **Prioridade:** Alta durante execução de turno — bloqueada para input
- **Persistência:** Sim — estado de batalha mantido em `GerenciadorTurnos`
- **Renderização:** HUD completo, sprites, menus de ação
- **Sub-estados:**
  - `BATTLE.ESCOLHA_ACAO` — input habilitado, menu visível
  - `BATTLE.EXECUCAO` — input desabilitado, animações em curso
  - `BATTLE.FIM_TURNO` — efeitos de status, notificações
  - `BATTLE.FIM_BATALHA` — resultado, XP, retorno ao overworld
- **Transições válidas:** → `DIALOGUE` (mensagens), → `PAUSE`, → `OVERWORLD` (pós-batalha)

#### DIALOGUE
- **Objetivo:** Exibir sequências de diálogo narrativo ou educacional
- **Prioridade:** Alta — bloqueia gameplay
- **Persistência:** Não — temporário
- **Renderização:** Overlay de diálogo sobre o estado anterior (que permanece renderizado)
- **Transições válidas:** → estado anterior (OVERWORLD, BATTLE, CUTSCENE)

#### INVENTORY
- **Objetivo:** Exibir e gerenciar itens
- **Prioridade:** Média
- **Persistência:** Não — snapshot do save
- **Renderização:** Overlay sobre OVERWORLD
- **Transições válidas:** → `OVERWORLD`

#### PAUSE
- **Objetivo:** Suspender o estado atual sem destruí-lo
- **Prioridade:** Máxima entre estados não-críticos
- **Persistência:** Sim — congela estado subjacente
- **Renderização:** Overlay 75% opaco sobre estado anterior
- **Transições válidas:** → estado anterior, → `SETTINGS`, → `MAIN_MENU`

#### CUTSCENE
- **Objetivo:** Exibir sequência cinemática narrativa
- **Prioridade:** Alta — input bloqueado exceto "pular"
- **Persistência:** Não — transitório
- **Renderização:** Fullscreen ou overlay com sprites e diálogo
- **Transições válidas:** → `OVERWORLD`, → `BATTLE`

#### SETTINGS
- **Objetivo:** Ajustar volume, velocidade de texto, modo de input
- **Prioridade:** Média
- **Persistência:** Não — overlay
- **Renderização:** Overlay sobre MAIN_MENU ou PAUSE
- **Transições válidas:** → estado anterior

#### TRANSITION
- **Objetivo:** Executar transição visual entre estados
- **Prioridade:** Alta — bloqueia input completamente
- **Persistência:** Não — dura exatamente a duração da animação
- **Renderização:** Animação de iris, fade ou wipe
- **Transições válidas:** → qualquer estado destino

#### LOADING
- **Objetivo:** Carregar assets ou dados pesados de forma assíncrona
- **Prioridade:** Alta — bloqueia input
- **Persistência:** Não — transitório
- **Renderização:** Overlay de loading
- **Transições válidas:** → estado destino após conclusão

### 10.3 Máquina de Estados — Regras

- Apenas um estado ativo por vez, com exceção de PAUSE (sobrepõe qualquer estado)
- TRANSITION é sempre intermediário — nunca permanente
- O estado BATTLE tem sub-estados gerenciados internamente por `GerenciadorTurnos`
- A UI deve reagir ao evento `rubro:input-desativado` desabilitando todos os handlers
- A UI deve reagir ao evento `rubro:input-ativado` reabilitando os handlers do estado atual

---

## 11. Fluxo de Navegação

```
BOOT
  └→ MAIN_MENU
       ├→ [Novo Jogo]   → LOADING → OVERWORLD → DIALOGUE (narrativa Cap.0) → BATTLE
       ├→ [Continuar]   → LOADING → OVERWORLD (estado de save carregado)
       └→ [Configs]     → SETTINGS → MAIN_MENU

OVERWORLD
  ├→ [Iniciar Capítulo] → TRANSITION → DIALOGUE → BATTLE
  ├→ [Inventário]       → INVENTORY → OVERWORLD
  ├→ [Pause]            → PAUSE → OVERWORLD
  └→ [Pós-batalha]      ← BATTLE → DIALOGUE → OVERWORLD

BATTLE
  ├→ [Fim Vitória]  → DIALOGUE (resultado) → TRANSITION → OVERWORLD
  ├→ [Fim Derrota]  → DIALOGUE (resultado) → TRANSITION → OVERWORLD
  └→ [Pause]        → PAUSE → BATTLE
```

---

## 12. Contratos de Integração UI / Gameplay

### 12.1 Eventos Consumidos pela UI

| Evento | Payload | Ação da UI |
|---|---|---|
| `rubro:fim-batalha` | `{ resultado }` | Exibir resultado, iniciar sequência pós-batalha |
| `rubro:personagem-ko` | `{ personagem }` | Animação de KO, vinheta, mensagem |
| `rubro:status-aplicado` | `{ personagem, status }` | Exibir ícone de status, overlay de cor |
| `rubro:evolucao` | `{ de, para }` | Sequência de evolução (§7.5) |
| `rubro:xp-ganho` | `{ personagem, xp }` | Animar barra de XP, notificação |
| `rubro:capitulo-concluido` | `{ id }` | Transição de capítulo, atualizar overworld |
| `rubro:input-desativado` | `{}` | Desabilitar todos os handlers de input |
| `rubro:input-ativado` | `{}` | Reabilitar handlers do estado atual |

### 12.2 Chamadas de UI Esperadas do main.js

| Função | Quando chamar | Comportamento esperado |
|---|---|---|
| `atualizarBarrasHP(aliado, inimigo)` | Após qualquer dano/cura | Animar barras — nunca saltar valores |
| `mostrarMensagemEfetividade(texto)` | Após cálculo de dano | Exibir na caixa de diálogo por 800ms |
| `mostrarDialogo(texto, personagem)` | Narrativa/Prof. Imuno | Abrir caixa de diálogo com typo |
| `fecharDialogo()` | Fim de sequência | Fechar com fade-out 150ms |
| `mostrarCardProfImuno(dados)` | Trigger educacional | Overlay lateral com dados biológicos |
| `mostrarTelaBatalha()` | Início de batalha | Renderizar HUD completo |
| `esconderTelaBatalha()` | Fim de batalha | Ocultar HUD com fade-out 200ms |
| `animarTransicaoCapitulo(nomeLocal)` | Mudança de capítulo | Iris-out → texto → iris-in |
| `mostrarTelaCutscene(cenas[], callback)` | Cutscene | Fullscreen, callback ao fim |

### 12.3 Sincronização de Timing

| Evento | UI inicia resposta em | Duração máxima da resposta |
|---|---|---|
| Ataque executado | 0ms (imediato) | 800ms |
| Ataque crítico | 0ms | 1200ms |
| Status aplicado | 0ms | 600ms |
| KO | 0ms | 1000ms |
| Evolução | 0ms | 1500ms |
| Troca de personagem | 0ms | 400ms |
| Transição de capítulo | 0ms | 1800ms |

O módulo `turnos.js` deve aguardar o callback `onAnimacao` antes de prosseguir para o próximo evento de combate.

### 12.4 Regras de Invalidação Visual

- Ao trocar personagem ativo: atualizar `#sprite-aliado`, `#nome-aliado`, `#barra-hp-aliado`, `#barra-xp-aliado`, `#menu-ataques` — todos simultaneamente
- Ao iniciar turno do inimigo: desabilitar `#menu-acao` e `#menu-ataques` via `rubro:input-desativado`
- Ao fim de turno do inimigo: reabilitar via `rubro:input-ativado`
- Barras de HP nunca exibem valores negativos — clampar em 0
- PP nunca exibe valores negativos — exibir 0 se PP = 0

---

## 13. Sistema de Animações

### 13.1 Princípios

- Todas as animações são CSS (transitions + keyframes) ou Canvas (partículas)
- Nenhuma animação usa bibliotecas externas
- Duração máxima de qualquer animação de feedback: 1500ms
- Animações de idle são loops contínuos de baixa frequência (2–4s)
- Sem easing suave genérico — preferir `steps()` para pixel-art, `ease-in-out` apenas para transições de tela

### 13.2 Animações de Sprite

Gerenciadas por `AnimadorSprite` (sprites.js):

| Animação | Duração | Trigger |
|---|---|---|
| `IDLE` | Loop 2s | Estado padrão |
| `ATACAR` | 400ms | Antes de aplicar dano |
| `RECEBER_DANO` | 300ms (piscar ×3) | Ao receber qualquer dano |
| `KO` | 600ms (queda + grayscale) | HP = 0 |

### 13.3 Animações de Partículas (Canvas)

Via `criarParticulas(tipo, x, y)`:

| Tipo | Visual | Duração |
|---|---|---|
| `FAGOCITO` | Partículas âmbar que se expandem | 600ms |
| `CITOTOXICO` | Partículas verdes pontilhadas | 500ms |
| `HUMORAL` | Partículas azuis em arco | 500ms |
| `CURA` | Partículas verdes em bolhas ascendentes | 700ms |

Canvas de partículas: z-index 20, transparente, sobrepõe sprites mas não HUD.

### 13.4 Animações de Transição de Estado

| Transição | Visual | Duração |
|---|---|---|
| OVERWORLD → BATTLE | Fade preto | 300ms |
| BATTLE → OVERWORLD | Fade preto | 300ms |
| BATTLE → DIALOGUE | Nenhuma — overlay imediato | 0ms |
| Qualquer → LOADING | Fade preto | 200ms |
| Capítulo N → N+1 | Iris-out + texto + iris-in | 1800ms |
| Qualquer → PAUSE | Escurecimento 75% | 150ms |

---

## 14. Regras de Renderização

### 14.1 Ordem de Renderização por Frame

1. Background (cenário)
2. Sprite inimigo (`#sprite-inimigo`)
3. Sprite aliado (`#sprite-aliado`)
4. Canvas de partículas
5. HUD (barras, badges, status)
6. Números flutuantes de dano/cura
7. Caixa de diálogo
8. Menus de ação
9. Overlays de feedback (flashes, vinhetas)
10. Overlays de estado (pausa, loading, evolução)

### 14.2 Pixel Density e Resolução

- Resolução de referência: 480×320px (proporcional ao GBA)
- Escala por CSS: `transform: scale()` para adaptar ao viewport
- `image-rendering: pixelated` em todos os `<img>` de sprite
- `image-rendering: crisp-edges` como fallback
- Nunca aplicar `filter: blur()` em sprites — apenas em overlays de estado
- Canvas de partículas: mesma resolução do viewport (não escalada)

### 14.3 Responsividade

- O jogo centraliza horizontalmente e verticalmente no viewport
- Proporção 3:2 mantida com letterbox (barras pretas) se necessário
- Tamanho mínimo suportado: 320×213px
- Nenhum elemento quebra fora da área de jogo
- Fonte `Press Start 2P` nunca abaixo de 8px em nenhuma resolução

---

## 15. Card Educacional — Prof. Imuno

### 15.1 Estrutura

```
┌─────────────────────────────────────┐
│  [Avatar Prof. Imuno]               │
│  NOME DO CONCEITO                   │
│  ─────────────────────────────────  │
│  Texto explicativo em Rajdhani...   │
│                                     │
│  [DADO BIOLÓGICO 1]  [DADO 2]       │
│                                     │
│  [Fechar]                           │
└─────────────────────────────────────┘
```

- Posição: overlay lateral direito durante batalha, ou centralizado no overworld
- Fonte: `Rajdhani` exclusivamente
- Fundo: `--color-surface` com borda `--color-secondary`
- Não bloqueia o combate se aberto durante batalha — apenas exibe informação
- Fechamento: botão explícito ou qualquer input de batalha

### 15.2 Dados Retornados por `ProfImuno.falar(topico)`

```js
{ texto: String, dadosBiologicos: Object }
```

A UI deve exibir `texto` com typo (25ms/caractere) e `dadosBiologicos` como tags estruturadas abaixo.

---

## 16. Tela de Menu Principal

### 16.1 Estrutura

```
[LOGO RUBRO — centralizado no terço superior]

▸ NOVO JOGO
  CONTINUAR
  CONFIGURAÇÕES

[versão 1.0 — canto inferior direito]
```

- Fundo: `--color-bg` com textura de partículas idle muito sutis (Canvas)
- Logo: tipografia `Press Start 2P` 24px em `--color-primary`
- Subtítulo: "UM RPG BIOLÓGICO" em `Press Start 2P` 8px `--color-text-dim`
- `CONTINUAR` desabilitado se não houver save em `localStorage`
- Versão: `Press Start 2P` 6px `--color-text-dim`

---

## 17. Regras Anti-Poluição Visual

1. **Máximo de 3 elementos animados simultaneamente** na tela de batalha (exceto idle)
2. **Nunca exibir mais de 2 overlays simultâneos** — overlays anteriores são fechados antes
3. **Número flutuante de dano**: máximo 1 por frame por personagem
4. **Partículas**: máximo 30 partículas simultâneas no Canvas
5. **Status visíveis no HUD**: máximo 2 ícones por personagem
6. **Caixa de diálogo**: nunca exibir mais de 2 linhas de texto visíveis simultaneamente
7. **Nenhum efeito de sombra ou glow** além dos definidos explicitamente neste documento
8. **Sem gradientes decorativos** — apenas gradientes funcionais (barra de HP)
9. **Sem animações de hover** estilo web — o jogo tem cursor pixelado

---

## 18. Regras de UX Operacional

1. O jogador nunca deve aguardar mais de 2000ms sem feedback visual após uma ação
2. Ações do jogador têm resposta visual imediata (≤ 50ms) mesmo que o processamento demore mais
3. Input é desabilitado via evento canônico — nunca via ocultação de elementos
4. Toda ação irreversível (fugir, usar último item) deve ter confirmação de 1 passo
5. O estado do combate (HP, PP, status) deve ser legível sem interação alguma
6. O tipo do inimigo ativo deve ser sempre visível — sem necessidade de inspecionar
7. Ataques sem PP não devem ser selecionáveis — feedback imediato se tentativa
8. A seta de seleção `▸` deve sempre indicar o elemento focado sem ambiguidade

---

## 19. Regras de Acessibilidade

1. Contraste mínimo texto/fundo: 4.5:1 (WCAG AA)
2. Navegação completa por teclado em todos os menus
3. Velocidade de typo dos diálogos: ajustável em SETTINGS (25ms / 15ms / instantâneo)
4. Animações de flash (dano, KO): reduzíveis via opção "Reduzir movimento" em SETTINGS
5. Tamanho de fonte: sem opção de ajuste (tipografia pixel-art não escala bem)
6. Sons: controle de volume separado para música e efeitos em SETTINGS
7. Indicadores de estado nunca dependem exclusivamente de cor — sempre acompanhados de ícone ou texto

---

## 20. Regras de Consistência Estética

1. Todo elemento interativo tem estado: normal / hover (seta) / selecionado / desabilitado
2. Bordas de painel: sempre `2px solid` — nunca `1px`, nunca arredondadas além de `2px`
3. Espaçamento interno de painéis: múltiplos de 8px
4. Ícones de tipo: sempre o mesmo tamanho em toda a UI (16×8px pill)
5. Sombras: proibidas em elementos de gameplay — permitidas apenas em texto de overlay fullscreen
6. Cor de seleção ativa (`--color-border-active`) é sempre a única cor vermelha em elementos de UI — evitar ambiguidade com feedbacks de perigo

---

## 21. Escalabilidade Futura

### 21.1 Pontos de Extensão

| Área | Ponto de extensão |
|---|---|
| Novos tipos biológicos | Adicionar entrada em §2.2 e badge correspondente |
| Novos status | Adicionar entrada em §7.3 com cor e efeito visual |
| Novos estados de jogo | Adicionar em §10.1 com definição completa por §10.2 |
| Novos personagens | Sprites via `sprites.js` — UI adapta automaticamente via IDs canônicos |
| Modo multiplayer | Sistema de overlays suporta segundo HUD espelhado |
| Novos tipos de ataque | Badge de tipo cobre qualquer novo valor em TIPOS |

### 21.2 Restrições de Extensão

- Nenhum novo ID HTML deve conflitar com os IDs canônicos definidos em CORE_CONTEXT §14
- Novos eventos globais devem ser registrados em CORE_CONTEXT §11 antes de serem consumidos pela UI
- Novos overlays devem respeitar a hierarquia de z-index definida em §8.1
- Qualquer novo estado de jogo requer definição completa em §10.2 antes de implementação

---

## 22. Glossário de Tokens UI

| Token | Significado |
|---|---|
| `--color-bg` | Fundo global |
| `--color-primary` | Ação primária / perigo |
| `--color-secondary` | Destaque imunológico |
| `--color-surface` | Superfície de painéis |
| `--color-border` | Borda padrão |
| `--color-border-active` | Borda de seleção ativa |
| `--color-text` | Texto principal |
| `--color-text-dim` | Texto secundário / desabilitado |
| `--font-battle` | `'Press Start 2P'` |
| `--font-edu` | `'Rajdhani'` |

---

*UI_CONTEXT.md — RUBRO v1.0 — Documento canônico de interface*  
*Complementa CORE_CONTEXT.md — não contradiz, não substitui*
