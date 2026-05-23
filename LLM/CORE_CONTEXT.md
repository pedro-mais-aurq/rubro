# CORE_CONTEXT.md — RUBRO
> Fonte canônica global. Leitura obrigatória para toda LLM antes de qualquer output.

---

## 1. Identidade do Projeto

| Campo | Valor |
|---|---|
| **Nome** | RUBRO |
| **Gênero** | RPG de Turnos — estilo Pokémon GBA |
| **Plataforma** | Web — HTML5 / CSS3 / JavaScript Vanilla ES6+ |
| **Tema** | Imunologia — batalhas dentro do corpo humano |
| **Protagonista externo** | Bernardo (atleta de capoeira) |
| **Protagonista interno** | Jogador comanda o sistema imune de Bernardo |
| **Antagonistas** | Vírus invasor e suas formas evolutivas (Viru-Prime → VIREX OMEGA) |
| **Estrutura narrativa** | Capítulos 0–7 + Epílogo |

---

## 2. Stack Tecnológica

- **Linguagem:** JavaScript ES6+ puro (sem TypeScript, sem frameworks)
- **Módulos:** ES6 `import`/`export` nativo
- **HTML:** Semântico, estrutura única (`index.html`)
- **CSS:** Vanilla (sem frameworks externos)
- **Persistência:** `localStorage` (save único)
- **Assets:** Sprites via `<img>` + fallback SVG gerado por código
- **Canvas:** Para partículas e efeitos visuais
- **Fontes:** `Press Start 2P` (batalha) + `Rajdhani` (educacional) — Google Fonts

---

## 3. Estrutura de Pastas

```
rubro/
├── index.html
├── css/
│   ├── style.css          # Tema global, paleta, tipografia
│   └── batalha.css        # Animações e estados visuais de combate
├── js/
│   ├── personagens.js     # LLM 1 — Classes e instâncias de personagens
│   ├── tipos.js           # LLM 2 — Tipos biológicos e tabela de efetividade
│   ├── ataques.js         # LLM 3 — Classes e instâncias de ataques
│   ├── turnos.js          # LLM 4 — Gerenciador de turnos e IA inimiga
│   ├── dano.js            # LLM 5 — Cálculo de dano, buffs, status
│   ├── sprites.js         # LLM 7 — Carregamento, fallback SVG, animações
│   ├── capitulos.js       # LLM 8 — Capítulos, narrativa, save/load
│   ├── balanceamento.js   # LLM 10 — Curvas de stats e XP
│   └── main.js            # LLM 9 — Integração, loop principal, UI
└── assets/
    ├── sprites/           # Imagens PNG/GIF dos personagens
    └── audio/             # Trilha sonora e efeitos
```

---

## 4. Arquitetura Modular

```
personagens.js ←─ tipos.js
     ↓
ataques.js ←─ tipos.js
     ↓
dano.js ←─ personagens.js + ataques.js + tipos.js
     ↓
turnos.js ←─ dano.js + personagens.js + ataques.js
     ↓
capitulos.js ←─ personagens.js + turnos.js
     ↓
sprites.js (independente)
balanceamento.js ←─ personagens.js
     ↓
main.js ←─ TODOS os módulos acima
```

**Regra:** nenhum módulo importa `main.js`. Dependências são unidirecionais.

---

## 5. Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| Classes | PascalCase | `Personagem`, `GerenciadorTurnos` |
| Instâncias | UPPER_SNAKE_CASE | `NEUTRO`, `VIRU_PRIME`, `VIREX_OMEGA` |
| Funções | camelCase | `calcularDano()`, `aplicarStatus()` |
| Constantes/objetos globais | UPPER_SNAKE_CASE | `TIPOS`, `TABELA_EFETIVIDADE`, `CAPITULOS` |
| Arrays exportados | UPPER_SNAKE_CASE | `TIME_INICIAL`, `TODOS_AGENTES` |
| Eventos DOM | kebab-case | `rubro:fim-batalha`, `rubro:trocar-personagem` |
| Arquivos | camelCase | `personagens.js`, `turnos.js` |
| IDs HTML | kebab-case | `#sprite-aliado`, `#barra-hp-inimigo` |

---

## 6. Estrutura dos Dados Principais

### 6.1 Personagem (base)

```js
{
  nome: String,
  nivel: Number,
  hp: Number,
  hpMax: Number,
  ataque: Number,
  defesa: Number,
  velocidade: Number,
  tipo: String,           // valor de TIPOS
  sprite: String,         // caminho ou 'svg'
  ataques: Ataque[],      // exatamente 4 ataques
  statusAtivo: null | String
}
```

### 6.2 Ataque

```js
{
  nome: String,
  tipo: String,           // valor de TIPOS
  poder: Number,
  ppMax: Number,
  ppAtual: Number,
  precisao: Number,       // 0–100
  categoria: 'FISICO' | 'ESPECIAL' | 'STATUS',
  efeitoEspecial: null | EfeitoEspecial
}
```

### 6.3 EfeitoEspecial

```js
{
  tipo: 'VENENO' | 'PARALISIA' | 'BUFF_ATK' | 'DEBUFF_DEF' | 'CURA' | 'MULTI_HIT' | 'INFECTADO' | 'INFLAMADO' | 'SUPRIMIDO' | 'MARCA_ANTICORPO' | 'CLONE',
  chance: Number,         // 0–100
  valor: Number,
  turnos: Number
}
```

### 6.4 Capítulo

```js
{
  id: Number,
  titulo: String,
  tipo: 'CUTSCENE' | 'BATALHA' | 'EDUCACIONAL' | 'BOSS',
  localizacao: String,
  narrativaInicio: [{ personagem: String, texto: String, sprite: String }],
  batalha: null | { inimigo: String, timeDisponivel: String[], itensDisponiveis: String[] },
  narrativaFim: [...],
  recompensas: { xp: Number, itens: String[], desbloqueios: String[] },
  falasProfesorImuno: String[]
}
```

### 6.5 Estado do Turno

```js
{
  turnoAtual: Number,
  fase: 'ESCOLHA_ACAO' | 'EXECUCAO' | 'FIM_TURNO' | 'FIM_BATALHA',
  timeJogador: Personagem[],
  inimigo: Personagem,
  personagemAtivo: Number,   // índice no timeJogador
  historico: Object[]
}
```

### 6.6 Save

```js
{
  capituloAtual: Number,
  timeJogador: Personagem[],  // toJSON() de cada um
  itens: Object,
  xpCadaPersonagem: Object    // { nome: xpTotal }
}
```

---

## 7. Tipos Biológicos (TIPOS)

Valores canônicos — não alterar strings:

```
FAGOCITO | CITOTOXICO | HUMORAL | COORDENADOR | SINALIZADOR
VIRUS_EXTRACELULAR | VIRUS_INTRACELULAR | VIRUS_MUTANTE | TOXINA
```

### Tabela de Efetividade

| Ataque ↓ \ Alvo → | VIRUS_EXTRACELULAR | VIRUS_INTRACELULAR | VIRUS_MUTANTE | TOXINA |
|---|---|---|---|---|
| FAGOCITO | 2.0 | 0.5 | 1.0 | 0.5 |
| CITOTOXICO | 0.5 | 2.0 | 1.0 | 0.5 |
| HUMORAL | 2.0 | 1.0 | 0.5 | 2.0 |
| COORDENADOR | buff | buff | buff | buff |
| SINALIZADOR | 1.0 | 1.0 | 1.0 | 0.5 |

---

## 8. Personagens Canônicos

### Sistema Imune (AgentImune)

| ID Instância | Classe | Tipo | Evolui Para | Nível Evolução |
|---|---|---|---|---|
| `NEUTRO` | Neutrófile | FAGOCITO | `NEUTRO_REX` | 16 |
| `MACRO` | Macrófago | FAGOCITO | `MACRO_GUARDIAO` | 20 |
| `NATU` | Natural Killer | CITOTOXICO | `NATU_SOMBRA` | 18 |
| `LINFO_B` | Linfócito B | HUMORAL | `PLASMA_B` | 25 |
| `LINFO_T` | Linfócito T Helper | COORDENADOR | `T_MAESTRO` | 22 |
| `T_KILLER` | Linfócito T Citotóxico | CITOTOXICO | `T_EXTERMINADOR` | 24 |
| `ANTI` | Anticorpo IgG | HUMORAL | — | Evento Cap.6 |
| `CITO` | Citocina | SINALIZADOR | — | — |

`TIME_INICIAL = [NEUTRO, MACRO]`

`ANTI` = evolução especial de `PLASMA_B` + antígeno coletado no Capítulo 6.

### Vírus (Virus)

| ID Instância | Estágio | Tipo | Capítulo |
|---|---|---|---|
| `VIRU_PRIME` | 1 | VIRUS_EXTRACELULAR | 1 |
| `REPLICATUS` | 2 | VIRUS_EXTRACELULAR | 2 |
| `TOXICUS` | 3 | TOXINA | 3 |
| `MUTAGEN` | 4 | VIRUS_MUTANTE | 4 |
| `NECROTICUS` | 5 | VIRUS_INTRACELULAR | 5 |
| `VIREX_OMEGA` | 6 | VIRUS_MUTANTE | 7 |

---

## 9. Fórmula de Dano Canônica

```
Dano = ((2 × nivel / 5 + 2) × poder × ataque / defesa / 50 + 2)
       × efetividade    // 2.0 | 1.0 | 0.5 | 0.0
       × critico        // 1.5 (chance 6.25%) | 1.0
       × aleatoriedade  // Math.random() * 0.15 + 0.85
```

### Status e Dano por Turno

| Status | Efeito por Turno |
|---|---|
| `INFECTADO` | −6 HP |
| `ENVENENADO` | −(turno × 2) HP (crescente) |
| `INFLAMADO` | −20% DEF (sem dano direto) |
| `SUPRIMIDO` | −ATK, −SPD |
| `MARCA_ANTICORPO` | vulnerável a todos os ataques (×2 dano recebido) |
| `MULTIPLICANDO` | +1 clone inimigo por turno |

---

## 10. APIs Públicas Esperadas por Módulo

### `personagens.js`
```js
export class Personagem { receberDano(d), curar(v), aplicarStatus(s), removerStatus(), estaVivo(), toJSON() }
export class AgentImune extends Personagem { ganharXP(xp), podeEvoluir() }
export class Virus extends Personagem { ativarMecanismo() }
export const TIME_INICIAL   // [NEUTRO, MACRO]
export const TODOS_AGENTES  // todos os AgentImune
export { NEUTRO, MACRO, NATU, LINFO_B, LINFO_T, T_KILLER, ANTI, CITO }
export { VIRU_PRIME, REPLICATUS, TOXICUS, MUTAGEN, NECROTICUS, VIREX_OMEGA }
```

### `tipos.js`
```js
export const TIPOS                          // objeto com todas as strings de tipo
export const TABELA_EFETIVIDADE             // matrix tipo×tipo → multiplicador
export function calcularEfetividade(tipoAtaque, tipoAlvo)  // → Number
export function getMensagemEfetividade(multiplicador)       // → String
export const DESCRICOES_BIOLOGICAS          // { [tipo]: String }
```

### `ataques.js`
```js
export class Ataque { usar(atacante, alvo), temPP(), gastarPP() }
export class EfeitoEspecial { aplicar(alvo) }
// Instâncias nomeadas de cada ataque, agrupadas por personagem
```

### `turnos.js`
```js
export class GerenciadorTurnos {
  iniciarBatalha(timeJogador, inimigo)
  jogadorEscolheuAtaque(indexAtaque)
  jogadorEscolheuItem(item)
  jogadorEscolheuTrocar(indexPersonagem)
  jogadorEscolheuFugir()
  executarTurno()
  aplicarEfeitosStatus()
  verificarFimBatalha()   // → 'VITORIA' | 'DERROTA' | null
  calcularAcaoIA(inimigo, timeJogador)
  // Callbacks: onMensagem(texto), onAnimacao(tipo), onFimBatalha(resultado)
}
```

### `dano.js`
```js
export function calcularDano(atacante, alvo, ataque)
  // → { danoFinal, critico, efetividade, mensagens[] }
export function calcularCritico()                // → 1.5 | 1.0
export function calcularAleatoriedade()          // → 0.85–1.0
export function aplicarDano(personagem, dano)    // → { novoHP, foi_ko }
export function calcularDanoStatus(personagem)   // → Number
export function calcularCura(personagem, valor)  // → Number (novo HP)
export function aplicarBuff(personagem, atributo, multiplicador, turnos)
```

### `sprites.js`
```js
export const SPRITES                            // { [nome]: caminhoAsset }
export function carregarSprite(nome)            // → Promise<HTMLImageElement>
export function preCarregarTodos()              // → Promise<void>
export function gerarSpriteSVG(personagem)      // → SVGElement (fallback)
export class AnimadorSprite { tocar(animacao, callback) }
  // animacoes: 'IDLE' | 'ATACAR' | 'RECEBER_DANO' | 'KO'
export function criarParticulas(tipo, x, y)     // tipo: FAGOCITO|CITOTOXICO|HUMORAL|CURA
```

### `capitulos.js`
```js
export const CAPITULOS   // objeto indexado por id (0–7 + EPILOGO)
export class GerenciadorCapitulos {
  iniciarCapitulo(id)
  avancarDialogo()
  iniciarBatalha()
  finalizarCapitulo(resultado)
  verificarDesbloqueios()
}
export class ProfImuno { falar(topico) }  // → { texto, dadosBiologicos }
// Save/load via localStorage — slot único
```

### `balanceamento.js`
```js
export function calcularStatsNivel(personagem, nivel)  // → { hp, ataque, defesa, velocidade }
export const TABELA_XP         // [xpNecessarioPorNivel] — 50 níveis
export const DROPS_XP_INIMIGOS // { [nomeVirus]: xpBase }
```

### `main.js`
```js
// Orquestrador puro — sem lógica de jogo
export class JogoRUBRO {
  iniciar()
  novoJogo()
  continuarJogo()
  avancarCapitulo()
}
// UI helpers:
mostrarTelaBatalha(), esconderTelaBatalha()
mostrarDialogo(texto, personagem), fecharDialogo()
mostrarCardProfImuno(dados), fecharCard()
mostrarTelaCutscene(cenas[], callback)
atualizarBarrasHP(aliado, inimigo)
mostrarMensagemEfetividade(texto)
animarTransicaoCapitulo(nomeLocal)
```

---

## 11. Eventos Globais do Sistema

Todos os eventos são disparados via `document.dispatchEvent(new CustomEvent(...))`.

| Evento | Payload | Emitido por | Consumido por |
|---|---|---|---|
| `rubro:fim-batalha` | `{ resultado: 'VITORIA'\|'DERROTA' }` | `turnos.js` | `main.js` |
| `rubro:personagem-ko` | `{ personagem: String }` | `turnos.js` | `main.js`, `sprites.js` |
| `rubro:status-aplicado` | `{ personagem, status }` | `dano.js` | `main.js` |
| `rubro:evolucao` | `{ de: String, para: String }` | `capitulos.js` | `main.js`, `sprites.js` |
| `rubro:xp-ganho` | `{ personagem, xp }` | `turnos.js` | `capitulos.js` |
| `rubro:capitulo-concluido` | `{ id: Number }` | `capitulos.js` | `main.js` |
| `rubro:trocar-personagem` | `{ index: Number }` | `main.js` (input) | `turnos.js` |
| `rubro:input-desativado` | `{}` | `main.js` | `main.js` |
| `rubro:input-ativado` | `{}` | `main.js` | `main.js` |

---

## 12. Pipeline Multiagente

| Ordem | LLM | Arquivo(s) | Depende de |
|---|---|---|---|
| 1 | LLM 1 | `js/personagens.js` | — |
| 2 | LLM 2 | `js/tipos.js` | — |
| 3 | LLM 3 | `js/ataques.js` | tipos.js |
| 4 | LLM 4 | `js/turnos.js` | personagens.js, ataques.js, dano.js |
| 5 | LLM 5 | `js/dano.js` | personagens.js, ataques.js, tipos.js |
| 6 | LLM 6 | `index.html`, `css/*.css` | — |
| 7 | LLM 7 | `js/sprites.js` | — |
| 8 | LLM 8 | `js/capitulos.js` | personagens.js, turnos.js |
| 9 | LLM 9 | `js/main.js` | TODOS |
| 10 | LLM 10 | `js/balanceamento.js`, `QA_REPORT.md` | TODOS |

**Regra de entrega:** cada LLM deve informar no início do output: qual LLM é e qual arquivo está produzindo.

---

## 13. Convenções ES6

- `import`/`export` nativo — sem CommonJS (`require`)
- Nenhum `var` — usar `const` por padrão, `let` quando necessário
- Arrow functions para callbacks; métodos de classe com sintaxe de método
- Template literals para strings compostas
- Destructuring para leitura de objetos complexos
- `async/await` para operações assíncronas (carregamento de assets, save)
- Sem side-effects globais no nível do módulo além de `const` declarations
- `toJSON()` em toda classe que precisa ser persistida

---

## 14. Visual e UI

| Elemento | Valor |
|---|---|
| Fundo | `#0A0F1E` (azul-marinho escuro) |
| Cor primária | `#CC2233` (vermelho) |
| Cor secundária | `#00CCFF` (azul bioluminescente) |
| Texto | `#FFFFFF` |
| Fonte batalha | `'Press Start 2P'` (Google Fonts) |
| Fonte educacional | `'Rajdhani'` (Google Fonts) |
| Estilo | Pixel-art — bordas nítidas, `border-radius` mínimo |

### Layout da Tela de Batalha (estrutura HTML esperada)

```
#tela-batalha
  #area-inimigo  → #sprite-inimigo, #nome-inimigo, #barra-hp-inimigo
  #area-aliado   → #sprite-aliado,  #nome-aliado,  #barra-hp-aliado, #barra-xp-aliado
  #caixa-dialogo → #texto-dialogo
  #menu-acao     → #btn-lutar, #btn-itens, #btn-trocar, #btn-fugir
  #menu-ataques  → grid 2×2 com nome, tipo e PP de cada ataque
```

---

## 15. Regras para LLMs — Anti-Drift & Anti-Alucinação

### Proibido absolutamente:
1. **Não inventar** personagens, tipos, mecânicas ou arquivos não listados neste documento
2. **Não renomear** classes, métodos, instâncias ou eventos definidos acima
3. **Não usar** frameworks, bibliotecas externas ou TypeScript
4. **Não criar** dependências circulares entre módulos
5. **Não omitir** exports — toda API pública listada na seção 10 deve ser exportada
6. **Não alterar** a fórmula de dano canônica (seção 9)
7. **Não inventar** novos eventos globais sem registrá-los (seção 11)

### Obrigatório:
1. Ler este arquivo **inteiro** antes de gerar qualquer código
2. Usar **exatamente** as strings de tipo definidas em `TIPOS` (seção 7)
3. Usar **exatamente** os IDs de instância definidos na seção 8 (`NEUTRO`, `VIRU_PRIME`, etc.)
4. Todo método de classe que altera estado deve disparar o evento global correspondente (seção 11)
5. Em caso de ambiguidade, escolher a interpretação **mais fiel à biologia real**
6. Testar mentalmente a conexão com todos os módulos dependentes antes de entregar
7. Comentar código com descrições biológicas onde aplicável

### Regra de ouro:
> Se não está neste documento, não existe no projeto. Não invente. Consulte o contexto especializado correspondente.

---

*CORE_CONTEXT.md — RUBRO v1.0 — Documento canônico mínimo*
