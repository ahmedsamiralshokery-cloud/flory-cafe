const DEFAULT_PHONE="01557543742";
const BLOBS={
  logo:"img/logo.jpg",
  m1:"img/menu-1.jpg",
  m2:"img/menu-2.jpg",
  m3:"img/menu-3.jpg",
  m4:"img/menu-4.jpg",
  m5:"img/menu-5.jpg",
  m6:"img/menu-6.jpg",
  IMG:{},
  CIMG:{}
};
const $=s=>document.querySelector(s),ar=s=>String(s).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const lsGet=k=>{try{return localStorage.getItem(k)||""}catch(_){return ""}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}};

/* ---- Theme toggle ---- */
const applyTheme=t=>{
  if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);
  else document.documentElement.removeAttribute("data-theme");
  const isDark=t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches);
  const tb=$("#thm");if(tb)tb.textContent=isDark?"☀️":"🌙";
};
applyTheme(lsGet("flori_theme"));
$("#thm").onclick=()=>{
  const curT=document.documentElement.getAttribute("data-theme");
  const isDark=curT==="dark"||(!curT&&matchMedia("(prefers-color-scheme:dark)").matches);
  const next=isDark?"light":"dark";
  lsSet("flori_theme",next);applyTheme(next);
};

/* ---- State & Persistent Cart ---- */
let cur,orderMode="delivery",pend;
let S=JSON.parse(JSON.stringify(window.MENU_DATA||{}));
for(const k of["offers","sauces","msauces","areas"])S[k]=S[k]||[];
S.menu=S.menu||{};S.customCIMG=S.customCIMG||{};S.customBLOBS=S.customBLOBS||{};
for(const k in S.customBLOBS){if(k in BLOBS)BLOBS[k]=S.customBLOBS[k];}
S.phone=String(S.phone||DEFAULT_PHONE).trim();
S.phone2=String(S.phone2||"").trim();
const toEnDigits=s=>String(s||"").replace(/[٠-٩]/g,d=>"0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]).replace(/[^\d+]/g,"");
const waNumber=raw=>{
  let d=toEnDigits(raw).replace(/^\+/,"").replace(/^00/,"");
  if(!d)return "201557543742";
  if(d.startsWith("0")&&d.length===11)return "2"+d;
  if(d.startsWith("1")&&d.length===10)return "20"+d;
  return d;
};
const dispNumber=raw=>{
  const d=toEnDigits(raw).replace(/^\+/,"");
  if(!d)return DEFAULT_PHONE;
  if(d.startsWith("20")&&d.length===12)return "0"+d.slice(2);
  return d;
};
function syncPhone(){
  const p1=dispNumber(S.phone||DEFAULT_PHONE);
  const wa=waNumber(S.phone||DEFAULT_PHONE);
  document.querySelectorAll("[data-wa]").forEach(a=>{a.href="https://wa.me/"+wa});
  document.querySelectorAll("[data-tel]").forEach(a=>{a.href="tel:"+p1;a.textContent=(a.dataset.icon||"")+p1});
  const p2=toEnDigits(S.phone2||"").replace(/^\+/,"");
  const w2=$("#ph2Wrap"),a2=$("[data-tel2]");
  if(w2&&a2){
    if(p2){const d2=dispNumber(p2);a2.href="tel:"+d2;a2.textContent=d2;w2.hidden=false;}
    else{w2.hidden=true;a2.href="";a2.textContent="";}
  }
}

const cart=new Map();
try{
  const saved=JSON.parse(lsGet("flori_cart_v1")||"[]");
  if(Array.isArray(saved))saved.forEach(i=>{if(i&&i.n&&i.q>0)cart.set(i.n,{n:i.n,p:+i.p||0,q:+i.q})});
}catch(_){}
const saveCart=()=>lsSet("flori_cart_v1",JSON.stringify([...cart.values()]));

const pic=(im)=>{const u=im?(BLOBS[im]||BLOBS.IMG[im]||im):"";return u?`<img class="th" src="${u}" alt="" loading="lazy">`:""};
const src=o=>BLOBS.IMG[o.img]||o.img;
const feeOf=()=>{if(orderMode!=="delivery")return 0;const o=$("#area").selectedOptions[0];return o&&o.dataset.f!==undefined?+o.dataset.f:null};

let toastT;
const showToast=msg=>{
  const el=$("#toast");if(!el)return;
  el.textContent=msg;el.classList.add("show");
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove("show"),1600);
};
const addCart=(k,p)=>{
  const i=cart.get(k)||{n:k,p,q:0};i.q++;cart.set(k,i);saveCart();draw();
  showToast("تمت الإضافة للسلة ✓");
  const fb=$("#fab");if(fb){fb.classList.remove("bump");void fb.offsetWidth;fb.classList.add("bump");}
};

/* ---- Item Customization Modal (#saD) ---- */
const SUGAR_OPTS=["سادة","على الريحة","مظبوط","مانو","زيادة"];
function openPick(P){pend=P;pkDraw();$("#saD").showModal()}
function add(D){
  const p=+D.p,s=+D.s||0;
  const ing=D.r?D.r.split(/[+،,]/).map(x=>x.trim()).filter(Boolean):[];
  const go=pre=>{
    const n=D.n+(pre?" ("+pre+")":"");
    if(s<0)openPick({n,p,mode:"x",s,sel:[],list:S.sauces.map(x=>x[0])});
    else if(s>0)openPick({n,p,mode:"m",s,sel:[],list:S.msauces.map(x=>x[0])});
    else if(ing.length)openPick({n,p,mode:"r",s:0,sel:[],list:ing});
    else addCart(n,p);
  };
  if(D.sp==="1")openPick({n:D.n,p,mode:"s",sel:[],list:SUGAR_OPTS,next:go});
  else go("");
}
function pkDraw(){
  const P=pend,m=P.mode;
  const need=m==="m"?Math.min(P.s,P.list.length):m==="x"||m==="s"?1:0,c=P.sel.length;
  const t=m==="s"?P.n+" — اختار السكر":
    m==="r"?P.n+" — عايز تشيل حاجة؟ (اختياري)":
    m==="x"?P.n+" — اختار أي عدد، "+P.p+" جنيه لكل صوص ("+c+" = "+c*P.p+" جنيه)":
    P.n+" — اختار "+need+" صوص ("+c+"/"+need+")";
  const x=P.list.map(v=>{
    const count=P.sel.filter(item=>item===v).length;
    const on=count>0;
    return `<button class="chip" data-sa="${esc(v)}" aria-pressed="${on}">${esc(v)}${count>0&&m!=="r"&&m!=="s"?` (${ar(count)})`:""}</button>`+(m==="x"&&count>0?`<button class="chip" data-sd="${esc(v)}" aria-label="شيل ${esc(v)}">−</button>`:"");
  }).join("");
  $("#saT").textContent=ar(t);
  $("#saL").innerHTML=x;
  $("#saOk").disabled=c<need;
}

/* ---- Menu Rendering & Search ---- */
const renderItem=([n,d,p,s,ing,g,sp,im],catTag="")=>`<li>${pic(im)}<div>${catTag?`<span class="cat-tag">${esc(catTag)}</span><br>`:""}<b>${ar(esc(n))}</b>${d?`<small>${ar(esc(d))}</small>`:""}</div><span class="pr">${ar(p)} جنيه</span><button class="add" data-n="${esc(n)}" data-p="${p}" data-s="${s||0}" data-g="${g||""}" data-r="${esc(ing||"")}" data-sp="${sp?1:0}" aria-label="أضف ${esc(n)}">+</button></li>`;

function show(c){
  cur=c;
  const cImgUrl=(S.customCIMG&&S.customCIMG[c])||"";
  $("#catHead").innerHTML=cImgUrl?`<figure class="cimg"><img src="${cImgUrl}" alt="${esc(c)}"></figure>`:"";
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-selected",b.textContent===c));
  const items=S.menu[c]||[];
  $("#list").innerHTML=items.length?items.map(r=>renderItem(r)).join(""):'<li class="empty-msg">لا توجد أصناف في هذا القسم حاليًا.</li>';
}

function doSearch(){
  const q=$("#q").value.trim().toLowerCase();
  $("#qClr").hidden=!q;
  if(!q){show(cur||Object.keys(S.menu)[0]);return}
  $("#catHead").innerHTML="";
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-selected","false"));
  const hits=[];
  for(const [cat,items] of Object.entries(S.menu)){
    items.forEach(r=>{
      const hay=(r[0]+" "+(r[1]||"")+" "+cat).toLowerCase();
      if(hay.includes(q))hits.push(renderItem(r,cat));
    });
  }
  $("#list").innerHTML=hits.length?hits.join(""):'<li class="empty-msg">مفيش نتائج مطابقة للبحث ده.</li>';
}
$("#q").oninput=doSearch;
$("#qClr").onclick=()=>{$("#q").value="";doSearch();$("#q").focus()};

function offersDraw(){
  $("#offers").hidden=!S.offers.length;
  $("#offerList").innerHTML=S.offers.map(o=>`<article class="offer">${o.img?`<img src="${src(o)}" alt="${esc(o.n)}" loading="lazy">`:""}<div><b>${ar(esc(o.n))}</b><b class="pr">${ar(+o.p||0)} جنيه</b></div>${o.d?`<div><span>${ar(esc(o.d))}</span></div>`:""}<div><button class="btn y add-o" data-n="${esc(o.n)}" data-p="${+o.p||0}" data-s="${+o.s||0}" data-sp="${+o.sp||0}">أضف للطلب</button></div></article>`).join("");
}

function syncBlobs(){
  document.querySelectorAll("[data-b]").forEach(e=>{if(BLOBS[e.dataset.b])e.src=BLOBS[e.dataset.b]});
}

function init(){
  syncBlobs();
  syncPhone();
  $("#tabs").innerHTML="";
  Object.keys(S.menu).forEach(c=>{
    const b=document.createElement("button");
    b.type="button";b.textContent=c;b.role="tab";
    b.onclick=()=>{
      $("#q").value="";$("#qClr").hidden=true;show(c);
      b.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});
      const m=$("#menu");
      if(m&&m.getBoundingClientRect().top<-20)m.scrollIntoView({behavior:"smooth",block:"start"});
    };
    $("#tabs").append(b);
  });
  const k=$("#area").value||"x";
  $("#area").innerHTML='<option value="x" disabled selected>اختار منطقتك</option>'+
    S.areas.map(([n,f])=>`<option value="${esc(n)}" data-n="${esc(n)}" data-f="${+f||0}">${ar(esc(n))} — ${ar(+f||0)} جنيه</option>`).join("")+
    '<option value="" data-n="منطقة تانية">منطقة تانية (التوصيل هنتفق عليه)</option>';
  $("#area").value=[...$("#area").options].some(o=>o.value===k)?k:"x";
  const menuKeys=Object.keys(S.menu);
  if(menuKeys.length)show(S.menu[cur]?cur:menuKeys[0]);
  offersDraw();draw();
}

/* ---- Order Mode (Delivery / Table / Pickup) ---- */
function setOrderMode(m){
  orderMode=m;
  document.querySelectorAll("[data-om]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.om===m));
  $("#delWrap").hidden=m!=="delivery";
  $("#adWrap").hidden=m!=="delivery";
  $("#feeRow").hidden=m!=="delivery";
  $("#tblWrap").hidden=m!=="table";
  $("#err").textContent="";
  draw();
}
document.querySelectorAll("[data-om]").forEach(b=>b.onclick=()=>setOrderMode(b.dataset.om));

function adrFx(){
  const o=$("#area").value==="",a=$("#ad");
  a.classList.toggle("hl",o);a.rows=o?3:2;
  a.placeholder=o?"اكتب اسم المنطقة وعنوانك بالتفصيل":"العنوان بالتفصيل (الشارع، رقم العمارة...)";
  $("#adH").hidden=!o;if(o)a.focus();
}
$("#area").onchange=()=>{draw();adrFx()};
$("#noteBtn").onclick=()=>{const n=$("#note");n.hidden=!n.hidden;if(!n.hidden)n.focus()};
$("#clrCart").onclick=()=>{if(cart.size&&confirm("إفراغ كل المنتجات من السلة؟")){cart.clear();saveCart();draw()}};

/* Restore saved customer info */
if(lsGet("flori_nm"))$("#nm").value=lsGet("flori_nm");
if(lsGet("flori_ph"))$("#ph").value=lsGet("flori_ph");
if(lsGet("flori_ad"))$("#ad").value=lsGet("flori_ad");

function draw(){
  const a=[...cart.values()],n=a.reduce((s,i)=>s+i.q,0),t=a.reduce((s,i)=>s+i.q*i.p,0);
  const f=feeOf(),x=orderMode==="delivery"&&$("#area").value==="x";
  $("#cnt").textContent=ar(n);
  $("#tot").textContent=ar(t+(f||0));
  $("#sub").textContent=ar(t);
  $("#fee").textContent=x?"اختار منطقتك":f==null?"هنتفق عليه":ar(f)+" جنيه";
  $("#sum").textContent=ar(t+(f||0));
  $("#fab").hidden=!n;
  $("#lines").innerHTML=a.length?a.map(i=>`<li><span>${ar(esc(i.n))}</span><span class="q"><button data-q="${esc(i.n)}" data-d="-1" aria-label="أقل">−</button> ${ar(i.q)} <button data-q="${esc(i.n)}" data-d="1" aria-label="أكتر">+</button></span><b>${ar(i.q*i.p)}</b></li>`).join(""):"<li>السلة فاضية. ضيف حاجة من المنيو.</li>";
  if(!n&&$("#cartD").open)$("#cartD").close();
}

/* ---- Admin Panel (GitHub-backed CMS) ---- */
const AR="مناطق التوصيل",OF="العروض",SA="صوصات الاكسترا",MSA="صوصات الحلويات",CAT_TAB="الأقسام",SI="صور الموقع والمنيو الورقي",PH_TAB="رقم الهاتف",GH="إعدادات GitHub";
let adm;
const rows=()=>adm===GH||adm===SI||adm===CAT_TAB||adm===PH_TAB?[]:adm===AR?S.areas:adm===SA?S.sauces:adm===MSA?S.msauces:adm===OF?S.offers:S.menu[adm];
const rd=f=>new Promise(r=>{const R=new FileReader();R.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,720/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);r(c.toDataURL("image/jpeg",.8))};i.src=R.result};R.readAsDataURL(f)});

function admDraw(){
  const menuKeys=Object.keys(S.menu);
  if(!menuKeys.includes(adm)&&adm!==OF&&adm!==MSA&&adm!==SA&&adm!==AR&&adm!==CAT_TAB&&adm!==SI&&adm!==PH_TAB&&adm!==GH)adm=menuKeys[0]||OF;
  $("#admTabs").innerHTML=[...menuKeys,CAT_TAB,OF,MSA,SA,AR,PH_TAB,SI,GH].map(c=>`<button aria-selected="${c===adm}" data-c="${esc(c)}">${c}</button>`).join("");
  if(adm===PH_TAB){
    const curWa=waNumber(S.phone||DEFAULT_PHONE);
    $("#admBody").innerHTML='<p>تغيير رقم الواتساب والاتصال الخاص بالكافيه (بيتحفظ على GitHub وبيتغير في كل الموقع والطلبات):</p>'+
      '<label for="admPhone">رقم الواتساب والطلبات الرئيسي (مثال: 01557543742)</label>'+
      '<input id="admPhone" type="tel" dir="ltr" value="'+esc(S.phone||DEFAULT_PHONE)+'" placeholder="01557543742" autocomplete="off">'+
      '<p id="phPrev" style="font-size:.88rem;color:var(--mut);margin:-.2rem 0 .8rem">رابط الواتساب: <b dir="ltr">wa.me/'+esc(curWa)+'</b></p>'+
      '<label for="admPhone2">رقم تليفون إضافي للاتصال في الفوتر (اختياري)</label>'+
      '<input id="admPhone2" type="tel" dir="ltr" value="'+esc(S.phone2||"")+'" placeholder="اتركه فاضي لو مفيش رقم تاني" autocomplete="off">';
    return;
  }
  if(adm===GH){
    const c=ghCfg();
    $("#admBody").innerHTML='<p>التعديلات بتتحفظ على GitHub (ملف js/menu-data.js). ادخل البيانات مرة واحدة، وبتتحفظ على جهازك بس.</p>'+
      [["ghOwner","اسم حساب GitHub (owner)",c.owner],["ghRepo","اسم المستودع (repo)",c.repo],["ghBranch","الفرع (branch)",c.branch]].map(([id,l,v])=>`<label for="${id}">${l}</label><input id="${id}" value="${esc(v)}" autocomplete="off">`).join("")+
      '<label for="ghToken">التوكن (Fine-grained، صلاحية Contents: Read and write)</label><input id="ghToken" type="password" value="'+esc(c.token)+'" autocomplete="off">';
    return;
  }
  if(adm===CAT_TAB){
    let h='<p>إدارة أسامي أقسام المنيو (عدّل الاسم واضغط برّه للحفظ، أو احذف/أضف قسم جديد):</p>';
    Object.keys(S.menu).forEach(cat=>{
      h+=`<div class="ar"><input type="text" data-oldcat="${esc(cat)}" value="${esc(cat)}"><button data-delcat="${esc(cat)}">حذف القسم</button></div>`;
    });
    h+='<div style="margin-top:1rem;display:flex;gap:.5rem"><input type="text" id="newCatName" placeholder="اسم القسم الجديد" style="flex:1;margin:0"><button class="btn y" id="addCatBtn" type="button">إضافة قسم</button></div>';
    $("#admBody").innerHTML=h;return;
  }
  if(adm===SI){
    let h='<p>تعديل صور بانرات الأقسام وصور المنيو الورقي (6 صفحات):</p>';
    Object.keys(S.menu).forEach(cat=>{
      const curImg=(S.customCIMG&&S.customCIMG[cat])||"";
      h+=`<div class="of"><b>بانر قسم: ${esc(cat)}</b><br>${curImg?`<img class="th" src="${curImg}" alt="">`:""}<input type="file" accept="image/*" data-catimg="${esc(cat)}">${curImg?`<button data-rmcatimg="${esc(cat)}">حذف البانر</button>`:""}</div>`;
    });
    [["m1","المنيو 1 (القهوة والمشروبات الساخنة)"],["m2","المنيو 2 (ميلك شيك وفرابيه وآيس كوفي)"],["m3","المنيو 3 (سوفت كوكتيل وكوكتيل)"],["m4","المنيو 4 (سموزي وريد بول وإضافات)"],["m5","المنيو 5 (عصائر وآيس كريم)"],["m6","المنيو 6 (فطار ووافل وحلويات)"]].forEach(([mKey,label])=>{
      const mImg=BLOBS[mKey]||"";
      h+=`<div class="of"><b>${label}</b><br>${mImg?`<img class="th" src="${mImg}" alt="">`:""}<input type="file" accept="image/*" data-blobimg="${mKey}"></div>`;
    });
    $("#admBody").innerHTML=h;return;
  }
  const f=(i,k,v,x="")=>`<input data-i="${i}" data-k="${k}" value="${esc(v)}"${x}>`,N=' type="number"';
  $("#admBody").innerHTML=(adm===OF?S.offers.map((o,i)=>`<div class="of">${o.img?`<img class="th" src="${src(o)}" alt="">`:""}<div class="ar">${f(i,"n",o.n,' placeholder="اسم العرض"')}${f(i,"p",o.p,N+' placeholder="السعر"')}${f(i,"s",o.s||0,N+' placeholder="عدد الصوص"')}${f(i,"sp",o.sp||0,N+' placeholder="سكر؟ (1=نعم)"')}</div><div class="ar">${f(i,"d",o.d||"",' placeholder="الوصف"')}</div><div class="ar"><input type="file" accept="image/*" data-up="${i}">${o.img?`<button data-rm="${i}">شيل الصورة</button>`:""}<button data-del="${i}">حذف العرض</button></div></div>`).join(""):
    rows().map((r,i)=>`<div class="ar">${adm!==AR&&adm!==SA&&adm!==MSA?pic(r[7]):""}${f(i,0,r[0],' placeholder="الاسم بالعربي"')}${adm===AR?f(i,1,r[1],N+' placeholder="الرسوم"'):adm===SA||adm===MSA?"":f(i,1,r[1],' placeholder="الاسم بالإنجليزي / الوصف"')+f(i,2,r[2],N+' placeholder="السعر"')+f(i,3,r[3]||0,N+' placeholder="صوص (-1=حر)" title="عدد الصوصات المضمنة. -1 = الزبون يختار أي عدد والسعر لكل صوص"')+f(i,4,r[4]||"",' placeholder="مكونات قابلة للإزالة بـ +"')+f(i,6,r[6]||0,N+' placeholder="سكر؟ (1=نعم)"')+`<input type="file" accept="image/*" data-up="${i}">`+(r[7]?`<button data-rm="${i}">شيل الصورة</button>`:"")}<button data-del="${i}" aria-label="حذف">×</button></div>`).join(""))+
    '<button class="btn" data-new="1">+ إضافة</button>';
}

$("#admBody").oninput=e=>{
  const t=e.target;
  if(t.id&&t.id.startsWith("gh")){lsSet(t.id,t.value);return}
  if(t.id==="admPhone"){
    S.phone=t.value.trim();
    syncPhone();
    const pv=$("#phPrev");if(pv)pv.innerHTML='رابط الواتساب: <b dir="ltr">wa.me/'+esc(waNumber(S.phone||DEFAULT_PHONE))+'</b>';
    return;
  }
  if(t.id==="admPhone2"){
    S.phone2=t.value.trim();
    syncPhone();
    return;
  }
  if(t.dataset.oldcat!==undefined)return;
  const r=rows()[t.dataset.i];
  if(r)r[t.dataset.k]=t.type==="number"?+t.value:t.value;
};
$("#admBody").onchange=async e=>{
  const t=e.target;
  if(t.dataset.oldcat!==undefined){
    const oldName=t.dataset.oldcat,newName=t.value.trim();
    if(newName&&oldName!==newName&&!S.menu[newName]){
      S.menu=Object.fromEntries(Object.entries(S.menu).map(([k,v])=>[k===oldName?newName:k,v]));
      if(S.customCIMG&&S.customCIMG[oldName]){S.customCIMG[newName]=S.customCIMG[oldName];delete S.customCIMG[oldName];}
      t.dataset.oldcat=newName;if(adm===oldName)adm=newName;init();admDraw();
    }else if(!newName||S.menu[newName]){t.value=oldName}
    return;
  }
  if(t.dataset.up!==undefined&&t.files[0]){const im=await rd(t.files[0]);if(adm===OF)S.offers[+t.dataset.up].img=im;else rows()[+t.dataset.up][7]=im;admDraw()}
  else if(t.dataset.catimg&&t.files[0]){const im=await rd(t.files[0]);S.customCIMG=S.customCIMG||{};S.customCIMG[t.dataset.catimg]=im;admDraw();show(cur)}
  else if(t.dataset.blobimg&&t.files[0]){const im=await rd(t.files[0]);S.customBLOBS=S.customBLOBS||{};S.customBLOBS[t.dataset.blobimg]=im;BLOBS[t.dataset.blobimg]=im;syncBlobs();admDraw()}
};
$("#admD").onclick=e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.c){adm=b.dataset.c;admDraw()}
  else if(b.dataset.del){rows().splice(+b.dataset.del,1);admDraw()}
  else if(b.dataset.delcat){
    const cat=b.dataset.delcat;
    if(confirm("هل أنت متأكد من حذف القسم '"+cat+"' بكل محتوياته؟")){
      delete S.menu[cat];if(S.customCIMG)delete S.customCIMG[cat];
      const menuKeys=Object.keys(S.menu);adm=menuKeys.length?menuKeys[0]:OF;init();admDraw();
    }
  }
  else if(b.id==="addCatBtn"){
    const name=$("#newCatName").value.trim();
    if(name&&!S.menu[name]){S.menu[name]=[];adm=name;init();admDraw()}
    else alert("اكتب اسم القسم أو تأكد أنه مش موجود قبل كدا.");
  }
  else if(b.dataset.rm){if(adm===OF)S.offers[+b.dataset.rm].img="";else rows()[+b.dataset.rm][7]="";admDraw()}
  else if(b.dataset.rmcatimg){if(S.customCIMG)delete S.customCIMG[b.dataset.rmcatimg];admDraw();show(cur)}
  else if(b.dataset.new){rows().push(adm===AR?["",0]:adm===SA||adm===MSA?[""]:adm===OF?{n:"",d:"",p:0,s:0,sp:0,img:""}:["","",0,0,"","",0]);admDraw()}
};

function ghCfg(){
  const m=location.hostname.match(/^([^.]+)\.github\.io$/),seg=location.pathname.split("/").filter(Boolean)[0];
  return{
    owner:lsGet("ghOwner")||(m?m[1]:""),
    repo:lsGet("ghRepo")||(m?(seg&&!/\.html?$/.test(seg)?seg:m[1]+".github.io"):""),
    branch:lsGet("ghBranch")||"main",
    token:lsGet("ghToken")
  };
}
const ghClean=c=>{
  let o=String(c.owner||"").trim(),r=String(c.repo||"").trim().replace(/^https?:\/\/github\.com\//i,"").replace(/\.git$/,"").replace(/\/+$/,"");
  const p=r.split("/").filter(Boolean);if(p.length>=2){o=p[0];r=p[1]}else r=p[0]||"";
  return{owner:o.replace(/\s+/g,""),repo:r.replace(/\s+/g,""),branch:String(c.branch||"main").trim()||"main",token:String(c.token||"").replace(/\s+/g,"")};
};
const u8b64=s=>{const b=new TextEncoder().encode(s);let x="";for(let i=0;i<b.length;i+=32768)x+=String.fromCharCode.apply(null,b.subarray(i,i+32768));return btoa(x)};
async function ghSave(){
  const c=ghClean(ghCfg());if(!c.owner||!c.repo||!c.token)throw new Error("اكمل إعدادات GitHub (الحساب، المستودع، التوكن)");
  const api="https://api.github.com/repos/"+c.owner+"/"+c.repo+"/contents/js/menu-data.js",H={Authorization:"Bearer "+c.token,Accept:"application/vnd.github+json"};
  let sha;const g=await fetch(api+"?ref="+encodeURIComponent(c.branch),{headers:H,cache:"no-store"});
  if(g.ok)sha=(await g.json()).sha;
  else if(g.status!==404)throw new Error("GitHub "+g.status+(g.status===401?" (التوكن غلط أو منتهي)":g.status===403?" (التوكن من غير صلاحية Contents)":""));
  const body={message:"Update Flori menu from admin panel",content:u8b64("window.MENU_DATA="+JSON.stringify(S)+";\n"),branch:c.branch};if(sha)body.sha=sha;
  const p=await fetch(api,{method:"PUT",headers:{...H,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!p.ok)throw new Error("GitHub "+p.status+(p.status===404?" (اسم المستودع أو الفرع غلط)":p.status===409||p.status===422?" (الملف اتعدل من مكان تاني، حدّث الصفحة وجرّب تاني)":p.status===403||p.status===401?" (راجع صلاحيات التوكن)":""));
}
async function ghFixSite(){
  const c=ghClean(ghCfg());if(location.protocol!=="https:"||/^(localhost|127\.)/.test(location.hostname))return false;
  const base=location.origin+location.pathname.replace(/[^/]*$/,""),api="https://api.github.com/repos/"+c.owner+"/"+c.repo+"/contents/index.html",H={Authorization:"Bearer "+c.token,Accept:"application/vnd.github+json"};
  const g=await fetch(api+"?ref="+encodeURIComponent(c.branch),{headers:H,cache:"no-store"});if(!g.ok)return false;const j=await g.json();
  const txt=new TextDecoder().decode(Uint8Array.from(atob(String(j.content).replace(/\s/g,"")),x=>x.charCodeAt(0)));
  if(!txt.includes("__SITE_URL__"))return false;
  const p=await fetch(api,{method:"PUT",headers:{...H,"Content-Type":"application/json"},body:JSON.stringify({message:"Set Flori site URL for link previews",content:u8b64(txt.split("__SITE_URL__").join(base)),sha:j.sha,branch:c.branch})});
  return p.ok;
}
$("#admSave").onclick=async()=>{
  const m=$("#admMsg");
  for(const c in S.menu)S.menu[c]=S.menu[c].filter(r=>String(r[0]).trim());
  S.phone=dispNumber(S.phone||DEFAULT_PHONE);S.phone2=toEnDigits(S.phone2||"").replace(/^\+/,"")?dispNumber(S.phone2):"";S.areas=S.areas.filter(r=>String(r[0]).trim());S.sauces=S.sauces.filter(r=>String(r[0]).trim());S.msauces=S.msauces.filter(r=>String(r[0]).trim());S.offers=S.offers.filter(o=>String(o.n).trim());
  init();admDraw();m.textContent="بنحفظ على GitHub…";
  try{
    await ghSave();
    const fx=await ghFixSite().catch(()=>false);
    m.textContent="اتحفظ على GitHub. التعديل هيظهر لكل الزباين خلال دقيقة تقريبًا."+(fx?" وتم ضبط رابط صورة معاينة اللينك.":"");
  }catch(e){
    m.textContent="الحفظ مشتغلش: "+(e&&e.name==="TypeError"?"مقدرتش أوصل لـ GitHub. اتأكد إن خانة المستودع فيها اسم المستودع بس من غير اسم الحساب، وإن النت شغال.":e.message);
  }
};
$("#admX").onclick=()=>$("#admD").close();

/* Admin password (default: Flori2026) */
const PH="379f84764a5bb575a8e6193140cc136697fd8e26db946bf2c1bd88b06dcefd5a";
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,"0")).join("");
$("#admBtn").onclick=()=>{$("#pw").value="";$("#pwE").textContent="";$("#pwD").showModal();$("#pw").focus()};
$("#pwX").onclick=()=>$("#pwD").close();
const enter=async()=>{let g="";try{g=await sha($("#pw").value)}catch(_){}if(g===PH){$("#pwD").close();admDraw();$("#admD").showModal()}else $("#pwE").textContent="الباسورد غلط."};
$("#pwOk").onclick=enter;$("#pw").onkeydown=e=>{if(e.key==="Enter")enter()};

$("#saOk").onclick=()=>{
  const P=pend;
  if(P.mode==="s"){const nx=P.next,v=P.sel[0];$("#saD").close();nx(v);return}
  let k=P.n,pr=P.p;
  if(P.mode==="r"){if(P.sel.length)k+=" [من غير: "+P.sel.join(" + ")+"]"}
  else{
    const counts={};P.sel.forEach(v=>counts[v]=(counts[v]||0)+1);
    const selFormatted=Object.entries(counts).map(([v,cnt])=>cnt>1?v+" (×"+cnt+")":v);
    k+=" ["+selFormatted.join(" + ")+"]";
    if(P.mode==="x")pr=P.p*P.sel.length;
  }
  addCart(k,pr);$("#saD").close();
};
$("#saX").onclick=()=>$("#saD").close();

document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.sd){const P=pend,i=P.sel.lastIndexOf(b.dataset.sd);if(i>-1)P.sel.splice(i,1);pkDraw()}
  else if(b.dataset.sa){
    const P=pend,x=b.dataset.sa;
    if(P.mode==="s")P.sel=[x];
    else if(P.mode==="x")P.sel.push(x);
    else if(P.mode==="r"){const k=P.sel.indexOf(x);if(k>-1)P.sel.splice(k,1);else P.sel.push(x)}
    else{
      const need=Math.min(P.s,P.list.length);
      if(P.sel.length<need)P.sel.push(x);
      else{const idx=P.sel.indexOf(x);if(idx>-1)P.sel.splice(idx,1);else{P.sel.pop();P.sel.push(x)}}
    }
    pkDraw();
  }
  else if(b.dataset.p){add(b.dataset)}
  else if(b.dataset.q){const i=cart.get(b.dataset.q);if(!i)return;i.q+=+b.dataset.d;if(i.q<1)cart.delete(b.dataset.q);saveCart();draw()}
  else if(b.dataset.zoom){$("#zimg").src=BLOBS[b.dataset.zoom];$("#zoomD").showModal()}
});
$("#zoomD").onclick=()=>$("#zoomD").close();
if($("#zoomX"))$("#zoomX").onclick=e=>{e.stopPropagation();$("#zoomD").close()};
document.querySelectorAll("dialog:not(.big)").forEach(d=>{
  d.addEventListener("click",e=>{if(e.target===d)d.close()});
});
$("#fab").onclick=()=>$("#cartD").showModal();
$("#close").onclick=()=>$("#cartD").close();

/* ---- Firebase: حفظ نسخة من كل طلب في Firestore (اختياري — املأ بيانات مشروع فلوري) ---- */
const FB_CFG={apiKey:"",authDomain:"",projectId:"",storageBucket:"",messagingSenderId:"",appId:""};
const FB_COL="orders";
let fbP;
const fb=()=>fbP||(fbP=(async()=>{
  const V="https://www.gstatic.com/firebasejs/10.12.2/";
  const[{initializeApp},{getFirestore,collection,addDoc,serverTimestamp}]=await Promise.all([import(V+"firebase-app.js"),import(V+"firebase-firestore.js")]);
  return{db:getFirestore(initializeApp(FB_CFG)),collection,addDoc,serverTimestamp};
})());
const saveOrder=async o=>{if(!FB_CFG.apiKey||!FB_CFG.projectId)return;const{db,collection,addDoc,serverTimestamp}=await fb();return addDoc(collection(db,FB_COL),{...o,status:"new",createdAt:serverTimestamp()})};

$("#send").onclick=()=>{
  const a=[...cart.values()],t=a.reduce((s,i)=>s+i.q*i.p,0);
  const nm=$("#nm").value.trim(),ph=$("#ph").value.trim(),ad=$("#ad").value.trim(),tbl=$("#tbl").value.trim(),nt=$("#note").value.trim();
  const f=feeOf();
  if(orderMode==="delivery"){
    if($("#area").value==="x"){$("#err").textContent="اختار منطقة التوصيل.";return}
    if(!nm||!ph||!ad){$("#err").textContent="اكتب الاسم ورقم التليفون والعنوان.";return}
  }else if(orderMode==="table"){
    if(!tbl){$("#err").textContent="اكتب رقم الترابيزة.";return}
    if(!nm){$("#err").textContent="اكتب اسمك.";return}
  }else{
    if(!nm||!ph){$("#err").textContent="اكتب الاسم ورقم التليفون للاستلام.";return}
  }
  $("#err").textContent="";
  lsSet("flori_nm",nm);if(ph)lsSet("flori_ph",ph);if(ad)lsSet("flori_ad",ad);

  const modeLbl=orderMode==="delivery"?"توصيل":orderMode==="table"?"داخل الكافيه ("+tbl+")":"تيك أواي (استلام من الكافيه)";
  const areaName=orderMode==="delivery"?$("#area").selectedOptions[0].dataset.n:modeLbl;
  const L=a.map((i,k)=>`${k+1}) ${i.n} × ${i.q} = ${i.q*i.p} جنيه`).join("\n");
  const feeLine=orderMode==="delivery"?`\nالتوصيل (${areaName}): ${f==null?"هنتفق عليه":f+" جنيه"}`:"";
  const locLine=orderMode==="delivery"?`\nالعنوان: ${ad}`:orderMode==="table"?`\nرقم الترابيزة: ${tbl}`:"";
  const msg=ar(`طلب جديد — فلوري كافيه (Flori Cafe)\nالنوع: ${modeLbl}\n\n${L}\n\nالمنتجات: ${t} جنيه${feeLine}\nالإجمالي: ${t+(f||0)} جنيه\n\nالاسم: ${nm}${ph?"\nالتليفون: "+ph:""}${locLine}${nt?"\nملاحظات: "+nt:""}`);

  saveOrder({
    source:"web",
    orderType:orderMode,
    customer:{name:nm,phone:ph,address:orderMode==="delivery"?ad:"",area:areaName,table:orderMode==="table"?tbl:""},
    items:a.map(i=>({name:i.n,qty:i.q,price:i.p})),
    subtotal:t,
    deliveryFee:orderMode==="delivery"?(f==null?null:f):0,
    total:t+(f||0),
    note:nt
  }).catch(e=>console.warn("order not saved",e));

  window.open("https://wa.me/"+waNumber(S.phone||DEFAULT_PHONE)+"?text="+encodeURIComponent(msg),"_blank");
  cart.clear();saveCart();draw();$("#cartD").close();
};

init();
