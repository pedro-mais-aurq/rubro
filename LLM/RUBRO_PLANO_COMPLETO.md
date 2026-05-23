# RUBRO — PLANO MESTRE COMPLETO
### RPG de Turnos Biológico | Estilo Pokémon GBA | HTML/CSS/JavaScript

---

## CONTEXTO DO ARQUIVO MESTRE

Este documento é o `RUBRO_MASTER_CONTEXT.md`. Toda LLM que receber um prompt deste projeto deve ler este arquivo inteiro antes de escrever qualquer linha de código, para garantir consistência total entre os módulos.

---

## 1. VISÃO GERAL DO JOGO

| Campo | Detalhe |
|---|---|
| **Título** | RUBRO |
| **Gênero** | RPG de Turnos (estilo Pokémon GBA) |
| **Plataforma** | Web (HTML5 / CSS3 / JavaScript Vanilla) |
| **Tema** | Imunologia — batalhas dentro do corpo humano |
| **Protagonista Externo** | Bernardo (atleta de capoeira) |
| **Protagonista Interno** | O Jogador comanda o Sistema Imune de Bernardo |
| **Antagonista** | Vírus invasor e suas formas evolutivas |
| **Tom** | Drama biológico + ação + educação científica |

---

## 2. PERSONAGENS

### 2.1 Personagens do Mundo Externo (cutscenes / narrativa)

| Nome | Papel | Descrição |
|---|---|---|
| **Bernardo** | Protagonista externo | Jovem atleta de capoeira, careca, descontraído. Sofre a infecção sem saber. Sente os efeitos da guerra interna no próprio corpo. |
| **Treinador / Mestre** | NPC narrativo | Mestre de capoeira, percebe que Bernardo está mal no treino e aciona o socorro. |
| **Médico da UPA** | NPC narrativo | Médico que interna Bernardo, explica a gravidade da situação ao mundo externo. |

### 2.2 Personagens do Sistema Imune (jogáveis / aliados)

| Nome | Classe | Tipo Biológico | Papel no Jogo |
|---|---|---|---|
| **Neutro** | Neutrófile | Fagócito | Primeiro respondedor. Ataque físico alto, baixa defesa. Evolui para Neutro-Rex. |
| **Macro** | Macrófago | Fagócito/Apresentador | Tanque. Devora e apresenta antígenos. Evolui para Macro-Guardião. |
| **Natu** | Célula Natural Killer | Citotóxico | Assassino silencioso. Elimina células infectadas. Evolui para Natu-Sombra. |
| **Linfo-B** | Linfócito B | Humoral | Produtor de anticorpos. Evolui para Plasma-B (fábrica de anticorpos). |
| **Linfo-T** | Linfócito T Helper | Coordenador | Buffs para aliados, aumenta resposta imune. Evolui para T-Maestro. |
| **T-Killer** | Linfócito T Citotóxico | Citotóxico | Destrói células infectadas pelo vírus. Evolui para T-Exterminador. |
| **ANTI** | Anticorpo (IgG) | Humoral/Herói | **HERÓI FINAL.** Personagem mais poderoso. Desbloqueado no Capítulo 6. |
| **Cito** | Citocina (IL-6 / TNF) | Sinalizador | Suporte — aplica buff em aliados e debuff em vírus. Não combate diretamente. |

### 2.3 Professor Imuno (O "Professor Oak" do jogo)

| Campo | Detalhe |
|---|---|
| **Nome** | Professor Imuno (apelido: "Prof. I") |
| **Aparência** | Macrófago estilizado com jaleco branco e óculos redondos |
| **Papel** | Guia educacional. Aparece antes e depois de cada batalha para explicar a biologia real do que aconteceu. |
| **Falas** | Tom científico mas acessível. Usa analogias lúdicas. Explica: tipos de células, mecanismos de ataque, evolução viral, vacinação, etc. |
| **Capítulos** | Presente em todos os capítulos, com destaque no Capítulo 3. |

### 2.4 Vírus e Antagonistas

| Nome | Estágio | Tipo | Descrição |
|---|---|---|---|
| **Viru-Prime** | Estágio 1 | Vírus básico | Forma inicial. Esférico, simples, fraco. Tutorial. |
| **Replicatus** | Estágio 2 | Vírus replicante | Pode se dividir em batalha (cria cópias fracas de si mesmo). |
| **Toxicus** | Estágio 3 | Vírus tóxico | Libera toxinas que envenenam células do sistema imune. |
| **Mutagen** | Estágio 4 | Vírus mutante | Muda de tipo durante a batalha — ataques imunes perdem efetividade. |
| **Necroticus** | Estágio 5 | Vírus necrosante | Causa morte celular em massa. Boss do Capítulo 5. |
| **VIREX OMEGA** | Estágio 6 | Supervírus / Boss Final | Forma evolutiva máxima. Fusão de todos os mecanismos anteriores. Imortal sem anticorpo específico. |

---

## 3. SISTEMA DE TIPOS BIOLÓGICOS (Equivalente aos Tipos Pokémon)

### 3.1 Tipos do Sistema Imune

| Tipo | Descrição | Forte Contra | Fraco Contra |
|---|---|---|---|
| **Fagócito** | Engole e destrói patógenos | Vírus extracelular, Bactérias | Vírus intracelular, Toxinas |
| **Citotóxico** | Mata células infectadas | Vírus intracelular, Células tumorais | Vírus extracelular, Toxinas |
| **Humoral** | Anticorpos e resposta B | Todos os vírus (com antígeno reconhecido) | Vírus mutante (muda antígeno) |
| **Coordenador** | Buffs e sinalização | Amplia a efetividade de aliados | Vulnerável a ataques diretos |
| **Sinalizador** | Citocinas e inflamação | Aumenta inflamação (dano de área) | Autoinflamação (dano ao host) |

### 3.2 Tabela de Efetividade (Vírus × Defesa)

| Tipo do Ataque \ Alvo | Vírus Extracelular | Vírus Intracelular | Vírus Mutante | Toxinas |
|---|---|---|---|---|
| **Fagócito** | 2x | 0.5x | 1x | 0.5x |
| **Citotóxico** | 0.5x | 2x | 1x | 0.5x |
| **Humoral** | 2x | 1x | 0.5x | 2x |
| **Coordenador** | — (buff) | — (buff) | — (buff) | — (buff) |
| **Sinalizador** | 1x | 1x | 1x | 0.5x |

---

## 4. SISTEMA DE COMBATE

### 4.1 Estrutura da Tela de Batalha

```
┌─────────────────────────────────────────────────────────┐
│  [NOME DO VÍRUS]  Nv.XX         HP: ████████░░  XX/XX   │
│                  [SPRITE VÍRUS INIMIGO]                  │
│                                                          │
│  [SPRITE ALIADO]                                         │
│  [NOME DO ALIADO] Nv.XX         HP: ████████░░  XX/XX   │
├─────────────────────────────────────────────────────────┤
│  [CAIXA DE DIÁLOGO / MENSAGEM DE AÇÃO]                  │
├─────────────────────────────────────────────────────────┤
│  [ LUTAR ]   [ ITENS ]   [ TROCAR ]   [ FUGIR ]         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Menu de Luta (4 ataques por personagem)

Cada personagem tem 4 ataques com:
- Nome do ataque (ex: "Fagocitose", "Explosão Oxidativa")
- Tipo biológico
- Poder (base)
- PP (usos limitados)
- Efeito especial (opcional: veneno, paralisação, buff)

### 4.3 Fórmula de Dano

```
Dano = ((2 × Nível / 5 + 2) × Poder × Ataque / Defesa / 50 + 2)
         × Efetividade (2x / 1x / 0.5x)
         × Crítico (1.5x com 6.25% de chance)
         × Aleatoriedade (0.85 a 1.0)
```

### 4.4 Status e Efeitos

| Status | Efeito | Causado por |
|---|---|---|
| **Infectado** | Perde HP a cada turno | Vírus intracelular |
| **Envenenado (Toxina)** | Perde HP crescente | Toxicus |
| **Inflamado** | -DEF, +ATK | Sinalizadores |
| **Suprimido** | -ATK, -SPD | Ataques do vírus |
| **Anticorpo-marcado** | Vulnerável a TODOS os ataques | Linfo-B / ANTI |
| **Multiplicando** | +1 clone inimigo por turno | Replicatus |

### 4.5 Sistema de Evolução

| Condição | Personagem | Evolui Para |
|---|---|---|
| Nível 16 | Neutro | Neutro-Rex |
| Nível 20 | Macro | Macro-Guardião |
| Nível 18 | Natu | Natu-Sombra |
| Nível 25 | Linfo-B | Plasma-B |
| Nível 22 | Linfo-T | T-Maestro |
| Nível 24 | T-Killer | T-Exterminador |
| Evento (Cap.6) | Linfo-B evoluído + antígeno coletado | **ANTI (Anticorpo IgG)** |

---

## 5. ESTRUTURA DE CAPÍTULOS

---

### CAPÍTULO 0 — PRÓLOGO: A MANHÃ DE BERNARDO
**Tipo:** Cutscene narrativa (sem batalha)
**Local:** Quarto e banheiro de Bernardo

**Narrativa:**
Bernardo acorda numa manhã comum. Música leve, ambiente de quarto de atleta. Ele se levanta, vai ao banheiro, entra no chuveiro. Durante o banho, pega o prestobarba e raspa sua cabeça careca. Uma pequeníssima fissura na pele. Sem dor. Sem sangue visível. Ele nem nota.

Corte para: câmera microscópica. Zoom brutal na fissura da pele. Vírus-Prime entra pela ferida. Texto na tela:

> *"Uma batalha que Bernardo nunca verá… está prestes a começar."*

**Mecânica:** Nenhuma batalha. Apenas narrativa visual com caixas de diálogo estilo Pokémon GBA. Introdução do tom do jogo.

---

### CAPÍTULO 1 — INFECÇÃO ZERO: O INVASOR CHEGA
**Tipo:** Tutorial de batalha
**Local:** Derme — camada superficial da pele de Bernardo
**Inimigo:** Viru-Prime (Nível 3)
**Personagem disponível:** Neutro (Nível 5)

**Narrativa:**
Viru-Prime se aloja em uma célula da pele. O sistema imune de Bernardo ainda não sabe o que está por vir. Neutro é o primeiro a chegar — rápido, agressivo, pouco estratégico. O Professor Imuno aparece pela primeira vez:

> *"Olá, Agente! Sou o Professor Imuno, macrófago sênior do sistema de defesa de Bernardo. Vejo que temos um invasor. Vou te ensinar como funciona este campo de batalha…"*

**Tutorial cobre:**
- Sistema de tipos
- Barra de HP
- Ataques e PP
- Super efetivo / pouco efetivo
- Fugir (disponível no tutorial)

**Boss:** Viru-Prime
**Recompensa:** Neutro sobe para nível 7. Macro se junta ao time.

**Falas do Prof. Imuno após batalha:**
> *"Neutrófilos são os primeiros a chegar — mas são rápidos e imprecisos. Eles agem antes mesmo de o sistema saber exatamente o que está combatendo. É a defesa inata em ação!"*

---

### CAPÍTULO 2 — A MULTIPLICAÇÃO: REPLICATUS
**Tipo:** Batalha estratégica com mecânica nova
**Local:** Tecido conjuntivo subcutâneo
**Inimigos:** Replicatus (Nível 8) + Clones (Nível 4)
**Personagens disponíveis:** Neutro, Macro

**Narrativa:**
Bernardo segue sua rotina sem perceber nada. Mas dentro de seu corpo, o vírus encontrou uma célula hospedeira perfeita e começa a se replicar em proporção alarmante. Macro detecta os antígenos e apresenta ao sistema:

> *"Sinal de multiplicação detectado. Isso é sério."*

**Mecânica nova:** Replicatus usa "Divisão Viral" toda vez que seu HP cai abaixo de 50% — cria 1 clone com HP igual a 30% do original. Clone some após 3 turnos mas pode atacar.

**Estratégia ensinada:** Usar Macro para marcar o antígeno de Replicatus com "Apresentação de Antígeno" — reduz DEF de todos os clones.

**Falas do Prof. Imuno:**
> *"Macrófagos fazem algo incrível: eles não só destroem os invasores — eles rasgam pedaços do vírus e os mostram para o resto do sistema imune! Isso é chamado de Apresentação de Antígeno. É assim que o corpo 'aprende' o inimigo."*

**Efeitos externos em Bernardo:** Primeira febre leve (37.8°C). Cutscene mostrando Bernardo coçando o pescoço distraidamente.

---

### CAPÍTULO 3 — O PROFESSOR IMUNO: AULA DE GUERRA
**Tipo:** Capítulo educacional + batalha de treinamento
**Local:** Linfonodo cervical (gânglio)
**Inimigo:** Toxicus (Nível 12)
**Personagens disponíveis:** Neutro, Macro, Natu, Linfo-T (novo)

**Narrativa:**
O sistema imune convoca uma "sessão de guerra" no linfonodo. Prof. Imuno explica cada soldado disponível com detalhes científicos reais. Este capítulo funciona como um "Centro Pokémon" educacional.

**Estrutura do Capítulo:**
1. Cena no linfonodo — células se reúnem
2. Prof. Imuno apresenta cada personagem do time com descrição biológica
3. Batalha contra Toxicus (introdução do tipo Tóxico)
4. Debriefing educacional pós-batalha

**Fichas educacionais do Prof. Imuno (exibidas em card antes da batalha):**

> **Neutrófile:**
> *"Representa 60% dos glóbulos brancos. Vive apenas de 6 a 8 horas no tecido, mas são os primeiros a chegar. Agem por fagocitose e 'explosão respiratória' — liberam radicais livres para destruir patógenos."*

> **Macrófago:**
> *"Derivado de monócitos. Pode viver meses no tecido. É ao mesmo tempo um destruidor e um mensageiro — ao apresentar antígenos via MHC-II, ele ativa Linfócitos T e inicia a resposta adaptativa."*

> **Natural Killer (Natu):**
> *"Parte da imunidade inata. Reconhece células que perderam MHC-I (marcador de 'sou normal'). Quando o vírus esconde esse marcador para fugir, a NK percebe: 'célula sem MHC-I = célula suspeita'. Ataca imediatamente."*

> **Linfócito T Helper:**
> *"O general do sistema imune. Sem ele, nem Linfócito B nem T Citotóxico funcionam bem. Produz IL-2 (interleucina) que ordena multiplicação dos soldados. Alvo preferido do HIV."*

**Boss do capítulo:** Toxicus
**Mecânica:** Toxicus aplica "Toxina Viral" que causa dano por turno. Linfo-T pode usar "Sinalização IL-6" para reduzir o dano de toxina nos aliados.

**Efeitos externos em Bernardo:** Febre de 38.5°C. Cansaço intenso. Cutscene: Bernardo acorda de manhã e se sente pesado, mas decide ir para o treino mesmo assim.

---

### CAPÍTULO 4 — O TREINO: O CORPO LUTA EM DUAS FRENTES
**Tipo:** Batalha dupla (dentro + fora)
**Local:** Corrente sanguínea + Academia de Capoeira
**Inimigo:** Mutagen (Nível 18) — vírus que muda de tipo
**Personagens disponíveis:** Neutro (pode evoluir), Macro (pode evoluir), Natu, Linfo-T, Linfo-B (novo), T-Killer (novo)

**Narrativa:**
Bernardo chega ao galpão de capoeira. O Mestre percebe que ele está pálido mas Bernardo insiste em treinar. Enquanto ele ginga e tenta aplicar golpes, dentro de seu corpo a batalha está em seu pico mais crítico.

**Mecânica dupla:** O jogo alterna entre:
- **Cena externa** (Bernardo no treino — QTE simples: pressionar tecla no ritmo do berimbau para ganhar bônus de HP para o time)
- **Batalha interna** (combate principal contra Mutagen)

**Mecânica nova — Mutagen:**
A cada 3 turnos, Mutagen usa "Deriva Antigênica" e muda seu tipo (Extracelular → Intracelular → Tóxico → volta). Isso invalida ataques que eram super efetivos. O jogador precisa adaptar o time constantemente.

**Falas do Prof. Imuno:**
> *"Isso é Deriva Antigênica — é EXATAMENTE por isso que o vírus da gripe muda todo ano. Ao alterar as proteínas da sua superfície, ele 'foge' dos anticorpos que o corpo aprendeu a combater. É o truque mais cruel da evolução viral."*

**Evento especial:** Linfo-B usa "Memorização de Antígeno" para registrar cada forma de Mutagen — reduzindo a penalidade de efetividade nas formas já vistas.

**Clímax do capítulo:** Bernardo passa mal no meio do treino. Cai no chão. O Mestre corre até ele. Cutscene dramática: ambulância, UPA, médico.

**Médico:** *"Febre de 40°C. Infecção sistêmica. Precisa ser internado imediatamente."*

**Recompensa:** Linfo-B evolui para Plasma-B. T-Killer se junta ao time.

---

### CAPÍTULO 5 — INTERNAÇÃO: A PROPORÇÃO MORTAL
**Tipo:** Batalha de boss de meio de jogo — o mais difícil até agora
**Local:** Corrente sanguínea — estado de sepse iminente
**Inimigo:** Necroticus (Nível 28) — boss de morte celular em massa
**Personagens disponíveis:** Time completo (sem ANTI ainda)

**Narrativa:**
Bernardo está na UTI. Monitores biomecanismo apitam. Médicos discutem. O vírus evoluiu para Necroticus — uma forma que causa apoptose massiva de células saudáveis e começa a destruir tecidos críticos.

**Falas do Prof. Imuno (mais sério aqui):**
> *"Agente… a situação é grave. Necroticus ativa a apoptose — o programa de morte das nossas próprias células. Não é só infecção; é o vírus usando o sistema do corpo contra si mesmo. Se não o pararmos agora, Bernardo entra em sepse."*

**Mecânica de boss — Necroticus:**
- HP muito alto (3 barras de HP sequenciais — "fases")
- **Fase 1:** Ataques normais + "Necrose em Área" (dano a todo o time)
- **Fase 2 (HP < 66%):** Aplica "Imunossupressão" — reduz ATK de todos os aliados em 30%
- **Fase 3 (HP < 33%):** Usa "Apoptose em Cascata" — elimina o aliado com MENOS HP instantaneamente por turno

**Estratégia necessária:** Usar T-Maestro para buffs constantes + Plasma-B para aplicar "Marcação de Anticorpo Primário" (reduz defesa de Necroticus) + T-Exterminador para dano máximo.

**Cutscene pós-batalha:**
Necroticus é derrotado mas o sistema imune está exausto. O Professor Imuno, pela primeira vez, parece preocupado:

> *"Fizemos o possível… mas essa forma viral é mais inteligente do que qualquer coisa que vi. Precisamos de algo que este corpo ainda nunca produziu. É hora de convocar o Criador."*

---

### CAPÍTULO 6 — O HERÓI NASCE: A CRIAÇÃO DO ANTICORPO
**Tipo:** Capítulo de narrativa + evento especial de evolução
**Local:** Medula óssea e linfonodo — centro de produção imune
**Inimigo:** Nenhum batalha (capítulo narrativo e de preparação)

**Narrativa:**
Plasma-B, após registrar os antígenos de todos os vírus enfrentados, inicia o processo mais longo e mais poderoso da resposta imune: a produção do anticorpo específico. O Prof. Imuno explica em detalhes.

**Falas do Prof. Imuno (emocionado):**
> *"O que vai acontecer agora é o milagre da imunidade adaptativa. Plasma-B coletou os fragmentos antigênicos de cada forma viral que enfrentamos. Agora… ele vai criar um anticorpo perfeito. Um soldado construído especificamente para este vírus. IgG — o anticorpo da memória imunológica. Uma vez criado, Bernardo nunca mais será vulnerável a este vírus da mesma forma."*

**Evento de evolução:**
- Cutscene longa e épica: Plasma-B se transforma em luz azul intensa
- ANTI emerge — sprite imponente, diferente de tudo que veio antes
- ANTI tem todos os dados dos inimigos anteriores incorporados em seus ataques
- Stats: o mais alto de todos os personagens do jogo

**Ficha de ANTI:**
| Atributo | Valor |
|---|---|
| Tipo | Humoral / Herói |
| HP base | 120 |
| ATK | 145 |
| DEF | 90 |
| SPD | 80 |
| Habilidade especial | "Memória Imune" — sempre super efetivo contra vírus já enfrentados |

**Ataques de ANTI:**
1. **Neutralização Total** (poder 120, Humoral) — liga ao antígeno do vírus e o imobiliza
2. **Opsonização** (poder 90, Humoral) — marca o alvo para dano duplo no próximo ataque aliado
3. **Ativação do Complemento** (poder 110, Fagócito/Humoral) — perfura a membrana viral
4. **IgG Máximo** (poder 150, Humoral) — ataque especial, 1 uso por batalha, ignora defesa

---

### CAPÍTULO 7 — VIREX OMEGA: A BATALHA FINAL
**Tipo:** Boss final épico
**Local:** Coração — a última linha de defesa
**Inimigo:** VIREX OMEGA (Nível 50) — Boss Final

**Narrativa:**
O vírus, prestes a ser destruído, concentra toda sua energia mutante e evolui uma última vez. VIREX OMEGA é uma fusão de todos os mecanismos anteriores: replicação, toxinas, mutação, necrose — tudo ao mesmo tempo. É a encarnação máxima da infecção.

Se VIREX OMEGA não for derrotado, Bernardo não resiste.

**Cutscene de abertura da batalha:**
> *Professor Imuno olha para ANTI e diz:*
> *"Este é o momento para o qual você foi criado, ANTI. O vírus colocou tudo o que tem nessa forma. E você tem algo que ele nunca terá: a memória de cada batalha que travamos. Cada aliado que caiu. Cada sacrifício que fizemos. Use isso."*

**Mecânica de VIREX OMEGA — 4 fases:**

**Fase 1 — VIREX OMEGA (Forma Replicante):**
- Cria 2 clones por turno
- Clones têm HP real (não são decorativos)
- Mecânica: eliminar os clones antes de atacar OMEGA

**Fase 2 — VIREX OMEGA (Forma Tóxica):**
- Aplica "Toxina Letal" — 20HP de dano por turno em todo o time
- ANTI tem resistência a toxinas (50% de dano)
- Mecânica: curar aliados com Linfo-T enquanto ANTI ataca

**Fase 3 — VIREX OMEGA (Forma Mutante):**
- Muda de tipo a cada 2 turnos (versão extrema de Mutagen)
- **ANTI neutraliza isso com "Memória Imune"** — mantém super efetividade
- Outros aliados ficam confusos — jogador precisa gerenciar trocas de time

**Fase 4 — VIREX OMEGA (Forma Final — Necrótica):**
- Usa "Apocalipse Viral" — dano massivo a todo o time
- ANTI usa "IgG Máximo" aqui — único ataque que ignora defesa de Omega
- Cutscene em que todos os aliados (mesmo os caídos) se somam ao ataque final

**Animação da vitória:**
Uma cascata de anticorpos IgG envolve VIREX OMEGA. Ele tenta mutar mas cada forma é bloqueada. A membrana dele colapsa. Dissolução total.

**Cutscene final:**
Corte para o hospital. Os monitores de Bernardo estabilizam. A febre cede. O médico entra e sorri:
> *"A febre quebrou. Ele vai se recuperar."*

Bernardo abre os olhos lentamente. Dentro de seu corpo, o Prof. Imuno faz um último discurso:

> *"O corpo de Bernardo nunca mais esquecerá este vírus. Cada Linfócito B de memória produzido hoje vai guardar o mapa deste inimigo por anos, talvez décadas. Se o vírus tentar voltar…"*

ANTI aparece na tela, olhando diretamente para o jogador.

> *"…ele já vai estar esperando."*

**CRÉDITOS FINAIS**

---

### EPÍLOGO — PÓS-CRÉDITOS (cena extra)
Bernardo recebe alta. Abraça o Mestre de capoeira. Ri. Volta para o treino semanas depois, mais forte.

Última cena microscópica: uma célula de memória B dormindo silenciosamente na corrente sanguínea de Bernardo. Guardando o mapa de VIREX OMEGA. Para sempre.

> *"FIM — A imunidade é a memória do corpo."*

---

## 6. ITENS

| Item | Efeito | Obtenção |
|---|---|---|
| **Soro Fisiológico** | Restaura 20HP | Comum (drop, loja) |
| **Interferon** | Cura status "Infectado" | Incomum |
| **Anti-inflamatório** | Cura "Inflamado" + restaura 10HP | Comum |
| **Plasma Enriquecido** | Restaura HP total de 1 aliado | Raro |
| **Adrenalina** | +SPD e +ATK por 3 turnos | Incomum |
| **Vacina Parcial** | Reduz dano de tipos já enfrentados em 30% | Especial (1 uso) |
| **Proteína do Complemento** | Ativa buff de "Lise Viral" — dano extra por 5 turnos | Raro |

---

## 7. MAPA DE LOCAIS (Dentro do Corpo)

| Capítulo | Local Biológico | Descrição Visual |
|---|---|---|
| 0 | Pele (epiderme) | Células escamosas, creme/rosa, textura de pele ampliada |
| 1 | Derme | Tecido conectivo vermelho, fibras de colágeno visíveis |
| 2 | Tecido subcutâneo | Células adiposas, amarelo, ambiente denso |
| 3 | Linfonodo | Esfera com interior de câmaras azuladas, células se movendo |
| 4 | Corrente sanguínea | Túnel vermelho com hemácias flutuando, urgente e dinâmico |
| 5 | Corrente sanguínea profunda | Mais escura, caótica, sinais de dano tecidual visíveis |
| 6 | Medula óssea | Ambiente dourado/âmbar, células em formação, místico |
| 7 | Coração | Câmaras cardíacas pulsando, vermelho escuro, épico |

---

## 8. TRILHA SONORA (Diretrizes)

| Cena | Estilo Musical |
|---|---|
| Cutscene de Bernardo (manhã) | Lo-fi calm, acústico |
| Batalha normal | Eletrônico ritmado, urgente (estilo Pokémon GBA remixado) |
| Boss (Necroticus) | Orquestral tenso com baixos pesados |
| Boss Final (VIREX OMEGA) | Épico sinfônico + eletrônico |
| Vitória | Fanfarra curta estilo 8-bit + acorde orgânico |
| Derrota | Descida tonal dramática |
| Capítulo 6 (criação de ANTI) | Ambiente etéreo, construção crescente |
| Créditos finais | Melodia emocional e esperançosa |

---

## 9. ORDEM DE DESENVOLVIMENTO E PROMPTS PARA LLMs

---

### LLM 1 — ENTIDADES E CLASSES DE PERSONAGENS

**Arquivo alvo:** `js/personagens.js`

**Prompt:**
```
Você está desenvolvendo o jogo RUBRO — um RPG de turnos biológico estilo Pokémon GBA em HTML/CSS/JavaScript Vanilla.

Leia o RUBRO_MASTER_CONTEXT.md antes de começar.

Sua tarefa é criar o arquivo `js/personagens.js` com:

1. Uma classe base `Personagem` com os atributos:
   - nome, nivel, hp, hpMax, ataque, defesa, velocidade, tipo, sprite (caminho da imagem), ataques[] (array de 4 ataques), statusAtivo (null ou string do status)
   - Métodos: receberDano(dano), curar(valor), aplicarStatus(status), removerStatus(), estaVivo(), toJSON()

2. Classes filhas que herdam de `Personagem`:
   - `AgentImune` (para personagens do sistema imune): adiciona experiencia, xpParaEvolucao, nivel, metodo ganharXP(xp), metodo podeEvoluir()
   - `Virus` (para inimigos): adiciona mecanismoEspecial (string descrevendo a mecânica especial do vírus), metodo ativarMecanismo()

3. Instâncias de todos os personagens do jogo conforme a tabela do MASTER_CONTEXT:
   Sistema Imune: Neutro, Macro, Natu, LinfócitoB, LinfócitoT, TKiller, ANTI, Cito
   Vírus: ViruPrime, Replicatus, Toxicus, Mutagen, Necroticus, VirexOmega
   Cada instância com stats corretos do MASTER_CONTEXT.

4. Array exportado `TIME_INICIAL = [Neutro, Macro]` e `TODOS_AGENTES = [...]`

Use JavaScript ES6+ com módulos (export/import).
Não use frameworks externos.
Comente cada classe e método com descrição biológica educacional.
```

---

### LLM 2 — SISTEMA DE TIPOS E EFETIVIDADE

**Arquivo alvo:** `js/tipos.js`

**Prompt:**
```
Você está desenvolvendo o jogo RUBRO — RPG de turnos biológico em HTML/CSS/JavaScript.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar `js/tipos.js` com:

1. Objeto `TIPOS` contendo todos os tipos biológicos:
   FAGOCITO, CITOTOXICO, HUMORAL, COORDENADOR, SINALIZADOR,
   VIRUS_EXTRACELULAR, VIRUS_INTRACELULAR, VIRUS_MUTANTE, TOXINA

2. Matriz/objeto `TABELA_EFETIVIDADE` que recebe (tipoAtaque, tipoAlvo) e retorna:
   2.0 (super efetivo), 1.0 (normal), 0.5 (pouco efetivo), 0.0 (imune)
   Baseada EXATAMENTE na tabela do MASTER_CONTEXT.

3. Função `calcularEfetividade(tipoAtaque, tipoAlvo)` que retorna o multiplicador.

4. Função `getMensagemEfetividade(multiplicador)` que retorna:
   - "É super efetivo!" (2x)
   - "" (1x — sem mensagem)
   - "Não é muito efetivo..." (0.5x)
   - "Não afeta o alvo!" (0x)

5. Objeto `DESCRICOES_BIOLOGICAS` com uma descrição educacional de cada tipo
   (para exibir quando o Prof. Imuno explicar os tipos ao jogador).

Use JavaScript ES6 com export.
Baseie-se na lógica biológica real descrita no MASTER_CONTEXT.
```

---

### LLM 3 — SISTEMA DE ATAQUES

**Arquivo alvo:** `js/ataques.js`

**Prompt:**
```
Você está desenvolvendo o jogo RUBRO — RPG biológico estilo Pokémon em JS.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar `js/ataques.js` com:

1. Classe `Ataque` com atributos:
   - nome, tipo (do js/tipos.js), poder, ppMax, ppAtual, precisao (0-100),
     categoria (FISICO | ESPECIAL | STATUS), efeitoEspecial (null ou objeto)
   - Método usar(atacante, alvo) que retorna {acertou: bool, dano: number, mensagem: string}
   - Método temPP() e gastarPP()

2. Classe `EfeitoEspecial` com:
   - tipo (VENENO | PARALISIA | BUFF_ATK | DEBUFF_DEF | CURA | MULTI_HIT | etc.)
   - chance (0-100), valor, turnos
   - Método aplicar(alvo)

3. Todos os ataques de cada personagem do MASTER_CONTEXT:

   NEUTRO: Fagocitose (Fagócito, 40), Explosão Oxidativa (Fagócito, 65), Degranulação (Fagócito, 50 + veneno), Onda de Neutrófilos (Fagócito, 80, especial)
   
   MACRO: Engolir (Fagócito, 45), Apresentação de Antígeno (Status — debuff DEF inimigo), Explosão de Macrófago (Fagócito, 70), Sinalização IL-1 (Coordenador — buff time)
   
   NATU: Reconhecimento MHC (Citotóxico, 50), Golpe NK (Citotóxico, 65), Perforina (Citotóxico, 90, special), Vigilância Constante (Status — imunidade a 1 ataque)
   
   LINFO_B: Produção de IgM (Humoral, 55), Reconhecimento B (Humoral, 45), Memória Antigênica (Status — registra tipo do inimigo), Resposta Humoral (Humoral, 75)
   
   LINFO_T: Sinalização IL-2 (Coordenador, buff ATK aliados), Ativação T (Coordenador, buff SPD), Regulação Imune (Status — cura status aliado), Tempestade de Citocinas (Sinalizador, 60 — dano de área)
   
   T_KILLER: Morte Celular Direta (Citotóxico, 70), Injeção de Granzima (Citotóxico, 85), Apoptose Induzida (Citotóxico, 95, 1 PP), Varredura CD8 (Citotóxico, 60, atinge todos)
   
   ANTI: Neutralização Total (Humoral, 120), Opsonização (Humoral, 90 + marca), Ativação do Complemento (110, Fagócito/Humoral), IgG Máximo (150, ignora defesa, 1 PP)
   
   VIRUS_PRIME: Invasão Celular, Replicação Básica, Evasão Imune
   REPLICATUS: Divisão Viral (cria clone), Infecção em Cadeia, Multiplicação Acelerada
   TOXICUS: Toxina Viral (veneno), Supressão Imune (debuff), Lise Celular
   MUTAGEN: Deriva Antigênica (muda tipo), Mutação Rápida, Recombinação Viral
   NECROTICUS: Necrose em Área (todos), Imunossupressão, Apoptose em Cascata (elimina aliado com menos HP)
   VIREX_OMEGA: (versões combinadas de todos acima + Apocalipse Viral)

Use ES6 com export.
```

---

### LLM 4 — SISTEMA DE TURNOS

**Arquivo alvo:** `js/turnos.js`

**Prompt:**
```
Você está desenvolvendo RUBRO — RPG biológico em JS Vanilla.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar `js/turnos.js` gerenciando o fluxo de combate:

1. Classe `GerenciadorTurnos` com:
   - turnoAtual (número), fase (ESCOLHA_ACAO | EXECUCAO | FIM_TURNO | FIM_BATALHA)
   - timeJogador (array de Personagem), inimigo (Personagem)
   - personagemAtivo (índice do time atual)
   - historico (array de ações do turno)

2. Estados do turno:
   FASE.ESCOLHA_ACAO → jogador escolhe ação (LUTAR, ITENS, TROCAR, FUGIR)
   FASE.EXECUCAO → ataques são resolvidos por velocidade (mais rápido vai primeiro)
   FASE.FIM_TURNO → efeitos de status aplicados, verificação de KO
   FASE.FIM_BATALHA → vitória ou derrota

3. Métodos:
   - iniciarBatalha(timeJogador, inimigo)
   - jogadorEscolheuAtaque(indexAtaque)
   - jogadorEscolheuItem(item)
   - jogadorEscolheuTrocar(indexPersonagem)
   - jogadorEscolheuFugir()
   - executarTurno() — resolve ações por velocidade
   - aplicarEfeitosStatus() — veneno, inflamação, etc.
   - verificarFimBatalha() — retorna 'VITORIA', 'DERROTA', ou null
   - calcularAcaoIA(inimigo, timeJogador) — IA simples do inimigo

4. Sistema de IA inimiga:
   - Prioriza ataque super efetivo se disponível
   - Usa habilidade especial quando HP < 50%
   - Ataca o aliado com menor HP se tiver ataque de área

5. Eventos/callbacks: onMensagem(texto), onAnimacao(tipo), onFimBatalha(resultado)

Export da classe.
```

---

### LLM 5 — CÁLCULO DE DANO

**Arquivo alvo:** `js/dano.js`

**Prompt:**
```
Você está desenvolvendo RUBRO — RPG biológico em JS.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar `js/dano.js` com:

1. Função principal `calcularDano(atacante, alvo, ataque)` que retorna objeto:
   { danoFinal, critico, efetividade, mensagens[] }

   Usando a fórmula do MASTER_CONTEXT:
   Dano = ((2×Nível/5 + 2) × Poder × ATK/DEF / 50 + 2)
          × efetividade × critico × aleatoriedade

2. Função `calcularCritico()` — 6.25% de chance, retorna 1.5 ou 1.0

3. Função `calcularAleatoriedade()` — retorna valor entre 0.85 e 1.0

4. Função `aplicarDano(personagem, dano)` — subtrai HP, verifica KO, retorna {novoHP, foi_ko}

5. Função `calcularDanoStatus(personagem)` — retorna dano por turno de cada status:
   - Infectado: 6 HP por turno
   - Envenenado: turno×2 HP (cresce)
   - Inflamado: 0 dano mas -20% DEF

6. Função `calcularCura(personagem, valor)` — cura sem ultrapassar hpMax

7. Função `aplicarBuff(personagem, atributo, multiplicador, turnos)` — buff/debuff temporário

Todas as funções devem logar as mensagens de batalha para exibição no front-end.
Export de todas as funções.
```

---

### LLM 6 — INTERFACE HTML/CSS DA BATALHA

**Arquivos alvo:** `index.html`, `css/style.css`, `css/batalha.css`

**Prompt:**
```
Você está desenvolvendo RUBRO — RPG biológico estilo Pokémon GBA em HTML/CSS/JS.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar a tela de batalha completa:

1. `index.html`:
   - Estrutura base do jogo
   - Tela de batalha conforme layout do MASTER_CONTEXT:
     - Área do inimigo (sprite + nome + nível + barra de HP)
     - Área do aliado (sprite + nome + nível + barra de HP + barra de XP)
     - Caixa de diálogo animada (texto aparece letra por letra, estilo typewriter)
     - Menu de ação: LUTAR | ITENS | TROCAR | FUGIR
     - Submenu de ataques (grid 2x2 com nome, tipo e PP de cada ataque)
   - Tela de cutscene (para capítulos narrativos)
   - Tela de "Professor Imuno falando" (card educacional)

2. `css/style.css`:
   - Tema visual: fundo escuro azul-marinho (#0A0F1E)
   - Paleta: vermelho (#CC2233) + azul bioluminescente (#00CCFF) + branco
   - Fonte: 'Press Start 2P' (Google Fonts) para textos de batalha
   - Fonte: 'Rajdhani' para textos educacionais do Professor Imuno
   - Pixel-art style com bordas nítidas, sem border-radius excessivo

3. `css/batalha.css`:
   - Animação das barras de HP (transição suave de cor: verde → amarelo → vermelho)
   - Animação de "shake" quando personagem recebe dano
   - Animação de "flash" branco no sprite ao receber ataque
   - Animação de entrada de sprite ao iniciar batalha (slide-in)
   - Animação do texto da caixa de diálogo (typewriter effect)
   - Estados visuais: super efetivo (flash amarelo), crítico (flash laranja), pouco efetivo (flash azul acinzentado)
   - Animação de KO (sprite cai/some com fade-out)
   - Partículas para tipos de ataque (vermelho para Fagócito, azul para Humoral, etc.)

Responsivo para desktop e tablet.
Sem frameworks CSS externos.
```

---

### LLM 7 — GERENCIAMENTO DE SPRITES E ASSETS

**Arquivo alvo:** `js/sprites.js`

**Prompt:**
```
Você está desenvolvendo RUBRO — RPG biológico em JS.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar `js/sprites.js` com:

1. Sistema de carregamento de sprites:
   - Objeto `SPRITES` mapeando cada personagem ao caminho do asset
   - Função `carregarSprite(nome)` — retorna Promise<HTMLImageElement>
   - Função `preCarregarTodos()` — carrega todos os sprites antes do jogo iniciar
   - Loading screen com barra de progresso enquanto carrega

2. Sprites desenhados em CSS/SVG como fallback (para quando assets ainda não existem):
   - `gerarSpriteSVG(personagem)` — gera um SVG estilizado para cada personagem usando formas geométricas e cores do tipo:
     - Vírus: hexágonos vermelhos/laranjas com "espinhos"
     - Fagócitos: blobs azuis amorfosc com pseudópodes
     - Natural Killer: formas angulares roxas/pretas
     - Anticorpo (ANTI): Y dourado brilhante
     - Professor Imuno: oval cinza com jaleco branco (CSS art)

3. Sistema de animação de sprite:
   - Classe `AnimadorSprite` com spritesheet support
   - Animações: IDLE (oscilação suave), ATACAR (avanço + recuo), RECEBER_DANO (shake), KO (cair)
   - Método `tocar(animacao, callback)` — executa animação e chama callback ao terminar

4. Gerenciador de partículas para efeitos de ataque:
   - Função `criarParticulas(tipo, x, y)` — cria efeito visual no canvas
   - Tipos: FAGOCITO (vermelho), CITOTOXICO (roxo), HUMORAL (dourado), CURA (verde)

Export de tudo.
```

---

### LLM 8 — SISTEMA DE CAPÍTULOS E NARRATIVA

**Arquivo alvo:** `js/capitulos.js`

**Prompt:**
```
Você está desenvolvendo RUBRO — RPG biológico em JS.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar `js/capitulos.js` gerenciando toda a narrativa do jogo:

1. Objeto `CAPITULOS` com todos os 8 capítulos (0 a 7 + epílogo), cada um contendo:
   - id, titulo, tipo ('CUTSCENE' | 'BATALHA' | 'EDUCACIONAL' | 'BOSS')
   - narrativaInicio (array de falas com {personagem, texto, sprite})
   - batalha (null ou {inimigo, timeDisponivel, itensDisponiveis})
   - narrativaFim (array de falas)
   - recompensas {xp, itens, desbloqueios}
   - falasProfesorImuno (array de textos educacionais)
   - localizacao (string do local biológico)

2. Classe `GerenciadorCapitulos`:
   - capituloAtual, estadoCapitulo
   - Método iniciarCapitulo(id)
   - Método avancarDialogo()
   - Método iniciarBatalha()
   - Método finalizarCapitulo(resultado)
   - Método verificarDesbloqueios()

3. Sistema de falas do Professor Imuno:
   - Classe `ProfImuno` com método falar(topico) que retorna o texto educacional do tópico
   - Tópicos: cada tipo celular, cada mecanismo viral, deriva antigênica, vacinação, sepse, anticorpos IgG
   - Cards visuais: cada fala vem com dadosBiologicos {titulo, texto, icone}

4. Sistema de save/load em localStorage:
   - Salvar: capituloAtual, timeJogador, itens, xp de cada personagem
   - Carregar: restaurar estado completo do jogo
   - Slot de save único com confirm antes de sobrescrever

5. Progressão de desbloqueio de personagens conforme capítulos (conforme MASTER_CONTEXT)

Export da classe e objeto CAPITULOS.
```

---

### LLM 9 — INTEGRAÇÃO FINAL E LOOP PRINCIPAL

**Arquivo alvo:** `js/main.js` (e integração de todos os módulos)

**Prompt:**
```
Você está desenvolvendo RUBRO — RPG biológico em JS.

Leia o RUBRO_MASTER_CONTEXT.md.

Sua tarefa é criar `js/main.js` que integra todos os módulos:
- personagens.js, tipos.js, ataques.js, turnos.js, dano.js, sprites.js, capitulos.js

1. Classe `JogoRUBRO`:
   - Inicialização: carrega sprites, inicializa capítulos, verifica save existente
   - Loop principal: estadoJogo (MENU | CUTSCENE | BATALHA | TELA_PROFESSOR | VITORIA | DERROTA | CREDITOS)
   - Método iniciar() — exibe tela de título e menu principal
   - Método novoJogo() — começa do Capítulo 0
   - Método continuarJogo() — carrega save
   - Método avancarCapitulo()

2. Tela de título animada:
   - Logo "RUBRO" em vermelho pulsante com efeito de sangue digital
   - Subtítulo "A guerra dentro de você"
   - Menu: Novo Jogo | Continuar | Créditos

3. Conector batalha-narrativa:
   - Ao terminar cutscene → inicia batalha
   - Ao terminar batalha → exibe debriefing do Prof. Imuno → avança capítulo
   - Ao terminar capítulo 6 → evento especial de evolução de ANTI → capítulo 7

4. Gerenciador de interface:
   - mostrarTelaBatalha(), esconderTelaBatalha()
   - mostrarDialogo(texto, personagem), fecharDialogo()
   - mostrarCardProfImuno(dados), fecharCard()
   - mostrarTelaCutscene(cenas[]), ao terminar chama callback
   - atualizarBarrasHP(aliado, inimigo)
   - mostrarMensagemEfetividade(texto)
   - animarTransicaoCapitulo(nomeLocal)

5. Input handler:
   - Teclado: Enter (confirmar), ESC (voltar/menu), setas (navegar menus)
   - Mouse/touch: clicks nos botões
   - Desativar input durante animações

6. Garantir que NENHUM import está faltando e que o jogo funcione do início ao fim.

Este é o arquivo de integração. Ele não deve conter lógica de jogo, apenas orquestrar os módulos.
```

---

### LLM 10 — BALANCEAMENTO E QA (Quality Assurance)

**Arquivo alvo:** `js/balanceamento.js` + relatório `QA_REPORT.md`

**Prompt:**
```
Você está fazendo QA e balanceamento do jogo RUBRO.

Leia o RUBRO_MASTER_CONTEXT.md e todos os arquivos js/ já criados.

Sua tarefa:

1. Criar `js/balanceamento.js` com:
   - Tabelas de crescimento de stats por nível para cada personagem (curvas distintas por papel: tank, ofensivo, suporte)
   - Função `calcularStatsNivel(personagem, nivel)` — retorna stats para qualquer nível
   - Tabelas de XP necessário por nível (curva suave de 1-50)
   - Drops de XP dos inimigos ajustados ao nível do capítulo

2. Verificar e corrigir:
   - Todos os personagens têm exatamente 4 ataques?
   - Todos os inimigos de cada capítulo têm nível coerente com a progressão?
   - ANTI é garantidamente mais forte que qualquer inimigo não-final?
   - O boss final pode ser derrotado com a estratégia correta (não é impossível)?

3. Criar `QA_REPORT.md` com:
   - Lista de todos os fluxos testados (início → fim de cada capítulo)
   - Bugs potenciais identificados
   - Sugestões de ajuste de dificuldade por capítulo
   - Checklist de consistência entre módulos

4. Verificar a consistência biológica:
   - Os tipos fazem sentido com a biologia real?
   - As falas do Professor Imuno estão cientificamente corretas?
   - A progressão do vírus (Viru-Prime → VIREX OMEGA) é biologicamente plausível?

Documente tudo no QA_REPORT.md.
```

---

## 10. CHECKLIST DE ENTREGA POR LLM

| LLM | Arquivo(s) | Status |
|---|---|---|
| LLM 1 | `js/personagens.js` | ⬜ Pendente |
| LLM 2 | `js/tipos.js` | ⬜ Pendente |
| LLM 3 | `js/ataques.js` | ⬜ Pendente |
| LLM 4 | `js/turnos.js` | ⬜ Pendente |
| LLM 5 | `js/dano.js` | ⬜ Pendente |
| LLM 6 | `index.html`, `css/style.css`, `css/batalha.css` | ⬜ Pendente |
| LLM 7 | `js/sprites.js` | ⬜ Pendente |
| LLM 8 | `js/capitulos.js` | ⬜ Pendente |
| LLM 9 | `js/main.js` | ⬜ Pendente |
| LLM 10 | `js/balanceamento.js`, `QA_REPORT.md` | ⬜ Pendente |

---

## 11. REGRAS GERAIS PARA TODAS AS LLMs

1. **Sempre leia este arquivo inteiro antes de começar a codificar.**
2. **Não invente personagens, tipos ou mecânicas** que não estão neste documento.
3. **Use JavaScript ES6+ com módulos** (`export`/`import`). Sem TypeScript, sem frameworks.
4. **Comente todo o código** com descrições biológicas onde aplicável.
5. **Não altere nomes de classes ou métodos** definidos em módulos anteriores.
6. **Informe no início do seu output** qual LLM você é e qual arquivo está produzindo.
7. **Se houver ambiguidade**, escolha a opção mais fiel à biologia real.
8. **Teste mentalmente** se seu código se conecta corretamente com os outros módulos antes de entregar.

---

*RUBRO_MASTER_CONTEXT.md — Versão 1.0 — Documento Completo*
*"A batalha mais épica já aconteceu dentro de você."*
