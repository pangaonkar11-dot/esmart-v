import React, { useState, useEffect, useRef, useCallback } from "react";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  eSMART-V  ·  Clinical Workstation v2                                   ║
// ║  Central Institute of Behavioural Sciences, Nagpur                      ║
// ║  Dr. Shailesh V. Pangaonkar — Director & Consultant Psychiatrist        ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYw3DNfteGUApE97zpPScPgVCrHjNXTU-kuwabwQNviLmsaW4gSEd6hqY1FoTJsxu4HQ/exec";
const TOKEN = "CIBS2026";
const getParam = k => { try { return new URLSearchParams(window.location.search).get(k)||""; } catch { return ""; } };
const autoFileNo = () => { const yy=String(new Date().getFullYear()).slice(-2); return `CIBS-${yy}-${String(Math.floor(Math.random()*9000)+1000)}`; };

// ── DSM-5 / ICD-11 Diagnosis List ─────────────────────────────────────────
const DIAGNOSES = {
  "Neurodevelopmental": [
    "ADHD — Combined Presentation",
    "ADHD — Predominantly Inattentive",
    "ADHD — Predominantly Hyperactive-Impulsive",
    "Autism Spectrum Disorder — Level 1",
    "Autism Spectrum Disorder — Level 2",
    "Autism Spectrum Disorder — Level 3",
    "Intellectual Disability — Mild",
    "Intellectual Disability — Moderate",
    "Intellectual Disability — Severe",
    "Intellectual Disability — Profound",
    "Global Developmental Delay",
    "Specific Learning Disorder — Reading",
    "Specific Learning Disorder — Writing",
    "Specific Learning Disorder — Mathematics",
    "Developmental Coordination Disorder",
    "Language Disorder",
    "Speech Sound Disorder",
    "Childhood-Onset Fluency Disorder (Stuttering)",
    "Tic Disorder — Provisional",
    "Tourette's Disorder",
    "Persistent Motor/Vocal Tic Disorder",
  ],
  "Anxiety & OCD": [
    "Separation Anxiety Disorder",
    "Selective Mutism",
    "Specific Phobia",
    "Social Anxiety Disorder",
    "Generalised Anxiety Disorder",
    "Panic Disorder",
    "Agoraphobia",
    "OCD",
    "Body Dysmorphic Disorder",
    "Trichotillomania",
    "Excoriation Disorder",
  ],
  "Trauma & Stress": [
    "PTSD",
    "Acute Stress Disorder",
    "Adjustment Disorder",
    "Reactive Attachment Disorder",
    "Disinhibited Social Engagement Disorder",
  ],
  "Mood": [
    "Major Depressive Disorder — Single Episode",
    "Major Depressive Disorder — Recurrent",
    "Persistent Depressive Disorder (Dysthymia)",
    "Disruptive Mood Dysregulation Disorder",
    "Bipolar I Disorder",
    "Bipolar II Disorder",
    "Cyclothymic Disorder",
  ],
  "Behavioural": [
    "Oppositional Defiant Disorder",
    "Conduct Disorder — Childhood Onset",
    "Conduct Disorder — Adolescent Onset",
    "Intermittent Explosive Disorder",
    "Pyromania",
    "Kleptomania",
  ],
  "Psychotic": [
    "Schizophrenia — Early Onset",
    "Schizoaffective Disorder",
    "Brief Psychotic Disorder",
    "Schizophreniform Disorder",
    "Delusional Disorder",
  ],
  "Neurocognitive & Medical": [
    "Mild Neurocognitive Disorder",
    "Epilepsy / Seizure Disorder",
    "Cerebral Palsy",
    "Traumatic Brain Injury",
    "Perinatal Complication",
    "Fetal Alcohol Spectrum Disorder",
    "Down Syndrome",
    "Fragile X Syndrome",
    "Rett Syndrome",
    "Tuberous Sclerosis",
    "Neurofibromatosis",
  ],
  "Elimination & Sleep": [
    "Enuresis — Nocturnal",
    "Enuresis — Diurnal",
    "Encopresis",
    "Insomnia Disorder",
    "Hypersomnia Disorder",
    "Nightmare Disorder",
    "Non-REM Sleep Arousal Disorder",
    "Restless Leg Syndrome",
  ],
  "Eating & Other": [
    "Avoidant/Restrictive Food Intake Disorder",
    "Anorexia Nervosa",
    "Bulimia Nervosa",
    "Binge Eating Disorder",
    "Pica",
    "Rumination Disorder",
    "Substance Use Disorder",
    "Internet Gaming Disorder",
    "Unspecified — Awaiting Further Assessment",
  ],
};

// ── Complaints mapped to diagnoses ─────────────────────────────────────────
const DX_COMPLAINTS = {
  "ADHD": [
    "Poor attention span","Easily distracted","Does not complete tasks",
    "Forgetfulness","Loses things frequently","Difficulty following instructions",
    "Hyperactivity — cannot sit still","Impulsivity — acts without thinking",
    "Talks excessively","Interrupts others","Difficulty waiting turn",
    "Academic underperformance","Disorganised","Daydreaming",
  ],
  "ASD": [
    "Delayed speech and language","Limited eye contact","Social withdrawal",
    "Restricted interests","Repetitive behaviours","Sensory sensitivities",
    "Difficulty with change in routine","Difficulty making friends",
    "Unusual play patterns","Hand flapping or rocking","Echolalia",
    "Literal interpretation of language","Difficulty understanding emotions",
  ],
  "Intellectual Disability": [
    "Delayed developmental milestones","Delayed speech","Poor academic progress",
    "Difficulty with self-care","Limited adaptive functioning",
    "Difficulty understanding abstract concepts","Poor memory",
    "Need for constant supervision","Limited problem-solving skills",
  ],
  "Specific Learning Disorder": [
    "Difficulty reading (dyslexia)","Letter/word reversals","Poor spelling",
    "Difficulty with mathematics (dyscalculia)","Poor handwriting (dysgraphia)",
    "Slow reading speed","Difficulty understanding written text",
    "Avoidance of reading/writing tasks","Academic failure despite normal intelligence",
  ],
  "Anxiety": [
    "Excessive worry","Fears and phobias","School refusal",
    "Separation anxiety from parents","Somatic complaints (headache/stomach ache)",
    "Sleep difficulties","Restlessness","Irritability","Avoidance behaviour",
    "Panic attacks","Social avoidance","Selective mutism",
  ],
  "MDD": [
    "Persistent sadness","Loss of interest in activities","Fatigue",
    "Sleep disturbance","Appetite changes","Poor concentration",
    "Feelings of worthlessness","Crying spells","Social withdrawal",
    "Irritability","Suicidal ideation","Self-harm",
  ],
  "ODD": [
    "Defiant behaviour","Argues with authority figures","Deliberately annoys others",
    "Blames others for own mistakes","Angry outbursts","Spiteful behaviour",
    "Loses temper frequently","Touchy and easily annoyed",
  ],
  "Conduct Disorder": [
    "Aggression towards people or animals","Destruction of property",
    "Deceitfulness or theft","Serious rule violations","Bullying",
    "Fighting","Weapon use","Cruelty to animals","Truancy","Running away",
  ],
  "Epilepsy": [
    "Seizure episodes","Staring spells","Jerking movements",
    "Loss of consciousness","Post-ictal confusion","Developmental regression",
    "Cognitive slowness","Medication-related side effects",
  ],
  "General": [
    "Behavioural problems at home","Behavioural problems at school",
    "Poor peer relationships","Family conflict","Parental concern",
    "Teacher complaint","Poor self-esteem","Emotional dysregulation",
    "Sleep problems","Appetite problems","Enuresis","Encopresis",
  ],
};

// ── Symptoms by domain ─────────────────────────────────────────────────────
const DX_SYMPTOMS = {
  "ADHD": {
    history: ["Short attention span on history","Hyperactivity on history","Impulsivity on history","Academic difficulties reported","Frequent job/school changes","Family history of ADHD"],
    examination: ["Motor overactivity during interview","Poor sustained attention during testing","Impulsive responses during testing","Distractibility during examination"],
    observation: ["Cannot sit still in clinic","Touches objects in room","Interrupts during interview","Fidgets continuously","Makes impulsive comments"],
  },
  "ASD": {
    history: ["Delayed language milestones","Regression of skills","Abnormal social development","Repetitive play patterns reported","Sensory sensitivities reported"],
    examination: ["Absent/poor eye contact","No joint attention","Limited facial expression","Monotonous speech prosody","Echolalia present","Unusual hand movements"],
    observation: ["Ignores examiner","Lines up objects","Perseverative questioning","Unusual gait","Resistant to examination","Covers ears to sounds"],
  },
  "MDD": {
    history: ["Low mood most of the day","Anhedonia","Sleep disturbance","Appetite change","Fatigue","Suicidal ideation reported","Previous episodes"],
    examination: ["Flat affect","Psychomotor retardation","Tearfulness during interview","Negative cognitions expressed","Poor eye contact"],
    observation: ["Appears sad","Slow responses","Lack of spontaneity","Negative self-talk observed"],
  },
  "Anxiety": {
    history: ["Excessive worry on history","Avoidance behaviour reported","Somatic complaints","Panic attacks reported","Sleep onset difficulty"],
    examination: ["Anxious affect","Tremor","Sweating","Avoids eye contact","Reassurance seeking during examination"],
    observation: ["Appears tense","Nail biting","Clinging to parent","Refuses to separate for testing"],
  },
  "General": {
    history: ["Perinatal complications","Birth history abnormal","Developmental delay history","Family psychiatric history positive","Previous psychiatric treatment"],
    examination: ["Appearance — unkempt/dishevelled","Behaviour — uncooperative","Speech — delayed/abnormal","Mood — dysthymic/anxious","Affect — flat/labile","Thought — disorganised","Cognition — impaired","Insight — absent/partial"],
    observation: ["Rapport — difficult to establish","Attention — poor throughout","Activity level — high/low","Behaviour — challenging"],
  },
};

// ── Scales ─────────────────────────────────────────────────────────────────
const SCALES = [
  { id:"MISIC", name:"MISIC (Malin's Intelligence Scale for Indian Children)",
    fields:["Verbal IQ","Performance IQ","Full Scale IQ","VCI","PRI","WMI","PSI"],
    classify:(fsiq)=>fsiq>=130?"Very Superior":fsiq>=120?"Superior":fsiq>=110?"High Average":fsiq>=90?"Average":fsiq>=80?"Low Average":fsiq>=70?"Borderline":"Intellectual Disability"
  },
  { id:"WISC", name:"WISC-IV/V (Wechsler Intelligence Scale for Children)",
    fields:["Full Scale IQ","Verbal Comprehension","Perceptual Reasoning","Working Memory","Processing Speed"],
    classify:(fsiq)=>fsiq>=130?"Very Superior":fsiq>=120?"Superior":fsiq>=110?"High Average":fsiq>=90?"Average":fsiq>=80?"Low Average":fsiq>=70?"Borderline":"Intellectual Disability"
  },
  { id:"SB5", name:"Stanford-Binet 5th Edition",
    fields:["Full Scale IQ","Fluid Reasoning","Knowledge","Quantitative","Visual-Spatial","Working Memory"],
    classify:(fsiq)=>fsiq>=145?"Exceptionally Gifted":fsiq>=130?"Gifted":fsiq>=110?"High Average":fsiq>=90?"Average":fsiq>=70?"Below Average":"Impaired"
  },
  { id:"RAVENS", name:"Raven's Progressive Matrices",
    fields:["Raw Score","Percentile","Classification"],
    classify:()=>""
  },
  { id:"VABS", name:"Vineland Adaptive Behavior Scales",
    fields:["Adaptive Behavior Composite","Communication","Daily Living Skills","Socialisation","Motor Skills"],
    classify:(abc)=>abc>=130?"High":abc>=115?"Moderately High":abc>=85?"Adequate":abc>=70?"Moderately Low":"Low"
  },
  { id:"SNAP", name:"SNAP-IV (Swanson, Nolan and Pelham)",
    fields:["ADHD Inattention Score","ADHD Hyperactivity Score","ODD Score","Total Score"],
    classify:(total)=>total>=2.56?"Significant":total>=1.5?"Borderline":"Normal"
  },
  { id:"CONNERS", name:"Conners Rating Scale",
    fields:["Oppositional","Cognitive Problems","Hyperactivity","Anxious-Shy","Perfectionism","Social Problems","ADHD Index","T-Score"],
    classify:(t)=>t>=70?"Markedly Atypical":t>=65?"Mildly Atypical":"Within Normal Limits"
  },
  { id:"CBCL", name:"Child Behaviour Checklist (CBCL)",
    fields:["Internalising","Externalising","Total Problems","Anxious/Depressed","Withdrawn","Somatic","Social Problems","Thought Problems","Attention Problems","Rule-Breaking","Aggressive"],
    classify:(total)=>total>=64?"Clinical Range":total>=60?"Borderline Clinical":"Normal Range"
  },
  { id:"CDI", name:"Children's Depression Inventory (CDI)",
    fields:["Total Score","Negative Mood","Interpersonal","Ineffectiveness","Anhedonia","Negative Self-Esteem"],
    classify:(total)=>total>=20?"Severe":total>=14?"Moderate":total>=7?"Mild":"Minimal"
  },
  { id:"SCARED", name:"SCARED (Screen for Child Anxiety)",
    fields:["Total Score","Panic/Somatic","Generalised Anxiety","Separation Anxiety","Social Phobia","School Avoidance"],
    classify:(total)=>total>=25?"Likely Anxiety Disorder":"Below Threshold"
  },
  { id:"CSSRS", name:"Columbia Suicide Severity Rating Scale (C-SSRS)",
    fields:["Ideation Type","Intensity","Behaviour","Lethality","C-SSRS Level"],
    classify:()=>""
  },
  { id:"OTHER", name:"Other Instrument",
    fields:["Instrument Name","Score 1","Score 2","Total","Classification"],
    classify:()=>""
  },
];

// ── Default medications ────────────────────────────────────────────────────
const DEFAULT_DRUGS = [
  "Methylphenidate IR","Methylphenidate SR","Atomoxetine","Lisdexamfetamine",
  "Risperidone","Aripiprazole","Olanzapine","Quetiapine","Haloperidol","Clozapine",
  "Sodium Valproate","Lithium Carbonate","Carbamazepine","Lamotrigine","Oxcarbazepine",
  "Fluoxetine","Sertraline","Escitalopram","Fluvoxamine","Clomipramine",
  "Clonazepam","Lorazepam","Diazepam","Buspirone",
  "Melatonin","Clonidine","Guanfacine","Promethazine","Hydroxyzine",
  "Levetiracetam","Phenobarbitone","Phenytoin","Topiramate","Clobazam",
  "Modafinil","Amantadine","Memantine",
];

// ── CGI Labels ─────────────────────────────────────────────────────────────
const CGI_S_LABELS = ["","Normal — not ill","Borderline ill","Mildly ill","Moderately ill","Markedly ill","Severely ill","Extremely ill"];
const CGI_I_LABELS = ["","Very much improved","Much improved","Minimally improved","No change","Minimally worse","Much worse","Very much worse"];

// ── AI Plan Generator ──────────────────────────────────────────────────────
async function generateClinicalPlan(data) {
  const { ci, diagnoses, symptoms, scales, meds, cgiS, weeklyData, cData, pData } = data;
  const dxList = diagnoses.filter(d=>d.name).map(d=>`Level ${d.level}: ${d.name}`).join(", ");

  const fallback = {
    pharmacological: meds.length > 0
      ? `Continue current medications as prescribed. Review in 4 weeks. Monitor for side effects and therapeutic response.`
      : `Pharmacological intervention to be considered based on symptom severity and response to non-pharmacological measures.`,
    nonPharmacological: `1. Psychoeducation for parents and child regarding diagnosis and management.\n2. Behaviour management training for parents.\n3. School accommodation letter — request for additional support.\n4. Individual therapy as appropriate for age and diagnosis.\n5. Regular follow-up monitoring of symptoms and functioning.`,
    referrals: `Speech Therapy assessment if language concerns. Occupational Therapy for sensory/motor difficulties. Special Education evaluation for learning support.`,
    investigations: `EEG if seizure history. MRI Brain if neurological signs. Genetic evaluation if dysmorphic features. Blood investigations — CBC, LFT, RFT if on medications.`,
    prognosis: `With appropriate intervention and family support, meaningful improvement in functioning is expected. Regular monitoring and timely adjustment of treatment plan will be key.`,
    clinicianNote: `Comprehensive assessment completed. Diagnosis established as ${dxList||"under assessment"}. Management plan initiated.`,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 15000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", signal:controller.signal,
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:1500,
        messages:[{role:"user",content:`You are a senior child psychiatrist at CIBS Nagpur. Generate a comprehensive evidence-based management plan. Return ONLY valid JSON.

Child: ${ci.name||"Subject"}, Age: ${ci.age||"?"}, Gender: ${ci.gender||"?"}
Diagnoses: ${dxList||"Under assessment"}
CGI-S: ${cgiS||"?"}/7
Key symptoms: ${symptoms.slice(0,8).join(", ")||"See assessment"}
${weeklyData?`Weekly tracker data available: ${weeklyData.weeks} weeks of follow-up`:""}
${cData?`Cognitive assessment: IQ ${cData["FIS IQ Estimate"]||"?"}, Band: ${cData["FIS IQ Band"]||"?"}`:""}
${pData?`Parent report risk: ${pData["Risk Level"]||"?"}`:""}

Return this JSON:
{
  "pharmacological": "pharmacological management plan, evidence-based, 2-3 sentences",
  "nonPharmacological": "numbered list of non-pharmacological interventions, each on new line",
  "referrals": "specific referrals recommended",
  "investigations": "investigations to order if any",
  "prognosis": "brief prognosis statement",
  "clinicianNote": "integrated clinical formulation, 2-3 sentences"
}`}]
      })
    });
    clearTimeout(timer);
    const json = await res.json();
    const txt = (json.content||[]).map(b=>b.text||"").join("");
    const clean = txt.replace(/```json|```/g,"").trim();
    const parsed = JSON.parse(clean.slice(clean.indexOf("{"),clean.lastIndexOf("}")+1));
    return {...fallback,...parsed};
  } catch(e) { return fallback; }
}

// ── Utility components ─────────────────────────────────────────────────────
const Chip = ({label,selected,onClick,color="#0d5c6e"}) => (
  <button onClick={onClick} style={{
    padding:"5px 12px",borderRadius:99,border:`1.5px solid ${selected?color:"#e2e8f0"}`,
    background:selected?color:"white",color:selected?"white":"#64748b",
    fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s",margin:"3px",
  }}>{label}</button>
);

const SectionTitle = ({icon,title,color="#0d3b47"}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,
    paddingBottom:10,borderBottom:`2px solid ${color}20`}}>
    <span style={{fontSize:20}}>{icon}</span>
    <h3 style={{margin:0,fontSize:15,fontWeight:800,color}}>{title}</h3>
  </div>
);

const Field = ({label,children,required=false}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",fontSize:11,fontWeight:700,color:"#475569",marginBottom:5}}>
      {label}{required&&<span style={{color:"#ef4444"}}> *</span>}
    </label>
    {children}
  </div>
);

const Input = ({value,onChange,placeholder="",type="text",style={}}) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder}
    style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",
      fontSize:13,color:"#1e293b",outline:"none",background:"white",
      boxSizing:"border-box",...style}}/>
);

const Select = ({value,onChange,options,placeholder="Select..."}) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",
      fontSize:13,color:value?"#1e293b":"#94a3b8",background:"white",outline:"none",
      boxSizing:"border-box"}}>
    <option value="">{placeholder}</option>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);

const TextArea = ({value,onChange,placeholder="",rows=3}) => (
  <textarea value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",
      fontSize:13,color:"#1e293b",outline:"none",resize:"vertical",
      boxSizing:"border-box",fontFamily:"inherit"}}/>
);

// ── CGI Slider ─────────────────────────────────────────────────────────────
const CGISlider = ({value,onChange,labels,title,color="#0d5c6e"}) => {
  const colors = ["","#10b981","#84cc16","#f59e0b","#f97316","#ef4444","#dc2626","#991b1b"];
  return (
    <div style={{background:"#f8fafc",borderRadius:10,padding:"14px",border:"1px solid #e2e8f0"}}>
      <p style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:"#374151"}}>{title}</p>
      <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
        {[1,2,3,4,5,6,7].map(n=>(
          <button key={n} onClick={()=>onChange(n)}
            style={{width:44,height:44,borderRadius:8,border:`2px solid ${value===n?colors[n]:"#e2e8f0"}`,
              background:value===n?colors[n]:"white",color:value===n?"white":"#64748b",
              fontSize:16,fontWeight:800,cursor:"pointer",transition:"all 0.2s"}}>
            {n}
          </button>
        ))}
      </div>
      {value>0 && (
        <p style={{margin:"8px 0 0",textAlign:"center",fontSize:12,fontWeight:700,
          color:colors[value]}}>
          {labels[value]}
        </p>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  PEDIGREE CHART
// ══════════════════════════════════════════════════════════════════════════════
const RELATION_TYPES = [
  "Father","Mother","Sibling","Paternal Grandfather","Paternal Grandmother",
  "Maternal Grandfather","Maternal Grandmother","Uncle","Aunt","Cousin","Other"
];
const PSYCH_CONDITIONS = [
  "None","ADHD","Depression","Anxiety","Bipolar Disorder","Schizophrenia",
  "Intellectual Disability","Autism","Substance Use","Epilepsy","Other",
];

function PedigreeChart({ members, onAdd, onUpdate, onRemove, childName }) {
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});

  const openEdit = (m) => { setEditing(m.id); setEditData({...m}); };
  const saveEdit = () => { onUpdate(editData); setEditing(null); };

  const Symbol = ({m, isSubject=false}) => {
    const isMale = m.gender==="M";
    const isFemale = m.gender==="F";
    const isAffected = m.psychiatric && m.psychiatric!=="None";
    const color = isSubject?"#0d9488":isAffected?"#dc2626":"#0d3b47";
    const bg = isSubject?"#f0fdf4":isAffected?"#fef2f2":"white";

    return (
      <div onClick={()=>m.id?openEdit(m):null}
        style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,
          cursor:m.id?"pointer":"default",minWidth:60}}>
        <div style={{position:"relative"}}>
          {isMale ? (
            <div style={{width:40,height:40,border:`2.5px solid ${color}`,background:bg,
              position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:700,color}}>
              {isAffected&&<div style={{position:"absolute",inset:4,background:color,opacity:0.3}}/>}
              {isSubject&&<span style={{fontSize:16}}>★</span>}
            </div>
          ) : isFemale ? (
            <div style={{width:40,height:40,borderRadius:"50%",border:`2.5px solid ${color}`,
              background:bg,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:700,color,position:"relative"}}>
              {isAffected&&<div style={{position:"absolute",inset:4,borderRadius:"50%",background:color,opacity:0.3}}/>}
              {isSubject&&<span style={{fontSize:16}}>★</span>}
            </div>
          ) : (
            <div style={{width:40,height:40,background:"#f1f5f9",border:"2px dashed #94a3b8",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>◆</div>
          )}
          {m.deceased && (
            <div style={{position:"absolute",top:-4,left:"50%",transform:"translateX(-50%)",
              width:2,height:48,background:"#374151",pointerEvents:"none"}}/>
          )}
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#374151"}}>{m.name||m.relation}</div>
          {m.age&&<div style={{fontSize:9,color:"#94a3b8"}}>{m.age}yr</div>}
        </div>
      </div>
    );
  };

  const subject = { id:"subject", name:childName||"Subject", gender:"M", relation:"Subject", psychiatric:"None" };
  const father  = members.find(m=>m.relation==="Father");
  const mother  = members.find(m=>m.relation==="Mother");
  const siblings = members.filter(m=>m.relation==="Sibling");
  const patGF   = members.find(m=>m.relation==="Paternal Grandfather");
  const patGM   = members.find(m=>m.relation==="Paternal Grandmother");
  const matGF   = members.find(m=>m.relation==="Maternal Grandfather");
  const matGM   = members.find(m=>m.relation==="Maternal Grandmother");
  const others  = members.filter(m=>!["Father","Mother","Sibling","Paternal Grandfather","Paternal Grandmother","Maternal Grandfather","Maternal Grandmother"].includes(m.relation));

  return (
    <div>
      {/* SVG Pedigree */}
      <div style={{background:"#f8fafc",borderRadius:12,padding:"20px",border:"1px solid #e2e8f0",
        overflowX:"auto",marginBottom:16}}>
        <p style={{margin:"0 0 16px",fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"}}>
          Pedigree Chart — ■ Male · ○ Female · ★ Index Child · Shaded = Affected
        </p>

        {/* Generation 1 — Grandparents */}
        <div style={{display:"flex",justifyContent:"space-around",marginBottom:8}}>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            {patGF?<Symbol m={patGF}/>:<div style={{width:60}}/>}
            {patGM?<Symbol m={patGM}/>:<div style={{width:60}}/>}
          </div>
          <div style={{display:"flex",gap:16,alignItems:"center"}}>
            {matGF?<Symbol m={matGF}/>:<div style={{width:60}}/>}
            {matGM?<Symbol m={matGM}/>:<div style={{width:60}}/>}
          </div>
        </div>

        {/* Connecting lines Gen1-Gen2 */}
        <div style={{display:"flex",justifyContent:"space-around",marginBottom:4}}>
          <div style={{width:140,height:12,borderBottom:"2px solid #94a3b8",borderLeft:"2px solid #94a3b8",borderRight:"2px solid #94a3b8"}}/>
          <div style={{width:140,height:12,borderBottom:"2px solid #94a3b8",borderLeft:"2px solid #94a3b8",borderRight:"2px solid #94a3b8"}}/>
        </div>

        {/* Generation 2 — Parents */}
        <div style={{display:"flex",justifyContent:"center",gap:60,alignItems:"center",marginBottom:8}}>
          {father?<Symbol m={father}/>:<div style={{width:60,textAlign:"center",fontSize:10,color:"#94a3b8"}}>Father<br/>not added</div>}
          <div style={{width:40,height:2,background:"#94a3b8"}}/>
          {mother?<Symbol m={mother}/>:<div style={{width:60,textAlign:"center",fontSize:10,color:"#94a3b8"}}>Mother<br/>not added</div>}
        </div>

        {/* Connecting line Gen2-Gen3 */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
          <div style={{width:2,height:16,background:"#94a3b8"}}/>
        </div>

        {/* Generation 3 — Subject + Siblings */}
        <div style={{display:"flex",justifyContent:"center",gap:20,alignItems:"flex-start"}}>
          {siblings.filter((_,i)=>i<2).map(s=><Symbol key={s.id} m={s}/>)}
          <Symbol m={subject} isSubject={true}/>
          {siblings.filter((_,i)=>i>=2).map(s=><Symbol key={s.id} m={s}/>)}
        </div>

        {/* Others row */}
        {others.length>0 && (
          <div style={{marginTop:16,paddingTop:12,borderTop:"1px dashed #e2e8f0"}}>
            <p style={{margin:"0 0 8px",fontSize:10,color:"#94a3b8"}}>Other relatives:</p>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>{others.map(o=><Symbol key={o.id} m={o}/>)}</div>
          </div>
        )}
      </div>

      {/* Add member buttons */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {["Father","Mother","Sibling","Paternal Grandfather","Paternal Grandmother","Maternal Grandfather","Maternal Grandmother","Uncle","Aunt","Other"].map(rel=>(
          <button key={rel} onClick={()=>onAdd(rel)}
            style={{padding:"5px 10px",borderRadius:8,border:"1.5px dashed #0d9488",
              background:"white",color:"#0d9488",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            + {rel}
          </button>
        ))}
      </div>

      {/* Member list */}
      {members.length>0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
          {members.map(m=>(
            <div key={m.id} style={{background:"white",borderRadius:8,padding:"10px 12px",
              border:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#374151"}}>{m.relation} — {m.name||"Unnamed"}</div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{m.gender==="M"?"Male":m.gender==="F"?"Female":"?"} · {m.age||"?"}yr · {m.psychiatric||"No psych hx"}</div>
              </div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>openEdit(m)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",fontSize:11,cursor:"pointer"}}>✏️</button>
                <button onClick={()=>onRemove(m.id)} style={{padding:"3px 8px",borderRadius:6,border:"1px solid #fecaca",background:"#fef2f2",fontSize:11,cursor:"pointer"}}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,
          display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,padding:24,width:"100%",maxWidth:400,
            maxHeight:"80vh",overflowY:"auto"}}>
            <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:800,color:"#0d3b47"}}>
              Edit — {editData.relation}
            </h3>
            <div style={{display:"grid",gap:10}}>
              <Field label="Name">
                <Input value={editData.name||""} onChange={v=>setEditData(p=>({...p,name:v}))}/>
              </Field>
              <Field label="Gender">
                <div style={{display:"flex",gap:8}}>
                  {[["M","■ Male"],["F","○ Female"],["?","◆ Unknown"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setEditData(p=>({...p,gender:v}))}
                      style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${editData.gender===v?"#0d9488":"#e2e8f0"}`,
                        background:editData.gender===v?"#f0fdf4":"white",fontSize:12,fontWeight:600,cursor:"pointer",
                        color:editData.gender===v?"#0d9488":"#64748b"}}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Age"><Input value={editData.age||""} onChange={v=>setEditData(p=>({...p,age:v}))} type="number" placeholder="Years"/></Field>
              <Field label="Education"><Input value={editData.education||""} onChange={v=>setEditData(p=>({...p,education:v}))}/></Field>
              <Field label="Occupation"><Input value={editData.occupation||""} onChange={v=>setEditData(p=>({...p,occupation:v}))}/></Field>
              <Field label="Psychiatric History">
                <Select value={editData.psychiatric||""} onChange={v=>setEditData(p=>({...p,psychiatric:v}))} options={PSYCH_CONDITIONS}/>
              </Field>
              <Field label="Medical History"><Input value={editData.medical||""} onChange={v=>setEditData(p=>({...p,medical:v}))}/></Field>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="checkbox" checked={editData.deceased||false} onChange={e=>setEditData(p=>({...p,deceased:e.target.checked}))} id="deceased"/>
                <label htmlFor="deceased" style={{fontSize:12,color:"#374151"}}>Deceased</label>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:16}}>
              <button onClick={()=>setEditing(null)} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={saveEdit} style={{flex:2,padding:"10px",borderRadius:8,border:"none",background:"#0d5c6e",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState(0);
  const [sessionMode, setSessionMode] = useState(null); // null|"new"|"continue"|"retest"
  const [prevSession, setPrevSession] = useState(null);
  const [cData, setCData] = useState(null);
  const [pData, setPData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loadingCP, setLoadingCP] = useState(false);
  const [dbSubmitted, setDbSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Field 1 — Identity
  const [ci, setCi] = useState({
    fileNo: getParam("reg")||"", name:"", dob:"", age:"", gender:"",
    school:"", grade:"", examiner: getParam("assessor")||"",
    date: new Date().toISOString().slice(0,10),
    education:"", occupation:"", referral:"", setting:"",
  });
  const upd = (k,v) => setCi(p=>({...p,[k]:v}));

  // Field 2 — Diagnoses (5 levels)
  const [diagnoses, setDiagnoses] = useState([
    {level:1,name:"",category:"",specifier:""},
    {level:2,name:"",category:"",specifier:""},
    {level:3,name:"",category:"",specifier:""},
    {level:4,name:"",category:"",specifier:""},
    {level:5,name:"",category:"",specifier:""},
  ]);

  // Field 3 — Complaints
  const [complaints, setComplaints] = useState([]);

  // Field 4 — Symptoms
  const [symptoms, setSymptoms] = useState({ history:[], examination:[], observation:[] });

  // Field 5 — Symptom Grading
  const [symptomGrades, setSymptomGrades] = useState({});

  // Field 6 — Scales
  const [scaleScores, setScaleScores] = useState({});
  const [usedScales, setUsedScales] = useState([]);

  // Field 7 — Family (Pedigree)
  const [familyMembers, setFamilyMembers] = useState([]);

  // Field 8 — Medical findings
  const [medFindings, setMedFindings] = useState({ neurological:"", physical:"", eeg:"", mri:"", labs:"", other:"" });

  // Field 9 — Medications
  const [drugList, setDrugList] = useState(() => {
    try { const saved=localStorage.getItem("cibs_drugs"); return saved?JSON.parse(saved):DEFAULT_DRUGS; } catch { return DEFAULT_DRUGS; }
  });
  const [newDrug, setNewDrug] = useState("");
  const [medications, setMedications] = useState([]);

  // Field 10 — CGI + Plan
  const [cgiS, setCgiS] = useState(0);
  const [cgiI, setCgiI] = useState(0);
  const [clinicianNote, setClinicianNote] = useState("");
  const [plan, setPlan] = useState({ pharmacological:"", nonPharmacological:"", referrals:"", investigations:"", followUpDate:"", prognosis:"" });

  // ── Auto-fetch C and P on FileNo change ────────────────────────────────
  useEffect(() => {
    if (!ci.fileNo || ci.fileNo.length < 8) return;
    const timeout = setTimeout(()=>fetchCPData(ci.fileNo), 1000);
    return ()=>clearTimeout(timeout);
  }, [ci.fileNo]);

  const fetchCPData = async (fileNo) => {
    setLoadingCP(true);
    try {
      const url = `${APPS_SCRIPT_URL}?action=getRecord&reg=${encodeURIComponent(fileNo)}&token=${TOKEN}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status==="ok" && json.data) {
        const d = json.data;
        setCData(d.C||null);
        setPData(d.P||null);
        if (d.V && json.data.sessions?.V > 0) setPrevSession(d.V);
        // Auto-fill child info from C or P
        const src = d.C||d.P||{};
        if (src["Child Name"]&&!ci.name) upd("name", src["Child Name"]);
        if (src["Child Date of Birth"]&&!ci.dob) upd("dob", src["Child Date of Birth"]);
        if (src["Child Age (yrs)"]&&!ci.age) upd("age", src["Child Age (yrs)"]);
        if (src["Child Gender"]&&!ci.gender) upd("gender", src["Child Gender"]);
        if (src["School / Institution"]&&!ci.school) upd("school", src["School / Institution"]);
      }
      // Fetch weekly data
      const wurl = `${APPS_SCRIPT_URL}?action=getWeekly&reg=${encodeURIComponent(fileNo)}&token=${TOKEN}`;
      const wres = await fetch(wurl);
      const wjson = await wres.json();
      if (wjson.status==="ok") setWeeklyData(wjson.data);
    } catch(e){}
    setLoadingCP(false);
  };

  // ── Auto-populate complaints and symptoms from diagnoses ──────────────
  const getAutoComplaints = useCallback(() => {
    const result = new Set();
    diagnoses.forEach(d=>{
      if (!d.name) return;
      // Match diagnosis to complaint category
      const key = Object.keys(DX_COMPLAINTS).find(k=>d.name.toLowerCase().includes(k.toLowerCase()));
      if (key) DX_COMPLAINTS[key].forEach(c=>result.add(c));
      DX_COMPLAINTS["General"].forEach(c=>result.add(c));
    });
    return Array.from(result);
  }, [diagnoses]);

  const getAutoSymptoms = useCallback(() => {
    const result = { history:new Set(), examination:new Set(), observation:new Set() };
    diagnoses.forEach(d=>{
      if (!d.name) return;
      const key = Object.keys(DX_SYMPTOMS).find(k=>d.name.toLowerCase().includes(k.toLowerCase()));
      const src = key ? DX_SYMPTOMS[key] : DX_SYMPTOMS["General"];
      src.history?.forEach(s=>result.history.add(s));
      src.examination?.forEach(s=>result.examination.add(s));
      src.observation?.forEach(s=>result.observation.add(s));
      DX_SYMPTOMS["General"].history?.forEach(s=>result.history.add(s));
      DX_SYMPTOMS["General"].examination?.forEach(s=>result.examination.add(s));
      DX_SYMPTOMS["General"].observation?.forEach(s=>result.observation.add(s));
    });
    return { history:Array.from(result.history), examination:Array.from(result.examination), observation:Array.from(result.observation) };
  }, [diagnoses]);

  // ── Family helpers ─────────────────────────────────────────────────────
  const addFamilyMember = (relation) => {
    const newMember = { id: Date.now(), relation, name:"", gender:relation==="Father"||relation.includes("Grand")||relation==="Uncle"?"M":relation==="Mother"||relation==="Aunt"?"F":"?", age:"", education:"", occupation:"", psychiatric:"None", medical:"", deceased:false };
    setFamilyMembers(p=>[...p, newMember]);
  };
  const updateFamilyMember = (data) => setFamilyMembers(p=>p.map(m=>m.id===data.id?data:m));
  const removeFamilyMember = (id) => setFamilyMembers(p=>p.filter(m=>m.id!==id));

  // ── Drug helpers ───────────────────────────────────────────────────────
  const addDrug = () => {
    if (!newDrug.trim()) return;
    const updated = [...new Set([...drugList, newDrug.trim()])];
    setDrugList(updated);
    localStorage.setItem("cibs_drugs", JSON.stringify(updated));
    // Push to Sheet
    try {
      fetch(APPS_SCRIPT_URL, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ tool:"DRUG_MASTER", drug:newDrug.trim(), addedBy:ci.examiner||"", timestamp:new Date().toISOString() })
      });
    } catch(e){}
    setNewDrug("");
  };

  const addMedication = () => {
    setMedications(p=>[...p, { id:Date.now(), drug:"", dose:"", frequency:"Once daily", duration:"", startDate:ci.date, notes:"" }]);
  };
  const updateMed = (id,k,v) => setMedications(p=>p.map(m=>m.id===id?{...m,[k]:v}:m));
  const removeMed = (id) => setMedications(p=>p.filter(m=>m.id!==id));

  // ── Generate AI plan ───────────────────────────────────────────────────
  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    const allSymptoms = [...symptoms.history, ...symptoms.examination, ...symptoms.observation];
    const result = await generateClinicalPlan({ ci, diagnoses, symptoms:allSymptoms, scales:usedScales, meds:medications, cgiS, weeklyData, cData, pData });
    setAiPlan(result);
    setPlan(p=>({...p,
      pharmacological: result.pharmacological||p.pharmacological,
      nonPharmacological: result.nonPharmacological||p.nonPharmacological,
      referrals: result.referrals||p.referrals,
      investigations: result.investigations||p.investigations,
      prognosis: result.prognosis||p.prognosis,
    }));
    if (!clinicianNote) setClinicianNote(result.clinicianNote||"");
    setGeneratingPlan(false);
  };

  // ── Submit to databank ─────────────────────────────────────────────────
  const submitToDatabank = async () => {
    setSaving(true);
    const fileNo = (ci.fileNo||autoFileNo()).trim();
    const dxList = diagnoses.filter(d=>d.name).map(d=>d.name).join("; ");
    const allSymptoms = [...symptoms.history,...symptoms.examination,...symptoms.observation].join("; ");
    const medList = medications.map(m=>`${m.drug} ${m.dose} ${m.frequency}`).join("; ");
    const familyJSON = JSON.stringify(familyMembers.slice(0,5));
    const fsiq = scaleScores["MISIC"]?.["Full Scale IQ"]||scaleScores["WISC"]?.["Full Scale IQ"]||scaleScores["SB5"]?.["Full Scale IQ"]||"";

    try {
      await fetch(APPS_SCRIPT_URL, {
        method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          tool:"eSMART-V", timestamp:new Date().toISOString(), mode:"clinician",
          fileNo, uid:"", name:ci.examiner||"", dob:"", age:"", gender:"",
          mobile:"", education:"", occupation:"", referral:ci.referral||"",
          assessor:ci.examiner||"", notes:clinicianNote||"",
          // Child info
          child_name:ci.name||"", child_dob:ci.dob||"", child_age:ci.age||"",
          child_gender:ci.gender||"", school:ci.school||"", grade:ci.grade||"",
          // Clinician
          clinician_name:ci.examiner||"", assessment_date:ci.date||"",
          setting:ci.setting||"", purpose:ci.referral||"",
          instruments_used:usedScales.join(", "),
          // IQ
          clinical_iq_estimate:fsiq, iq_source:usedScales[0]||"",
          misic_fsiq:scaleScores["MISIC"]?.["Full Scale IQ"]||"",
          misic_vci:scaleScores["MISIC"]?.["VCI"]||"",
          misic_pri:scaleScores["MISIC"]?.["PRI"]||"",
          wisc_fsiq:scaleScores["WISC"]?.["Full Scale IQ"]||"",
          sb5_fsiq:scaleScores["SB5"]?.["Full Scale IQ"]||"",
          ravens_total:scaleScores["RAVENS"]?.["Raw Score"]||"",
          vabs_abc:scaleScores["VABS"]?.["Adaptive Behavior Composite"]||"",
          snap_total:scaleScores["SNAP"]?.["Total Score"]||"",
          snap_inattention:scaleScores["SNAP"]?.["ADHD Inattention Score"]||"",
          snap_hyperactivity:scaleScores["SNAP"]?.["ADHD Hyperactivity Score"]||"",
          // Diagnosis
          dx_primary:diagnoses[0]?.name||"",
          dx_secondary:diagnoses[1]?.name||"",
          diagnosis_provisional:dxList,
          // Symptoms
          severity_cognitive:symptomGrades["cognitive"]||"",
          severity_emotional:symptomGrades["emotional"]||"",
          severity_behavioural:symptomGrades["behavioural"]||"",
          // Risk
          cssrs_level:scaleScores["CSSRS"]?.["C-SSRS Level"]||"",
          risk_summary:clinicianNote||"",
          // Plan
          clinical_impression:clinicianNote||"",
          strengths:"", treatment_plan:plan.nonPharmacological||"",
          referrals:plan.referrals||"",
          follow_up_date:plan.followUpDate||"",
          prognosis:plan.prognosis||"",
          validation_status:"Completed",
          // Extra fields
          medications:medList, family_structure:familyJSON,
          cgi_s:cgiS, cgi_i:cgiI,
          complaints:complaints.join("; "), symptoms:allSymptoms,
          medical_findings:JSON.stringify(medFindings),
        })
      });
      setDbSubmitted(true);
    } catch(e){}
    setSaving(false);
  };

  // ── Today ──────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-IN",{year:"numeric",month:"long",day:"numeric"});

  // ── TAB DEFINITIONS ───────────────────────────────────────────────────
  const TABS = [
    {icon:"📋",label:"C+P Status"},
    {icon:"👤",label:"Identity"},
    {icon:"🔬",label:"Diagnosis"},
    {icon:"🗣",label:"Complaints"},
    {icon:"📝",label:"Symptoms"},
    {icon:"📊",label:"Grading"},
    {icon:"🧪",label:"Scales"},
    {icon:"👨‍👩‍👧",label:"Family"},
    {icon:"🩺",label:"Medical"},
    {icon:"💊",label:"Medications"},
    {icon:"📋",label:"Plan"},
  ];

  const card = {background:"white",borderRadius:14,padding:"20px",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9"};

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:"100vh",background:"#e8ecf0",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <style>{`@media print{.no-print{display:none!important}body{background:white!important}}
        input:focus,select:focus,textarea:focus{border-color:#0d9488!important;box-shadow:0 0 0 3px rgba(13,148,136,0.1)!important;outline:none!important}
      `}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0d3b47,#0d5c6e)",padding:"14px 16px",
        position:"sticky",top:0,zIndex:20}} className="no-print">
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div>
              <div style={{fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:"#9FE1CB"}}>
                eSMART-V · Clinical Workstation
              </div>
              <div style={{fontSize:16,fontWeight:800,color:"white"}}>
                {ci.name||"New Assessment"} {ci.fileNo?`· ${ci.fileNo}`:""}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={submitToDatabank} disabled={saving||!ci.fileNo}
                style={{padding:"8px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,
                  background:saving?"#94a3b8":dbSubmitted?"#10b981":"#0d9488",
                  color:"white",cursor:ci.fileNo?"pointer":"not-allowed"}}>
                {saving?"Saving...":dbSubmitted?"✅ Saved":"☁️ Save to Databank"}
              </button>
              {ci.fileNo&&(
                <a href={`https://esmart-report.vercel.app?reg=${ci.fileNo}&mode=clinical`}
                  target="_blank" rel="noopener noreferrer"
                  style={{padding:"8px 14px",borderRadius:8,background:"#1e3a5f",color:"white",
                    fontSize:12,fontWeight:700,textDecoration:"none"}}>
                  🏥 Report →
                </a>
              )}
            </div>
          </div>
          {/* Tab bar */}
          <div style={{display:"flex",gap:2,overflowX:"auto",paddingBottom:2}}>
            {TABS.map((t,i)=>(
              <button key={i} onClick={()=>setTab(i)}
                style={{padding:"6px 10px",borderRadius:"6px 6px 0 0",border:"none",
                  fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",
                  background:tab===i?"#e8ecf0":"rgba(255,255,255,0.1)",
                  color:tab===i?"#0d3b47":"rgba(255,255,255,0.7)",
                  transition:"all 0.15s",minWidth:"fit-content"}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"16px"}}>

        {/* ══ TAB 0 — C + P STATUS ══ */}
        {tab===0 && (
          <div>
            <SectionTitle icon="📋" title="eSMART-C and eSMART-P Status" color="#0d5c6e"/>
            <div style={{...card,background:"#eff6ff",border:"1px solid #bfdbfe",marginBottom:12}}>
              <p style={{margin:0,fontSize:12,color:"#1d4ed8"}}>
                Enter the child's <strong>File No.</strong> in Tab 1 — Identity. The system will automatically fetch C and P data.
                {loadingCP&&" Loading..."}
              </p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {/* C Card */}
              <div style={{...card,border:cData?"1.5px solid #10b981":"1.5px dashed #94a3b8"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <h3 style={{margin:0,fontSize:14,fontWeight:800,color:cData?"#0d5c6e":"#94a3b8"}}>eSMART-C</h3>
                  <span style={{fontSize:12,fontWeight:700,color:cData?"#10b981":"#94a3b8"}}>
                    {cData?"✅ Completed":"⏳ Awaited"}
                  </span>
                </div>
                {cData ? (
                  <div style={{fontSize:12,color:"#374151",lineHeight:1.8}}>
                    <div>🧠 IQ: <strong>{cData["FIS IQ Estimate"]||"—"}</strong> — {cData["FIS IQ Band"]||"—"}</div>
                    <div>💡 EQ: <strong>{cData["SCSS Emotional Intelligence"]||"—"}</strong> ({cData["SCSS EQ Band"]||"—"})</div>
                    <div>🎯 Cog Style: {cData["SCSS Cognitive Style"]||"—"}</div>
                    <div>⚠️ Risk CRI: {cData["SCSS Combined Risk Index"]||"—"}</div>
                    <div>🔬 DSM Cluster: {cData["SCSS DSM-5 Cluster"]||"—"}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>Session {cData["Session No."]||1}</div>
                  </div>
                ) : (
                  <div>
                    <p style={{fontSize:12,color:"#94a3b8",marginBottom:10}}>Cognitive assessment not yet completed.</p>
                    {ci.fileNo&&(
                      <a href={`https://esmart-c.vercel.app?reg=${ci.fileNo}&assessor=${ci.examiner||""}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{display:"block",padding:"8px 12px",borderRadius:8,background:"#eff6ff",
                          border:"1px solid #bfdbfe",fontSize:11,color:"#1d4ed8",fontWeight:700,
                          textDecoration:"none",textAlign:"center"}}>
                        📋 Send eSMART-C Link →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* P Card */}
              <div style={{...card,border:pData?"1.5px solid #10b981":"1.5px dashed #94a3b8"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <h3 style={{margin:0,fontSize:14,fontWeight:800,color:pData?"#0d5c6e":"#94a3b8"}}>eSMART-P</h3>
                  <span style={{fontSize:12,fontWeight:700,color:pData?"#10b981":"#94a3b8"}}>
                    {pData?"✅ Completed":"⏳ Awaited"}
                  </span>
                </div>
                {pData ? (
                  <div style={{fontSize:12,color:"#374151",lineHeight:1.8}}>
                    <div>⚠️ Risk: <strong style={{color:pData["Risk Level"]==="LEVEL 3"?"#dc2626":pData["Risk Level"]==="LEVEL 2"?"#d97706":"#16a34a"}}>{pData["Risk Level"]||"—"}</strong></div>
                    <div>👶 Age Band: {pData["Age Band"]||"—"}</div>
                    <div>👤 Informant: {pData["Informant Name"]||"—"} ({pData["Informant Relation to Child"]||"—"})</div>
                    {["ADHD","ASD","IDD","MDD","Anxiety"].filter(d=>pData[`${d} Severity`]&&pData[`${d} Severity`]!=="Normal").map(d=>(
                      <div key={d}>🔴 {d}: <strong>{pData[`${d} Severity`]}</strong></div>
                    ))}
                    {pData["Suicide Risk Flag"]==="FLAGGED"&&(
                      <div style={{background:"#fef2f2",borderRadius:6,padding:"6px 8px",marginTop:6,color:"#dc2626",fontWeight:700,fontSize:11}}>
                        ⚠️ SUICIDE RISK FLAGGED
                      </div>
                    )}
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>Session {pData["Session No."]||1}</div>
                  </div>
                ) : (
                  <div>
                    <p style={{fontSize:12,color:"#94a3b8",marginBottom:10}}>Parent questionnaire not yet completed.</p>
                    {ci.fileNo&&(
                      <a href={`https://esmart-p.vercel.app?reg=${ci.fileNo}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{display:"block",padding:"8px 12px",borderRadius:8,background:"#fffbeb",
                          border:"1px solid #fde68a",fontSize:11,color:"#92400e",fontWeight:700,
                          textDecoration:"none",textAlign:"center"}}>
                        📋 Send eSMART-P Link →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Weekly data summary */}
            {weeklyData?.weeks?.length>0 && (
              <div style={{...card,background:"#f0fdf4",border:"1.5px solid #86efac"}}>
                <h3 style={{margin:"0 0 10px",fontSize:13,fontWeight:800,color:"#15803d"}}>
                  📈 Weekly Tracker — {weeklyData.weeks.length} weeks of data available
                </h3>
                <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:"#374151"}}>
                  <span>Last entry: {weeklyData.weeks[weeklyData.weeks.length-1]?.Timestamp?.slice(0,10)||"—"}</span>
                  <span>Parent stress (last): {weeklyData.weeks[weeklyData.weeks.length-1]?.["Parent Stress Score"]||"—"}/10</span>
                  <span>Intervention: {weeklyData.weeks[weeklyData.weeks.length-1]?.["Intervention Activity"]||"—"}</span>
                </div>
              </div>
            )}

            {/* Previous V session */}
            {prevSession && !sessionMode && (
              <div style={{...card,background:"#faf5ff",border:"1.5px solid #d8b4fe"}}>
                <h3 style={{margin:"0 0 10px",fontSize:13,fontWeight:800,color:"#6d28d9"}}>
                  Previous eSMART-V Session Found
                </h3>
                <p style={{fontSize:12,color:"#374151",marginBottom:12}}>
                  A previous clinical assessment exists for this child (Session {prevSession["Session No."]||1} — {prevSession["Timestamp"]?.slice(0,10)||"—"}).
                  How would you like to proceed?
                </p>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>setSessionMode("continue")}
                    style={{padding:"10px 16px",borderRadius:8,border:"none",background:"#6d28d9",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    ✏️ Continue Session {prevSession["Session No."]||1}
                  </button>
                  <button onClick={()=>setSessionMode("retest")}
                    style={{padding:"10px 16px",borderRadius:8,border:"1.5px solid #6d28d9",background:"white",color:"#6d28d9",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    🔄 Start New Session {(Number(prevSession["Session No."])||1)+1}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 1 — IDENTITY ══ */}
        {tab===1 && (
          <div style={card}>
            <SectionTitle icon="👤" title="Child Identification" color="#0d5c6e"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="File No. (CIBS Registration) ★" required>
                <Input value={ci.fileNo} onChange={v=>upd("fileNo",v)} placeholder="CIBS-26-0042"/>
                {loadingCP&&<p style={{fontSize:10,color:"#0d9488",margin:"4px 0 0"}}>Fetching C+P data...</p>}
              </Field>
              <Field label="Child's Full Name">
                <Input value={ci.name} onChange={v=>upd("name",v)}/>
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={ci.dob} onChange={v=>{upd("dob",v); const ms=Date.now()-new Date(v).getTime(); upd("age",String(Math.floor(ms/(1000*60*60*24*365.25))));}} />
              </Field>
              <Field label="Age (years)">
                <Input value={ci.age} onChange={v=>upd("age",v)} type="number"/>
              </Field>
              <Field label="Gender">
                <div style={{display:"flex",gap:8}}>
                  {[["M","Male"],["F","Female"],["O","Other"]].map(([v,l])=>(
                    <button key={v} onClick={()=>upd("gender",v)}
                      style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${ci.gender===v?"#0d5c6e":"#e2e8f0"}`,
                        background:ci.gender===v?"#0d5c6e":"white",color:ci.gender===v?"white":"#64748b",
                        fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Education Level">
                <Select value={ci.education} onChange={v=>upd("education",v)}
                  options={["Pre-school","Primary (Class 1-5)","Upper Primary (Class 6-8)","Secondary (Class 9-10)","Higher Secondary (Class 11-12)","Graduate","Post-Graduate","Not in school","Dropout"]}/>
              </Field>
              <Field label="School / Institution">
                <Input value={ci.school} onChange={v=>upd("school",v)}/>
              </Field>
              <Field label="Class / Grade">
                <Input value={ci.grade} onChange={v=>upd("grade",v)}/>
              </Field>
              <Field label="Examiner / Clinician" required>
                <Input value={ci.examiner} onChange={v=>upd("examiner",v)} placeholder="Dr. Pangaonkar"/>
              </Field>
              <Field label="Assessment Date">
                <Input type="date" value={ci.date} onChange={v=>upd("date",v)}/>
              </Field>
              <Field label="Setting">
                <Select value={ci.setting} onChange={v=>upd("setting",v)}
                  options={["OPD — CIBS","IPD — CIBS","Home Visit","School Visit","Telemedicine","Private Clinic","Other"]}/>
              </Field>
              <Field label="Purpose / Referral Source">
                <Input value={ci.referral} onChange={v=>upd("referral",v)} placeholder="e.g. Self-referral, School referral"/>
              </Field>
            </div>
          </div>
        )}

        {/* ══ TAB 2 — DIAGNOSIS ══ */}
        {tab===2 && (
          <div style={card}>
            <SectionTitle icon="🔬" title="Multi-Level Diagnosis (DSM-5 / ICD-11)" color="#7c3aed"/>
            <div style={{background:"#faf5ff",borderRadius:8,padding:"10px 12px",marginBottom:16,border:"1px solid #ddd6fe"}}>
              <p style={{margin:0,fontSize:12,color:"#6d28d9"}}>
                Level 1 = Primary Diagnosis · Levels 2–5 = Comorbidities and Associated Conditions
              </p>
            </div>
            {diagnoses.map((d,i)=>(
              <div key={i} style={{background:i===0?"#faf5ff":"#f8fafc",borderRadius:10,
                padding:"14px",marginBottom:10,
                border:`1.5px solid ${i===0?"#d8b4fe":"#e2e8f0"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:28,height:28,borderRadius:"50%",
                    background:i===0?"#7c3aed":"#94a3b8",color:"white",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:12,fontWeight:800,flexShrink:0}}>
                    {i+1}
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:i===0?"#6d28d9":"#64748b"}}>
                    {i===0?"Primary Diagnosis":`Level ${i+1} — Comorbidity / Associated Condition`}
                  </span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:8}}>
                  <Field label="Category">
                    <Select value={d.category}
                      onChange={v=>setDiagnoses(p=>p.map((x,j)=>j===i?{...x,category:v,name:""}:x))}
                      options={Object.keys(DIAGNOSES)}/>
                  </Field>
                  <Field label="Diagnosis">
                    <Select value={d.name}
                      onChange={v=>setDiagnoses(p=>p.map((x,j)=>j===i?{...x,name:v}:x))}
                      options={d.category?DIAGNOSES[d.category]:[]}
                      placeholder={d.category?"Select diagnosis...":"Select category first"}/>
                  </Field>
                </div>
                <Field label="Specifier / Severity / Notes">
                  <Input value={d.specifier}
                    onChange={v=>setDiagnoses(p=>p.map((x,j)=>j===i?{...x,specifier:v}:x))}
                    placeholder="e.g. Moderate, with anxious distress, current episode"/>
                </Field>
              </div>
            ))}
            {diagnoses.some(d=>d.name) && (
              <div style={{background:"#f0fdf4",borderRadius:8,padding:"12px 14px",border:"1px solid #86efac"}}>
                <p style={{margin:0,fontSize:11,fontWeight:700,color:"#15803d",marginBottom:4}}>Active Diagnoses Summary:</p>
                {diagnoses.filter(d=>d.name).map((d,i)=>(
                  <p key={i} style={{margin:"2px 0",fontSize:12,color:"#166534"}}>
                    Level {d.level}: <strong>{d.name}</strong>{d.specifier?` — ${d.specifier}`:""}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 3 — COMPLAINTS ══ */}
        {tab===3 && (
          <div style={card}>
            <SectionTitle icon="🗣" title="Presenting Complaints" color="#d97706"/>
            <div style={{background:"#fffbeb",borderRadius:8,padding:"10px 12px",marginBottom:16,border:"1px solid #fde68a"}}>
              <p style={{margin:0,fontSize:12,color:"#92400e"}}>
                Complaints auto-suggested based on diagnoses in Tab 2. Tick all that apply. Add custom complaints below.
              </p>
            </div>
            <div style={{marginBottom:16,flexWrap:"wrap",display:"flex"}}>
              {getAutoComplaints().map(c=>(
                <Chip key={c} label={c} selected={complaints.includes(c)}
                  onClick={()=>setComplaints(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])}
                  color="#d97706"/>
              ))}
            </div>
            <Field label="Add custom complaint">
              <div style={{display:"flex",gap:8}}>
                <input id="custom-complaint" style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none"}} placeholder="Type complaint and press Add"/>
                <button onClick={()=>{
                  const v=document.getElementById("custom-complaint").value.trim();
                  if(v&&!complaints.includes(v)){setComplaints(p=>[...p,v]);document.getElementById("custom-complaint").value="";}
                }} style={{padding:"9px 16px",borderRadius:8,background:"#d97706",color:"white",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  Add
                </button>
              </div>
            </Field>
            {complaints.length>0&&(
              <div style={{background:"#f8fafc",borderRadius:8,padding:"12px 14px",border:"1px solid #e2e8f0"}}>
                <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:"#64748b"}}>Selected ({complaints.length}):</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {complaints.map(c=>(
                    <span key={c} style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:99,
                      padding:"3px 10px",fontSize:11,color:"#92400e",display:"flex",alignItems:"center",gap:4}}>
                      {c}
                      <button onClick={()=>setComplaints(p=>p.filter(x=>x!==c))}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#d97706",fontSize:14,padding:0,lineHeight:1}}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 4 — SYMPTOMS ══ */}
        {tab===4 && (
          <div style={card}>
            <SectionTitle icon="📝" title="Symptoms — History, Examination & Observation" color="#0891b2"/>
            {[
              {key:"history",icon:"📖",label:"History",color:"#0891b2",bg:"#ecfeff"},
              {key:"examination",icon:"🔍",label:"On Examination",color:"#7c3aed",bg:"#faf5ff"},
              {key:"observation",icon:"👁️",label:"On Observation",color:"#d97706",bg:"#fffbeb"},
            ].map(section=>{
              const auto = getAutoSymptoms()[section.key]||[];
              const selected = symptoms[section.key];
              return (
                <div key={section.key} style={{background:section.bg,borderRadius:10,
                  padding:"14px",marginBottom:14,border:`1.5px solid ${section.color}30`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                    <span style={{fontSize:18}}>{section.icon}</span>
                    <span style={{fontSize:13,fontWeight:700,color:section.color}}>{section.label}</span>
                    <span style={{fontSize:10,color:"#94a3b8",marginLeft:4}}>({selected.length} selected)</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap"}}>
                    {auto.map(s=>(
                      <Chip key={s} label={s}
                        selected={selected.includes(s)}
                        onClick={()=>setSymptoms(p=>({...p,[section.key]:p[section.key].includes(s)?p[section.key].filter(x=>x!==s):[...p[section.key],s]}))}
                        color={section.color}/>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TAB 5 — SYMPTOM GRADING ══ */}
        {tab===5 && (
          <div style={card}>
            <SectionTitle icon="📊" title="Symptom Grading — Intensity, Frequency, Disability" color="#dc2626"/>
            {[...symptoms.history,...symptoms.examination,...symptoms.observation].length===0 ? (
              <div style={{textAlign:"center",padding:32,color:"#94a3b8"}}>
                <p style={{fontSize:14}}>No symptoms selected yet.</p>
                <p style={{fontSize:12}}>Go to Tab 4 — Symptoms and select the relevant symptoms first.</p>
              </div>
            ) : (
              <div>
                <div style={{background:"#fef2f2",borderRadius:8,padding:"10px 12px",marginBottom:14,border:"1px solid #fecaca"}}>
                  <p style={{margin:0,fontSize:12,color:"#dc2626"}}>
                    Rate each symptom on CGI-S (0=absent, 1-7), frequency, and disability level.
                  </p>
                </div>
                {[...symptoms.history,...symptoms.examination,...symptoms.observation].map(sym=>(
                  <div key={sym} style={{background:"#f8fafc",borderRadius:10,padding:"14px",marginBottom:10,border:"1px solid #e2e8f0"}}>
                    <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#374151"}}>{sym}</p>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      <Field label="CGI-S Intensity (0-7)">
                        <select value={symptomGrades[sym]?.intensity||0}
                          onChange={e=>setSymptomGrades(p=>({...p,[sym]:{...(p[sym]||{}),intensity:Number(e.target.value)}}))}
                          style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,background:"white"}}>
                          {[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n} — {CGI_S_LABELS[n]||"Absent"}</option>)}
                        </select>
                      </Field>
                      <Field label="Frequency">
                        <Select value={symptomGrades[sym]?.frequency||""}
                          onChange={v=>setSymptomGrades(p=>({...p,[sym]:{...(p[sym]||{}),frequency:v}}))}
                          options={["Daily","Several times/week","Weekly","Fortnightly","Monthly","Episodic","Constant"]}/>
                      </Field>
                      <Field label="Disability">
                        <Select value={symptomGrades[sym]?.disability||""}
                          onChange={v=>setSymptomGrades(p=>({...p,[sym]:{...(p[sym]||{}),disability:v}}))}
                          options={["None","Mild — manageable","Moderate — interferes","Severe — major impairment","Extreme — total impairment"]}/>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 6 — SCALES ══ */}
        {tab===6 && (
          <div style={card}>
            <SectionTitle icon="🧪" title="Psychometric Scales & Test Scores" color="#0d5c6e"/>
            <div style={{marginBottom:16}}>
              <p style={{fontSize:12,color:"#64748b",marginBottom:8}}>Select scales administered:</p>
              <div style={{display:"flex",flexWrap:"wrap"}}>
                {SCALES.map(s=>(
                  <Chip key={s.id} label={s.id} selected={usedScales.includes(s.id)}
                    onClick={()=>setUsedScales(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])}/>
                ))}
              </div>
            </div>
            {usedScales.map(sid=>{
              const scale = SCALES.find(s=>s.id===sid);
              if (!scale) return null;
              const scores = scaleScores[sid]||{};
              const fsiq = scores["Full Scale IQ"]||scores["Total Score"]||scores["Adaptive Behavior Composite"]||"";
              const classification = fsiq ? scale.classify(Number(fsiq)) : "";
              return (
                <div key={sid} style={{background:"#f8fafc",borderRadius:10,padding:"14px",marginBottom:12,border:"1px solid #e2e8f0"}}>
                  <p style={{margin:"0 0 12px",fontSize:13,fontWeight:700,color:"#0d3b47"}}>{scale.name}</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,marginBottom:8}}>
                    {scale.fields.map(f=>(
                      <Field key={f} label={f}>
                        <Input value={scores[f]||""}
                          onChange={v=>setScaleScores(p=>({...p,[sid]:{...(p[sid]||{}),[f]:v}}))}
                          placeholder="Enter score"/>
                      </Field>
                    ))}
                  </div>
                  {classification && (
                    <div style={{background:"#eff6ff",borderRadius:8,padding:"8px 12px",border:"1px solid #bfdbfe"}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#1d4ed8"}}>Classification: {classification}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TAB 7 — FAMILY PEDIGREE ══ */}
        {tab===7 && (
          <div style={card}>
            <SectionTitle icon="👨‍👩‍👧" title="Family Structure — Pedigree Chart" color="#7c3aed"/>
            <PedigreeChart
              members={familyMembers}
              onAdd={addFamilyMember}
              onUpdate={updateFamilyMember}
              onRemove={removeFamilyMember}
              childName={ci.name}/>
          </div>
        )}

        {/* ══ TAB 8 — MEDICAL ══ */}
        {tab===8 && (
          <div style={card}>
            <SectionTitle icon="🩺" title="Medical Findings & Investigations" color="#dc2626"/>
            {[
              {k:"neurological",label:"Neurological Examination Findings",placeholder:"Higher functions, cranial nerves, motor system, sensory system, cerebellar, gait..."},
              {k:"physical",label:"Physical Examination Findings",placeholder:"General appearance, vitals, systemic examination..."},
              {k:"eeg",label:"EEG Findings",placeholder:"Normal/Abnormal, focal/generalised changes, epileptiform activity..."},
              {k:"mri",label:"MRI / CT Brain Findings",placeholder:"Normal study / abnormalities noted..."},
              {k:"labs",label:"Laboratory Investigations",placeholder:"CBC, LFT, RFT, TFT, blood levels, genetic reports..."},
              {k:"other",label:"Other Medical Findings",placeholder:"Ophthalmology, audiology, other specialist reports..."},
            ].map(({k,label,placeholder})=>(
              <Field key={k} label={label}>
                <TextArea value={medFindings[k]||""}
                  onChange={v=>setMedFindings(p=>({...p,[k]:v}))}
                  placeholder={placeholder} rows={3}/>
              </Field>
            ))}
          </div>
        )}

        {/* ══ TAB 9 — MEDICATIONS ══ */}
        {tab===9 && (
          <div style={card}>
            <SectionTitle icon="💊" title="Medications — Current & Past" color="#7c3aed"/>

            {/* Add new drug to master list */}
            <div style={{background:"#faf5ff",borderRadius:10,padding:"12px 14px",marginBottom:16,border:"1px solid #ddd6fe"}}>
              <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:"#6d28d9"}}>Add new drug to master list (shared with all CIBS clinicians):</p>
              <div style={{display:"flex",gap:8}}>
                <Input value={newDrug} onChange={setNewDrug} placeholder="Drug name (generic)" style={{flex:1}}/>
                <button onClick={addDrug}
                  style={{padding:"9px 16px",borderRadius:8,background:"#7c3aed",color:"white",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                  + Add
                </button>
              </div>
            </div>

            {/* Medication entries */}
            <div style={{marginBottom:12}}>
              {medications.map((med,i)=>(
                <div key={med.id} style={{background:"#f8fafc",borderRadius:10,padding:"14px",marginBottom:10,border:"1px solid #e2e8f0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#374151"}}>Medication {i+1}</span>
                    <button onClick={()=>removeMed(med.id)}
                      style={{padding:"4px 10px",borderRadius:6,border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",fontSize:11,cursor:"pointer"}}>
                      Remove
                    </button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8}}>
                    <Field label="Drug Name">
                      <select value={med.drug} onChange={e=>updateMed(med.id,"drug",e.target.value)}
                        style={{width:"100%",padding:"9px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,background:"white"}}>
                        <option value="">Select drug...</option>
                        {drugList.map(d=><option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>
                    <Field label="Dose">
                      <Input value={med.dose} onChange={v=>updateMed(med.id,"dose",v)} placeholder="e.g. 10mg"/>
                    </Field>
                    <Field label="Frequency">
                      <Select value={med.frequency} onChange={v=>updateMed(med.id,"frequency",v)}
                        options={["Once daily","Twice daily","Three times daily","Four times daily","At bedtime","Morning only","As needed","Weekly"]}/>
                    </Field>
                    <Field label="Duration">
                      <Input value={med.duration} onChange={v=>updateMed(med.id,"duration",v)} placeholder="e.g. 3 months"/>
                    </Field>
                  </div>
                  <Field label="Notes">
                    <Input value={med.notes} onChange={v=>updateMed(med.id,"notes",v)} placeholder="Special instructions, monitoring required..."/>
                  </Field>
                </div>
              ))}
              <button onClick={addMedication}
                style={{width:"100%",padding:"12px",borderRadius:10,border:"2px dashed #7c3aed",
                  background:"white",color:"#7c3aed",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                + Add Medication
              </button>
            </div>
          </div>
        )}

        {/* ══ TAB 10 — PLAN ══ */}
        {tab===10 && (
          <div>
            {/* CGI */}
            <div style={card}>
              <SectionTitle icon="📊" title="Clinical Global Impression" color="#0d5c6e"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <CGISlider value={cgiS} onChange={setCgiS} labels={CGI_S_LABELS}
                  title="CGI-S — Severity of Illness (this session)" color="#0d5c6e"/>
                <CGISlider value={cgiI} onChange={setCgiI} labels={CGI_I_LABELS}
                  title="CGI-I — Global Improvement (vs last session)" color="#10b981"/>
              </div>
              {prevSession?.cgi_s && (
                <div style={{background:"#f0f9ff",borderRadius:8,padding:"10px 12px",marginTop:12,border:"1px solid #bae6fd"}}>
                  <p style={{margin:0,fontSize:12,color:"#0369a1"}}>
                    Previous session CGI-S: <strong>{prevSession.cgi_s}</strong> ({CGI_S_LABELS[prevSession.cgi_s]||"—"})
                    {cgiS>0&&prevSession.cgi_s&&(
                      <span style={{marginLeft:8,fontWeight:700,color:Number(cgiS)<Number(prevSession.cgi_s)?"#10b981":"#ef4444"}}>
                        {Number(cgiS)<Number(prevSession.cgi_s)?"↓ Improved":"↑ Worsened"}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Clinical note */}
            <div style={card}>
              <SectionTitle icon="📝" title="Clinical Impression & Formulation" color="#374151"/>
              <Field label="Integrated Clinical Formulation">
                <TextArea value={clinicianNote} onChange={setClinicianNote}
                  placeholder="Integrated clinical formulation based on history, examination, assessment findings..."
                  rows={5}/>
              </Field>
            </div>

            {/* AI Plan */}
            <div style={card}>
              <SectionTitle icon="🤖" title="AI-Generated Management Plan" color="#0d9488"/>
              {weeklyData?.weeks?.length>0 && (
                <div style={{background:"#f0fdf4",borderRadius:8,padding:"8px 12px",marginBottom:12,border:"1px solid #86efac"}}>
                  <p style={{margin:0,fontSize:11,color:"#15803d"}}>
                    ✅ {weeklyData.weeks.length} weeks of parent tracking data will be incorporated into the AI plan.
                  </p>
                </div>
              )}
              <button onClick={handleGeneratePlan} disabled={generatingPlan}
                style={{width:"100%",padding:"12px",borderRadius:10,border:"none",
                  background:generatingPlan?"#94a3b8":"linear-gradient(135deg,#0d5c6e,#0d9488)",
                  color:"white",fontSize:13,fontWeight:700,cursor:generatingPlan?"wait":"pointer",marginBottom:14}}>
                {generatingPlan?"🤖 Generating AI Plan...":"🤖 Generate AI Management Plan"}
              </button>

              {[
                {k:"pharmacological",label:"Pharmacological Management",icon:"💊",color:"#7c3aed"},
                {k:"nonPharmacological",label:"Non-Pharmacological Interventions",icon:"🧠",color:"#0d9488"},
                {k:"referrals",label:"Referrals",icon:"📋",color:"#d97706"},
                {k:"investigations",label:"Investigations Advised",icon:"🔬",color:"#0891b2"},
                {k:"prognosis",label:"Prognosis",icon:"📈",color:"#10b981"},
              ].map(({k,label,icon,color})=>(
                <Field key={k} label={`${icon} ${label}`}>
                  <TextArea value={plan[k]||""} onChange={v=>setPlan(p=>({...p,[k]:v}))} rows={3}
                    placeholder={`${label}...`}/>
                </Field>
              ))}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Field label="📅 Follow-Up Date">
                  <Input type="date" value={plan.followUpDate||""} onChange={v=>setPlan(p=>({...p,followUpDate:v}))}/>
                </Field>
                <Field label="Next Appointment Type">
                  <Select value={plan.followUpType||""} onChange={v=>setPlan(p=>({...p,followUpType:v}))}
                    options={["OPD Review","Repeat Psychometry","School Visit","Telemedicine","Family Counselling Session","Medication Review Only"]}/>
                </Field>
              </div>
            </div>

            {/* Submit */}
            <div style={{...card,background:"#f0fdf4",border:"1.5px solid #86efac"}}>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={submitToDatabank} disabled={saving||!ci.fileNo}
                  style={{flex:1,padding:"14px",borderRadius:10,border:"none",fontSize:14,fontWeight:800,
                    background:dbSubmitted?"#10b981":"linear-gradient(135deg,#0d5c6e,#0d9488)",
                    color:"white",cursor:"pointer"}}>
                  {saving?"Saving...":dbSubmitted?"✅ Saved to CIBS Databank":"☁️ Save to CIBS Databank"}
                </button>
                {ci.fileNo && (
                  <>
                    <a href={`https://esmart-report.vercel.app?reg=${ci.fileNo}&mode=clinical`}
                      target="_blank" rel="noopener noreferrer"
                      style={{flex:1,padding:"14px",borderRadius:10,background:"#1e3a5f",color:"white",
                        fontSize:14,fontWeight:800,textDecoration:"none",textAlign:"center",display:"flex",
                        alignItems:"center",justifyContent:"center"}}>
                      🏥 Clinical Report →
                    </a>
                    <a href={`https://esmart-report.vercel.app?reg=${ci.fileNo}&mode=family`}
                      target="_blank" rel="noopener noreferrer"
                      style={{flex:1,padding:"14px",borderRadius:10,background:"#0d9488",color:"white",
                        fontSize:14,fontWeight:800,textDecoration:"none",textAlign:"center",display:"flex",
                        alignItems:"center",justifyContent:"center"}}>
                      👨‍👩‍👧 Family Report →
                    </a>
                    <a href={`https://esmart-weekly.vercel.app?reg=${ci.fileNo}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{flex:1,padding:"14px",borderRadius:10,background:"#d97706",color:"white",
                        fontSize:14,fontWeight:800,textDecoration:"none",textAlign:"center",display:"flex",
                        alignItems:"center",justifyContent:"center"}}>
                      📱 Weekly Tracker →
                    </a>
                  </>
                )}
              </div>
              <p style={{margin:"10px 0 0",fontSize:11,color:"#64748b",textAlign:"center"}}>
                CIBS Nagpur · Dr. Shailesh V. Pangaonkar · {today}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
