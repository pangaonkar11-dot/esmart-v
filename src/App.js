import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  eSMART-V  ·  Clinical Workstation v3 — STABLE BUILD                    ║
// ║  Central Institute of Behavioural Sciences, Nagpur                      ║
// ║  Dr. Shailesh V. Pangaonkar — Director & Consultant Psychiatrist        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const SCRIPT = "https://script.google.com/macros/s/AKfycbxYw3DNfteGUApE97zpPScPgVCrHjNXTU-kuwabwQNviLmsaW4gSEd6hqY1FoTJsxu4HQ/exec";
const TOKEN  = "CIBS2026";
const TODAY  = new Date().toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"});
const TODAYISO = new Date().toISOString().slice(0,10);

// ── Auto-ID (pure function — no hooks, no side effects) ───────────────────
function makeAutoID(surname="", dob="", mob1="", mob2="") {
  const sur  = surname.toUpperCase().replace(/[^A-Z]/g,"").slice(0,3)||"XXX";
  const dobC = dob.replace(/[^0-9]/g,"");
  const ddmm = dobC.length>=4 ? dobC.slice(0,4) : "0000";
  const mob  = ((mob1||mob2).replace(/[^0-9]/g,"").slice(-4))||"0000";
  const yr   = String(new Date().getFullYear()).slice(-2);
  return `CIBS-${yr}-${sur}-${ddmm}-${mob}`;
}

function calcAge(dob="") {
  try {
    const ms = Date.now() - new Date(dob).getTime();
    const age = Math.floor(ms/(1000*60*60*24*365.25));
    return age > 0 && age < 25 ? String(age) : "";
  } catch { return ""; }
}

// ── Diagnosis list ────────────────────────────────────────────────────────
const DX = {
  "Neurodevelopmental":["ADHD — Combined","ADHD — Inattentive","ADHD — Hyperactive-Impulsive","Autism Spectrum Disorder Level 1","Autism Spectrum Disorder Level 2","Autism Spectrum Disorder Level 3","Intellectual Disability — Mild","Intellectual Disability — Moderate","Intellectual Disability — Severe","Global Developmental Delay","Specific Learning Disorder — Reading","Specific Learning Disorder — Writing","Specific Learning Disorder — Mathematics","Developmental Coordination Disorder","Language Disorder","Speech Sound Disorder","Stuttering","Tourette's Disorder","Tic Disorder"],
  "Anxiety / OCD":["Separation Anxiety Disorder","Selective Mutism","Specific Phobia","Social Anxiety Disorder","Generalised Anxiety Disorder","Panic Disorder","OCD","PTSD","Acute Stress Disorder","Adjustment Disorder"],
  "Mood":["Major Depressive Disorder — Single Episode","Major Depressive Disorder — Recurrent","Dysthymia / Persistent Depressive Disorder","DMDD","Bipolar I Disorder","Bipolar II Disorder","Cyclothymic Disorder"],
  "Behavioural":["Oppositional Defiant Disorder","Conduct Disorder — Childhood Onset","Conduct Disorder — Adolescent Onset","Intermittent Explosive Disorder"],
  "Psychotic":["Schizophrenia — Early Onset","Schizoaffective Disorder","Brief Psychotic Disorder"],
  "Medical / Neurological":["Epilepsy / Seizure Disorder","Cerebral Palsy","Traumatic Brain Injury","Perinatal Complication","Down Syndrome","Fragile X Syndrome","Rett Syndrome","Fetal Alcohol Spectrum Disorder","Enuresis","Encopresis","Insomnia Disorder"],
  "Other":["Substance Use Disorder","Internet Gaming Disorder","Eating Disorder — ARFID","Anorexia Nervosa","Unspecified — Awaiting Assessment"],
};

// ── Complaints per diagnosis group ───────────────────────────────────────
const COMPLAINTS = {
  "ADHD":["Poor attention span","Easily distracted","Does not complete tasks","Forgetfulness","Loses things","Hyperactivity — cannot sit still","Impulsivity","Talks excessively","Interrupts others","Academic underperformance","Disorganised"],
  "Autism":["Delayed speech","Limited eye contact","Social withdrawal","Restricted interests","Repetitive behaviours","Sensory sensitivities","Difficulty with change","Unusual play patterns","Echolalia"],
  "Intellectual":["Delayed milestones","Delayed speech","Poor academic progress","Difficulty with self-care","Limited adaptive functioning"],
  "Learning":["Difficulty reading","Letter reversals","Poor spelling","Difficulty with maths","Poor handwriting","Slow reading speed"],
  "Anxiety":["Excessive worry","School refusal","Separation anxiety","Somatic complaints","Sleep difficulties","Avoidance behaviour","Panic attacks"],
  "MDD":["Persistent sadness","Loss of interest","Fatigue","Sleep disturbance","Appetite changes","Feelings of worthlessness","Crying spells","Suicidal ideation"],
  "ODD":["Defiant behaviour","Argues with authority","Angry outbursts","Spiteful behaviour","Loses temper"],
  "Conduct":["Aggression","Destruction of property","Deceitfulness","Bullying","Truancy","Rule violations"],
  "General":["Behavioural problems at home","Behavioural problems at school","Poor peer relationships","Poor self-esteem","Sleep problems","Appetite problems"],
};

// ── Scales ────────────────────────────────────────────────────────────────
const SCALES = [
  {id:"MISIC",  name:"MISIC",  fields:["Verbal IQ","Performance IQ","Full Scale IQ","VCI","PRI","WMI","PSI"]},
  {id:"WISC",   name:"WISC-IV/V", fields:["Full Scale IQ","Verbal Comprehension","Perceptual Reasoning","Working Memory","Processing Speed"]},
  {id:"SB5",    name:"Stanford-Binet 5", fields:["Full Scale IQ","Fluid Reasoning","Knowledge","Quantitative","Visual-Spatial","Working Memory"]},
  {id:"RAVENS", name:"Raven's PM", fields:["Raw Score","Percentile","Classification"]},
  {id:"VABS",   name:"VABS",   fields:["Adaptive Behavior Composite","Communication","Daily Living Skills","Socialisation","Motor Skills"]},
  {id:"SNAP",   name:"SNAP-IV",fields:["ADHD Inattention","ADHD Hyperactivity","ODD Score","Total"]},
  {id:"CONNERS",name:"Conners",fields:["Oppositional","Cognitive","Hyperactivity","Anxious","Total T-Score"]},
  {id:"CDI",    name:"CDI",    fields:["Total Score","Negative Mood","Interpersonal","Ineffectiveness","Anhedonia","Negative Self-Esteem"]},
  {id:"SCARED", name:"SCARED", fields:["Total Score","Panic/Somatic","GAD","Separation Anxiety","Social Phobia"]},
  {id:"CSSRS",  name:"C-SSRS", fields:["Ideation Type","Intensity","Behaviour","Lethality","Risk Level"]},
  {id:"OTHER",  name:"Other",  fields:["Instrument Name","Score 1","Score 2","Total","Classification"]},
];

const DRUGS_DEFAULT = ["Methylphenidate IR","Methylphenidate SR","Atomoxetine","Risperidone","Aripiprazole","Olanzapine","Quetiapine","Haloperidol","Sodium Valproate","Lithium","Carbamazepine","Lamotrigine","Fluoxetine","Sertraline","Escitalopram","Clomipramine","Clonazepam","Melatonin","Clonidine","Levetiracetam","Phenobarbitone","Modafinil"];
const CGI_S = ["","Normal","Borderline ill","Mildly ill","Moderately ill","Markedly ill","Severely ill","Extremely ill"];
const CGI_I = ["","Very much improved","Much improved","Minimally improved","No change","Minimally worse","Much worse","Very much worse"];
const RELATIONS = ["Father","Mother","Paternal Grandfather","Paternal Grandmother","Maternal Grandfather","Maternal Grandmother","Sibling","Uncle","Aunt","Cousin","Other"];

// ═══════════════════════════════════════════════════════════════════════════
//  SMALL REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
const F = ({label,req,children}) => (
  <div style={{marginBottom:12}}>
    <label style={{display:"block",fontSize:11,fontWeight:700,color:"#475569",marginBottom:4}}>
      {label}{req&&<span style={{color:"#ef4444"}}> *</span>}
    </label>
    {children}
  </div>
);

const Inp = ({value,onChange,placeholder="",type="text",disabled=false}) => (
  <input type={type} value={value||""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} disabled={disabled}
    style={{width:"100%",padding:"9px 12px",borderRadius:8,boxSizing:"border-box",
      border:"1.5px solid #e2e8f0",fontSize:13,color:"#1e293b",background:disabled?"#f8fafc":"white",
      outline:"none"}}/>
);

const Sel = ({value,onChange,options,placeholder="Select..."}) => (
  <select value={value||""} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",padding:"9px 12px",borderRadius:8,boxSizing:"border-box",
      border:"1.5px solid #e2e8f0",fontSize:13,background:"white",color:value?"#1e293b":"#94a3b8",
      outline:"none"}}>
    <option value="">{placeholder}</option>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);

const TA = ({value,onChange,placeholder="",rows=3}) => (
  <textarea value={value||""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{width:"100%",padding:"9px 12px",borderRadius:8,boxSizing:"border-box",
      border:"1.5px solid #e2e8f0",fontSize:13,resize:"vertical",
      fontFamily:"inherit",outline:"none"}}/>
);

const Card = ({children,style={}}) => (
  <div style={{background:"white",borderRadius:14,padding:20,marginBottom:16,
    boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9",...style}}>
    {children}
  </div>
);

const STitle = ({icon,title,color="#0d3b47"}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,
    paddingBottom:8,borderBottom:`2px solid ${color}20`}}>
    <span style={{fontSize:20}}>{icon}</span>
    <h3 style={{margin:0,fontSize:15,fontWeight:800,color}}>{title}</h3>
  </div>
);

const Chip = ({label,on,toggle,color="#0d5c6e"}) => (
  <button onClick={toggle} style={{padding:"5px 11px",borderRadius:99,margin:"3px",
    border:`1.5px solid ${on?color:"#e2e8f0"}`,
    background:on?color:"white",color:on?"white":"#64748b",
    fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
    {label}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════
//  PIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function PINScreen({onUnlock}) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const stored = localStorage.getItem("cibs_v_pin")||"1234";

  const press = (k) => {
    if (k==="⌫") { setPin(p=>p.slice(0,-1)); return; }
    if (k==="C")  { setPin(""); return; }
    const next = pin+k;
    setPin(next);
    if (next.length===4) {
      if (next===stored) { onUnlock(); }
      else { setShake(true); setTimeout(()=>{setPin("");setShake(false);},700); }
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0d1f2d,#0d3b47)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:24,padding:40,maxWidth:340,width:"100%",
        textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.4)"}}>
        <div style={{width:72,height:72,borderRadius:18,margin:"0 auto 16px",
          background:"linear-gradient(135deg,#0d3b47,#0d9488)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>🏥</div>
        <h1 style={{fontSize:17,fontWeight:800,color:"#0d3b47",margin:"0 0 4px"}}>
          eSMART Clinical Workstation
        </h1>
        <p style={{fontSize:11,color:"#64748b",margin:"0 0 24px"}}>
          CIBS Nagpur · Dr. Shailesh V. Pangaonkar
        </p>
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:24,
          animation:shake?"shake 0.4s":"none"}}>
          <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:14,height:14,borderRadius:"50%",
              background:pin.length>i?"#0d5c6e":"#e2e8f0",transition:"all 0.15s"}}/>
          ))}
        </div>
        {shake&&<p style={{color:"#dc2626",fontSize:12,marginBottom:12,fontWeight:700}}>Incorrect PIN</p>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,maxWidth:220,margin:"0 auto"}}>
          {[1,2,3,4,5,6,7,8,9,"C",0,"⌫"].map(k=>(
            <button key={k} onClick={()=>press(String(k))}
              style={{padding:"14px",borderRadius:10,border:"1.5px solid #e2e8f0",
                background:k==="C"?"#fef2f2":k==="⌫"?"#f8fafc":"white",
                color:k==="C"?"#dc2626":"#0d3b47",fontSize:18,fontWeight:700,
                cursor:"pointer"}}>
              {k}
            </button>
          ))}
        </div>
        <p style={{margin:"16px 0 0",fontSize:10,color:"#94a3b8"}}>Default PIN: 1234</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function Dashboard({onOpen, onNew, onLock}) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [msg, setMsg]           = useState("");

  const load = async () => {
    setLoading(true); setMsg("");
    try {
      const r = await fetch(`${SCRIPT}?action=getAllSubjects&token=${TOKEN}`);
      const j = await r.json();
      if (j.status==="ok") setSubjects(j.subjects||[]);
      else setMsg("Could not load — check Apps Script.");
    } catch(e) { setMsg("Network error. Check connection."); }
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  // Normalise subject — handle both old and new column formats
  const norm = (s) => ({
    autoID:    s["Auto-ID"]||s["File No."]||s["C-File No"]||"—",
    firstName: s["Child First Name"]||(s["Child Name"]||"").split(" ")[0]||"",
    surname:   s["Child Surname"]||(s["Child Name"]||"").split(" ").slice(1).join(" ")||"",
    fullName:  s["Child Name"]||`${s["Child First Name"]||""} ${s["Child Surname"]||""}`.trim()||"—",
    dob:       s["Date of Birth"]||s["Child DOB"]||"—",
    age:       s["Age"]||s["Child Age"]||"—",
    school:    s["School"]||s["School Name"]||"—",
    gender:    s["Gender"]||s["Child Gender"]||"",
    // Status — new format uses C-Status, old format uses session count
    cStatus:   s["C-Status"]||(s["eSMART-C Session"]&&Number(s["eSMART-C Session"])>0?"Complete":"Awaited")||"Awaited",
    pStatus:   s["P-Status"]||(s["eSMART-P Session"]&&Number(s["eSMART-P Session"])>0?"Complete":"Awaited")||"Awaited",
    vStatus:   s["V-Status"]||(s["eSMART-V Session"]&&Number(s["eSMART-V Session"])>0?"Complete":"Awaited")||"Awaited",
    weeks:     Number(s["W-Total Weeks"]||0),
    lastWeek:  s["W-Last Week"]||"",
    raw:       s,
  });

  const badge = (status) => {
    if (status==="Complete")   return {bg:"#f0fdf4",color:"#15803d",border:"#86efac",icon:"✅",label:"Complete"};
    if (status==="Incomplete") return {bg:"#fffbeb",color:"#d97706",border:"#fde68a",icon:"⚠️",label:"Incomplete"};
    return                            {bg:"#f8fafc",color:"#94a3b8",border:"#e2e8f0",icon:"⏳",label:"Awaited"};
  };

  const copyLink = (tool) => {
    const url = tool==="C"?"https://esmart-c.vercel.app":"https://esmart-p.vercel.app";
    const msg = `Dear Parent,\nPlease complete the ${tool==="C"?"child cognitive assessment":"parent questionnaire"}:\n${url}\n\nCIBS Nagpur · Dr. Pangaonkar · +91 712 254 8966`;
    navigator.clipboard?.writeText(msg).catch(()=>{});
    alert(`Link copied:\n${url}`);
  };

  const filtered = normed.filter(n=>{
    if (!search) return true;
    const name = n.fullName.toLowerCase();
    const id   = n.autoID.toLowerCase();
    return name.includes(search.toLowerCase())||id.includes(search.toLowerCase());
  });

  const total  = subjects.length;
  const normed = subjects.map(norm);
  const done   = normed.filter(n=>n.cStatus==="Complete"&&n.pStatus==="Complete"&&n.vStatus==="Complete").length;
  const cpDone = normed.filter(n=>n.cStatus==="Complete"&&n.pStatus==="Complete"&&n.vStatus!=="Complete").length;
  const weekly = normed.filter(n=>n.weeks>0).length;

  return (
    <div style={{minHeight:"100vh",background:"#e8ecf0",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0d1f2d,#0d3b47)",padding:"14px 20px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",
          justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"#9FE1CB"}}>
              eSMART Clinical Workstation · CIBS Nagpur
            </div>
            <div style={{fontSize:18,fontWeight:800,color:"white"}}>All Subjects</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={onNew} style={{padding:"9px 16px",borderRadius:9,border:"none",
              background:"#0d9488",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              + New Subject
            </button>
            <button onClick={load} style={{padding:"9px 14px",borderRadius:9,
              border:"1.5px solid rgba(255,255,255,0.25)",background:"transparent",
              color:"white",fontSize:12,cursor:"pointer"}}>
              🔄 Refresh
            </button>
            <button onClick={onLock} style={{padding:"9px 14px",borderRadius:9,
              border:"1.5px solid rgba(255,255,255,0.2)",background:"transparent",
              color:"rgba(255,255,255,0.7)",fontSize:12,cursor:"pointer"}}>
              🔒 Lock
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:16}}>
        {msg&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,
          padding:"10px 14px",marginBottom:12,fontSize:12,color:"#dc2626"}}>{msg}</div>}

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
          {[
            ["Total",total,"#0d5c6e","📋"],
            ["C+P+V Done",done,"#10b981","✅"],
            ["C+P Done — V Pending",cpDone,"#d97706","⚡"],
            ["Weekly Active",weekly,"#7c3aed","📱"],
          ].map(([l,n,c,icon])=>(
            <div key={l} style={{background:"white",borderRadius:10,padding:"12px 14px",
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:`2px solid ${c}20`}}>
              <div style={{fontSize:22}}>{icon}</div>
              <div style={{fontSize:24,fontWeight:800,color:c,marginTop:2}}>{n}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Search by name or Auto-ID..."
          style={{width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",
            fontSize:13,marginBottom:12,outline:"none",boxSizing:"border-box",
            background:"white",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}/>

        {/* Table */}
        <div style={{background:"white",borderRadius:12,overflow:"hidden",
          boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
          {loading ? (
            <div style={{padding:40,textAlign:"center",color:"#64748b"}}>
              <div style={{fontSize:32}}>⏳</div>
              <p>Loading from CIBS Databank...</p>
            </div>
          ) : filtered.length===0 ? (
            <div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>
              <div style={{fontSize:32}}>📋</div>
              <p style={{marginTop:8}}>
                {total===0
                  ? "No subjects yet. Click '+ New Subject' to register the first child."
                  : "No results match your search."}
              </p>
            </div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#0d3b47",color:"white"}}>
                    {["Auto-ID","Name","DOB","Age","School","eSMART-C","eSMART-P","eSMART-V","Weekly","Action"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,
                        fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s,i)=>{
                    const cs = s["C-Status"]||""; const ps = s["P-Status"]||""; const vs = s["V-Status"]||"";
                    const cb = badge(cs); const pb = badge(ps); const vb = badge(vs);
                    const nm = `${s["Child First Name"]||""} ${s["Child Surname"]||""}`.trim()||"—";
                    const wk = Number(s["W-Total Weeks"]||0);
                    return (
                      <tr key={i}
                        style={{background:i%2===0?"white":"#f8fafc",borderBottom:"1px solid #f1f5f9"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"white":"#f8fafc"}>
                        <td style={{padding:"10px 12px",fontFamily:"monospace",fontWeight:700,
                          color:"#0d5c6e",fontSize:10}}>
                          {s["Auto-ID"]||"—"}
                        </td>
                        <td style={{padding:"10px 12px",fontWeight:600,color:"#1e293b"}}>{nm}</td>
                        <td style={{padding:"10px 12px",color:"#64748b"}}>{s["Date of Birth"]||"—"}</td>
                        <td style={{padding:"10px 12px",color:"#64748b"}}>{s["Age"]||"—"}</td>
                        <td style={{padding:"10px 12px",color:"#64748b",maxWidth:100,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {s["School"]||"—"}
                        </td>
                        {/* C Status */}
                        <td style={{padding:"8px 10px"}}>
                          <button onClick={()=>cs==="Complete"?onOpen(s,"view-c"):copyLink("C")}
                            style={{padding:"4px 8px",borderRadius:6,border:`1.5px solid ${cb.border}`,
                              background:cb.bg,color:cb.color,fontSize:10,fontWeight:700,cursor:"pointer",
                              display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
                            {cb.icon} {cb.label}
                          </button>
                          {cs!=="Complete"&&(
                            <div style={{fontSize:9,color:"#94a3b8",marginTop:2,cursor:"pointer"}}
                              onClick={()=>copyLink("C")}>📋 Copy link</div>
                          )}
                        </td>
                        {/* P Status */}
                        <td style={{padding:"8px 10px"}}>
                          <button onClick={()=>ps==="Complete"?onOpen(s,"view-p"):copyLink("P")}
                            style={{padding:"4px 8px",borderRadius:6,border:`1.5px solid ${pb.border}`,
                              background:pb.bg,color:pb.color,fontSize:10,fontWeight:700,cursor:"pointer",
                              display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
                            {pb.icon} {pb.label}
                          </button>
                          {ps!=="Complete"&&(
                            <div style={{fontSize:9,color:"#94a3b8",marginTop:2,cursor:"pointer"}}
                              onClick={()=>copyLink("P")}>📋 Copy link</div>
                          )}
                        </td>
                        {/* V Status */}
                        <td style={{padding:"8px 10px"}}>
                          <button onClick={()=>onOpen(s,"workstation")}
                            style={{padding:"4px 8px",borderRadius:6,border:`1.5px solid ${vb.border}`,
                              background:vb.bg,color:vb.color,fontSize:10,fontWeight:700,cursor:"pointer",
                              display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>
                            {vb.icon} {vb.label}
                          </button>
                        </td>
                        <td style={{padding:"8px 10px"}}>
                          {n.weeks>0 ? (
                            <div>
                              <span style={{background:"#f0fdf4",color:"#15803d",borderRadius:6,
                                padding:"3px 6px",fontSize:10,fontWeight:700,display:"block",marginBottom:2}}>
                                ✅ Week {n.lastWeek||n.weeks}
                              </span>
                              <button onClick={()=>window.open(`https://esmart-weekly.vercel.app?reg=${n.autoID}`,"_blank")}
                                style={{width:"100%",padding:"2px 4px",borderRadius:4,
                                  border:"1px solid #86efac",background:"#f0fdf4",
                                  color:"#15803d",fontSize:9,cursor:"pointer",fontWeight:600}}>
                                📱 View
                              </button>
                            </div>
                          ) : (
                            <span style={{color:"#94a3b8",fontSize:10}}>—</span>
                          )}
                        </td>
                        <td style={{padding:"8px 10px"}}>
                          <button onClick={()=>onOpen(s,"workstation")}
                            style={{padding:"6px 12px",borderRadius:7,border:"none",
                              background:"linear-gradient(135deg,#0d5c6e,#0d9488)",
                              color:"white",fontSize:11,fontWeight:700,cursor:"pointer",
                              whiteSpace:"nowrap"}}>
                            Open V →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p style={{textAlign:"center",fontSize:10,color:"#94a3b8",marginTop:12}}>
          CIBS Nagpur · Dr. Shailesh V. Pangaonkar · pangaonkar@cibsindia.com · +91 712 254 8966
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  WORKSTATION — 11 tabs
// ═══════════════════════════════════════════════════════════════════════════
function Workstation({initSubject, onBack}) {
  // ── All state in one place ─────────────────────────────────────────────
  const [tab,     setTab]     = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loadingCP, setLoadingCP] = useState(false);
  const [cData,   setCData]   = useState(null);
  const [pData,   setPData]   = useState(null);
  const [wData,   setWData]   = useState(null);
  const [prevV,   setPrevV]   = useState(null);
  const [sessionMode, setSessionMode] = useState(null);

  // Identity
  const blankCI = {
    cibsReg:"", cFileNo:"", firstName:"", surname:"", dob:"", age:"",
    gender:"", fatherName:"", motherName:"", mobile1:"", mobile2:"",
    email1:"", email2:"", school:"", grade:"", city:"",
    examiner:"Dr. Shailesh V. Pangaonkar",
    setting:"CIBS Nagpur OPD",
    date: TODAYISO, referral:"", education:"",
  };
  const [ci, setCi] = useState(() => {
    if (!initSubject) return blankCI;
    const s = initSubject;
    // Handle both old and new column name formats
    const childName = s["Child Name"]||"";
    const firstName = s["Child First Name"]||(childName.split(" ")[0])||"";
    const surname   = s["Child Surname"]||(childName.split(" ").slice(1).join(" "))||"";
    return {
      ...blankCI,
      cibsReg:   s["CIBS Reg No"]||s["File No."]||"",
      cFileNo:   s["C-File No"]||s["File No."]||"",
      firstName,
      surname,
      dob:       s["Date of Birth"]||s["Child DOB"]||"",
      age:       s["Age"]||s["Child Age"]||"",
      gender:    s["Gender"]||s["Child Gender"]||"",
      fatherName:s["Father Name"]||s["Father's Name"]||"",
      motherName:s["Mother Name"]||s["Mother's Name"]||"",
      mobile1:   s["Mobile 1"]||s["Mobile"]||"",
      mobile2:   s["Mobile 2"]||"",
      email1:    s["Email 1"]||s["Email"]||"",
      email2:    s["Email 2"]||"",
      school:    s["School"]||s["School Name"]||"",
      grade:     s["Class"]||s["Grade"]||"",
      city:      s["City"]||"",
    };
  });
  const upd = (k,v) => setCi(p=>({...p,[k]:v}));

  // Computed autoID — only recalculated when inputs change
  const autoID = useMemo(
    ()=>makeAutoID(ci.surname,ci.dob,ci.mobile1,ci.mobile2),
    [ci.surname,ci.dob,ci.mobile1,ci.mobile2]
  );

  // Diagnosis
  const [dxList, setDxList] = useState([
    {level:1,cat:"",name:"",spec:""},
    {level:2,cat:"",name:"",spec:""},
    {level:3,cat:"",name:"",spec:""},
    {level:4,cat:"",name:"",spec:""},
    {level:5,cat:"",name:"",spec:""},
  ]);

  // Complaints
  const [complaints, setComplaints] = useState([]);

  // Symptoms
  const [sym, setSym] = useState({history:[],exam:[],obs:[]});

  // Grading
  const [grades, setGrades] = useState({});

  // Scales
  const [usedScales, setUsedScales] = useState([]);
  const [scaleData,  setScaleData]  = useState({});

  // Family
  const [family,  setFamily]  = useState([]);
  const [editFam, setEditFam] = useState(null);

  // Medical
  const [med, setMed] = useState({neuro:"",phys:"",eeg:"",mri:"",labs:"",other:""});

  // Medications
  const [drugs, setDrugs] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("cibs_drugs")||"null")||DRUGS_DEFAULT; }
    catch { return DRUGS_DEFAULT; }
  });
  const [meds,    setMeds]    = useState([]);
  const [newDrug, setNewDrug] = useState("");

  // Plan
  const [cgiS,   setCgiS]   = useState(0);
  const [cgiI,   setCgiI]   = useState(0);
  const [note,   setNote]   = useState("");
  const [plan,   setPlan]   = useState({pharma:"",nonpharma:"",referrals:"",investigations:"",followup:"",prognosis:""});
  const [aiLoading, setAiLoading] = useState(false);

  // ── Fetch C+P on mount if we have an autoID ─────────────────────────────
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) return;
    if (!autoID || autoID.includes("XXX") || autoID.includes("0000")) return;
    fetchedRef.current = true;
    setLoadingCP(true);
    const doFetch = async () => {
      try {
        // Try autoID first, fallback to old File No.
      const fetchID = (autoID&&!autoID.includes("XXX")&&!autoID.includes("0000"))
        ? autoID
        : (initSubject?.["File No."]||initSubject?.["C-File No"]||"");
      if (!fetchID) { setLoadingCP(false); return; }
      const r = await fetch(`${SCRIPT}?action=getRecord&reg=${encodeURIComponent(fetchID)}&token=${TOKEN}`);
        const j = await r.json();
        if (j?.status==="ok"&&j?.data) {
          const d=j.data;
          if (d.C) setCData(d.C);
          if (d.P) setPData(d.P);
          if (d.V&&d.sessions?.V>0) setPrevV(d.V);
          // Auto-fill empty fields
          const src=d.C||d.P||{};
          setCi(prev=>{
            const next={...prev};
            if (!next.firstName&&src["Child First Name"]) next.firstName=src["Child First Name"];
            if (!next.surname&&src["Child Surname"])     next.surname=src["Child Surname"];
            if (!next.dob&&src["Date of Birth"])         next.dob=src["Date of Birth"];
            if (!next.age&&src["Age"])                   next.age=src["Age"];
            if (!next.gender&&src["Gender"])             next.gender=src["Gender"];
            if (!next.school&&src["School"])             next.school=src["School"];
            return next;
          });
        }
      } catch(e) {}
      try {
        const r2 = await fetch(`${SCRIPT}?action=getWeekly&reg=${encodeURIComponent(autoID)}&token=${TOKEN}`);
        const j2 = await r2.json();
        if (j2?.status==="ok") setWData(j2.data);
      } catch(e) {}
      setLoadingCP(false);
    };
    doFetch();
  }, []); // runs once on mount only

  // ── Auto-complaints from diagnoses ──────────────────────────────────────
  const autoComplaints = useMemo(() => {
    const s = new Set();
    dxList.forEach(d=>{
      if (!d.name) return;
      const key = Object.keys(COMPLAINTS).find(k=>d.name.toLowerCase().includes(k.toLowerCase()));
      if (key) COMPLAINTS[key].forEach(c=>s.add(c));
      COMPLAINTS["General"].forEach(c=>s.add(c));
    });
    return [...s];
  }, [dxList]);

  // ── Auto-symptoms from diagnoses ────────────────────────────────────────
  const autoSym = useMemo(() => {
    const h=new Set(), e=new Set(), o=new Set();
    const add = (src) => {
      ["On History","History"].forEach(k=>src[k]?.forEach?.(s=>h.add(s)));
      ["On Examination","Examination"].forEach(k=>src[k]?.forEach?.(s=>e.add(s)));
      ["On Observation","Observation"].forEach(k=>src[k]?.forEach?.(s=>o.add(s)));
    };
    dxList.forEach(d=>{
      if (!d.name) return;
      h.add("Developmental history reviewed");
      h.add("Family psychiatric history noted");
      e.add("Appearance and behaviour observed");
      e.add("Speech and language assessed");
      e.add("Mood and affect noted");
      o.add("Rapport and cooperation noted");
      o.add("Activity level during interview");
    });
    // Add from C if available
    if (cData) {
      h.add(`Cognitive assessment completed — IQ ${cData["FIS IQ Estimate"]||"?"} (${cData["FIS IQ Band"]||"?"})`);
    }
    return {history:[...h], exam:[...e], obs:[...o]};
  }, [dxList, cData]);

  // ── Save to databank ────────────────────────────────────────────────────
  const save = async () => {
    if (!ci.cFileNo&&!ci.firstName) { alert("Please fill in at least the C-File Number or child name."); return; }
    setSaving(true);
    const dxAll = dxList.filter(d=>d.name).map(d=>`L${d.level}:${d.name}`).join("; ");
    try {
      await fetch(SCRIPT, {
        method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          tool:"eSMART-V", autoID,
          timestamp: new Date().toISOString(),
          cibs_reg:   ci.cibsReg, c_file_no:  ci.cFileNo,
          child_firstname: ci.firstName, child_surname: ci.surname,
          child_dob: ci.dob, child_age: ci.age, child_gender: ci.gender,
          father_name: ci.fatherName, mother_name: ci.motherName,
          mobile1: ci.mobile1, mobile2: ci.mobile2,
          email1: ci.email1, email2: ci.email2,
          school: ci.school, grade: ci.grade, city: ci.city,
          clinician_name: ci.examiner, setting: ci.setting,
          assessment_date: ci.date, purpose: ci.referral,
          dx_primary:   dxList[0]?.name||"",
          dx_secondary: dxList[1]?.name||"",
          dx_level3:    dxList[2]?.name||"",
          dx_level4:    dxList[3]?.name||"",
          dx_level5:    dxList[4]?.name||"",
          diagnosis_all: dxAll,
          complaints:          complaints.join("; "),
          symptoms_history:    sym.history.join("; "),
          symptoms_examination:sym.exam.join("; "),
          symptoms_observation:sym.obs.join("; "),
          clinical_iq_estimate: scaleData["MISIC"]?.["Full Scale IQ"]||scaleData["WISC"]?.["Full Scale IQ"]||"",
          misic_fsiq: scaleData["MISIC"]?.["Full Scale IQ"]||"",
          misic_vci:  scaleData["MISIC"]?.["VCI"]||"",
          misic_pri:  scaleData["MISIC"]?.["PRI"]||"",
          wisc_fsiq:  scaleData["WISC"]?.["Full Scale IQ"]||"",
          sb5_fsiq:   scaleData["SB5"]?.["Full Scale IQ"]||"",
          vabs_abc:   scaleData["VABS"]?.["Adaptive Behavior Composite"]||"",
          snap_total: scaleData["SNAP"]?.["Total"]||"",
          cgi_s: cgiS, cgi_i: cgiI,
          clinical_impression: note,
          medications: meds.map(m=>`${m.drug} ${m.dose} ${m.freq}`).join("; "),
          pharmacological_plan: plan.pharma,
          non_pharmacological_plan: plan.nonpharma,
          referrals: plan.referrals,
          investigations: plan.investigations,
          follow_up_date: plan.followup,
          prognosis: plan.prognosis,
          family_structure: JSON.stringify(family),
          medical_findings: JSON.stringify(med),
          validation_status:"Completed",
        })
      });
      setSaved(true);
    } catch(e) {}
    setSaving(false);
  };

  // ── AI Plan ─────────────────────────────────────────────────────────────
  const genPlan = async () => {
    setAiLoading(true);
    const dxStr = dxList.filter(d=>d.name).map(d=>d.name).join(", ");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:`You are a child psychiatrist at CIBS Nagpur. Generate a brief management plan for:
Child: ${ci.firstName} ${ci.surname}, Age: ${ci.age}, Gender: ${ci.gender}
Diagnoses: ${dxStr||"Under assessment"}
CGI-S: ${cgiS}/7
${cData?`IQ: ${cData["FIS IQ Estimate"]} (${cData["FIS IQ Band"]||"?"})`:""} 
${pData?`Behavioural risk: ${pData["P-Risk Level"]||pData["Risk Level"]||"?"}`:""} 

Return JSON only: {"pharma":"...","nonpharma":"...","referrals":"...","investigations":"...","prognosis":"..."}`}]
        })
      });
      const j = await r.json();
      const txt = (j.content||[]).map(b=>b.text||"").join("");
      const clean = txt.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean.slice(clean.indexOf("{"),clean.lastIndexOf("}")+1));
      setPlan(p=>({...p,...parsed}));
      if (!note&&parsed.impression) setNote(parsed.impression);
    } catch(e) {}
    setAiLoading(false);
  };

  const TABS = [
    "📋 C+P Status","👤 Identity","🔬 Diagnosis","🗣 Complaints",
    "📝 Symptoms","📊 Grading","🧪 Scales","👨‍👩‍👧 Family",
    "🩺 Medical","💊 Meds","📋 Plan","📄 Report"
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh",background:"#e8ecf0",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <style>{`@media print{.np{display:none!important}body{background:white!important}}
        input:focus,select:focus,textarea:focus{border-color:#0d9488!important;outline:none!important}`}</style>

      {/* Header */}
      <div className="np" style={{background:"linear-gradient(135deg,#0d1f2d,#0d5c6e)",
        padding:"12px 16px",position:"sticky",top:0,zIndex:20}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={onBack}
                style={{padding:"6px 12px",borderRadius:8,border:"1.5px solid rgba(255,255,255,0.25)",
                  background:"transparent",color:"rgba(255,255,255,0.8)",fontSize:11,cursor:"pointer"}}>
                ← Dashboard
              </button>
              <div>
                <div style={{fontSize:9,color:"#9FE1CB",textTransform:"uppercase",letterSpacing:"0.15em"}}>
                  eSMART-V · Clinical Workstation
                </div>
                <div style={{fontSize:15,fontWeight:800,color:"white"}}>
                  {ci.firstName?`${ci.firstName} ${ci.surname}`.trim():"New Subject"}
                  {autoID&&!autoID.includes("XXX")&&!autoID.includes("0000")
                    ?<span style={{fontFamily:"monospace",fontSize:11,marginLeft:8,
                      color:"rgba(255,255,255,0.6)"}}>· {autoID}</span>:""}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {loadingCP&&<span style={{fontSize:10,color:"#9FE1CB"}}>⏳ Fetching C+P...</span>}
              {saved&&!saving&&<span style={{fontSize:10,color:"#9FE1CB"}}>✅ Saved</span>}
              <button onClick={save} disabled={saving}
                style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,
                  background:saving?"#94a3b8":saved?"#10b981":"#0d9488",
                  color:"white",cursor:saving?"wait":"pointer"}}>
                {saving?"Saving...":saved?"✅ Saved":"☁️ Save"}
              </button>
              {autoID&&!autoID.includes("XXX")&&(
                <a href={`https://esmart-report.vercel.app?reg=${autoID}&mode=clinical`}
                  target="_blank" rel="noopener noreferrer"
                  style={{padding:"8px 14px",borderRadius:8,background:"#1e3a5f",color:"white",
                    fontSize:11,fontWeight:700,textDecoration:"none"}}>
                  🏥 Report
                </a>
              )}
            </div>
          </div>
          {/* Tab bar */}
          <div style={{display:"flex",gap:2,overflowX:"auto",paddingBottom:2}}>
            {TABS.map((t,i)=>(
              <button key={i} onClick={()=>setTab(i)}
                style={{padding:"6px 10px",borderRadius:"6px 6px 0 0",border:"none",
                  fontSize:10,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",
                  background:tab===i?"#e8ecf0":"rgba(255,255,255,0.1)",
                  color:tab===i?"#0d3b47":"rgba(255,255,255,0.75)",minWidth:"fit-content"}}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1000,margin:"0 auto",padding:16}}>

        {/* ── TAB 0: C+P Status ── */}
        {tab===0&&(
          <div>
            {/* Quick Launch Pad */}
            <Card style={{background:"linear-gradient(135deg,#0d1f2d,#0d3b47)",border:"none"}}>
              <p style={{margin:"0 0 12px",fontSize:12,fontWeight:700,color:"#9FE1CB",
                textTransform:"uppercase",letterSpacing:"0.1em"}}>
                🖥️ Launch Assessment Tools — Open on clinician screen for subject
              </p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                {[
                  {label:"eSMART-C",sub:"Child Cognitive",url:"https://esmart-c.vercel.app",color:"#0C447C",icon:"🧠"},
                  {label:"eSMART-P",sub:"Parent Questionnaire",url:"https://esmart-p.vercel.app",color:"#633806",icon:"👨‍👩‍👧"},
                  {label:"eSMART-V",sub:"Clinician Workstation",url:"https://esmart-v.vercel.app",color:"#712B13",icon:"🏥"},
                  {label:"Weekly Tracker",sub:"Parent Progress",url:`https://esmart-weekly.vercel.app${autoID&&!autoID.includes("XXX")?`?reg=${autoID}`:""}`,color:"#1e3a5f",icon:"📱"},
                ].map(({label,sub,url,color,icon})=>(
                  <button key={label} onClick={()=>window.open(url,"_blank")}
                    style={{padding:"12px 8px",borderRadius:10,border:"none",
                      background:color,color:"white",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                    <div style={{fontSize:12,fontWeight:700}}>{label}</div>
                    <div style={{fontSize:10,opacity:0.7}}>{sub}</div>
                    <div style={{marginTop:6,padding:"3px 8px",borderRadius:6,
                      background:"rgba(255,255,255,0.15)",fontSize:10,fontWeight:600}}>
                      🖥 Open Now
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {loadingCP&&(
              <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 16px",
                marginBottom:12,border:"1px solid #bfdbfe",fontSize:12,color:"#1d4ed8"}}>
                ⏳ Fetching C and P data for {autoID}...
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {/* C Card */}
              <Card style={{border:cData?"1.5px solid #10b981":"1.5px dashed #cbd5e1"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <h3 style={{margin:0,fontSize:14,fontWeight:800,color:cData?"#0d5c6e":"#94a3b8"}}>
                    eSMART-C
                  </h3>
                  <span style={{fontSize:12,fontWeight:700,color:cData?"#10b981":"#94a3b8"}}>
                    {cData?"✅ Complete":"⏳ Awaited"}
                  </span>
                </div>
                {cData ? (
                  <div style={{fontSize:12,color:"#374151",lineHeight:1.9}}>
                    <div>🧠 IQ: <strong>{cData["FIS IQ Estimate"]||"—"}</strong> — {cData["FIS IQ Band"]||"—"}</div>
                    <div>📅 MA: {cData["FIS Mental Age (yrs)"]||"—"} yrs · P{cData["FIS Percentile"]||"?"}th</div>
                    <div>💡 EQ: <strong>{cData["SCSS EQ Score"]||cData["SCSS Emotional Intelligence"]||"—"}</strong></div>
                    <div>🎯 Style: {cData["SCSS Cognitive Style"]||"—"}</div>
                    <div>⚠️ CRI: {cData["SCSS Combined Risk Index"]||"—"}</div>
                    <div>🔬 DSM Cluster: {cData["SCSS DSM-5 Cluster"]||"—"}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>
                      Session {cData["Session No"]||1} · {(cData["Timestamp"]||"").slice(0,10)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 10px"}}>
                      Not yet completed. Send link to parent/child.
                    </p>
                    <button onClick={()=>{
                      navigator.clipboard?.writeText("https://esmart-c.vercel.app");
                      alert("Link copied: https://esmart-c.vercel.app");
                    }} style={{width:"100%",padding:"8px",borderRadius:8,
                      background:"#eff6ff",border:"1px solid #bfdbfe",
                      color:"#1d4ed8",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                      📋 Copy eSMART-C Link
                    </button>
                  </div>
                )}
              </Card>

              {/* P Card */}
              <Card style={{border:pData?"1.5px solid #10b981":"1.5px dashed #cbd5e1"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <h3 style={{margin:0,fontSize:14,fontWeight:800,color:pData?"#633806":"#94a3b8"}}>
                    eSMART-P
                  </h3>
                  <span style={{fontSize:12,fontWeight:700,color:pData?"#10b981":"#94a3b8"}}>
                    {pData?"✅ Complete":"⏳ Awaited"}
                  </span>
                </div>
                {pData ? (
                  <div style={{fontSize:12,color:"#374151",lineHeight:1.9}}>
                    <div>⚠️ Risk: <strong style={{
                      color:pData["P-Risk Level"]==="LEVEL 3"||pData["Risk Level"]==="LEVEL 3"?"#dc2626":
                           pData["P-Risk Level"]==="LEVEL 2"||pData["Risk Level"]==="LEVEL 2"?"#d97706":"#16a34a"}}>
                      {pData["P-Risk Level"]||pData["Risk Level"]||"—"}
                    </strong></div>
                    <div>👤 Informant: {pData["P-Informant"]||pData["Informant Name"]||"—"} ({pData["P-Relation"]||pData["Informant Relation"]||"—"})</div>
                    {["ADHD","ASD","IDD","MDD","Anxiety","ODD","CD"].filter(d=>{
                      const sev = pData[`P-${d} Sev`]||pData[`${d} Severity`]||"";
                      return sev&&sev!=="Normal";
                    }).map(d=>(
                      <div key={d}>🔴 {d}: <strong>{pData[`P-${d} Sev`]||pData[`${d} Severity`]}</strong></div>
                    ))}
                    {(pData["P-Suicide Flag"]||pData["Suicide Risk Flag"])==="FLAGGED"&&(
                      <div style={{background:"#fef2f2",borderRadius:6,padding:"5px 8px",
                        marginTop:6,color:"#dc2626",fontWeight:700,fontSize:11}}>
                        ⚠️ SUICIDE RISK FLAGGED
                      </div>
                    )}
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>
                      Session {pData["Session No"]||1} · {(pData["Timestamp"]||"").slice(0,10)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{fontSize:12,color:"#94a3b8",margin:"0 0 10px"}}>
                      Not yet completed. Send link to parent.
                    </p>
                    <button onClick={()=>{
                      navigator.clipboard?.writeText("https://esmart-p.vercel.app");
                      alert("Link copied: https://esmart-p.vercel.app");
                    }} style={{width:"100%",padding:"8px",borderRadius:8,
                      background:"#fffbeb",border:"1px solid #fde68a",
                      color:"#92400e",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                      📋 Copy eSMART-P Link
                    </button>
                  </div>
                )}
              </Card>
            </div>

            {/* Weekly summary */}
            {wData?.weeks?.length>0&&(
              <Card style={{background:"#f0fdf4",border:"1.5px solid #86efac"}}>
                <h3 style={{margin:"0 0 8px",fontSize:13,fontWeight:800,color:"#15803d"}}>
                  📱 Weekly Tracker — {wData.weeks.length} week(s) of data
                </h3>
                <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:"#374151"}}>
                  <span>Last entry: {(wData.weeks[wData.weeks.length-1]?.Timestamp||"").slice(0,10)||"—"}</span>
                  <span>Parent stress: {wData.weeks[wData.weeks.length-1]?.["Parent Stress Score"]||"—"}/10</span>
                  <span>Last intervention: {wData.weeks[wData.weeks.length-1]?.["Intervention Activity"]||"—"}</span>
                </div>
              </Card>
            )}

            {/* Previous V session */}
            {prevV&&!sessionMode&&(
              <Card style={{background:"#faf5ff",border:"1.5px solid #d8b4fe"}}>
                <h3 style={{margin:"0 0 8px",fontSize:13,fontWeight:800,color:"#6d28d9"}}>
                  Previous eSMART-V Session Found
                </h3>
                <p style={{fontSize:12,color:"#374151",margin:"0 0 12px"}}>
                  Session {prevV["Session No"]||1} — {(prevV["Timestamp"]||"").slice(0,10)}
                  {prevV["Primary Diagnosis"]?` · Dx: ${prevV["Primary Diagnosis"]}`:""}
                </p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setSessionMode("continue")}
                    style={{padding:"9px 14px",borderRadius:8,border:"none",
                      background:"#6d28d9",color:"white",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    ✏️ Continue Session {prevV["Session No"]||1}
                  </button>
                  <button onClick={()=>setSessionMode("new")}
                    style={{padding:"9px 14px",borderRadius:8,
                      border:"1.5px solid #6d28d9",background:"white",
                      color:"#6d28d9",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                    🔄 Start New Session
                  </button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── TAB 1: Identity ── */}
        {tab===1&&(
          <Card>
            <STitle icon="👤" title="Child Identification" color="#0d5c6e"/>
            {ci.surname&&ci.dob&&(ci.mobile1||ci.mobile2)&&(
              <div style={{background:"linear-gradient(135deg,#0d3b47,#0d5c6e)",
                borderRadius:10,padding:"12px 16px",marginBottom:16,
                display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.12em"}}>
                    Auto-ID (Permanent for this child)
                  </div>
                  <div style={{fontSize:16,fontWeight:800,color:"white",fontFamily:"monospace",letterSpacing:"0.08em"}}>
                    {autoID}
                  </div>
                </div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",textAlign:"right"}}>
                  <div>Stable forever</div>
                  <div>Links C + P + V + Weekly</div>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <F label="CIBS Registration No."><Inp value={ci.cibsReg} onChange={v=>upd("cibsReg",v)}/></F>
              <F label="C-File Number"><Inp value={ci.cFileNo} onChange={v=>upd("cFileNo",v)} placeholder="e.g. C-0042"/></F>
              <F label="Child First Name" req><Inp value={ci.firstName} onChange={v=>upd("firstName",v)}/></F>
              <F label="Child Surname" req><Inp value={ci.surname} onChange={v=>upd("surname",v)}/></F>
              <F label="Date of Birth" req>
                <Inp type="date" value={ci.dob} onChange={v=>{upd("dob",v); upd("age",calcAge(v));}}/>
              </F>
              <F label="Age (years)"><Inp type="number" value={ci.age} onChange={v=>upd("age",v)}/></F>
              <F label="Gender" req>
                <div style={{display:"flex",gap:8}}>
                  {[["M","Male"],["F","Female"],["O","Other"]].map(([v,l])=>(
                    <button key={v} onClick={()=>upd("gender",v)}
                      style={{flex:1,padding:"9px",borderRadius:8,cursor:"pointer",
                        border:`2px solid ${ci.gender===v?"#0d5c6e":"#e2e8f0"}`,
                        background:ci.gender===v?"#0d5c6e":"white",
                        color:ci.gender===v?"white":"#64748b",fontSize:12,fontWeight:600}}>
                      {l}
                    </button>
                  ))}
                </div>
              </F>
              <F label="Education">
                <Sel value={ci.education} onChange={v=>upd("education",v)}
                  options={["Pre-school","Primary (1-5)","Upper Primary (6-8)","Secondary (9-10)","Higher Secondary (11-12)","Graduate","Not in school","Dropout"]}/>
              </F>
              <F label="Father's Full Name"><Inp value={ci.fatherName} onChange={v=>upd("fatherName",v)}/></F>
              <F label="Mother's Full Name"><Inp value={ci.motherName} onChange={v=>upd("motherName",v)}/></F>
              <F label="Mobile 1 (Primary)" req><Inp type="tel" value={ci.mobile1} onChange={v=>upd("mobile1",v)} placeholder="10-digit"/></F>
              <F label="Mobile 2 (Secondary)"><Inp type="tel" value={ci.mobile2} onChange={v=>upd("mobile2",v)}/></F>
              <F label="Email 1"><Inp type="email" value={ci.email1} onChange={v=>upd("email1",v)}/></F>
              <F label="Email 2"><Inp type="email" value={ci.email2} onChange={v=>upd("email2",v)}/></F>
              <F label="School Name"><Inp value={ci.school} onChange={v=>upd("school",v)}/></F>
              <F label="Class / Grade"><Inp value={ci.grade} onChange={v=>upd("grade",v)}/></F>
              <F label="City"><Inp value={ci.city} onChange={v=>upd("city",v)} placeholder="Nagpur"/></F>
              <F label="Assessment Date"><Inp type="date" value={ci.date} onChange={v=>upd("date",v)}/></F>
              <F label="Clinician Name">
                <Inp value={ci.examiner} onChange={v=>upd("examiner",v)}/>
              </F>
              <F label="Setting">
                <Sel value={ci.setting} onChange={v=>upd("setting",v)}
                  options={["OPD — CIBS Nagpur","IPD — CIBS Nagpur","Home Visit","School Visit","Telemedicine","Private Clinic","Other"]}/>
              </F>
              <F label="Referral / Purpose" req={false}>
                <Inp value={ci.referral} onChange={v=>upd("referral",v)} placeholder="e.g. School referral"/>
              </F>
            </div>
          </Card>
        )}

        {/* ── TAB 2: Diagnosis ── */}
        {tab===2&&(
          <Card>
            <STitle icon="🔬" title="Multi-Level Diagnosis — DSM-5 / ICD-11" color="#7c3aed"/>
            <div style={{background:"#faf5ff",borderRadius:8,padding:"10px 12px",
              marginBottom:14,border:"1px solid #ddd6fe",fontSize:12,color:"#6d28d9"}}>
              Level 1 = Primary Diagnosis · Levels 2–5 = Comorbidities
            </div>
            {dxList.map((d,i)=>(
              <div key={i} style={{background:i===0?"#faf5ff":"#f8fafc",borderRadius:10,
                padding:14,marginBottom:10,border:`1.5px solid ${i===0?"#c4b5fd":"#e2e8f0"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,
                    background:i===0?"#7c3aed":"#94a3b8",color:"white",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:800}}>{i+1}</div>
                  <span style={{fontSize:12,fontWeight:700,color:i===0?"#6d28d9":"#64748b"}}>
                    {i===0?"Primary Diagnosis":`Level ${i+1} — Comorbidity`}
                  </span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:8,marginBottom:8}}>
                  <F label="Category">
                    <Sel value={d.cat}
                      onChange={v=>setDxList(p=>p.map((x,j)=>j===i?{...x,cat:v,name:""}:x))}
                      options={Object.keys(DX)}/>
                  </F>
                  <F label="Diagnosis">
                    <Sel value={d.name}
                      onChange={v=>setDxList(p=>p.map((x,j)=>j===i?{...x,name:v}:x))}
                      options={d.cat?DX[d.cat]:[]}
                      placeholder={d.cat?"Select diagnosis...":"Select category first"}/>
                  </F>
                </div>
                <F label="Specifier / Severity / Notes">
                  <Inp value={d.spec}
                    onChange={v=>setDxList(p=>p.map((x,j)=>j===i?{...x,spec:v}:x))}
                    placeholder="e.g. Moderate severity, current episode"/>
                </F>
              </div>
            ))}
          </Card>
        )}

        {/* ── TAB 3: Complaints ── */}
        {tab===3&&(
          <Card>
            <STitle icon="🗣" title="Presenting Complaints" color="#d97706"/>
            <div style={{background:"#fffbeb",borderRadius:8,padding:"10px 12px",
              marginBottom:12,border:"1px solid #fde68a",fontSize:12,color:"#92400e"}}>
              Auto-suggested from diagnoses. Tick all that apply.
            </div>
            <div style={{display:"flex",flexWrap:"wrap",marginBottom:14}}>
              {autoComplaints.map(c=>(
                <Chip key={c} label={c} on={complaints.includes(c)}
                  toggle={()=>setComplaints(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])}
                  color="#d97706"/>
              ))}
            </div>
            <F label="Add custom complaint">
              <div style={{display:"flex",gap:8}}>
                <input id="cc" style={{flex:1,padding:"9px 12px",borderRadius:8,
                  border:"1.5px solid #e2e8f0",fontSize:13,outline:"none"}}
                  placeholder="Type and press Add"/>
                <button onClick={()=>{
                  const v=document.getElementById("cc")?.value?.trim();
                  if(v&&!complaints.includes(v)){setComplaints(p=>[...p,v]);document.getElementById("cc").value="";}
                }} style={{padding:"9px 14px",borderRadius:8,background:"#d97706",
                  color:"white",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  Add
                </button>
              </div>
            </F>
            {complaints.length>0&&(
              <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px",border:"1px solid #e2e8f0"}}>
                <p style={{margin:"0 0 6px",fontSize:11,fontWeight:700,color:"#64748b"}}>
                  Selected ({complaints.length}):
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {complaints.map(c=>(
                    <span key={c} style={{background:"#fef3c7",border:"1px solid #fde68a",
                      borderRadius:99,padding:"3px 10px",fontSize:11,color:"#92400e",
                      display:"flex",alignItems:"center",gap:4}}>
                      {c}
                      <button onClick={()=>setComplaints(p=>p.filter(x=>x!==c))}
                        style={{background:"none",border:"none",cursor:"pointer",
                          color:"#d97706",fontSize:14,padding:0,lineHeight:1}}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── TAB 4: Symptoms ── */}
        {tab===4&&(
          <Card>
            <STitle icon="📝" title="Symptoms — History, Examination & Observation" color="#0891b2"/>
            {[
              {key:"history",label:"On History",color:"#0891b2",bg:"#ecfeff",auto:autoSym.history},
              {key:"exam",   label:"On Examination",color:"#7c3aed",bg:"#faf5ff",auto:autoSym.exam},
              {key:"obs",    label:"On Observation",color:"#d97706",bg:"#fffbeb",auto:autoSym.obs},
            ].map(s=>(
              <div key={s.key} style={{background:s.bg,borderRadius:10,padding:14,
                marginBottom:12,border:`1.5px solid ${s.color}30`}}>
                <div style={{fontSize:13,fontWeight:700,color:s.color,marginBottom:8}}>
                  {s.label} <span style={{fontSize:10,color:"#94a3b8",fontWeight:400}}>({sym[s.key].length} selected)</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap"}}>
                  {s.auto.map(item=>(
                    <Chip key={item} label={item}
                      on={sym[s.key].includes(item)}
                      toggle={()=>setSym(p=>({...p,[s.key]:p[s.key].includes(item)?p[s.key].filter(x=>x!==item):[...p[s.key],item]}))}
                      color={s.color}/>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* ── TAB 5: Grading ── */}
        {tab===5&&(
          <Card>
            <STitle icon="📊" title="Symptom Grading — Intensity · Frequency · Disability" color="#dc2626"/>
            {[...sym.history,...sym.exam,...sym.obs].length===0?(
              <div style={{textAlign:"center",padding:32,color:"#94a3b8"}}>
                <p>No symptoms selected yet.</p>
                <p style={{fontSize:12}}>Go to Tab 4 — Symptoms and select symptoms first.</p>
              </div>
            ):[...sym.history,...sym.exam,...sym.obs].map(s=>(
              <div key={s} style={{background:"#f8fafc",borderRadius:10,padding:14,
                marginBottom:10,border:"1px solid #e2e8f0"}}>
                <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#374151"}}>{s}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <F label="CGI-S (0=Absent, 7=Extreme)">
                    <select value={grades[s]?.intensity||0}
                      onChange={e=>setGrades(p=>({...p,[s]:{...(p[s]||{}),intensity:Number(e.target.value)}}))}
                      style={{width:"100%",padding:"9px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,background:"white"}}>
                      {[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n} — {CGI_S[n]||"Absent"}</option>)}
                    </select>
                  </F>
                  <F label="Frequency">
                    <Sel value={grades[s]?.freq||""} onChange={v=>setGrades(p=>({...p,[s]:{...(p[s]||{}),freq:v}}))}
                      options={["Daily","Several times/week","Weekly","Monthly","Episodic","Constant"]}/>
                  </F>
                  <F label="Disability">
                    <Sel value={grades[s]?.dis||""} onChange={v=>setGrades(p=>({...p,[s]:{...(p[s]||{}),dis:v}}))}
                      options={["None","Mild","Moderate","Severe","Extreme"]}/>
                  </F>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* ── TAB 6: Scales ── */}
        {tab===6&&(
          <Card>
            <STitle icon="🧪" title="Psychometric Scales" color="#0d5c6e"/>
            <div style={{marginBottom:14}}>
              <p style={{fontSize:12,color:"#64748b",marginBottom:8}}>Select scales administered:</p>
              <div style={{display:"flex",flexWrap:"wrap"}}>
                {SCALES.map(s=>(
                  <Chip key={s.id} label={s.id}
                    on={usedScales.includes(s.id)}
                    toggle={()=>setUsedScales(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])}/>
                ))}
              </div>
            </div>
            {usedScales.map(sid=>{
              const scale=SCALES.find(s=>s.id===sid);
              if (!scale) return null;
              const d=scaleData[sid]||{};
              return (
                <div key={sid} style={{background:"#f8fafc",borderRadius:10,padding:14,
                  marginBottom:12,border:"1px solid #e2e8f0"}}>
                  <p style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#0d3b47"}}>{scale.name}</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>
                    {scale.fields.map(f=>(
                      <F key={f} label={f}>
                        <Inp value={d[f]||""}
                          onChange={v=>setScaleData(p=>({...p,[sid]:{...(p[sid]||{}),[f]:v}}))}
                          placeholder="Score"/>
                      </F>
                    ))}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* ── TAB 7: Family ── */}
        {tab===7&&(
          <Card>
            <STitle icon="👨‍👩‍👧" title="Family Structure & Pedigree" color="#7c3aed"/>
            {/* Pedigree visual */}
            <div style={{background:"#f8fafc",borderRadius:10,padding:16,
              marginBottom:14,border:"1px solid #e2e8f0",overflowX:"auto"}}>
              <p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,color:"#64748b",
                textTransform:"uppercase",letterSpacing:"0.08em"}}>
                ■ Male · ○ Female · ★ Index Child · Shaded = Psychiatric History
              </p>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,minWidth:400}}>
                {/* Grandparents row */}
                <div style={{display:"flex",gap:32,justifyContent:"space-around",width:"100%"}}>
                  <div style={{display:"flex",gap:8}}>
                    {family.filter(m=>m.rel.includes("Paternal Grand")).map(m=>(
                      <PedigreeSymbol key={m.id} m={m} onClick={()=>setEditFam(m)}/>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {family.filter(m=>m.rel.includes("Maternal Grand")).map(m=>(
                      <PedigreeSymbol key={m.id} m={m} onClick={()=>setEditFam(m)}/>
                    ))}
                  </div>
                </div>
                {/* Parents row */}
                <div style={{display:"flex",gap:32,alignItems:"center"}}>
                  {family.filter(m=>m.rel==="Father").map(m=>(
                    <PedigreeSymbol key={m.id} m={m} onClick={()=>setEditFam(m)}/>
                  ))}
                  <div style={{width:32,height:2,background:"#94a3b8"}}/>
                  {family.filter(m=>m.rel==="Mother").map(m=>(
                    <PedigreeSymbol key={m.id} m={m} onClick={()=>setEditFam(m)}/>
                  ))}
                </div>
                {/* Subject + Siblings */}
                <div style={{display:"flex",gap:16,alignItems:"flex-end"}}>
                  {family.filter(m=>m.rel==="Sibling"&&Number(m.age||0)>Number(ci.age||0)).map(m=>(
                    <PedigreeSymbol key={m.id} m={m} onClick={()=>setEditFam(m)}/>
                  ))}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <div style={{width:40,height:40,borderRadius:ci.gender==="F"?"50%":0,
                      border:"3px solid #0d9488",background:"#f0fdf4",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>★</div>
                    <div style={{fontSize:10,fontWeight:700,color:"#0d9488"}}>{ci.firstName||"Subject"}</div>
                  </div>
                  {family.filter(m=>m.rel==="Sibling"&&Number(m.age||0)<=Number(ci.age||0)).map(m=>(
                    <PedigreeSymbol key={m.id} m={m} onClick={()=>setEditFam(m)}/>
                  ))}
                </div>
              </div>
            </div>
            {/* Add member buttons */}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
              {RELATIONS.map(rel=>(
                <button key={rel} onClick={()=>setFamily(p=>[...p,{
                  id:Date.now(),rel,name:"",gender:rel==="Mother"||rel==="Aunt"?"F":"M",
                  age:"",edu:"",occ:"",psych:"None",deceased:false
                }])}
                  style={{padding:"5px 10px",borderRadius:8,
                    border:"1.5px dashed #0d9488",background:"white",
                    color:"#0d9488",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  + {rel}
                </button>
              ))}
            </div>
            {/* Member list */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
              {family.map(m=>(
                <div key={m.id} style={{background:"white",borderRadius:8,padding:"10px 12px",
                  border:`1px solid ${m.psych&&m.psych!=="None"?"#fecaca":"#e2e8f0"}`,
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#374151"}}>{m.rel}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{m.name||"—"} · {m.gender==="F"?"Female":"Male"} · {m.age||"?"}yr</div>
                    {m.psych&&m.psych!=="None"&&<div style={{fontSize:10,color:"#dc2626"}}>Psych hx: {m.psych}</div>}
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setEditFam({...m})}
                      style={{padding:"3px 8px",borderRadius:6,border:"1px solid #e2e8f0",
                        background:"#f8fafc",fontSize:11,cursor:"pointer"}}>✏️</button>
                    <button onClick={()=>setFamily(p=>p.filter(x=>x.id!==m.id))}
                      style={{padding:"3px 8px",borderRadius:6,border:"1px solid #fecaca",
                        background:"#fef2f2",fontSize:11,cursor:"pointer",color:"#dc2626"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Edit modal */}
            {editFam&&(
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",
                zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div style={{background:"white",borderRadius:16,padding:24,
                  width:"100%",maxWidth:380,maxHeight:"80vh",overflowY:"auto"}}>
                  <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:800}}>{editFam.rel}</h3>
                  <F label="Name"><Inp value={editFam.name||""} onChange={v=>setEditFam(p=>({...p,name:v}))}/></F>
                  <F label="Gender">
                    <div style={{display:"flex",gap:8}}>
                      {[["M","Male"],["F","Female"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setEditFam(p=>({...p,gender:v}))}
                          style={{flex:1,padding:"8px",borderRadius:8,cursor:"pointer",
                            border:`2px solid ${editFam.gender===v?"#0d9488":"#e2e8f0"}`,
                            background:editFam.gender===v?"#0d9488":"white",
                            color:editFam.gender===v?"white":"#64748b",fontSize:12,fontWeight:600}}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </F>
                  <F label="Age"><Inp type="number" value={editFam.age||""} onChange={v=>setEditFam(p=>({...p,age:v}))}/></F>
                  <F label="Education"><Inp value={editFam.edu||""} onChange={v=>setEditFam(p=>({...p,edu:v}))}/></F>
                  <F label="Occupation"><Inp value={editFam.occ||""} onChange={v=>setEditFam(p=>({...p,occ:v}))}/></F>
                  <F label="Psychiatric History">
                    <Sel value={editFam.psych||""} onChange={v=>setEditFam(p=>({...p,psych:v}))}
                      options={["None","ADHD","Depression","Anxiety","Bipolar","Schizophrenia","Intellectual Disability","Substance Use","Epilepsy","Other"]}/>
                  </F>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <input type="checkbox" id="dec" checked={editFam.deceased||false}
                      onChange={e=>setEditFam(p=>({...p,deceased:e.target.checked}))}/>
                    <label htmlFor="dec" style={{fontSize:12}}>Deceased</label>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setEditFam(null)}
                      style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid #e2e8f0",
                        background:"#f8fafc",fontSize:13,cursor:"pointer"}}>Cancel</button>
                    <button onClick={()=>{
                      setFamily(p=>p.map(m=>m.id===editFam.id?editFam:m));
                      setEditFam(null);
                    }} style={{flex:2,padding:"10px",borderRadius:8,border:"none",
                      background:"#0d5c6e",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── TAB 8: Medical ── */}
        {tab===8&&(
          <Card>
            <STitle icon="🩺" title="Medical Findings & Investigations" color="#dc2626"/>
            {[
              {k:"neuro",l:"Neurological Examination"},
              {k:"phys", l:"Physical Examination"},
              {k:"eeg",  l:"EEG Findings"},
              {k:"mri",  l:"MRI / CT Brain"},
              {k:"labs", l:"Laboratory Investigations"},
              {k:"other",l:"Other Findings"},
            ].map(({k,l})=>(
              <F key={k} label={l}>
                <TA value={med[k]} onChange={v=>setMed(p=>({...p,[k]:v}))} rows={3}
                  placeholder={`${l}...`}/>
              </F>
            ))}
          </Card>
        )}

        {/* ── TAB 9: Medications ── */}
        {tab===9&&(
          <Card>
            <STitle icon="💊" title="Medications" color="#7c3aed"/>
            <div style={{background:"#faf5ff",borderRadius:10,padding:12,
              marginBottom:14,border:"1px solid #ddd6fe"}}>
              <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:"#6d28d9"}}>
                Add new drug to master list:
              </p>
              <div style={{display:"flex",gap:8}}>
                <Inp value={newDrug} onChange={setNewDrug} placeholder="Generic drug name"/>
                <button onClick={()=>{
                  const d=newDrug.trim();
                  if(!d) return;
                  const updated=[...new Set([...drugs,d])];
                  setDrugs(updated);
                  localStorage.setItem("cibs_drugs",JSON.stringify(updated));
                  try { fetch(SCRIPT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({tool:"DRUG_MASTER",drug:d,addedBy:ci.examiner||"",timestamp:new Date().toISOString()})}); }
                  catch(e){}
                  setNewDrug("");
                }} style={{padding:"9px 16px",borderRadius:8,background:"#7c3aed",
                  color:"white",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                  + Add
                </button>
              </div>
            </div>
            {meds.map((m,i)=>(
              <div key={m.id} style={{background:"#f8fafc",borderRadius:10,padding:14,
                marginBottom:10,border:"1px solid #e2e8f0"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:"#374151"}}>Medication {i+1}</span>
                  <button onClick={()=>setMeds(p=>p.filter(x=>x.id!==m.id))}
                    style={{padding:"3px 10px",borderRadius:6,border:"1px solid #fecaca",
                      background:"#fef2f2",color:"#dc2626",fontSize:11,cursor:"pointer"}}>Remove</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8}}>
                  <F label="Drug Name">
                    <select value={m.drug||""} onChange={e=>setMeds(p=>p.map(x=>x.id===m.id?{...x,drug:e.target.value}:x))}
                      style={{width:"100%",padding:"9px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,background:"white"}}>
                      <option value="">Select...</option>
                      {drugs.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </F>
                  <F label="Dose">
                    <Inp value={m.dose||""} onChange={v=>setMeds(p=>p.map(x=>x.id===m.id?{...x,dose:v}:x))} placeholder="e.g. 10mg"/>
                  </F>
                  <F label="Frequency">
                    <Sel value={m.freq||""} onChange={v=>setMeds(p=>p.map(x=>x.id===m.id?{...x,freq:v}:x))}
                      options={["Once daily","Twice daily","Three times daily","At bedtime","Morning only","As needed"]}/>
                  </F>
                  <F label="Duration">
                    <Inp value={m.dur||""} onChange={v=>setMeds(p=>p.map(x=>x.id===m.id?{...x,dur:v}:x))} placeholder="e.g. 3 months"/>
                  </F>
                </div>
              </div>
            ))}
            <button onClick={()=>setMeds(p=>[...p,{id:Date.now(),drug:"",dose:"",freq:"",dur:""}])}
              style={{width:"100%",padding:12,borderRadius:10,border:"2px dashed #7c3aed",
                background:"white",color:"#7c3aed",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              + Add Medication
            </button>
          </Card>
        )}

        {/* ── TAB 10: Plan ── */}
        {tab===10&&(
          <div>
            <Card>
              <STitle icon="📊" title="Clinical Global Impression" color="#0d5c6e"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[
                  {label:"CGI-S — Severity",val:cgiS,set:setCgiS,labels:CGI_S,colors:["","#10b981","#84cc16","#f59e0b","#f97316","#ef4444","#dc2626","#991b1b"]},
                  {label:"CGI-I — Improvement",val:cgiI,set:setCgiI,labels:CGI_I,colors:["","#10b981","#22c55e","#84cc16","#f59e0b","#f97316","#ef4444","#dc2626"]},
                ].map(({label,val,set,labels,colors})=>(
                  <div key={label} style={{background:"#f8fafc",borderRadius:10,padding:14,border:"1px solid #e2e8f0"}}>
                    <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#374151"}}>{label}</p>
                    <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
                      {[1,2,3,4,5,6,7].map(n=>(
                        <button key={n} onClick={()=>set(n)}
                          style={{width:40,height:40,borderRadius:8,cursor:"pointer",
                            border:`2px solid ${val===n?colors[n]:"#e2e8f0"}`,
                            background:val===n?colors[n]:"white",
                            color:val===n?"white":"#64748b",fontSize:16,fontWeight:800}}>
                          {n}
                        </button>
                      ))}
                    </div>
                    {val>0&&<p style={{margin:"8px 0 0",textAlign:"center",fontSize:12,
                      fontWeight:700,color:colors[val]}}>{labels[val]}</p>}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <STitle icon="📝" title="Clinical Formulation" color="#374151"/>
              <F label="Integrated Clinical Impression">
                <TA value={note} onChange={setNote} rows={5}
                  placeholder="Integrated clinical formulation..."/>
              </F>
            </Card>
            <Card>
              <STitle icon="🤖" title="AI Management Plan" color="#0d9488"/>
              {wData?.weeks?.length>0&&(
                <div style={{background:"#f0fdf4",borderRadius:8,padding:"8px 12px",
                  marginBottom:12,border:"1px solid #86efac",fontSize:11,color:"#15803d"}}>
                  ✅ {wData.weeks.length} weeks of parent tracking data will be included.
                </div>
              )}
              <button onClick={genPlan} disabled={aiLoading}
                style={{width:"100%",padding:12,borderRadius:10,border:"none",marginBottom:14,
                  background:aiLoading?"#94a3b8":"linear-gradient(135deg,#0d5c6e,#0d9488)",
                  color:"white",fontSize:13,fontWeight:700,cursor:aiLoading?"wait":"pointer"}}>
                {aiLoading?"🤖 Generating...":"🤖 Generate AI Management Plan"}
              </button>
              {[
                {k:"pharma",l:"💊 Pharmacological Management"},
                {k:"nonpharma",l:"🧠 Non-Pharmacological Interventions"},
                {k:"referrals",l:"📋 Referrals"},
                {k:"investigations",l:"🔬 Investigations"},
                {k:"prognosis",l:"📈 Prognosis"},
              ].map(({k,l})=>(
                <F key={k} label={l}>
                  <TA value={plan[k]} onChange={v=>setPlan(p=>({...p,[k]:v}))} rows={3}/>
                </F>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <F label="📅 Follow-Up Date">
                  <Inp type="date" value={plan.followup} onChange={v=>setPlan(p=>({...p,followup:v}))}/>
                </F>
                <F label="Next Appointment Type">
                  <Sel value={plan.apptType||""} onChange={v=>setPlan(p=>({...p,apptType:v}))}
                    options={["OPD Review","Repeat Psychometry","Family Counselling","Medication Review","Telemedicine"]}/>
                </F>
              </div>
            </Card>
            <Card style={{background:"#f0fdf4",border:"1.5px solid #86efac"}}>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={save} disabled={saving}
                  style={{flex:1,padding:14,borderRadius:10,border:"none",fontSize:14,fontWeight:800,
                    background:saved?"#10b981":"linear-gradient(135deg,#0d5c6e,#0d9488)",
                    color:"white",cursor:"pointer"}}>
                  {saving?"Saving...":saved?"✅ Saved":"☁️ Save to CIBS Databank"}
                </button>
                {autoID&&!autoID.includes("XXX")&&[
                  [`https://esmart-report.vercel.app?reg=${autoID}&mode=clinical`,"🏥 Clinical Report","#1e3a5f"],
                  [`https://esmart-report.vercel.app?reg=${autoID}&mode=family`,"👨‍👩‍👧 Family Report","#0d9488"],
                  [`https://esmart-weekly.vercel.app?reg=${autoID}`,"📱 Weekly Tracker","#d97706"],
                ].map(([href,label,bg])=>(
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    style={{flex:1,padding:14,borderRadius:10,background:bg,color:"white",
                      fontSize:13,fontWeight:700,textDecoration:"none",textAlign:"center",
                      display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {label}
                  </a>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 11: Report ── */}
        {tab===11&&(
          <div>
            <style>{`@media print{.np{display:none!important}body{background:white!important}}@page{size:A4;margin:16mm}`}</style>
            <div className="np" style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              <button onClick={()=>window.print()}
                style={{flex:1,padding:"12px 20px",borderRadius:10,border:"none",
                  background:"#1e293b",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                🖨️ Print / Save PDF
              </button>
              <button onClick={save} disabled={saving}
                style={{flex:1,padding:"12px 20px",borderRadius:10,border:"none",
                  background:saved?"#10b981":"#0d9488",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                {saving?"Saving...":saved?"✅ Saved":"☁️ Save First"}
              </button>
            </div>

            {/* REPORT DOCUMENT */}
            <div style={{background:"white",boxShadow:"0 4px 40px rgba(0,0,0,0.12)",
              borderRadius:4,overflow:"hidden",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

              {/* Header */}
              <div style={{background:"linear-gradient(135deg,#0d1f2d,#0d3b47,#0d5c6e)",
                padding:"24px 32px 20px",color:"white"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",
                  flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:9,letterSpacing:"0.25em",color:"#9FE1CB",marginBottom:6,textTransform:"uppercase"}}>
                      Central Institute of Behavioural Sciences · Nagpur · eSMART-V
                    </div>
                    <div style={{fontSize:22,fontWeight:800}}>Clinical Assessment Report</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",marginTop:2}}>
                      Confidential · For Clinical Use Only
                    </div>
                  </div>
                  <div style={{textAlign:"right",fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.9}}>
                    <div style={{color:"white",fontWeight:700}}>{TODAY}</div>
                    <div>{ci.examiner||"Dr. Shailesh V. Pangaonkar"}</div>
                    <div>MBBS · DPM · DNB · MSc</div>
                    <div>{ci.setting||"CIBS Nagpur"}</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,
                  marginTop:18,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.12)"}}>
                  {[
                    ["Name",`${ci.firstName||""} ${ci.surname||""}`.trim()||"—"],
                    ["Auto-ID",autoID||"—"],
                    ["C-File No.",ci.cFileNo||"—"],
                    ["Date of Birth",ci.dob||"—"],
                    ["Age / Gender",`${ci.age||"?"}yr · ${ci.gender==="M"?"Male":ci.gender==="F"?"Female":"—"}`],
                    ["School",ci.school||"—"],
                    ["Father",ci.fatherName||"—"],
                    ["Mother",ci.motherName||"—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"6px 10px"}}>
                      <div style={{fontSize:8,opacity:0.55,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>{l}</div>
                      <div style={{fontSize:11,fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{padding:"24px 32px"}}>
                {/* C+P summary */}
                {(cData||pData)&&(
                  <div style={{display:"grid",gridTemplateColumns:cData&&pData?"1fr 1fr":"1fr",
                    gap:10,marginBottom:20}}>
                    {cData&&<div style={{background:"#f0f9ff",borderRadius:8,padding:"10px 14px",border:"1px solid #bae6fd"}}>
                      <div style={{fontSize:9,fontWeight:800,color:"#0369a1",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>eSMART-C Cognitive</div>
                      <div style={{fontSize:12,color:"#1e3a5f",lineHeight:1.8}}>
                        <span>IQ <strong>{cData["FIS IQ Estimate"]||"—"}</strong> ({cData["FIS IQ Band"]||"—"})</span>
                        {" · "}<span>EQ {cData["SCSS EQ Score"]||cData["SCSS Emotional Intelligence"]||"—"}</span>
                        {" · "}<span>CRI {cData["SCSS Combined Risk Index"]||"—"}</span>
                      </div>
                    </div>}
                    {pData&&<div style={{background:"#fffbeb",borderRadius:8,padding:"10px 14px",border:"1px solid #fde68a"}}>
                      <div style={{fontSize:9,fontWeight:800,color:"#92400e",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>eSMART-P Behavioural</div>
                      <div style={{fontSize:12,color:"#78350f",lineHeight:1.8}}>
                        <span>Risk <strong>{pData["P-Risk Level"]||pData["Risk Level"]||"—"}</strong></span>
                        {" · "}<span>Informant: {pData["P-Informant"]||pData["Informant Name"]||"—"}</span>
                      </div>
                    </div>}
                  </div>
                )}

                {/* Diagnosis */}
                {dxList.some(d=>d.name)&&(
                  <RSection title="1. Diagnostic Formulation" color="#7c3aed">
                    {dxList.filter(d=>d.name).map((d,i)=>(
                      <div key={i} style={{display:"flex",gap:10,marginBottom:8,padding:"8px 12px",
                        borderRadius:8,background:i===0?"#faf5ff":"#f8fafc",
                        border:`1px solid ${i===0?"#d8b4fe":"#e2e8f0"}`}}>
                        <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,
                          background:i===0?"#7c3aed":"#94a3b8",color:"white",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>
                          {i+1}
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:i===0?"#6d28d9":"#374151"}}>{d.name}</div>
                          {d.spec&&<div style={{fontSize:11,color:"#64748b"}}>{d.spec}</div>}
                          <div style={{fontSize:10,color:"#94a3b8"}}>{i===0?"Primary":` Comorbidity L${i+1}`} · {d.cat}</div>
                        </div>
                      </div>
                    ))}
                  </RSection>
                )}

                {/* Complaints */}
                {complaints.length>0&&(
                  <RSection title="2. Presenting Complaints" color="#d97706">
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {complaints.map(c=>(
                        <span key={c} style={{background:"#fffbeb",border:"1px solid #fde68a",
                          borderRadius:99,padding:"3px 10px",fontSize:11,color:"#92400e"}}>{c}</span>
                      ))}
                    </div>
                  </RSection>
                )}

                {/* Symptoms */}
                {([...sym.history,...sym.exam,...sym.obs].length>0)&&(
                  <RSection title="3. Clinical Findings" color="#0891b2">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {[
                        {label:"On History",items:sym.history,color:"#0891b2",bg:"#ecfeff"},
                        {label:"On Examination",items:sym.exam,color:"#7c3aed",bg:"#faf5ff"},
                        {label:"On Observation",items:sym.obs,color:"#d97706",bg:"#fffbeb"},
                      ].filter(s=>s.items.length>0).map(s=>(
                        <div key={s.label} style={{background:s.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${s.color}30`}}>
                          <div style={{fontSize:10,fontWeight:700,color:s.color,textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
                          {s.items.map(item=>(
                            <div key={item} style={{fontSize:11,color:"#374151",marginBottom:3,
                              paddingLeft:8,borderLeft:`2px solid ${s.color}50`}}>{item}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </RSection>
                )}

                {/* Grading */}
                {Object.keys(grades).length>0&&(
                  <RSection title="4. Symptom Severity" color="#dc2626">
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{background:"#f8fafc"}}>
                          {["Symptom","CGI-S","Severity","Frequency","Disability"].map(h=>(
                            <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:10,
                              fontWeight:700,color:"#64748b",textTransform:"uppercase",
                              borderBottom:"2px solid #e2e8f0"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(grades).map(([s,g],i)=>(
                          <tr key={s} style={{background:i%2===0?"white":"#f8fafc"}}>
                            <td style={{padding:"7px 10px",borderBottom:"1px solid #f1f5f9"}}>{s}</td>
                            <td style={{padding:"7px 10px",fontWeight:800,textAlign:"center",
                              borderBottom:"1px solid #f1f5f9",
                              color:["","#10b981","#84cc16","#f59e0b","#f97316","#ef4444","#dc2626","#991b1b"][g.intensity||0]}}>
                              {g.intensity||0}
                            </td>
                            <td style={{padding:"7px 10px",fontSize:10,color:"#64748b",borderBottom:"1px solid #f1f5f9"}}>{CGI_S[g.intensity||0]||"Absent"}</td>
                            <td style={{padding:"7px 10px",fontSize:10,color:"#64748b",borderBottom:"1px solid #f1f5f9"}}>{g.freq||"—"}</td>
                            <td style={{padding:"7px 10px",fontSize:10,color:"#64748b",borderBottom:"1px solid #f1f5f9"}}>{g.dis||"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </RSection>
                )}

                {/* Scales */}
                {usedScales.length>0&&(
                  <RSection title="5. Psychometric Assessment" color="#0d5c6e">
                    {usedScales.map(sid=>{
                      const scale=SCALES.find(s=>s.id===sid);
                      if(!scale) return null;
                      const d=scaleData[sid]||{};
                      const scored=Object.entries(d).filter(([,v])=>v);
                      if(scored.length===0) return null;
                      return (
                        <div key={sid} style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",
                          marginBottom:10,border:"1px solid #e2e8f0"}}>
                          <div style={{fontSize:12,fontWeight:700,color:"#0d3b47",marginBottom:8}}>{scale.name}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                            {scored.map(([k,v])=>(
                              <div key={k} style={{background:"white",borderRadius:6,padding:"5px 10px",border:"1px solid #e2e8f0"}}>
                                <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase"}}>{k}</div>
                                <div style={{fontSize:14,fontWeight:800,color:"#0d3b47"}}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </RSection>
                )}

                {/* Medications */}
                {meds.filter(m=>m.drug).length>0&&(
                  <RSection title="6. Medications" color="#7c3aed">
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{background:"#faf5ff"}}>
                          {["#","Drug","Dose","Frequency","Duration"].map(h=>(
                            <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:10,
                              fontWeight:700,color:"#6d28d9",borderBottom:"2px solid #ddd6fe"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {meds.filter(m=>m.drug).map((m,i)=>(
                          <tr key={m.id} style={{background:i%2===0?"white":"#faf5ff"}}>
                            <td style={{padding:"7px 10px",color:"#94a3b8",borderBottom:"1px solid #f1f5f9"}}>{i+1}</td>
                            <td style={{padding:"7px 10px",fontWeight:700,borderBottom:"1px solid #f1f5f9"}}>{m.drug}</td>
                            <td style={{padding:"7px 10px",borderBottom:"1px solid #f1f5f9"}}>{m.dose||"—"}</td>
                            <td style={{padding:"7px 10px",borderBottom:"1px solid #f1f5f9"}}>{m.freq||"—"}</td>
                            <td style={{padding:"7px 10px",borderBottom:"1px solid #f1f5f9"}}>{m.dur||"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </RSection>
                )}

                {/* CGI + Note */}
                <RSection title="7. Clinical Impression & CGI" color="#0d5c6e">
                  <div style={{display:"flex",gap:12,marginBottom:12}}>
                    {cgiS>0&&<div style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",
                      border:"1px solid #e2e8f0",textAlign:"center",flex:1}}>
                      <div style={{fontSize:10,color:"#64748b",fontWeight:700}}>CGI-S — Severity</div>
                      <div style={{fontSize:32,fontWeight:900,color:["","#10b981","#84cc16","#f59e0b","#f97316","#ef4444","#dc2626","#991b1b"][cgiS]}}>{cgiS}</div>
                      <div style={{fontSize:11,color:"#374151"}}>{CGI_S[cgiS]}</div>
                    </div>}
                    {cgiI>0&&<div style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",
                      border:"1px solid #e2e8f0",textAlign:"center",flex:1}}>
                      <div style={{fontSize:10,color:"#64748b",fontWeight:700}}>CGI-I — Improvement</div>
                      <div style={{fontSize:32,fontWeight:900,color:"#10b981"}}>{cgiI}</div>
                      <div style={{fontSize:11,color:"#374151"}}>{CGI_I[cgiI]}</div>
                    </div>}
                  </div>
                  {note&&<div style={{background:"#f0fdf4",borderRadius:8,padding:"12px 14px",border:"1px solid #86efac"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#15803d",marginBottom:6,textTransform:"uppercase"}}>Clinical Formulation</div>
                    <div style={{fontSize:13,color:"#166534",lineHeight:1.8,fontStyle:"italic"}}>{note}</div>
                  </div>}
                </RSection>

                {/* Plan */}
                {(plan.pharma||plan.nonpharma||plan.referrals)&&(
                  <RSection title="8. Management Plan" color="#1e3a5f">
                    {[
                      {k:"pharma",l:"💊 Pharmacological",c:"#7c3aed",b:"#faf5ff"},
                      {k:"nonpharma",l:"🧠 Non-Pharmacological",c:"#0d9488",b:"#f0fdf4"},
                      {k:"referrals",l:"📋 Referrals",c:"#d97706",b:"#fffbeb"},
                      {k:"investigations",l:"🔬 Investigations",c:"#0891b2",b:"#ecfeff"},
                      {k:"prognosis",l:"📈 Prognosis",c:"#10b981",b:"#f0fdf4"},
                    ].filter(({k})=>plan[k]).map(({k,l,c,b})=>(
                      <div key={k} style={{background:b,borderRadius:8,padding:"10px 14px",
                        marginBottom:10,border:`1px solid ${c}30`}}>
                        <div style={{fontSize:11,fontWeight:700,color:c,marginBottom:4}}>{l}</div>
                        <div style={{fontSize:12,color:"#374151",lineHeight:1.8,whiteSpace:"pre-line"}}>{plan[k]}</div>
                      </div>
                    ))}
                    {plan.followup&&(
                      <div style={{background:"#0d3b47",borderRadius:8,padding:"10px 14px",
                        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:12,fontWeight:700,color:"white"}}>📅 Follow-Up Date</span>
                        <span style={{fontSize:14,fontWeight:800,color:"#9FE1CB"}}>{plan.followup}</span>
                      </div>
                    )}
                  </RSection>
                )}

                {/* Signatures */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:32,
                  marginTop:24,paddingTop:16,borderTop:"2px solid #e2e8f0"}}>
                  {["Examining Clinician","Countersigning Supervisor"].map(l=>(
                    <div key={l}>
                      <div style={{height:40,borderBottom:"1px dotted #94a3b8",marginBottom:6}}/>
                      <div style={{fontSize:10,color:"#94a3b8"}}>{l} · Designation · Reg. No. · Date</div>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:14,display:"flex",justifyContent:"space-between",
                  fontSize:9,color:"#94a3b8",borderTop:"1px solid #f1f5f9",paddingTop:8}}>
                  <span>eSMART-V Clinical Report · CIBS Nagpur · {TODAY}</span>
                  <span>CONFIDENTIAL · Auto-ID: {autoID}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pedigree symbol helper ─────────────────────────────────────────────────
function PedigreeSymbol({m, onClick}) {
  const isMale = m.gender==="M";
  const affected = m.psych&&m.psych!=="None";
  const color = affected?"#dc2626":"#374151";
  return (
    <div onClick={onClick} style={{display:"flex",flexDirection:"column",alignItems:"center",
      gap:4,cursor:"pointer",minWidth:50}}>
      <div style={{
        width:36,height:36,
        borderRadius:isMale?0:"50%",
        border:`2.5px solid ${color}`,
        background:affected?`${color}20`:"white",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:10,fontWeight:700,color,position:"relative",
      }}>
        {m.deceased&&<div style={{position:"absolute",top:-4,left:"50%",
          width:2,height:44,background:"#374151",transform:"translateX(-50%)"}}/>}
      </div>
      <div style={{fontSize:9,color:"#64748b",textAlign:"center",maxWidth:48,lineHeight:1.2}}>
        {m.name||m.rel}
        {m.age?<span> {m.age}yr</span>:""}
      </div>
    </div>
  );
}

// ── Report section helper ──────────────────────────────────────────────────
function RSection({title,color,children}) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,
        paddingBottom:7,borderBottom:`2px solid ${color}25`}}>
        <h3 style={{margin:0,fontSize:13,fontWeight:800,color,
          textTransform:"uppercase",letterSpacing:"0.05em"}}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN APP — PIN → Dashboard → Workstation
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen,  setScreen]  = useState("pin");
  const [subject, setSubject] = useState(null);

  if (screen==="pin") {
    return <PINScreen onUnlock={()=>setScreen("dashboard")}/>;
  }

  if (screen==="dashboard") {
    return (
      <Dashboard
        onOpen={(subj, mode)=>{
          if (mode==="workstation"||mode==="view-c"||mode==="view-p") {
            setSubject(subj);
            setScreen("workstation");
          }
        }}
        onNew={()=>{ setSubject(null); setScreen("workstation"); }}
        onLock={()=>setScreen("pin")}/>
    );
  }

  if (screen==="workstation") {
    return (
      <Workstation
        key={subject?.["Auto-ID"]||"new"}
        initSubject={subject}
        onBack={()=>{ setSubject(null); setScreen("dashboard"); }}/>
    );
  }

  return null;
}
