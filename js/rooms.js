/* ===== v2: rooms, tournament, hooks ===== */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const byId=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROOM={code:null,data:null,ref:null,started:0,lastPush:-1};
let PID='';
const RANK_PTS=[10,7,5,3,2,1];
function openRoom(){
  if(!DB_ENABLED){showToast('ต้องเชื่อมฐานข้อมูลก่อนจึงเล่นห้องได้');return;}
  byId('startScreen').classList.add('hidden');byId('roomScreen').classList.remove('hidden');
  byId('roomName').value=AUTH.name||'';byId('roomName').disabled=true;
}
function roomPlayerName(){const n=(byId('roomName').value.trim()||'ผู้เล่น').slice(0,16);localStorage.setItem('voltrushName',n);return n;}
async function createRoom(){
  const name=roomPlayerName();const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code='';
  for(let t=0;t<8;t++){code='';for(let i=0;i<4;i++)code+=ch[Math.floor(Math.random()*ch.length)];const x=await DB.ref('rooms/'+code).once('value');if(!x.exists())break;}
  await DB.ref('rooms/'+code).set({host:PID,rounds:+byId('roomRounds').value,duration:+byId('roomDur').value,round:0,status:'lobby',seed:0,created:Date.now()});
  await joinRoom(code,name);
}
async function joinRoom(code,name){
  code=(code||byId('roomCode').value).trim().toUpperCase();name=name||roomPlayerName();
  if(code.length!==4){showToast('ใส่รหัสห้อง 4 ตัว');return;}
  const ref=DB.ref('rooms/'+code);const x=await ref.once('value');
  if(!x.exists()){showToast('ไม่พบห้อง '+code);return;}
  const d=x.val();const mine=d.players&&d.players[PID];
  if(d.status==='playing'&&!mine){showToast('รอบนี้เริ่มไปแล้ว รอรอบถัดไปนะ');return;}
  if(!mine&&Object.keys(d.players||{}).length>=4){showToast('ห้องเต็ม (สูงสุด 4 คน)');return;}
  const me=ref.child('players/'+PID);
  if(!mine)await me.set({name:name,av:AUTH.avatar,tr:AUTH.p?AUTH.p.trophies:0,live:0,done:true});else await me.update({name:name,av:AUTH.avatar,tr:AUTH.p?AUTH.p.trophies:0});
  me.child('done').onDisconnect().set(true);
  ROOM.code=code;ROOM.ref=ref;ROOM.started=0;
  ref.on('value',sn=>{ROOM.data=sn.val();onRoom();});
  byId('roomEntry').classList.add('hidden');byId('roomLobby').classList.remove('hidden');byId('roomCodeBig').textContent=code;
}
function onRoom(){
  const r=ROOM.data;if(!r){leaveRoom();showToast('ห้องถูกปิดแล้ว');return;}
  const ps=r.players||{},ids=Object.keys(ps),host=r.host===PID;
  if(r.status==='playing'&&ROOM.started!==r.round&&ps[PID]&&ps[PID].done===false){ROOM.started=r.round;startRoomRound(r);}
  if(r.status==='playing'&&host&&ids.length&&ids.every(k=>ps[k].done))ROOM.ref.update({status:r.round>=r.rounds?'finished':'between'});
  renderRoom(r);renderLive(r);
}
function startRoomRound(r){
  byId('roomScreen').classList.add('hidden');selectedDuration=r.duration;selectedFreqKey='normal';
  rng=mulberry32((r.seed||1)+r.round*7919);CUR_MAP=((r.seed||1)+r.round)%MAPS.length;startGame();
}
function hostStart(){
  const r=ROOM.data;if(!r||r.host!==PID)return;
  const fin=r.status==='finished',b='rooms/'+ROOM.code+'/',o={};
  o[b+'status']='playing';o[b+'round']=fin?1:(r.round||0)+1;o[b+'seed']=1+Math.floor(Math.random()*1e9);
  Object.keys(r.players||{}).forEach(k=>{o[b+'players/'+k+'/done']=!!((r.players[k]||{}).bot);o[b+'players/'+k+'/live']=0;if(fin)o[b+'players/'+k+'/scores']=null;});
  DB.ref().update(o);
}
function hostForceEnd(){const r=ROOM.data;if(r&&r.host===PID)ROOM.ref.update({status:r.round>=r.rounds?'finished':'between'});}
function roomSubmit(){
  const r=ROOM.data;if(!r)return;const f=currentScore(),b='rooms/'+ROOM.code+'/players/'+PID+'/',o={};
  o[b+'done']=true;o[b+'live']=f;o[b+'scores/r'+r.round]=f;DB.ref().update(o);
}
function standings(r){
  const ps=JSON.parse(JSON.stringify(r.players||{})),nr=r.status==='playing'?(r.round||0)-1:(r.round||0);Object.values(ps).forEach(p=>{if(p.bot){p.scores={};for(let j=1;j<=nr;j++)p.scores['r'+j]=Math.round(r.duration*14*p.skill);}});const ids=Object.keys(ps),pts={};ids.forEach(k=>pts[k]=0);
  for(let i=1;i<=nr;i++){
    ids.filter(k=>ps[k].scores&&ps[k].scores['r'+i]!==undefined).sort((a,b)=>ps[b].scores['r'+i]-ps[a].scores['r'+i]).forEach((k,n)=>pts[k]+=RANK_PTS[n]||1);
  }
  return ids.map(k=>{const p=ps[k],sc=p.scores||{};return{id:k,av:p.av,tr:p.tr,name:p.name,pts:pts[k],cur:sc['r'+r.round],live:liveOf(p,r),total:Object.values(sc).reduce((t,v)=>t+v,0)};}).sort((a,b)=>b.pts-a.pts||b.total-a.total);
}
function renderRoom(r){
  const host=r.host===PID,st=r.status,list=standings(r);
  byId('roomInfo').textContent='รอบ '+(r.round||0)+'/'+r.rounds+' • '+(r.duration/60)+' นาที/รอบ • '+({lobby:'รอเริ่ม',playing:'กำลังเล่น',between:'จบรอบ',finished:'จบทัวร์นาเมนต์'}[st]||'');
  const ol=byId('roomPlayers');ol.innerHTML='';
  list.forEach((p,i)=>{const li=document.createElement('li');li.textContent=(['🥇','🥈','🥉'][i]||'#'+(i+1))+' '+p.name+(p.id===PID?' (คุณ)':'')+' — '+p.pts+' แต้ม'+(p.cur!==undefined?' • รอบนี้ '+p.cur:(st==='playing'?' • กำลังเล่น '+p.live:''));li.prepend(avatarEl(p.av,26,p.tr));ol.appendChild(li);});
  const b=byId('roomStartBtn');b.classList.toggle('hidden',!host||st==='playing');
  b.textContent=st==='lobby'?'▶ เริ่มรอบที่ 1':st==='finished'?'🔁 เริ่มทัวร์นาเมนต์ใหม่':'▶ เริ่มรอบที่ '+((r.round||0)+1);
  byId('roomForceBtn').classList.toggle('hidden',!(host&&st==='playing'));
  byId('roomMsg').textContent=st==='finished'&&list[0]?'🏆 ผู้ชนะ: '+list[0].name:(!host&&st!=='playing'?'รอเจ้าของห้องเริ่ม...':'');
}
function renderLive(r){
  const el=byId('liveRank');
  if(!ROOM.code||!gameInProgress){el.classList.add('hidden');return;}
  el.classList.remove('hidden');
  el.innerHTML='<b>🏁 อันดับสด</b>'+Object.values(r.players||{}).sort((a,b)=>liveOf(b,r)-liveOf(a,r)).slice(0,5).map((p,i)=>'<div><em>'+(i+1)+'. '+esc(p.name)+'</em><span>'+liveOf(p,r)+'</span></div>').join('');
}
function copyRoom(){
  const u=location.origin+location.pathname.replace(/[^/]*$/,'')+'room.html?room='+ROOM.code;
  (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>showToast('คัดลอกลิงก์แล้ว'),()=>showToast(u));
}
function leaveRoom(){
  if(ROOM.ref){ROOM.ref.off();const r=ROOM.data;
    if(r&&r.status==='lobby')ROOM.ref.child('players/'+PID).remove();else ROOM.ref.child('players/'+PID+'/done').set(true);}
  ROOM.code=null;ROOM.data=null;ROOM.ref=null;rng=Math.random;
  byId('roomScreen').classList.add('hidden');byId('roomEntry').classList.remove('hidden');byId('roomLobby').classList.add('hidden');
  byId('liveRank').classList.add('hidden');byId('startScreen').classList.remove('hidden');
}
const _endGame=endGame;
endGame=function(m){
  _endGame(m);
  if(ROOM.code&&ROOM.data){roomSubmit();byId('endScreen').classList.add('hidden');byId('roomScreen').classList.remove('hidden');byId('roomEntry').classList.add('hidden');byId('roomLobby').classList.remove('hidden');}
};
const _renderGame=renderGame;
renderGame=function(){
  _renderGame();if(!state)return;
  const sh=byId('gameShell');sh.classList.toggle('hazard-alert',!!state.activeHazard);sh.classList.toggle('blackout',!!state.blackoutActive);
  let c=byId('comboChip');if(!c){c=document.createElement('div');c.id='comboChip';c.className='env-chip';byId('scoreChip').after(c);}
  const st=state.streak||0;c.textContent='🔥 คอมโบ '+st;c.classList.toggle('hot',st>=10);
  const sv=byId('scoreTopVal');if(sv.dataset.v!==sv.textContent){sv.dataset.v=sv.textContent;sv.classList.remove('bump');void sv.offsetWidth;sv.classList.add('bump');}
  document.querySelectorAll('.switch').forEach(x=>{x.setAttribute('role','switch');x.tabIndex=0;x.setAttribute('aria-checked',x.classList.contains('on'));});
  if(ROOM.code&&!state.prepping&&state.elapsed%2===0&&state.elapsed!==ROOM.lastPush){ROOM.lastPush=state.elapsed;ROOM.ref.child('players/'+PID+'/live').set(currentScore());if(ROOM.data)renderLive(ROOM.data);}
};
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('switch')){e.preventDefault();e.target.click();}});

