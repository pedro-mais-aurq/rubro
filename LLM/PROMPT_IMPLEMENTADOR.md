# PROMPT_IMPLEMENTADOR.md — RUBRO
> Protocolo operacional global para implementação multiagente.
> Leitura obrigatória e integral antes de qualquer output de qualquer LLM participante do pipeline RUBRO.
> Este documento governa **como** implementar. Os documentos canônicos governam **o quê** implementar.

---

## 0. Hierarquia de Autoridade Absoluta

```
CORE_CONTEXT.md          ← dados, módulos, APIs, instâncias, eventos base, fórmulas
UI_CONTEXT.md            ← visual, paleta, tipografia, animações, layout, feedback
GLOBAL_UI_STATES.md      ← estados globais, locks, transições, sincronização
EVENT_SYSTEM_CONTEXT.md  ← filosofia de eventos, contratos, payloads, namespaces
PROMPT_IMPLEMENTADOR.md  ← governança, padrões, contratos de implementação (este documento)
(output de cada LLM)     ← gerado a partir de todos os documentos acima
```

Em qualquer conflito entre este documento e os documentos acima: **os documentos canônicos prevalecem.**

Em qualquer ambiguidade não coberta pelos documentos canônicos: aplicar o princípio da **máxima fidelidade biológica** e **máxima consistência arquitetural**.

---

## 1. Protocolo de Início Obrigatório

Toda LLM participante do pipeline, antes de produzir qualquer output, deve:

1. Identificar-se explicitamente no início do output com o formato:
   ```
   // LLM N — arquivo: js/nome-do-arquivo.js
   ```
2. Declarar quais documentos canônicos foram lidos.
3. Declarar as dependências do módulo que será implementado.
4. Verificar que nenhuma dependência circular existe antes de escrever a primeira linha de código.

Sem esse cabeçalho, o output é considerado inválido para integração.

---

## 2. Filosofia Global de Implementação

### 2.1 Princípios Inegociáveis

| Princípio | Definição operacional |
|---|---|
| **Modularidade estrita** | Cada arquivo é uma unidade coesa de responsabilidade única. Nenhum arquivo faz mais do que seu escopo define. |
| **Desacoplamento total** | Módulos não se conhecem mutuamente para comunicação de estado. Comunicação inter-módulo: apenas eventos DOM ou chamada direta via contrato de API documentado. |
| **Previsibilidade** | Dado o mesmo estado de entrada, a saída de qualquer função é sempre a mesma (exceto onde RNG é explicitamente documentado). |
| **Rastreabilidade** | Todo evento, toda transição de estado, todo cálculo de dano deve ser logável sem alterar comportamento. |
| **Estabilidade arquitetural** | Nenhuma decisão de implementação pode fragilizar a integração de outros módulos. Dúvida → escolher a opção mais conservadora. |
| **Fidelidade ao cânone** | Se está no documento canônico, implementar exatamente. Se não está, não inventar. |

### 2.2 O Que Nunca Fazer

- Criar lógica que pertence a outro módulo dentro do módulo atual.
- Importar `main.js` em qualquer outro módulo.
- Criar dependências circulares entre quaisquer dois módulos.
- Emitir eventos não registrados em CORE_CONTEXT §11.
- Alterar a assinatura de qualquer API pública definida em CORE_CONTEXT §10.
- Usar `var`, CommonJS (`require`), frameworks externos ou TypeScript.
- Criar side-effects globais além de declarações `const` no nível do módulo.
- Mutar atributos base de `Personagem` para aplicar buffs/debuffs — atributos base são imutáveis em runtime.
- Hardcodar valores numéricos que estão definidos como constantes nos documentos canônicos.
- Criar comportamento não-documentado para contornar limitações percebidas.

---

## 3. Regras de Modularidade

### 3.1 Definição de Módulo

Um módulo é um arquivo `.js` com responsabilidade única, exports explícitos e imports declarativos. Cada módulo:

- Exporta apenas o que outros módulos precisam consumir.
- Importa apenas o que seus documentos canônicos autorizam.
- Não acessa estado interno de outro módulo além de sua API pública.
- Não registra listeners de eventos DOM, exceto se for `main.js` ou `sprites.js`.

### 3.2 Responsabilidades Canônicas por Módulo

| Módulo | Responsabilidade exclusiva |
|---|---|
| `personagens.js` | Definição de classes, instâncias canônicas e comportamentos de personagem |
| `tipos.js` | Definição de tipos biológicos, tabela de efetividade e mensagens associadas |
| `ataques.js` | Definição de classes de ataque, efeitos especiais e instâncias canônicas |
| `dano.js` | Cálculo de dano, status, cura, buffs e debuffs — retorna valores, não aplica ao DOM |
| `turnos.js` | Orquestração do fluxo de batalha, IA inimiga, emissão de eventos de combate |
| `sprites.js` | Carregamento de assets, fallback SVG, animações de sprite e partículas |
| `capitulos.js` | Estrutura de capítulos, save/load, progressão narrativa, evolução de personagens |
| `balanceamento.js` | Curvas de stats, tabela de XP, drops de XP por inimigo |
| `main.js` | Orquestração pura: UI, input, eventos DOM, integração entre todos os módulos |

### 3.3 Proibições de Escopo Cruzado

- `dano.js` nunca manipula DOM.
- `turnos.js` nunca acessa `balanceamento.js` diretamente — XP via `AgentImune.ganharXP()`.
- `sprites.js` nunca emite CustomEvents — apenas consome e invoca callbacks.
- `personagens.js`, `tipos.js`, `ataques.js`, `balanceamento.js` nunca participam do sistema de eventos.
- Apenas `main.js` manipula o DOM além de `sprites.js` (canvas e `<img>`).
- Apenas `GameStateManager` (dentro de `main.js`) emite `rubro:input-desativado` e `rubro:input-ativado`.

---

## 4. Regras de Desacoplamento

### 4.1 Canais de Comunicação Permitidos

| Canal | Quando usar | Exemplo |
|---|---|---|
| Import + chamada direta | Dependência unidirecional documentada em CORE_CONTEXT §4 | `turnos.js` chama `calcularDano()` de `dano.js` |
| CustomEvent DOM | Comunicação entre módulos que não podem se importar mutuamente | `turnos.js` emite `rubro:fim-batalha`; `main.js` consome |
| Callback registrado | Notificação assíncrona de módulo orquestrador para módulo dependente | `main.js` registra `gerenciador.onMensagem` antes de `iniciarBatalha()` |

### 4.2 Canais Proibidos

- Referência direta a instâncias internas de outro módulo (ex.: acessar `gerenciador._clonesAtivos` de fora de `turnos.js`).
- Polling: nenhum módulo consulta estado de outro em loop — toda comunicação é reativa.
- Objeto global compartilhado além dos exports explícitos dos módulos canônicos.
- Eventos DOM sem namespace `rubro:`.

### 4.3 Regra de Dependência Unidirecional

O grafo de dependências de CORE_CONTEXT §4 é lei:

```
personagens.js ←─ tipos.js
ataques.js ←─ tipos.js
dano.js ←─ personagens.js + ataques.js + tipos.js
turnos.js ←─ dano.js + personagens.js + ataques.js
capitulos.js ←─ personagens.js + turnos.js
sprites.js (independente)
balanceamento.js ←─ personagens.js
main.js ←─ TODOS os módulos acima
```

Qualquer import que inverta ou crie ciclo nesse grafo é uma violação crítica.

---

## 5. Regras de Nomenclatura

Aplicar sem exceções as convenções de CORE_CONTEXT §5:

| Elemento | Convenção | Exemplo |
|---|---|---|
| Classes | PascalCase | `Personagem`, `GerenciadorTurnos`, `AnimadorSprite` |
| Instâncias canônicas | UPPER_SNAKE_CASE | `NEUTRO`, `VIRU_PRIME`, `TABELA_EFETIVIDADE` |
| Funções exportadas | camelCase | `calcularDano()`, `aplicarStatus()` |
| Constantes/objetos globais | UPPER_SNAKE_CASE | `TIPOS`, `CAPITULOS`, `TIME_INICIAL` |
| Eventos DOM | kebab-case com prefixo `rubro:` | `rubro:fim-batalha`, `rubro:personagem-ko` |
| Arquivos JS | camelCase | `personagens.js`, `turnos.js` |
| IDs HTML | kebab-case | `#sprite-aliado`, `#barra-hp-inimigo` |
| Variáveis internas de método | camelCase | `danoFinal`, `velocidadeEfetiva` |
| Propriedades privadas de classe | prefixo `_` + camelCase | `_clonesAtivos`, `_historico` |

Nunca renomear identificadores já definidos nos documentos canônicos. Qualquer nome já definido é contrato.

---

## 6. Regras de Organização de Arquivos

### 6.1 Estrutura Interna de Cada Arquivo JS

Todo arquivo JS deve seguir esta ordem de seções:

```
1. Comentário de identificação (LLM N — arquivo — dependências)
2. Imports (agrupados por módulo de origem)
3. Constantes do módulo (UPPER_SNAKE_CASE)
4. Definições de classe (PascalCase)
5. Instâncias exportadas (UPPER_SNAKE_CASE)
6. Funções exportadas (camelCase)
7. Exports agrupados no final (ou inline — manter consistência)
```

### 6.2 Regras de Comentários

- Cada classe deve ter comentário descrevendo sua responsabilidade.
- Cada método público deve ter comentário de uma linha descrevendo o que retorna.
- Funções de cálculo devem ter comentário com a fórmula aplicada.
- Constantes biológicas devem ter comentário com a justificativa imunológica.
- Código de IA inimiga deve ser comentado com o critério de decisão.
- Nunca comentar o óbvio — comentar a intenção e o contexto biológico.

### 6.3 Tamanho e Coesão

- Se um arquivo ultrapassa 400 linhas, verificar se há responsabilidade misturada.
- Se uma função ultrapassa 30 linhas, verificar se pode ser decomposta em funções puras menores.
- Nenhuma função deve ter mais de 3 níveis de indentação.

---

## 7. Regras de Separação de Responsabilidades

### 7.1 Separação Dado / Lógica / Apresentação

| Camada | Onde vive | O que contém |
|---|---|---|
| **Dado** | `personagens.js`, `tipos.js`, `ataques.js`, `balanceamento.js` | Estruturas, instâncias, constantes, tabelas |
| **Lógica** | `dano.js`, `turnos.js`, `capitulos.js` | Cálculos, regras, orquestração, IA |
| **Apresentação** | `main.js`, `sprites.js`, `css/` | DOM, animações, feedback visual |

Nenhuma função de apresentação deve viver em módulos de dado ou lógica.
Nenhuma lógica de jogo deve viver em `main.js` além de orquestração de chamadas.

### 7.2 Responsabilidade do `main.js`

`main.js` é orquestrador puro. Sua função é:
- Iniciar módulos na ordem correta.
- Registrar callbacks nos gerenciadores.
- Escutar eventos DOM e delegar para os gerenciadores corretos.
- Atualizar DOM em resposta a eventos e callbacks.
- Gerenciar `GameStateManager` e locks.

`main.js` não deve conter: fórmulas de dano, lógica de IA, regras de status, lógica de save, cálculo de XP.

---

## 8. Regras de Arquitetura Orientada a Eventos

### 8.1 Contrato de Emissão

Todo evento emitido deve:

```js
document.dispatchEvent(new CustomEvent('rubro:nome-evento', {
  detail: { /* payload canônico conforme EVENT_SYSTEM_CONTEXT §4 */ }
}));
```

- Usar exatamente o nome registrado em CORE_CONTEXT §11.
- Incluir todos os campos do payload canônico — nunca omitir campos.
- Ser emitido apenas pelo módulo autorizado para aquele evento.
- Ser emitido apenas no estado global que autoriza a emissão (GLOBAL_UI_STATES §15.2).

### 8.2 Contrato de Escuta

Todo listener registrado deve:

```js
document.addEventListener('rubro:nome-evento', (e) => {
  if (!estadoAutoriza()) return; // descarte silencioso
  handler(e.detail);
});
```

- Verificar o estado global antes de processar.
- Descartar silenciosamente se o estado não autoriza o consumo.
- Ser removido quando o módulo não está mais responsável pelo estado ativo.

### 8.3 Isolamento de Eventos

- Listeners não emitem eventos durante a própria execução de resposta, exceto em cadeias explicitamente documentadas em EVENT_SYSTEM_CONTEXT §8.
- Profundidade máxima de cadeia autorizada: 2 níveis.
- Toda cadeia autorizada deve ser documentada no código com comentário `// CADEIA AUTORIZADA: evento-A → evento-B`.

### 8.4 Prevenção de Loops

- Nenhum handler de evento pode reemitir o mesmo evento que o acionou.
- Cadeias de eventos que retornam ao emissor original são proibidas.
- Se detectado potencial de loop, emitir `console.error` e abortar a cadeia.

### 8.5 Extensão do Sistema de Eventos

Antes de criar qualquer novo evento `rubro:*`:
1. Registrá-lo em CORE_CONTEXT §11.
2. Definir payload canônico.
3. Definir emissor e consumidores autorizados.
4. Definir estado global que autoriza emissão e consumo.
5. Somente então implementar.

---

## 9. Regras de Arquitetura Orientada a Estados

### 9.1 GameStateManager — Árbitro Único

`GameStateManager` é o único árbitro de estado global. Regras:

- É instanciado e controlado exclusivamente por `main.js`.
- Nenhum outro módulo acessa `GameStateManager.current` diretamente — o estado é inferido pelo contexto de execução.
- Toda transição de estado passa por `GameStateManager.transition(de, para)`.
- Transições são atômicas — sem estado parcialmente ativado.

### 9.2 Contratos Invioláveis de Estado

Conforme GLOBAL_UI_STATES §1.3:

- `TRANSITION` e `LOADING` sempre bloqueiam input completamente.
- `PAUSE` nunca destrói o estado subjacente — congela sem desmontá-lo.
- `BATTLE.EXECUCAO` nunca aceita input do jogador.
- `BATTLE.FIM_TURNO` nunca aceita input do jogador.
- Apenas 1 estado primário ativo por instante.

### 9.3 Renderização Orientada por Estado

- Cada estado declara exatamente o que renderiza.
- Nenhum elemento é exibido sem autorização do estado ativo.
- Ao entrar em um estado: ativar exatamente os elementos daquele estado.
- Ao sair de um estado: desativar exatamente os elementos daquele estado.
- Overlays não destroem o estado primário — apenas sobrepõem.

### 9.4 Subestados de BATTLE

Os subestados `BATTLE.ESCOLHA_ACAO`, `BATTLE.EXECUCAO`, `BATTLE.FIM_TURNO`, `BATTLE.FIM_BATALHA` são gerenciados internamente por `GerenciadorTurnos`. Nenhum módulo externo transita entre subestados diretamente. A comunicação para fora de `turnos.js` é feita exclusivamente via eventos e callbacks.

### 9.5 Locks Operacionais

Locks são flags booleanas gerenciadas exclusivamente pelo `GameStateManager`:

| Lock | Ativo em | Efeito obrigatório |
|---|---|---|
| `INPUT_LOCK` | BOOT, LOADING, TRANSITION, BATTLE.EXECUCAO, BATTLE.FIM_TURNO | Remover todos os event listeners de input do DOM |
| `SAVE_LOCK` | BATTLE, LOADING, TRANSITION, BOOT, GAME_OVER | Bloquear `localStorage.setItem` para dados de jogo |
| `ANIMATION_LOCK` | Sequência com `onAnimacao` pendente | `turnos.js` não avança para próximo evento |
| `OVERLAY_LOCK` | 2 overlays já ativos | Terceiro overlay descartado silenciosamente |

Nenhum módulo lê ou escreve locks diretamente — apenas `GameStateManager`.

---

## 10. Regras de Criação de APIs

### 10.1 Contrato Mínimo de Toda API Pública

Toda função ou método exportado deve:

- Ter assinatura idêntica à definida em CORE_CONTEXT §10.
- Ter retorno tipicamente documentado (Number, Boolean, Object, String).
- Lançar `Error` descritivo apenas em situações de contrato quebrado (ex.: callbacks não configurados).
- Nunca retornar `undefined` onde um tipo específico é esperado — retornar valor de fallback documentado.
- Nunca produzir side-effects não documentados.

### 10.2 Padrões de Retorno

| Situação | Retorno esperado |
|---|---|
| Cálculo de dano | `{ danoFinal: Number, critico: Boolean, efetividade: Number, mensagens: String[] }` |
| Aplicação de dano | `{ novoHP: Number, foi_ko: Boolean }` |
| Verificação de fim de batalha | `'VITORIA' \| 'DERROTA' \| null` |
| Cálculo de efetividade | `2.0 \| 1.0 \| 0.5 \| 0.0` |
| Operações de save/load | `Promise<void>` ou `Promise<Object>` |
| Carregamento de sprite | `Promise<HTMLImageElement>` |

### 10.3 Retrocompatibilidade

Nenhuma LLM pode alterar a assinatura de uma API já definida em CORE_CONTEXT §10. Se uma extensão for necessária, adicionar parâmetros opcionais ao final — nunca remover ou reordenar parâmetros existentes.

---

## 11. Regras de Payloads

### 11.1 Integridade de Payload

Todo payload de evento deve:

- Incluir todos os campos definidos no payload canônico do evento (EVENT_SYSTEM_CONTEXT §4).
- Usar os tipos corretos para cada campo.
- Nunca incluir campos não definidos no payload canônico — sem campos extras não documentados.

### 11.2 Imutabilidade de Payload

O payload enviado em um evento não deve ser mutado após a emissão. Criar cópia se necessário:

```js
document.dispatchEvent(new CustomEvent('rubro:fim-batalha', {
  detail: { resultado } // sempre um novo objeto literal
}));
```

### 11.3 Validação de Payload em Modo Debug

Em modo debug, antes de emitir qualquer evento, validar que todos os campos obrigatórios estão presentes e com tipo correto. Registrar `console.error` se inválido. Emitir o evento mesmo assim para não bloquear o fluxo.

---

## 12. Regras de Sincronização

### 12.1 Sincronização Visual com Gameplay

`turnos.js` deve aguardar o callback `onAnimacao` antes de avançar para o próximo evento de combate. Conforme GLOBAL_UI_STATES §15.1:

| Evento de combate | Duração máxima | Callback esperado |
|---|---|---|
| Ataque executado | 800ms | `onAnimacao('ATAQUE')` |
| Ataque crítico | 1200ms | `onAnimacao('CRITICO')` |
| Status aplicado | 600ms | `onAnimacao('STATUS')` |
| KO | 1000ms | `onAnimacao('KO')` |
| Evolução | 1500ms | `onAnimacao('EVOLUCAO')` |
| Troca de personagem | 400ms | `onAnimacao('TROCA')` |
| Transição de capítulo | 1800ms | `onAnimacao('TRANSICAO')` |

Se `onAnimacao` não for invocado dentro da duração máxima + 500ms: `turnos.js` prossegue autonomamente e registra `console.warn`.

### 12.2 Ordem de Operações em FIM_TURNO

1. `aplicarEfeitosStatus()` em jogador, depois inimigo.
2. Decrementar contadores de buff/debuff.
3. `verificarFimBatalha()`.
4. Se `null`: emitir `rubro:input-ativado` via `GameStateManager`.
5. Se resultado: iniciar sequência `BATTLE.FIM_BATALHA`.

### 12.3 Bloqueio de Input

- `rubro:input-desativado`: emitido por `GameStateManager` imediatamente após qualquer input do jogador.
- `rubro:input-ativado`: emitido por `GameStateManager` apenas ao fim completo do turno, incluindo todas as animações.
- Durante troca forçada por KO: input ativo exclusivamente para seleção de personagem substituto.

---

## 13. Regras de Renderização

### 13.1 Ordem de Renderização Canônica

Conforme UI_CONTEXT §14.1, sempre nesta ordem:

1. Background (cenário do capítulo)
2. Sprite inimigo (`#sprite-inimigo`)
3. Sprite aliado (`#sprite-aliado`)
4. Canvas de partículas (z-index 20)
5. HUD (barras, badges, indicadores de status)
6. Números flutuantes de dano/cura
7. Caixa de diálogo (`#caixa-dialogo`)
8. Menus de ação (`#menu-acao`, `#menu-ataques`)
9. Overlays de feedback (flashes, vinhetas)
10. Overlays de estado (pausa, loading, evolução)

### 13.2 Invalidação de Renderização

- Barras de HP e XP são atualizadas imediatamente após `aplicarDano()` ou `calcularCura()` — nunca em polling.
- Status visíveis no HUD são atualizados imediatamente ao consumir `rubro:status-aplicado`.
- Nenhum elemento de HUD é re-renderizado sem mudança de dado subjacente.

### 13.3 Limites de Renderização Simultânea

Conforme UI_CONTEXT §17:

- Máximo 3 elementos animados simultaneamente (exceto idle).
- Máximo 2 overlays simultâneos — o anterior é fechado antes de abrir o próximo.
- Máximo 30 partículas simultâneas no Canvas.
- Máximo 1 número flutuante de dano por frame por personagem.
- Máximo 2 ícones de status visíveis por personagem no HUD.

### 13.4 Pixel-Art — Regras Técnicas

- `image-rendering: pixelated` em todos os `<img>` de sprite.
- `image-rendering: crisp-edges` como fallback.
- Nunca `filter: blur()` em sprites — apenas em overlays de estado.
- Resolução de referência: 480×320px escalada via CSS `transform: scale()`.
- Sem easing suave genérico em animações de sprite — usar `steps()`.

---

## 14. Regras de Gerenciamento de Input

### 14.1 Princípio de Input Controlado por Estado

Nenhum handler de input existe no DOM fora do estado que o autoriza. Input não é desabilitado via CSS ou `pointer-events` — os listeners são removidos fisicamente do DOM via `removeEventListener`.

### 14.2 Inputs por Estado

| Estado | Inputs permitidos |
|---|---|
| `MAIN_MENU` | Arrow keys, Enter/Space, clique para navegar e selecionar |
| `BATTLE.ESCOLHA_ACAO` | Arrow keys, Enter/Space, clique nos botões de ação |
| `BATTLE.EXECUCAO` | Nenhum |
| `BATTLE.FIM_TURNO` | Nenhum |
| `DIALOGUE` | Enter/Space/clique para avançar diálogo |
| `PAUSE` | Tecla de pausa para desativar; Escape equivalente |
| `BOOT`, `LOADING`, `TRANSITION` | Nenhum |

### 14.3 Feedback de Input

- Toda ação do jogador tem resposta visual imediata em ≤ 50ms, mesmo que o processamento demore mais.
- Ataques sem PP não são selecionáveis — feedback imediato visual se tentativa.
- Toda ação irreversível (FUGIR, usar último item) requer confirmação de 1 passo.

---

## 15. Regras de Gerenciamento de Memória

### 15.1 Listeners

- Registrar o retorno de `addEventListener` para remoção posterior quando aplicável.
- Ao sair de um estado: remover todos os listeners registrados durante aquele estado.
- Nunca acumular listeners duplicados para o mesmo evento no mesmo elemento.

### 15.2 Instâncias

- Instâncias canônicas de personagens (`NEUTRO`, `VIRU_PRIME`, etc.) são declaradas uma vez em `personagens.js` e referenciadas — nunca recriadas durante a sessão.
- Clones de vírus (`MULTIPLICANDO`) são criadas e destruídas durante o combate — manter em `_clonesAtivos` de `GerenciadorTurnos`.
- Ao fim de batalha: limpar `_clonesAtivos`.

### 15.3 Canvas de Partículas

- Partículas são objetos de vida curta — criar, animar, destruir dentro de `criarParticulas()`.
- Nunca acumular partículas além do limite de 30 simultâneas.
- Limpar o canvas com `clearRect` a cada frame de animação de partículas.

---

## 16. Regras de Persistência

### 16.1 Save — Contrato Canônico

O save usa `localStorage` com slot único. Estrutura canônica (CORE_CONTEXT §6.6):

```js
{
  capituloAtual: Number,
  timeJogador: Personagem[], // via toJSON() de cada instância
  itens: Object,
  xpCadaPersonagem: Object   // { nome: xpTotal }
}
```

### 16.2 Regras de Save

- Save é responsabilidade exclusiva de `capitulos.js`.
- `SAVE_LOCK` deve estar inativo para qualquer operação de save.
- Estados que bloqueiam save: BATTLE, LOADING, TRANSITION, BOOT, GAME_OVER.
- Save corrompido: descartar completamente e iniciar `novoJogo()`.
- Toda classe que precisa ser persistida deve implementar `toJSON()`.

### 16.3 Regras de Load

- Load ocorre apenas em `MAIN_MENU` ao selecionar `CONTINUAR`.
- `CONTINUAR` é desabilitado visualmente se não há save válido em `localStorage`.
- Load deve validar a estrutura do save antes de aplicar — não assumir integridade.

---

## 17. Regras de Combate

### 17.1 Fórmula de Dano — Imutável

A fórmula canônica de CORE_CONTEXT §9 não pode ser alterada:

```
Dano = ((2×nivel/5 + 2) × poder × ataque_efetivo / defesa_efetiva / 50 + 2)
       × efetividade × critico × aleatoriedade × fator_MARCA_ANTICORPO
```

Ordem de operações exata (BATTLE_CONTEXT §17.2):

1. `ataque_efetivo = atacante.ataque × buffs × fator_SUPRIMIDO`
2. `defesa_efetiva = alvo.defesa × buffs × fator_INFLAMADO`
3. `base = (2×nivel/5 + 2) × poder × ataque_efetivo / defesa_efetiva / 50 + 2`
4. `comEfetividade = base × efetividade`
5. `comCritico = comEfetividade × critico`
6. `comRNG = comCritico × aleatoriedade`
7. `comMarca = comRNG × (alvo.statusAtivo === 'MARCA_ANTICORPO' ? 2.0 : 1.0)`
8. `danoFinal = Math.floor(comMarca)`
9. `danoFinal = Math.max(1, danoFinal)` — exceto quando `efetividade === 0.0`

### 17.2 Limites de Segurança Obrigatórios

```js
personagem.hp = Math.max(0, personagem.hp - dano);          // HP nunca negativo
personagem.hp = Math.min(personagem.hpMax, personagem.hp + cura); // HP nunca acima do máximo
valorEfetivo = Math.max(1, valorEfetivo);                   // Atributo efetivo nunca negativo
```

### 17.3 Buffs e Debuffs — Imutabilidade do Atributo Base

- Atributos base de `Personagem` (`ataque`, `defesa`, `velocidade`) nunca são mutados em runtime.
- Modificadores são rastreados em lista interna por `dano.js` ou `turnos.js`.
- `valorEfetivo = valorBase × Π(multiplicadores ativos)`.
- Cap máximo de buff: `× 3.0` sobre o valor base.
- Cap mínimo de debuff: `× 0.25` sobre o valor base.
- Buffs decrementam ao final de cada `FIM_TURNO`; expiração silenciosa (sem evento).

### 17.4 Status — Unicidade e Sobrescrita

- Um personagem tem no máximo 1 `statusAtivo` simultâneo.
- Novo status sobrescreve o anterior se `chance` for satisfeita.
- `aplicarStatus(s)` define `statusAtivo = s` e dispara `rubro:status-aplicado`.
- `removerStatus()` define `statusAtivo = null` — sem evento.
- O mesmo sistema de status se aplica a aliados e inimigos sem distinção de API.

### 17.5 IA Inimiga — Critérios de Decisão

- A IA (`calcularAcaoIA()`) não emite eventos — opera internamente.
- A IA nunca seleciona ataques de categoria `STATUS` com `BUFF_ATK`/`BUFF_DEF` — inimigos não têm aliados em v1.0.
- A IA prioriza ataques com maior efetividade contra o personagem ativo do jogador.
- A IA respeita PP: nunca seleciona ataque com `ppAtual === 0`.
- Lógica de IA documentada com comentários explicando cada critério de seleção.

### 17.6 Clones (MULTIPLICANDO)

- Exclusivo da IA inimiga — nunca aplicável a agentes do jogador.
- Cap máximo: 3 clones simultâneos.
- Cada clone: instância simplificada de `Virus`, HP = 20% do HP base do inimigo principal.
- Clones não têm `statusAtivo`, não usam ataques especiais, causam dano fixo de 5.
- KO de clone: `rubro:personagem-ko` com `{ personagem: 'Clone' }`.
- KO do inimigo principal: todos os clones removidos automaticamente.
- `GerenciadorTurnos` mantém `_clonesAtivos: []` internamente.

### 17.7 Ação de FUGIR

- Disponível apenas fora de batalhas de BOSS (`tipo !== 'BOSS'` no Capítulo).
- Sempre bem-sucedida em batalhas normais.
- Emite `rubro:fim-batalha` com `{ resultado: 'FUGA' }`.
- `main.js` trata `'FUGA'` como derrota não-canônica: sem penalidade de XP.

---

## 18. Regras de Implementação de HUD

### 18.1 IDs HTML Canônicos

Usar exatamente os IDs de CORE_CONTEXT §14. Nunca criar IDs alternativos:

```
#tela-batalha, #area-inimigo, #area-aliado
#sprite-inimigo, #nome-inimigo, #barra-hp-inimigo
#sprite-aliado, #nome-aliado, #barra-hp-aliado, #barra-xp-aliado
#caixa-dialogo, #texto-dialogo
#menu-acao, #btn-lutar, #btn-itens, #btn-trocar, #btn-fugir
#menu-ataques (grid 2×2)
```

### 18.2 Comportamento da Barra de HP

| HP % | Cor | Comportamento |
|---|---|---|
| > 50% | `#00CC44` | Estático |
| 25–50% | `#FFCC00` | Estático |
| < 25% | `#CC2233` | Pulso lento — 1.5s período |
| 0% | `#333333` | Sem animação — KO |

- Transição de cor: direta, sem gradiente suave.
- HP numérico sempre visível.

### 18.3 Menu de Ataques

- Grid 2×2 com nome, tipo (badge colorido) e PP atual/máximo de cada ataque.
- Ataque com `ppAtual === 0`: texto `--color-text-dim`, não selecionável.
- Badge de tipo: cor canônica de UI_CONTEXT §2.2.
- `Press Start 2P` para todos os textos do menu de batalha.

### 18.4 Indicadores de Status

- Máximo 2 ícones visíveis por personagem.
- Aparecem com escala `0→1` em 150ms ao aplicar.
- Desaparecem com fade-out em 100ms ao remover.
- Cor de borda do ícone = cor do status (UI_CONTEXT §7.3).

---

## 19. Regras de Implementação de Animações

### 19.1 Animações de Sprite via AnimadorSprite

| Animação | Duração | Trigger |
|---|---|---|
| `IDLE` | Loop 2s | Estado padrão |
| `ATACAR` | 400ms | Antes de aplicar dano |
| `RECEBER_DANO` | 300ms (piscar ×3) | Ao receber qualquer dano |
| `KO` | 600ms (queda + grayscale) | HP = 0 |

### 19.2 Sequência de Animação por Turno

```
Input recebido → rubro:input-desativado
→ Mensagem de ação (#texto-dialogo)
→ Animação ATACAR do sprite atacante (~500ms)
→ Animação RECEBER_DANO do sprite alvo (~300ms)
→ Atualizar barras HP
→ Mensagem de efetividade / crítico (~800ms pausa)
→ [Se efeitoEspecial]: aplicar status → mensagem
→ [Se KO]: Animação KO (~600ms)
→ FIM_TURNO: mensagens de status → atualizar HP
→ rubro:input-ativado (se batalha continua)
```

### 19.3 Partículas — Mapeamento de Tipo

| Tipo de ataque | Tipo de partícula |
|---|---|
| `FAGOCITO` | `FAGOCITO` — partículas âmbar |
| `CITOTOXICO` | `CITOTOXICO` — partículas verdes |
| `HUMORAL` | `HUMORAL` — partículas azuis em arco |
| Cura (`CURA`) | `CURA` — bolhas verdes ascendentes |
| `SINALIZADOR`, tipos virais | `CURA` (fallback) |

`criarParticulas()` é chamado por `main.js` — `turnos.js` não chama `sprites.js` diretamente.

### 19.4 Animações de Transição de Estado

| Transição | Visual | Duração |
|---|---|---|
| OVERWORLD → BATTLE | Fade preto | 300ms |
| BATTLE → OVERWORLD | Fade preto | 300ms |
| BATTLE → DIALOGUE | Overlay imediato | 0ms |
| Qualquer → LOADING | Fade preto | 200ms |
| Capítulo N → N+1 | Iris-out + texto + iris-in | 1800ms |
| Qualquer → PAUSE | Escurecimento 75% | 150ms |

---

## 20. Regras de Implementação de IA

### 20.1 Escopo da IA em v1.0

A IA de `turnos.js` é a única IA do sistema. Não criar sistemas de IA em outros módulos.

### 20.2 Critérios de Decisão da IA (em ordem de prioridade)

1. Se HP do inimigo < 25%: priorizar ataques de alto poder ou de cura (se disponível).
2. Selecionar ataque com maior `calcularEfetividade(tipoAtaque, tipoAlivoAtivo)`.
3. Em empate de efetividade: selecionar ataque com maior `poder`.
4. Nunca selecionar ataque com `ppAtual === 0`.
5. Nunca selecionar ataques de `COORDENADOR` (sem aliados em v1.0).
6. Para VIREX_OMEGA: não aplicar mais de 2 status diferentes no mesmo turno.

### 20.3 Determinismo da IA

A IA usa RNG (`Math.random()`) apenas para desempate de velocidade e precisão de ataque. As escolhas de ataque seguem os critérios acima de forma determinística. Registrar em `historico` do `EstadoTurno` quando RNG é usado.

---

## 21. Regras de Implementação de Transições

### 21.1 Transições Atômicas

Nenhuma transição pode ser interrompida por outro evento. Durante `TRANSITION` e `LOADING`: descartar todos os eventos de gameplay recebidos.

### 21.2 Fallbacks de Transição

| Situação | Fallback |
|---|---|
| TRANSITION excede 3000ms | Pular animação; ativar estado destino imediatamente |
| LOADING excede 10000ms | → MAIN_MENU com mensagem de erro |
| Estado desconhecido | → MAIN_MENU; erro crítico registrado |

### 21.3 Sequência de Transição de Capítulo

```
capitulo.finalizarCapitulo(resultado)
→ BATTLE.FIM_BATALHA: emitir rubro:fim-batalha, rubro:xp-ganho
→ capitulos.js: processar XP → verificar evolução → rubro:evolucao (se aplicável)
→ main.js: exibir resultado (DIALOGUE)
→ TRANSITION (iris-out + texto de localização + iris-in — 1800ms)
→ OVERWORLD (novo capítulo) → rubro:capitulo-concluido
→ save (se SAVE_LOCK inativo)
```

---

## 22. Regras de Implementação de Diálogos

### 22.1 Sistema de Diálogo

Diálogos são exibidos em `#caixa-dialogo` / `#texto-dialogo` com efeito de typo (25ms/caractere por padrão, ajustável em SETTINGS).

### 22.2 Regras de Exibição

- Máximo 2 linhas de texto visíveis simultaneamente.
- Fila de diálogos com máximo de 8 mensagens — excedente descartado com `console.warn`.
- Durante batalha: diálogos de combate têm prioridade sobre falas de Prof. Imuno.
- Card de Prof. Imuno não bloqueia o combate — é overlay informativo puro (z-index 60).

### 22.3 Velocidade de Typo

| Configuração | Velocidade |
|---|---|
| Padrão | 25ms/caractere |
| Rápido | 15ms/caractere |
| Instantâneo | 0ms (exibição imediata) |

---

## 23. Regras de Implementação de Efeitos Visuais

### 23.1 Sistema de Feedback Visual

| Evento | Efeito visual | Duração |
|---|---|---|
| Dano recebido | Flash vermelho (`#FF2244`) no sprite | 100ms |
| Cura | Pulso verde (`#00FF88`) | 200ms |
| Crítico | Brilho amarelo (`#FFFF00`) | 300ms |
| Status aplicado | Névoa roxa (`#CC44FF`) | 200ms |
| Super efetivo | Texto laranja-vermelho (`#FF6600`) | Exibição de mensagem |
| Pouco efetivo | Texto cinza-azulado (`#445566`) | Exibição de mensagem |
| KO | Vinheta vermelha + grayscale no sprite | 600ms |
| XP ganho | Propagação ciano da esquerda para direita na barra | 300ms |

### 23.2 Anti-Poluição Visual

Conforme UI_CONTEXT §17 — regras absolutas:

- Máximo 3 elementos animados simultaneamente (exceto idle).
- Máximo 2 overlays simultâneos.
- Máximo 30 partículas no Canvas.
- Máximo 1 número flutuante de dano por frame por personagem.
- Sem gradientes decorativos — apenas funcionais (barra de HP).
- Sem `filter: shadow` ou `glow` além dos explicitamente definidos.
- Sem animações de hover estilo web.

---

## 24. Regras de Extensibilidade

### 24.1 Pontos de Extensão Autorizados

| Área | Como estender |
|---|---|
| Novo tipo biológico | Adicionar em `TIPOS` (tipos.js), em `TABELA_EFETIVIDADE`, em paleta UI_CONTEXT §2.2 e badge |
| Novo status | Adicionar em `EfeitoEspecial.tipo`, em tabela de status BATTLE_CONTEXT §6.1, com cor em UI_CONTEXT §7.3 |
| Novo personagem | Classe em `personagens.js`, sprite em `sprites.js`, ataques em `ataques.js` |
| Novo ataque | Instância em `ataques.js` com `EfeitoEspecial` se necessário |
| Novo capítulo | Entrada em `CAPITULOS` (capitulos.js) com estrutura canônica completa |
| Novo evento global | Registrar em CORE_CONTEXT §11 + EVENT_SYSTEM_CONTEXT antes de implementar |
| Novo estado de UI | Definir em GLOBAL_UI_STATES §3.1; registrar z-index em §8.2; definir transições |

### 24.2 Restrições de Extensão

- Nenhum novo ID HTML conflita com IDs canônicos de CORE_CONTEXT §14.
- Nenhum novo z-index conflita com a hierarquia de GLOBAL_UI_STATES §8.2.
- Novos eventos usam prefixo `rubro:` e seguem convenção de namespace.
- Prioridades 6 e 7 no sistema de batalha são reservadas para versões futuras.
- Toda extensão mantém a invariante: exatamente 1 estado primário ativo por instante.

---

## 25. Regras de Debugabilidade e Rastreabilidade

### 25.1 Flag de Debug

```js
const DEBUG = true; // false em produção
```

Em modo debug, todo evento `rubro:*` é logado:

```js
function logEvento(nome, payload) {
  if (DEBUG) console.log(`[RUBRO EVENT] ${nome}`, payload, `| estado: ${GameStateManager.current}`);
}
```

### 25.2 Cadeias Autorizadas

Cadeias autorizadas devem ser logadas com prefixo `[RUBRO CHAIN]`:

```js
if (DEBUG) console.log('[RUBRO CHAIN] rubro:xp-ganho → rubro:evolucao', { de, para });
```

### 25.3 Violações

Registrar `console.error` (não `console.warn`) nas situações:

- Evento emitido fora do estado autorizado.
- Evento com payload incompleto ou tipo incorreto.
- `onAnimacao` invocado com tipo não reconhecido.
- Cadeia de eventos com profundidade > 2.
- Dependência circular detectada.
- API chamada com argumentos de tipo incorreto.

### 25.4 Registro de Listeners Ativos

Em modo debug, `main.js` mantém:

```js
const _listenersAtivos = new Set();
```

Para detectar vazamentos de listeners após transições de estado.

---

## 26. Regras Anti-Drift Multiagente

### 26.1 Contrato de Identificação

Todo output de LLM começa com:

```
// LLM N — arquivo: js/nome-arquivo.js
// Documentos lidos: CORE_CONTEXT.md, [outros aplicáveis]
// Dependências: [módulos importados]
// Exporta: [lista de exports]
```

### 26.2 Verificações Pré-Entrega

Antes de finalizar qualquer output, a LLM deve verificar mentalmente:

- [ ] Todas as APIs públicas de CORE_CONTEXT §10 estão implementadas e exportadas.
- [ ] Nenhuma dependência circular foi criada.
- [ ] Nenhum evento não-registrado foi emitido ou consumido.
- [ ] Nenhum atributo base de `Personagem` é mutado diretamente.
- [ ] A fórmula de dano canônica está implementada sem modificações.
- [ ] Todos os IDs HTML canônicos são usados sem alteração.
- [ ] Todas as strings de `TIPOS` são usadas sem alteração.
- [ ] Todos os identificadores de instância canônicos são usados sem alteração.
- [ ] `main.js` não foi importado por nenhum outro módulo.
- [ ] Nenhuma biblioteca externa, framework ou TypeScript foi usado.
- [ ] Nenhum `var` foi usado — apenas `const` e `let`.
- [ ] Toda classe persistível implementa `toJSON()`.

### 26.3 Regra de Ouro

> Se não está nos documentos canônicos, não existe no projeto.
> Não inventar. Não improvisar. Consultar o documento canônico correspondente.
> Em caso de ambiguidade, escolher a interpretação mais fiel à biologia real e mais conservadora arquiteturalmente.

### 26.4 Compatibilidade Multiagente

- Nenhuma LLM altera a interface de um módulo que outra LLM produz.
- Toda LLM assume que os demais módulos implementam exatamente as APIs de CORE_CONTEXT §10.
- LLM 9 (`main.js`) é a única que integra todos os módulos — as demais LLMs não devem antecipar como `main.js` usará suas APIs além do que está documentado.
- LLM 10 (`balanceamento.js`, QA) valida a integração global — não altera APIs.

---

## 27. Glossário Operacional

| Termo | Definição no contexto de RUBRO |
|---|---|
| **Módulo** | Arquivo JS com responsabilidade única, exports explícitos, imports declarativos |
| **API pública** | Conjunto de exports de um módulo, definido canonicamente em CORE_CONTEXT §10 |
| **Contrato** | Assinatura, retorno e comportamento documentado de uma função ou método |
| **Atributo base** | Valor original de `ataque`, `defesa`, `velocidade` de `Personagem` — imutável em runtime |
| **Atributo efetivo** | Valor calculado com buffs/debuffs aplicados — usado nos cálculos, nunca persistido |
| **Cadeia autorizada** | Sequência documentada onde evento A dispara evento B como consequência direta |
| **Descarte silencioso** | Evento recebido fora do estado autorizado é ignorado sem erro |
| **Estado primário** | Estado que define o contexto principal de gameplay; exatamente 1 ativo por instante |
| **Overlay** | Estado que sobrepõe o primário sem destruí-lo |
| **Lock** | Flag booleana gerenciada exclusivamente pelo `GameStateManager` |
| **Invalidação** | Re-renderização forçada de elementos após mudança de dado subjacente |
| **Anti-drift** | Conjunto de regras que previnem divergência entre outputs de diferentes LLMs |
| **Pipeline multiagente** | Sequência ordenada de LLMs que produzem módulos interdependentes |

---

*PROMPT_IMPLEMENTADOR.md — RUBRO v1.0*
*Protocolo operacional global — governança multiagente — contrato arquitetural*
*Produzido a partir de: CORE_CONTEXT.md, UI_CONTEXT.md, GLOBAL_UI_STATES.md, EVENT_SYSTEM_CONTEXT.md, BATTLE_CONTEXT.md*
