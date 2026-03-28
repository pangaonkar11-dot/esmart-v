import { useState } from "react";

// ── GOOGLE SHEETS DATA PIPELINE ───────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxFmt0azInyYV-4QzDl58q6DaYX9Wj3BKKbtmHI5G2xJjm69iYQkEndwN1mKI7vI64A8A/exec";
const getURLParam = (key) => { try { return new URLSearchParams(window.location.search).get(key)||""; } catch { return ""; } };
const autoFileNo  = () => { const yy=String(new Date().getFullYear()).slice(-2); return `CIBS-${yy}-${String(Math.floor(Math.random()*9000)+1000)}`; };

// ════════════════════════════════════════════════════════════════════════════
//  eSMART-V  |  CIBS-VALID  |  Clinician Validation Module
//  Central Institute of Behavioural Sciences, Nagpur
//  Dr. Shailesh Pangaonkar — Director & Consultant Psychiatrist
//  MBBS, DPM, DNB, MSc BA
//  Standalone — bridges to CIBS Databank via FileNo UID
// ════════════════════════════════════════════════════════════════════════════

// ── TRANSLATIONS ──────────────────────────────────────────────────────────
const T = {
  en: {
    title:"eSMART-V", subtitle:"CIBS Validation and Assessment of Longitudinal Instrument Diagnostics",
    org:"Central Institute of Behavioural Sciences, Nagpur",
    steps:["Child ID","Cognitive Tests","Diagnosis","Severity","Risk C-SSRS","Report"],
    childId:"Child Identification & Linkage",
    fileNo:"CIBS File No. (UID — must match eSMART-P/C)",
    childName:"Child's Full Name",dob:"Date of Birth",age:"Age (years)",gender:"Gender",
    gM:"Male",gF:"Female",gO:"Other",school:"School / Institution",grade:"Class / Grade",
    examiner:"Clinician / Examiner",date:"Assessment Date",setting:"Clinical Setting",
    settings:["Hospital OPD","Private Clinic","School","Community Centre","PHC","Residential","Research"],
    purpose:"Assessment Purpose",
    purposes:["Gold Standard Validation","Routine Clinical","Follow-up Reassessment","Research Study"],
    linkNote:"Enter the CIBS File No. used in eSMART-P and eSMART-C to link all three assessments in the CIBS Databank.",
    cogTitle:"Cognitive & IQ Assessment Battery",
    cogNote:"Select all instruments administered. Enter raw scores and standard/IQ scores obtained.",
    instruments:[
      {id:"MISIC",name:"MISIC — Malin's Intelligence Scale for Indian Children",fields:["FSIQ","VIQ","PIQ"]},
      {id:"WISC",name:"WISC-IV/V — Wechsler Intelligence Scale for Children",fields:["FSIQ","VCI","PRI","WMI","PSI"]},
      {id:"SB5",name:"Stanford-Binet 5 (SB5)",fields:["FSIQ","NVIQ","VIQ"]},
      {id:"RAVENS",name:"Raven's Progressive Matrices (SPM/CPM)",fields:["Raw Score","Percentile"]},
      {id:"CFIT",name:"Culture Fair Intelligence Test (CFIT) — Cattell",fields:["Scale","Raw Score","IQ"]},
      {id:"VABS",name:"Vineland Adaptive Behavior Scales",fields:["ABC","CommunicationDomain","DailyLiving","Socialization"]},
      {id:"CARS",name:"CARS — Childhood Autism Rating Scale",fields:["Total Score","Level"]},
      {id:"SNAP",name:"SNAP-IV — ADHD Rating Scale",fields:["Inattention","Hyperactivity","Total"]},
      {id:"CDI",name:"CDI — Children's Depression Inventory",fields:["Total Score","T-Score"]},
      {id:"SCARED",name:"SCARED — Anxiety Scale",fields:["Total Score","Panic","GAD","Separation"]},
      {id:"SDQ",name:"SDQ — Strengths & Difficulties Questionnaire",fields:["TotalDifficulties","Prosocial"]},
      {id:"OTHER",name:"Other Instrument (specify)",fields:["Instrument Name","Score1","Score2"]},
    ],
    diagTitle:"DSM-5 / ICD-11 Diagnostic Classification",
    diagNote:"Mark all applicable diagnoses confirmed through clinical interview and gold standard assessment.",
    domains:[
      {id:"IDD",label:"Intellectual Developmental Disorder",icd:"6A00",dsm:"Intellectual Disability"},
      {id:"ADHD",label:"Attention Deficit Hyperactivity Disorder",icd:"6A05",dsm:"ADHD"},
      {id:"ASD",label:"Autism Spectrum Disorder",icd:"6A02",dsm:"ASD"},
      {id:"SLD",label:"Specific Learning Disorder",icd:"6A03",dsm:"SLD"},
      {id:"MDD",label:"Major Depressive Disorder",icd:"6A70",dsm:"MDD"},
      {id:"ANX",label:"Anxiety Disorders",icd:"6B00",dsm:"GAD/Social/Separation Anxiety"},
      {id:"ODD",label:"Oppositional Defiant Disorder",icd:"6C90",dsm:"ODD"},
      {id:"CD",label:"Conduct Disorder",icd:"6C91",dsm:"Conduct Disorder"},
    ],
    sevTitle:"Domain Severity Ratings (Clinician)",
    sevNote:"Rate the clinical severity for each domain based on your full assessment. Must match DSM-5/ICD-11 criteria.",
    sevLabels:["None","Mild","Moderate","Severe"],
    riskTitle:"Risk Assessment (Columbia C-SSRS Analog)",
    riskNote:"For trained clinicians only. Conduct structured clinical interview before rating.",
    cssrs:[
      {id:"SI1",label:"Passive Suicidal Ideation",desc:"Wishes to be dead / not alive, but no plan or intent"},
      {id:"SI2",label:"Active Ideation without Plan",desc:"Thoughts of killing self without specific plan"},
      {id:"SI3",label:"Active Ideation with Plan",desc:"Thoughts of suicide with specific plan"},
      {id:"SI4",label:"Suicidal Behaviour",desc:"Any suicidal act or attempt in past 3 months"},
      {id:"SH1",label:"Non-Suicidal Self-Harm",desc:"Any self-injury without suicidal intent"},
      {id:"SU1",label:"Substance Use",desc:"Current alcohol/substance use of clinical significance"},
    ],
    cssrsOptions:["Not Present","Present — Monitor","Present — Clinically Significant","Present — URGENT"],
    impTitle:"Clinical Impression & Recommendations",
    impNote:"Document your integrated clinical formulation and treatment plan below.",
    impression:"Clinical Impression (integrated summary)",
    strengths:"Child / Family Strengths",
    treatment:"Treatment Plan",
    referrals:"Referrals Made",
    followUp:"Next Review Date",
    prognosis:"Prognosis",
    progOptions:["Good","Fair","Guarded","Poor"],
    reportTitle:"eSMART-V Clinical Validation Report",
    printPDF:"🖨 Print / PDF",
    downloadCSV:"📊 Download CSV (CIBS Databank format)",
    newAssessment:"🔄 New Assessment",
    disclaimer:"eSMART-V is a structured clinical documentation tool for trained clinicians. All diagnoses and ratings must meet full DSM-5/ICD-11 criteria based on comprehensive clinical assessment. CIBS Nagpur — Dr. Shailesh Pangaonkar, Director and Consultant Psychiatrist.",
    next:"Next →",back:"← Back",generate:"Generate Report →",
    selectAll:"Select all instruments used →",
    cibs_V:"CIBS-VALID",
  },
};

const SEV_COL = {
  "None":    {bg:"#f0fdf4",color:"#166534",border:"#86efac"},
  "Mild":    {bg:"#f7fee7",color:"#3f6212",border:"#bef264"},
  "Moderate":{bg:"#fffbeb",color:"#92400e",border:"#fcd34d"},
  "Severe":  {bg:"#fef2f2",color:"#991b1b",border:"#fca5a5"},
};

// ── EXPORT ──────────────────────────────────────────────────────────────────
function submitToDatabank_V(ci, cogScores, used, dx, sev, risk, imp, examiner) {
  if (!ci.fileNo) return false;
  const data = {
    source: "eSMART-V",
    fileNo: ci.fileNo,
    timestamp: new Date().toISOString(),
    examiner: examiner || ci.examiner || "",
    cogScores,
    diagnoses: dx,
    severity: sev,
    risk,
    impression: imp,
  };
  try {
    localStorage.setItem(`CIBS_PENDING_V_${ci.fileNo}`, JSON.stringify(data));
    return true;
  } catch(e) { return false; }
}

function makeVCSV(ci, cogScores, used, dx, sev, risk, imp) {
  const ts = new Date().toISOString();
  const instrCols = T.en.instruments.map(i=>i.id);
  const domCols   = T.en.domains.map(d=>d.id);
  const riskCols  = T.en.cssrs.map(r=>r.id);

  const hInstr = instrCols.flatMap(id=>{
    const inst=T.en.instruments.find(i=>i.id===id);
    return inst.fields.map(f=>`V_${id}_${f.replace(/\s/g,"_")}`);
  }).join(",");
  const hDx  = domCols.map(d=>`V_${d}_Diagnosed,V_${d}_DiagCode`).join(",");
  const hSev = domCols.map(d=>`V_${d}_ClinicianSev`).join(",");
  const hRisk= riskCols.map(r=>`V_${r}`).join(",");
  const header = `V_Timestamp,V_FileNo,V_ChildName,V_DOB,V_Age,V_Gender,V_School,V_Examiner,V_Date,V_Setting,V_Purpose,${hInstr},${hDx},${hSev},${hRisk},V_Impression,V_Strengths,V_Treatment,V_Referrals,V_FollowUp,V_Prognosis`;

  const rInstr = instrCols.flatMap(id=>{
    const inst=T.en.instruments.find(i=>i.id===id);
    return inst.fields.map(f=>used.includes(id)?(cogScores[`${id}_${f.replace(/\s/g,"_")}`]||""):"");
  }).join(",");
  const rDx  = domCols.map(d=>`${dx[d]?.confirmed?"YES":"NO"},"${dx[d]?.code||""}"`).join(",");
  const rSev = domCols.map(d=>sev[d]||"None").join(",");
  const rRisk= riskCols.map(r=>risk[r]||"Not Present").join(",");
  const row  = [ts,ci.fileNo,ci.name,ci.dob,ci.age,ci.gender,ci.school,ci.examiner,ci.date,ci.setting,ci.purpose,rInstr,rDx,rSev,rRisk,`"${imp.impression||""}"`,`"${imp.strengths||""}"`,`"${imp.treatment||""}"`,`"${imp.referrals||""}"`,imp.followUp||"",imp.prognosis||""].join(",");

  const blob=new Blob([header+"\n"+row],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download=`eSMART_V_${ci.fileNo||"rec"}_${ts.slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── PROGRESS BAR ─────────────────────────────────────────────────────────────
function StepBar({step}) {
  const steps=T.en.steps;
  return (
    <div style={{display:"flex",alignItems:"center",padding:"0 20px 18px"}}>
      {steps.map((lbl,i)=>{
        const n=i+1,done=step>n,active=step===n;
        return <div key={i} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:"none"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
              background:done?"#0d9488":active?"#fff":"rgba(255,255,255,0.12)",
              border:active?"2px solid #fff":done?"none":"2px solid rgba(255,255,255,0.22)",
              color:done?"#fff":active?"#0d5c6e":"rgba(255,255,255,0.4)",fontWeight:700,fontSize:11}}>
              {done?"✓":n}
            </div>
            <span style={{fontSize:8,color:active?"#fff":done?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.35)",fontWeight:active?700:400,whiteSpace:"nowrap"}}>{lbl}</span>
          </div>
          {i<steps.length-1&&<div style={{flex:1,height:2,background:done?"#0d9488":"rgba(255,255,255,0.16)",margin:"0 5px",marginBottom:18}}/>}
        </div>;
      })}
    </div>
  );
}

// ── HEADER ───────────────────────────────────────────────────────────────────
function Header({step}) {
  return (
    <div style={{background:"linear-gradient(135deg,#1e3a5f 0%,#0d5c6e 55%,#1e5f7a 100%)",padding:"18px 22px 0",boxShadow:"0 4px 20px rgba(0,0,0,0.25)"}}>
      <div style={{maxWidth:880,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:46,height:46,borderRadius:10,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="30" height="30" viewBox="0 0 30 30">
              <circle cx="15" cy="9" r="3.8" fill="#5DCAA5"/>
              <circle cx="8" cy="16" r="2.8" fill="#9FE1CB"/>
              <circle cx="22" cy="16" r="2.8" fill="#9FE1CB"/>
              <circle cx="11" cy="24" r="3.2" fill="#1D9E75"/>
              <circle cx="19" cy="24" r="3.2" fill="#1D9E75"/>
              <line x1="15" y1="12" x2="8" y2="16" stroke="#9FE1CB" strokeWidth="1.1" opacity="0.9"/>
              <line x1="15" y1="12" x2="22" y2="16" stroke="#9FE1CB" strokeWidth="1.1" opacity="0.9"/>
              <line x1="8" y1="18" x2="11" y2="24" stroke="#5DCAA5" strokeWidth="1.1" opacity="0.8"/>
              <line x1="22" y1="18" x2="19" y2="24" stroke="#5DCAA5" strokeWidth="1.1" opacity="0.8"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <h1 style={{margin:0,fontSize:20,fontWeight:900,color:"#fff"}}>eSMART-V</h1>
              <span style={{padding:"2px 9px",borderRadius:6,background:"rgba(255,255,255,0.18)",fontSize:10,fontWeight:700,color:"#9FE1CB",letterSpacing:"0.08em"}}>CIBS-VALID</span>
            </div>
            <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.65)"}}>Clinician Validation Module · CIBS Nagpur</p>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",textAlign:"right",lineHeight:1.7}}>
            <div style={{fontWeight:700,color:"rgba(255,255,255,0.8)"}}>Dr. Shailesh Pangaonkar</div>
            <div>Director and Consultant Psychiatrist</div>
            <div>MBBS, DPM, DNB, MSc BA</div>
          </div>
        </div>
        <StepBar step={step}/>
      </div>
    </div>
  );
}

function Fld({label,value,onChange,type="text",options=null,full=false,required=false}) {
  const inp=options
    ? <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"8px 11px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1e293b",background:"#fff",outline:"none"}}>
        <option value="">Select...</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    : <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"8px 11px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1e293b",outline:"none",boxSizing:"border-box"}}/>;
  return (
    <div style={{gridColumn:full?"1/-1":"auto"}}>
      <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>
        {label}{required&&<span style={{color:"#dc2626"}}> *</span>}
      </label>
      {inp}
    </div>
  );
}

function Btn({label,onClick,disabled=false,color="#0d5c6e"}) {
  return <button onClick={onClick} disabled={disabled}
    style={{padding:"11px 26px",borderRadius:9,background:disabled?"#e2e8f0":color,color:disabled?"#94a3b8":"#fff",border:"none",fontSize:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer"}}>
    {label}
  </button>;
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [step, setStep] = useState(1);
  const [dbSubmitted_V, setDbSubmitted_V] = useState(false);
  const [ci, setCi] = useState({name:"",fileNo:getURLParam("reg")||"",dob:"",age:"",gender:"",school:"",grade:"",examiner:getURLParam("assessor")||"",date:new Date().toISOString().slice(0,10),setting:"",purpose:""});
  const [used, setUsed] = useState([]);
  const [cogScores, setCogScores] = useState({});
  const [dx, setDx] = useState({});
  const [sev, setSev] = useState({});
  const [risk, setRisk] = useState({});
  const [imp, setImp] = useState({impression:"",strengths:"",treatment:"",referrals:"",followUp:"",prognosis:""});

  const updCi  = (k,v) => setCi(x=>({...x,[k]:v}));
  const updCog = (k,v) => setCogScores(x=>({...x,[k]:v}));
  const updDx  = (d,k,v) => setDx(x=>({...x,[d]:{...(x[d]||{}), [k]:v}}));
  const updSev = (d,v) => setSev(x=>({...x,[d]:v}));
  const updRisk = (k,v) => setRisk(x=>({...x,[k]:v}));
  const updImp = (k,v) => setImp(x=>({...x,[k]:v}));
  const toggleUsed = (id) => setUsed(u=>u.includes(id)?u.filter(i=>i!==id):[...u,id]);

  const today = new Date().toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"});
  const reportId = "V-"+Date.now().toString(36).toUpperCase().slice(-8);

  const wrap = (content) => (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh"}}>
      <Header step={step}/>
      <div style={{maxWidth:880,margin:"0 auto",padding:"22px 14px"}}>
        <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:"1px solid #e2e8f0"}}>
          {content}
        </div>
      </div>
    </div>
  );

  // ── STEP 1: CHILD ID ────────────────────────────────────────────────────
  if (step===1) return wrap(<>
    <div style={{background:"#1e3a5f",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,marginLeft:-24,marginRight:-24}}>Step 1 — {T.en.childId}</div>
    <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#1e40af",lineHeight:1.7}}>
      🔗 <strong>Linkage Note:</strong> {T.en.linkNote}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
      <Fld label="CIBS File No. (UID) *" value={ci.fileNo} onChange={v=>updCi("fileNo",v)} full required/>
      <Fld label="Child's Full Name" value={ci.name} onChange={v=>updCi("name",v)}/>
      <Fld label="Date of Birth" value={ci.dob} onChange={v=>updCi("dob",v)} type="date"/>
      <Fld label="Age (years)" value={ci.age} onChange={v=>updCi("age",v)} type="number"/>
      <Fld label="Gender" value={ci.gender} onChange={v=>updCi("gender",v)} options={["Male","Female","Other"]}/>
      <Fld label="School / Institution" value={ci.school} onChange={v=>updCi("school",v)}/>
      <Fld label="Class / Grade" value={ci.grade} onChange={v=>updCi("grade",v)}/>
      <Fld label="Clinician / Examiner" value={ci.examiner} onChange={v=>updCi("examiner",v)}/>
      <Fld label="Assessment Date" value={ci.date} onChange={v=>updCi("date",v)} type="date"/>
      <Fld label="Clinical Setting" value={ci.setting} onChange={v=>updCi("setting",v)} options={T.en.settings}/>
      <Fld label="Assessment Purpose" value={ci.purpose} onChange={v=>updCi("purpose",v)} options={T.en.purposes} full/>
    </div>
    <div style={{display:"flex",justifyContent:"flex-end"}}>
      <Btn label="Next: Cognitive Tests →" onClick={()=>setStep(2)} disabled={!ci.fileNo}/>
    </div>
  </>);

  // ── STEP 2: COGNITIVE TESTS ─────────────────────────────────────────────
  if (step===2) return wrap(<>
    <div style={{background:"#0d5c6e",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,marginLeft:-24,marginRight:-24}}>Step 2 — {T.en.cogTitle}</div>
    <p style={{fontSize:12,color:"#6b7280",marginBottom:14}}>{T.en.cogNote}</p>
    {T.en.instruments.map(inst=>{
      const isUsed=used.includes(inst.id);
      return (
        <div key={inst.id} style={{border:`1.5px solid ${isUsed?"#0d9488":"#e2e8f0"}`,borderRadius:10,padding:"12px 14px",marginBottom:10,background:isUsed?"#f0fdfa":"#fff",transition:"all 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:isUsed?10:0}}>
            <input type="checkbox" checked={isUsed} onChange={()=>toggleUsed(inst.id)} style={{width:16,height:16,cursor:"pointer",accentColor:"#0d9488"}}/>
            <span style={{fontSize:13,fontWeight:isUsed?700:500,color:isUsed?"#0d5c6e":"#374151"}}>{inst.name}</span>
          </div>
          {isUsed&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,paddingLeft:26}}>
              {inst.fields.map(f=>(
                <div key={f}>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>{f}</label>
                  <input value={cogScores[`${inst.id}_${f.replace(/\s/g,"_")}`]||""}
                    onChange={e=>updCog(`${inst.id}_${f.replace(/\s/g,"_")}`,e.target.value)}
                    placeholder={`Enter ${f}`}
                    style={{width:"100%",padding:"7px 10px",border:"1.5px solid #bfdbfe",borderRadius:7,fontSize:13,color:"#1e293b",outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })}
    <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
      <Btn label="← Back" onClick={()=>setStep(1)} color="#64748b"/>
      <Btn label="Next: Diagnosis →" onClick={()=>setStep(3)}/>
    </div>
  </>);

  // ── STEP 3: DIAGNOSIS ───────────────────────────────────────────────────
  if (step===3) return wrap(<>
    <div style={{background:"#1e5f2e",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,marginLeft:-24,marginRight:-24}}>Step 3 — {T.en.diagTitle}</div>
    <p style={{fontSize:12,color:"#6b7280",marginBottom:14}}>{T.en.diagNote}</p>
    {T.en.domains.map(d=>{
      const conf=dx[d.id]?.confirmed||false;
      return (
        <div key={d.id} style={{border:`1.5px solid ${conf?"#16a34a":"#e2e8f0"}`,borderRadius:10,padding:"12px 14px",marginBottom:8,background:conf?"#f0fdf4":"#fff",transition:"all 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <input type="checkbox" checked={conf} onChange={e=>updDx(d.id,"confirmed",e.target.checked)} style={{width:16,height:16,cursor:"pointer",accentColor:"#16a34a"}}/>
            <div style={{flex:1}}>
              <span style={{fontSize:13,fontWeight:conf?700:500,color:conf?"#15803d":"#374151"}}>{d.label}</span>
              <span style={{fontSize:11,color:"#94a3b8",marginLeft:8}}>ICD-11: {d.icd} · DSM-5: {d.dsm}</span>
            </div>
            {conf&&<>
              <div>
                <label style={{fontSize:10,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>Primary Code</label>
                <input value={dx[d.id]?.code||""} onChange={e=>updDx(d.id,"code",e.target.value)}
                  placeholder="e.g. F70 / 6A00"
                  style={{padding:"5px 9px",border:"1.5px solid #86efac",borderRadius:6,fontSize:12,width:130,outline:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>Specifier</label>
                <input value={dx[d.id]?.spec||""} onChange={e=>updDx(d.id,"spec",e.target.value)}
                  placeholder="Mild/Mod/Severe"
                  style={{padding:"5px 9px",border:"1.5px solid #86efac",borderRadius:6,fontSize:12,width:120,outline:"none"}}/>
              </div>
            </>}
          </div>
        </div>
      );
    })}
    <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
      <Btn label="← Back" onClick={()=>setStep(2)} color="#64748b"/>
      <Btn label="Next: Severity Ratings →" onClick={()=>setStep(4)}/>
    </div>
  </>);

  // ── STEP 4: SEVERITY ────────────────────────────────────────────────────
  if (step===4) return wrap(<>
    <div style={{background:"#78350f",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,marginLeft:-24,marginRight:-24}}>Step 4 — {T.en.sevTitle}</div>
    <p style={{fontSize:12,color:"#6b7280",marginBottom:6}}>{T.en.sevNote}</p>
    <div style={{display:"grid",gridTemplateColumns:"2fr repeat(4,1fr)",gap:0,border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:14}}>
      <div style={{background:"#f8fafc",padding:"8px 12px",fontSize:11,fontWeight:700,color:"#1e3a5f",borderBottom:"1px solid #e2e8f0"}}>Domain</div>
      {T.en.sevLabels.map((l,i)=>{
        const cols=Object.values(SEV_COL);
        return <div key={l} style={{background:cols[i].bg,padding:"8px 8px",fontSize:11,fontWeight:700,color:cols[i].color,borderBottom:`1px solid ${cols[i].border}`,textAlign:"center"}}>{l}</div>;
      })}
      {T.en.domains.map((d,idx)=>{
        const current=sev[d.id]||"None";
        return <>
          <div key={`l${d.id}`} style={{padding:"10px 12px",fontSize:13,color:"#374151",fontWeight:500,borderTop:idx>0?"1px solid #f1f5f9":"none",background:idx%2===0?"#fff":"#fafafa"}}>{d.label}</div>
          {T.en.sevLabels.map(sv=>{
            const cs=SEV_COL[sv];
            const sel=current===sv;
            return <div key={`${d.id}${sv}`} style={{display:"flex",alignItems:"center",justifyContent:"center",borderTop:idx>0?"1px solid #f1f5f9":"none",background:sel?cs.bg:idx%2===0?"#fff":"#fafafa"}}>
              <button onClick={()=>updSev(d.id,sv)} style={{
                width:20,height:20,borderRadius:"50%",border:`2px solid ${sel?cs.color:"#e2e8f0"}`,
                background:sel?cs.color:"transparent",cursor:"pointer",transition:"all 0.15s"
              }}/>
            </div>;
          })}
        </>;
      })}
    </div>
    <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:8,padding:"10px 13px",fontSize:12,color:"#92400e",marginBottom:14}}>
      ⚕️ <strong>Note:</strong> These severity ratings should reflect your clinical assessment and gold standard test results. They will be compared with eSMART-P scores for convergent validity analysis.
    </div>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <Btn label="← Back" onClick={()=>setStep(3)} color="#64748b"/>
      <Btn label="Next: Risk Assessment →" onClick={()=>setStep(5)}/>
    </div>
  </>);

  // ── STEP 5: C-SSRS ─────────────────────────────────────────────────────
  if (step===5) return wrap(<>
    <div style={{background:"#7c1d1d",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,marginLeft:-24,marginRight:-24}}>Step 5 — {T.en.riskTitle}</div>
    <div style={{background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:12,color:"#991b1b",lineHeight:1.7}}>
      ⚠️ {T.en.riskNote}
    </div>
    {T.en.cssrs.map(q=>(
      <div key={q.id} style={{border:"1.5px solid #e2e8f0",borderRadius:10,padding:"13px 14px",marginBottom:10,background:"#fff"}}>
        <p style={{fontSize:13,fontWeight:700,color:"#1e293b",margin:"0 0 4px"}}>{q.label}</p>
        <p style={{fontSize:11,color:"#6b7280",margin:"0 0 10px",fontStyle:"italic"}}>{q.desc}</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {T.en.cssrsOptions.map(opt=>{
            const current=risk[q.id]||"Not Present";
            const col=opt==="Not Present"?"#16a34a":opt==="Present — Monitor"?"#d97706":opt==="Present — Clinically Significant"?"#ea580c":"#dc2626";
            const bg=opt==="Not Present"?"#f0fdf4":opt==="Present — Monitor"?"#fffbeb":opt==="Present — Clinically Significant"?"#fff7ed":"#fef2f2";
            const sel=current===opt;
            return <button key={opt} onClick={()=>updRisk(q.id,opt)}
              style={{padding:"6px 12px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",
                background:sel?bg:"#f8fafc",border:`1.5px solid ${sel?col:"#e2e8f0"}`,color:sel?col:"#94a3b8",transition:"all 0.15s"}}>
              {opt}
            </button>;
          })}
        </div>
      </div>
    ))}
    <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
      <Btn label="← Back" onClick={()=>setStep(4)} color="#64748b"/>
      <Btn label="Next: Clinical Impression →" onClick={()=>setStep(6)}/>
    </div>
  </>);

  // ── STEP 6: IMPRESSION + REPORT ─────────────────────────────────────────
  if (step===6) {
    const confirmed=T.en.domains.filter(d=>dx[d.id]?.confirmed);
    const anyUrgent=Object.values(risk).some(v=>v==="Present — URGENT");
    return wrap(<>
      <style>{`@media print{body{background:white!important}button{display:none!important}}`}</style>
      <div style={{background:"#0d5c6e",color:"#fff",padding:"8px 14px",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:16,marginLeft:-24,marginRight:-24}}>Step 6 — {T.en.impTitle} + Report</div>

      {anyUrgent&&<div style={{background:"#fef2f2",border:"2px solid #f43f5e",borderRadius:10,padding:"12px 14px",marginBottom:14,display:"flex",gap:10}}>
        <span style={{fontSize:22,flexShrink:0}}>🚨</span>
        <div><div style={{fontWeight:800,color:"#be123c",marginBottom:4}}>URGENT RISK FLAG</div>
        <p style={{fontSize:13,color:"#9f1239",margin:0}}>One or more C-SSRS indicators rated URGENT. Immediate specialist referral and safety planning required.</p></div>
      </div>}

      {/* Clinical Impression Fields */}
      {[
        ["Clinical Impression (integrated summary)","impression","Enter your integrated clinical formulation..."],
        ["Child / Family Strengths","strengths","Describe identified strengths and protective factors..."],
        ["Treatment Plan","treatment","Detail recommended interventions, therapies, and supports..."],
        ["Referrals Made","referrals","List all referrals made at this assessment..."],
      ].map(([lbl,key,ph])=>(
        <div key={key} style={{marginBottom:12}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:5}}>{lbl}</label>
          <textarea value={imp[key]} onChange={e=>updImp(key,e.target.value)} placeholder={ph} rows={3}
            style={{width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1e293b",outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box"}}/>
        </div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:5}}>Next Review Date</label>
          <input type="date" value={imp.followUp} onChange={e=>updImp("followUp",e.target.value)}
            style={{width:"100%",padding:"8px 11px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1e293b",outline:"none"}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:5}}>Prognosis</label>
          <select value={imp.prognosis} onChange={e=>updImp("prognosis",e.target.value)}
            style={{width:"100%",padding:"8px 11px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1e293b",background:"#fff",outline:"none"}}>
            <option value="">Select...</option>
            {T.en.progOptions.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* ── REPORT PREVIEW ── */}
      <div id="report-root" style={{border:"2px solid #1e3a5f",borderRadius:12,overflow:"hidden",marginBottom:16}}>
        {/* Header */}
        <div style={{background:"#1e3a5f",color:"#fff",padding:"16px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"#93c5fd",marginBottom:4}}>eSMART-V · CIBS-VALID · Clinician Validation Module</div>
              <div style={{fontSize:18,fontWeight:700,fontFamily:"Georgia,serif"}}>Clinical Validation Report</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>Central Institute of Behavioural Sciences, Nagpur</div>
            </div>
            <div style={{textAlign:"right",fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.9}}>
              <div style={{fontFamily:"monospace",fontSize:12,color:"#fff",fontWeight:700}}>Report ID: {reportId}</div>
              <div>Assessment Date: {today}</div>
              <div>CIBS File No.: {ci.fileNo||"—"}</div>
            </div>
          </div>
          {/* Child strip */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {[["Name",ci.name||"—"],["Age",`${ci.age||"—"} yrs`],["Gender",ci.gender||"—"],["School",ci.school||"—"],["Examiner",ci.examiner||"—"],["Setting",ci.setting||"—"],["Date",ci.date],["Purpose",ci.purpose||"—"]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.12)",borderRadius:6,padding:"6px 9px"}}>
                <div style={{fontSize:8,opacity:0.65}}>{l}</div>
                <div style={{fontSize:11,fontWeight:700}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:"16px 20px"}}>
          {/* Cognitive tests */}
          {used.length>0&&<>
            <div style={{fontWeight:700,fontSize:11,color:"#1e3a5f",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,paddingBottom:5,borderBottom:"1px solid #e2e8f0"}}>Cognitive & IQ Assessment Results</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:14}}>
              {used.map(id=>{
                const inst=T.en.instruments.find(i=>i.id===id);
                return <div key={id} style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px",border:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#1e3a5f",marginBottom:5}}>{inst.id==="OTHER"?(cogScores["OTHER_Instrument_Name"]||"Other"):inst.id}</div>
                  {inst.fields.map(f=>{
                    const val=cogScores[`${id}_${f.replace(/\s/g,"_")}`];
                    if(!val) return null;
                    return <div key={f} style={{fontSize:12,color:"#374151",marginBottom:2}}><span style={{color:"#6b7280"}}>{f}:</span> <strong>{val}</strong></div>;
                  })}
                </div>;
              })}
            </div>
          </>}

          {/* Diagnoses */}
          {confirmed.length>0&&<>
            <div style={{fontWeight:700,fontSize:11,color:"#1e5f2e",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,paddingBottom:5,borderBottom:"1px solid #e2e8f0"}}>Confirmed DSM-5 / ICD-11 Diagnoses</div>
            <div style={{marginBottom:14}}>
              {confirmed.map(d=>(
                <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#1e5f2e",flexShrink:0}}/>
                  <span style={{fontSize:13,color:"#1e293b",fontWeight:600,flex:1}}>{d.label}</span>
                  <span style={{fontSize:11,color:"#94a3b8",marginRight:8}}>ICD-11: {dx[d.id]?.code||d.icd}</span>
                  {dx[d.id]?.spec&&<span style={{padding:"2px 8px",borderRadius:8,fontSize:11,fontWeight:700,background:"#eff6ff",color:"#1e40af"}}>{dx[d.id].spec}</span>}
                </div>
              ))}
              {confirmed.length===0&&<p style={{fontSize:12,color:"#6b7280",fontStyle:"italic"}}>No diagnoses confirmed at this assessment.</p>}
            </div>
          </>}

          {/* Severity comparison grid */}
          <div style={{fontWeight:700,fontSize:11,color:"#78350f",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,paddingBottom:5,borderBottom:"1px solid #e2e8f0"}}>Clinician Severity Ratings vs eSMART-P Screening Flags</div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8,marginBottom:14}}>
            {T.en.domains.map(d=>{
              const cs=SEV_COL[sev[d.id]||"None"];
              const isDx=dx[d.id]?.confirmed;
              return <div key={d.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:7,background:isDx?"#f0fdf4":"#f8fafc",border:`1px solid ${isDx?"#86efac":"#e2e8f0"}`}}>
                <span style={{fontSize:12,flex:1,color:"#374151",fontWeight:isDx?600:400}}>{d.label}</span>
                <span style={{padding:"2px 9px",borderRadius:10,fontSize:11,fontWeight:700,background:cs.bg,color:cs.color,border:`1px solid ${cs.border}`}}>{sev[d.id]||"None"}</span>
                {isDx&&<span style={{fontSize:10,color:"#15803d",fontWeight:700}}>✓ Dx</span>}
              </div>;
            })}
          </div>

          {/* Risk summary */}
          {Object.values(risk).some(v=>v!=="Not Present"&&v)&&<>
            <div style={{fontWeight:700,fontSize:11,color:"#7c1d1d",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,paddingBottom:5,borderBottom:"1px solid #e2e8f0"}}>Risk Assessment (C-SSRS Analog)</div>
            <div style={{marginBottom:14}}>
              {T.en.cssrs.filter(q=>risk[q.id]&&risk[q.id]!=="Not Present").map(q=>{
                const col=risk[q.id]==="Present — URGENT"?"#dc2626":risk[q.id]==="Present — Clinically Significant"?"#ea580c":"#d97706";
                return <div key={q.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <span style={{fontSize:12,color:"#374151"}}>{q.label}</span>
                  <span style={{fontSize:11,fontWeight:700,color:col}}>{risk[q.id]}</span>
                </div>;
              })}
            </div>
          </>}

          {/* Clinical impression */}
          {imp.impression&&<>
            <div style={{fontWeight:700,fontSize:11,color:"#1e3a5f",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,paddingBottom:5,borderBottom:"1px solid #e2e8f0"}}>Clinical Impression</div>
            <p style={{fontSize:13,color:"#1f2937",lineHeight:1.9,fontFamily:"Georgia,serif",marginBottom:12}}>{imp.impression}</p>
          </>}
          {imp.treatment&&<>
            <div style={{fontWeight:700,fontSize:11,color:"#1e5f2e",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,paddingBottom:5,borderBottom:"1px solid #e2e8f0"}}>Treatment Plan</div>
            <p style={{fontSize:13,color:"#1f2937",lineHeight:1.9,fontFamily:"Georgia,serif",marginBottom:12}}>{imp.treatment}</p>
          </>}

          {/* Signature */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,borderTop:"1.5px solid #1e3a5f",paddingTop:14,marginTop:8}}>
            {["Evaluating Clinician","Supervising Clinician (if applicable)"].map(l=>(
              <div key={l}>
                <div style={{fontSize:10,color:"#6b7280",marginBottom:12}}>{l}</div>
                <div style={{borderBottom:"1px dotted #cbd5e1",height:28,marginBottom:6}}/>
                <div style={{fontSize:9,color:"#9ca3af"}}>Name & Designation: _______________________</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,borderTop:"1px solid #e5e7eb",paddingTop:8,display:"flex",justifyContent:"space-between",fontSize:9,color:"#9ca3af"}}>
            <span>eSMART-V · CIBS-VALID · {reportId} · {today}</span>
            <span>CONFIDENTIAL — For qualified clinician use only</span>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
        <button onClick={()=>window.print()} style={{padding:"10px 20px",borderRadius:8,background:"#1e3a5f",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>🖨 Print / Save PDF</button>
        <button onClick={()=>{ makeVCSV(ci,cogScores,used,dx,sev,risk,imp); }} style={{padding:"10px 20px",borderRadius:8,background:"#16a34a",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>📊 Download CSV</button>
        <button onClick={()=>{
          const fileNo=(ci.fileNo||autoFileNo()).trim();
          const confirmedDx=T.en.domains.filter(d=>dx[d.id]?.confirmed).map(d=>d.label).join("; ");
          const fsiq=cogScores["MISIC_FSIQ"]||cogScores["WISC_FSIQ"]||cogScores["SB5_FSIQ"]||"";
          if(APPS_SCRIPT_URL&&!APPS_SCRIPT_URL.startsWith("PASTE_")){
            fetch(APPS_SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},
              body:JSON.stringify({
                tool:"eSMART-V",timestamp:new Date().toISOString(),mode:"clinician",
                fileNo,uid:"",name:ci.examiner||"",dob:"",age:"",gender:"",
                mobile:"",education:"",occupation:"",referral:ci.purpose||"",
                assessor:ci.examiner||"",notes:"",
                child_name:ci.name||"",child_dob:ci.dob||"",child_age:ci.age||"",
                child_gender:ci.gender||"",school:ci.school||"",grade:ci.grade||"",
                clinician_name:ci.examiner||"",validation_status:"Completed",
                clinical_iq_estimate:fsiq,
                diagnosis_provisional:confirmedDx,
                recommendation:imp.treatment||"",
                follow_up_date:imp.followUp||"",
                vsms_total:cogScores["VABS_ABC"]||"",vsms_sq:"",vsms_ma:"",
                conners_total:cogScores["SNAP_Total"]||"",
                conners_inattention:cogScores["SNAP_Inattention"]||"",
                conners_hyperactivity:cogScores["SNAP_Hyperactivity"]||"",
              })
            }).catch(()=>{});
          }
          setDbSubmitted_V(true);
        }} style={{padding:"10px 20px",borderRadius:8,background:"#6D28D9",color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>☁️ Save to CIBS Databank</button>
        <button onClick={()=>{setStep(1);setCi({name:"",fileNo:"",dob:"",age:"",gender:"",school:"",grade:"",examiner:"",date:new Date().toISOString().slice(0,10),setting:"",purpose:""});setUsed([]);setCogScores({});setDx({});setSev({});setRisk({});setImp({impression:"",strengths:"",treatment:"",referrals:"",followUp:"",prognosis:""}); }} style={{padding:"10px 18px",borderRadius:8,background:"#f1f5f9",color:"#475569",border:"none",fontSize:13,fontWeight:600,cursor:"pointer"}}>🔄 New Assessment</button>
        {dbSubmitted_V&&<div style={{padding:"10px 14px",borderRadius:8,background:"#f0fdf4",border:"1px solid #86efac",fontSize:12,fontWeight:700,color:"#15803d"}}>✅ Saved to CIBS Databank (File: {ci.fileNo})</div>}
      </div>

      <div style={{background:"#fff7ed",border:"1.5px solid #fed7aa",borderRadius:10,padding:"12px 16px",fontSize:12,color:"#c2410c",lineHeight:1.7}}>
        ⚖️ {T.en.disclaimer}
      </div>
      <div style={{display:"flex",justifyContent:"flex-start",marginTop:14}}>
        <Btn label="← Back: Risk Assessment" onClick={()=>setStep(5)} color="#64748b"/>
      </div>
    </>);
  }

  return null;
}
