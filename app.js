

  /* Mūsu dzimtas koks — stabila versija lietotnei ar dati.js + lietotne.js */
(function(){
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const raw = (typeof PEOPLE!=='undefined') ? PEOPLE :
              (typeof CILVĒKI!=='undefined') ? CILVĒKI :
              (typeof cilvēki!=='undefined') ? cilvēki : [];

  function arr(v){ return Array.isArray(v) ? v : (v ? [v] : []); }
  function norm(p,i){
    const g = p.gender ?? p.dzimums ?? p.sex ?? '';
    const gender = String(g).toUpperCase().startsWith('F') || String(g).toLowerCase().startsWith('s') ? 'F' :
                   (String(g).toUpperCase().startsWith('M') || String(g).toLowerCase().startsWith('v') ? 'M' : '');
    return {
      id: String(p.id ?? ('p'+i)),
      firstName: String(p.firstName ?? p.vārds ?? p.vards ?? p['vārds'] ?? '').trim(),
      lastName: String(p.lastName ?? p.uzvārds ?? p.uzvards ?? p['uzvārds'] ?? '').trim(),
      gender,
      parents: arr(p.parents ?? p.vecāki ?? p.vecaki ?? p['vecāki'] ?? p['vecāki ID']).map(String),
      partnerId: p.partnerId ?? p['partnera ID'] ?? p['partneraID'] ?? p.partners ?? '',
      birth: String(p.birth ?? p.dzimšana ?? p.dzimsana ?? '').trim(),
      death: String(p.death ?? p.miršana ?? p.mirsana ?? '').trim(),
      photo: p.photo ?? p.foto ?? '',
      place: String(p.place ?? p.vieta ?? '').trim(),
      bio: String(p.bio ?? p.apraksts ?? p.stāsts ?? p.stasts ?? '').trim()
    };
  }

  let people = raw.map(norm).filter(p=>p.firstName || p.lastName);
  const byId = () => new Map(people.map(p=>[p.id,p]));
  let zoom=0.72, ox=0, oy=10, editMode=false, photoData='';
  const STORAGE='familyTreeDataV4';

  // Use saved edits only if they are based on the current family dataset.
  try {
  const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
  if (Array.isArray(saved) && saved.length >= people.length) {
    const savedById = new Map(saved.map(p => [String(p.id), p]));
    people = people.map(p => {
      const s = savedById.get(String(p.id));
      return s ? { ...p, ...s, photo: p.photo || s.photo || '' } : p;
    });
  }
} catch(e) {}

  function full(p){return [p.firstName,p.lastName].filter(Boolean).join(' ')}
  function save(){localStorage.setItem(STORAGE,JSON.stringify(people))}
  function toast(t){const x=$('toast'); if(!x)return; x.textContent=t; x.classList.add('show'); setTimeout(()=>x.classList.remove('show'),2200)}

  function makeUnits(){
    const map=byId(), used=new Set(), units=[];
    people.forEach(p=>{
      if(used.has(p.id)) return;
      const q=p.partnerId && map.get(String(p.partnerId));
      if(q && q.partnerId===p.id){ units.push({people:[p,q]}); used.add(p.id); used.add(q.id); }
      else { units.push({people:[p]}); used.add(p.id); }
    });
    const personUnit=new Map(); units.forEach(u=>u.people.forEach(p=>personUnit.set(p.id,u)));
    units.forEach(u=>{
      u.children=people.filter(ch=>ch.parents.some(pid=>u.people.some(p=>p.id===pid))).map(ch=>personUnit.get(ch.id)).filter(Boolean);
      u.children=[...new Set(u.children)];
    });
    return {units,personUnit};
  }

  function generations(units, personUnit){
    const memo=new Map(), visiting=new Set();
    function level(u){
      if(memo.has(u)) return memo.get(u);
      if(visiting.has(u)) return 0;
      visiting.add(u);
      let best=0;
      u.people.forEach(p=>p.parents.forEach(pid=>{const pu=personUnit.get(pid); if(pu && pu!==u) best=Math.max(best,level(pu)+1)}));
      visiting.delete(u); memo.set(u,best); return best;
    }
    units.forEach(level);
    // spouses without parents inherit their partner's generation automatically because they share a unit.
    return memo;
  }

  function render(){
    const tree=$('tree'); if(!tree)return;
    tree.innerHTML='';
    const {units,personUnit}=makeUnits();
    const gen=generations(units,personUnit);
    const gapX=70, gapY=165, unitGap=34, nodeW=235, heartW=32, unitOwnW=u=>u.people.length===2?nodeW*2+heartW:nodeW;
    const roots=units.filter(u=>!u.people.some(p=>p.parents.some(pid=>personUnit.get(pid))));
    const childrenMap=new Map(units.map(u=>[u,u.children||[]]));
    const widthMemo=new Map(), visiting=new Set();
    function subtreeWidth(u){
      if(widthMemo.has(u)) return widthMemo.get(u);
      if(visiting.has(u)) return unitOwnW(u);
      visiting.add(u);
      const kids=(childrenMap.get(u)||[]).filter(c=>c!==u);
      const kidsW=kids.length ? kids.reduce((s,c)=>s+subtreeWidth(c),0)+unitGap*(kids.length-1) : 0;
      const w=Math.max(unitOwnW(u),kidsW);
      visiting.delete(u); widthMemo.set(u,w); return w;
    }
    roots.forEach(subtreeWidth);
    let total=roots.reduce((s,r)=>s+subtreeWidth(r),0)+gapX*Math.max(0,roots.length-1);
    total=Math.max(total,900);
    const positions=new Map(), lines=[];
    function layout(u,left,level){
      const w=subtreeWidth(u), kids=(childrenMap.get(u)||[]).filter(c=>c!==u);
      const own=unitOwnW(u), center=left+w/2;
      positions.set(u,{x:center,y:level*gapY});
      if(kids.length){
        const childTotal=kids.reduce((s,c)=>s+subtreeWidth(c),0)+unitGap*(kids.length-1);
        let x=center-childTotal/2;
        kids.forEach(c=>{layout(c,x,level+1); x+=subtreeWidth(c)+unitGap;});
        const childCenters=kids.map(c=>positions.get(c).x);
        lines.push({from:center,toMin:Math.min(...childCenters),toMax:Math.max(...childCenters),y:level*gapY});
      }
    }
    let x=0; roots.forEach(r=>{layout(r,x,0); x+=subtreeWidth(r)+gapX;});
    const minX=Math.min(0,...[...positions.values()].map(p=>p.x-150));
    positions.forEach(p=>p.x-=minX-60);
    const height=Math.max(700,(Math.max(...[...positions.values()].map(p=>p.y),0)+220));
    const width=Math.max(1400,total+160);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('lines'); svg.setAttribute('width',width); svg.setAttribute('height',height);
    const ns='http://www.w3.org/2000/svg';
    lines.forEach(l=>{
      const y=l.y+112, mid=y+32, childY=l.y+gapY;
      const path=document.createElementNS(ns,'path');
      path.setAttribute('d',`M ${l.from} ${y} V ${mid} M ${l.toMin} ${mid} H ${l.toMax} M ${(l.toMin+l.toMax)/2} ${mid} V ${childY}`);
      path.setAttribute('fill','none'); path.setAttribute('stroke','#8e8981'); path.setAttribute('stroke-width','2.2');
      svg.appendChild(path);
    });
    tree.appendChild(svg);

    units.forEach(u=>{
      const p=positions.get(u); const f=document.createElement('div'); f.className='family';
      f.style.left=p.x+'px'; f.style.top=p.y+'px';
      u.people.forEach((x,i)=>{
        const b=document.createElement('button'); b.className='node '+(x.gender==='F'?'f':''); b.dataset.id=x.id;
        const pic=x.photo?`<img src="${esc(x.photo)}">`:`<div class="avatar">${x.gender==='F'?'👩':'👨'}</div>`;
        const role=x.parents.length?(x.gender==='F'?'MEITA':'DĒLS'):'';
        b.innerHTML=pic+`<div><div class="n">${esc(full(x))}</div><div class="d">${esc(x.birth)}${x.birth&&x.death?' – ':''}${esc(x.death)}</div><div class="p">${esc(x.place)}</div>${role?`<span class="role">${role}</span>`:''}</div>`;
        b.onclick=()=>editMode?openEditor(x.id):details(x); f.appendChild(b);
        if(u.people.length===2 && i===0){const h=document.createElement('div');h.className='heartbox';h.textContent='♥';f.appendChild(h)}
      });
      tree.appendChild(f);
    });
    transform();
  }

  function transform(){const t=$('tree'); if(!t)return; t.style.transform=`translate(${ox}px,${oy}px) scale(${zoom})`; const r=$('reset'); if(r)r.textContent=Math.round(zoom*100)+'%';}
  function fill(p){
    const ps=$('parents'), pt=$('partner'); if(!ps||!pt)return; ps.innerHTML=''; pt.innerHTML='<option value="">— nav norādīts —</option>';
    people.filter(x=>x.id!==p?.id).forEach(x=>{
      ps.insertAdjacentHTML('beforeend',`<option value="${esc(x.id)}" ${(p?.parents||[]).includes(x.id)?'selected':''}>${esc(full(x))}</option>`);
      pt.insertAdjacentHTML('beforeend',`<option value="${esc(x.id)}" ${p?.partnerId===x.id?'selected':''}>${esc(full(x))}</option>`);
    });
  }
  function openEditor(id=''){
    const p=id&&people.find(x=>x.id===id); if(!p && !editMode)return;
    $('pid').value=id; $('title').textContent=p?'Rediģēt personu':'Pievienot personu';
    $('first').value=p?.firstName||''; $('last').value=p?.lastName||''; $('birth').value=p?.birth||''; $('death').value=p?.death||''; $('gender').value=p?.gender||''; $('place').value=p?.place||''; $('bio').value=p?.bio||''; photoData=p?.photo||'';
    $('drop').innerHTML=photoData?`<img src="${esc(photoData)}">`:`📷<small>Noklikšķini, lai pievienotu foto</small><input id="photo" type="file" accept="image/*">`;
    const ph=$('photo'); if(ph)ph.onchange=e=>readPhoto(e.target.files[0]); fill(p); $('panel').classList.remove('hidden');
  }
  function readPhoto(f){if(!f)return;if(f.size>2000000){toast('Foto maksimums 2 MB.');return}const r=new FileReader();r.onload=()=>{photoData=r.result;$('drop').innerHTML=`<img src="${esc(photoData)}">`};r.readAsDataURL(f)}
  function details(p){const d=$('details'); if(!d)return; d.innerHTML=`<div class="details">${p.photo?`<img src="${esc(p.photo)}">`:''}<h2>${esc(full(p))}</h2><p><b>Dzimšana:</b> ${esc(p.birth||'—')}<br><b>Miršana:</b> ${esc(p.death||'—')}<br><b>Vieta:</b> ${esc(p.place||'—')}</p><p>${esc(p.bio||'')}</p></div>`; const dlg=$('dlg'); if(dlg)dlg.showModal();}

  if($('edit'))$('edit').onclick=()=>{editMode=!editMode;$('edit').textContent=editMode?'✓ Rediģēšana':'✎ Rediģēt';$('panel').classList.toggle('hidden',!editMode);render()};
  if($('close'))$('close').onclick=$('cancel').onclick=()=>{$('panel').classList.add('hidden')};
  if($('drop'))$('drop').onclick=()=>{const x=$('photo');if(x)x.click()};
  if($('form'))$('form').onsubmit=e=>{e.preventDefault();let id=$('pid').value,p=id&&people.find(x=>x.id===id);if(!p){id='p'+Date.now();p={id,firstName:'',lastName:'',gender:'',parents:[],partnerId:'',birth:'',death:'',photo:'',place:'',bio:''};people.push(p)}Object.assign(p,{firstName:$('first').value.trim(),lastName:$('last').value.trim(),birth:$('birth').value.trim(),death:$('death').value.trim(),gender:$('gender').value,place:$('place').value.trim(),bio:$('bio').value.trim(),photo:photoData,parents:[...$('parents').selectedOptions].map(o=>o.value),partnerId:$('partner').value});save();$('panel').classList.add('hidden');render();toast('Persona saglabāta.')};
  if($('search'))$('search').oninput=()=>{const q=$('search').value.toLowerCase();document.querySelectorAll('.node').forEach(n=>{const p=people.find(x=>x.id===n.dataset.id);n.classList.toggle('hit',!!q&&full(p).toLowerCase().includes(q))})};
  if($('plus'))$('plus').onclick=()=>{zoom=Math.min(1.6,zoom+.1);transform()}; if($('minus'))$('minus').onclick=()=>{zoom=Math.max(.4,zoom-.1);transform()}; if($('reset'))$('reset').onclick=()=>{zoom=.72;ox=0;oy=10;transform()};
  let drag=false,sx=0,sy=0,a=0,b=0; const vp=$('vp');
  if(vp){vp.onpointerdown=e=>{if(e.target.closest('.node'))return;drag=true;sx=e.clientX;sy=e.clientY;a=ox;b=oy;vp.setPointerCapture(e.pointerId);vp.style.cursor='grabbing'};vp.onpointermove=e=>{if(drag){ox=a+e.clientX-sx;oy=b+e.clientY-sy;transform()}};vp.onpointerup=()=>{drag=false;vp.style.cursor='grab'};}
  if($('xd'))$('xd').onclick=()=>{const d=$('dlg');if(d)d.close()};
  // Always render from the normalized current dataset; no dependency on the old app.js variable names.
  render();
})();

  
  
