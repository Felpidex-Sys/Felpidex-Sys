# 🌻 Entre Notas & Girassóis — Vila Velha em Miniatura (2.0)

Jogo original em pixel art sobre Luiz e Camily, expandido com um **mapa de bairros inspirado em Vila Velha**, progressão da história, escolhas de diálogos, plantio por dia e melhorias para a igreja.

## Como jogar

Abra `index.html` num navegador (Chrome/Edge) ou utilize o aplicativo Android criado a partir da pasta `android-app` no repositório. Os arquivos web não dependem de bibliotecas externas e também funcionam offline. A música começa depois da interação inicial.

- **Novo jogo → personagem:** nove jovens apresentados; **somente Luiz** é jogável nesta fase. Os demais são exibidos bloqueados.
- **Mapa de Vila Velha:** escolha um local pelo botão **Mapa** / **Bairros** ou visite os pontos do mapa como fases de Super Mario World. Glória e Sítio do Jânio (Ponta da Fruta) estão disponíveis. Praia da Costa, Itapuã, Centro e Barra do Jucu permanecem bloqueados.
- **Glória:** área caminhável, com casa de Luiz perto da Rua Dom Pedro II e igreja na região da Rua Maranguape. Caminhe entre as duas, converse com Milene e Kevin ou visite a loja solidária.
- **História:** os cinco capítulos originais permanecem, incluindo baixo, conversas com Camily, WhatsApp e pizzaria, com três finais. Use **Mapa → Continuar a história** para retomar a parte mais avançada.
- **Fazenda:** escolha um canteiro, compre sementes com moedas do jogo, avance os dias, colha ao amadurecer, venda na banca e compre itens virtuais para a igreja.
- **Cultos:** quarta, sábado e domingo. A **primeira ida à igreja em cada dia de culto** concede **+2 dias de crescimento** às plantas existentes; bônus limitado a uma vez por data no jogo.
- **Escolhas/vacilos:** respostas desrespeitosas reduzem interesse/confiança e retiram **dois dias de progresso das plantas** (até no mínimo zero). A data do calendário não retrocede. É uma mecânica simbólica de fantasia, não um julgamento moral de pessoas reais.
- **Dias:** são turnos simulados, não dias reais do relógio: clique em **☀ Passar dia** para avançar +1. Segunda é o dia inicial.
- **Controles:** WASD / setas para andar, `E` / espaço para interagir. No celular, use o direcional virtual, o botão **Interagir** ou toque no chão/objeto.
- **Salvar:** automaticamente no navegador (localStorage). O APK salva em armazenamento separado; limpar dados/desinstalar pode apagar o progresso.

## Plantio e economia

| Semente | Custo | Crescimento | Valor da venda |
| --- | ---: | ---: | ---: |
| 🍅 Tomate | 4 | 2 dias | 11 |
| 🌽 Milho | 7 | 3 dias | 19 |
| 🌻 Girassol | 10 | 4 dias | 29 |

Há 6 canteiros e 35 moedas iniciais. A loja da Glória vende itens para a igreja: Bíblias (25), microfone (65), cadeiras (90), teclado (160). Tudo é economia fictícia interna ao jogo.

## Sobre o mapa

O mapa do bairro foi criado como uma **interpretação simplificada, sem navegação de GPS**, baseada na localização geral dos logradouros Rua Maranguape e Rua Dom Pedro II, no bairro Glória, Vila Velha/ES. O traçado das quadras, a localização dos prédios e o caminho a pé são estilizados; **não são dados cartográficos exatos nem rota para uso real**. Para proteger a privacidade, **o endereço residencial completo e o número do imóvel não foram incluídos no código, arte nem repositório público**. O sítio é uma representação ficcional em Ponta da Fruta, sem localização exata fornecida.

Fontes de contexto geográfico:
- Rua Maranguape — https://www.ruacep.com.br/es/vila-velha/gloria/29122180-rua-maranguape/
- Rua Dom Pedro II — https://guiamapa.com/es/vila-velha/gloria/rua-dom-pedro-ii
- Mapa municipal de bairros (PMES) — https://observatorio.sesp.es.gov.br/Media/ObservatorioSESP/MAPAS/DIVISAO_ADMINISTRATIVA_PMES_VILA_VELHA.pdf

## Estrutura

- `index.html`: interface, cenas, painel de seleção e diálogos
- `styles.css`: layout desktop e mobile
- `game.js`: canvas, mapa aberto, personagens, capítulo, plantio, economia e salvamento
- `sw.js`, `manifest.webmanifest`, ícones: PWA quando hospedado em HTTPS
- `android-app/`: wrapper Android WebView e workflow GitHub Actions para gerar APK de desenvolvimento

Esta é uma obra ficcional baseada na história contada pelo usuário, sem intenções de retratar precisamente pessoas, locais privados ou práticas religiosas reais. 🌻