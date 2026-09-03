// ============ CHAPTERS JS ============

let currentChapterId = 0;
let chapterDataCache = null;
let cachedProgress = null;

// Get chapter from URL
const urlParams = new URLSearchParams(window.location.search);
const chapterParam = urlParams.get('cap');
if (chapterParam) {
  currentChapterId = parseInt(chapterParam);
}

// Chapter titles for navigation (all 51 chapters)
const chapterTitles = [
  "Introdução ao Curso",
  "Anatomia da Bateria",
  "Notação Básica",
  "Alternância Simples",
  "Pares (RR LL)",
  "Alternância com Acento",
  "Grupos de 3",
  "Quadrupletas",
  "Duplos",
  "Triplos",
  "Quádruplos",
  "Par e Ímpar",
  "Sincopa Básica",
  "Paradiddle Básico",
  "Paradiddle Duplo",
  "Paradiddle Triplo",
  "Flam Básico",
  "Flam com Duplos",
  "Drag Básico",
  "Ruff",
  "Buzz Rulo",
  "Open Rulo",
  "Single Stroke Rulo",
  "Double Stroke Rulo",
  "Five Stroke Rulo",
  "Seven Stroke Rulo",
  "Nine Stroke Rulo",
  "Ten Stroke Rulo",
  "Eleven Stroke Rulo",
  "Thirteen Stroke Rulo",
  "Fifteen Stroke Rulo",
  "Sincopação com Pares",
  "Acento na Segunda Batida",
  "Acento na Terceira Batida",
  "Acento na Quarta Batida",
  "Acento Duplo",
  "Acentos em Tercinas",
  "Sincopa de Rock",
  "Sincopa de Funk",
  "Sincopa de Bossa Nova",
  "Sincopa de Samba",
  "Grupos de 5",
  "Grupos de 7",
  "Grupos de 9",
  "Polirritmia 3x4",
  "Polirritmia 4x3",
  "Combinação Avançada 1",
  "Combinação Avançada 2",
  "Viradas Básicas",
  "Viradas Avançadas",
  "Exercício Final",
  "Exercícios de Pés",
  "Coordenação Mãos + Pés",
  "Dinâmica — Crescendo e Diminuendo",
  "Velocidade Gradual",
  "Grooves Aplicados",
  "Leitura de Partitura",
  "Clave de Samba",
  "Swing e Shuffle",
  "Ritmo Composto (6/8)",
  "Cross-Rhythm",
  "Ritmo Afro",
  "Polirritmia Avançada",
  "Fusão de Ritmos",
  "Ritmo e Silêncio",
  "Ritmo Livre e Criação",
  "", "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "", "", "",
  "O Ritmo Já Mora Dentro de Você",
  "A Baqueta: Sua Primeira Companheira",
  "O Rebote e a Gravidade",
  "O Fulcro: O Ponto Onde Tudo Acontece",
  "Deixe a Baqueta Trabalhar por Você",
  "O Pulso e o Metrônomo",
  "Pulso no Tempo 2",
  "Pulso no Tempo 3",
  "Pulso no Tempo 4"
];

// Concept texts for each chapter
const chapterConcepts = {
  0: `<p>O curso <strong>Do Travesseiro ao Groove</strong> é um programa completo de técnica de baquetas baseado nos princípios de George Lawrence Stone.</p><p>Publicado em 1935, o livro original ensina o controle total das mãos através de exercícios progressivos.</p><p>Neste curso, vamos transformar cada conceito em uma lição prática e fácil de entender.</p>`,
  1: `<p>A bateria é composta por vários componentes:</p><ul><li><strong>Bumbo (Bass Drum):</strong> O maior tambor, tocado com o pé</li><li><strong>Caixa (Snare):</strong> Tambor principal</li><li><strong>Tom (Tom):</strong> Tambores de diferentes alturas</li><li><strong>Chimbal (Hi-hat):</strong> Dois pratos que se fecham com pedal</li><li><strong>Pratos (Cymbals):</strong> Prato de ataque e de corte</li></ul>`,
  2: `<p>Na partitura de bateria:</p><ul><li><strong>♩ Nota preta:</strong> Uma batida (quarter note)</li><li><strong>♪ Nota com rabo:</strong> Meia batida (eighth note)</li><li><strong>Número do compasso:</strong> Quantas batidas por compasso</li></ul><p>Exemplo: <strong>4/4</strong> significa 4 batidas por compasso</p>`,
  3: `<p>O exercício de alternância simples é a base de tudo.</p><p>Você troca constantemente entre mão direita e esquerda.</p><p>O segredo é: <strong>DEVAGAR É RÁPIDO</strong></p>`,
  4: `<p>O padrão de pares é <strong>RR LL RR LL</strong></p><p>Cada mão toca duas vezes seguidas antes de trocar.</p><p>Isso treina a coordenação e a força de cada mão individualmente.</p>`,
  5: `<p>Acentuar significa tocar uma nota mais forte que as outras.</p><p>Isso dá energia e direção ao ritmo.</p><p>Pratique alternando entre notas fortes e fracas.</p>`,
  6: `<p>Grupos de 3 criam um efeito circular.</p><p>É como contar 'UNA-dois-tres, UNA-dois-tres'.</p><p>Isso desenvolve fluidez e coordenação.</p>`,
  7: `<p>Quadrupletas são 4 notas iguais no espaço de uma batida.</p><p>Com acento na primeira, fica 'TA-ta-ta-ta'.</p><p>É usada em fills e transições.</p>`,
  8: `<p>Duplos (RR LL) são usados em fills e transições.</p><p>É uma habilidade essencial para bateristas.</p><p>Pratique cada mão separadamente.</p>`,
  9: `<p>Triplos (RRR LLL) aparecem em patterns de rock e metal.</p><p>Exigem controle e resistência.</p><p>Comece devagar e aumente a velocidade.</p>`,
  10: `<p>Quádruplos (RRRR LLLL) são usados em fills rápidos e solos.</p><p>Desenvolvem resistência muscular.</p><p>Mantenha os punhos soltos.</p>`,
  11: `<p>Alternar grupos pares e ímpares cria ritmos interessantes.</p><p>Desenvolve coordenação avançada.</p><p>É a base para padrões complexos.</p>`,
  12: `<p>Sincopa é quando acentuamos a parte fraca do compasso.</p><p>Isso cria movimento e energia na música.</p><p>É fundamental para funk, jazz e bossa nova.</p>`,
  13: `<p>O paradiddle é um dos padrões mais importantes da bateria.</p><p>Combina alternância com duplos: <strong>R L R R L R L L</strong></p><p>Use em fills, grooves e solos.</p>`,
  14: `<p>O paradiddle duplo tem quatro notas alternadas e um duplo.</p><p>Padrão: <strong>R L R L R R L R L R L L</strong></p><p>Repare nos grupos: RLRL RR | LRLR LL.</p>`,
  15: `<p>O paradiddle triplo tem seis notas alternadas e um duplo.</p><p>Padrão: <strong>R L R L R L R R L R L R L R L L</strong></p><p>Grupos: RLRLRL RR | LRLRLR LL.</p>`,
  16: `<p>Um flam é duas batidas muito próximas.</p><p>A mão menor toca primeiro, seguida pela mão maior.</p><p>Cria um som mais 'gordo' e expressivo.</p>`,
  17: `<h3>O que é Flam com Duplos?</h3><p>Este capítulo combina o <span class='highlight'>flam</span> (duas batidas quase juntas) com o <span class='highlight'>duplo</span> (duas notas seguidas na mesma mão). O resultado é um padrão rítmico mais rico.</p><h3>Como Funciona</h3><div class='pattern-example'>rR L L | lL R R | rR L L | lL R R<br>flam dbl dbl  flam dbl dbl</div><p>Cada grupo tem um flam seguido de <span class='highlight'>dois duplos</span> na outra mão. O flam marca a batida forte; os duplos preenchem o espaço até o próximo flam.</p><h3>Como Tocar</h3><p>No flam, a mão menor (minúscula) toca primeiro e fica <span class='highlight'>mais perto da pele</span>; a principal (maiúscula) toca logo depois, com mais altura e volume. Nos duplos, toque as duas notas com o <strong>mesmo volume</strong> e a <strong>mesma altura</strong>. O flam deve sempre cair na batida forte.</p>`,
  18: `<h3>O que é um Drag?</h3><p>O drag é um ornamento com <span class='highlight'>duas notas rápidas e fracas</span> (grace notes) tocadas antes da nota principal. Elas quase não se ouvem: passam voando rumo à batida principal, que recebe todo o volume.</p><h3>Como Funciona</h3><div class='pattern-example'>rr L | ll R | rr L | ll R<br>gp gp GRD</div><p><strong>rr</strong> = duas notas fracas rápidas na mesma mão antes do golpe principal <strong>L</strong>. Diferente do double stroke, aqui a diferença está na <span class='highlight'>velocidade e no volume</span>: as grace notes são muito rápidas e muito fracas, e a principal é forte.</p><h3>Como Tocar</h3><ul><li><strong>1º passo:</strong> toque as duas grace notes com a mão menor — rápidas, baixas e <span class='highlight'>mais perto da pele</span>.</li><li><strong>2º passo:</strong> a nota principal chega logo depois com a outra mão, com mais altura e volume.</li><li><strong>Alternância:</strong> rr L | ll R, alternando as mãos a cada grupo.</li></ul><h3>Diferença do Double Stroke</h3><ul><li><strong>Double stroke:</strong> as duas notas têm o mesmo valor e o mesmo volume (RR LL).</li><li><strong>Drag:</strong> as duas grace notes são notas de passagem, rápidas e fracas, antes da principal (rrL).</li></ul>`,
  19: `<h3>O que é um Ruff?</h3><p>O ruff é um ornamento com <span class='highlight'>três notas rápidas e fracas</span> (grace notes) antes da nota principal. É como o drag, mas com uma nota a mais: em vez de rr, tocam-se rrr, e a batida principal cai em L.</p><h3>Como Funciona</h3><div class='pattern-example'>rrr L | lll R | rrr L | lll R<br>gp gp gp GRD</div><p><strong>rrr</strong> = três grace notes rápidas e quase sem volume na mesma mão, seguidas da principal <strong>L</strong>.</p><h3>Como Tocar</h3><ul><li><strong>1º passo:</strong> toque as três grace notes com a mão menor — rápidas, baixas e <span class='highlight'>mais perto da pele</span>.</li><li><strong>2º passo:</strong> a nota principal chega logo depois com a outra mão, com mais altura e volume.</li><li><strong>Alternância:</strong> rrr L | lll R, alternando qual mão faz o ruff e qual faz a batida principal.</li></ul><h3>Diferença do Drag</h3><ul><li><strong>Drag:</strong> duas grace notes antes da principal (rrL).</li><li><strong>Ruff:</strong> três grace notes antes da principal (rrrL) — o mesmo princípio, com mais uma nota.</li></ul>`,
  20: `<p>O buzz roll cria um som sustentado.</p><p>Usa múltiplos bounces rápidos da baqueta.</p><p>É usado em baladas e peças orquestrais.</p>`,
  21: `<h3>O que é um Open Roll?</h3><p>O open roll é um rulo tocado <span class='highlight'>aberto</span>: cada batida soa individual e claramente audível, ao contrário do buzz roll (som contínuo).</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR LL<br>(dois golpes por mão, cada um nítido)</div><p>Cada mão toca <span class='highlight'>dois golpes seguidos</span>. O segundo golpe vem do <strong>rebote</strong> da baqueta, controlado para quicar uma vez só.</p><h3>Como Tocar</h3><ul><li><strong>1º golpe:</strong> pulso, deixando a baqueta subir naturalmente.</li><li><strong>2º golpe:</strong> aproveite o rebote e freie o movimento depois, para não quicar uma 3ª vez.</li><li><strong>Alternância:</strong> RR LL RR LL com o mesmo volume nas duas notas.</li></ul>`,
  22: `<p>O single stroke roll é a alternância mais rápida possível.</p><p>Padrão: <strong>R L R L R L...</strong></p><p>Desenvolve velocidade e resistência.</p>`,
  23: `<h3>O que é um Double Stroke Roll?</h3><p>É um rulo onde <span class='highlight'>cada mão toca duas batidas seguidas</span>: RR LL RR LL RR LL...</p><p>É a base de quase todos os rulos (five, seven, nine stroke) e dos fills.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR LL<br>(duas batidas em cada mão)</div><p>As <span class='highlight'>duas notas de cada mão devem soar com o mesmo volume e na mesma velocidade</span>.</p><h3>Como Tocar</h3><ul><li><strong>1º golpe:</strong> toque com o pulso.</li><li><strong>2º golpe:</strong> aproveite o rebote, ou dê um segundo golpe de pulso — sempre com o <strong>mesmo volume</strong> do 1º.</li><li><strong>Alternância:</strong> RR LL RR LL, sem pausa entre as mãos.</li></ul><h3>Diferença do Open Roll</h3><p>É o <strong>mesmo padrão</strong> (RR LL). No open roll cada nota fica bem separada; no double stroke roll você busca igualdade entre os golpes e pode acelerar.</p>`,
  24: `<h3>O que é um Five Stroke Roll?</h3><p>É um rulo de <span class='highlight'>cinco batidas</span>: dois duplos + um acento. <strong>RR LL R</strong> — e emendando com a outra mão: <strong>RR LL R | LL RR L</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL R | LL RR L | RR LL R<br>(duplo, duplo, acento)</div><p>As <span class='highlight'>4 primeiras notas são duplos rápidos</span> (2 na direita + 2 na esquerda) e a <span class='highlight'>5ª é um acento</span>, tocada com a mão oposta.</p><h3>Como Tocar</h3><ul><li><strong>RR:</strong> duplo na direita, igual ao double stroke.</li><li><strong>LL:</strong> duplo na esquerda, mesmo volume.</li><li><strong>R:</strong> o <strong>acento</strong> — a 5ª nota soa mais forte e começa o próximo grupo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4 RÁ'</span>, repetindo — o acento cai sempre na 5ª nota.</p>`,
  25: `<h3>O que é um Seven Stroke Roll?</h3><p>É um rulo de <span class='highlight'>sete batidas</span>: três duplos + um acento. <strong>RR LL RR L</strong> — e emendando com a outra mão: <strong>RR LL RR L | LL RR LL R</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR L | LL RR LL R | RR LL RR L<br>(duplo, duplo, duplo, acento)</div><p>As <span class='highlight'>6 primeiras notas são duplos rápidos</span> (3 na direita + 3 na esquerda) e a <span class='highlight'>7ª é um acento</span>, tocada com a mão oposta.</p><h3>Como Tocar</h3><ul><li><strong>RR:</strong> duplo na direita, igual ao double stroke.</li><li><strong>LL:</strong> duplo na esquerda, mesmo volume.</li><li><strong>RR:</strong> mais um duplo na direita, mantendo o volume.</li><li><strong>L:</strong> o <strong>acento</strong> — a 7ª nota soa mais forte e começa o próximo grupo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4 5 6 RÁ'</span> — o acento cai sempre na 7ª nota.</p>`,
  26: `<h3>O que é um Nine Stroke Roll?</h3><p>É um rulo de <span class='highlight'>nove batidas</span>: quatro duplos + um acento. <strong>RR LL RR LL R</strong> — emendando: <strong>RR LL RR LL R | LL RR LL RR L</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR LL R | LL RR LL RR L<br>(duplo, duplo, duplo, duplo, acento)</div><p>As <span class='highlight'>8 primeiras notas são duplos rápidos</span> (4 na direita + 4 na esquerda) e a <span class='highlight'>9ª é um acento</span>.</p><h3>Como Tocar</h3><ul><li><strong>RR:</strong> duplo na direita.</li><li><strong>LL:</strong> duplo na esquerda, mesmo volume.</li><li><strong>RR / LL:</strong> mais dois duplos, mantendo o volume.</li><li><strong>R:</strong> o <strong>acento</strong> — a 9ª nota, que começa o próximo grupo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4 5 6 7 8 RÁ'</span> — o acento cai sempre na 9ª nota. É um rulo clássico de fills e viradas: começa e termina com a mesma mão (R...R).</p>`,
  27: `<h3>O que é um Ten Stroke Roll?</h3><p>É um rulo de <span class='highlight'>dez batidas</span>: cinco duplos, sem acento no final. <strong>RR LL RR LL RR</strong> — ele termina em duplo e emenda direto no grupo seguinte.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR LL RR | LL RR LL RR LL<br>(duplo, duplo, duplo, duplo, duplo)</div><p>São <span class='highlight'>10 notas, todas duplos</span> (5 na direita + 5 na esquerda). Diferente dos rulos ímpares, o ten termina em duplo — o acento cai na <span class='highlight'>1ª nota do grupo seguinte</span>, com a outra mão.</p><h3>Como Tocar</h3><ul><li><strong>RR / LL / RR / LL / RR:</strong> cinco duplos, todos com o mesmo volume.</li><li><strong>Acento:</strong> vem com a mão esquerda, começando o próximo grupo (LL...).</li></ul><p>Conte <span class='highlight'>'1 2 3 4 5 6 7 8 9 10'</span> e deixe o RÁ cair na 11ª, no começo do grupo seguinte.</p>`,
  28: `<h3>O que é um Eleven Stroke Roll?</h3><p>É um rulo de <span class='highlight'>onze batidas</span>: cinco duplos + um acento. <strong>RR LL RR LL RR L</strong> — emendando: <strong>RR LL RR LL RR L | LL RR LL RR LL R</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR LL RR L | LL RR LL RR LL R<br>(duplo, duplo, duplo, duplo, duplo, acento)</div><p>As <span class='highlight'>10 primeiras notas são duplos rápidos</span> (5 na direita + 5 na esquerda) e a <span class='highlight'>11ª é um acento</span>.</p><h3>Como Tocar</h3><ul><li><strong>RR / LL / RR / LL / RR:</strong> cinco duplos, mesmo volume.</li><li><strong>L:</strong> o <strong>acento</strong> — a 11ª nota, que começa o próximo grupo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4 5 6 7 8 9 10 RÁ'</span>. Com cinco duplos, é um dos rulos mais longos — os duplos precisam se manter limpos até o acento final.</p>`,
  29: `<h3>O que é um Thirteen Stroke Roll?</h3><p>É um rulo de <span class='highlight'>treze batidas</span>: seis duplos + um acento. <strong>RR LL RR LL RR LL R</strong> — emendando: <strong>RR LL RR LL RR LL R | LL RR LL RR LL RR L</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR LL RR LL R | LL RR LL RR LL RR L<br>(duplo ×6, acento)</div><p>As <span class='highlight'>12 primeiras notas são duplos rápidos</span> (6 na direita + 6 na esquerda) e a <span class='highlight'>13ª é um acento</span>.</p><h3>Como Tocar</h3><ul><li><strong>RR / LL ×3:</strong> seis duplos, todos com o mesmo volume.</li><li><strong>R:</strong> o <strong>acento</strong> — a 13ª nota, que começa o próximo grupo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4 5 6 7 8 9 10 11 12 RÁ'</span>. Divida em blocos de 4 (RRLL RRLL RRLL) para não perder a contagem. Dominá-lo prova que seu double stroke aguenta viradas extensas.</p>`,
  30: `<h3>O que é um Fifteen Stroke Roll?</h3><p>É um rulo de <span class='highlight'>quinze batidas</span>: sete duplos + um acento. <strong>RR LL RR LL RR LL RR L</strong> — emendando: <strong>RR LL RR LL RR LL RR L | LL RR LL RR LL RR LL R</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>RR LL RR LL RR LL RR L | LL RR LL RR LL RR LL R<br>(duplo ×7, acento)</div><p>As <span class='highlight'>14 primeiras notas são duplos rápidos</span> (7 na direita + 7 na esquerda) e a <span class='highlight'>15ª é um acento</span>.</p><h3>Como Tocar</h3><ul><li><strong>RR / LL ×3 + RR:</strong> sete duplos, todos com o mesmo volume.</li><li><strong>L:</strong> o <strong>acento</strong> — a 15ª nota, que começa o próximo grupo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4 5 6 7 8 9 10 11 12 13 14 RÁ'</span>. É o rulo mais longo da série: sete duplos antes do acento exigem resistência e controle de volume — a prova final do seu double stroke.</p>`,
  31: `<p>Sincopação com pares combina duplos com acentos sincopados.</p><p>Cria grooves mais interessantes.</p><p>É essencial para funk e R&B.</p>`,
  32: `<p>Acentuar a segunda batida cria um efeito de 'empurrão'.</p><p>É usado em muitos estilos musicais.</p><p>Desenvolve independência.</p>`,
  33: `<p>Acentuar a terceira batida é comum em ballads.</p><p>Cria um efeito mais suave.</p><p>Pratique com diferentes dinâmicas.</p>`,
  34: `<p>Acentuar a quarta batida cria antecipação.</p><p>É usado antes de transições.</p><p>Desenvolve timing preciso.</p>`,
  35: `<p>Acentos duplos reforçam o ritmo.</p><p>É uma técnica poderosa para fills.</p><p>Mantenha a energia constante.</p>`,
  36: `<p>Acentos em tercinas criam fluidez.</p><p>É comum em jazz e fusion.</p><p>Pratique em diferentes compassos.</p>`,
  37: `<p>A sincopa de rock é a base de muitos grooves.</p><p>Padrão: <strong>R r R l R r R l</strong></p><p>É essencial para bateristas de rock.</p>`,
  38: `<p>O funk exige sincopação precisa.</p><p>Padrão: <strong>r R r l R r l R</strong></p><p>Desenvola seu groove.</p>`,
  39: `<p>A bossa nova tem um padrão suave e sincopado.</p><p>Padrão: <strong>R l r l R l r l</strong></p><p>É um dos estilos mais elegantes.</p>`,
  40: `<p>O samba é energético e sincopado.</p><p>Padrão: <strong>R r l R r l R r l R r l</strong></p><p>Celebre a cultura brasileira.</p>`,
  41: `<p>Grupos de 5 (quintupletas) criam efeito assimétrico.</p><p>Desenvolve coordenação avançada.</p><p>É usado em jazz e fusion.</p>`,
  42: `<p>Grupos de 7 (septupletas) são desafiadores.</p><p>Criam tensão e release na música.</p><p>Pratique lentamente.</p>`,
  43: `<p>Grupos de 9 são usados em fills complexos.</p><p>Exigem controle total das mãos.</p><p>Domine grupos menores primeiro.</p>`,
  44: `<p>Polirritmia 3x4 é tocar 3 notas no espaço de 4.</p><p>Cria um efeito circular e hipnótico.</p><p>É fundamental para jazz.</p>`,
  45: `<p>Polirritmia 4x3 é tocar 4 notas no espaço de 3.</p><p>Cria tensão e movimento.</p><p>Desenvolve independência rítmica.</p>`,
  46: `<h3>O que é a Combinação 1?</h3><p>É um padrão que mistura o <span class='highlight'>paradiddle (RLRR LRLL)</span> com os <strong>pares (RR LL)</strong> em um único fluxo: toca o paradiddle, emenda um bloco de duplos e retoma o paradiddle — tudo sem parar.</p><h3>Como Funciona</h3><div class='pattern-example'>R L R R L R L L | R R L L | R L R R L R L L<br>(paradiddle, pares, paradiddle)</div><p>São <span class='highlight'>20 notas em 5 grupos de 4</span>: um paradiddle completo, um grupo de duplos puros (RR LL) e outro paradiddle. A mudança exige trocar de 'modo' mantendo a colocação das mãos.</p><h3>Como Tocar</h3><ul><li><strong>Paradiddle:</strong> RLRR LRLL, com os R's internos soando como duplos.</li><li><strong>Pares:</strong> RR LL soando idênticos aos duplos do paradiddle.</li><li><strong>Fluxo:</strong> toque tudo em semicolcheias contínuas — não deixe espaço na troca de grupo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4'</span> por grupo. O trecho de pares é o mais simples: use-o para reencontrar o tempo antes do último paradiddle.</p>`,
  47: `<h3>O que é a Combinação 2?</h3><p>É a combinação 1 com <span class='highlight'>flams</span>: cada grupo de 4 começa com um <strong>flam (rR ou lL)</strong> e completa um paradiddle pela frente. Somando os grupos, as notas principais formam o <strong>paradiddle RLRR LRLL</strong> — com a 1ª nota de cada metade virada em flam.</p><h3>Como Funciona</h3><div class='pattern-example'>rR L R R | lL R L L<br>(flam + paradiddle pela frente)</div><p>O grupo <strong>rR L R R</strong> é um flam na direita seguido de alternância com duplo interno. O flam <span class='highlight'>não adiciona batida</span> — o 'r' é um enfeite e a nota principal R é a 1ª do grupo.</p><h3>Como Tocar</h3><ul><li><strong>Flam:</strong> o enfeite toca um instante antes e soa bem mais fraco; a principal vem logo em seguida.</li><li><strong>Sequência:</strong> rR L R R — o flam abre o grupo e o paradiddle segue sem perder a colocação.</li><li><strong>Emendar:</strong> lL R L L começa na esquerda, mantendo o mesmo desenho.</li></ul><p>Conte <span class='highlight'>'1 2 3 4'</span> por grupo — o flam cai sempre na '1'. Não desacelere para caber o enfeite: ele é tocado antes da batida, sem roubar tempo.</p>`,
  48: `<h3>O que é uma Virada (Fill)?</h3><p>Uma <span class='highlight'>virada (fill)</span> é um <strong>preenchimento</strong> tocado no fim de uma frase ou compasso, quebrando o groove e anunciando a volta da música. Cria <span class='highlight'>expectativa</span> e direciona o ouvido para o <strong>retorno do tema</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>R L R L R L R L | R R L L R R L L<br>(8 alternâncias + 8 duplos = 16 notas)</div><p>Esta virada tem <span class='highlight'>16 notas</span> (um compasso de semicolcheias): a primeira metade é <strong>alternância pura</strong> (RLRL RLRL) e a segunda são <strong>duplos</strong> (RR LL RR LL). Ela ocupa o espaço do fim do compasso e se resolve quando a música retorna no '1'.</p><h3>Como Tocar</h3><ul><li><strong>Batidas 1 e 2:</strong> alternâncias R L R L R L R L.</li><li><strong>Batidas 3 e 4:</strong> duplos RR LL RR LL — mais densos, preparam a chegada.</li><li><strong>Resolução:</strong> a última nota (L) volta ao '1' do compasso seguinte, sem pular.</li></ul><p>Conte <span class='highlight'>'1 2 3 4'</span> e imagine a música voltando no '1'. A virada não é um solo — ela <span class='highlight'>serve ao tempo</span>.</p>`,
  49: `<h3>O que é uma Virada Avançada?</h3><p>É a virada básica com <span class='highlight'>ornamentos</span>: em vez de notas limpas, os grupos ganham <strong>flams</strong> em pontos diferentes do fill. O resultado é um preenchimento mais <span class='highlight'>denso e expressivo</span>, ideal para marcar transições e encerramentos.</p><h3>Como Funciona</h3><div class='pattern-example'>rR L R R | lL R rR L | lL R L L | rR L R R<br>(flams espalhados pelos 4 grupos)</div><p>São <span class='highlight'>16 notas em 4 grupos</span>. No 2º grupo o flam aparece até no meio (lL R <strong>rR</strong> L), quebrando a simetria — essa irregularidade é o que faz o fill 'responder' com musicalidade.</p><h3>Como Tocar</h3><ul><li><strong>Flams:</strong> enfeite + principal, quase juntos — devem soar como UMA nota grossa.</li><li><strong>Duplos e alternância:</strong> seguem o controle que você já treinou.</li><li><strong>Densidade:</strong> com mais ornamentos, comece <strong>lento</strong> e acelere só depois que cada flam estiver limpo.</li></ul><p>Conte <span class='highlight'>'1 2 3 4'</span> por grupo e deixe os flams caberem dentro da nota — eles não podem roubar tempo.</p>`,
  50: `<h3>O que é o Exercício Final?</h3><p>É a <span class='highlight'>grande prova do curso</span>: uma sequência longa que mistura <strong>paradiddles, duplos e alternância</strong> — tudo o que você praticou até aqui, emendado sem parar.</p><h3>Como Funciona</h3><div class='pattern-example'>R L RR L R LL | RR LL R L RR | L R LL RR LL | RR LL R L R L<br>(paradiddle, duplos e alternância emendados)</div><p>A sequência começa com um <span class='highlight'>paradiddle (R L R R L R L L)</span>, segue para <span class='highlight'>duplos (RR LL)</span> e termina com <span class='highlight'>alternância pura (R L R L)</span>, sem tempo de descanso entre eles.</p><h3>Como Tocar</h3><ul><li><strong>Primeira passada:</strong> toque devagar, em ~50 BPM, até o fim sem errar.</li><li><strong>Confira as emendas:</strong> o ponto mais difícil é trocar de técnica — repita só a transição.</li><li><strong>Suba o tempo:</strong> aumente aos poucos, 5 BPM por vez, mantendo as baquetas soltas.</li></ul><p>Este é o <span class='highlight'>capítulo de conclusão do curso</span>: ele prova que você construiu coordenação, controle e resistência.</p>`,
  51: `<h3>O que são os Exercícios de Pés?</h3><p>São padrões tocados com os pés — o <span class='highlight'>bumbo</span> e o <span class='highlight'>hi-hat</span> — que criam a base do groove. Aqui cada símbolo representa um pé, não uma mão.</p><h3>Como Funciona</h3><div class='pattern-example'>R - R - R - R - R - r - R - r -<br>(R = bumbo forte, r = hi-hat fraco, - = pausa)</div><p>O <span class='highlight'>R maiúsculo é o bumbo</span>, forte, com o pé direito. O <span class='highlight'>r minúsculo é o hi-hat</span>, leve, com o pé esquerdo. O <span class='highlight'>'-' é pausa</span>: o tempo passa, mas nada soa.</p><h3>Como Tocar</h3><ul><li><strong>R:</strong> bumbo — pise firme, marcando o pulso.</li><li><strong>r:</strong> hi-hat — toque leve, fechando o chimbal.</li><li><strong>-:</strong> pausa — mantenha o pé pronto, mas <strong>não toque</strong>.</li></ul><p>Conte em voz alta: <span class='highlight'>'1 (e) 2 (e) 3 (e) 4 (e)'</span>. O bumbo e o hi-hat são o coração do groove — pés independentes = groove sólido.</p>`,
  52: `<h3>O que é Coordenação Mãos + Pés?</h3><p>É tocar padrões de mãos sobre uma base constante de pés. O que separa um praticante de um baterista é exatamente isso: <span class='highlight'>cada membro fazendo uma coisa diferente ao mesmo tempo</span>.</p><h3>Como Funciona</h3><div class='pattern-example'>R L R L R L R L | R R L L R R L L<br>(mãos alternadas + duplos, sobre o pulso dos pés)</div><p>Enquanto os pés mantêm o <span class='highlight'>hi-hat em colcheias constantes</span> e o bumbo no 1 e 3, as mãos tocam o padrão: <span class='highlight'>alternância pura</span> e depois <span class='highlight'>duplos</span>.</p><h3>Como Tocar</h3><ul><li><strong>Comece simples:</strong> toque só o hi-hat no pulso, sem bumbo.</li><li><strong>Adicione o bumbo:</strong> bumbo no 1 e 3, mantendo o hi-hat correndo.</li><li><strong>Junte as mãos:</strong> toque o padrão por cima, sem desmontar os pés.</li><li><strong>Complexidade gradual:</strong> só adicione uma peça nova quando a anterior sair sem esforço.</li></ul><p>É a <span class='highlight'>independência de membros</span>: o passo entre tocar rudimentos e tocar bateria de verdade.</p>`,
  53: `<h3>O que é Dinâmica?</h3><p>Dinâmica é o <span class='highlight'>controle de volume</span> — o que dá vida à música. Duas palavras comandam tudo: <strong>crescendo</strong> (ficar mais forte aos poucos) e <strong>diminuendo</strong> (ficar mais suave aos poucos).</p><h3>Como Funciona</h3><div class='pattern-example'>r l r l R L R L R L R L R L R L<br>(começa fraco e cresce até o fim)</div><p>O exercício começa em <span class='highlight'>r l (fraco, piano)</span> e cresce até <span class='highlight'>R L (forte)</span>, numa progressão contínua: cada nota sai um pouquinho mais forte que a anterior — não de repente.</p><h3>Como Tocar</h3><ul><li><strong>Baqueta baixa = piano:</strong> toque rente à pele, com pouco movimento.</li><li><strong>Baqueta alta = forte:</strong> levante mais a baqueta, o golpe sai mais pesado.</li><li><strong>Crescendo:</strong> suba a altura da baqueta nota a nota.</li><li><strong>Diminuendo:</strong> o caminho inverso — baixando a baqueta e suavizando o golpe.</li></ul><p>Dinâmica separa o som mecânico do som musical: uma batida que cresce emociona.</p>`,
  54: `<h3>O que é Velocidade Gradual?</h3><p>É um treino para <span class='highlight'>ganhar velocidade sem destruir a técnica</span>. Em vez de tentar tocar rápido logo de cara, você sobe o BPM aos poucos — o mesmo exercício de <strong>alternância + duplos</strong>, cada vez mais rápido.</p><h3>Como Funciona — a Regra dos 5 BPM</h3><div class='pattern-example'>R L R L R L R L | R R L L R R L L<br>(toque limpo → suba 5 BPM → repita)</div><ul><li><strong>Suba 5:</strong> aumente o metrônomo em <span class='highlight'>5 BPM por vez</span>, nunca mais.</li><li><strong>Falhou? Volte 5:</strong> se a técnica quebrar, volte <span class='highlight'>5 BPM para trás</span> e solidifique o tempo anterior.</li><li><strong>Paciência:</strong> velocidade é conquista <span class='highlight'>de semanas, não de horas</span>.</li></ul><h3>Como Tocar</h3><ul><li><strong>Solto:</strong> quanto mais rápido, mais as baquetas quicam sozinhas — deixe.</li><li><strong>Leve:</strong> golpes pequenos e baixos economizam energia.</li><li><strong>Sem força:</strong> apertar a baqueta não acelera — apenas trava os músculos.</li></ul><p>A velocidade vem como consequência da técnica correta, nunca da força.</p>`,
  55: `<h3>O que são Grooves Aplicados?</h3><p>É o momento em que os rudimentos <span class='highlight'>saem do exercício e entram na música</span>: um padrão de alternância vira um <strong>groove de rock</strong>, os acentos criam movimento e o paradiddle fecha a virada.</p><h3>Como Funciona</h3><div class='pattern-example'>R l R l R l r l | R L R R L R L L<br>(groove de rock com acentos + paradiddle)</div><p>As <span class='highlight'>primeiras 8 notas são um groove de rock</span>: R tocado forte e l fraco, com o acento no R criando o 'pulo' do rock. As <span class='highlight'>últimas 8 são um paradiddle (R L R R L R L L)</span> como fill de transição.</p><h3>Como Tocar</h3><ul><li><strong>Acentos:</strong> as maiúsculas (R, L) são o <span class='highlight'>backbeat</span> — soam como caixa.</li><li><strong>Notas fracas:</strong> as minúsculas (l, r) passam leve, tipo chimbal.</li><li><strong>Paradiddle final:</strong> entre no fill sem parar o pulso — ele é a ponte para o próximo ciclo.</li></ul><p>Aqui você prova que todo rudimento vira groove real.</p>`,
  56: `<h3>O que é Leitura de Partitura?</h3><p>Ler partitura é como <span class='highlight'>ler um livro</span>: quanto mais você pratica, mais fluido fica. Em vez de decorar, você <strong>olha e toca na hora</strong>.</p><h3>Como Funciona</h3><div class='pattern-example'>R L - L R - R L R - L R - R - L<br>(R/L = notas tocadas, '-' = pausa)</div><p>No padrão, <span class='highlight'>R e L são batidas</span>, alternando a mão que o símbolo indicar. <span class='highlight'>'-' é pausa</span>: o tempo passa, mas você não toca.</p><h3>Como Ler</h3><ul><li><strong>Quarter notes (nota preta):</strong> uma nota por tempo — o '1, 2, 3, 4' do compasso.</li><li><strong>Eighth notes (colcheia):</strong> metade do tempo, a nota com 'rabo' — duas por tempo.</li><li><strong>Pausa:</strong> um tempo em silêncio — leia o espaço como quem lê um espaço entre palavras.</li></ul><p>Pratique <span class='highlight'>contando antes de tocar</span>: diga 'R, L, pausa, L, R...' e só depois leve as baquetas à pele.</p>`,
  57: `<h3>Clave de Samba</h3><p>A <span class='highlight'>clave de samba</span> é o padrão rítmico fundamental da música brasileira. Diferente da clave cubana, a clave de samba tem um swing único.</p><h3>Padrão Básico</h3><div class='pattern-example'>R l R l R l R l<br>↓   ↓   ↓   ↓  <br>1   &   2   &   </div><p>O segredo está no <span class='highlight'>balanço</span> — a leve antecipação da segunda metade do compasso.</p><h3>Onde é Usado?</h3><p>Este padrão aparece em:<ul><li><strong>Samba:</strong> Escola de samba, pagode</li><li><strong>MPB:</strong> Milton Nascimento, Caetano Veloso</li><li><strong>Fusion:</strong> Samba jazz, samba rock</li></ul></p>`,
  58: `<h3>Swing e Shuffle</h3><p>No swing, as colcheias não são iguais — a primeira é mais longa, a segunda é mais curta. Isso cria o <span class='highlight'>balanço</span> característico do jazz e do blues.</p><h3>Pattern de Shuffle</h3><div class='pattern-example'>R l R l R l R l<br>↓   ↓   ↓   ↓  <br>1  &  2  &  3  &  4  &</div><p>Cada par é tocado como uma <span class='highlight'>tercina</span>: a primeira nota dura 2/3, a segunda 1/3 do tempo.</p><h3>Onde é Usado?</h3><p><ul><li><strong>Blues:</strong> Shuffle é a base do blues elétrico</li><li><strong>Jazz:</strong> Swing é a essência do jazz</li><li><strong>Rock:</strong> Muitos rocks têm swing sutil</li></ul></p>`,
  59: `<h3>Compasso 6/8</h3><p>No 6/8, cada compasso tem <span class='highlight'>seis colcheias</span> agrupadas em <span class='highlight'>dois grupos de três</span>. A sensação é binária mas com subdivisão ternária.</p><h3>Padrão 6/8</h3><div class='pattern-example'>R l l R l l<br>↓       ↓  <br>1   &   a   2   &   a</div><p>O acento cai no 1 e no 4 (início de cada grupo).</p><h3>Onde é Usado?</h3><p><ul><li><strong>Baladas:</strong> Muitas baladas lentas são em 6/8</li><li><strong>Folclore:</strong> Jigs irlandeses, música celta</li><li><strong>Rock Progressivo:</strong> Mudanças de compasso</li></ul></p>`,
  60: `<h3>Cross-Rhythm</h3><p>Cross-rhythm é quando <span class='highlight'>duas métricas diferentes</span> são tocadas simultaneamente. O exemplo mais comum é 3 contra 2: uma mão toca em 3, a outra em 2.</p><h3>Padrão 3:2</h3><div class='pattern-example'>R: 1 . 2 . 3 . | 1 . 2 . 3 .<br>L: 1 . . . . . | 2 . . . . .</div><p>A mão direita toca 3 notas no mesmo tempo que a esquerda toca 2.</p><h3>Onde é Usado?</h3><p><ul><li><strong>Música Africana:</strong> Base de polirritmias tribais</li><li><strong>Jazz:</strong> Comping e solos</li><li><strong>Rock Progressivo:</strong> Tool, Rush, Dream Theater</li></ul></p>`,
  61: `<h3>Ritmo Afro</h3><p>Os ritmos africanos são <span class='highlight'>cíclicos</span> — repetem-se em loops. O padrão mais conhecido é o <span class='highlight'>12/8 africano</span>, com 12 pulsos por ciclo.</p><h3>Padrão 12/8</h3><div class='pattern-example'>R l l R l l R l l R l l<br>↓           ↓           ↓<br>1   2   3   4   5   6   ...</div><p>Cada grupo de 3 forma um pulso. São 4 pulsos por ciclo.</p><h3>Onde é Usado?</h3><p><ul><li><strong>Música Afro-Cubana:</strong> Rumba, conga</li><li><strong>Samba:</strong> Herança africana no Brasil</li><li><strong>Jazz Modal:</strong> Miles Davis, John Coltrane</li></ul></p>`,
  62: `<h3>Polirritmia Avançada</h3><p>Depois do 3:2 e 4:3, chegamos a polirritmias mais complexas como <span class='highlight'>5:4</span> (5 notas contra 4) e <span class='highlight'>7:4</span> (7 notas contra 4).</p><h3>Padrão 5:4</h3><div class='pattern-example'>R l R l R l R l R l (direita, 5 notas)<br>R . . . . . . . . . . . . . . (esquerda, 4 notas base)</div><p>A mão direita toca 5 notas distribuídas uniformemente sobre 4 pulsos.</p><h3>Onde é Usado?</h3><p><ul><li><strong>Fusion:</strong> Weather Report, Mahavishnu Orchestra</li><li><strong>Metal Técnico:</strong> Meshuggah, Animals as Leaders</li><li><strong>Música Contemporânea:</strong> Compositores minimalistas</li></ul></p>`,
  63: `<h3>Fusão de Ritmos</h3><p>O baterista moderno precisa <span class='highlight'>transitar entre estilos</span>. A fusão combina a energia do rock, o balanço do samba, o groove do funk e a sofisticação do jazz.</p><h3>Padrão de Fusão</h3><div class='pattern-example'>R R l R l l R l (rock + samba)<br>↓   ↓   ↓   ↓  <br>1   &   2   &</div><p>Comece com rock, adicione o balanço do samba na mão direita e a sincopa do funk na esquerda.</p><h3>Onde é Usado?</h3><p><ul><li><strong>Fusion:</strong> Chick Corea, Return to Forever</li><li><strong>MPB:</strong> Djavan, Milton Nascimento</li><li><strong>Rock Progressivo Brasileiro:</strong> Mutantes</li></ul></p>`,
  64: `<h3>Ritmo e Silêncio</h3><p>Na música, o <span class='highlight'>silêncio</span> é um elemento rítmico poderoso. Saber quando <span class='highlight'>não tocar</span> é uma marca dos grandes bateristas.</p><h3>Padrão com Pausas</h3><div class='pattern-example'>R . l . R . l .<br>↓   ↓   ↓   ↓  <br>1   &   2   &</div><p>Os pontos (.) representam silêncio. A mão não toca — mas o tempo continua.</p><h3>Onde é Usado?</h3><p><ul><li><strong>Funk:</strong> As pausas criam o groove</li><li><strong>Jazz:</strong> Comping com espaços</li><li><strong>Rock:</strong> Quebras e viradas</li></ul></p>`,
  65: `<h3>Ritmo Livre e Criação</h3><p>Depois de dominar dezenas de padrões, chegou a hora de <span class='highlight'>criar os seus</span>. A técnica não é um fim — é uma ferramenta para a expressão musical.</p><h3>Como Criar</h3><div class='pattern-example'>Comece com um padrão base:<br>R l R l R l R l<br><br>Depois modifique:<br>R R l R l l R l<br><br>Continue experimentando:<br>R l R R R l R l</div><p>Mude uma nota de cada vez. Pegue padrões que você já conhece e <span class='highlight'>recombine</span>.</p><h3>Dicas para Criar</h3><p><ul><li><strong>Limite-se:</strong> Use apenas 2 ou 3 elementos</li><li><strong>Repita:</strong> Todo groove precisa de repetição</li><li><strong>Varie:</strong> Mude um acento de lugar</li><li><strong>Grave:</strong> Ouça sua própria criação</li></ul></p>`,
  100: `<h3>O primeiro som que você ouviu</h3><p>Antes de nascer, você já estava ouvindo ritmo. O <strong>primeiro som</strong> que chegou aos seus ouvidos foi o batimento cardíco da sua mãe: <span class='highlight'>Tum... tum... tum... tum...</span></p><p>Seu cérebro já estava <strong>treinado para reconhecer padrões</strong> mesmo antes de você vir ao mundo. Essa é a base de tudo.</p><h3>Por que batemos palmas?</h3><p>Quando ouvimos música, é quase impossível ficar parado. Batemos palmas, balançamos a cabeça, movemos os pés. Isso não é coincidência — é <strong>natureza</strong>. O ritmo mora dentro de nós.</p><h3>Desafio</h3><p>Coloque a mão no peito e sinta seu coração. <span class='highlight'>Tum... tum... tum...</span> Esse é o seu primeiro ritmo. Ele esteve com você a vida inteira.</p><h3>O mundo está cheio de ritmo</h3><p>Olhe ao seu redor. O <strong>tique-taque</strong> do relógio. O som dos seus <strong>passos</strong>. A chuva batendo no telhado. A ventoinha girando. O pisca-pisca do carro. Tudo isso são <span class='highlight'>ritmos</span>.</p><h3>O que é ritmo?</h3><p>Ritmo é uma <strong>sequência organizada de sons e silêncios ao longo do tempo</strong>. Não precisa ser música. Qualquer padrão de som repetido é ritmo.</p><h3>E os instrumentos de percussão?</h3><p>Os tambores são uma <strong>máquina de ritmo</strong>. Cada peça faz um som diferente, organizado para criar um groove. É como uma conversa — cada voz tem sua hora.</p>`,
  101: `<h3>Muito mais que madeira</h3><p>A baqueta não é apenas um pedaço de madeira. É a <strong>extensão das suas mãos</strong>. É ela que vai traduzir o que você imagina em som.</p><h3>As partes da baqueta</h3><ul><li><strong>Ponta (Tip):</strong> É a extremidade que toca o instrumento. Aqui nasce o som.</li><li><strong>Ombro (Shoulder):</strong> A parte curvalogo abaixo da ponta. Usada para tocar címbalos com um som mais <span class='highlight'>encorpado e grave</span>.</li><li><strong>Corpo (Body):</strong> O centro da baqueta. É onde está o <strong>equilíbrio</strong> e o peso distribuído.</li><li><strong>Base (Butt):</strong> A extremidade oposta. Mais pesada, dá <span class='highlight'>controle e potência</span>.</li></ul><h3>Duas iguais? Nunca!</h3><p>Dois sticks podem parecer idênticos, mas ter pesos diferentes. Por isso os profissionais <strong>giram as baquetas</strong> — para sentir o equilíbrio e garantir que estão confortáveis.</p><h3>A escolha certa</h3><p>Para começar, a recomendação é a baqueta <strong>5A de madeira</strong>. Ela tem o melhor equilíbrio entre peso, tamanho e conforto. Não existe resposta errada — existe a que se sente certa para você.</p><h3>Como segurar</h3><p>Você <strong>não segura</strong> a baqueta. Você <strong>impede que ela caia</strong>. Essa é a grande mudança de mentalidade.</p><h3>O pássaro</h3><p>Imagine que há um pássaro delicado entre seus dedos e a baqueta.</p><ul><li><strong>Apertar demais:</strong> Você machuca o passarinho. As mãos doem, a velocidade some, o controle acaba.</li><li><strong>Segurar de menos:</strong> O passarinho voa embora. A baqueta cai.</li><li><strong>Justo:</strong> Firme, mas nunca apertado. O passarinho está seguro e feliz.</li></ul><h3>O erro mais comum</h3><p>Segurar a baqueta como um <strong>martelo</strong> — com muita força. Isso causa fadiga, dor, e tira toda a velocidade e controle.</p>`,
  102: `<h3>A bola de tênis</h3><p>Se você deixar cair uma bola de tênis no chão, ela volta. <strong>Quicou.</strong> A baqueta faz a mesma coisa. Quando bate numa superfície, ela quer voltar.</p><h3>Seu trabalho não é levantar</h3><p>O seu trabalho <strong>não é levantar</strong> a baqueta depois de cada golpe. O seu trabalho é <strong>guiá-la</strong>.</p><h3>A gravidade é sua amiga</h3><p>Você não precisa <span class='highlight'>empurrar para baixo</span>. A gravidade já faz isso por você. Deixe a baqueta cair e aproveite o rebote.</p><h3>O que é rebote?</h3><p>Quando a baqueta atinge uma superfície, ela <strong>retorna naturalmente</strong>. O rebote não é um problema — é um <span class='highlight'>presente</span>. É a natureza trabalhando a seu favor.</p><h3>Experiência 1: Força total</h3><p>Bata com toda a força que tiver. Perceba: a baqueta <strong>quase não se move</strong>. Você trava o movimento.</p><h3>Experiência 2: Relaxe</h3><p>Agora bata com a mão relaxada. A baqueta parece <strong>viva</strong>, quase tem vontade própria. Ela quica sozinha.</p><h3>O iê-iê</h3><p>É como um iê-iê: você não controla cada centímetro. Você <strong>aprende o ritmo</strong> e deixa o instrumento trabalhar.</p><h3>Regra de ouro</h3><p><span class='highlight'>A força faz barulho. O controle faz música.</span></p>`,
  103: `<h3>O experimento da régua</h3><p>Segure uma régua no meio e equilibre no dedo. Ela fica parada. Agora mude o ponto — ela cai. O <strong>ponto onde equilibra</strong> é o fulcro.</p><h3>O que é fulcro?</h3><p>Fulcro é o ponto onde a baqueta <span class='highlight'>pivô e rotaciona</span>. É o centro de tudo. É ali que o movimento nasce.</p><h3>Como um balanço</h3><p>Um balanço precisa de um ponto central para funcionar. Sem ele, tudo balança sem controle. A baqueta é igual — sem fulcro, não há movimento.</p><h3>Formado por dois dedos</h3><p>O fulcro é formado principalmente pelo <strong>polegar</strong> e o <strong>indicador</strong>. São eles que seguram o ponto de equilíbrio.</p><h3>A metáfora do pincel</h3><p>Segure a baqueta como seguraria um <span class='highlight'>pincel de pintura</span>. Equilibrado, leve, preciso. Não como uma enxada.</p><h3>Onde fica?</h3><p>O ponto de equilíbrio fica aproximadamente a <strong>1/3 da ponta para trás</strong>. Mas cada baqueta é diferente — você precisa encontrar o seu.</p><h3>Experimento</h3><p>Segure bem na ponta. Depois bem no fundo. Agora no meio. <span class='highlight'>Sinta a diferença.</span> O ponto certo é onde a baqueta se sente mais leve e quer girar sozinha.</p><h3>O papel dos dedos</h3><ul><li><strong>Controlam o rebote</strong> — guiam a volta da baqueta</li><li><strong>Direcionam o stick</strong> — apontam para onde o som vai</li><li><strong>Mantêm precisão</strong> — cada golpe no lugar certo</li><li><strong>Economizam energia</strong> — menos esforço, mais resultado</li></ul><h3>Erro fatal</h3><p>Apertar o fulcro como se fosse uma <strong>fechadura</strong>. O fulcro é uma <span class='highlight'>dobradiça</span>, não uma tranca. Deixe a baqueta girar.</p><p><span class='highlight'>Controle não significa rigidez.</span></p>`,
  104: `<h3>A bola de borracha</h3><p>Lembra da bola de tênis? Agora imagine uma bola de borracha. Você joga no chão e ela <strong>quica cada vez mais alto</strong>. A baqueta pode fazer o mesmo — se você deixar.</p><h3>Força vs. Técnica</h3><p>Faça 10 batidas com força total. Agora 10 batidas com o <strong>peso natural</strong> da baqueta. Perceba a diferença. Uma delas é <span class='highlight'>muito mais fácil</span>.</p><h3>O segredo dos grandes bateristas</h3><p>Os grandes bateristas não desperdiçam energia. <span class='highlight'>Cada movimento tem propósito.</span> Nada é à toa. É por isso que parecem tão fáceis.</p><h3>O teste da moeda</h3><p>Imagine uma moeda no dorso da sua mão enquanto toca. Se ela <strong>não cair</strong>, seus movimentos estão eficientes. Se voar, está movendo demais.</p><h3>A dança da baqueta</h3><p>Imagine que a baqueta está <strong>danzando</strong>. Você apenas conduz. Ela faz o trabalho — você mostra o caminho.</p><h3>Exercício 1: Ouça a baqueta</h3><p>Dê uma batida. <strong>Espere.</strong> Outra batida. <strong>Espere.</strong> Foque no som, no rebote, na sensação. Uma batida de cada vez.</p><h3>Exercício 2: Movimento contínuo</h3><p>20 batidas, <strong>todas iguais</strong>. Sem acelerar. Sem apertar. Cada golpe como um gêmeo da anterior.</p><h3>Erro comum</h3><p>Tentar <strong>ajudar a baqueta a subir</strong> depois do rebote. Ela sobe sozinha. Deixe.</p>`,
  105: `<h3>O coração da música</h3><p>O <strong>pulso</strong> é o batimento cardíco da música. É aquele \"tum... tum... tum...\" que sente quando ouve uma canção. Sem pulso, não há música — só ruído.</p><h3>Por que umas músicas parecem rápidas?</h3><p>Uma música parece rápida quando o pulso é <strong>mais acelerado</strong>. Uma balada tem pulso lento. Um funk tem pulso mais rápido. O que muda é a <span class='highlight'>velocidade do pulso</span>.</p><h3>O que é BPM?</h3><p>BPM significa <strong>Beats Per Minute</strong> — batidas por minuto. É a medida do pulso:</p><ul><li><strong>60 BPM:</strong> Um batimento por segundo (como o relógio)</li><li><strong>90 BPM:</strong> Pulso médio, como uma caminhada</li><li><strong>120 BPM:</strong> Pulso acelerado, como uma corrida leve</li></ul><h3>O metrônomo: aliado ou inimigo?</h3><p>Muita gente tem <strong>medo do metrônomo</strong>. Parece que ele está julgando. Mas na verdade, ele é o seu <span class='highlight'>melhor amigo</span>. Ele é honesto — não mente, não erra, não se cansa.</p><h3>Como usar</h3><ol><li><strong>Comece devagar</strong> — 40 BPM é perfeito para começar</li><li><strong>Aumente aos poucos</strong> — quando estiver confortável, suba 5 BPM</li><li><strong>Não tenha pressa</strong> — devagar é rápido</li></ol><h3>Devagar é rápido</h3><p>Quando você se sente <strong>confortável com as pausas</strong>, quando o silêncio entre as batidas faz sentido, quando o pulso interno bate junto com o metrônomo — aí sim, você está pronto para o <span class='highlight'>Módulo 1</span>.</p>`,
  106: `<h3>O segundo tempo</h3><p>No exercicio anterior, voce tocou apenas no <strong>primeiro tempo</strong>. Agora vamos mudar: as batidas vao cair no <strong>segundo tempo</strong>.</p><h3>Como funciona</h3><p>Em um compasso de 4/4, temos 4 tempos: 1 - 2 - 3 - 4. Agora voce vai tocar no tempo 2:</p><div class='pattern-example'>- R - - | - L - - | - R - - | - L - -<br>1 2 3 4   1 2 3 4   1 2 3 4   1 2 3 4</div><h3>Por que isso importa?</h3><p>A maioria dos iniciantes so consegue tocar no primeiro tempo. Mas na musica, os acentos e as batidas podem aparecer em <span class='highlight'>qualquer tempo</span>. Treinar cada tempo separadamente desenvolve uma percepcao muito mais forte do compasso.</p><h3>O desafio</h3><p>O dificil nao e tocar. E <strong>esperar</strong>. Voce precisa segurar o impulso de tocar no tempo 1 e deixar a mao cair exatamente no tempo 2. Isso treina o <span class='highlight'>controle interno</span>.</p>`,
  107: `<h3>O terceiro tempo</h3><p>Agora ficou ainda mais desafiador. Voce vai tocar apenas no <strong>terceiro tempo</strong> do compasso:</p><div class='pattern-example'>- - R - | - - L - | - - R - | - - L -<br>1 2 3 4   1 2 3 4   1 2 3 4   1 2 3 4</div><h3>Por que e mais dificil?</h3><p>Agora voce precisa <strong>esperar dois tempos</strong> antes de tocar. Isso exige mais <span class='highlight'>controle interno</span> e mais concentracao. Voce precisa manter o pulso mentalmente por mais tempo.</p><h3>A sensacao</h3><p>Quando voce consegue tocar no tempo 3 com seguranca, comeca a sentir algo especial: o compasso se torna <span class='highlight'>transparente</span>. Voce nao esta mais contando os tempos - esta sentindo cada um deles.</p><h3>Na musica real</h3><p>O terceiro tempo e onde muitos musicos colocam a <strong>contracente</strong> - aquela batida que da 'swing' a musica. E um dos tempos mais importantes do groove.</p>`,
  108: `<h3>O quarto e ultimo tempo</h3><p>Este e o ultimo exercicio da serie. Voce vai tocar no <strong>quarto tempo</strong> - o mais distante do inicio do compasso:</p><div class='pattern-example'>- - - R | - - - L | - - - R | - - - L<br>1 2 3 4   1 2 3 4   1 2 3 4   1 2 3 4</div><h3>O maior desafio</h3><p>Agora voce precisa esperar <strong>tres tempos inteiros</strong> antes de tocar. Isso e o teste definitivo do seu <span class='highlight'>pulso interno</span>. Voce precisa manter o ritmo na cabeca por mais tempo do que nunca.</p><h3>O ciclo completo</h3><p>Parabens! Se voce chegou ate aqui, ja treinou os 4 tempos do compasso:</p><ul><li><strong>Tempo 1:</strong> O pulso forte, o inicio</li><li><strong>Tempo 2:</strong> A continuacao suave</li><li><strong>Tempo 3:</strong> A contracente, o 'swing'</li><li><strong>Tempo 4:</strong> A resolucao, o retorno ao inicio</li></ul><h3>Pronto para o Modulo 1</h3><p>Quando voce domina todos os tempos, esta pronto para qualquer coisa. O <span class='highlight'>Modulo 1</span> do curso comeca com exercicios que combinam tudo que voce aprendeu aqui. Bem-vindo ao proximo nivel!</p>`,
};

// Diagram texts
const chapterDiagrams = {
  0: `<span class="right">    R</span>     <span class="left">L</span>\n   / \\\\     / \\\\\n  /   \\\\   /   \\\\\n <span class="right">Mão</span>  <span class="left">Mão</span>\n<span class="right">Direita</span> <span class="left">Esquerda</span>`,
  1: `   <span class="left">[Chimbal]</span>\n  /             \\\\\n<span class="right">[Tom Alto]</span>     <span class="left">[Tom Médio]</span>\n  \\\\             /\n   <span class="right">[Caixa]</span>\n      |\n   <span class="left">[Bumbo]</span>`,
  2: `Compasso 4/4:\n<span class="right">R</span>   <span class="left">L</span>   <span class="right">R</span>   <span class="left">L</span>\n♩     ♩     ♩     ♩\n1     2     3     4`,
  3: `<span class="right">R</span>   <span class="left">L</span>   <span class="right">R</span>   <span class="left">L</span>   <span class="right">R</span>   <span class="left">L</span>   <span class="right">R</span>   <span class="left">L</span>\n ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓\n1     2     3     4     1     2     3     4`,
  4: `<span class="right">R</span> <span class="right">R</span>   <span class="left">L</span> <span class="left">L</span>   <span class="right">R</span> <span class="right">R</span>   <span class="left">L</span> <span class="left">L</span>\n ↓   ↓     ↓   ↓     ↓   ↓     ↓   ↓\n1   &     2   &     3   &     4   &`
};

// Tips texts
const chapterTips = {
  0: `<div class="tip-box"><strong>💡 Dica:</strong> Comece sempre devagar. A velocidade vem com a prática consistente.</div>`,
  1: `<div class="tip-box"><strong>💡 Dica:</strong> Na partitura, cada nota representa um componente diferente da bateria.</div>`,
  2: `<div class="tip-box"><strong>💡 Dica:</strong> Conte em voz alta enquanto toca: "Um, dois, três, quatro..."</div><div class="warning-box"><strong>⚠️ Cuidado:</strong> Não confunda o compasso (4/4) com o BPM (velocidade).</div>`,
  3: `<div class="tip-box"><strong>💡 Dica:</strong> Mantenha os punhos soltos. A tensão é inimiga da velocidade.</div><div class="tip-box"><strong>💡 Dica:</strong> Use um metrônomo! Comece em 60 BPM e aumente 5 BPM por dia.</div>`,
  4: `<div class="tip-box"><strong>💡 Dica:</strong> Preste atenção para que ambas as mãos tenham a mesma intensidade.</div>`,
  5: `<div class="tip-box"><strong>💡 Dica:</strong> Minúsculas (r, l) = notas fracas. Maiúsculas (R, L) = notas fortes.</div>`,
  13: `<div class="tip-box"><strong>💡 Dica:</strong> O paradiddle é a base de centenas de padrões. Domine-o!</div>`,
  16: `<div class="tip-box"><strong>💡 Dica:</strong> O flam funciona melhor quando a mão menor está bem perto da membrana.</div>`,
  17: `<div class="tip-box"><strong>💡 Dica:</strong> O flam marca a batida forte; os duplos mantêm o tempo até o próximo flam.</div>`,
  18: `<div class="tip-box"><strong>💡 Dica:</strong> No drag, as duas grace notes são notas de passagem: rápidas, fracas e perto da pele.</div>`,
  19: `<div class="tip-box"><strong>💡 Dica:</strong> No ruff, quanto mais rápidas as três grace notes, mais 'fervorosa' a entrada na batida principal.</div>`,
  21: `<div class="tip-box"><strong>💡 Dica:</strong> O open roll é a base dos rulos em marchas e solos. Cada nota precisa ser audível!</div><div class="warning-box"><strong>⚠️ Cuidado:</strong> Se o 2º golpe soa 'embaçado', é porque você deixou quicar demais. Freie o rebote.</div>`,
  22: `<div class="tip-box"><strong>💡 Dica:</strong> O single stroke roll é o exercício mais básico de velocidade.</div>`,
  23: `<div class="tip-box"><strong>💡 Dica:</strong> No double stroke, cada nota deve ser claramente audível.</div>`,
  24: `<div class="tip-box"><strong>💡 Dica:</strong> No five stroke, o acento (5ª nota) precisa se destacar das 4 rápidas.</div>`,
  25: `<div class="tip-box"><strong>💡 Dica:</strong> No seven stroke, mantenha os 3 duplos com o mesmo volume até o acento.</div>`,
  26: `<div class="tip-box"><strong>💡 Dica:</strong> No nine stroke, o acento cai sempre na 9ª nota — conte até o RÁ.</div>`,
  27: `<div class="tip-box"><strong>💡 Dica:</strong> No ten stroke não há acento final: ele vem na 1ª nota do grupo seguinte.</div>`,
  28: `<div class="tip-box"><strong>💡 Dica:</strong> No eleven stroke, mantenha os duplos limpos até o acento na 11ª.</div>`,
  29: `<div class="tip-box"><strong>💡 Dica:</strong> No thirteen stroke, divida em blocos de 4 (RRLL RRLL RRLL) para não se perder.</div>`,
  30: `<div class="tip-box"><strong>💡 Dica:</strong> No fifteen stroke, sete duplos antes do acento pedem resistência — não acelere.</div>`,
  46: `<div class="tip-box"><strong>💡 Dica:</strong> Toque tudo em fluxo contínuo; o trecho de pares é o respiro antes do último paradiddle.</div>`,
  47: `<div class="tip-box"><strong>💡 Dica:</strong> O flam não rouba tempo: ele entra antes da batida, que cai no '1' do grupo.</div>`,
  48: `<div class="tip-box"><strong>💡 Dica:</strong> A virada serve ao tempo: imagine a música voltando no '1' ao final dela.</div>`,
  49: `<div class="tip-box"><strong>💡 Dica:</strong> Na virada avançada, comece lento e só acelere quando cada flam estiver limpo.</div>`,
  50: `<div class="tip-box"><strong>💡 Dica:</strong> No exercício final, domine cada emenda antes de subir o BPM.</div>`,
  51: `<div class="tip-box"><strong>💡 Dica:</strong> Conte em voz alta: o '-' é pausa — não toque, mas mantenha o pé pronto.</div>`,
  52: `<div class="tip-box"><strong>💡 Dica:</strong> Só adicione uma peça nova de coordenação quando a anterior sair sem esforço.</div>`,
  53: `<div class="tip-box"><strong>💡 Dica:</strong> Use a altura da baqueta: baixa = piano, alta = forte.</div>`,
  54: `<div class="tip-box"><strong>💡 Dica:</strong> Regra dos 5 BPM: subiu 5, falhou, volte 5. Velocidade vem da técnica.</div>`,
  55: `<div class="tip-box"><strong>💡 Dica:</strong> Os acentos (R, L) são o backbeat: soam como caixa e abrem o groove.</div>`,
  56: `<div class="tip-box"><strong>💡 Dica:</strong> Conte em voz alta ('R, L, pausa...') antes de tocar — leitura é reconhecer padrões.</div>`,
  37: `<div class="tip-box"><strong>💡 Dica:</strong> A sincopa de rock é a base de muitos grooves famosos.</div>`,
  38: `<div class="tip-box"><strong>💡 Dica:</strong> O funk exige feeling. Não toque mecanicamente!</div>`,
  39: `<div class="tip-box"><strong>💡 Dica:</strong> A bossa nova é suave. Não force as batidas.</div>`,
  44: `<div class="tip-box"><strong>💡 Dica:</strong> Polirritmia é difícil no início. Use o metrônomo!</div>`,
  50: `<div class="tip-box"><strong>🎉 Parabéns!</strong> Você completou o curso Do Travesseiro ao Groove. Continue praticando!</div>`,
  57: `<div class='tip-box'><strong>💡 Balanço:</strong> Sinta o swing brasileiro. Não toque quadrado!</div><div class='tip-box'><strong>💡 Ouvido:</strong> Escute samba e tente identificar a clave.</div><div class='tip-box'><strong>💡 Variação:</strong> Depois de dominar, tente inverter os acentos.</div>`,
  58: `<div class='tip-box'><strong>💡 Feeling:</strong> Cante "TA - ta" antes de tocar.</div><div class='tip-box'><strong>💡 Metrônomo:</strong> Comece lento e sinta o espaço entre as notas.</div><div class='tip-box'><strong>💡 Referência:</strong> Ouça John Bonham (Led Zeppelin) — shuffle puro!</div>`,
  59: `<div class='tip-box'><strong>💡 Conte em voz alta:</strong> "UM-um-um DOIS-um-um"</div><div class='tip-box'><strong>💡 Balanço:</strong> Sinta o balanço de 2 grupos, não 6 notas soltas.</div><div class='tip-box'><strong>💡 Variação:</strong> Depois tente acentuar o 4 apenas.</div>`,
  60: `<div class='tip-box'><strong>💡 Comece lento:</strong> 40 BPM. Cada mão separada primeiro.</div><div class='tip-box'><strong>💡 Sinta o ciclo:</strong> O padrão completo tem 6 pulsos.</div><div class='tip-box'><strong>💡 Bata os pés:</strong> Use os pés para marcar o pulso base.</div>`,
  61: `<div class='tip-box'><strong>💡 Cíclico:</strong> Não pare no final — o ciclo recomeça.</div><div class='tip-box'><strong>💡 Corporeo:</strong> Balance o corpo com o ritmo.</div><div class='tip-box'><strong>💡 Variação:</strong> Depois tente acentuar o 4 e o 10.</div>`,
  62: `<div class='tip-box'><strong>💡 Subdivida:</strong> Conte 1-2-3-4-5 em voz alta.</div><div class='tip-box'><strong>💡 Isolamento:</strong> Pratique cada mão separada primeiro.</div><div class='tip-box'><strong>💡 Paciência:</strong> Polirritmias levam semanas para internalizar.</div>`,
  63: `<div class='tip-box'><strong>💡 Mãos separadas:</strong> Domine cada mão antes de juntar.</div><div class='tip-box'><strong>💡 Ouça fusão:</strong> Chick Corea, Weather Report, Azymuth.</div><div class='tip-box'><strong>💡 Crie:</strong> Depois de dominar, crie suas próprias combinações.</div>`,
  64: `<div class='tip-box'><strong>💡 Conte tudo:</strong> Mesmo nas pausas, continue contando.</div><div class='tip-box'><strong>💡 Mão no ar:</strong> Nas pausas, a mão continua o movimento sem tocar.</div><div class='tip-box'><strong>💡 Ouça:</strong> Preste atenção nos espaços que grandes bateristas deixam.</div>`,
  65: `<div class='tip-box'><strong>💡 Grave-se:</strong> Ouvir a si mesmo revela coisas que você não percebe tocando.</div><div class='tip-box'><strong>💡 Colabore:</strong> Tocar com outros músicos expande seu vocabulário.</div><div class='tip-box'><strong>💡 Divirta-se:</strong> A música é alegria. Não esqueça por que você começou.</div>`,
  100: `<div class='tip-box'><strong>🎯 Missão do Dia:</strong> Encontre 5 ritmos durante o dia de hoje: o relógio, seus passos, a ventoinha, a chuva, o motor do ônibus. Anote ou grave no celular.</div><div class='tip-box'><strong>💡 Dica do Gabriel:</strong> "Não tente encontrar música. Tente encontrar ritmo." O ritmo está em tudo — você só precisa prestar atenção.</div><div class='tip-box'><strong>💡 Exercício:</strong> Coloque a mão no peito e conte 10 batimentos. Sinta a cadência. Esse é o seu metrônomo interno.</div>`,
  101: `<div class='tip-box'><strong>💡 Dica do Gabriel:</strong> "A baqueta não é um martelo. Ela é um pincel." Segure firme, mas com leveza.</div><div class='tip-box'><strong>🎯 Missão do Dia:</strong> Segure as baquetas por 5 minutos. Gire gentilmente. Sinta o peso e o equilíbrio. Não toque nada — apenas segure e conheça.</div><div class='warning-box'><strong>⚠️ Evite:</strong> Nunca aperte com força como se fosse um martelo. Isso causa lesões e reduz o controle.</div>`,
  102: `<div class='tip-box'><strong>💡 Regra de Ouro:</strong> "A força faz barulho. O controle faz música." Sempre que esquecer, volte a esta frase.</div><div class='tip-box'><strong>🎯 Missão do Dia:</strong> 50 batidas consecutivas, todas iguais. Mão relaxada. Rebote natural. Sem forçar.</div><div class='warning-box'><strong>⚠️ Erro Comum:</strong> Forçar a baqueta para baixo. A gravidade já faz isso. Você só precisa deixá-la cair e guiar o retorno.</div>`,
  103: `<div class='tip-box'><strong>💡 Dica do Gabriel:</strong> Marque o fulcro com fita adesiva. Assim você nunca perde o ponto de equilíbrio enquanto treina.</div><div class='tip-box'><strong>🎯 Missão do Dia:</strong> Experimente 3 posições diferentes na baqueta. Anote qual tem mais rebote, mais conforto e menos esforço.</div><div class='warning-box'><strong>⚠️ Evite:</strong> Apertar o fulcro como uma fechadura. É uma dobradiça — deve girar livremente.</div>`,
  104: `<div class='tip-box'><strong>💡 Dica do Gabriel:</strong> "Se alguém assistir ao seu treino sem ouvir o som, seus movimentos devem parecer leves e naturais."</div><div class='tip-box'><strong>🎯 Missão do Dia:</strong> 50 batidas no travesseiro, 50 no pad. Compare: rebote, esforço, comportamento das mãos.</div><div class='warning-box'><strong>⚠️ Erro Comum:</strong> Tentar ajudar a baqueta a subir depois do rebote. Ela sobe sozinha — confie na gravidade.</div>`,
  105: `<div class='tip-box'><strong>💡 Dica:</strong> Coloque o metrônomo e só escute por 1 minuto antes de tocar. Sinta o pulso. Deixe ele entrar na sua cabeça.</div><div class='tip-box'><strong>💡 Devagar é Rápido:</strong> Comece a 40 BPM. Não aumente até se sentir totalmente confortável. A paciência é a chave.</div><div class='tip-box'><strong>💡 Próximo Passo:</strong> Quando estiver confortável com as pausas e o pulso interno, você está pronto para o Módulo 1 do curso!</div>`,
  106: `<div class='tip-box'><strong>Dica:</strong> Coloque o metronomo e conte em voz alta: 'UM - dois - tres - quatro'. Toque so no 'dois'.</div><div class='tip-box'><strong>Devagar e Rapido:</strong> Comece a 40 BPM. O silencio no tempo 1 e o mais dificil de manter. Tenha paciencia.</div><div class='tip-box'><strong>Proximo Passo:</strong> Quando estiver confortavel, va para o proximo exercicio: pulso no tempo 3!</div>`,
  107: `<div class='tip-box'><strong>Dica:</strong> Conte 'UM - dois - TRÊS - quatro'. Toque so no 'tres'. A palma no tempo 3 e o seu alvo.</div><div class='tip-box'><strong>Paciencia:</strong> Este exercicio treina sua capacidade de esperar. Na musica, saber esperar e tao importante quanto saber tocar.</div><div class='tip-box'><strong>Proximo Passo:</strong> Quando dominar, restam apenas os exercicios de pulso. O proximo e o ultimo: tempo 4!</div>`,
  108: `<div class='tip-box'><strong>Dica:</strong> Conte 'UM - dois - tres - QUATRO'. Toque so no 'quatro'. E o momento de fechar o compasso.</div><div class='tip-box'><strong>Ciclo Completo:</strong> Se voce fez todos os exercicios de pulso (105, 106, 107 e 108), parabens! Voce sente cada tempo do compasso.</div><div class='tip-box'><strong>Proximo Passo:</strong> Voce esta pronto para o Modulo 1! Lembre-se: devagar e rapido. A base que voce construiu aqui vai sustentar toda a sua jornada.</div>`
};

// Default exercise for chapters
const defaultExercise = {
  exercise: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  extra: null,
  weeklyGoal: [
    { day: 'Dia 1-3', bpm: 60, duration: '5 min' },
    { day: 'Dia 4-5', bpm: 70, duration: '8 min' },
    { day: 'Dia 6-7', bpm: 80, duration: '10 min' }
  ]
};

// Exercise map for each chapter (fallback if API fails)
const chapterExercises = {
  0: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  1: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'],
  2: ['R', 'R', 'L', 'R', 'L', 'L', 'R', 'L'],
  3: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  4: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'],
  5: ['R', 'l', 'r', 'l', 'R', 'l', 'r', 'l'],
  6: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  7: ['R', 'l', 'r', 'l', 'R', 'l', 'r', 'l', 'R', 'l', 'r', 'l', 'R', 'l', 'r', 'l'],
  8: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'],
  9: ['R', 'R', 'R', 'L', 'L', 'L', 'R', 'R', 'R', 'L', 'L', 'L'],
  10: ['R', 'R', 'R', 'R', 'L', 'L', 'L', 'L', 'R', 'R', 'R', 'R', 'L', 'L', 'L', 'L'],
  11: ['R', 'R', 'L', 'L', 'L', 'R', 'R', 'L', 'L', 'L', 'R', 'R', 'L', 'L', 'L'],
  12: ['R', 'l', 'r', 'l', 'r', 'l', 'R', 'l', 'r', 'l', 'r', 'l'],
  13: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'],
  14: ['R', 'L', 'R', 'L', 'R', 'R', 'L', 'R', 'L', 'R', 'L', 'L'],
  15: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'L'],
  16: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  17: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'],
  18: ['r', 'r', 'R', 'l', 'r', 'r', 'L', 'r'],
  19: ['r', 'r', 'r', 'R', 'l', 'l', 'l', 'L'],
  20: ['R', 'R', 'R', 'R', 'R', 'R', 'L', 'L', 'L', 'L', 'L', 'L'],
  21: ['R', 'R', 'L', 'L', 'R', 'R', 'l', 'l', 'R', 'R', 'L', 'L', 'R', 'R', 'l', 'l'],
  22: ['R', 'L', 'r', 'l', 'R', 'L', 'r', 'l', 'R', 'L', 'r', 'l', 'R', 'L', 'r', 'l'],
  23: ['R', 'R', 'L', 'L', 'r', 'r', 'l', 'l', 'R', 'R', 'L', 'L', 'r', 'r', 'l', 'l'],
  24: ['R', 'R', 'L', 'L', 'R', 'L', 'L', 'R', 'R', 'L', 'R', 'R', 'L', 'L', 'R'],
  25: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'L', 'R', 'R', 'L', 'L', 'R'],
  26: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L'],
  27: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'],
  28: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R'],
  29: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L'],
  30: ['R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L', 'R'],
  31: ['R', 'R', 'l', 'l', 'R', 'R', 'l', 'l', 'R', 'R', 'l', 'l'],
  32: ['r', 'R', 'l', 'l', 'r', 'R', 'l', 'l'],
  33: ['r', 'l', 'R', 'l', 'r', 'l', 'R', 'l'],
  34: ['r', 'l', 'r', 'R', 'r', 'l', 'r', 'R'],
  35: ['R', 'r', 'l', 'l', 'R', 'r', 'l', 'l'],
  36: ['R', 'l', 'r', 'L', 'r', 'l', 'R', 'l'],
  37: ['R', 'r', 'R', 'l', 'R', 'r', 'R', 'l'],
  38: ['r', 'R', 'r', 'l', 'R', 'r', 'l', 'R'],
  39: ['R', 'l', 'r', 'l', 'R', 'l', 'r', 'l'],
  40: ['R', 'r', 'l', 'R', 'r', 'l', 'R', 'r', 'l', 'R', 'r', 'l'],
  41: ['R', 'l', 'r', 'l', 'r', 'R', 'l', 'r', 'l', 'r'],
  42: ['R', 'l', 'r', 'l', 'r', 'l', 'r', 'R', 'l', 'r', 'l', 'r', 'l', 'r'],
  43: ['R', 'l', 'r', 'l', 'r', 'l', 'r', 'l', 'r', 'R', 'l', 'r', 'l', 'r', 'l', 'r', 'l', 'r'],
  44: ['R', 'l', 'r', 'L', 'r', 'l', 'R', 'l', 'r', 'L', 'r', 'l'],
  45: ['R', 'l', 'r', 'l', 'L', 'r', 'l', 'r', 'R', 'l', 'r', 'l'],
  46: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L', 'R', 'l', 'r', 'l', 'R', 'R', 'L', 'L'],
  47: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L', 'R', 'l', 'r', 'l', 'R', 'r', 'L', 'l'],
  48: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'R', 'L', 'L', 'R', 'R', 'L', 'L'],
  49: ['R', 'L', 'R', 'R', 'L', 'R', 'L', 'L', 'R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'],
  50: ['R', 'L', 'R', 'L', 'R', 'R', 'L', 'L', 'R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'],
  51: ['R', '-', 'R', '-', 'R', '-', 'R', '-', 'R', '-', 'r', '-', 'R', '-', 'r', '-'],
  52: ['R', 'l', 'R', 'l', 'L', 'r', 'L', 'r', 'R', 'l', 'R', 'l', 'L', 'r', 'L', 'r'],
  53: ['r', 'l', 'r', 'l', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  54: ['R', 'l', 'r', 'l', 'r', 'l', 'r', 'l', 'R', 'L', 'r', 'l', 'r', 'l', 'r', 'l'],
  55: ['R', 'l', 'R', 'l', 'R', 'l', 'r', 'l', 'R', 'L', 'R', 'R', 'L', 'R', 'L', 'L'],
  56: ['R', 'L', '-', 'L', 'R', '-', 'R', 'L', 'R', '-', 'L', 'R', '-', 'R', '-', 'L'],
  57: ['R', 'l', 'R', 'l', 'R', 'l', 'R', 'l'],
  58: ['R', 'l', 'R', 'l', 'R', 'l', 'R', 'l'],
  61: ['R', 'l', 'l', 'R', 'l', 'l', 'R', 'l', 'l', 'R', 'l', 'l'],
  65: ['R', 'l', 'R', 'l', 'r', 'l', 'R', 'l'],
  102: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
  103: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  104: ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'],
  105: ['R', '-', '-', '-', 'L', '-', '-', '-', 'R', '-', '-', '-', 'L', '-', '-', '-'],
  106: ['-', 'R', '-', '-', '-', 'L', '-', '-', '-', 'R', '-', '-', '-', 'L', '-', '-'],
  107: ['-', '-', 'R', '-', '-', '-', 'L', '-', '-', '-', 'R', '-', '-', '-', 'L', '-'],
  108: ['-', '-', '-', 'R', '-', '-', '-', 'L', '-', '-', '-', 'R', '-', '-', '-', 'L']
};

// Fetch chapter data from API
async function fetchChapterData(chapterId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/chapters/${chapterId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.log('Fetching from API failed, using defaults');
  }
  return null;
}

// Get current exercise data
async function getCurrentExerciseData() {
  const apiData = await fetchChapterData(currentChapterId);
  
  // Priority: API data > hardcoded fallbacks
  const title = (apiData && apiData.title) || chapterTitles[currentChapterId] || `Capítulo ${currentChapterId + 1}`;
  const concept = (apiData && apiData.concept) || chapterConcepts[currentChapterId] || `<p>Pratique este exercício consistentemente.</p>`;
  const diagram = (apiData && apiData.diagram) || chapterDiagrams[currentChapterId] || `<span class="right">R</span> <span class="left">L</span> <span class="right">R</span> <span class="left">L</span>`;
  const tips = (apiData && apiData.tips) || chapterTips[currentChapterId] || `<div class="tip-box"><strong>💡 Dica:</strong> Pratique todos os dias!</div>`;
  
  // Priority: API data > chapterExercises map > default
  let exercise = chapterExercises[currentChapterId] || defaultExercise.exercise;
  if (apiData && apiData.exercise) {
    exercise = apiData.exercise;
  }
  
  let objectives = apiData && apiData.objectives ? apiData.objectives : ["Continuar praticando os conceitos anteriores"];
  let weeklyGoal = defaultExercise.weeklyGoal;
  if (apiData && apiData.weeklyGoal) {
    const wg = apiData.weeklyGoal;
    if (Array.isArray(wg)) {
      weeklyGoal = wg;
    } else if (wg && wg.targetBpm) {
      weeklyGoal = [
        { day: 'Dia 1-3', bpm: wg.targetBpm, duration: `${wg.minutesPerDay || 5} min` },
        { day: 'Dia 4-5', bpm: Math.round(wg.targetBpm * 1.1), duration: `${Math.round((wg.minutesPerDay || 5) * 1.5)} min` },
        { day: 'Dia 6-7', bpm: Math.round(wg.targetBpm * 1.2), duration: `${wg.minutesPerDay || 5} min` }
      ];
    }
  }
  
  return {
    title: title,
    subtitle: currentChapterId >= 100
      ? `Módulo Preparatório — Aula ${currentChapterId - 99} de 9`
      : `Módulo 1 — Capítulo ${currentChapterId + 1} de 57`,
    objectives: objectives,
    concept: concept,
    diagram: diagram,
    tips: tips,
    exercise: exercise,
    extra: null,
    weeklyGoal: weeklyGoal
  };
}

// Check if current chapter is locked
async function isChapterLocked() {
  // Preparatory module: 100-108
  if (currentChapterId >= 100 && currentChapterId <= 108) {
    if (currentChapterId === 100) return false;
  }
  // Main module: chapter 0 requires prep module complete
  if (currentChapterId === 0) {
    const token = localStorage.getItem('token');
    if (!token) return true;
    try {
      const response = await fetch('/api/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      cachedProgress = await response.json();
      return !cachedProgress.some(p => p.chapter_id === 108 && p.completed);
    } catch (e) { return true; }
  }
  
  if (currentChapterId < 100 && currentChapterId > 0) {
    // Main module: check previous chapter
  } else if (currentChapterId > 100) {
    // Prep module: check previous prep chapter
  } else {
    return false;
  }
  
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    const response = await fetch('/api/progress', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    cachedProgress = await response.json();
    const prevCompleted = cachedProgress.some(p => p.chapter_id === currentChapterId - 1 && p.completed);
    return !prevCompleted;
  } catch (e) {
    return true;
  }
}

// Get current exercise array (for audio) - uses chapterDataCache if available
function getCurrentExercise() {
  if (chapterDataCache && chapterDataCache.exercise) {
    return chapterDataCache.exercise;
  }
  return chapterExercises[currentChapterId] || defaultExercise.exercise;
}

// Render partitura
function renderPartitura(exercise) {
  const container = document.getElementById('partitura');
  const ts = typeof timeSignature !== 'undefined' ? timeSignature : 4;
  const notesPerBeat = typeof audioEngine !== 'undefined' ? audioEngine.notesPerBeat : 2;
  const notesPerMeasure = ts * notesPerBeat;
  
  // Polyrhythm chapters: show both hands pattern instead of single-line exercise
  if (currentChapterId === 44 || currentChapterId === 45) {
    renderPolyrhythmPartitura(container, currentChapterId);
    return;
  }
  
  let html = '';
  for (let m = 0; m < exercise.length; m += notesPerMeasure) {
    if (m > 0) html += '<span class="barline"></span>';
      html += '<span class="measure">';
    html += '<span class="notes-row">';
    for (let b = 0; b < notesPerMeasure && m + b < exercise.length; b++) {
      const i = m + b;
      const note = exercise[i];
      
      // Beat separator (every 4 notes)
      if (b > 0 && b % notesPerBeat === 0) {
        html += '<span class="beat-sep"></span>';
      }
      
    let className = 'nota';
    if (note === 'R' || note === 'r') {
      className += ' right';
    } else if (note === 'L' || note === 'l') {
      className += ' left';
    } else if (note === 'B' || note === 'b') {
      className += ' accent';
    }
    
    if (note === note.toLowerCase() && note !== '-' && note !== ' ') {
      className += ' soft';
    }
    
    let display = note;
    // Compound notes (flam "rR", drag "rrL", ruff "rrrL", buzz "RRRR"...):
    // render each hand as its own sub-note so it doesn't read like "RR LL"
    if (note.length > 1 && note !== '>' && note !== '!') {
      className = 'nota';
      const mainChar = note[note.length - 1];
      if (mainChar === 'R' || mainChar === 'r') className += ' right';
      else if (mainChar === 'L' || mainChar === 'l') className += ' left';
      else if (mainChar === 'B' || mainChar === 'b') className += ' accent';
      if (mainChar === mainChar.toLowerCase() && mainChar !== '-' && mainChar !== ' ') className += ' soft';
      display = note.split('').map(ch => {
        let c = 'flam-grace';
        if (ch === 'R' || ch === 'r') c += ' right';
        else if (ch === 'L' || ch === 'l') c += ' left';
        else if (ch === 'B' || ch === 'b') c += ' accent';
        if (ch === ch.toLowerCase() && ch !== '-' && ch !== ' ') c += ' soft';
        return `<span class="${c}">${ch}</span>`;
      }).join('');
    }
    
    html += `<span class="note-wrapper"><span class="${className}" data-index="${i}">${display}</span></span>`;
    }
    html += '</span>'; // end notes-row
    
    // Beat numbers below the measure
    html += '<span class="beat-labels-row">';
    for (let beat = 0; beat < ts; beat++) {
      html += `<span class="beat-indicator ${beat === 0 ? 'accent-beat' : ''}"></span>`;
    }
    html += '</span>';
    html += '</span>';
  }
  
  container.innerHTML = html;
}

// Render polyrhythm reference display (for chapters 44, 45)
function renderPolyrhythmRef(chapterId) {
  // No-op — polyrhythm is now rendered inside partitura via renderPolyrhythmPartitura
}

// Render polyrhythm as partitura (both hands visible)
function renderPolyrhythmPartitura(container, chapterId) {
  let config;
  if (chapterId === 44) {
    config = {
      title: 'Polirritmia 3 × 4',
      handD: { label: 'Mão D', positions: [0, 4, 8], symbol: 'R' },
      handE: { label: 'Mão E', positions: [0, 3, 6, 9], symbol: 'L' },
      total: 12
    };
  } else {
    config = {
      title: 'Polirritmia 4 × 3',
      handD: { label: 'Mão D', positions: [0, 3, 6, 9], symbol: 'R' },
      handE: { label: 'Mão E', positions: [0, 4, 8], symbol: 'L' },
      total: 12
    };
  }

  const makeRow = (hand, otherPositions) => {
    let html = '<div class="pr-row"><span class="pr-label">' + hand.label + '</span>';
    for (let i = 0; i < config.total; i++) {
      const isHit = hand.positions.includes(i);
      const isUnison = isHit && otherPositions.includes(i);
      const cls = isUnison ? 'pr-cell unison' : (isHit ? 'pr-cell hit' : 'pr-cell empty');
      html += '<span class="' + cls + '">' + (isHit ? hand.symbol : '·') + '</span>';
      if (i < config.total - 1 && (i + 1) % 4 === 0) html += '<span class="pr-separator"></span>';
    }
    html += '</div>';
    return html;
  };

  let html = '<div class="polyrhythm-ref">';
  html += '<div class="pr-title">' + config.title + '</div>';
  html += makeRow(config.handD, config.handE.positions);
  html += makeRow(config.handE, config.handD.positions);

  // Beat numbers
  html += '<div class="pr-beats">';
  for (let i = 0; i < config.total; i++) {
    html += '<span class="pr-beat-num">' + (i + 1) + '</span>';
    if (i < config.total - 1 && (i + 1) % 4 === 0) html += '<span class="pr-separator"></span>';
  }
  html += '</div>';

  html += '<div class="pr-note-label">';
  if (chapterId === 44) {
    html += 'Mão D toca <span class="hl">3 notas</span> (espaçadas) enquanto Mão E toca <span class="hl">4 notas</span>. Só coincidem na posição 1.';
  } else {
    html += 'Mão D toca <span class="hl">4 notas</span> enquanto Mão E toca <span class="hl">3 notas</span> (espaçadas). Só coincidem na posição 1.';
  }
  html += '</div></div>';

  container.innerHTML = html;
}

// Render weekly goal
let currentWeeklyGoalData = null;

function renderWeeklyGoal(goal) {
  const container = document.getElementById('goal-items');
  currentWeeklyGoalData = goal || [];
  
  if (!goal || goal.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary);">Defina suas metas semanais</p>';
    return;
  }
  
  container.innerHTML = `
    <p class="goal-hint">Sugestão semanal — clique em <strong>Aplicar</strong> para carregar no metrônomo. Muito rápido? Diminua o BPM.</p>
  ` + goal.map((item, i) => `
    <div class="goal-item" onclick="applyWeeklyGoal(${i})" title="Aplicar no metrônomo">
      <span class="day">${item.day}</span>
      <span class="bpm">${item.bpm} BPM</span>
      <span class="duration">${item.duration}</span>
      <button class="goal-apply-btn" onclick="event.stopPropagation();applyWeeklyGoal(${i})">Aplicar</button>
    </div>
  `).join('');
}

function parseDurationMinutes(dur) {
  if (!dur) return null;
  const m = String(dur).match(/(\d+)/);
  return m ? parseInt(m[1]) : null;
}

function getGoalForToday(goal) {
  if (!goal || goal.length === 0) return null;
  const today = new Date().getDay() + 1; // Dom=1, Seg=2 ... Sáb=7 (week starts Sunday)
  for (let i = 0; i < goal.length; i++) {
    const m = String(goal[i].day || '').match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m) {
      const s = parseInt(m[1]);
      const e = parseInt(m[2]);
      if (today >= s && today <= e) return goal[i];
    }
  }
  return goal[0];
}

function setTimerFromMinutes(mins) {
  const input = document.getElementById('timer-minutes');
  if (mins && input) {
    input.value = mins;
    if (typeof timerTotalSeconds !== 'undefined') {
      timerTotalSeconds = mins * 60;
      timerSeconds = timerTotalSeconds;
      if (typeof updateTimerDisplay === 'function') updateTimerDisplay();
    }
  }
}

function applyWeeklyGoal(index) {
  if (!currentWeeklyGoalData || !currentWeeklyGoalData[index]) return;
  const item = currentWeeklyGoalData[index];
  if (item.bpm && typeof setBPM === 'function') setBPM(item.bpm);
  setTimerFromMinutes(parseDurationMinutes(item.duration));
  showToast('🎯 Meta aplicada: ' + item.bpm + ' BPM / ' + item.duration + '. Muito rápido? Diminua o BPM.');
  const items = document.querySelectorAll('.goal-item');
  if (items[index]) {
    items[index].classList.remove('goal-flash');
    void items[index].offsetWidth;
    items[index].classList.add('goal-flash');
  }
}

// Auto-applies today's goal to the metronome (BPM + timer) on first visit
function applyWeeklyGoalSuggestion(goal) {
  if (!goal || goal.length === 0) return;
  if (typeof currentChapterId === 'undefined') return;
  const savedBpm = parseInt(localStorage.getItem('bpmCh_' + currentChapterId), 10);
  if (!isNaN(savedBpm) && savedBpm >= 40) return; // já tem BPM próprio → não sobrescrever
  const item = getGoalForToday(goal);
  if (!item) return;
  if (item.bpm && typeof setBPM === 'function') setBPM(item.bpm);
  setTimerFromMinutes(parseDurationMinutes(item.duration));
}

function showToast(msg) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._hide);
  toast._hide = setTimeout(() => toast.classList.remove('show'), 3500);
}

// Load chapter
async function loadChapter() {
  // Check if chapter is locked
  const locked = await isChapterLocked();
  
  if (locked) {
    document.getElementById('chapter-title').textContent = 'Capítulo Trancado';
    document.getElementById('chapter-subtitle').textContent = 'Complete o capítulo anterior para desbloquear';
    document.getElementById('objectives').innerHTML = '<p style="color: var(--text-secondary);">Você precisa completar o capítulo anterior primeiro.</p>';
    document.getElementById('concept').innerHTML = '';
    document.getElementById('diagram').innerHTML = '<p style="color: var(--text-secondary);">🔒</p>';
    document.getElementById('tips').innerHTML = '<div class="warning-box"><strong>⚠️ Bloqueado:</strong> Volte ao dashboard e complete o capítulo anterior.</div>';
    document.getElementById('partitura').innerHTML = '<p style="color: var(--text-secondary);">Capítulo trancado</p>';
    document.getElementById('goal-items').innerHTML = '';
    document.getElementById('complete-btn').disabled = true;
    document.getElementById('complete-btn').style.opacity = '0.5';
    return;
  }
  
  const data = await getCurrentExerciseData();
  chapterDataCache = data;
  
  document.getElementById('chapter-title').textContent = data.title;
  document.getElementById('chapter-subtitle').textContent = data.subtitle;
  document.getElementById('objectives').innerHTML = `
    <ul>${data.objectives.map(o => `<li>${o}</li>`).join('')}</ul>
  `;
  document.getElementById('concept').innerHTML = data.concept;
  document.getElementById('diagram').innerHTML = data.diagram;
  document.getElementById('tips').innerHTML = data.tips;
  
  // Extra exercise
  if (data.extra) {
    document.getElementById('extra-exercise').style.display = 'block';
    document.getElementById('extra-content').innerHTML = data.extra.content;
  }
  
  // Partitura
  renderPartitura(data.exercise);
  
  // Weekly goal
  renderWeeklyGoal(data.weeklyGoal);
  
  // Restore last BPM used for this chapter
  var savedBpm = parseInt(localStorage.getItem('bpmCh_' + currentChapterId), 10);
  if (savedBpm >= 40 && typeof setBPM === 'function') {
    setBPM(savedBpm);
  } else {
    // First time: auto-apply today's goal (BPM + timer) to the metronome
    applyWeeklyGoalSuggestion(data.weeklyGoal);
  }
  
  // Load and display progress for this chapter
  await loadChapterProgress();
  
  // Update navigation
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (currentChapterId === 100 || currentChapterId === 0) {
    prevBtn.style.visibility = 'hidden';
  } else {
    prevBtn.style.visibility = 'visible';
  }
  if ((currentChapterId >= 100 && currentChapterId < 108) || (currentChapterId < 56 && currentChapterId >= 0)) {
    nextBtn.style.visibility = 'visible';
  } else if (currentChapterId === 56 || currentChapterId === 108) {
    nextBtn.style.visibility = 'hidden';
  }
}

// Load progress for current chapter
async function loadChapterProgress() {
  if (cachedProgress) {
    const chapterProgress = cachedProgress.find(p => p.chapter_id === currentChapterId);
    updateChapterProgressUI(chapterProgress);
    cachedProgress = null;
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const response = await fetch('/api/progress', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const progress = await response.json();
    const chapterProgress = progress.find(p => p.chapter_id === currentChapterId);
    updateChapterProgressUI(chapterProgress);
  } catch (error) {
    console.error('Erro ao carregar progresso:', error);
    document.getElementById('detail-status').textContent = 'Erro ao carregar';
  }
}

function updateChapterProgressUI(chapterProgress) {
    
    if (chapterProgress) {
      // Update progress bar
      const percent = chapterProgress.completed ? 100 : Math.min(90, (chapterProgress.max_bpm / 120) * 100);
      document.getElementById('chapter-progress').textContent = `${Math.round(percent)}%`;
      document.getElementById('chapter-progress-bar').style.width = `${percent}%`;
      
      // Update progress details
      document.getElementById('detail-bpm').textContent = chapterProgress.max_bpm || '-';
      document.getElementById('detail-time').textContent = formatPracticeTime(chapterProgress.practice_time || 0);
      document.getElementById('detail-status').textContent = chapterProgress.completed ? '✓ Completo' : 'Em andamento';
      
      // Update complete button if already completed
      if (chapterProgress.completed) {
        document.getElementById('complete-btn').textContent = '✓ Completo!';
        document.getElementById('complete-btn').style.background = 'var(--success)';
      }
    } else {
      // No progress yet
      document.getElementById('chapter-progress').textContent = '0%';
      document.getElementById('chapter-progress-bar').style.width = '0%';
      document.getElementById('detail-bpm').textContent = '-';
      document.getElementById('detail-time').textContent = '-';
      document.getElementById('detail-status').textContent = 'Não iniciado';
    }
}

// Format practice time
function formatPracticeTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  return `${Math.round(seconds / 3600)}h`;
}

// Navigation
function prevChapter() {
  if (currentChapterId >= 100 && currentChapterId > 100) {
    currentChapterId--;
    window.location.href = `/curso?cap=${currentChapterId}`;
  } else if (currentChapterId === 100) {
    window.location.href = '/dashboard';
  } else if (currentChapterId > 0) {
    currentChapterId--;
    window.location.href = `/curso?cap=${currentChapterId}`;
  }
}

function nextChapter() {
  if (currentChapterId >= 100 && currentChapterId < 108) {
    currentChapterId++;
    window.location.href = `/curso?cap=${currentChapterId}`;
  } else if (currentChapterId === 108) {
    window.location.href = `/curso?cap=0`;
  } else if (currentChapterId < 56) {
    currentChapterId++;
    window.location.href = `/curso?cap=${currentChapterId}`;
  }
}

// Mark as complete
async function markComplete() {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  // Send delta practice time (not total) to avoid double-counting
  const practiceTime = (typeof getPracticeTime === 'function' ? getPracticeTime() : 0) - (typeof lastSavedPracticeTime !== 'undefined' ? lastSavedPracticeTime : 0);
  const maxBpm = typeof getMaxBpm === 'function' ? getMaxBpm() : bpm;
  
  try {
    const r = await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        chapterId: currentChapterId,
        completed: true,
        maxBpm: maxBpm,
        practiceTime: practiceTime
      })
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('POST /api/progress falhou com status', r.status, errText);
      alert('Erro ao salvar progresso (status ' + r.status + '). Veja o console da página para mais detalhes.');
      return;
    }
    
    document.getElementById('complete-btn').textContent = '✓ Completo!';
    document.getElementById('complete-btn').style.background = 'var(--success)';
    
    // Update last saved time to avoid double-counting on next save
    lastSavedPracticeTime = practiceTimeAccumulated;
    
    // Golden burst effect
    if (typeof window.triggerBurst === 'function') {
      const btn = document.getElementById('complete-btn');
      const rect = btn.getBoundingClientRect();
      window.triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 50);
    }
    
    // Refresh progress display
    await loadChapterProgress();
    
    // Check achievements
    await checkAchievements();
    
  } catch (error) {
    console.error('Error saving progress:', error);
    alert('Falha de rede ao salvar progresso. Verifique sua conexão e tente novamente.');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Save current chapter for next login redirect
  if (typeof currentChapterId !== 'undefined' && currentChapterId !== null) {
    localStorage.setItem('lastChapter', currentChapterId);
  }
  
  loadChapter();
  
  // Save progress when leaving page using keepalive fetch (reliable even during unload)
  window.addEventListener('beforeunload', () => {
    if (typeof practiceTimeAccumulated !== 'undefined' && typeof lastSavedPracticeTime !== 'undefined') {
      const delta = practiceTimeAccumulated - lastSavedPracticeTime;
      if (delta > 0) {
        const token = localStorage.getItem('token');
        if (token && typeof currentChapterId !== 'undefined') {
          fetch('/api/progress', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              chapterId: currentChapterId,
              completed: false,
              maxBpm: Math.max(maxBpmAchieved, bpm),
              practiceTime: delta
            }),
            keepalive: true
          }).catch(() => {});
        }
      }
    }
  });
});

// ============ ACHIEVEMENTS ============

async function checkAchievements() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('/api/achievements/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.new && data.new.length > 0) {
      // Show popup for each new achievement
      data.new.forEach((ach, i) => {
        setTimeout(() => showAchievementPopup(ach), i * 2000);
      });
    }
  } catch(e) {}
}

function showAchievementPopup(ach) {
  const overlay = document.createElement('div');
  overlay.className = 'ach-popup-overlay show';
  overlay.innerHTML = `
    <div class="ach-popup">
      <div class="ach-popup-icon">${ach.icon}</div>
      <h2>${ach.name}</h2>
      <p>${ach.desc}</p>
      <button onclick="this.closest('.ach-popup-overlay').remove()">Fechar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
