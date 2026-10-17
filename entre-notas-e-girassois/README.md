# 🌻 Entre Notas e Girassóis

Um minijogo narrativo **original**, em pixel art, inspirado na história de Luiz e Camily. Um jovem de 24 anos, uma igreja, a cadeira ao lado do baixo, uma amizade que começa devagar e uma conversa na fila da pizza.

**Agora também é uma versão mobile/PWA para Android e iPhone: pode funcionar no navegador ou como atalho instalado na tela inicial quando publicado em HTTPS.** Continua sem contas, sem bibliotecas externas e sem backend. A arte é desenhada por código em Canvas 2D, e a música é sintetizada pelo Web Audio API — também funciona offline.

## ▶️ Como jogar

1. Baixe estes arquivos juntos na mesma pasta: `index.html`, `styles.css` e `game.js`.
2. Dê dois cliques em **`index.html`** e clique em **Começar a história**.
3. **No celular (modo retrato):** use o direcional de toque ou toque no chão para caminhar. Toque em um personagem/objeto para Luiz se aproximar e interagir automaticamente. O botão **Interagir** funciona quando estiver por perto. **No PC:** use WASD/setas e E/Espaço.
4. No celular, a câmera acompanha Luiz em um campo de visão ampliado; o interesse, a confiança e o objetivo ficam acima do cenário.
5. Responda às escolhas nas caixas de diálogo. Aperte **Esc** para fechar um puzzle no PC; no celular use **Voltar ao cenário**.

Seu progresso é salvo automaticamente no navegador (`localStorage`). O botão de música liga/desliga a trilha original.

## ✨ O que já está implementado

- 5 capítulos: prólogo, chegada à igreja, conversas, WhatsApp e pizzaria;
- Cenários originais de pixel art gerados em tempo real;
- Luiz, Camily, Milene, Pedro, Matheus, Kevin, Gabriel, Rebecka, Miguel e a avó de Luiz;
- 3 puzzles: notas do baixo, mensagens no WhatsApp e pedidos de pizza;
- Escolhas de diálogo com consequências, barra de **interesse** e **confiança**;
- 3 finais diferentes, incluindo romance, tempo para se conhecer e amizade;
- Música instrumental original gerada no navegador;
- Diário desbloqueável, salvamento automático, câmera retrato, direcional virtual, tocar para caminhar e botões acessíveis.

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

## 📱 Instalação no Android/iPhone

Para instalar como aplicativo, o jogo precisa ser **hospedado em HTTPS** (por exemplo, GitHub Pages). Abra o site no Chrome/Android e escolha **Instalar aplicativo** ou **Adicionar à tela inicial** no menu. No Safari/iPhone, use **Compartilhar > Adicionar à Tela de Início**. O service worker armazena os arquivos para funcionar offline após o primeiro acesso em HTTPS.

O ZIP também abre offline após extrair e abrir `index.html`, mas **não oferece instalação de PWA ao usar `file://`**. Os arquivos `index.html`, `game.js`, `styles.css`, `manifest.webmanifest`, `sw.js` e os ícones devem permanecer na mesma pasta.

### Publicação no GitHub Pages

Os arquivos estão no subdiretório `entre-notas-e-girassois/` da branch `jogo-luiz-camily`. Para publicar pelo GitHub Pages dessa branch, é necessário mover/copiá-los para a raiz da branch (ou para `/docs`) e escolher essa origem em **Settings > Pages**. Nada é publicado automaticamente apenas ao fazer commits.