


 
let people=PEOPLE.map(p=>({...p,parents:[...(p.parents||[])]})),zoom=.72,ox=0,oy=10,editMode=false,photoData="";
const $=id=>document.getElementById(id),full=p=>(p.firstName+" "+p.lastName).trim(),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
if(localStorage.familyTreeDataV3)try{people=JSON.parse(localStorage.familyTreeDataV3)}catch{}
function save(){localStorage.familyTreeDataV3=JSON.stringify(people)}function toast(t){let x=$("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function gen(){let m=new Map();function g(p,s=new Set()){if(m.has(p.id))return m.get(p.id);if(!p.parents.length||s.has(p.id)){m.set(p.id,0);return 0}let a=p.parents.map(id=>people.find(x=>x.id===id)).filter(Boolean),v=a.length?Math.max(...a.map(x=>g(x,new Set([...s,p.id]))))+1:0;m.set(p.id,v);return v}people.forEach(p=>g(p));return m}
function units(){let used=new Set(),u=[];people.forEach(p=>{if(used.has(p.id))return;let q=p.partnerId&&people.find(x=>x.id===p.partnerId&&x.partnerId===p.id);if(q){u.push([p,q]);used.add(p.id);used.add(q.id)}else{u.push([p]);used.add(p.id)}});return u}
function render(){
  const tree=$("tree");
  tree.innerHTML="";
  const level=gen();

  // Build family units: a couple is one unit, a single person is one unit.
  const familyUnits=units();
  const unitOf=new Map();
  familyUnits.forEach(u=>u.forEach(p=>unitOf.set(p.id,u)));

  // A person's children belong to the family unit formed by their parents.
  const childrenOf=new Map();
  people.forEach(ch=>{
    if(!ch.parents?.length)return;
    const parentUnits=[...new Set(ch.parents.map(id=>unitOf.get(id)).filter(Boolean))];
    if(!parentUnits.length)return;
    const parentKey=parentUnits[0][0].id;
    if(!childrenOf.has(parentKey))childrenOf.set(parentKey,[]);
    const arr=childrenOf.get(parentKey);
    if(!arr.some(x=>x.id===ch.id))arr.push(ch);
  });

  // Give every family unit a generation based on its child/person level.
  const unitLevel=new Map();
  familyUnits.forEach(u=>{
    const lv=Math.max(...u.map(p=>level.get(p.id)||0));
    unitLevel.set(u[0].id,lv);
  });

  // Keep the main ancestral line centered and place sibling families as a row.
  const levels=new Map();
  familyUnits.forEach(u=>{
    const lv=unitLevel.get(u[0].id)||0;
    if(!levels.has(lv))levels.set(lv,[]);
    levels.get(lv).push(u);
  });

  // Stable order: primarily by the earliest parent sibling order in the data.
  for(const arr of levels.values()){
    arr.sort((a,b)=>{
      const ap=a[0].parents?.[0]||"";
      const bp=b[0].parents?.[0]||"";
      const ai=people.findIndex(p=>p.id===a[0].id);
      const bi=people.findIndex(p=>p.id===b[0].id);
      return (ap===bp?ai-bi:String(ap).localeCompare(String(bp)));
    });
  }

  const CARD_W=235, GAP=52, COUPLE_GAP=18, ROW_H=205;
  const unitWidth=u=>u.length===2?(CARD_W*2+COUPLE_GAP):CARD_W;
  const pos=new Map();

  // Lay each generation out independently, centered around the tree.
  const maxLevel=Math.max(...level.values(),0);
  for(let lv=0;lv<=maxLevel;lv++){
    const arr=levels.get(lv)||[];
    if(!arr.length)continue;
    const total=arr.reduce((s,u)=>s+unitWidth(u),0)+Math.max(0,arr.length-1)*GAP;
    let x=-total/2;
    arr.forEach(u=>{
      const w=unitWidth(u);
      pos.set(u[0].id,{x:x+w/2,y:lv*ROW_H});
      x+=w+GAP;
    });
  }

  // Move levels so the top ancestor starts near the center of the viewport.
  const svgW=Math.max(3200,Math.min(9000,
    Math.max(...[...levels.values()].map(arr=>
      arr.reduce((s,u)=>s+unitWidth(u),0)+Math.max(0,arr.length-1)*GAP
    ),1200)+500));
  const svgH=(maxLevel+1)*ROW_H+190;

  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.classList.add("lines");
  svg.setAttribute("width",svgW);
  svg.setAttribute("height",svgH);
  svg.setAttribute("viewBox",`${-svgW/2} 0 ${svgW} ${svgH}`);

  // Connector from a parent family unit to its children.
  const parentCenters=new Map();
  familyUnits.forEach(u=>parentCenters.set(u[0].id,pos.get(u[0].id)));

  const line=(x1,y1,x2,y2,cls="family-line")=>{
    const el=document.createElementNS("http://www.w3.org/2000/svg","path");
    const mid=y1+(y2-y1)*0.48;
    el.setAttribute("d",`M ${x1} ${y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${y2}`);
    el.setAttribute("class",cls); el.setAttribute("fill","none"); el.setAttribute("stroke","#8e8981"); el.setAttribute("stroke-width","2.4"); el.setAttribute("stroke-linecap","round");
    svg.appendChild(el);
  };

  // For every family unit, connect its parents' family unit to the child unit.
  familyUnits.forEach(u=>{
    const child=u[0];
    if(!child.parents?.length)return;
    const parentUnits=[...new Set(child.parents.map(id=>unitOf.get(id)).filter(Boolean))];
    const target=pos.get(u[0].id);
    if(!target||!parentUnits.length)return;

    const parentPts=parentUnits.map(pu=>pos.get(pu[0].id)).filter(Boolean);
    if(!parentPts.length)return;

    const yTop=Math.min(...parentPts.map(p=>p.y))+112;
    const yBottom=target.y-8;
    const left=Math.min(...parentPts.map(p=>p.x));
    const right=Math.max(...parentPts.map(p=>p.x));
    const junction=(left+right)/2;

    // If the parents are one couple, make a clean central trunk.
    if(parentPts.length===1){
      line(parentPts[0].x,yTop,target.x,yBottom);
    }else{
      const bus=document.createElementNS("http://www.w3.org/2000/svg","path");
      const mid=yTop+(yBottom-yTop)*0.48;
      bus.setAttribute("d",`M ${left} ${yTop} L ${left} ${mid} L ${right} ${mid} L ${right} ${yTop} M ${junction} ${mid} L ${target.x} ${mid} L ${target.x} ${yBottom}`);
      bus.setAttribute("class","family-line"); bus.setAttribute("fill","none"); bus.setAttribute("stroke","#8e8981"); bus.setAttribute("stroke-width","2.4"); bus.setAttribute("stroke-linecap","round");
      svg.appendChild(bus);
    }
  });

  tree.appendChild(svg);

  // Generation captions make the hierarchy obvious.
  for(let lv=0;lv<=maxLevel;lv++){
    if(!levels.has(lv))continue;
    const tag=document.createElement("div");
    tag.className="generation";
    tag.textContent=`${lv+1}. paaudze`;
    tag.style.left="-1200px";
    tag.style.top=(lv*ROW_H+4)+"px";
    tree.appendChild(tag);
  }

  // Cards.
  familyUnits.forEach(u=>{
    const p=pos.get(u[0].id);
    const f=document.createElement("div");
    f.className="family";
    f.style.left=p.x+"px";
    f.style.top=p.y+"px";

    u.forEach((x,i)=>{
      const b=document.createElement("button");
      b.className="node "+(x.gender==="F"?"f":"");
      b.dataset.id=x.id;
      const pic=x.photo
        ?`<img src="${esc(x.photo)}">`
        :`<div class="avatar">${x.gender==="F"?"👩":"👨"}</div>`;
      const role=x.parents?.length?(x.gender==="F"?"MEITA":"DĒLS"):"";
      b.innerHTML=pic+`<div>
        <div class="n">${esc(full(x))}</div>
        <div class="d">${esc(x.birth||"")}${x.birth&&x.death?" – ":""}${esc(x.death||"")}</div>
        <div class="p">${esc(x.place||"")}</div>
        ${role?`<span class="role">${role}</span>`:""}
      </div>`;
      b.onclick=()=>editMode?openEditor(x.id):details(x);
      f.appendChild(b);

      if(u.length===2&&i===0){
        const h=document.createElement("div");
        h.className="heartbox";
        h.textContent="♥";
        h.title="Pāris / laulātie";
        f.appendChild(h);
      }
    });
    tree.appendChild(f);
  });

  transform();
}
function transform(){$("tree").style.transform=`translate(${ox}px,${oy}px) scale(${zoom})`;$("reset").textContent=Math.round(zoom*100)+"%"}
function fill(p){$("parents").innerHTML="";$("partner").innerHTML='<option value="">— nav norādīts —</option>';people.filter(x=>x.id!==p?.id).forEach(x=>{$("parents").insertAdjacentHTML("beforeend",`<option value="${x.id}" ${(p?.parents||[]).includes(x.id)?"selected":""}>${esc(full(x))}</option>`);$("partner").insertAdjacentHTML("beforeend",`<option value="${x.id}" ${p?.partnerId===x.id?"selected":""}>${esc(full(x))}</option>`)})}
function openEditor(id=""){let p=id&&people.find(x=>x.id===id);$("pid").value=id;$("title").textContent=p?"Rediģēt personu":"Pievienot personu";$("first").value=p?.firstName||"";$("last").value=p?.lastName||"";$("birth").value=p?.birth||"";$("death").value=p?.death||"";$("gender").value=p?.gender||"";$("place").value=p?.place||"";$("bio").value=p?.bio||"";photoData=p?.photo||"";$("drop").innerHTML=photoData?`<img src="${esc(photoData)}">`:`📷<small>Noklikšķini, lai pievienotu foto</small><input id="photo" type="file" accept="image/*">`;if(!photoData)$("photo").onchange=e=>readPhoto(e.target.files[0]);fill(p);$("panel").classList.remove("hidden")}
function readPhoto(f){if(!f)return;if(f.size>2000000){toast("Foto maksimums 2 MB.");return}let r=new FileReader();r.onload=()=>{photoData=r.result;$("drop").innerHTML=`<img src="${esc(photoData)}">`};r.readAsDataURL(f)}
$("edit").onclick=()=>{editMode=!editMode;$("edit").textContent=editMode?"✓ Rediģēšana":"✎ Rediģēt";$("panel").classList.toggle("hidden",!editMode);render()};$("close").onclick=$("cancel").onclick=()=>$("panel").classList.add("hidden");$("drop").onclick=()=>{let x=$("photo");if(x)x.click()};
$("form").onsubmit=e=>{e.preventDefault();let id=$("pid").value,p=id?people.find(x=>x.id===id):null;if(!p){id="p"+Date.now();p={id,parents:[],partnerId:""};people.push(p)}Object.assign(p,{firstName:$("first").value.trim(),lastName:$("last").value.trim(),birth:$("birth").value.trim(),death:$("death").value.trim(),gender:$("gender").value,place:$("place").value.trim(),bio:$("bio").value.trim(),photo:photoData,parents:[...$("parents").selectedOptions].map(o=>o.value),partnerId:$("partner").value});save();$("panel").classList.add("hidden");render();toast("Persona saglabāta.")};
$("photo").onchange=e=>readPhoto(e.target.files[0]);$("search").oninput=()=>{let q=$("search").value.toLowerCase();document.querySelectorAll(".node").forEach(n=>{let p=people.find(x=>x.id===n.dataset.id);n.classList.toggle("hit",q&&full(p).toLowerCase().includes(q))})};$("plus").onclick=()=>{zoom=Math.min(1.8,zoom+.1);transform()};$("minus").onclick=()=>{zoom=Math.max(.45,zoom-.1);transform()};$("reset").onclick=()=>{zoom=.72;ox=0;oy=10;transform()};
let drag=0,sx,sy,a,b,v=$("vp");v.onpointerdown=e=>{if(e.target.closest(".node"))return;drag=1;sx=e.clientX;sy=e.clientY;a=ox;b=oy;v.setPointerCapture(e.pointerId)};v.onpointermove=e=>{if(drag){ox=a+e.clientX-sx;oy=b+e.clientY-sy;transform()}};v.onpointerup=()=>drag=0;
function details(p){$("details").innerHTML=`<div class="details">${p.photo?`<img src="${esc(p.photo)}">`:""}<h2>${esc(full(p))}</h2><p><b>Dzimšana:</b> ${esc(p.birth||"—")}<br><b>Miršana:</b> ${esc(p.death||"—")}<br><b>Vieta:</b> ${esc(p.place||"—")}</p><p>${esc(p.bio||"")}</p></div>`;$("dlg").showModal()}$("xd").onclick=()=>$("dlg").close();render();
