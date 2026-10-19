/* Entre Notas e Girassóis — um jogo original em Canvas, sem dependências externas. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.imageSmoothingEnabled = false;
  const SAVE_KEY = 'entre-notas-girassois-save-v1'; // Mantém compatibilidade com os saves anteriores.
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const rnd = (seed) => { let x = Math.sin(seed * 57.73 + 9.19) * 43758.5453; return x - Math.floor(x); };
  const chapterInfo = [
    {name:'Antes de tudo', label:'PRÓLOGO • UMA VIDA EM SILÊNCIO', loc:'QUARTO DE LUIZ', text:'Luiz tinha 24 anos e seguia os dias no automático. Mas um novo capítulo estava para começar.', objective:'Aproxime-se da Bíblia, sobre a escrivaninha.', tip:'Use WASD/setas para andar e E para interagir.', quote:'“Talvez a vida ainda tenha surpresas guardadas para mim.”'},
    {name:'A cadeira vazia', label:'CAPÍTULO 1 • ACORDES E RECOMEÇOS', loc:'IGREJA', text:'Um jovem no baixo, uma igreja cheia de vozes e alguém que acabava de chegar.', objective:'Encontre o baixo e prepare a música do culto.', tip:'A cadeira ao lado de Luiz ainda está vazia.', quote:'“Mesmo sem sentir muita coisa, continuei tocando.”'},
    {name:'Uma conversa de cada vez', label:'CAPÍTULO 2 • MESES DEPOIS', loc:'IGREJA', text:'Camily começou a cantar e passou a se sentar ao lado de Luiz. Conversas tímidas se tornaram possíveis.', objective:'Converse com Camily. Fale com os outros jovens, se quiser.', tip:'Milene conhece os dois e pode contar um pouco da história.', quote:'“Não sabia puxar assunto. Mas queria aprender a ouvi-la.”'},
    {name:'Três pontinhos digitando...', label:'CAPÍTULO 3 • AS PRIMEIRAS MENSAGENS', loc:'QUARTO DE LUIZ • NOITE', text:'As conversas da igreja continuaram pelo celular. Cada mensagem tinha um pouco de coragem.', objective:'Use o celular para conversar com Camily no WhatsApp.', tip:'Boas conversas não exigem frases perfeitas. Exigem sinceridade.', quote:'“Fiquei olhando para a tela antes de apertar enviar.”'},
    {name:'Na fila da pizza', label:'CAPÍTULO 4 • A NOITE DO CONVITE', loc:'PIZZARIA', text:'Luiz convidou Camily para sair com a avó dele, Milene e Pedro. Uma conversa inesperada aguardava.', objective:'Ajude a lembrar os pedidos no balcão da pizzaria.', tip:'Você pode conversar com a avó, Milene e Pedro antes de pedir.', quote:'“Engraçado: no meio de uma fila, encontrei a coragem que faltava.”'}
  ];

  const freshState = () => ({version:1,chapter:0,interest:12,trust:18,position:{x:454,y:385},flags:{},notes:[],ending:null,
    area:'world',selectedCharacter:'luiz',day:1,coins:35,crops:Array(6).fill(null),inventory:{},purchases:[],prayedDays:{},mistakes:0});
  const seedTypes = [
    {id:'tomate',name:'Tomate',icon:'🍅',days:2,price:4,sale:11,color:'#d66e66'},
    {id:'milho',name:'Milho',icon:'🌽',days:3,price:7,sale:19,color:'#eac36e'},
    {id:'girassol',name:'Girassol',icon:'🌻',days:4,price:10,sale:29,color:'#edbb66'}
  ];
  const churchItems=[{id:'biblias',name:'Bíblias para os jovens',price:25,icon:'📖'},
    {id:'microfone',name:'Microfone para o louvor',price:65,icon:'🎤'},
    {id:'cadeiras',name:'Cadeiras novas',price:90,icon:'🪑'},
    {id:'teclado',name:'Teclado da igreja',price:160,icon:'🎹'}];
  const weekdays=['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
  const cast=[['luiz','Luiz','🎸'],['camily','Camily','🎤'],['milene','Milene','🌸'],
    ['pedro','Pedro','🎮'],['matheus','Matheus','🏀'],['kevin','Kevin','👓'],
    ['gabriel','Gabriel','✨'],['rebecka','Rebecka','🎹'],['miguel','Miguel','🥁']];
  const plotCoords=[{x:170,y:335},{x:330,y:335},{x:490,y:335},{x:170,y:460},{x:330,y:460},{x:490,y:460}];
  let state = freshState(), mode = 'intro';
  let keys = {}, touchMove = null, tapGoal = null, elapsed = 0, toastTimer = null, frames = 0;
  // A câmera recorta a cena no formato retrato sem distorcer a pixel art.
  const isPortraitGame = () => window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches;
  const getCamera = () => {
    if (!isPortraitGame()) return {x:0, width:W, scale:1};
    const visibleWidth = 405; // 540px de altura do mundo / proporção 3:4
    return {x:clamp(state.position.x-visibleWidth/2,0,W-visibleWidth),width:visibleWidth,scale:720/H};
  };
  function configureCanvas() {
    const portrait=isPortraitGame();
    canvas.width=portrait?540:W;
    canvas.height=portrait?720:H;
    ctx.imageSmoothingEnabled=false;
    tapGoal=null;
  }
  configureCanvas();
  window.addEventListener('resize',configureCanvas);
  window.addEventListener('orientationchange',configureCanvas);
  let musicOn = false, ac = null, tuneTimer = null, tuneStep = 0;
  const noteHz = {C:261.63,D:293.66,E:329.63,F:349.23,G:392.00,A:440,B:493.88};
  const melody = ['E','G','A',null,'G','E','D',null,'C','E','G','E','D',null,'C',null,
                  'D','E','G',null,'A','G','E',null,'D','E','D','C','C',null,'G',null];
  const bassline = ['C',null,null,null,'G',null,null,null,'A',null,null,null,'F',null,'G',null];

  function oscillator(note, start, duration, gain, type='triangle', octave=1) {
    if (!ac || !note) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(noteHz[note] * octave, start);
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(gain, start + .012);
    g.gain.exponentialRampToValueAtTime(.001, start + duration);
    o.connect(g); g.connect(ac.destination); o.start(start); o.stop(start + duration + .02);
  }
  function ensureAudio() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume().catch(()=>{});
    } catch(e) { musicOn = false; }
  }
  function musicTick() {
    if (!musicOn || !ac || ac.state !== 'running') return;
    const n = tuneStep++ % melody.length, t = ac.currentTime + .02;
    if (melody[n]) oscillator(melody[n],t,.33,.035,'sine',2);
    if (n % 4 === 0) oscillator(bassline[n%16],t,.68,.027,'triangle',.5);
    if (n % 8 === 0) oscillator('C',t,.8,.01,'sine',1);
  }
  function setMusic(on) {
    musicOn = !!on;
    if (musicOn) {ensureAudio(); if (!tuneTimer) tuneTimer = setInterval(musicTick,260);}
    else if (tuneTimer) {clearInterval(tuneTimer);tuneTimer = null;}
    $('soundToggle').textContent = musicOn ? '♫ Música: ligada' : '♫ Música: desligada';
    $('soundToggle').setAttribute('aria-pressed', String(musicOn));
  }
  function littleChime() {
    if (!musicOn) return;
    ensureAudio(); if (!ac || ac.state !== 'running') return;
    ['C','E','G','C'].forEach((n,i)=>oscillator(n,ac.currentTime+i*.105,.28,.055,'sine',i===3?4:2));
  }
  $('soundToggle').addEventListener('click',()=>setMusic(!musicOn));

  function persist() { try {localStorage.setItem(SAVE_KEY, JSON.stringify(state));} catch (_){} }
  function loadSave() {
    try {
      const v=JSON.parse(localStorage.getItem(SAVE_KEY));
      if(v?.version===1&&Number.isInteger(v.chapter)&&v.chapter>=0&&v.chapter<=4&&v.position&&v.flags){
        // Saves antigos continuam na história; novos iniciam no mapa.
        return {...freshState(),...v,area:v.area||'story',crops:Array.isArray(v.crops)&&v.crops.length===6?v.crops:Array(6).fill(null),
          inventory:v.inventory||{},purchases:v.purchases||[],prayedDays:v.prayedDays||{}};
      }
    } catch(_){} return null;
  }
  function hideAll() { $('characterLayer').classList.add('hidden'); $('introScreen').classList.add('hidden'); $('dialogLayer').classList.add('hidden'); $('puzzleLayer').classList.add('hidden'); $('endingScreen').classList.add('hidden'); }
  function updateHUD() {
    const inf = chapterInfo[state.chapter];
    const worldLabels={world:['MAPA DA CIDADE • VILA VELHA','ESCOLHA UM BAIRRO'],
      gloria:['EXPLORAÇÃO • BAIRRO DA GLÓRIA','GLÓRIA, VILA VELHA'],farm:['FAZENDA • SÍTIO DO JÂNIO','PONTA DA FRUTA'],
      story:[inf.label,inf.loc]};
    $('chapterLabel').textContent=worldLabels[state.area||'story'][0];
    $('locationLabel').textContent=worldLabels[state.area||'story'][1];
    $('chapterNumber').textContent = state.area==='story'?String(state.chapter).padStart(2,'0'):'↗';
    $('chapterName').textContent = state.area==='story'?inf.name:state.area==='world'?'Vila Velha em miniatura':state.area==='gloria'?'Pelas ruas da Glória':'Sítio do Jânio'; $('chapterDescription').textContent = state.area==='story'?inf.text:state.area==='world'?'Explore bairros como se fossem fases conectadas.':'Explore à vontade, cuide da fazenda e avance na história.';
    $('interestValue').textContent = state.interest+'%'; $('interestBar').style.width = state.interest+'%';
    $('mobileInterest').textContent=state.interest+'%'; $('mobileInterestBar').style.width=state.interest+'%';
    $('trustValue').textContent = state.trust+'%'; $('trustBar').style.width = state.trust+'%';
    $('mobileTrust').textContent=state.trust+'%'; $('mobileTrustBar').style.width=state.trust+'%';
    $('diaryQuote').textContent = state.area==='story'?inf.quote:'“O que a gente semeia com cuidado pode florescer com o tempo.”';
    $('objective').textContent = getObjective(); $('tip').textContent = state.area==='story'?inf.tip:'Ande usando as setas ou toque perto dos locais. Pressione E para interagir.';
    $('mobileObjective').textContent='✦ '+getObjective();
    const prog=$('chapterProgress');prog.replaceChildren();
    for(let i=0;i<5;i++){let x=document.createElement('i');if(i<=state.chapter)x.className='active';prog.appendChild(x);}
    $('dayBadge').textContent=`📅 Dia ${state.day} • ${weekdays[(state.day-1)%7]}`;
    $('coinsBadge').textContent=`🪙 ${state.coins} moedas`;
    $('harvestBadge').textContent=`🌱 ${state.crops.filter(Boolean).length} cultivos`;
    const saved=Object.entries(state.inventory).filter(([,v])=>v>0).map(([k,v])=>`${seedTypes.find(x=>x.id===k)?.icon||'🌾'} ${v}`).join(' · ');
    $('farmSidebar').textContent=`Cultivos: ${state.crops.filter(Boolean).length}/6 · Colheita: ${saved||'vazia'} · Itens para igreja: ${state.purchases.length}/4 · Vacilos: ${state.mistakes}`;
  }
  function getObjective() {
    if(state.area==='world')return 'Escolha Glória ou Ponta da Fruta; os outros bairros virão depois.';
    if(state.area==='gloria')return 'Saia de casa e caminhe até a igreja pela Glória. Conheça os moradores!';
    if(state.area==='farm')return 'Plante, passe dias, colha e venda no Sítio do Jânio.';
    if(state.ending)return 'A história chegou a um final, mas Vila Velha segue aberta!';
    if(state.chapter===0)return 'Aproxime-se da Bíblia na escrivaninha.';
    if(state.chapter===1)return 'Toque as notas do baixo para o culto começar.';
    if(state.chapter===2)return 'Puxe assunto com Camily, sentada ao lado de Luiz.';
    if(state.chapter===3)return 'Interaja com o celular e responda às mensagens.';
    return state.flags.pizzaDone ? 'A conversa mais importante está prestes a acontecer...' : 'Vá até o balcão e ajude com os pedidos de pizza.';
  }
  function changeStats(interest=0,trust=0) {
    state.interest = clamp(state.interest+interest,0,100);
    state.trust = clamp(state.trust+trust,0,100);
    if(interest>0||trust>0) toast(`${interest>0?'♡ +'+interest+' interesse ':''}${trust>0?'✧ +'+trust+' confiança':''}`);
    else if(interest<0||trust<0) { registerMistake();toast('Vacilo! As plantações perderam 2 dias de progresso.'); }
    updateHUD();persist();
  }
  function toast(text) {
    const t=$('toast');t.textContent=text;t.classList.remove('hidden');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add('hidden'),2700);
  }
  function diary(title,paragraph) {
    if(!state.notes.some(n=>n.title===title)){state.notes.push({title,paragraph});persist();}
  }
  function setChapter(index) {
    state.storyMaxChapter=Math.max(state.storyMaxChapter||0,index);state.chapter=index;state.area='story';tapGoal=null;
    state.position= index===0 ? {x:460,y:423} : index===1 ? {x:275,y:420} : index===2 ? {x:430,y:416} : index===3 ? {x:455,y:421} : {x:465,y:433};
    mode='play';hideAll();updateHUD();persist();littleChime();
  }
  function showCharacters(){
    hideAll();mode='character';$('characterLayer').classList.remove('hidden');
    const list=$('characterCards');list.replaceChildren();
    cast.forEach(([id,name,emoji])=>{
      const b=document.createElement('button');b.type='button';b.className='character-option';b.disabled=id!=='luiz';
      const face=document.createElement('span');face.className='avatar-mini';
      face.style.setProperty('--skin',outfits[id].skin);face.style.setProperty('--hair',outfits[id].hair);face.style.setProperty('--shirt',outfits[id].shirt);
      const hair=document.createElement('i');hair.className='avatar-hair';
      const eyes=document.createElement('i');eyes.className='avatar-eyes';
      const shirt=document.createElement('i');shirt.className='avatar-shirt';
      face.append(hair,eyes,shirt);
      const title=document.createElement('strong');title.textContent=name;
      const sub=document.createElement('small');sub.textContent=id==='luiz'?'JOGAR AGORA':'EM BREVE 🔒';
      b.append(face,title,sub);
      if(id==='luiz')b.onclick=()=>{state.selectedCharacter=id;enterArea('world');say('Narrador','Vila Velha está esperando! Comece pelas ruas da Glória ou vá até o Sítio do Jânio, em Ponta da Fruta. O mundo é seu para explorar.');};
      list.appendChild(b);
    });
  }
  function start(reset) {
    state = reset ? freshState() : (loadSave()||freshState()); tapGoal=null;
    hideAll();mode='play';setMusic(true);updateHUD();
    if(reset){showCharacters();return;}
    if(state.area==='story'&&state.chapter===0&&!state.flags.introSeen){
      state.flags.introSeen=true;persist();say('Narrador','Luiz, 24 anos, seguia os dias no automático. Mas uma nova história começava.',[['Continuar',()=>{}]]);
    } else if(state.area==='story'&&state.chapter===3&&!state.flags.phoneStory){phoneWelcome();}
  }
  $('characterBack').addEventListener('click',()=>{hideAll();mode='intro';$('introScreen').classList.remove('hidden');});
  $('charactersToggle').addEventListener('click',showCharacters);
  $('exploreAfterEnding').addEventListener('click',()=>enterArea('world'));
  $('newGame').addEventListener('click',()=>start(true));
  $('continueGame').addEventListener('click',()=>start(false));
  $('playAgain').addEventListener('click',()=>start(true));
  if(loadSave())$('continueGame').classList.remove('hidden');

  function say(speaker,line,choices=[['Continuar',()=>{}]]) {
    mode='dialog'; $('characterLayer').classList.add('hidden'); $('dialogLayer').classList.remove('hidden'); $('puzzleLayer').classList.add('hidden');
    $('speakerName').textContent=speaker;$('dialogText').textContent=line;
    $('dialogHint').textContent=choices.length>1?'ESCOLHA SUA RESPOSTA':'CONTINUE A HISTÓRIA';
    const list=$('dialogChoices');list.replaceChildren();
    choices.forEach(([label, fn],index)=>{
      const b=document.createElement('button');b.type='button';b.className='choice-button';
      const k=document.createElement('b');k.textContent=(index+1)+'.';b.appendChild(k);b.appendChild(document.createTextNode(' '+label));
      b.addEventListener('click',()=>{ $('dialogLayer').classList.add('hidden');mode='play';if(typeof fn==='function')fn();persist();updateHUD();});
      list.appendChild(b);
    });
  }
  function puzzle({kicker='PEQUENO DESAFIO',title,description,render}) {
    mode='puzzle';$('dialogLayer').classList.add('hidden');$('puzzleLayer').classList.remove('hidden');
    $('puzzleKicker').textContent=kicker;$('puzzleTitle').textContent=title;$('puzzleDescription').textContent=description;
    const content=$('puzzleContent');content.replaceChildren();render(content);
  }
  function closePuzzle(){ $('puzzleLayer').classList.add('hidden');mode='play'; }
  $('puzzleClose').addEventListener('click',closePuzzle);

  function beginBass() {
    if(state.flags.tuned)return say('Luiz','A música já está pronta. Cada nota parece encontrar seu lugar.');
    const wanted=['D','A','G','D'];let entered=[];
    puzzle({kicker:'PUZZLE 01 • O BAIXO',title:'Uma melodia de esperança ♪',description:'Luiz vai tocar no culto. Encontre a sequência de notas correta. A dica está no papel preso ao amplificador: RÉ → LÁ → SOL → RÉ.',render:root=>{
      const seq=document.createElement('div');seq.className='music-sequence';
      const status=document.createElement('p');status.className='puzzle-status';status.textContent='Toque as quatro notas na ordem certa.';
      const keys=document.createElement('div');keys.className='music-keys';
      for(let i=0;i<4;i++){const k=document.createElement('span');k.className='note-chip';k.textContent='♪';seq.appendChild(k);}
      ['D','G','A','C'].forEach(n=>{
        const b=document.createElement('button');b.textContent=({D:'RÉ',G:'SOL',A:'LÁ',C:'DÓ'})[n];b.setAttribute('aria-label','Tocar nota '+b.textContent);
        b.addEventListener('click',()=>{
          ensureAudio(); if(ac&&ac.state==='running')oscillator(n,ac.currentTime,.27,.07,'triangle',.5);
          entered.push(n);[...seq.children].forEach((el,i)=>{el.textContent=entered[i]||'♪';el.classList.toggle('done',i<entered.length);});
          if(entered.length===wanted.length) {
            if(entered.every((x,i)=>x===wanted[i])) {
              state.flags.tuned=true;diary('Uma nota por vez','Naquele culto, eu toquei baixo sem imaginar que, entre tantos rostos, alguém estava tentando reconstruir a própria alegria.');
              changeStats(0,4);closePuzzle();
              say('Narrador','A música enche a igreja. Camily acabara de chegar depois de um relacionamento que a feriu muito. Por fora, continuava doce e gentil; por dentro, precisava de tempo para se curar.',[
                ['Avançar alguns meses →',()=>{setChapter(2);say('Narrador','Alguns meses depois, Camily começa a cantar. Ela agora ocupa a cadeira ao lado de Luiz, perto do púlpito. Rebecka está no teclado à frente e Miguel toca bateria bem próximo.');}]
              ]);
            } else {entered=[];[...seq.children].forEach(el=>{el.textContent='♪';el.classList.remove('done');});status.textContent='Quase! Tente de novo: RÉ, LÁ, SOL, RÉ.';}
          }
        });keys.appendChild(b);
      });
      root.append(seq,status,keys);
    }});
  }
  function meetCamily() {
    if(state.flags.talkedCamily)return say('Camily','Obrigada pela conversa, Luiz. Foi bom te conhecer um pouquinho mais. ♡');
    say('Camily','Oi, Luiz! Gostei da música hoje. Você costuma tocar baixo em todos os cultos?',[
      ['Toco sim! E você canta muito bem. Como foi sua semana?',()=>resolveCamily(16,10,'É bom conversar assim. Camily sorri e, aos poucos, pergunta sobre a vida dele.')],
      ['Sim... eu fico meio sem assunto, mas queria te conhecer melhor.',()=>resolveCamily(12,12,'A sinceridade deixa Camily à vontade. Ela percebe que Luiz só está nervoso.')],
      ['Sim. Por que você nunca puxou conversa comigo antes?',()=>resolveCamily(-3,-5,'Camily fica sem jeito. Talvez seja melhor conversar sem cobranças.')]
    ]);
  }
  function resolveCamily(int,tru,reply) {
    state.flags.talkedCamily=true;changeStats(int,tru);
    diary('Uma cadeira ao lado','Depois de vários encontros tímidos, ela se sentou perto de mim para cantar. Não aconteceu nada grandioso — apenas começamos a conversar.');
    say('Narrador',reply+' Milene já falava bem de Luiz para Camily, mas ela não queria namorar naquele momento, e Luiz precisava respeitar isso.',[
      ['Alguns dias depois, o celular vibra →',()=>{setChapter(3);phoneWelcome();}]
    ]);
  }
  function phoneWelcome() {
    if(state.flags.phoneStory)return;
    state.flags.phoneStory=true;persist();
    say('Narrador','Depois de algumas tentativas de conversa na igreja, Luiz e Camily passam a conversar pelo WhatsApp. Ela ficou curiosa: aquele garoto tímido parecia ter um coração gentil.',[
      ['Pegar o celular',()=>{state.position={x:665,y:375};beginPhone();}]
    ]);
  }
  const phoneSteps = [
    {incoming:'Camily: Oii! Chegou bem em casa? 😊',choices:[
      {label:'Oii, cheguei sim! E você? Foi bom conversar hoje.',int:8,tru:7,answer:'Camily: Cheguei também! E foi bom mesmo 😊'},
      {label:'Cheguei. E aí?',int:1,tru:0,answer:'Camily: Ah, que bom kkk'},
      {label:'Cheguei. Você ficou pensando em mim?',int:-4,tru:-5,answer:'Camily: A gente ainda está se conhecendo, né?'}
    ]},
    {incoming:'Camily: Eu passei por umas coisas difíceis... não quero apressar nada.',choices:[
      {label:'Eu entendo. Podemos conversar sem pressa, no seu tempo.',int:8,tru:11,answer:'Camily: Obrigada por entender de verdade. 💛'},
      {label:'Tudo bem. Prefiro ir com calma também.',int:5,tru:8,answer:'Camily: Fico feliz de você entender.'},
      {label:'Mas eu posso fazer você mudar de ideia, né?',int:-8,tru:-12,answer:'Camily: Não é assim que funciona, Luiz...'}
    ]},
    {incoming:'Camily: E o que você costuma fazer quando não está na igreja?',choices:[
      {label:'Queria te convidar pra uma pizza com minha avó, Milene e Pedro. Topa?',int:10,tru:7,answer:'Camily: Com a galera? Pode ser! Gostei da ideia 🍕'},
      {label:'Gosto de música. A gente podia conversar um dia. Quem sabe uma pizza em grupo?',int:7,tru:8,answer:'Camily: Acho uma boa!'},
      {label:'Acho que a gente devia sair sozinho logo.',int:-3,tru:-6,answer:'Camily: Por enquanto prefiro sair em grupo.'}
    ]}
  ];
  function beginPhone() {
    let step=state.flags.phoneStep||0;
    if(step>=3)return say('Luiz','Já confirmei com a Camily. Hoje é dia de pizza!');
    const info=phoneSteps[step];
    puzzle({kicker:`PUZZLE 02 • MENSAGENS ${step+1}/3`,title:'Digitando... 💬',description:info.incoming,render:root=>{
      const box=document.createElement('div');box.className='choice-list';
      info.choices.forEach((c,i)=>{
        const b=document.createElement('button');b.className='choice-button';b.textContent=`${i+1}. ${c.label}`;
        b.addEventListener('click',()=>{
          state.flags.phoneStep=step+1;changeStats(c.int,c.tru);closePuzzle();
          say('WhatsApp',c.answer,[
            [step===2?'Ir à pizzaria →':'Responder a próxima mensagem →',()=>{
              if(step===2){diary('Três pontinhos','A conversa saiu da igreja e foi para o celular. Em vez de tentar impressionar, fui aprendendo a ser eu mesmo.');setChapter(4);say('Narrador','A avó de Luiz, Milene e Pedro já estão na pizzaria. Camily também veio. Agora Luiz precisa buscar o pedido no balcão.');}
              else beginPhone();
            }]
          ]);
        });box.appendChild(b);
      });root.appendChild(box);
    }});
  }
  const pizzaSequence=[
    {name:'Vó de Luiz',correct:'Calabresa'},
    {name:'Milene',correct:'Quatro queijos'},
    {name:'Pedro',correct:'Frango com catupiry'},
    {name:'Camily',correct:'Marguerita'}
  ];
  function beginPizza() {
    if(state.flags.pizzaDone)return say('Atendente','Os pedidos estão saindo do forno! Bom apetite.');
    let step=0,mistakes=0;
    const flavors=['Calabresa','Marguerita','Frango com catupiry','Quatro queijos'];
    const renderStep=()=>{
      puzzle({kicker:'PUZZLE 03 • OS PEDIDOS',title:'Quem pediu qual pizza? 🍕',description:`Pedido ${step+1} de 4 — Qual sabor ${pizzaSequence[step].name} escolheu?`,render:root=>{
        const msg=document.createElement('div');msg.className='pizza-step';msg.textContent='Dica: avó = calabresa • Milene = quatro queijos • Pedro = frango • Camily = marguerita';
        const choices=document.createElement('div');choices.className='pizza-choices';
        flavors.forEach(flavor=>{
          const b=document.createElement('button');b.textContent=flavor;
          b.addEventListener('click',()=>{
            if(flavor!==pizzaSequence[step].correct){mistakes++;toast('Ops! Essa não é a pizza certa. Tente novamente.');return;}
            step++;
            if(step<4)renderStep();else {
              state.flags.pizzaDone=true;changeStats(mistakes===0?8:4,5);closePuzzle();
              state.position={x:715,y:400};
              diary('Atrás de mim, na fila','Enquanto eu esperava as pizzas, ela apareceu atrás de mim. E uma conversa inesperada começou por causa de algo que a minha avó disse.');
              say('Camily','Luiz... sua avó me contou uma coisa. Disse que você gosta de mim... e que até queria me dar um perfume. É verdade?',[
                ['Respirar fundo e falar com sinceridade.',()=>confession()],
                ['Admitir que fiquei sem jeito com a surpresa.',()=>{changeStats(0,3);confession();}]
              ]);
            }
          });choices.appendChild(b);
        });root.append(msg,choices);
      }});
    };renderStep();
  }
  function confession() {
    say('Luiz','É... eu não esperava que minha avó contasse. Mas queria conversar sobre isso com você.',[
      ['É verdade. Eu gosto de você e queria te conhecer melhor, sem pressa.',()=>finish('sincere',15,12)],
      ['Eu gosto de você, mas não precisa responder agora. Respeito seu tempo.',()=>finish('gentle',9,17)],
      ['Acho que ainda estou confuso. Prefiro que a gente continue como amigos.',()=>finish('friends',0,7)]
    ]);
  }
  function showEnding(end){
    mode='end';$('endingScreen').classList.remove('hidden');$('endingEyebrow').textContent=end.eyebrow;
    $('endingTitle').textContent=end.title;$('endingDescription').textContent=end.desc;
    $('endingSummary').textContent=`♡ Interesse ${state.interest}% · ✧ Confiança ${state.trust}% · 🪙 ${state.coins} moedas · ${state.purchases.length} melhorias`;
    updateHUD();
  }
  function finish(choice,int,tru) {
    changeStats(int,tru);
    const good=state.interest>=57&&state.trust>=48;
    let ending;
    if(choice==='friends')ending='amizade';
    else if(good)ending='novo-comeco';
    else if(state.trust>=35&&state.interest>=32)ending='devagar';
    else ending='amizade';
    const texts={
      'novo-comeco':{
        eyebrow:'FINAL 01 DE 3 • O PRIMEIRO SIM',title:'O começo de nós dois',
        line:'Camily fica surpresa. Por um instante, procura as palavras. Então abre um sorriso tímido.',
        answer:'“Eu também tenho interesse em te conhecer melhor, Luiz.”',
        desc:'A conversa na fila da pizza abre um caminho novo. Sem pressa, com carinho e respeito, Luiz e Camily começam a descobrir o que pode florescer entre os dois. Não é o fim da história: é só o primeiro capítulo. ♡'
      },
      'devagar':{
        eyebrow:'FINAL 02 DE 3 • AINDA EXISTE TEMPO',title:'No tempo das flores',
        line:'Camily agradece pela sinceridade. Ainda há feridas cicatrizando e perguntas sem resposta.',
        answer:'“Gosto de conversar com você, mas podemos ir com calma?”',
        desc:'Eles continuam se conhecendo, sem promessas antecipadas. Às vezes, o carinho cresce quando os dois têm espaço para escolher. Uma amizade bonita pode se tornar algo mais — ou simplesmente continuar bonita.'
      },
      'amizade':{
        eyebrow:'FINAL 03 DE 3 • UM ENCONTRO IMPORTANTE',title:'Um laço que também importa',
        line:'Camily sorri, com gentileza. Nem toda conversa precisa virar namoro para ter valor.',
        answer:'“Obrigada por ser sincero comigo. Quero que a gente fique bem.”',
        desc:'Luiz aprende a se expressar e a respeitar sentimentos que não controla. Eles seguem com amizade e novas possibilidades pela frente. Todo recomeço exige coragem — inclusive a de aceitar um caminho diferente.'
      }
    };
    const end=texts[ending];state.ending=ending;state.endingData=end;persist();
    say('Camily',`${end.line} ${end.answer}`,[['Ver o final da história 🌻',()=>showEnding(end)]]);
  }

  // Vila Velha: bairros conectados, cultivo por turnos de um dia e escolhas com consequências.
  function enterArea(area){
    state.area=area;tapGoal=null;touchMove=null;keys={};mode='play';hideAll();
    state.position=area==='world'?{x:310,y:405}:area==='gloria'?{x:750,y:405}:area==='farm'?{x:735,y:434}:{x:460,y:423};
    updateHUD();persist();littleChime();
  }
  function showMap(){
    puzzle({kicker:'🗺 MAPA DE VILA VELHA',title:'Escolha o próximo destino',
      description:'Os bairros funcionam como fases conectadas. A Glória e Ponta da Fruta estão disponíveis; os outros aparecem como futuras expansões.',render:root=>{
        const opts=document.createElement('div');opts.className='choice-list';
        const nodes=[['🌇 Glória • casa, igreja e jovens','gloria'],['🌻 Ponta da Fruta • Sítio do Jânio','farm'],
          ['📖 Continuar a história','story'],['🧭 Ver mapa geral','world']];
        nodes.forEach(([name,id])=>{const b=document.createElement('button');b.className='choice-button';b.textContent=name;
          b.onclick=()=>{closePuzzle();if(id==='story')setChapter(state.storyMaxChapter??state.chapter);else enterArea(id);};opts.appendChild(b);});
        ['🔒 Praia da Costa (em breve)','🔒 Itapuã (em breve)','🔒 Centro (em breve)','🔒 Barra do Jucu (em breve)'].forEach(name=>{
          const b=document.createElement('button');b.className='choice-button';b.textContent=name;b.disabled=true;b.style.opacity='.48';opts.appendChild(b);
        });root.append(opts);
      }});
  }
  $('mapToggle').addEventListener('click',showMap);
  $('worldNav').addEventListener('click',showMap);
  $('farmShortcut').addEventListener('click',showMap);
  function passDay(){
    if(mode!=='play')return toast('Conclua a conversa atual antes de passar o dia.');
    state.day+=1;state.crops.forEach(c=>{if(c)c.progress+=1;});
    updateHUD();persist();toast(`☀ Dia ${state.day}: ${weekdays[(state.day-1)%7]}. As plantas cresceram +1 dia!`);
  }
  $('nextDay').addEventListener('click',passDay);
  function registerMistake(){
    state.mistakes+=1;
    state.crops.forEach(c=>{if(c)c.progress=Math.max(0,c.progress-2);});
    persist();updateHUD();
  }
  function pray(){
    const dayOfWeek=(state.day-1)%7;
    if(![2,5,6].includes(dayOfWeek)){
      toast('Hoje não é quarta, sábado nem domingo. Volte no próximo culto!');return false;
    }
    if(state.prayedDays[state.day]){toast('O bônus de oração deste culto já foi recebido.');return false;}
    state.prayedDays[state.day]=true;
    state.crops.forEach(c=>{if(c)c.progress+=2;});
    diary('A força de cada culto','No jogo, cada culto representa um dia de renovação. A oração aparece como um bônus simbólico no crescimento das sementes.');
    updateHUD();persist();littleChime();toast('🙏 Dia de culto! Oração: +2 dias de crescimento em todas as plantas!');return true;
  }
  function enterChurch(){
    const bon=pray();
    const current=state.storyMaxChapter??state.chapter;
    setChapter(current===0?1:current===3||current===4?2:current);
    say('Narrador',`Você chegou à igreja na Glória. ${bon?'Hoje é dia de culto: a oração renovou as plantações do sítio!':'Os jovens já estão se preparando e você pode continuar sua história.'}`,
      [['Voltar a explorar a igreja',()=>{}],['Abrir a loja de melhorias da igreja',()=>churchShop()]]);
  }
  function talkMilene(){
    say('Milene','Luiz, vi você andando pela Glória! E aí, como estão as conversas com a Camily?',[
      ['Quero conhecê-la melhor, mas sem apressar nada.',()=>{changeStats(3,5);say('Milene','É isso! Respeita o tempo dela. O carinho cresce com paciência.');}],
      ['Ela precisa me dar uma chance logo.',()=>{changeStats(-6,-7);say('Milene','Isso não é justo com ela. Você pode fazer diferente numa próxima conversa.');}],
      ['Vamos falar do Pedro... ele anda curioso sobre você.',()=>say('Milene','O Pedro? Ah, ele é uma figura! 😅')]
    ]);
  }
  function talkKevin(){
    say('Kevin','Vai na igreja depois? Posso ajudar a levar umas cadeiras! 😁',[
      ['Bora ajudar juntos. Todo mundo merece um lugar.',()=>{changeStats(0,4);say('Kevin','Fechou! A gente faz mais quando ajuda um ao outro.');}],
      ['Que nada, deixa tudo pra você.',()=>{changeStats(0,-5);say('Kevin','Poxa... dividir o esforço seria melhor, né?');}]
    ]);
  }
  function talkJanio(){
    say('Jânio','Seja bem-vindo ao sítio! O tempo faz parte da colheita. O que a gente planta cresce com constância, não com pressa.',[
      ['Me ensina a cuidar de um canteiro?',()=>say('Jânio','Plante uma semente, avance os dias e volte quando ela amadurecer. Você pode vender na banca e ajudar a igreja.')],
      ['Vou vender tudo sem cuidar de nada!',()=>{changeStats(0,-4);say('Jânio','Aqui tudo precisa de atenção, inclusive a forma como tratamos as pessoas.');}],
      ['Obrigado, Jânio! Vou tentar.',()=>{toast('Jânio lhe entrega boas-vindas!');}]
    ]);
  }
  function plant(index,id){
    const seed=seedTypes.find(x=>x.id===id);
    if(!seed||state.crops[index])return false;
    if(state.coins<seed.price){toast(`Você precisa de ${seed.price} moedas para plantar ${seed.name}.`);return false;}
    state.coins-=seed.price;state.crops[index]={type:seed.id,progress:0};
    updateHUD();persist();littleChime();toast(`${seed.icon} ${seed.name} plantado no canteiro ${index+1}!`);return true;
  }
  function plotAction(index){
    const crop=state.crops[index];
    if(crop){const type=seedTypes.find(x=>x.id===crop.type);
      if(crop.progress>=type.days){
        state.inventory[type.id]=(state.inventory[type.id]||0)+1;
        state.crops[index]=null;persist();updateHUD();littleChime();
        say('Luiz',`Que maravilha! Colhi ${type.icon} ${type.name}. Agora posso vender na banca do sítio!`);
      }else say('Canteiro',`${type.icon} ${type.name} • crescimento ${crop.progress}/${type.days} dias. O próximo dia avança +1; dias de culto dão bônus +2.`,[['Continuar',()=>{}]]);
      return;
    }
    puzzle({kicker:`🌱 PLANTIO • CANTEIRO ${index+1}`,title:'O que vamos semear?',description:'Cada semente leva dias de jogo para crescer. Cultos aceleram o crescimento; vacilos fazem perder 2 dias de progresso.',render:root=>{
      const list=document.createElement('div');list.className='choice-list';
      seedTypes.forEach(seed=>{const b=document.createElement('button');b.className='choice-button';b.disabled=state.coins<seed.price;
        b.textContent=`${seed.icon} ${seed.name} — semente ${seed.price} moedas • ${seed.days} dias • venda ${seed.sale} moedas`;
        b.onclick=()=>{if(plant(index,seed.id))closePuzzle();};list.appendChild(b);});root.append(list);
    }});
  }
  function sellHarvest(){
    let total=0,details=[];
    seedTypes.forEach(seed=>{const n=state.inventory[seed.id]||0;if(n){total+=n*seed.sale;details.push(`${n}× ${seed.name}`);state.inventory[seed.id]=0;}});
    if(!total)return say('Banca do sítio','Você ainda não tem colheitas para vender. Plante, deixe crescer e colha quando estiver pronta!');
    state.coins+=total;persist();updateHUD();littleChime();
    say('Banca do sítio',`Você vendeu ${details.join(', ')} por ${total} moedas! Use o dinheiro para comprar melhorias para a igreja na Glória.`);
  }
  function churchShop(){
    puzzle({kicker:'🛍 SOLIDARIEDADE • IGREJA',title:'Melhorias para a igreja',
      description:`Saldo atual: ${state.coins} moedas. Com as vendas do sítio, você pode comprar itens para a comunidade. São melhorias somente dentro do jogo.`,render:root=>{
      const list=document.createElement('div');list.className='choice-list';
      churchItems.forEach(item=>{
        const bought=state.purchases.includes(item.id);
        const b=document.createElement('button');b.className='choice-button';b.disabled=bought||state.coins<item.price;
        b.textContent=`${item.icon} ${item.name} • ${bought?'ADQUIRIDO ✔':item.price+' moedas'}`;
        b.onclick=()=>{if(state.coins<item.price||state.purchases.includes(item.id))return;
          state.coins-=item.price;state.purchases.push(item.id);
          diary('Um presente à igreja',`Com o trabalho no Sítio do Jânio, Luiz conseguiu um presente para a igreja: ${item.name}.`);
          persist();updateHUD();closePuzzle();littleChime();say('Narrador',`Você comprou ${item.name} para a igreja! Uma pequena colheita se tornou algo bom para todos. 🌻`);
        };list.appendChild(b);
      });root.appendChild(list);
    }});
  }

  // Personagens, objetos e conversas opcionais.
  function target(id,name,x,y,action,type='npc',look='default') {return {id,name,x,y,action,type,look};}
  function allTargets() {
    if(state.area==='world')return [
      target('gloria','Glória',240,380,()=>enterArea('gloria'),'object'),
      target('farmarea','Ponta da Fruta',766,380,()=>enterArea('farm'),'object')];
    if(state.area==='gloria')return [
      target('home','Casa de Luiz',774,388,()=>{state.area='story';setChapter(state.chapter===3?3:0);say('Narrador','No quarto, Luiz guarda lembranças e sonhos. É aqui que sua história começou.',[['Continuar',()=>{}]]);},'object'),
      target('gloriaChurch','Igreja',225,358,()=>enterChurch(),'object'),
      target('gloriaMilene','Milene',456,398,()=>talkMilene(),'npc','milene'),
      target('gloriaKevin','Kevin',590,425,()=>talkKevin(),'npc','kevin'),
      target('gloriaShop','Loja para a igreja',365,346,()=>churchShop(),'object')
    ];
    if(state.area==='farm')return [
      ...plotCoords.map((o,i)=>target('plot-'+i,'Canteiro '+(i+1),o.x,o.y,()=>plotAction(i),'object')),
      target('janio','Jânio',790,405,()=>talkJanio(),'npc','pedro'),
      target('farmMarket','Banca de vendas',737,310,()=>sellHarvest(),'object'),
      target('farmGate','Voltar à cidade',870,470,()=>enterArea('world'),'object')
    ];
    const c=state.chapter;
    if(c===0)return [
      target('bible','Bíblia',238,344,()=>say('Luiz','“Confia no Senhor de todo o teu coração...” Talvez eu não saiba o que quero da vida ainda, mas posso continuar caminhando.',[
        ['Guardar a Bíblia e ir à igreja →',()=>{diary('Antes de tudo','Eu ia para a igreja, tocava meu baixo e voltava para casa. Era como se faltasse alguma coisa que eu nem sabia explicar.');setChapter(1);say('Narrador','Luiz chega à igreja. Perto do púlpito há seu baixo e uma cadeira ao lado, usada por quem vai cantar. Aquela cadeira ainda não significa nada para ele.');}]
      ]),'object'),
      target('door','Porta',868,400,()=>say('Luiz','Antes de sair, preciso pegar minha Bíblia na escrivaninha.'),'object')
    ];
    if(c===1)return [
      target('bass','Baixo de Luiz',407,330,beginBass,'object'),
      target('camily-arrival','Camily',825,420,()=>say('Narrador','Camily é doce e gentil. Chegou recentemente à igreja tentando reencontrar a paz depois de um relacionamento doloroso. Luiz ainda não conhece sua história.'),'npc','camily'),
      target('rebecka','Rebecka',330,253,()=>say('Rebecka','Já deixei o teclado prontinho! Hoje a música vai ficar linda. 🎹'),'npc','rebecka'),
      target('miguel','Miguel',640,292,()=>say('Miguel','Quando você entrar no baixo, eu entro na bateria. Combinado? 🥁'),'npc','miguel')
    ];
    if(c===2)return [
      target('camily','Camily',531,325,meetCamily,'npc','camily'),
      target('milene','Milene',258,422,()=>say('Milene','Eu sempre digo para a Camily que você é um bom rapaz, Luiz. Mas ela saiu machucada de um relacionamento e não quer namorar agora. O melhor é conhecer e respeitar o tempo dela. 💛'),'npc','milene'),
      target('pedro','Pedro',155,448,()=>say('Pedro','E aí, irmão! Vai puxar assunto com a Camily? Eu... bem... a Milene está ali, né? Haha, deixa pra lá. 😅'),'npc','pedro'),
      target('matheus','Matheus',767,445,()=>say('Matheus','Irmão, só seja você mesmo. Uma boa conversa não precisa de um discurso ensaiado!'),'npc','matheus'),
      target('kevin','Kevin',855,416,()=>say('Kevin','O segredo? Ouvir de verdade! Eu testei essa teoria... e posso garantir pelo menos que rende conversa. 😁'),'npc','kevin'),
      target('gabriel','Gabriel',690,462,()=>say('Gabriel','A gente vai ficar por aqui depois do culto. Se quiser, junta todo mundo pra conversar.'),'npc','gabriel'),
      target('rebecka','Rebecka',340,247,()=>say('Rebecka','Eu tô aqui no teclado, bem na frente do Luiz. Dá para ver quando ele fica nervoso, sabia? Hahaha!'),'npc','rebecka'),
      target('miguel','Miguel',644,298,()=>say('Miguel','Acho que deixei minhas baquetas do lado da cadeira da Camily. Você viu?'),'npc','miguel')
    ];
    if(c===3)return [
      target('phone','Celular',724,375,beginPhone,'object'),
      target('guitar','Baixo',205,365,()=>say('Luiz','Eu consigo tocar uma música inteira sem olhar para as cordas, mas escrever “oi” é mais difícil do que parece.'),'object')
    ];
    return [
      target('counter','Balcão',746,368,beginPizza,'object'),
      target('grandma','Avó de Luiz',185,421,()=>say('Avó','Meu filho, peguei uma calabresa! E vá buscar as pizzas, viu? Ah... a Camily parece uma moça muito gentil. 😉'),'npc','grandma'),
      target('milene','Milene',324,435,()=>say('Milene','Eu escolhi quatro queijos! Ah, e o Pedro está muito engraçado hoje... não sei o que deu nele!'),'npc','milene'),
      target('pedro','Pedro',445,434,()=>say('Pedro','Frango com catupiry para mim! E, Luiz, fica tranquilo... ah, oi, Milene! 😳'),'npc','pedro'),
      ...(state.flags.pizzaDone?[target('camily','Camily',790,445,()=>say('Camily','Foi bom conversar com você hoje. ♡'),'npc','camily')]:[])
    ];
  }
  function nearestTarget() {
    const list=allTargets();let best=null,distance=73;
    for(const t of list) {
      const d=Math.hypot(t.x-state.position.x,(t.y-state.position.y)*.9);
      if(d<distance){distance=d;best=t;}
    } return best;
  }
  function interact() {if(mode!=='play')return;const t=nearestTarget();if(t)t.action();else toast('Aproxime-se de uma pessoa ou objeto para interagir.');}
  function drawRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function line(x,y,w,h,c){drawRect(x,y,w,h,c);}
  function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function text(v,x,y,sz=15,c='#f8e8da',align='center',weight='bold'){
    ctx.save();ctx.font=`${weight} ${sz}px Trebuchet MS, Verdana, sans-serif`;ctx.textAlign=align;
    ctx.fillStyle='#21223c';ctx.fillText(v,x+1,y+2);ctx.fillStyle=c;ctx.fillText(v,x,y);ctx.restore();
  }
  function pixelFlower(x,y,color='#efb29f',s=1){
    drawRect(x-1*s,y-12*s,2*s,18*s,'#345e49');
    drawRect(x-7*s,y-9*s,6*s,3*s,'#668e57');drawRect(x+1*s,y-4*s,6*s,3*s,'#668e57');
    [[0,-19],[-5,-14],[5,-14],[0,-10]].forEach(([dx,dy])=>drawRect(x+dx*s-3*s,y+dy*s-3*s,6*s,6*s,color));
    drawRect(x-3*s,y-17*s,6*s,6*s,'#e9c16f');
  }
  function star(x,y,s=1,c='#f5d6a2') {drawRect(x-1*s,y-4*s,2*s,8*s,c);drawRect(x-4*s,y-1*s,8*s,2*s,c);}
  function tileFloor(top,color1,color2,size=40){
    for(let y=top;y<H;y+=size)for(let x=0;x<W;x+=size)drawRect(x,y,size,size,((Math.floor(x/size)+Math.floor(y/size))%2)?color1:color2);
    for(let y=top;y<H;y+=size)line(0,y,W,2,'#221e3280');
  }
  function windowPixel(x,y,w=104,h=123){
    drawRect(x-8,y-8,w+16,h+16,'#504960');drawRect(x-3,y-3,w+6,h+6,'#ecbf9f');
    drawRect(x+4,y+4,w-8,h-8,'#637d9d');
    drawRect(x+4,y+4,w-8,(h-8)*.45,'#a7a9b4');
    drawRect(x+4,y+h*.56,w-8,h*.4-4,'#6e817a');
    for(let i=0;i<5;i++)drawRect(x+8+i*20,y+h*.6+(i%3)*11,14,h*.25,'#626d78');
    drawRect(x+w/2-3,y+4,6,h-8,'#ddbb9b');drawRect(x+4,y+h/2-4,w-8,8,'#ddbb9b');
    star(x+w*.28,y+h*.2,2,'#fae1aa');
  }
  function wallLamp(x,y){drawRect(x-6,y,12,26,'#72556a');drawRect(x-14,y-4,28,8,'#c0928b');drawRect(x-9,y-21,18,20,'#ffe0a0');drawRect(x-4,y-24,8,5,'#f9e9be');}
  function rug(x,y,w,h){drawRect(x,y,w,h,'#744c6a');drawRect(x+8,y+8,w-16,h-16,'#a87886');drawRect(x+15,y+15,w-30,h-30,'#91677b');for(let i=0;i<8;i++)star(x+20+(i%4)*(w-40)/3,y+25+Math.floor(i/4)*(h-50),.8,'#e7bba2');}
  function drawRoom(night=false){
    drawRect(0,0,W,H,night?'#39445d':'#63617e');
    for(let y=0;y<270;y+=40)drawRect(0,y,W,2,'#52516e');
    tileFloor(266,night?'#855d62':'#a57973',night?'#77575c':'#966d67',36);
    for(let x=0;x<W;x+=96)drawRect(x,269,3,270,'#5c435399');
    windowPixel(620,66,145,132);if(night){drawRect(624,71,137,125,'#394c72');for(let i=0;i<9;i++)star(642+rnd(i+1)*98,85+rnd(i+20)*90,1.3,'#ffecb5');}
    wallLamp(540,118);
    drawRect(85,218,218,110,'#6d5367');drawRect(94,198,205,122,'#8c6b7c');drawRect(94,211,205,87,'#a8a0a5');drawRect(94,231,205,72,'#c6a3a3');drawRect(115,209,63,35,'#e7d6c4');drawRect(98,320,205,17,'#54394d');
    drawRect(160,338,178,15,'#533b42');drawRect(175,350,10,50,'#483544');drawRect(315,350,10,50,'#483544');
    drawRect(195,321,85,18,'#76515b');drawRect(211,318,50,10,'#ede6b9');drawRect(228,322,17,5,'#b4a76c');
    drawRect(440,267,140,18,'#4f394d');drawRect(456,285,11,90,'#45364b');drawRect(552,285,11,90,'#45364b');
    drawRect(455,240,53,29,'#544a61');drawRect(464,211,60,33,'#b49892');drawRect(469,217,50,24,'#7d7e81');
    drawRect(528,250,29,17,'#e2c49b');drawRect(532,241,21,13,'#f5e3b8');drawRect(540,239,4,10,'#b7947b');
    // long shelf with small Bible, scroll and a sunflower
    drawRect(185,286,125,58,'#6d4b48');drawRect(188,280,125,12,'#af8579');
    drawRect(212,265,41,17,'#3a5771');drawRect(215,263,35,3,'#e3d1a5');drawRect(231,265,3,14,'#efd4a3');
    drawRect(277,250,15,28,'#8a6073');pixelFlower(285,260,'#efc265',1.1);
    rug(365,390,290,125);
    drawRect(808,256,93,178,'#55465d');drawRect(818,270,73,157,'#9a7484');drawRect(844,353,6,6,'#ead4ac');
    drawRect(20,272,53,70,'#6b586d');drawRect(25,275,43,59,'#5a805d');for(let i=0;i<10;i++)drawRect(28+rnd(i*2)*36,280+rnd(i*8)*37,9,9,i%2?'#7ca878':'#92c49c');
    if(night){ctx.fillStyle='#0e1a3a54';ctx.fillRect(0,0,W,H);circle(692,140,46,'#ffe4a810');}
  }
  function pew(x,y,w=155){
    drawRect(x,y-21,w,17,'#674a4a');drawRect(x+5,y-20,w-10,8,'#a17a65');
    drawRect(x-6,y-6,w+12,26,'#8e685c');drawRect(x,y,w,12,'#bf8a64');drawRect(x+10,y+17,9,12,'#654b51');drawRect(x+w-20,y+17,9,12,'#654b51');
  }
  function altar(x,y){
    drawRect(x-35,y-46,70,103,'#6b4d5c');drawRect(x-39,y-50,78,15,'#b88373');drawRect(x-27,y-34,54,77,'#88656a');
    drawRect(x-5,y-25,10,37,'#eccb91');drawRect(x-18,y-13,36,9,'#eccb91');
    drawRect(x-48,y+49,96,16,'#5d4250');
  }
  function keyboard(x,y){drawRect(x-77,y-4,146,28,'#3c3d56');drawRect(x-68,y,131,16,'#e6dad3');for(let i=0;i<9;i++)drawRect(x-64+i*14,y,7,10,'#555262');drawRect(x-54,y+24,7,30,'#423a50');drawRect(x+48,y+24,7,30,'#423a50');}
  function drums(x,y){drawRect(x-55,y-28,12,70,'#b9a9a2');drawRect(x-70,y-31,50,7,'#ebc87e');drawRect(x+36,y-38,12,70,'#b9a9a2');drawRect(x+13,y-43,52,7,'#e8c77a');drawRect(x-45,y-3,62,44,'#8d6176');drawRect(x-38,y+3,46,30,'#ac7b84');drawRect(x-32,y+38,6,22,'#3e3d4e');drawRect(x+7,y+38,6,22,'#3e3d4e');}
  function guitar(x,y){drawRect(x-9,y-63,8,66,'#ae7a4b');drawRect(x-10,y-77,9,17,'#c79a5c');drawRect(x-17,y-23,27,42,'#5e6f7b');drawRect(x-22,y-8,37,23,'#758c91');drawRect(x-9,y-24,3,34,'#eac7a1');drawRect(x-8,y+16,5,44,'#363649');}
  function drawChurch(){
    drawRect(0,0,W,270,'#62546d');
    for(let x=0;x<W;x+=85){drawRect(x,0,4,263,'#564a63');for(let y=18;y<230;y+=55)drawRect(x,y,85,2,'#786678');}
    [65,235,495,825].forEach((x,i)=>{windowPixel(x,55,i===2?116:94,118);drawRect(x+15,65,11,95,'#d5a99344');});
    drawRect(0,267,W,119,'#b48875');for(let x=0;x<W;x+=42)drawRect(x,266,2,118,'#856472');
    drawRect(0,377,W,163,'#765a6a');for(let y=382;y<H;y+=32)drawRect(0,y,W,3,'#675164');
    for(let x=0;x<W;x+=80)drawRect(x,384,2,155,'#674c57');
    drawRect(0,369,W,14,'#4a394e');
    drawRect(840,100,90,265,'#55435c');drawRect(848,111,74,253,'#826a70');drawRect(860,253,19,8,'#cf9f8d');
    altar(742,258);
    drawRect(695,330,9,65,'#3e384f');drawRect(695,325,52,5,'#bdb1ac');drawRect(725,329,24,11,'#4c485e');
    keyboard(339,258);drums(657,292);guitar(410,330);
    // two little chairs: one where Luiz sits with his bass, one for the singer
    drawRect(453,334,41,10,'#73536b');drawRect(456,344,8,33,'#493b50');drawRect(481,344,8,33,'#493b50');
    drawRect(510,336,46,9,'#71566c');drawRect(514,345,7,30,'#4e3c52');drawRect(547,345,7,30,'#4e3c52');
    drawRect(572,279,5,76,'#a3a5a6');drawRect(565,272,20,10,'#303c52');
    pew(45,450,130);pew(753,481,154);
    pixelFlower(55,356,'#f0b3ba',1.4);pixelFlower(867,356,'#edc968',1.3);
    line(0,375,W,4,'#d3ae92');
    for(let i=0;i<10;i++){const xx=25+i*99;star(xx,120+Math.sin(i*1.7+elapsed)*9,1,'#ffe8a71d');}
  }
  function drawPizza(){
    drawRect(0,0,W,245,'#664856');
    for(let y=0;y<245;y+=25)for(let x=0;x<W;x+=64){drawRect(x+(Math.floor(y/25)%2)*32,y,62,23,((x/64+y/25)%2<1)?'#774f57':'#895d60');}
    tileFloor(247,'#c49378','#b58172',48);
    windowPixel(71,60,120,132);windowPixel(271,60,130,132);
    wallLamp(500,99);
    drawRect(560,176,398,139,'#94685f');drawRect(565,180,388,114,'#b37a68');
    drawRect(569,189,379,92,'#c48f7a');
    for(let x=585;x<945;x+=54)pixelFlower(x,224,x%3?'#eed09a':'#dd9eaa',.65);
    drawRect(560,288,398,42,'#e0a27b');drawRect(560,327,398,24,'#966c65');
    drawRect(890,123,80,150,'#473544');drawRect(896,131,64,125,'#c07a5d');drawRect(903,165,50,78,'#493a42');circle(927,207,21,'#e9a85a');
    drawRect(622,119,162,43,'#3f465a');text('PIZZARIA',703,149,21,'#fbe0ab');
    drawRect(420,342,120,21,'#816067');drawRect(428,361,12,63,'#685360');drawRect(520,361,12,63,'#685360');
    drawRect(419,336,122,12,'#d9a788');
    drawRect(67,387,137,17,'#81565c');drawRect(79,402,10,58,'#6e505b');drawRect(180,402,10,58,'#6e505b');
    drawRect(229,393,135,18,'#8a5960');drawRect(242,411,11,52,'#6e505b');drawRect(342,411,11,52,'#6e505b');
    drawRect(72,377,56,15,'#ead5bd');drawRect(92,361,20,18,'#f9d790');
    drawRect(235,385,91,8,'#e7cdb4');
    drawRect(25,253,63,133,'#6c4b5a');drawRect(32,272,50,103,'#b68b79');
    drawRect(35,260,45,11,'#deb28a');drawRect(44,298,28,28,'#546971');
    line(0,245,W,8,'#68495b');
    for(let i=0;i<9;i++){star(35+i*116,23+Math.sin(i+elapsed*.4)*4,1,'#f6d39f');}
    if(state.flags.pizzaDone){
      drawRect(683,315,55,13,'#edd3aa');drawRect(688,307,45,10,'#bd725e');
    }
  }

  const outfits = {
    luiz:{skin:'#ba8d79',hair:'#352b36',shirt:'#50778b',pants:'#3c475b',style:'short'},
    camily:{skin:'#f3c9b4',hair:'#49313b',shirt:'#daa3af',pants:'#866375',style:'curlylong',green:true},
    milene:{skin:'#b58d78',hair:'#49313b',shirt:'#d3a68b',pants:'#666176',style:'long'},
    pedro:{skin:'#b98d75',hair:'#392d34',shirt:'#a3b8a4',pants:'#494c5e',style:'short'},
    matheus:{skin:'#956a58',hair:'#292638',shirt:'#c0a07d',pants:'#435267',style:'curly',tall:true},
    kevin:{skin:'#8c6656',hair:'#262938',shirt:'#8bb8a8',pants:'#4f5868',style:'short',glasses:true,braces:true,tall:true,strong:true},
    gabriel:{skin:'#f4c2a3',hair:'#a38b79',shirt:'#8aaec7',pants:'#515a72',style:'wavy',tall:true},
    rebecka:{skin:'#ba8972',hair:'#403139',shirt:'#a99cbd',pants:'#605771',style:'wavyLong',young:true},
    miguel:{skin:'#bb9176',hair:'#393239',shirt:'#c8a17d',pants:'#53546d',style:'short',young:true},
    grandma:{skin:'#e3b9a3',hair:'#c6bec0',shirt:'#937fa1',pants:'#6b5c79',style:'bun'},
  };
  function drawPerson(type,x,y,opts={}){
    const p=outfits[type]||outfits.luiz;
    const s=p.young?2.45:(p.tall?3.18:2.9), lean=p.strong?1.2:1;
    const rect=(px,py,pw,ph,col)=>drawRect(x+(px-8)*s,y+(py-21)*s,pw*s*lean,ph*s,col);
    drawRect(x-17,y+2,34,6,'#1d243e54');
    // walking bob
    ctx.save();let bob=opts.walk?Math.sin(elapsed*12)*2:Math.sin(elapsed*1.8+ x)*.5;
    ctx.translate(0,bob);
    rect(4,17,4,4,p.pants);rect(10,17,4,4,p.pants);
    rect(3,20,5,2,'#303241');rect(10,20,5,2,'#303241');
    rect(2,9,14,9,p.shirt);rect(0,10,3,7,p.skin);rect(16,10,3,7,p.skin);
    rect(3,8,13,2,'#ffffff22');rect(5,1,10,9,p.skin);
    rect(5,0,10,3,p.hair);rect(4,3,2,4,p.hair);rect(14,3,2,4,p.hair);
    if(p.style==='curly'||p.style==='curlylong') {
      for(let i=0;i<5;i++){rect(3+i*3,-2+(i%2),4,4,p.hair);}rect(2,2,3,7,p.hair);rect(15,2,3,6,p.hair);
    }
    if(p.style==='curlylong'||p.style==='long'||p.style==='wavyLong'){
      rect(2,5,3,11,p.hair);rect(15,5,3,11,p.hair);
      if(p.style==='wavyLong'){rect(0,13,5,4,p.hair);rect(16,12,3,4,p.hair);}
    }
    if(p.style==='wavy'){rect(6,-2,11,4,p.hair);rect(4,3,3,3,p.hair);}
    if(p.style==='bun'){rect(13,-3,6,6,p.hair);rect(4,0,13,3,p.hair);}
    rect(7,6,1,1,p.green?'#548475':'#423541');rect(12,6,1,1,p.green?'#548475':'#423541');
    rect(9,8,2,1,'#ba7b75');
    if(p.glasses){rect(5,4,5,4,'#2e3651');rect(11,4,5,4,'#2e3651');rect(10,5,1,1,'#b9d4db');rect(6,5,3,2,'#c4cddd');rect(12,5,3,2,'#c4cddd');}
    if(p.braces){rect(9,9,3,1,'#ece2d7');}
    if(type==='luiz'){rect(2,10,2,5,'#526778');rect(14,10,2,6,'#526778');}
    if(opts.heart){star(x,y-76,2,'#edabb7');}
    ctx.restore();
  }
  function renderLabel(name,x,y,focus){
    if(!name)return;
    ctx.save();ctx.font='bold 13px Trebuchet MS';const width=ctx.measureText(name).width+21;
    drawRect(x-width/2,y-94,width,23,focus?'#704e6c':'#33334ecb');
    drawRect(x-width/2,y-94,width,2,focus?'#f8c4c3':'#837584');
    text(name,x,y-77,13,focus?'#ffefb6':'#f7e9db');ctx.restore();
  }
  function drawObjectMarker(t,focus){
    if(t.id==='bible')star(t.x,t.y-45,focus?3:2,focus?'#fff4b2':'#e1c88c');
    if(t.id==='bass')star(t.x,t.y-55,focus?3:2,focus?'#fff3b2':'#dbc49b');
    if(t.id==='phone'){star(t.x,t.y-56,3,'#f9d4a7');}
    if(t.id==='counter')star(t.x,t.y-55,3,'#ffe0a5');
    if(focus){ctx.strokeStyle='#ffde9acc';ctx.lineWidth=3;ctx.setLineDash([8,7]);ctx.beginPath();ctx.ellipse(t.x,t.y-9,39,19,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  }
  function drawAmbience(){
    for(let i=0;i<12;i++){
      const x=(rnd(i+24)*W+Math.sin(elapsed*.4+i)*17+W)%W;
      const y=52+rnd(i+42)*320+Math.sin(elapsed*.8+i)*12;
      const c=i%3?'#ffeab415':'#f4bed322';drawRect(x,y,4,4,c);
    }
  }
  function pixelHouse(x,y,roof,wall,caption){
    drawRect(x-65,y-114,130,114,wall);drawRect(x-76,y-130,152,22,roof);
    drawRect(x-28,y-82,56,44,'#8fb4b5');drawRect(x-4,y-82,5,44,'#e9d8b4');
    drawRect(x-64,y-117,128,6,'#fffae329');drawRect(x+27,y-45,28,45,'#715b67');
    drawRect(x+32,y-26,5,5,'#eaca8e');
    text(caption,x,y-139,14,'#fff1cf');
  }
  function drawCityWorld(){
    drawRect(0,0,W,H,'#83b6a4');
    drawRect(0,0,W,122,'#93ccd9');
    for(let i=0;i<18;i++){const x=i*59;circle(x+35,72+(i%3)*10,17,'#d4eff0');}
    for(let i=0;i<18;i++){const x=i*66;circle(x,180+Math.sin(i*3)*32,23,'#567a63');circle(x+22,188+Math.sin(i*3)*25,20,'#60856d');}
    drawRect(0,245,960,295,'#80af77');
    // Caminhos pontilhados entre os bairros, como no mapa de seleção de fases.
    ctx.strokeStyle='#d9c59d';ctx.lineWidth=37;ctx.beginPath();
    ctx.moveTo(200,382);ctx.bezierCurveTo(350,320,330,490,490,408);
    ctx.bezierCurveTo(640,298,670,476,780,372);ctx.stroke();
    ctx.strokeStyle='#fff2bf';ctx.lineWidth=5;ctx.setLineDash([12,18]);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<11;i++){
      const x=20+i*85,y=293+(i%2)*195;pixelFlower(x,y,'#edce6f',1.25);
    }
    circle(238,358,73,'#3b7779');circle(238,358,63,'#f8d49d');
    circle(764,355,73,'#547b58');circle(764,355,63,'#f8d49d');
    text('🏠',238,362,47);text('🌻',764,362,45);
    text('GLÓRIA',238,438,23,'#fff6dc');text('SÍTIO DO JÂNIO',764,439,21,'#fff5da');
    text('VILA VELHA',480,73,34,'#f8f3cd');text('ESCOLHA UMA FASE',480,102,15,'#305066');
    text('🔒 ITAPUÃ',430,250,13,'#f1eacb');text('🔒 PRAIA DA COSTA',618,244,13,'#f1eacb');
    text('🔒 CENTRO',340,499,14,'#f2ebd0');text('🔒 BARRA DO JUCU',658,501,14,'#f2ebd0');
    star(239,271,3,'#fff4d4');star(765,270,3,'#fff4d4');
  }
  function drawGloria(){
    // Representação ESQUEMÁTICA das ruas reais: Maranguape fica a oeste de Dom Pedro II.
    // Nenhum número residencial nem posição exata de moradia é codificado neste mapa público.
    drawRect(0,0,W,H,'#96b79e');
    for(let j=0;j<5;j++)for(let i=0;i<13;i++){
      const x=i*87+7,y=90+j*92;
      drawRect(x,y,70,65,(i+j)%3===0?'#d5bcaa':(i+j)%3===1?'#d6a99e':'#d9cfae');
      drawRect(x,y,70,8,'#946f7a');
      drawRect(x+12,y+14,15,19,'#8daca9');drawRect(x+43,y+14,13,19,'#8daca9');
    }
    drawRect(0,318,W,106,'#a7a6a4');drawRect(0,358,W,3,'#f6dfad');
    drawRect(212,80,70,440,'#a8a9a1');drawRect(680,80,70,440,'#a8a9a1');
    for(let i=0;i<16;i++){drawRect(i*66+8,365,29,4,'#ece0ca');}
    for(let i=0;i<8;i++){drawRect(246,i*57+86,4,20,'#eadbc4');drawRect(714,i*57+86,4,20,'#eadbc4');}
    // Os edifícios acima são abstrações de quarteirões; as ruas seguem orientação aproximada.
    pixelHouse(225,321,'#7e576f','#ddbfad','IGREJA');
    drawRect(209,258,33,31,'#edf3c1');text('✝',225,286,29,'#c4a36f');
    pixelHouse(774,365,'#775f85','#ebceae','CASA DE LUIZ');
    drawRect(336,235,107,69,'#d8c2a6');drawRect(331,220,120,17,'#83586f');
    text('LOJA SOLIDÁRIA',394,211,13,'#fff2d8');
    drawRect(0,0,W,79,'#364d65');text('BAIRRO DA GLÓRIA',480,43,28,'#fff0d5');
    text('R. MARANGUAPE',244,157,13,'#fff5cf');text('R. DOM PEDRO II',716,158,13,'#fff5cf');
    text('RUA DE LIGAÇÃO (TRAJETO SIMPLIFICADO)',465,474,14,'#fff9d4');
    for(let i=0;i<13;i++)pixelFlower(52+i*72,504,i%2?'#ecaac1':'#f5c46e',.55);
  }
  function drawFarm(){
    drawRect(0,0,W,H,'#8fb684');
    drawRect(0,0,W,173,'#a4ced0');
    drawRect(0,152,W,389,'#89a66e');
    for(let i=0;i<19;i++){const x=i*58;circle(x,190,31,'#4f7554');circle(x+20,160,32,'#638857');}
    drawRect(35,245,575,280,'#b98e63');
    for(let i=0;i<6;i++){
      const o=plotCoords[i],crop=state.crops[i];
      drawRect(o.x-65,o.y-51,126,90,'#654e3e');drawRect(o.x-58,o.y-44,112,76,'#805e47');
      for(let j=0;j<3;j++)drawRect(o.x-42,o.y-30+j*22,80,7,'#a47854');
      if(crop){const type=seedTypes.find(x=>x.id===crop.type),ratio=clamp(crop.progress/type.days,0,1);
        if(ratio<.4){text('🌱',o.x,o.y+4,31);}else if(ratio<1){text('🌿',o.x,o.y+4,34);}
        else {text(type.icon,o.x,o.y+7,38);star(o.x+37,o.y-23,3,'#ffefaf');}
        text(`${Math.min(crop.progress,type.days)}/${type.days} dias`,o.x,o.y+51,13,'#fff2cc');
      }else text('＋ PLANTAR',o.x,o.y+7,14,'#fff1d1');
    }
    drawRect(652,233,200,73,'#876452');drawRect(642,216,215,26,'#c77862');
    text('BANCA DE VENDAS',752,205,15,'#fff2c6');text('🍅 🌽 🌻',750,273,23);
    pixelHouse(857,430,'#886777','#e7caa8','CASA DO SÍTIO');
    drawRect(0,0,W,79,'#405d69');text('SÍTIO DO JÂNIO • PONTA DA FRUTA',480,44,25,'#fff4d7');
    text('← CANTEIROS',654,498,15,'#fff5cd');text('ENTRADA ↗',848,508,16,'#f8f2d3');
    for(let i=0;i<9;i++)pixelFlower(42+i*105,530,'#e8d075',.75);
  }

  function render(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const camera=getCamera();
    ctx.setTransform(camera.scale,0,0,camera.scale,-camera.x*camera.scale,0);
    if(state.area==='world')drawCityWorld();
    else if(state.area==='gloria')drawGloria();
    else if(state.area==='farm')drawFarm();
    else if(state.chapter===0)drawRoom(false);
    if(state.area==='story'&&(state.chapter===1||state.chapter===2))drawChurch();
    if(state.area==='story'&&state.chapter===3){drawRoom(true);
      drawRect(668,174,120,234,'#2d3348');drawRect(677,179,101,217,'#b4a2aa');drawRect(680,186,95,201,'#e0d2c5');
      drawRect(683,210,85,33,'#8cbaa9');drawRect(683,262,75,28,'#eebaaa');drawRect(690,300,77,28,'#8cbaa9');
      drawRect(707,364,43,5,'#afa5ae');star(720,190,2,'#f6cf95');
    }
    if(state.area==='story'&&state.chapter===4)drawPizza();
    drawAmbience();
    const available=allTargets(), focus=mode==='play'?nearestTarget():null;
    // NPC sprites ordered by depth. Objects like instruments are already rendered in the scene.
    const people=available.filter(t=>t.type==='npc');
    let entities=[...people.map(p=>({kind:'npc',...p})),{kind:'player',y:state.position.y,x:state.position.x}];
    entities.sort((a,b)=>a.y-b.y);
    for(const e of entities){
      if(e.kind==='player')drawPerson('luiz',state.position.x,state.position.y,{walk:!!(keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight||keys.w||keys.a||keys.s||keys.d||touchMove)});
      else drawPerson(e.look,e.x,e.y,{heart:e.look==='camily'&&!!focus&&focus.id===e.id});
    }
    available.forEach(t=>{
      if(t.type==='object')drawObjectMarker(t,!!focus&&focus.id===t.id);
      else if(focus&&focus.id===t.id)renderLabel(t.name,t.x,t.y,true);
    });
    // Marca a posição escolhida com um toque no cenário.
    if(tapGoal && mode==='play'){
      circle(tapGoal.x,tapGoal.y,9+Math.sin(elapsed*7)*2,'#ffe8b384');
      circle(tapGoal.x,tapGoal.y,4,'#f7ca99');
    }
    // readable name label over player, and landmark marker
    text('LUIZ',state.position.x,state.position.y-77,13,'#ffefd4');
    if(state.area==='story'&&(state.chapter===1||state.chapter===2)){text('PALCO',65,302,12,'#f7dfae');text('✝',742,153,35,'#f7d59a');}
    const hint=$('actionHint');
    if(focus&&mode==='play'){hint.classList.remove('hidden');$('actionName').textContent=''+(focus.type==='npc'?'Conversar: ':'Interagir: ')+focus.name;}
    else hint.classList.add('hidden');
    $('touchInteract').querySelector('span').textContent=focus?(focus.type==='npc'?'Conversar':'Examinar'):'Interagir';
  }
  function tick(dt){
    elapsed+=dt;frames++;
    if(mode==='play'){
      let dx=Number(!!(keys.ArrowRight||keys.d))-Number(!!(keys.ArrowLeft||keys.a));
      let dy=Number(!!(keys.ArrowDown||keys.s))-Number(!!(keys.ArrowUp||keys.w));
      if(touchMove){dx=touchMove.x;dy=touchMove.y;}
      if(dx||dy)tapGoal=null; // Controle manual tem prioridade sobre tocar para andar.
      else if(tapGoal){
        const vx=tapGoal.x-state.position.x,vy=tapGoal.y-state.position.y;
        const distance=Math.hypot(vx,vy);
        if(distance<Math.max(8,185*dt+2)){
          state.position.x=tapGoal.x;state.position.y=tapGoal.y;
          const action=tapGoal.action;tapGoal=null;
          if(action)interact();
        }else {dx=vx/distance;dy=vy/distance;}
      }
      const size=Math.hypot(dx,dy)||1;
      state.position.x=clamp(state.position.x+dx/size*185*dt,42,915);
      state.position.y=clamp(state.position.y+dy/size*185*dt,243,489);
    }
    render();
  }
  let prev=performance.now();function frame(t){const dt=clamp((t-prev)/1000,0,.045);prev=t;tick(dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);

  window.addEventListener('keydown',e=>{
    const k=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
    if(mode==='play'){
      keys[k]=true;
      if(!e.repeat&&(k==='e'||k===' '||k==='Enter'))interact();
    } else if(mode==='puzzle'&&e.key==='Escape')closePuzzle();
    else if(mode==='dialog'&&/^[123]$/.test(k)){
      const b=$('dialogChoices').children[Number(k)-1];if(b)b.click();
    }
  });
  window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;});
  window.addEventListener('blur',()=>{keys={};touchMove=null;tapGoal=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};touchMove=null;tapGoal=null;persist();}});
  const vectors={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  document.querySelectorAll('[data-dir]').forEach(b=>{
    const start=e=>{e.preventDefault();if(b.setPointerCapture)b.setPointerCapture(e.pointerId);tapGoal=null;touchMove=vectors[b.dataset.dir];};
    const stop=e=>{e.preventDefault();touchMove=null;};
    b.addEventListener('pointerdown',start);b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',()=>{touchMove=null;});
  });
  $('touchInteract').addEventListener('click',interact);
  // Click/tap on an in-world NPC can interact when close enough, without bypassing exploration.
  canvas.addEventListener('pointerdown',e=>{
    if(mode!=='play')return;
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    const camera=getCamera();
    const x=clamp(camera.x+(e.clientX-rect.left)*camera.width/rect.width,42,915);
    const y=clamp((e.clientY-rect.top)*H/rect.height,243,489);
    const clicked=allTargets().find(t=>Math.hypot(x-t.x,(y-t.y)*.85)<(state.area==='world'?80:65));
    if(clicked&&state.area==='world'){clicked.action();return;}
    if(clicked){
      const goal={x:clamp(clicked.x,42,915),y:clamp(clicked.y+26,243,489),action:true};
      if(Math.hypot(state.position.x-clicked.x,(state.position.y-clicked.y)*.9)<73)interact();
      else tapGoal=goal;
    }else tapGoal={x,y,action:false};
  });
  $('journalToggle').addEventListener('click',()=>{
    const d=$('journalDialog'),entries=$('journalEntries');entries.replaceChildren();
    if(!state.notes.length){const p=document.createElement('p');p.textContent='O diário ainda está em branco. Sua história está começando.';entries.appendChild(p);}
    state.notes.forEach(note=>{const el=document.createElement('div');el.className='journal-entry';const title=document.createElement('strong');title.textContent=note.title;const p=document.createElement('p');p.textContent=note.paragraph;el.append(title,p);entries.appendChild(el);});
    d.showModal();
  });
  $('journalClose').addEventListener('click',()=>$('journalDialog').close());
  // Instalação opcional: aparece apenas quando navegador oferece um convite real de PWA.
  let deferredInstall=null;
  window.addEventListener('beforeinstallprompt', e=>{
    e.preventDefault();deferredInstall=e;
    $('installApp').classList.remove('hidden');
  });
  $('installApp').addEventListener('click', async()=>{
    if(!deferredInstall)return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall=null;
    $('installApp').classList.add('hidden');
  });
  window.addEventListener('appinstalled',()=>{$('installApp').classList.add('hidden');deferredInstall=null;});
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && (location.protocol==='https:'||location.hostname==='localhost')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
  // Programmatic hooks for local automated playtesting (no gameplay dependency).
  window.__gameTest={getState:()=>JSON.parse(JSON.stringify(state)),setPosition:(x,y)=>{state.position={x,y};},interact:()=>interact(),start:()=>start(true),enterArea,passDay,pray,registerMistake,plant:(i,id)=>plant(i,id),plotAction, sellHarvest};
  updateHUD();
})();