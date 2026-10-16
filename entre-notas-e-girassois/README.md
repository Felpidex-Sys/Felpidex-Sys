# 🌻 Entre Notas e Girassóis

Um minijogo narrativo **original**, em pixel art, inspirado na história de Luiz e Camily. Um jovem de 24 anos, uma igreja, a cadeira ao lado do baixo, uma amizade que começa devagar e uma conversa na fila da pizza.

**É um jogo completo de navegador, sem instalação, sem contas e sem bibliotecas externas.** A arte é desenhada por código em Canvas 2D, e a música é sintetizada pelo Web Audio API — também funciona offline.

## ▶️ Como jogar

1. Baixe estes arquivos juntos na mesma pasta: `index.html`, `styles.css` e `game.js`.
2. Dê dois cliques em **`index.html`** e clique em **Começar a história**.
3. Movimente Luiz com **WASD** ou **setas** e use **E** ou **Espaço** para falar com os personagens ou interagir com os objetos. Em celulares há controles de toque.
4. Responda às escolhas nas caixas de diálogo. Aperte **Esc** para fechar um puzzle.

Seu progresso é salvo automaticamente no navegador (`localStorage`). O botão de música liga/desliga a trilha original.

## ✨ O que já está implementado

- 5 capítulos: prólogo, chegada à igreja, conversas, WhatsApp e pizzaria;
- Cenários originais de pixel art gerados em tempo real;
- Luiz, Camily, Milene, Pedro, Matheus, Kevin, Gabriel, Rebecka, Miguel e a avó de Luiz;
- 3 puzzles: notas do baixo, mensagens no WhatsApp e pedidos de pizza;
- Escolhas de diálogo com consequências, barra de **interesse** e **confiança**;
- 3 finais diferentes, incluindo romance, tempo para se conhecer e amizade;
- Música instrumental original gerada no navegador;
- Diário desbloqueável, salvamento automático e controles de teclado/toque.

## 🎵 Música e arte

A trilha é feita com osciladores do próprio navegador (sine/triangle), e nenhum sample ou arte protegida de outros jogos foi utilizado. O estilo é uma homenagem **ao gênero de aventuras acolhedoras em pixel art**, sem copiar Stardew Valley.

## 🧩 Estrutura

```text
entre-notas-e-girassois/
├── index.html     Interface e telas
├── styles.css     Estética, diálogos e responsividade
├── game.js        Motor, arte, história, áudio e salvamento
└── README.md      Este guia
```

## 🌐 Publicar online

Você pode hospedar este projeto gratuitamente no GitHub Pages, Cloudflare Pages ou Netlify. O site é estático: não precisa de Node, npm ou backend. No GitHub Pages, publique a branch e diretório apropriados após colocar os arquivos na raiz de um repositório dedicado.

## 💛 Sobre a história

Inspirada em fatos reais, mas com algumas falas, desafios, escolhas e finais **ficcionais**. O interesse não substitui consentimento: Camily tem seu próprio tempo e merece ser respeitada independentemente do resultado.