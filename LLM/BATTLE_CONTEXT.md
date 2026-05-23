# BATTLE_CONTEXT.md — RUBRO
> Contexto especializado de combate. Leitura obrigatória para LLMs responsáveis por `dano.js`, `ataques.js`, `turnos.js`, `balanceamento.js` e IA inimiga.  
> Subordinado ao CORE_CONTEXT.md. Em caso de conflito, o CORE_CONTEXT prevalece.

---

## 1. Filosofia do Combate

| Pilar | Descrição |
|---|---|
| **Determinismo estrutural** | O resultado de um turno é determinado pelas escolhas e pelos stats — o RNG existe mas não domina. |
| **Contraparte biológica** | Cada mecânica reflete imunologia real: tipos fortes/fracos = especificidade imune; status = patologia celular. |
| **Progressão estratificada** | Early game: atrito simples. Mid game: gerenciamento de PP e status. Late game: sinergias de time + tipos. |
| **Ausência de loops infinitos** | Toda condição de status tem limite de turnos ou cura forçada. Clones têm cap. Buffs têm cap. |
| **Transparência ao jogador** | Todo dano, efetividade e status deve gerar mensagem via `onMensagem()` antes de qualquer animação. |

---

## 2. Fluxo Completo de Batalha

```
iniciarBatalha(timeJogador, inimigo)
  │
  ▼
FASE: ESCOLHA_ACAO
  ├─ Jogador seleciona: ATACAR | ITEM | TROCAR | FUGIR
  └─ IA calcula: calcularAcaoIA(inimigo, timeJogador)
  │
  ▼
FASE: EXECUCAO
  ├─ Resolver prioridades (ver §4)
  ├─ Turno 1 (quem vai primeiro)
  │   ├─ Verificar precisão (ataque.precisao vs Math.random()*100)
  │   ├─ Se HIT: calcularDano() → aplicarDano()
  │   │   ├─ Disparar rubro:status-aplicado se efeitoEspecial ativou
  │   │   └─ Verificar se alvo KO → rubro:personagem-ko
  │   └─ Se MISS: mensagem "Errou!"
  ├─ Verificar fim de batalha após cada sub-turno
  └─ Turno 2 (quem vai segundo — se ainda vivo)
  │
  ▼
FASE: FIM_TURNO
  ├─ aplicarEfeitosStatus() em AMBOS (jogador primeiro, depois inimigo)
  ├─ Decrementar contadores de buff/debuff
  ├─ Verificar fim de batalha novamente
  └─ Incrementar turnoAtual
  │
  ▼
FASE: ESCOLHA_ACAO (próximo turno) ou FIM_BATALHA
```

**Regra:** `verificarFimBatalha()` é chamado após cada ação individual que causa dano ou KO, não apenas ao fim do turno completo.

---

## 3. Ordem de Execução dos Turnos

### 3.1 Resolução de Prioridade

```
Prioridade 1: TROCAR personagem (sempre primeiro, sem custo de turno de ataque)
Prioridade 2: FUGIR (sempre segundo)
Prioridade 3: Ataques com flag prioridade=true (reservado — não implementado v1.0)
Prioridade 4: Ataques normais → ordenados por velocidade (ver §4)
Prioridade 5: ITEM (executado antes do ataque do turno do jogador)
```

### 3.2 Empate de Velocidade

Se `atacante.velocidade === inimigo.velocidade`:
- Usar `Math.random() < 0.5` para determinar quem age primeiro.
- Resultado deve ser registrado em `historico` do `EstadoTurno`.

### 3.3 Ação de FUGIR

- Somente disponível fora de batalhas de **BOSS** (`tipo === 'BOSS'` no Capítulo).
- Sempre bem-sucedida em batalhas normais.
- Emite `rubro:fim-batalha` com `{ resultado: 'FUGA' }` — `main.js` trata como derrota não-canônica (sem penalidade de XP).
- Registrar `'FUGA'` em `historico`.

---

## 4. Regras de Velocidade

- `velocidade` é atributo direto do `Personagem` (ver CORE_CONTEXT §6.1).
- Agente com maior `velocidade` ataca primeiro **dentro do mesmo nível de prioridade**.
- Status `SUPRIMIDO` reduz velocidade: aplicar multiplicador `0.5` sobre `velocidade` base durante os turnos ativos.
- Buff de velocidade via `aplicarBuff(personagem, 'velocidade', mult, turnos)` empilha multiplicativamente com debuffs (ver §7).
- A velocidade efetiva é calculada **no momento da ordenação** do turno, não no momento da escolha.

```
velocidadeEfetiva = velocidade × Π(multiplicadores ativos)
```

---

## 5. Regras de Prioridade

| Ação | Prioridade Numérica | Observação |
|---|---|---|
| Trocar personagem | 10 | Executa antes de qualquer ataque |
| Usar item | 8 | Executa antes do ataque do próprio turno |
| Fugir | 9 | Executa antes de qualquer ataque; falha em BOSS |
| Ataque normal | 5 | Ordenado por velocidade efetiva |
| Efeito de status (fim de turno) | 0 | Sempre após todos os ataques |

**Nota:** Prioridades 6 e 7 estão reservadas para versões futuras (ataques de prioridade, contra-ataques). Não implementar em v1.0.

---

## 6. Regras de Status

### 6.1 Tabela Canônica de Status

| Status | Fonte (EfeitoEspecial.tipo) | Duração padrão | Efeito mecânico | Cumulativo? |
|---|---|---|---|---|
| `INFECTADO` | `'INFECTADO'` | `efeitoEspecial.turnos` | −6 HP por turno (fim de turno) | Não |
| `ENVENENADO` | `'VENENO'` | Indefinida (até cura) | −(turnoAtivo × 2) HP crescente | Não |
| `INFLAMADO` | `'INFLAMADO'` | `efeitoEspecial.turnos` | DEF efetiva × 0.8 (sem dano direto) | Não |
| `PARALISIA` | `'PARALISIA'` | `efeitoEspecial.turnos` | 25% chance de não agir no turno | Não |
| `SUPRIMIDO` | `'SUPRIMIDO'` | `efeitoEspecial.turnos` | ATK × 0.75, SPD × 0.5 | Não |
| `MARCA_ANTICORPO` | `'MARCA_ANTICORPO'` | `efeitoEspecial.turnos` | Dano recebido × 2.0 | Não |
| `MULTIPLICANDO` | `'CLONE'` | Especial (ver §6.2) | +1 clone inimigo por turno | Não |

### 6.2 Regras Gerais de Status

- Um personagem só pode ter **um** `statusAtivo` por vez. Novo status sobrescreve o anterior **se `chance` for satisfeita**.
- `statusAtivo` é `null` ou uma String do conjunto acima.
- `aplicarStatus(s)` em `Personagem` define `statusAtivo = s` e deve disparar `rubro:status-aplicado`.
- `removerStatus()` define `statusAtivo = null` — usado por itens de cura de status.
- Status de inimigos são gerenciados pelo mesmo sistema — não há distinção de API.

### 6.3 MULTIPLICANDO — Regras Especiais de Clone

- Exclusivo da IA inimiga (nunca aplicável a agentes do jogador).
- Cap máximo: **3 clones simultâneos** (para evitar snowball).
- Cada clone é uma instância simplificada de `Virus` com HP = 20% do HP base do inimigo principal.
- Clones não possuem `statusAtivo`, não usam ataques especiais, causam dano fixo de `5` por ataque.
- Ao KO de um clone: emitir `rubro:personagem-ko` com nome `"Clone"`.
- Ao KO do inimigo principal: todos os clones são removidos automaticamente.
- `GerenciadorTurnos` deve manter lista `_clonesAtivos: []` internamente.

### 6.4 Paralisia — Regra de Execução

```
Se statusAtivo === 'PARALISIA' no turno de ação do personagem:
  roll = Math.random()
  if (roll < 0.25): personagem não age — mensagem "Paralisado! Não conseguiu agir."
  else: age normalmente
```

### 6.5 Cura de Status via Ataque

- `EfeitoEspecial.tipo === 'CURA'`: restaura HP. Não remove `statusAtivo`.
- Para remover status: apenas itens (v1.0) ou habilidade específica de `CITO` (Sinalizador).

---

## 7. Regras de Buffs e Debuffs

### 7.1 Aplicação

```js
aplicarBuff(personagem, atributo, multiplicador, turnos)
```

- `atributo`: `'ataque'` | `'defesa'` | `'velocidade'`
- `multiplicador`: ex. `1.5` (buff +50%) ou `0.75` (debuff −25%)
- `turnos`: número de turnos restantes

### 7.2 Empilhamento

- Múltiplos buffs sobre o mesmo atributo se multiplicam entre si:
  ```
  valorEfetivo = valorBase × mult1 × mult2 × ...
  ```
- **Cap máximo de buff:** `× 3.0` sobre o valor base (sem exceções).
- **Cap mínimo de debuff:** `× 0.25` sobre o valor base.
- Buffs/debuffs são rastreados em lista interna por `dano.js` (ou `turnos.js`), não em `Personagem.ataque` diretamente — o atributo base do personagem nunca é mutado.

### 7.3 Decrementação

- Ao final de cada `FIM_TURNO`: decrementar todos os contadores de buff/debuff.
- Quando `turnos === 0`: remover o modificador.
- Não emitir evento para expiração de buff (apenas para aplicação).

### 7.4 BUFF de tipo COORDENADOR

- `COORDENADOR` aplica buffs a aliados, não dano a inimigos (ver tabela de efetividade CORE_CONTEXT §7).
- Ataque de categoria `'STATUS'` com `EfeitoEspecial.tipo === 'BUFF_ATK'` ou similar aplica sobre o personagem ativo do time do jogador.
- A IA nunca seleciona ataques de COORDENADOR contra o jogador (pois são buffs de aliado — inimigo não tem aliados em v1.0).

---

## 8. Fórmulas Secundárias

### 8.1 Fórmula de Dano (canônica — CORE_CONTEXT §9)

```
Dano = ((2×nivel/5 + 2) × poder × ataque / defesa / 50 + 2)
       × efetividade × critico × aleatoriedade
```

- `efetividade`: `calcularEfetividade(tipoAtaque, tipoAlvo)` → `2.0 | 1.0 | 0.5 | 0.0`
- `critico`: `calcularCritico()` → `1.5` (p=6.25%) | `1.0`
- `aleatoriedade`: `calcularAleatoriedade()` → `[0.85, 1.0]`

**Aplicação de modificadores de buff/status sobre fórmula:**

```
ataque_efetivo  = atacante.ataque  × Π(buffs_atk_atacante) × fator_SUPRIMIDO
defesa_efetiva  = alvo.defesa      × Π(buffs_def_alvo)      × fator_INFLAMADO
```

- `fator_SUPRIMIDO` (sobre atacante): `0.75` se `statusAtivo === 'SUPRIMIDO'`
- `fator_INFLAMADO` (sobre defesa do alvo): `0.8` se `statusAtivo === 'INFLAMADO'`
- `fator_MARCA_ANTICORPO` (multiplicador final pós-fórmula): `× 2.0` se alvo tem `MARCA_ANTICORPO`

**Ordem de multiplicação:**

```
Dano base (fórmula) → × efetividade → × critico → × aleatoriedade → × MARCA_ANTICORPO → arredondar para inteiro (Math.floor)
```

### 8.2 Dano de Status por Turno

```
INFECTADO:  dano = 6 (fixo)
ENVENENADO: dano = turnoAtivo × 2   (turnoAtivo = turnos que o personagem está envenenado, começa em 1)
```

- `calcularDanoStatus(personagem)` retorna o valor inteiro.
- HP não pode ir abaixo de `0` via dano de status — `estaVivo()` verifica após cada aplicação.

### 8.3 Cura

```
calcularCura(personagem, valor) → Math.min(personagem.hpMax, personagem.hp + valor)
```

- Nunca ultrapassa `hpMax`.
- Retorna o novo HP (não aplica — `Personagem.curar(v)` aplica).

### 8.4 Cálculo de Precisão

```
hit = Math.random() * 100 < ataque.precisao
```

- Avaliado antes de qualquer cálculo de dano.
- Se `false`: mensagem "Errou! [NomePersonagem] errou o ataque."
- PP é **consumido mesmo em caso de erro**.

### 8.5 Cálculo de XP Recebido

```
xpRecebido = DROPS_XP_INIMIGOS[inimigo.nome] × (1 + 0.1 × (inimigo.nivel - personagem.nivel))
```

- Mínimo: `1 XP`.
- Distribuído somente ao personagem ativo no momento do KO do inimigo.
- `rubro:xp-ganho` é emitido por `turnos.js`.

### 8.6 Cálculo de Stats por Nível (delegado a `balanceamento.js`)

```
calcularStatsNivel(personagem, nivel) → { hp, ataque, defesa, velocidade }
```

- Chamado por `personagens.js` ao evoluir ou subir de nível.
- `turnos.js` nunca chama `balanceamento.js` diretamente — passa por `AgentImune.ganharXP()`.

---

## 9. IA Inimiga

### 9.1 Estrutura de Decisão

`calcularAcaoIA(inimigo, timeJogador)` → `{ tipo: 'ATAQUE', indexAtaque: Number }`

A IA nunca usa ITEM, TROCAR ou FUGIR (v1.0). Retorna sempre um índice de ataque válido.

### 9.2 Algoritmo de Seleção de Ataque

```
1. Filtrar ataques com PP > 0.
2. Se nenhum ataque com PP: usar ataque índice 0 (Luta básica — tratado como poder=30, sem efeito).
3. Pontuar cada ataque candidato:
   score = poder × efetividade(tipoAtaque, tipoAlvo) × fator_categoria × fator_status
4. Adicionar ruído: score += Math.random() * 10  (evita determinismo total)
5. Selecionar ataque com maior score.
```

**Fatores de pontuação:**

| Condição | Fator |
|---|---|
| `efetividade === 2.0` | × 2.0 (strong bonus) |
| `efetividade === 0.5` | × 0.5 (penalidade) |
| `efetividade === 0.0` | score = 0 (nunca seleciona) |
| Ataque `'STATUS'` | × 1.2 se alvo não tem status ativo, × 0.3 se já tem |
| `MULTI_HIT` | × 1.3 (bônus agressivo) |
| HP inimigo < 30% | priorizar ataques de maior poder (+20 bonus fixo) |
| Alvo tem `MARCA_ANTICORPO` | priorizar qualquer ataque de dano (+15 bonus fixo) |

### 9.3 Comportamento por Estágio de Vírus

| Vírus | Tendência | Notas |
|---|---|---|
| `VIRU_PRIME` | Agressiva simples | Sempre maior poder disponível |
| `REPLICATUS` | Agressiva com status | Prioriza aplicar `INFECTADO` |
| `TOXICUS` | Envenenamento prioritário | Prioriza `VENENO`; recua se HP < 40% |
| `MUTAGEN` | Adaptativa | Troca foco se efetividade < 1.0 |
| `NECROTICUS` | Clone + pressão | Usa `CLONE` nos primeiros 3 turnos obrigatoriamente se disponível |
| `VIREX_OMEGA` | Híbrida avançada | Rotaciona entre status → dano → clone; rescore a cada turno |

### 9.4 Restrições da IA

- Nunca seleciona ataques de tipo COORDENADOR (são buffs de aliado — inimigo não tem aliados).
- Nunca aplica status que o alvo já possui (score = 0 para esse ataque).
- Nunca usa ataque com `precisao < 50` se HP próprio < 20% (conserva PP).

---

## 10. Regras de PP

- Cada ataque possui `ppMax` e `ppAtual` (CORE_CONTEXT §6.2).
- `gastarPP()` decrementa `ppAtual` em 1. Deve ser chamado **antes** da resolução de dano.
- `temPP()` retorna `ppAtual > 0`.
- PP é consumido mesmo em caso de erro de precisão.
- PP é **por instância de ataque**, não compartilhado entre personagens.
- Se todos os ataques de um personagem têm `ppAtual === 0`: usar "Ataque Básico" (ver §9.2, passo 2) — implementar em `turnos.js` como fallback interno.
- PP é restaurado apenas por **item específico** (v1.0) ou ao fim de batalha (restauração completa de PP ao vencer).
- **PP não é salvo entre batalhas** — cada batalha começa com `ppAtual = ppMax` para todos os agentes.

**Restauração de PP pós-batalha:**
```
Em verificarFimBatalha() resultado === 'VITORIA':
  Para cada personagem em timeJogador:
    Para cada ataque em personagem.ataques:
      ataque.ppAtual = ataque.ppMax
```

---

## 11. Regras de Troca de Personagem

### 11.1 Custo de Troca

- Trocar personagem consome o turno do jogador (prioridade 10 — age antes do inimigo).
- O personagem que entrou **não age** no turno em que foi trocado.
- O personagem que saiu **não recebe dano de status** no turno de saída.

### 11.2 Restrições de Troca

- Não é possível trocar para o personagem ativo.
- Não é possível trocar para um personagem com `hp <= 0`.
- Em batalhas de BOSS: troca é permitida (sem restrição adicional).
- Troca forçada (após KO do personagem ativo): jogador deve escolher imediatamente — input bloqueado até escolha via `rubro:input-desativado` / `rubro:input-ativado`.

### 11.3 Evento de Troca

```js
document.dispatchEvent(new CustomEvent('rubro:trocar-personagem', { detail: { index: Number } }))
```

- Emitido por `main.js` (input do jogador).
- Consumido por `turnos.js` via `jogadorEscolheuTrocar(indexPersonagem)`.
- `turnos.js` valida a troca antes de executar (personagem deve estar vivo e diferente do ativo).

### 11.4 Troca Forçada Pós-KO

```
Fluxo:
  rubro:personagem-ko → main.js desativa input regular
  main.js mostra seleção de personagem (apenas vivos)
  Jogador seleciona → rubro:trocar-personagem
  turnos.js recebe → atualiza personagemAtivo
  main.js reativa input → continua com ESCOLHA_ACAO do próximo turno
```

---

## 12. Condições de Vitória e Derrota

### 12.1 Vitória

```
Condição: inimigo.hp <= 0
  └─ verificarFimBatalha() → 'VITORIA'
  └─ Emitir rubro:fim-batalha { resultado: 'VITORIA' }
  └─ Restaurar PP de todos os agentes vivos
  └─ Emitir rubro:xp-ganho para personagem ativo
  └─ Não emitir para personagens KO
```

### 12.2 Derrota

```
Condição: todos os personagens em timeJogador com hp <= 0
  └─ verificarFimBatalha() → 'DERROTA'
  └─ Emitir rubro:fim-batalha { resultado: 'DERROTA' }
  └─ main.js redireciona para tela de game over
  └─ Save não é sobrescrito (jogador pode recomeçar o capítulo)
```

### 12.3 Fuga

```
Condição: jogadorEscolheuFugir() + batalha não é BOSS
  └─ verificarFimBatalha() → não chamado — turnos.js emite diretamente
  └─ rubro:fim-batalha { resultado: 'FUGA' }
  └─ Sem XP, sem PP restaurado
```

### 12.4 Verificação Sequencial

```
verificarFimBatalha():
  1. Se inimigo.hp <= 0 → return 'VITORIA'
  2. Se todos timeJogador[i].hp <= 0 → return 'DERROTA'
  3. return null
```

Chamado após: cada `aplicarDano()`, cada `calcularDanoStatus()`.

---

## 13. Regras de Crítico

```js
calcularCritico() → 1.5 | 1.0
```

- Probabilidade fixa: `6.25%` (`Math.random() < 0.0625`).
- Crítico **ignora debuffs de defesa** do atacante? Não — v1.0 não implementa esse caso especial.
- Crítico **não é afetado** por status ou buffs.
- Mensagem obrigatória ao crítico: `"Golpe crítico!"` via `onMensagem()`.
- Crítico sobre ataque de categoria `'STATUS'`: ignorar multiplicador (crítico não se aplica a ataques de status).

```
Se ataque.categoria === 'STATUS': calcularCritico() → sempre 1.0
```

---

## 14. Regras de RNG

### 14.1 Fonte de Aleatoriedade

- Única fonte: `Math.random()` nativo — sem seed, sem wrapper.
- Não criar classe `RNG` customizada em v1.0.

### 14.2 Pontos de RNG no Sistema

| Ponto | Fórmula | Uso |
|---|---|---|
| Aleatoriedade de dano | `Math.random() * 0.15 + 0.85` | Multiplicador `[0.85, 1.0]` |
| Crítico | `Math.random() < 0.0625` | Bool → 1.5 ou 1.0 |
| Precisão | `Math.random() * 100 < precisao` | Bool → hit ou miss |
| Efeito especial | `Math.random() * 100 < efeitoEspecial.chance` | Bool → ativa ou não |
| Empate de velocidade | `Math.random() < 0.5` | Bool → quem age primeiro |
| Paralisia | `Math.random() < 0.25` | Bool → age ou não |
| Ruído IA | `Math.random() * 10` | Float → score noise |

### 14.3 Ordem de Resolução de RNG por Turno

```
1. Paralisia (antes de gastar PP)
2. Precisão (antes de gastar PP — se errou, PP gasto, sem dano)
   ↳ Correção: PP gasto ANTES da checagem de precisão
3. Dano: aleatoriedade → crítico
4. Efeito especial (após dano)
5. Clone / turnoAtivo de status (fim de turno)
```

### 14.4 Anti-Exploit de RNG

- Nenhum sistema salva o resultado de `Math.random()` para reutilizar.
- Cada roll é independente e descartado após uso.
- Não há "lock" de semente entre batalhas.

---

## 15. Edge Cases

| Situação | Comportamento Esperado |
|---|---|
| Dano calculado < 1 | Mínimo de `1` (nunca `0` exceto imunidade total `efetividade === 0.0`) |
| `efetividade === 0.0` | Dano = 0, mensagem "Sem efeito!", não emitir `rubro:status-aplicado` |
| Personagem KO tenta agir | `turnos.js` verifica `estaVivo()` antes de executar — nunca age |
| Status aplicado a alvo com status existente | Sobrescreve; reseta contador para `efeitoEspecial.turnos` do novo status |
| PP chega a 0 durante batalha | Usar Ataque Básico (poder=30, precisao=100, sem efeito, sem tipo — efetividade = 1.0) |
| Clone tenta atacar personagem KO | Redirecionar ataque para próximo personagem vivo; se nenhum, emitir DERROTA |
| `calcularAcaoIA` chamado sem ataques com PP | Retornar `{ tipo: 'ATAQUE', indexAtaque: -1 }` — `turnos.js` usa Ataque Básico |
| VIREX_OMEGA com todos clones cap=3 ativos | Ignorar efeito `CLONE` naquele turno; IA reseleciona sem esse ataque |
| Troca para personagem com HP = 1 | Válida — `estaVivo()` retorna `true` para `hp >= 1` |
| Buff aplicado além do cap 3.0× | Clipar: `Math.min(valorEfetivo, valorBase × 3.0)` |
| Debuff além do mínimo 0.25× | Clipar: `Math.max(valorEfetivo, valorBase × 0.25)` |
| XP negativo calculado (nível inimigo muito baixo) | Mínimo de `1 XP` |
| INFECTADO + ENVENENADO simultâneo | Apenas o status mais recente é `statusAtivo` — nunca dois ao mesmo tempo |
| Fim de batalha durante troca forçada | Emitir `rubro:fim-batalha` imediatamente; cancelar seleção de troca |

---

## 16. Regras de Balanceamento

### 16.1 Curva de Stats

- Delegada a `balanceamento.js` via `calcularStatsNivel(personagem, nivel)`.
- `turnos.js` e `dano.js` nunca interpolam stats — usam os valores já calculados em `Personagem`.
- A curva deve garantir que nenhum agente de nível 1 possa OHKO um inimigo de mesmo nível.

### 16.2 Janelas de Nível por Capítulo

| Capítulo | Inimigo | Nível Sugerido do Inimigo | Nível Esperado do Jogador |
|---|---|---|---|
| 1 | VIRU_PRIME | 5 | 3–5 |
| 2 | REPLICATUS | 10 | 8–12 |
| 3 | TOXICUS | 15 | 13–17 |
| 4 | MUTAGEN | 20 | 18–22 |
| 5 | NECROTICUS | 28 | 24–30 |
| 7 (BOSS) | VIREX_OMEGA | 40 | 35–42 |

### 16.3 Regras Anti-Snowball

- XP de inimigos reduzido progressivamente quando `inimigo.nivel < personagem.nivel - 5`: aplicar fator `0.5`.
- Buff cap × 3.0 e debuff floor × 0.25 (ver §7.2).
- Clone cap = 3 (ver §6.3).
- VIREX_OMEGA não pode aplicar mais de 2 status diferentes no mesmo turno.

### 16.4 Regras de PP por Categoria de Batalha

| Tipo de Batalha | Restauração de PP pré-batalha |
|---|---|
| Normal (entre capítulos) | Completa |
| BOSS | Completa (uma única vez ao entrar no capítulo BOSS) |
| Sequência sem save | PP persiste do combate anterior — não restaurado |

**Nota:** v1.0 não implementa sequências sem save. Toda batalha começa com PP cheio.

---

## 17. Guidelines Matemáticas para Implementação

### 17.1 Tipos de Retorno Esperados

| Função | Tipo de retorno | Arredondamento |
|---|---|---|
| `calcularDano()` → `danoFinal` | `Number` inteiro | `Math.floor` no resultado final |
| `calcularDanoStatus()` | `Number` inteiro | Sem arredondamento necessário (valores fixos) |
| `calcularCura()` | `Number` inteiro | `Math.floor` |
| `calcularAleatoriedade()` | `Number` float | Sem arredondamento |
| `calcularCritico()` | `Number` — `1.5` ou `1.0` | N/A |
| `calcularEfetividade()` | `Number` — `2.0 | 1.0 | 0.5 | 0.0` | N/A |

### 17.2 Ordem de Operações (dano)

```
1. ataque_efetivo = atacante.ataque × buffs × fator_SUPRIMIDO
2. defesa_efetiva = alvo.defesa × buffs × fator_INFLAMADO
3. base = (2×nivel/5 + 2) × poder × ataque_efetivo / defesa_efetiva / 50 + 2
4. comEfetividade = base × efetividade
5. comCritico = comEfetividade × critico
6. comRNG = comCritico × aleatoriedade
7. comMarca = comRNG × (alvo.statusAtivo === 'MARCA_ANTICORPO' ? 2.0 : 1.0)
8. danoFinal = Math.floor(comMarca)
9. danoFinal = Math.max(1, danoFinal)   ← exceto efetividade === 0.0
```

### 17.3 Limites de Segurança

- HP nunca negativo: `personagem.hp = Math.max(0, personagem.hp - dano)`
- HP nunca acima de hpMax: `personagem.hp = Math.min(personagem.hpMax, personagem.hp + cura)`
- Atributo efetivo nunca negativo: `Math.max(1, valorEfetivo)`

---

## 18. Fluxo de Eventos por Ação

### 18.1 Ataque com Hit

```
gastarPP()
→ calcularDano() [interno]
→ aplicarDano(alvo, danoFinal)
→ alvo.receberDano(danoFinal)
→ onMensagem(`${atacante.nome} usou ${ataque.nome}!`)
→ onAnimacao('ATACAR')                     [sprites.js]
→ onMensagem(getMensagemEfetividade(...))   [se efetividade ≠ 1.0]
→ onMensagem("Golpe crítico!")             [se crítico]
→ atualizarBarrasHP()                      [main.js — via callback ou evento]
→ [se efeitoEspecial ativou]:
    aplicarStatus(s) → rubro:status-aplicado
    onMensagem(`${alvo.nome} foi ${status}!`)
→ [se alvo KO]: rubro:personagem-ko
```

### 18.2 Ataque com Miss

```
gastarPP()
→ onMensagem(`${atacante.nome} usou ${ataque.nome}!`)
→ onAnimacao('ATACAR')
→ onMensagem(`Errou! O ataque não acertou.`)
```

### 18.3 Efeitos de Status (FIM_TURNO)

```
Para cada personagem vivo (jogador, depois inimigo):
  calcularDanoStatus(personagem)
  → personagem.receberDano(dano)
  → onMensagem(`${personagem.nome} sofreu ${dano} de ${statusAtivo}!`)
  → verificarFimBatalha()
  Decrementar contadores de buff/debuff
  Decrementar turno de status (se aplicável)
  Se status expirou: removerStatus() — sem evento
```

### 18.4 KO

```
rubro:personagem-ko { personagem: nome }
→ main.js: onAnimacao('KO') para sprite correto
→ Se KO é do inimigo: rubro:fim-batalha { resultado: 'VITORIA' }
→ Se KO é de aliado e ainda há vivos: troca forçada (ver §11.4)
→ Se KO é de aliado e todos KO: rubro:fim-batalha { resultado: 'DERROTA' }
```

---

## 19. Integração entre Módulos

### 19.1 Dependências de `dano.js`

```
dano.js importa:
  ← tipos.js: calcularEfetividade(), getMensagemEfetividade()
  ← personagens.js: Personagem (tipos para verificação de status)
  ← ataques.js: Ataque (acesso a .poder, .categoria, .efeitoEspecial)
```

`dano.js` **não importa** `turnos.js` nem `main.js`.

### 19.2 Dependências de `turnos.js`

```
turnos.js importa:
  ← dano.js: calcularDano(), aplicarDano(), calcularDanoStatus(), aplicarBuff()
  ← personagens.js: Personagem, TIME_INICIAL (referência), instâncias via argumento
  ← ataques.js: Ataque (para validar PP e acesso a .usar())
```

`turnos.js` **não importa** `balanceamento.js` diretamente — XP é ganho via `AgentImune.ganharXP()`.

### 19.3 Callbacks de `GerenciadorTurnos`

```js
// Configuração obrigatória pelo main.js antes de iniciarBatalha():
gerenciador.onMensagem = (texto) => { /* atualiza #texto-dialogo */ }
gerenciador.onAnimacao = (tipo) => { /* dispara AnimadorSprite */ }
gerenciador.onFimBatalha = (resultado) => { /* redireciona fluxo */ }
```

Sem esses callbacks configurados, `iniciarBatalha()` deve lançar `Error('Callbacks obrigatórios não configurados')`.

### 19.4 Contrato de `calcularDano()`

```js
calcularDano(atacante, alvo, ataque)
→ {
    danoFinal: Number,       // inteiro ≥ 0
    critico: Boolean,        // true se multiplicador foi 1.5
    efetividade: Number,     // 0.0 | 0.5 | 1.0 | 2.0
    mensagens: String[]      // array de mensagens a exibir (efetividade, crítico)
  }
```

`turnos.js` itera `mensagens[]` e chama `onMensagem()` para cada uma.

### 19.5 Contrato de `aplicarDano()`

```js
aplicarDano(personagem, dano)
→ {
    novoHP: Number,
    foi_ko: Boolean
  }
```

- Chama `personagem.receberDano(dano)` internamente.
- Retorna estado pós-dano; `turnos.js` decide se emite `rubro:personagem-ko`.

---

## 20. Regras de Animação e Timing

### 20.1 Sequência de Animação por Turno

```
ESCOLHA_ACAO (aguarda input)
  → input recebido → rubro:input-desativado
  → EXECUCAO começa:
      Mensagem de ação (texto no #texto-dialogo)
      Animação ATACAR do sprite atacante (~500ms)
      Animação RECEBER_DANO do sprite alvo (~300ms)
      Atualizar barras HP (imediato após dano calculado)
      Mensagem de efetividade / crítico (~800ms pausa)
      [Se KO]: Animação KO (~600ms)
  → FIM_TURNO:
      Mensagens de status (texto)
      Atualizar barras HP
  → rubro:input-ativado (se batalha continua)
```

### 20.2 Regras de Bloqueio de Input

- `rubro:input-desativado` é emitido por `main.js` imediatamente após receber qualquer input do jogador.
- `rubro:input-ativado` é emitido por `main.js` ao fim completo do turno (incluindo animações).
- `GerenciadorTurnos` não controla input diretamente — apenas emite eventos e chama callbacks.
- Durante troca forçada (KO de aliado), o menu de troca é exibido com input ativo apenas para seleção de personagem.

### 20.3 Timing de Referência para `main.js`

| Animação | Duração sugerida |
|---|---|
| `ATACAR` | 500ms |
| `RECEBER_DANO` | 300ms |
| `KO` | 600ms |
| `IDLE` | Loop contínuo |
| Pausa entre mensagens | 800ms |
| Transição de capítulo | 1200ms |

Esses valores são sugestões para `main.js` / `sprites.js`. `turnos.js` é assíncrono mas não controla timing de animação — usa apenas callbacks.

### 20.4 Partículas e Efeitos Visuais

- `criarParticulas(tipo, x, y)` é chamado por `main.js` após resolver o tipo do ataque utilizado.
- `turnos.js` não chama `sprites.js` diretamente.
- Tipo de partícula segue o tipo do ataque: `FAGOCITO | CITOTOXICO | HUMORAL | CURA`.
- Para ataques de tipo viral ou `SINALIZADOR`: usar `CURA` como fallback de partícula.

---

*BATTLE_CONTEXT.md — RUBRO v1.0 — Documento de sistemas de combate*  
*Subordinado ao CORE_CONTEXT.md. Produzido para uso por LLMs 3, 4, 5 e 10.*
