(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]})}

/* QR-like art */
function rng(seed){var x=seed*9301+49297;return function(){x=(x*9301+49297)%233280;return x/233280}}
$$(".qr").forEach(function(el){
 var n=25,r=rng(+el.getAttribute("data-seed")||7),cells="";
 function finder(x,y){return '<rect x="'+x+'" y="'+y+'" width="7" height="7" fill="#000"/><rect x="'+(x+1)+'" y="'+(y+1)+'" width="5" height="5" fill="#fff"/><rect x="'+(x+2)+'" y="'+(y+2)+'" width="3" height="3" fill="#000"/>'}
 for(var y=0;y<n;y++)for(var x=0;x<n;x++){
  var inF=(x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9);
  if(!inF&&r()>.52)cells+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>';
 }
 el.innerHTML='<svg viewBox="0 0 '+n+' '+n+'" shape-rendering="crispEdges" aria-hidden="true"><g fill="#000">'+cells+'</g>'+finder(0,0)+finder(n-7,0)+finder(0,n-7)+'</svg>';
});
var g=$("#g24");if(g){var h="";for(var i=1;i<=24;i++)h+="<div>"+i+".</div>";g.innerHTML=h}

/* nav highlight + reveal */
var links=$$(".links a");
if("IntersectionObserver" in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var id=e.target.id;links.forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+id)})}})},{rootMargin:"-45% 0px -50% 0px"});
 ["v2","vault","bets","plan","sources"].forEach(function(id){var s=document.getElementById(id);if(s)io.observe(s)});
 var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");ro.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
 $$(".reveal").forEach(function(el){ro.observe(el)});
}else{$$(".reveal").forEach(function(el){el.classList.add("in")})}

/* Vault prototype */
var KEYTYPES={
 hw:{n:"Hardware wallet",t:"Keystone or Ledger, stored offline",i:"\u{1F510}"},
 phone:{n:"Zodl on a phone",t:"Phone key, biometric",i:"\u{1F4F1}"},
 mac:{n:"Another Mac",t:"Vault app, Secure Enclave",i:"\u{1F4BB}"},
 person:{n:"Trusted person",t:"Holds a key on their own device",i:"\u{1F464}"}
};
var PRESETS={
 individual:{label:"Individual saver",icon:"\u{1F9CD}",blurb:"Long-term savings you rarely touch.",owner:"you",
  keys:[{n:"This Mac",t:"Vault app, Secure Enclave",i:"\u{1F4BB}"},{n:"Zodl on iPhone",t:"Phone key, Face ID",i:"\u{1F4F1}"},{n:"Ledger",t:"Hardware key, kept at home",i:"\u{1F510}"}],
  thr:2,locks:[{name:"House fund",amt:50,years:2},{name:"Long-term stack",amt:120,years:10}],rule:"all",
  heirs:[{n:"Sam",share:100}],contacts:["Alex, a close friend"],interval:6,grace:30,inh:"Inheritance",heirWord:"Heir"},
 family:{label:"Family",icon:"\u{1F46A}",blurb:"Shared savings and a plan for the kids.",owner:"you",
  keys:[{n:"This Mac",t:"Vault app, Secure Enclave",i:"\u{1F4BB}"},{n:"Partner's iPhone",t:"Phone key, Face ID",i:"\u{1F4F1}"},{n:"Keystone",t:"Hardware key, safe deposit box",i:"\u{1F510}"}],
  thr:2,locks:[{name:"College fund",amt:30,years:10},{name:"Family reserve",amt:80,years:5}],rule:"all",
  heirs:[{n:"Maya",share:50},{n:"Leo",share:50}],contacts:["Your partner","Family lawyer"],interval:6,grace:30,inh:"Inheritance",heirWord:"Heir"},
 institution:{label:"Institution or DAO",icon:"\u{1F3DB}",blurb:"A treasury with approvals and continuity.",owner:"the signers",
  keys:[{n:"CFO, Mac",t:"Vault app",i:"\u{1F4BB}"},{n:"Ops lead, Ledger",t:"Hardware key",i:"\u{1F510}"},{n:"Board member A",t:"Keystone",i:"\u{1F510}"},{n:"Board member B",t:"Keystone",i:"\u{1F510}"},{n:"Counsel",t:"Phone key",i:"\u{1F4F1}"}],
  thr:3,locks:[{name:"Runway reserve",amt:2000,years:1.5}],rule:"delay",
  heirs:[{n:"Recovery council",share:100}],contacts:["Board chair","External counsel"],interval:3,grace:14,inh:"Continuity",heirWord:"Successor"}
};
var V=null,step=0,simT=null,simI=0,created=false;
function clone(o){return JSON.parse(JSON.stringify(o))}
function pick(seg){V=clone(PRESETS[seg]);V.seg=seg;created=false}
pick("individual");
var STEPS=function(){return ["Who it's for","Keyholders","Savings locks",V.inh,"Review"]};
function unlockDate(y){var d=new Date(2026,9,14);d.setMonth(d.getMonth()+Math.round(y*12));return d.toLocaleDateString("en-US",{month:"short",year:"numeric"})}
function yrs(y){return y<1?Math.round(y*12)+" months":(y===1?"1 year":(y%1?y+" years":y+" years"))}
function renderSide(){
 var s=STEPS(),h='<div class="vw">Z<span>O</span>DL VAULT</div>';
 s.forEach(function(t,i){h+='<button class="step'+(i===step?" on":"")+(i<step?" done":"")+'" data-go="'+i+'"><b>'+(i<step?"\u2713":i+1)+'</b>'+esc(t)+'</button>'});
 h+='<div class="foot">Prototype. Values are illustrative and nothing touches a chain.</div>';
 $("#vsteps").innerHTML=h;
}
function nav(){
 var last=step===STEPS().length-1;
 return '<div class="vrow" style="margin-top:22px;justify-content:space-between">'+(step>0?'<button class="ibtn" data-go="'+(step-1)+'">Back</button>':'<span></span>')+(last?'':'<button class="ibtn pri" data-go="'+(step+1)+'">Continue</button>')+'</div>';
}
function sStart(){
 var h='<h3>Who is this vault for?</h3><p class="sub">Each choice loads sensible defaults. You can change everything after.</p><div class="segs">';
 Object.keys(PRESETS).forEach(function(k){var p=PRESETS[k];h+='<button class="seg'+(V.seg===k?" on":"")+'" data-seg="'+k+'"><span class="ic">'+p.icon+'</span><b>'+esc(p.label)+'</b><span>'+esc(p.blurb)+'</span></button>'});
 return h+'</div>'+nav();
}
function sKeys(){
 var n=V.keys.length,h='<h3>Keyholders</h3><p class="sub">Spread keys across devices and people so no single loss or theft can move or strand your funds.</p>';
 V.keys.forEach(function(k,i){h+='<div class="kh"><span class="k">'+k.i+'</span><span class="t"><b>'+esc(k.n)+'</b><span>'+esc(k.t)+'</span></span><button class="ibtn dng" data-rmkey="'+i+'"'+(n<=2?" disabled":"")+'>Remove</button></div>'});
 h+='<div class="vrow" style="margin-top:6px"><select id="addKeyType" aria-label="Key type">';
 Object.keys(KEYTYPES).forEach(function(k){h+='<option value="'+k+'">'+KEYTYPES[k].n+'</option>'});
 h+='</select><button class="ibtn" data-addkey="1"'+(n>=7?" disabled":"")+'>+ Add keyholder</button></div>';
 var dots="";for(var i=0;i<n;i++)dots+='<i class="'+(i<V.thr?"on":"")+'"></i>';
 h+='<div class="thr"><button class="ibtn" data-thr="-1" aria-label="Fewer signatures">\u2212</button><span class="q">'+V.thr+' of '+n+'</span><button class="ibtn" data-thr="1" aria-label="More signatures">+</button><span class="dots">'+dots+'</span><span class="muted small thrtxt">Any '+V.thr+' of '+n+' keys can move funds. Onchain it looks like any other shielded spend.</span></div>';
 if(V.thr===1)h+='<div class="warnline">With 1 of '+n+', any single key can move everything. Fine for spending, risky for savings.</div>';
 if(V.thr===n)h+='<div class="warnline">With '+n+' of '+n+', losing any one key strands the vault. Consider '+(n-1)+' of '+n+'.</div>';
 return h+nav();
}
function sLocks(){
 var h='<h3>Savings locks</h3><p class="sub">Time as a feature. Locked funds sit in the vault but need extra approval to leave early, which turns an impulse or a coercion attempt into a waiting period.</p>';
 V.locks.forEach(function(l,i){var pct=Math.max(4,Math.round(100/(l.years*4)));h+='<div class="lock"><div class="row"><b>'+esc(l.name)+'</b><span class="mono">'+l.amt+' ZEC</span></div><div class="row muted small"><span>Unlocks '+unlockDate(l.years)+' ('+yrs(l.years)+')</span><button class="ibtn dng" data-rmlock="'+i+'" style="padding:3px 8px;font-size:12px">Remove</button></div><div class="bar"><i style="width:'+pct+'%"></i></div></div>'});
 if(!V.locks.length)h+='<div class="note" style="margin-top:0">No locks yet. Everything in the vault follows the normal '+V.thr+' of '+V.keys.length+' rule.</div>';
 h+='<div class="vrow" style="margin-top:10px"><input type="text" id="lkName" placeholder="Name, e.g. Kids fund" aria-label="Lock name" style="flex:1;min-width:150px"><input type="number" id="lkAmt" placeholder="ZEC" min="0.01" step="any" aria-label="Amount" style="width:100px"><select id="lkYrs" aria-label="Duration"><option value="0.5">6 months</option><option value="1">1 year</option><option value="2" selected>2 years</option><option value="5">5 years</option><option value="10">10 years</option></select><button class="ibtn" data-addlock="1">+ Add lock</button></div>';
 h+='<h4>Leaving early requires</h4><select id="lkRule" aria-label="Early unlock rule"><option value="all"'+(V.rule==="all"?" selected":"")+'>All '+V.keys.length+' keyholders, plus a 7 day delay</option><option value="delay"'+(V.rule==="delay"?" selected":"")+'>'+V.thr+' of '+V.keys.length+', plus a 30 day delay any keyholder can veto</option></select>';
 return h+nav();
}
function sInh(){
 var tot=V.heirs.reduce(function(a,b){return a+(+b.share||0)},0);
 var h='<h3>'+esc(V.inh)+'</h3><p class="sub">A dead man\'s switch with humans in the loop. If '+esc(V.owner)+' stop checking in, recovery contacts are asked first, then '+(V.seg==="institution"?"successor signers":"heirs")+' can claim. Nobody gets access early, and no company is in the loop.</p><div class="two"><div>';
 h+='<h4 style="margin-top:0">Check in every</h4><div class="vrow"><select id="inInt" aria-label="Check-in interval"><option value="3"'+(V.interval==3?" selected":"")+'>3 months</option><option value="6"'+(V.interval==6?" selected":"")+'>6 months</option><option value="12"'+(V.interval==12?" selected":"")+'>12 months</option></select><span class="muted small">Grace period</span><select id="inGr" aria-label="Grace period"><option value="14"'+(V.grace==14?" selected":"")+'>14 days</option><option value="30"'+(V.grace==30?" selected":"")+'>30 days</option><option value="90"'+(V.grace==90?" selected":"")+'>90 days</option></select></div>';
 h+='<h4>'+esc(V.heirWord)+(V.heirs.length>1?"s":"")+' and shares</h4>';
 V.heirs.forEach(function(x,i){h+='<div class="kh" style="padding:8px 10px"><span class="k">\u{1F464}</span><span class="t"><b>'+esc(x.n)+'</b></span><input type="number" min="0" max="100" value="'+x.share+'" data-share="'+i+'" aria-label="Share for '+esc(x.n)+'" style="width:70px"> %<button class="ibtn dng" data-rmheir="'+i+'"'+(V.heirs.length<=1?" disabled":"")+'>\u2715</button></div>'});
 h+='<div class="vrow"><input type="text" id="heirName" placeholder="Name" aria-label="Heir name" style="flex:1"><button class="ibtn" data-addheir="1">+ Add</button></div>';
 h+=tot!==100?'<div class="warnline" id="shareWarn">Shares add up to '+tot+'%. They need to total 100%.</div>':'<div class="muted small" id="shareWarn" style="margin-top:6px">Shares total 100%.</div>';
 h+='<h4>Recovery contacts</h4>';
 V.contacts.forEach(function(c,i){h+='<div class="kh" style="padding:8px 10px"><span class="k">\u{1F91D}</span><span class="t"><b>'+esc(c)+'</b><span>Can pause the switch. Can\'t move funds.</span></span><button class="ibtn dng" data-rmct="'+i+'">\u2715</button></div>'});
 h+='<div class="vrow"><input type="text" id="ctName" placeholder="Name" aria-label="Recovery contact name" style="flex:1"><button class="ibtn" data-addct="1">+ Add</button></div>';
 h+='</div><div><h4 style="margin-top:0">What happens if you go quiet</h4><div class="vt" id="vt">'+timeline()+'</div><div class="vrow" style="margin-top:12px"><button class="ibtn pri" data-sim="1">Simulate a missed check-in</button><button class="ibtn" data-here="1">I\'m here, check in</button></div><div class="muted small" id="simMsg" style="margin-top:8px"></div></div></div>';
 return h+nav();
}
function timeline(){
 var heirs=V.heirs.map(function(x){return esc(x.n)+" "+x.share+"%"}).join(", ");
 var ev=[["Last check-in","Today. A fresh pre-signed plan replaces the old one."],
  ["Reminder",V.interval+" months later, Vault and Zodl mobile remind "+esc(V.owner)+". One tap with any key resets the timer."],
  ["Missed check-in","Recovery contacts ("+esc(V.contacts.join(", ")||"none set")+") are asked to confirm. Any of them can pause."],
  ["Grace period",V.grace+" days to respond. Any keyholder can cancel at any time."],
  [V.heirWord+(V.heirs.length>1?"s":"")+" can claim",heirs+". This is the first moment they see the balance."]];
 return ev.map(function(e,i){return '<div class="e'+(i<=simI?" on":"")+'"><i></i><div><b>'+e[0]+'</b><span>'+e[1]+'</span></div></div>'}).join("");
}
function sReview(){
 var lockT=V.locks.reduce(function(a,b){return a+(+b.amt||0)},0);
 var h='<h3>Review</h3><p class="sub">Here\'s your vault. The part I care most about is the right-hand column: who learns what.</p><div class="two"><div>';
 h+='<div class="lock"><b>'+esc(V.label)+'</b><div class="muted small">'+V.thr+' of '+V.keys.length+' keys: '+esc(V.keys.map(function(k){return k.n}).join(", "))+'</div></div>';
 h+='<div class="lock"><b>'+V.locks.length+' savings lock'+(V.locks.length===1?"":"s")+'</b><div class="muted small">'+lockT+' ZEC locked. Early exit: '+(V.rule==="all"?"all keyholders plus 7 days":V.thr+" of "+V.keys.length+" plus 30 days, vetoable")+'</div></div>';
 h+='<div class="lock"><b>'+esc(V.inh)+'</b><div class="muted small">Check in every '+V.interval+' months, '+V.grace+' day grace. '+esc(V.heirs.map(function(x){return x.n+" "+x.share+"%"}).join(", "))+'</div></div>';
 h+=created?'<div class="done-badge">\u2713 Vault created (prototype). Zodl mobile now shows it as watch-only.</div>':'<button class="ibtn pri" data-create="1" style="margin-top:12px;padding:11px 18px">Create vault</button>';
 h+='</div><div><table class="who-sees"><thead><tr><th>Who</th><th>What they learn</th></tr></thead><tbody>';
 h+='<tr><td>The chain</td><td>Nothing: not the balance, the signers, or the threshold.</td></tr>';
 h+='<tr><td>Keyholders</td><td>That they hold a key. Balance only if you share a viewing key.</td></tr>';
 h+='<tr><td>Recovery contacts</td><td>That a switch exists. Never the balance.</td></tr>';
 h+='<tr><td>'+esc(V.heirWord)+(V.heirs.length>1?"s":"")+'</td><td>Their share, only when the switch fires.</td></tr>';
 h+='<tr><td>'+(V.seg==="institution"?"Auditor":"ZODL")+'</td><td>'+(V.seg==="institution"?"Everything, through a viewing key you choose to hand over.":"Nothing. No ZODL key, no account.")+'</td></tr>';
 h+='</tbody></table></div></div>';
 return h+nav();
}
function render(){
 renderSide();
 var f=[sStart,sKeys,sLocks,sInh,sReview][step];
 $("#vmain").innerHTML=f();
}
function stopSim(){if(simT){clearInterval(simT);simT=null}}
var proto=$("#vproto");
if(proto){
 proto.addEventListener("click",function(e){
  var t=e.target.closest("button");if(!t)return;
  var d=t.dataset;
  if(d.go!==undefined){stopSim();simI=0;step=+d.go;render();if(window.innerWidth<980)proto.scrollIntoView({block:"start"});return}
  if(d.seg){pick(d.seg);simI=0;render();return}
  if(d.rmkey!==undefined){V.keys.splice(+d.rmkey,1);V.thr=Math.min(V.thr,V.keys.length);render();return}
  if(d.addkey){var k=KEYTYPES[$("#addKeyType").value];V.keys.push({n:k.n,t:k.t,i:k.i});render();return}
  if(d.thr){V.thr=Math.max(1,Math.min(V.keys.length,V.thr+(+d.thr)));render();return}
  if(d.rmlock!==undefined){V.locks.splice(+d.rmlock,1);render();return}
  if(d.addlock){var nm=$("#lkName").value.trim()||"Savings lock",am=parseFloat($("#lkAmt").value);if(!(am>0))am=10;V.locks.push({name:nm,amt:Math.round(am*100)/100,years:parseFloat($("#lkYrs").value)});render();return}
  if(d.rmheir!==undefined){V.heirs.splice(+d.rmheir,1);render();return}
  if(d.addheir){var hn=$("#heirName").value.trim();if(!hn)return;V.heirs.push({n:hn,share:0});render();return}
  if(d.rmct!==undefined){V.contacts.splice(+d.rmct,1);render();return}
  if(d.addct){var cn=$("#ctName").value.trim();if(!cn)return;V.contacts.push(cn);render();return}
  if(d.sim){stopSim();simI=0;$("#vt").innerHTML=timeline();$("#simMsg").textContent="";simT=setInterval(function(){simI++;var vt=$("#vt");if(!vt){stopSim();return}vt.innerHTML=timeline();if(simI>=4){stopSim();$("#simMsg").textContent="Switch fired. Only now do heirs learn what they inherit."}},750);return}
  if(d.here){stopSim();simI=0;var vt2=$("#vt");if(vt2)vt2.innerHTML=timeline();$("#simMsg").textContent="Checked in. Timer reset and the pre-signed plan was refreshed.";return}
  if(d.create){created=true;render();return}
 });
 proto.addEventListener("change",function(e){
  var t=e.target;
  if(t.id==="lkRule"){V.rule=t.value}
  if(t.id==="inInt"){V.interval=+t.value;$("#vt").innerHTML=timeline()}
  if(t.id==="inGr"){V.grace=+t.value;$("#vt").innerHTML=timeline()}
 });
 proto.addEventListener("input",function(e){
  var t=e.target;if(t.dataset.share===undefined)return;
  V.heirs[+t.dataset.share].share=Math.max(0,Math.min(100,parseInt(t.value,10)||0));
  var tot=V.heirs.reduce(function(a,b){return a+b.share},0),w=$("#shareWarn");
  if(w){w.className=tot===100?"muted small":"warnline";w.style.marginTop="6px";w.textContent=tot===100?"Shares total 100%.":"Shares add up to "+tot+"%. They need to total 100%."}
  var vt=$("#vt");if(vt)vt.innerHTML=timeline();
 });
 render();
}

/* Agent guardrail simulator */
var REQS=[
 {d:"Search API credits",p:"search.example, allowlisted",amt:12,allow:true},
 {d:"GPU hour for inference",p:"compute.example, allowlisted",amt:45,allow:true},
 {d:"Dataset license",p:"data.example, allowlisted",amt:180,allow:true},
 {d:"Freelance translator",p:"new payee, never paid before",amt:70,allow:false},
 {d:"GPU hours, batch job",p:"compute.example, allowlisted",amt:90,allow:true},
 {d:"Premium news API",p:"news.example, allowlisted",amt:30,allow:true},
 {d:"\"Refund\" request from a prompt",p:"new payee, never paid before",amt:25,allow:false}
];
var sim=$("#agentSim");
if(sim){
 var cap=$("#capR"),bud=$("#budR"),ask=$("#askR"),allowOnly=$("#allowOnly"),timer=null;
 function outs(){$("#capO").textContent="$"+cap.value;$("#budO").textContent="$"+bud.value;$("#askO").textContent="$"+ask.value}
 function base(){var h="";REQS.forEach(function(r,i){h+='<div class="req" id="rq'+i+'"><div class="d">'+esc(r.d)+'<span>'+esc(r.p)+'</span></div><b class="mono">$'+r.amt+'</b><span class="r">queued</span></div>'});$("#reqs").innerHTML=h;$("#spent").textContent="Spent today: $0 of $"+bud.value}
 function decide(r,spent){
  if(allowOnly.checked&&!r.allow)return["no","Blocked: not allowlisted"];
  if(r.amt>+cap.value)return["no","Blocked: over cap"];
  if(spent+r.amt>+bud.value)return["no","Blocked: budget"];
  if(r.amt>+ask.value)return["ask","Asked you"];
  return["ok","Paid privately"];
 }
 function run(){
  if(timer)clearInterval(timer);base();var i=0,spent=0,asked=0;
  timer=setInterval(function(){
   if(i>=REQS.length){clearInterval(timer);timer=null;$("#spent").textContent="Spent today: $"+spent+" of $"+bud.value+(asked?" \u00B7 "+asked+" waiting for you":"");return}
   var r=REQS[i],res=decide(r,spent),el=$("#rq"+i+" .r");
   if(res[0]==="ok")spent+=r.amt;if(res[0]==="ask")asked++;
   el.className="r "+res[0];el.textContent=res[1];
   $("#spent").textContent="Spent today: $"+spent+" of $"+bud.value;i++;
  },420);
 }
 [cap,bud,ask].forEach(function(x){x.addEventListener("input",function(){outs();if(!timer)base()})});
 allowOnly.addEventListener("change",function(){if(!timer)base()});
 $("#runSim").addEventListener("click",run);
 $("#resetSim").addEventListener("click",function(){if(timer){clearInterval(timer);timer=null}base()});
 outs();base();
}
})();
