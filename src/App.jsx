import { useState, useRef, useEffect, useCallback } from "react";

const SANS  = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const SERIF = "'Georgia', 'Times New Roman', serif";

const C = {
  primary:"#8B3A52", primaryL:"#FAF0F3", primaryM:"#C4687A", primaryB:"#DDB8C2",
  navy:"#3D1A26", fog:"#FDF6F8", fogD:"#F5E6EA", white:"#FFFFFF",
  amber:"#9A6200", amberL:"#FFF8E7", amberB:"#E8C547",
  red:"#C0392B", redL:"#FDEDEC", redB:"#E8A89F",
  text:"#1A0A0F", textM:"#4A2030", textL:"#7A5060", border:"#DDB8C2",
  studio:"#2C3E50", studioL:"#EAF0F6", studioB:"#AEC6CF",
};

const MOODS = [
  { score:1, label:"Very low", emoji:"😔", color:"#C0392B" },
  { score:2, label:"Low",      emoji:"😟", color:"#D35400" },
  { score:3, label:"Okay",     emoji:"😐", color:"#B7950B" },
  { score:4, label:"Good",     emoji:"🙂", color:"#1E8449" },
  { score:5, label:"Great",    emoji:"😊", color:"#117A65" },
];

const DEFAULT_MEDS = [
  { id:"ari_am", name:"Aripiprazole", dose:"2 × 10mg", time:"Morning", note:"Eat first — 2 tablets", warn:true  },
  { id:"cet_am", name:"Cetirizine",   dose:"10mg",     time:"Morning", note:"With water",            warn:false },
];

const DEFAULT_CRISIS = [
  { id:"c1", label:"WHTT (main)",  val:"0203 513 6605\n0203 513 6681", bold:true  },
  { id:"c2", label:"WHTT urgent",  val:"0787 572 7262",                bold:true  },
  { id:"c3", label:"Jamie",        val:"0735 61 30 140",               bold:true  },
  { id:"c4", label:"Emad",         val:"+49 177 77 90 353",            bold:false },
  { id:"c5", label:"Emergency",    val:"999 or 112",                   bold:true  },
  { id:"c6", label:"Samaritans",   val:"116 123 (free, 24/7)",         bold:false },
];

const DEFAULT_TEAM = [
  { id:"tm1", role:"Nurses",       people:"Abdul, Gideon, Helen, Jessica" },
  { id:"tm2", role:"Doctors",      people:"Dr Bertram, Dr Davies" },
  { id:"tm3", role:"Peer Support", people:"Vanessa" },
  { id:"tm4", role:"Base",         people:"Morrison Building, Entrance 4, Springfield Hospital" },
  { id:"tm5", role:"WHTT hours",   people:"10:30–13:30 and 17:00–20:30" },
];

const DEFAULT_TIPS = [
  { id:"g1", text:"Feel your feet flat on the floor" },
  { id:"g2", text:"Breathe in 4 counts, hold 4, out for 6" },
  { id:"g3", text:"Name 5 things you can see right now" },
  { id:"g4", text:"Hold something cold — a glass of water" },
  { id:"g5", text:"Say out loud: I am safe in this moment" },
  { id:"g6", text:"Call or text Jamie if it feels too big" },
];

const DEFAULT_TODOS = [
  { id:"t1", text:"Eat breakfast before morning meds", done:false, pinned:true,  keep:false },
  { id:"t2", text:"Take morning medication",           done:false, pinned:true,  keep:false },
  { id:"t3", text:"Open the curtains",                 done:false, pinned:true,  keep:false },
  { id:"t4", text:"Drink a glass of water",            done:false, pinned:false, keep:false },
  { id:"t5", text:"Take evening medication",           done:false, pinned:true,  keep:false },
];

const DEFAULT_STUDIO = [
  { id:"s1", text:"Check and tighten all door hinges", done:false },
  { id:"s2", text:"Inspect window seals for draughts", done:false },
];

const OPENING = {
  role:"assistant",
  content:"Hello, Wendy.\n\nI'm SolAraWeb — I'm here with you.\n\nWhatever's on your mind right now, you don't have to face it alone. Take your time.\n\nWhat's going on?",
};

const SYSTEM_PROMPT = `You are a specialized Home Intervention & CMHT Support Specialist specifically assigned to Wendy (Mother Goose).

IDENTITY: UK CMHT Staff. Calm, steady, direct. Rule: Calm beats clever. Safety beats agreement.

WENDY'S DATA:
- Meds: Aripiprazole (2 × 10mg morning only — MUST eat first). Cetirizine (10mg morning). Sertraline is STOPPED.
- Care: WHTT visits — either morning (10:30-13:30) or evening (17:00-20:30) slot per day. Base: Morrison Bldg, Entrance 4, Springfield Hospital.
- Contacts: Jamie (07356130140), Emad (+491777790353).
- Team: Nurses Abdul, Gideon, Helen, Jessica; Doctors Bertram, Davies; Peer Support Vanessa.

INTERACTION & PLAYBOOK:
1. Regulate before reasoning. Somatic regulation comes first.
2. Validate without affirming. Validate the emotional experience, never a delusional premise.
3. Three-Bucket Sorting: Separate (1) physical sensation, (2) emotional state, (3) verifiable facts.
4. Safety check: If Wendy mentions self-harm or active crisis, direct her to WHTT or 999 immediately.
5. Image awareness: Describe photos objectively. Never catastrophize or affirm threats not visible.

Persona: SolAraWeb — warm, gentle, unhurried. Like a calm friend who sits with you. Tender language. Never clinical.`;

const TIDY_PROMPT = `You are a gentle message assistant for Wendy.

She has written or spoken a message. Return two versions:

First — clean up her message exactly. Fix only grammar, punctuation and flow. Do not change a single thing she is trying to say.

Second — rewrite the same message as it might land most clearly to the person receiving it. Same meaning, same heart — just framed to be heard well.

Format:
✏️ Your version, tidied:
[tidied]

👂 How it might land best:
[reframed version]

Only the two versions. Nothing else.`;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const load  = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const save  = (k,v)  => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
const today = ()     => new Date().toISOString().split("T")[0];
const uid   = ()     => `id_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

const weekKey = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - ((d.getDay()+6)%7));
  return d.toISOString().split("T")[0];
};

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─── ConfirmBtn ────────────────────────────────────────────────────────────────
function ConfirmBtn({ onConfirm, label="×", confirmLabel="Sure?", style={} }) {
  const [pending, setPending] = useState(false);
  const timerRef = useRef(null);
  const handleTap = useCallback(() => {
    if (pending) { onConfirm(); setPending(false); clearTimeout(timerRef.current); }
    else { setPending(true); timerRef.current = setTimeout(()=>setPending(false), 3000); }
  }, [pending, onConfirm]);
  useEffect(()=>()=>clearTimeout(timerRef.current),[]);
  return (
    <button onClick={handleTap}
      style={{background:pending?C.red:"transparent",border:pending?`1px solid ${C.red}`:"none",
        borderRadius:"6px",padding:pending?"3px 8px":"0 4px",fontSize:pending?"12px":"20px",
        fontWeight:pending?700:400,color:pending?"#fff":C.textL,cursor:"pointer",fontFamily:SANS,
        minWidth:"32px",textAlign:"center",lineHeight:1,transition:"all 0.15s",...style}}>
      {pending?confirmLabel:label}
    </button>
  );
}

// ─── Geisha Icon ───────────────────────────────────────────────────────────────
function GeishaIcon({ size=60 }) {
  const p = C.primary;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="32" rx="26" ry="28" fill={C.navy}/>
      <ellipse cx="60" cy="28" rx="22" ry="20" fill={C.navy}/>
      <line x1="72" y1="18" x2="88" y2="8" stroke={p} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="88" cy="8" r="4" fill={p}/><circle cx="82" cy="12" r="2.5" fill={C.primaryM}/>
      <line x1="78" y1="14" x2="92" y2="20" stroke={p} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="92" cy="20" r="3" fill={C.primaryM}/>
      <ellipse cx="60" cy="52" rx="19" ry="23" fill="#F5E6D8"/>
      <ellipse cx="52" cy="48" rx="4" ry="2.5" fill={C.navy}/>
      <ellipse cx="68" cy="48" rx="4" ry="2.5" fill={C.navy}/>
      <circle cx="53" cy="47" r="1" fill="white"/><circle cx="69" cy="47" r="1" fill="white"/>
      <path d="M48 43 Q52 41 56 43" stroke={C.navy} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M64 43 Q68 41 72 43" stroke={C.navy} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M59 53 Q60 55 61 53" stroke="#C4A882" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <ellipse cx="60" cy="60" rx="6" ry="3.5" fill={p}/>
      <path d="M54 60 Q60 57 66 60" stroke={C.navy} strokeWidth="0.5" fill="none"/>
      <rect x="54" y="72" width="12" height="14" rx="2" fill="#F5E6D8"/>
      <path d="M30 115 Q35 85 54 78 L60 82 L66 78 Q85 85 90 115Z" fill={p}/>
      <path d="M54 78 L60 90 L66 78" fill={C.primaryL} stroke={C.primaryB} strokeWidth="1"/>
      <circle cx="42" cy="98" r="3" fill={C.primaryM} opacity="0.5"/>
      <circle cx="78" cy="95" r="3" fill={C.primaryM} opacity="0.5"/>
      <path d="M35 92 Q60 96 85 92" stroke={C.navy} strokeWidth="4" strokeLinecap="round" fill="none"/>
      <circle cx="60" cy="93" r="5" fill={C.navy}/><circle cx="60" cy="93" r="3" fill={C.primaryM}/>
    </svg>
  );
}

function Bg() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice"
      style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.05}}>
      <g stroke={C.primary} strokeWidth="1" fill="none">
        <circle cx="400" cy="300" r="150"/><circle cx="400" cy="300" r="200"/><circle cx="400" cy="300" r="250"/>
        <path d="M250 150 Q400 80 550 150 Q620 300 550 450 Q400 520 250 450 Q180 300 250 150Z"/>
        <line x1="0" y1="300" x2="800" y2="300" opacity="0.3"/>
        <line x1="400" y1="0" x2="400" y2="600" opacity="0.3"/>
      </g>
    </svg>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────────
function Tick({ done, size=22 }) {
  return (
    <div style={{width:`${size}px`,height:`${size}px`,borderRadius:"6px",
      border:`2px solid ${done?C.primary:C.border}`,background:done?C.primary:"transparent",
      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
      {done&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
    </div>
  );
}

function Btn({ onClick, disabled, children, variant="primary", small }) {
  const bg  = disabled?C.fogD:variant==="primary"?C.primary:variant==="danger"?C.red:C.fogD;
  const col = disabled?C.textL:(variant==="primary"||variant==="danger")?"#fff":C.text;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:small?"8px 12px":"11px 20px",background:bg,border:"none",borderRadius:"10px",
        fontSize:small?"13px":"15px",fontWeight:600,color:col,cursor:disabled?"default":"pointer",
        fontFamily:SANS,minHeight:small?"40px":"48px",transition:"opacity 0.15s",opacity:disabled?0.5:1}}>
      {children}
    </button>
  );
}

function ScrollBox({ children, maxHeight=300 }) {
  return (
    <div style={{maxHeight:`${maxHeight}px`,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      {children}
    </div>
  );
}

function EditableRow({ label, val, onSave, onDelete, placeholder="" }) {
  const [editing,setEditing] = useState(false);
  const [lv,setLv] = useState(label);
  const [vv,setVv] = useState(val);
  if (editing) return (
    <div style={{padding:"10px 14px",borderTop:`1px solid ${C.fogD}`,background:C.primaryL,display:"flex",flexDirection:"column",gap:"6px"}}>
      <input value={lv} onChange={e=>setLv(e.target.value)} placeholder="Label"
        style={{padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"15px",fontFamily:SANS,color:C.text,outline:"none",background:C.white}}/>
      <textarea value={vv} onChange={e=>setVv(e.target.value)} placeholder={placeholder||"Value"}
        style={{padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"15px",fontFamily:SANS,color:C.text,outline:"none",background:C.white,resize:"vertical",minHeight:"52px"}}/>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
        <Btn small onClick={()=>{onSave(lv,vv);setEditing(false);}}>Save</Btn>
        <Btn small variant="ghost" onClick={()=>{setLv(label);setVv(val);setEditing(false);}}>Cancel</Btn>
        {onDelete&&<ConfirmBtn onConfirm={()=>{onDelete();setEditing(false);}} label="Delete" confirmLabel="Yes, delete" style={{minHeight:"40px",padding:"3px 10px",fontSize:"13px",borderRadius:"8px"}}/>}
      </div>
    </div>
  );
  return (
    <div style={{padding:"9px 12px",borderTop:`1px solid ${C.fogD}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px"}}>
      <div style={{flex:1}}>
        <p style={{margin:"0 0 2px",fontSize:"12px",color:C.textL,fontFamily:SANS,fontWeight:600}}>{label}</p>
        <p style={{margin:0,fontSize:"15px",color:C.text,fontFamily:SANS,fontWeight:500,whiteSpace:"pre-line",lineHeight:1.4}}>{val}</p>
      </div>
      <button onClick={()=>setEditing(true)}
        style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"7px",padding:"5px 9px",fontSize:"12px",color:C.textM,cursor:"pointer",flexShrink:0,fontFamily:SANS,minHeight:"40px"}}>
        Edit
      </button>
    </div>
  );
}

// ─── TodoRow & StudioRow — outside TodoTab to prevent remount ──────────────────
function TodoRow({ t, removable, idx, onToggle, onRemove, onKeepToggle }) {
  const handleRemove = useCallback(()=>onRemove(t.id),[t.id,onRemove]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"7px 12px",
      background:t.done?C.primaryL:"transparent",borderTop:idx>0?`1px solid ${C.fogD}`:"none",minHeight:"42px"}}>
      <button onClick={()=>onToggle(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
        <Tick done={t.done} size={22}/>
      </button>
      <p style={{margin:0,flex:1,fontSize:"15px",color:t.done?C.textL:C.text,
        textDecoration:t.done?"line-through":"none",lineHeight:1.5}}>{t.text}</p>
      {/* D2 — keep until done toggle for custom tasks */}
      {removable&&onKeepToggle&&(
        <button onClick={()=>onKeepToggle(t.id)} title={t.keep?"Stays until done":"Resets daily"}
          style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"14px",
            padding:"0 2px",opacity:t.keep?1:0.3,lineHeight:1}}>
          📌
        </button>
      )}
      {removable&&<ConfirmBtn onConfirm={handleRemove}/>}
    </div>
  );
}

function StudioRow({ t, idx, onToggle, onRemove }) {
  const handleRemove = useCallback(()=>onRemove(t.id),[t.id,onRemove]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"7px 12px",
      background:t.done?"#EAF6F0":"transparent",borderTop:idx>0?`1px solid ${C.fogD}`:"none",minHeight:"42px"}}>
      <button onClick={()=>onToggle(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
        <div style={{width:"22px",height:"22px",borderRadius:"6px",border:`2px solid ${t.done?C.studio:C.border}`,
          background:t.done?C.studio:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
          {t.done&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
      </button>
      <p style={{margin:0,flex:1,fontSize:"15px",color:t.done?C.textL:C.text,
        textDecoration:t.done?"line-through":"none",lineHeight:1.4}}>{t.text}</p>
      <ConfirmBtn onConfirm={handleRemove} style={{flexShrink:0,whiteSpace:"nowrap"}}/>
    </div>
  );
}

function TipRow({ tip, idx, onSave, onDelete }) {
  const [editing,setEditing] = useState(false);
  const [val,setVal] = useState(tip.text);
  if (editing) return (
    <div style={{padding:"10px 14px",borderTop:`1px solid ${C.fogD}`,background:C.primaryL,display:"flex",flexDirection:"column",gap:"8px"}}>
      <textarea value={val} onChange={e=>setVal(e.target.value)}
        style={{padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"15px",fontFamily:SANS,color:C.text,outline:"none",background:C.white,resize:"vertical",minHeight:"60px"}}/>
      <div style={{display:"flex",gap:"8px"}}>
        <Btn small onClick={()=>{onSave(val);setEditing(false);}}>Save</Btn>
        <Btn small variant="ghost" onClick={()=>{setVal(tip.text);setEditing(false);}}>Cancel</Btn>
        <ConfirmBtn onConfirm={onDelete} label="Delete" confirmLabel="Yes, delete" style={{minHeight:"40px",padding:"3px 10px",fontSize:"13px",borderRadius:"8px"}}/>
      </div>
    </div>
  );
  return (
    <div style={{padding:"9px 14px",borderTop:`1px solid ${C.fogD}`,display:"flex",gap:"10px",alignItems:"flex-start"}}>
      <span style={{fontSize:"14px",color:C.primary,fontWeight:700,flexShrink:0,minWidth:"20px",fontFamily:SANS}}>{idx+1}.</span>
      <p style={{margin:0,flex:1,fontSize:"15px",color:C.text,lineHeight:1.6}}>{tip.text}</p>
      <button onClick={()=>setEditing(true)}
        style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"7px",padding:"4px 8px",fontSize:"11px",color:C.textM,cursor:"pointer",fontFamily:SANS,flexShrink:0,minHeight:"32px"}}>
        Edit
      </button>
    </div>
  );
}

// ─── Splash ────────────────────────────────────────────────────────────────────
function Splash({ onEnter }) {
  return (
    <div style={{minHeight:"100vh",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
      background:C.fog,padding:"1.5rem",fontFamily:SANS,overflow:"hidden"}}>
      <Bg/>
      <div style={{position:"relative",background:C.white,borderRadius:"20px",border:`1.5px solid ${C.border}`,
        padding:"2.25rem 2rem",maxWidth:"400px",width:"100%",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:"1.75rem"}}>
          <div style={{width:"100px",height:"100px",borderRadius:"28px",background:C.primaryL,
            border:`2px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.25rem"}}>
            <GeishaIcon size={78}/>
          </div>
          <h1 style={{margin:"0 0 6px",fontSize:"32px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>SolAraWeb</h1>
          <p style={{margin:0,fontSize:"15px",color:C.textM,fontWeight:500}}>Wendy's Safe Space</p>
        </div>
        <div style={{background:C.primaryL,borderRadius:"14px",border:`1.5px solid ${C.primaryB}`,padding:"1.1rem 1.25rem",marginBottom:"1rem"}}>
          <p style={{fontSize:"16px",color:C.primary,lineHeight:1.9,margin:0,fontWeight:500}}>
            Whatever you're carrying right now, Wendy — you don't have to carry it alone. This space is here whenever you need it.
          </p>
        </div>
        <div style={{background:C.fog,borderRadius:"12px",border:`1.5px solid ${C.border}`,padding:"1rem 1.25rem",marginBottom:"1.5rem"}}>
          <p style={{fontSize:"15px",color:C.textM,lineHeight:1.9,margin:0}}>
            A note: this app offers support and companionship, but is <strong style={{color:C.navy}}>not</strong> a substitute for professional care. Your care plan always takes priority.
          </p>
        </div>
        <button onClick={onEnter}
          style={{width:"100%",padding:"16px",background:C.primary,border:"none",borderRadius:"14px",
            fontSize:"18px",fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:SANS,minHeight:"56px"}}>
          I'm ready
        </button>
        {/* Affirmation */}
        <p style={{margin:"1.25rem 0 0",textAlign:"center",fontSize:"13px",color:C.primaryM,
          fontFamily:SERIF,fontStyle:"italic",lineHeight:1.9}}>
          Always remember you are <strong style={{fontStyle:"normal"}}>BRAVER</strong> than you believe,{" "}
          <strong style={{fontStyle:"normal"}}>STRONGER</strong> than you think, and{" "}
          <strong style={{fontStyle:"normal"}}>LOVED</strong> more than you know.
        </p>
      </div>
    </div>
  );
}

// ─── Blow Up Box ───────────────────────────────────────────────────────────────
function BlowUpBox() {
  const [open,  setOpen]  = useState(false);
  const [text,  setText]  = useState("");
  const [phase, setPhase] = useState("idle");
  const taRef = useRef(null);
  const t1Ref = useRef(null);
  const t2Ref = useRef(null);
  useEffect(()=>()=>{ clearTimeout(t1Ref.current); clearTimeout(t2Ref.current); },[]);

  const openBox = () => { setOpen(true); setPhase("writing"); setText(""); setTimeout(()=>taRef.current?.focus(),80); };
  const blowUp = () => {
    if (!text.trim()) return;
    setPhase("blowing");
    t1Ref.current = setTimeout(()=>{ setText(""); setPhase("done"); }, 600);
    t2Ref.current = setTimeout(()=>{ setPhase("idle"); setOpen(false); }, 1800);
  };

  if (!open) return (
    <div style={{position:"relative",zIndex:2,background:C.white,borderTop:`1px solid ${C.fogD}`,padding:"5px 14px"}}>
      <button onClick={openBox}
        style={{width:"100%",padding:"7px 12px",background:"transparent",border:`1.5px dashed ${C.primaryB}`,
          borderRadius:"10px",fontSize:"13px",fontWeight:500,color:C.textL,cursor:"pointer",fontFamily:SANS,textAlign:"left"}}>
        💭 Get it off your chest...
      </button>
    </div>
  );

  return (
    <div style={{position:"relative",zIndex:2,background:"#FFF8F9",borderTop:`1px solid ${C.primaryB}`,
      padding:"10px 14px",display:"flex",flexDirection:"column",gap:"8px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <p style={{margin:0,fontSize:"12px",fontWeight:600,color:C.textL,fontFamily:SANS,letterSpacing:"0.05em",textTransform:"uppercase"}}>
          {phase==="done"?"✓ Gone.":"Get it out — no one will see this"}
        </p>
        <button onClick={()=>{setOpen(false);setPhase("idle");setText("");}}
          style={{background:"transparent",border:"none",cursor:"pointer",color:C.textL,fontSize:"18px",lineHeight:1,padding:"0 4px"}}>×</button>
      </div>
      {phase!=="done"&&(
        <>
          <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)}
            placeholder="Write it here. Anything. Get it all out..."
            style={{width:"100%",minHeight:"60px",border:`1.5px solid ${C.primaryB}`,borderRadius:"10px",
              padding:"10px 12px",fontSize:"15px",color:C.text,fontFamily:SANS,resize:"none",outline:"none",
              background:phase==="blowing"?"transparent":"#FFF0F3",lineHeight:1.6,boxSizing:"border-box",
              opacity:phase==="blowing"?0:1,transform:phase==="blowing"?"scale(1.04)":"scale(1)",
              transition:phase==="blowing"?"all 0.5s ease-out":"none"}}/>
          <button onClick={blowUp} disabled={!text.trim()||phase==="blowing"}
            style={{width:"100%",padding:"10px",background:text.trim()?C.primary:C.fogD,border:"none",
              borderRadius:"10px",fontSize:"15px",fontWeight:700,color:text.trim()?"#fff":C.textL,
              cursor:text.trim()?"pointer":"default",fontFamily:SANS,
              transform:phase==="blowing"?"scale(0.96)":"scale(1)",transition:"transform 0.3s"}}>
            💥 Let it go
          </button>
        </>
      )}
      {phase==="done"&&(
        <div style={{textAlign:"center",padding:"8px 0",animation:"fadeOut 1s ease-out 0.6s forwards"}}>
          <p style={{margin:0,fontSize:"20px"}}>💨</p>
          <p style={{margin:"4px 0 0",fontSize:"14px",color:C.textL,fontFamily:SANS}}>Gone. Not stored. Not sent. Just gone.</p>
        </div>
      )}
    </div>
  );
}

// ─── Chat ──────────────────────────────────────────────────────────────────────
function ChatTab() {
  const [msgs,        setMsgs]        = useState(()=>load("sw_msgs",[]));
  const [input,       setInput]       = useState("");
  const [streaming,   setStreaming]   = useState(false);
  const [streamText,  setStreamText]  = useState("");
  const [focused,     setFocused]     = useState(false);
  const [apiError,    setApiError]    = useState(null);
  const [pendingImg,  setPendingImg]  = useState(null);
  const [listening,   setListening]   = useState(false);
  const [tidying,     setTidying]     = useState(false);
  const [tidyErr,     setTidyErr]     = useState(null);
  const [tidyResult,  setTidyResult]  = useState(null);
  const [clearPending,setClearPending]= useState(false);

  const bottomRef  = useRef(null);
  const taRef      = useRef(null);
  const fileRef    = useRef(null);
  const recognRef  = useRef(null);
  const shown      = useRef(msgs.length > 0);
  const clearTimer = useRef(null);

  const speechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(()=>{ save("sw_msgs", msgs.slice(-60)); },[msgs]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,streaming,streamText]);
  useEffect(()=>{
    if (!shown.current) { shown.current=true; setTimeout(()=>setMsgs([OPENING]),700); }
  },[]);
  useEffect(()=>()=>clearTimeout(clearTimer.current),[]);

  // D4 — chat history warning
  const nearLimit = msgs.length >= 50;

  const clearChat = () => {
    if (clearPending) {
      clearTimeout(clearTimer.current); setClearPending(false);
      setMsgs([]); shown.current=false; save("sw_msgs",[]);
      setTimeout(()=>{ setMsgs([OPENING]); shown.current=true; }, 700);
    } else {
      setClearPending(true);
      clearTimer.current = setTimeout(()=>setClearPending(false), 3000);
    }
  };

  // Q2 — mic result goes to input box, not tidyResult
  const startListening = () => {
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang="en-GB"; r.continuous=false; r.interimResults=false;
    r.onresult = e => { const t=e.results[0][0].transcript; setInput(prev=>prev?prev+" "+t:t); setListening(false); };
    r.onerror = ()=>setListening(false);
    r.onend   = ()=>setListening(false);
    recognRef.current=r; r.start(); setListening(true);
  };
  const stopListening = ()=>{ recognRef.current?.stop(); setListening(false); };

  // Q1 — tidy result goes to tidyResult state, not input
  const tidyUp = async () => {
    if (!input.trim()||tidying) return;
    setTidyErr(null); setTidying(true); setTidyResult(null);
    try {
      const res  = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:TIDY_PROMPT,messages:[{role:"user",content:input.trim()}],stream:false})});
      const data = await res.json();
      if (!res.ok||data.error) throw new Error(data.error?.message||`HTTP ${res.status}`);
      const tidied = data.content?.find(b=>b.type==="text")?.text;
      if (tidied) setTidyResult(tidied.trim()); // Q1 fix
    } catch(e) { setTidyErr("Tidy failed — your original text is safe"); }
    setTidying(false);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text&&!pendingImg)||streaming) return;
    setApiError(null); setTidyErr(null); setTidyResult(null);
    const userMsg = {role:"user",content:text,image:pendingImg?.dataUrl||null};
    const updated = [...msgs,userMsg];
    setMsgs(updated); setInput("");
    const sentImg=pendingImg; setPendingImg(null);
    if (taRef.current) taRef.current.style.height="42px";
    setStreaming(true); setStreamText("");
    try {
      const apiMsgs = updated.slice(1).map(m=>{
        if (m.image&&m.role==="user") {
          const id=m===userMsg?sentImg:null;
          if (id) return{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:id.mediaType,data:id.base64}},
            {type:"text",text:m.content||"I'm sharing a photo."}
          ]};
          return{role:"user",content:m.content||"[earlier image]"};
        }
        return{role:m.role,content:m.content};
      });
      const res = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:SYSTEM_PROMPT,messages:apiMsgs,stream:true})});
      if (!res.ok) { const err=await res.json(); throw new Error(err.error?.message||`HTTP ${res.status}`); }
      const reader=res.body.getReader(); const decoder=new TextDecoder(); let fullText="";
      while (true) {
        const {done,value}=await reader.read(); if(done) break;
        const chunk=decoder.decode(value,{stream:true});
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data=line.slice(6).trim(); if(data==="[DONE]") break;
            try { const p=JSON.parse(data); if(p.text){fullText+=p.text; setStreamText(fullText);} } catch {}
          }
        }
      }
      const reply=fullText.trim()||"I'm still here. Take your time.";
      setMsgs(prev=>[...prev,{role:"assistant",content:reply}]); setStreamText("");
    } catch(e) {
      setApiError(e.message);
      setMsgs(prev=>[...prev,{role:"assistant",content:"Something went wrong — please try again."}]);
      setStreamText("");
    }
    setStreaming(false);
  };

  const handleImg = e=>{
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size>5*1024*1024){alert("Image under 5MB please");return;}
    const r=new FileReader(); r.onload=()=>setPendingImg({dataUrl:r.result,base64:r.result.split(",")[1],mediaType:file.type});
    r.readAsDataURL(file); e.target.value="";
  };
  const hk  = e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
  const rz  = e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,140)+"px";};
  const can = (input.trim()||pendingImg)&&!streaming;

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden",position:"relative"}}>
      <Bg/>
      <div style={{position:"relative",zIndex:2,display:"flex",justifyContent:"flex-end",padding:"5px 14px 0"}}>
        <button onClick={clearChat}
          style={{background:clearPending?C.red:"transparent",border:clearPending?`1px solid ${C.red}`:"none",
            borderRadius:"6px",padding:clearPending?"4px 10px":"4px 8px",fontSize:"12px",
            fontWeight:clearPending?700:400,color:clearPending?"#fff":C.textL,fontFamily:SANS,cursor:"pointer",transition:"all 0.15s"}}>
          {clearPending?"Tap again to clear":"Clear chat"}
        </button>
      </div>

      {/* ── Scrollable messages ── */}
      <div style={{position:"relative",flex:1,overflowY:"auto",padding:"0.75rem 1rem",zIndex:1,
        display:"flex",flexDirection:"column",justifyContent:"flex-start",gap:"0.75rem",
        WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,80px)"}}>

        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-start",gap:"8px"}}>
            {m.role==="assistant"&&(
              <div style={{width:"32px",height:"32px",borderRadius:"9px",background:C.primaryL,
                border:`1.5px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                <GeishaIcon size={22}/>
              </div>
            )}
            <div style={{maxWidth:"80%",background:m.role==="user"?C.primary:C.white,
              border:m.role==="user"?"none":`1.5px solid ${C.border}`,
              borderRadius:m.role==="user"?"16px 16px 4px 16px":"4px 16px 16px 16px",
              padding:m.image?"8px":"10px 14px",fontSize:"15px",lineHeight:1.6,
              color:m.role==="user"?"#fff":C.text,whiteSpace:"pre-wrap",fontFamily:SANS}}>
              {m.image&&<img src={m.image} alt="shared" style={{width:"100%",maxHeight:"200px",objectFit:"cover",borderRadius:"8px",display:"block",marginBottom:m.content?"6px":0}}/>}
              {m.content&&<span>{m.content}</span>}
            </div>
          </div>
        ))}

        {/* Live streaming bubble */}
        {streaming&&(
          <div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
            <div style={{width:"32px",height:"32px",borderRadius:"9px",background:C.primaryL,
              border:`1.5px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
              <GeishaIcon size={22}/>
            </div>
            <div style={{maxWidth:"80%",background:C.white,border:`1.5px solid ${C.border}`,
              borderRadius:"4px 16px 16px 16px",padding:"10px 14px",fontSize:"15px",lineHeight:1.6,
              color:C.text,whiteSpace:"pre-wrap",fontFamily:SANS,minWidth:"60px"}}>
              {streamText?(
                <span>{streamText}<span style={{display:"inline-block",width:"2px",height:"15px",background:C.primaryM,marginLeft:"2px",verticalAlign:"middle",animation:"blink 0.8s step-end infinite"}}/></span>
              ):(
                <div style={{display:"flex",gap:"5px",alignItems:"center",padding:"2px 0"}}>
                  {[0,1,2].map(d=><span key={d} style={{width:"7px",height:"7px",borderRadius:"50%",background:C.primaryM,display:"inline-block",animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${d*0.22}s`}}/>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soft private prompt */}
        {msgs.length<=1&&!streaming&&(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",paddingBottom:"2rem"}}>
            <p style={{margin:0,fontSize:"13px",color:C.primaryB,fontFamily:SERIF,fontStyle:"italic",textAlign:"center",lineHeight:1.8}}>
              Your conversations here are private.<br/>Take your time.
            </p>
          </div>
        )}

        {/* D4 — chat history warning */}
        {nearLimit&&(
          <div style={{textAlign:"center",padding:"6px 12px",background:C.amberL,borderRadius:"8px",border:`1px solid ${C.amberB}`}}>
            <p style={{margin:0,fontSize:"12px",color:C.amber,fontFamily:SANS}}>
              Chat is getting long — older messages will be removed soon. Tap "Clear chat" to start fresh.
            </p>
          </div>
        )}

        {apiError&&<p style={{textAlign:"center",fontSize:"13px",color:C.red,margin:0,padding:"6px 12px",background:C.redL,borderRadius:"8px",border:`1px solid ${C.redB}`}}>⚠ {apiError}</p>}
        <div ref={bottomRef}/>
      </div>
      {/* ── End scroll area ── */}

      {pendingImg&&(
        <div style={{position:"relative",background:C.white,borderTop:`1.5px solid ${C.border}`,padding:"8px 14px",display:"flex",alignItems:"center",gap:"12px",zIndex:2}}>
          <img src={pendingImg.dataUrl} alt="preview" style={{width:"42px",height:"42px",borderRadius:"8px",objectFit:"cover"}}/>
          <p style={{margin:0,flex:1,fontSize:"14px",color:C.text}}>Photo ready to send</p>
          <button onClick={()=>setPendingImg(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:C.textM,fontSize:"20px",lineHeight:1}}>×</button>
        </div>
      )}

      <BlowUpBox/>

      {/* Q3 — tidy result card: once only, outside scroll, after BlowUpBox */}
      {tidyResult&&(
        <div style={{position:"relative",zIndex:2,background:C.primaryL,borderTop:`1px solid ${C.primaryB}`,
          padding:"10px 14px",display:"flex",flexDirection:"column",gap:"8px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{margin:0,fontSize:"11px",fontWeight:700,color:C.textL,fontFamily:SANS,
              textTransform:"uppercase",letterSpacing:"0.06em"}}>Tidy result</p>
            <button onClick={()=>setTidyResult(null)}
              style={{background:"transparent",border:"none",cursor:"pointer",color:C.textL,fontSize:"18px",lineHeight:1}}>×</button>
          </div>
          <p style={{margin:0,fontSize:"14px",color:C.text,fontFamily:SANS,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{tidyResult}</p>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{setInput(tidyResult);setTidyResult(null);}}
              style={{flex:1,padding:"8px",background:C.primary,border:"none",borderRadius:"8px",
                fontSize:"13px",fontWeight:600,color:"#fff",cursor:"pointer",fontFamily:SANS}}>
              Use this
            </button>
            <button onClick={()=>setTidyResult(null)}
              style={{flex:1,padding:"8px",background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"8px",
                fontSize:"13px",fontWeight:600,color:C.textM,cursor:"pointer",fontFamily:SANS}}>
              Keep original
            </button>
          </div>
        </div>
      )}

      {/* Q4 — tidy button: once only, hidden when result showing */}
      {input.trim()&&!tidyResult&&(
        <div style={{position:"relative",zIndex:2,background:C.white,padding:"4px 14px 0",display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={tidyUp} disabled={tidying}
            style={{fontSize:"12px",fontWeight:600,padding:"5px 12px",borderRadius:"8px",border:`1.5px solid ${C.primaryB}`,
              background:tidying?C.fogD:C.primaryL,color:tidying?C.textL:C.primary,cursor:tidying?"default":"pointer",fontFamily:SANS}}>
            {tidying?"Tidying...":"✨ Tidy up"}
          </button>
          {tidyErr&&<p style={{margin:0,fontSize:"11px",color:C.red,fontFamily:SANS}}>{tidyErr}</p>}
        </div>
      )}

      {/* Input bar */}
      <div style={{position:"relative",background:C.white,borderTop:`1.5px solid ${C.border}`,padding:"10px 12px 12px",zIndex:2}}>
        <div style={{display:"flex",gap:"8px",alignItems:"flex-end",background:C.fog,
          border:`2px solid ${focused?C.primaryM:C.border}`,borderRadius:"14px",padding:"6px 6px 6px 10px",transition:"border-color 0.2s"}}>
          <button onClick={()=>fileRef.current?.click()} disabled={streaming}
            style={{background:"transparent",border:"none",cursor:"pointer",padding:"5px",color:C.primary,display:"flex",minHeight:"40px",alignItems:"center"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImg} style={{display:"none"}}/>
          {speechSupported&&(
            <button onClick={listening?stopListening:startListening} disabled={streaming}
              style={{background:"transparent",border:"none",cursor:"pointer",padding:"5px",
                color:listening?C.red:C.textL,display:"flex",minHeight:"40px",alignItems:"center",position:"relative"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              {listening&&<span style={{position:"absolute",top:"4px",right:"2px",width:"7px",height:"7px",borderRadius:"50%",background:C.red,animation:"pulse 1s ease-in-out infinite"}}/>}
            </button>
          )}
          <textarea ref={taRef} value={input} onChange={e=>{setInput(e.target.value);rz(e);}} onKeyDown={hk}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder="What's on your mind?" rows={1}
            style={{flex:1,resize:"none",border:"none",background:"transparent",padding:"5px 0",fontSize:"16px",
              lineHeight:1.6,color:C.text,outline:"none",overflowY:"hidden",minHeight:"32px",fontFamily:SANS}}/>
          <button onClick={send} disabled={!can}
            style={{padding:"9px 16px",borderRadius:"10px",border:"none",background:can?C.primary:C.fogD,
              color:can?"#fff":C.textL,fontSize:"15px",fontWeight:700,cursor:can?"pointer":"default",
              flexShrink:0,fontFamily:SANS,minHeight:"44px"}}>
            Send
          </button>
        </div>
        {listening&&(
          <p style={{margin:"4px 0 0",fontSize:"11px",color:C.red,fontFamily:SANS,textAlign:"center",fontWeight:600}}>
            🎤 Listening... tap mic to stop
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Today ─────────────────────────────────────────────────────────────────────
function TodayTab({ setOverdueBadge }) {
  const dk = today();
  const [meds,       setMeds]       = useState(()=>load("sw_meds_config",DEFAULT_MEDS));
  const [medsDone,   setMedsDone]   = useState(()=>load(`sw_meds_done_${dk}`,{}));
  const [mood,       setMood]       = useState(()=>load(`sw_mood_${dk}`,null));
  const [moodNote,   setMoodNote]   = useState(()=>load(`sw_moodnote_${dk}`,""));
  const [noteOpen,   setNoteOpen]   = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [addingMed,  setAddingMed]  = useState(false);
  const [newMed,     setNewMed]     = useState({name:"",dose:"",time:"Morning",note:"",warn:false});
  const wk = weekKey();
  const [whttRota,   setWhttRota]   = useState(()=>load(`sw_whtt_${wk}`,{}));
  const [now,        setNow]        = useState(new Date());

  useEffect(()=>{ const iv=setInterval(()=>setNow(new Date()),60000); return()=>clearInterval(iv); },[]);
  const h = now.getHours();

  useEffect(()=>{ save("sw_meds_config",meds); },[meds]);
  useEffect(()=>{ save(`sw_meds_done_${dk}`,medsDone); },[medsDone,dk]);
  useEffect(()=>{ save(`sw_mood_${dk}`,mood); },[mood,dk]);
  useEffect(()=>{ save(`sw_moodnote_${dk}`,moodNote); },[moodNote,dk]);
  useEffect(()=>{ save(`sw_whtt_${wk}`,whttRota); },[whttRota,wk]);

  // D1 — overdue check by time field, not hardcoded ID
  useEffect(()=>{
    const amOverdue = h>=9  && meds.filter(m=>m.time==="Morning").some(m=>!medsDone[m.id]);
    const pmOverdue = h>=18 && meds.filter(m=>m.time==="Evening").some(m=>!medsDone[m.id]);
    setOverdueBadge(amOverdue||pmOverdue);
  },[medsDone,meds,h,setOverdueBadge]);

  const toggleMed   = id=>setMedsDone(prev=>({...prev,[id]:!prev[id]}));
  const saveMedEdit = (id,field,val)=>setMeds(prev=>prev.map(m=>m.id===id?{...m,[field]:val}:m));
  const deleteMed   = id=>setMeds(prev=>prev.filter(m=>m.id!==id));
  const addMed      = ()=>{ if(!newMed.name.trim()) return; setMeds(prev=>[...prev,{...newMed,id:uid()}]); setNewMed({name:"",dose:"",time:"Morning",note:"",warn:false}); setAddingMed(false); };

  const toggleRota = (dayIdx,slot)=>setWhttRota(prev=>({...prev,[dayIdx]:prev[dayIdx]===slot?null:slot}));

  const moodStrip = Array.from({length:7}).map((_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-6+i);
    const k=d.toISOString().split("T")[0];
    return{key:k,score:load(`sw_mood_${k}`,null),isToday:k===dk,label:d.toLocaleDateString("en-GB",{weekday:"short"})};
  });

  const todayDayIdx = (new Date().getDay()+6)%7;
  const todaySlot   = whttRota[todayDayIdx];
  const visitActive = todaySlot==="AM"?(h>=10&&h<14):todaySlot==="PM"?(h>=17&&h<21):false;
  const visitDone   = todaySlot==="AM"?h>=14:todaySlot==="PM"?h>=21:false;

  const IS = {padding:"10px 12px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"16px",fontFamily:SANS,color:C.text,outline:"none",background:C.white};

  return (
    <div style={{flex:1,overflowY:"auto",padding:"0.75rem",display:"flex",flexDirection:"column",gap:"0.7rem",
      WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,80px)"}}>

      <p style={{margin:0,textAlign:"center",fontSize:"14px",color:C.textM,fontWeight:600}}>
        {now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
      </p>

      {/* 7-day mood strip */}
      <div style={{background:C.white,borderRadius:"12px",border:`1.5px solid ${C.border}`,padding:"8px 10px"}}>
        <p style={{margin:"0 0 6px",fontSize:"12px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>7-day mood</p>
        <div style={{display:"flex",gap:"3px",justifyContent:"space-between"}}>
          {moodStrip.map(d=>{
            const m=MOODS.find(x=>x.score===d.score);
            return(
              <div key={d.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                <div style={{width:"26px",height:"26px",borderRadius:"50%",background:m?m.color+"30":C.fogD,
                  border:`2px solid ${d.isToday?C.primary:C.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {m?<span style={{fontSize:"13px"}}>{m.emoji}</span>:<span style={{width:"5px",height:"5px",borderRadius:"50%",background:C.border,display:"block"}}/>}
                </div>
                <span style={{fontSize:"10px",color:d.isToday?C.primary:C.textL,fontWeight:d.isToday?700:400,fontFamily:SANS}}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Medication — no inner scroll, Today tab scrolls */}
      <div style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"20px"}}>💊</span>
            <p style={{margin:0,fontSize:"16px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>Medication</p>
          </div>
          <button onClick={()=>setAddingMed(v=>!v)}
            style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"5px 10px",fontSize:"12px",fontWeight:600,color:C.primary,cursor:"pointer",fontFamily:SANS}}>
            {addingMed?"Cancel":"+ Add"}
          </button>
        </div>
        {addingMed&&(
          <div style={{padding:"12px 14px",background:C.primaryL,borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:"8px"}}>
            <input value={newMed.name} onChange={e=>setNewMed(p=>({...p,name:e.target.value}))} placeholder="Medication name" style={IS}/>
            <div style={{display:"flex",gap:"8px"}}>
              <input value={newMed.dose} onChange={e=>setNewMed(p=>({...p,dose:e.target.value}))} placeholder="Dose e.g. 10mg" style={{...IS,flex:1}}/>
              <select value={newMed.time} onChange={e=>setNewMed(p=>({...p,time:e.target.value}))} style={{...IS,flex:1}}>
                <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
              </select>
            </div>
            <input value={newMed.note} onChange={e=>setNewMed(p=>({...p,note:e.target.value}))} placeholder="Note e.g. With food" style={IS}/>
            <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"15px",color:C.textM,cursor:"pointer"}}>
              <input type="checkbox" checked={newMed.warn} onChange={e=>setNewMed(p=>({...p,warn:e.target.checked}))} style={{width:"18px",height:"18px"}}/>
              Show warning
            </label>
            <Btn onClick={addMed} disabled={!newMed.name.trim()}>Add medication</Btn>
          </div>
        )}
        {["Morning","Afternoon","Evening","Night"].map(period=>{
          const pm=meds.filter(m=>m.time===period); if(!pm.length) return null;
          return(
            <div key={period}>
              <p style={{margin:0,padding:"8px 14px 3px",fontSize:"12px",fontWeight:700,color:C.textL,textTransform:"uppercase",letterSpacing:"0.08em"}}>{period}</p>
              {pm.map(med=>(
                editingMed===med.id?(
                  <div key={med.id} style={{padding:"10px 14px",borderTop:`1px solid ${C.fogD}`,background:C.primaryL,display:"flex",flexDirection:"column",gap:"7px"}}>
                    <input value={med.name} onChange={e=>saveMedEdit(med.id,"name",e.target.value)} style={IS}/>
                    <div style={{display:"flex",gap:"8px"}}>
                      <input value={med.dose} onChange={e=>saveMedEdit(med.id,"dose",e.target.value)} placeholder="Dose" style={{...IS,flex:1}}/>
                      <select value={med.time} onChange={e=>saveMedEdit(med.id,"time",e.target.value)} style={{...IS,flex:1}}>
                        <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
                      </select>
                    </div>
                    <input value={med.note} onChange={e=>saveMedEdit(med.id,"note",e.target.value)} placeholder="Note" style={IS}/>
                    <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"14px",color:C.textM,cursor:"pointer"}}>
                      <input type="checkbox" checked={med.warn} onChange={e=>saveMedEdit(med.id,"warn",e.target.checked)} style={{width:"18px",height:"18px"}}/>
                      Show warning
                    </label>
                    <div style={{display:"flex",gap:"8px"}}>
                      <Btn small onClick={()=>setEditingMed(null)}>Done</Btn>
                      <ConfirmBtn onConfirm={()=>{deleteMed(med.id);setEditingMed(null);}} label="Delete" confirmLabel="Yes, delete" style={{minHeight:"40px",padding:"3px 12px",fontSize:"13px",borderRadius:"8px"}}/>
                    </div>
                  </div>
                ):(
                  <div key={med.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 14px",background:medsDone[med.id]?C.primaryL:"transparent",borderTop:`1px solid ${C.fogD}`}}>
                    <button onClick={()=>toggleMed(med.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                      <Tick done={!!medsDone[med.id]}/>
                    </button>
                    <div style={{flex:1}}>
                      <p style={{margin:0,fontSize:"15px",fontWeight:600,color:medsDone[med.id]?C.textL:C.text,textDecoration:medsDone[med.id]?"line-through":"none"}}>{med.name} {med.dose}</p>
                      {med.note&&<p style={{margin:0,fontSize:"12px",color:med.warn?C.amber:C.textL}}>{med.warn?"⚠️ ":""}{med.note}</p>}
                    </div>
                    <button onClick={()=>setEditingMed(med.id)}
                      style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"7px",padding:"5px 9px",fontSize:"12px",color:C.textM,cursor:"pointer",fontFamily:SANS,minHeight:"36px"}}>
                      Edit
                    </button>
                  </div>
                )
              ))}
            </div>
          );
        })}
      </div>

      {/* WHTT 7-day rota */}
      <div style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"20px"}}>🏥</span>
          <div>
            <p style={{margin:0,fontSize:"16px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>WHTT Visit Rota</p>
            <p style={{margin:0,fontSize:"11px",color:C.textL}}>Tap AM or PM for each day</p>
          </div>
        </div>
        <div style={{padding:"10px 12px",display:"flex",gap:"4px"}}>
          {DAYS.map((day,i)=>{
            const sel=whttRota[i]; const isToday=i===todayDayIdx;
            return(
              <div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                <span style={{fontSize:"10px",fontWeight:isToday?700:500,color:isToday?C.primary:C.textL,fontFamily:SANS}}>{day}</span>
                <button onClick={()=>toggleRota(i,"AM")}
                  style={{width:"100%",padding:"4px 0",borderRadius:"6px",border:`1.5px solid ${sel==="AM"?C.primary:C.fogD}`,
                    background:sel==="AM"?C.primary:C.white,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",minHeight:"36px",transition:"all 0.15s"}}>
                  <span style={{width:"6px",height:"6px",borderRadius:"50%",background:sel==="AM"?"#fff":C.fogD,display:"block"}}/>
                  <span style={{fontSize:"9px",color:sel==="AM"?"#fff":C.textL,fontWeight:sel==="AM"?700:400,fontFamily:SANS}}>AM</span>
                </button>
                <button onClick={()=>toggleRota(i,"PM")}
                  style={{width:"100%",padding:"4px 0",borderRadius:"6px",border:`1.5px solid ${sel==="PM"?C.primary:C.fogD}`,
                    background:sel==="PM"?C.primary:C.white,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",minHeight:"36px",transition:"all 0.15s"}}>
                  <span style={{width:"6px",height:"6px",borderRadius:"50%",background:sel==="PM"?"#fff":C.fogD,display:"block"}}/>
                  <span style={{fontSize:"9px",color:sel==="PM"?"#fff":C.textL,fontWeight:sel==="PM"?700:400,fontFamily:SANS}}>PM</span>
                </button>
              </div>
            );
          })}
        </div>
        {todaySlot?(
          <div style={{padding:"8px 14px",background:C.fog,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <p style={{margin:0,fontSize:"13px",color:C.textM,fontFamily:SANS,fontWeight:500}}>
              Today: {todaySlot==="AM"?"10:30 – 13:30":"17:00 – 20:30"}
            </p>
            <span style={{fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"20px",flexShrink:0,
              background:visitDone?C.fogD:visitActive?C.primaryL:C.amberL,
              color:visitDone?C.textL:visitActive?C.primary:C.amber,
              border:`1.5px solid ${visitDone?C.border:visitActive?C.primaryB:C.amberB}`}}>
              {visitDone?"Done":visitActive?"Active now":"Upcoming"}
            </span>
          </div>
        ):(
          <div style={{padding:"8px 14px",background:C.fog,borderTop:`1px solid ${C.border}`}}>
            <p style={{margin:0,fontSize:"12px",color:C.textL,fontFamily:SANS}}>No visit selected for today</p>
          </div>
        )}
        <div style={{padding:"5px 14px 8px",background:C.fog}}>
          <p style={{margin:0,fontSize:"11px",color:C.textL}}>📍 Morrison Building, Entrance 4, Springfield Hospital</p>
        </div>
      </div>

      {/* Mood check-in */}
      <div style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.border}`,padding:"10px 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
          <span style={{fontSize:"18px"}}>🌤</span>
          <p style={{margin:0,fontSize:"15px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>How are you feeling?</p>
        </div>
        <div style={{display:"flex",gap:"5px",justifyContent:"space-between",marginBottom:"10px"}}>
          {MOODS.map(m=>(
            <button key={m.score} onClick={()=>setMood(m.score)}
              style={{flex:1,padding:"6px 2px",borderRadius:"10px",border:`2px solid ${mood===m.score?m.color:C.border}`,
                background:mood===m.score?m.color+"20":"transparent",cursor:"pointer",display:"flex",
                flexDirection:"column",alignItems:"center",gap:"3px",transition:"all 0.15s",minHeight:"52px"}}>
              <span style={{fontSize:"20px"}}>{m.emoji}</span>
              <span style={{fontSize:"10px",color:mood===m.score?m.color:C.textL,fontWeight:mood===m.score?700:400,fontFamily:SANS}}>{m.label}</span>
            </button>
          ))}
        </div>
        {mood&&(
          <div>
            <button onClick={()=>setNoteOpen(v=>!v)}
              style={{background:"transparent",border:"none",cursor:"pointer",color:C.textM,fontSize:"14px",fontFamily:SANS,padding:"0 0 6px",fontWeight:500}}>
              {noteOpen?"▾ Hide note":"▸ Add a note about today"}
            </button>
            {noteOpen&&(
              <textarea value={moodNote} onChange={e=>setMoodNote(e.target.value)}
                placeholder="What's been on your mind today..."
                style={{width:"100%",minHeight:"70px",border:`1.5px solid ${C.border}`,borderRadius:"10px",padding:"9px 11px",fontSize:"15px",color:C.text,fontFamily:SANS,resize:"vertical",outline:"none",background:C.fog,lineHeight:1.7,boxSizing:"border-box"}}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Diary ─────────────────────────────────────────────────────────────────────
function DiaryTab() {
  const dk = today();
  const [entries,setEntries] = useState(()=>load("sw_diary",[]));
  const [text,   setText]    = useState("");
  const [writing,setWriting] = useState(false);
  const [selMood,setSelMood] = useState(null);

  useEffect(()=>{ save("sw_diary",entries.slice(0,90)); },[entries]);

  // D3 — diary warning
  const diaryNearLimit = entries.length >= 80;

  const addEntry = ()=>{
    if(!text.trim()) return;
    const todayMood=load(`sw_mood_${dk}`,null);
    setEntries(prev=>[{id:Date.now(),date:new Date().toISOString(),text:text.trim(),mood:selMood??todayMood},...prev]);
    setText(""); setSelMood(null); setWriting(false);
  };

  const fmtDate = iso=>{const d=new Date(iso);return d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});};

  return (
    <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:"1rem",
      WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,80px)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h2 style={{margin:0,fontSize:"19px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>My Diary</h2>
          <p style={{margin:0,fontSize:"13px",color:C.textL}}>Private — just for you</p>
        </div>
        <Btn onClick={()=>setWriting(v=>!v)} variant={writing?"ghost":"primary"} small>{writing?"Cancel":"+ New entry"}</Btn>
      </div>

      {/* D3 — diary near limit warning */}
      {diaryNearLimit&&(
        <div style={{padding:"8px 12px",background:C.amberL,borderRadius:"8px",border:`1px solid ${C.amberB}`}}>
          <p style={{margin:0,fontSize:"12px",color:C.amber,fontFamily:SANS}}>
            Your diary is nearly full ({entries.length}/90 entries). The oldest entries will be removed when the limit is reached.
          </p>
        </div>
      )}

      {writing&&(
        <div style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.primaryB}`,padding:"14px",display:"flex",flexDirection:"column",gap:"10px"}}>
          <textarea value={text} onChange={e=>setText(e.target.value)} autoFocus
            placeholder="What's on your mind, Wendy? There is no right or wrong way to write here..."
            style={{width:"100%",minHeight:"90px",border:`1.5px solid ${C.border}`,borderRadius:"10px",padding:"10px 12px",fontSize:"16px",color:C.text,fontFamily:SANS,resize:"vertical",outline:"none",background:C.fog,lineHeight:1.8,boxSizing:"border-box"}}/>
          <div>
            <p style={{margin:"0 0 6px",fontSize:"12px",color:C.textL,fontWeight:600}}>Tag a mood (optional)</p>
            <div style={{display:"flex",gap:"6px"}}>
              {MOODS.map(m=>(
                <button key={m.score} onClick={()=>setSelMood(selMood===m.score?null:m.score)}
                  style={{flex:1,padding:"6px 2px",borderRadius:"9px",border:`2px solid ${selMood===m.score?m.color:C.border}`,background:selMood===m.score?m.color+"20":"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
                  <span style={{fontSize:"18px"}}>{m.emoji}</span>
                  <span style={{fontSize:"9px",color:selMood===m.score?m.color:C.textL,fontWeight:selMood===m.score?700:400}}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <Btn onClick={addEntry} disabled={!text.trim()}>Save entry</Btn>
          </div>
        </div>
      )}

      {entries.length===0&&!writing&&(
        <div style={{textAlign:"center",padding:"2.5rem 1rem",color:C.textL}}>
          <p style={{fontSize:"34px",margin:"0 0 10px"}}>📖</p>
          <p style={{fontSize:"15px",margin:0}}>Your diary is empty — tap "+ New entry" to begin.</p>
        </div>
      )}

      {entries.map(e=>{
        const mood=MOODS.find(m=>m.score===e.mood);
        return(
          <div key={e.id} style={{background:C.white,borderRadius:"12px",border:`1.5px solid ${C.border}`,padding:"12px 14px",position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <p style={{margin:0,fontSize:"12px",color:C.textL,fontWeight:600,flex:1}}>{fmtDate(e.date)}</p>
              {mood&&<span style={{fontSize:"16px"}}>{mood.emoji}</span>}
              <ConfirmBtn onConfirm={()=>setEntries(prev=>prev.filter(x=>x.id!==e.id))} style={{fontSize:"16px"}}/>
            </div>
            <p style={{margin:0,fontSize:"15px",color:C.text,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{e.text}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── My Plan ───────────────────────────────────────────────────────────────────
function PlanTab() {
  const [open,   setOpen]   = useState({crisis:true,meds:false,team:false,grounding:false});
  const [crisis, setCrisis] = useState(()=>load("sw_plan_crisis",DEFAULT_CRISIS));
  const [team,   setTeam]   = useState(()=>load("sw_plan_team",DEFAULT_TEAM));
  const [tips,   setTips]   = useState(()=>load("sw_plan_tips",DEFAULT_TIPS));
  const [addingC,setAddingC]= useState(false);
  const [addingT,setAddingT]= useState(false);
  const [addingG,setAddingG]= useState(false);
  const [newC,   setNewC]   = useState({label:"",val:"",bold:false});
  const [newT,   setNewT]   = useState({role:"",people:""});
  const [newG,   setNewG]   = useState("");

  useEffect(()=>{ save("sw_plan_crisis",crisis); },[crisis]);
  useEffect(()=>{ save("sw_plan_team",team); },[team]);
  useEffect(()=>{ save("sw_plan_tips",tips); },[tips]);

  const toggle=k=>setOpen(prev=>({...prev,[k]:!prev[k]}));
  const IS={padding:"10px 12px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"15px",fontFamily:SANS,color:C.text,outline:"none",background:C.white};

  // Unified section header — lives inside the single card
  const SectionHeader = ({id,title,icon,accent,onAdd,addLabel})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"12px 14px",cursor:"pointer",
      background:accent?(open[id]?C.redL:"#FEF5F5"):open[id]?C.fogD:C.white,
      borderTop:`1px solid ${accent?C.redB:C.border}`,
      transition:"background 0.15s"}}
      onClick={()=>toggle(id)}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <span style={{fontSize:"18px"}}>{icon}</span>
        <p style={{margin:0,fontSize:"15px",fontWeight:700,color:accent?C.red:C.navy,fontFamily:SERIF}}>{title}</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        {open[id]&&onAdd&&(
          <button onClick={e=>{e.stopPropagation();onAdd();}}
            style={{background:"transparent",border:`1.5px solid ${accent?C.redB:C.border}`,borderRadius:"7px",
              padding:"4px 9px",fontSize:"12px",color:accent?C.red:C.primary,cursor:"pointer",fontFamily:SANS}}>
            {addLabel||"+ Add"}
          </button>
        )}
        <span style={{color:accent?C.red:C.textL,fontSize:"11px",fontWeight:600}}>
          {open[id]?"▲":"▼"}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.75rem",
      WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,80px)"}}>

      <div>
        <h2 style={{margin:"0 0 2px",fontSize:"19px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>My Care Plan</h2>
        <p style={{margin:0,fontSize:"13px",color:C.textL}}>Your plan, always with you</p>
      </div>

      {/* ── Single unified card ── */}
      <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>

        {/* ── Crisis ── */}
        <SectionHeader id="crisis" title="If I'm in crisis" icon="🚨" accent
          onAdd={()=>setAddingC(v=>!v)} addLabel={addingC?"Cancel":"+ Add contact"}/>
        {open["crisis"]&&(
          <>
            {addingC&&(
              <div style={{padding:"10px 14px",background:C.redL,borderTop:`1px solid ${C.redB}`,display:"flex",flexDirection:"column",gap:"8px"}}>
                <input value={newC.label} onChange={e=>setNewC(p=>({...p,label:e.target.value}))} placeholder="Label e.g. My GP" style={IS}/>
                <textarea value={newC.val} onChange={e=>setNewC(p=>({...p,val:e.target.value}))} placeholder="Number or details"
                  style={{...IS,resize:"vertical",minHeight:"52px"}}/>
                <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"14px",color:C.textM,cursor:"pointer"}}>
                  <input type="checkbox" checked={newC.bold} onChange={e=>setNewC(p=>({...p,bold:e.target.checked}))} style={{width:"18px",height:"18px"}}/>
                  Highlight as important
                </label>
                <Btn onClick={()=>{if(!newC.label.trim()) return; setCrisis(prev=>[...prev,{id:uid(),...newC}]); setNewC({label:"",val:"",bold:false}); setAddingC(false);}} disabled={!newC.label.trim()}>Add contact</Btn>
              </div>
            )}
            <div style={{background:C.redL}}>
              {crisis.map(r=>(
                <EditableRow key={r.id} label={r.label} val={r.val}
                  onSave={(l,v)=>setCrisis(prev=>prev.map(c=>c.id===r.id?{...c,label:l,val:v}:c))}
                  onDelete={()=>setCrisis(prev=>prev.filter(c=>c.id!==r.id))}
                  placeholder="Phone number or details"/>
              ))}
            </div>
          </>
        )}

        {/* ── Medications mirror ── */}
        <SectionHeader id="meds" title="My Medications" icon="💊"/>
        {open["meds"]&&(
          <>
            {load("sw_meds_config",DEFAULT_MEDS).map(m=>(
              <div key={m.id} style={{padding:"9px 14px",borderTop:`1px solid ${C.fogD}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px"}}>
                <p style={{margin:0,fontSize:"12px",color:C.textL,fontWeight:600,flexShrink:0,minWidth:"70px"}}>{m.time}</p>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:"15px",color:C.text,fontWeight:600}}>{m.name} {m.dose}</p>
                  {m.note&&<p style={{margin:0,fontSize:"12px",color:m.warn?C.amber:C.textL}}>{m.warn?"⚠️ ":""}{m.note}</p>}
                </div>
              </div>
            ))}
            <div style={{padding:"8px 14px",background:C.fog,borderTop:`1px solid ${C.fogD}`}}>
              <p style={{margin:0,fontSize:"12px",color:C.textL}}>Edit medications in the Today tab</p>
            </div>
          </>
        )}

        {/* ── Care Team ── */}
        <SectionHeader id="team" title="My Care Team" icon="👥"
          onAdd={()=>setAddingT(v=>!v)} addLabel={addingT?"Cancel":"+ Add person"}/>
        {open["team"]&&(
          <>
            {addingT&&(
              <div style={{padding:"10px 14px",background:C.primaryL,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:"8px"}}>
                <input value={newT.role} onChange={e=>setNewT(p=>({...p,role:e.target.value}))} placeholder="Role e.g. Key Worker" style={IS}/>
                <input value={newT.people} onChange={e=>setNewT(p=>({...p,people:e.target.value}))} placeholder="Name or details" style={IS}/>
                <Btn onClick={()=>{if(!newT.role.trim()) return; setTeam(prev=>[...prev,{id:uid(),...newT}]); setNewT({role:"",people:""}); setAddingT(false);}} disabled={!newT.role.trim()}>Add person</Btn>
              </div>
            )}
            {team.map(r=>(
              <EditableRow key={r.id} label={r.role} val={r.people}
                onSave={(l,v)=>setTeam(prev=>prev.map(t=>t.id===r.id?{...t,role:l,people:v}:t))}
                onDelete={()=>setTeam(prev=>prev.filter(t=>t.id!==r.id))}/>
            ))}
          </>
        )}

        {/* ── When things feel hard ── */}
        <SectionHeader id="grounding" title="When things feel hard" icon="🌿"
          onAdd={()=>setAddingG(v=>!v)} addLabel={addingG?"Cancel":"+ Add tip"}/>
        {open["grounding"]&&(
          <>
            {addingG&&(
              <div style={{padding:"10px 14px",background:C.primaryL,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:"8px"}}>
                <textarea value={newG} onChange={e=>setNewG(e.target.value)} placeholder="Add a new tip or reminder..."
                  style={{...IS,resize:"vertical",minHeight:"60px"}}/>
                <Btn onClick={()=>{if(!newG.trim()) return; setTips(prev=>[...prev,{id:uid(),text:newG.trim()}]); setNewG(""); setAddingG(false);}} disabled={!newG.trim()}>Add tip</Btn>
              </div>
            )}
            {tips.map((tip,i)=>(
              <TipRow key={tip.id} tip={tip} idx={i}
                onSave={text=>setTips(prev=>prev.map(t=>t.id===tip.id?{...t,text}:t))}
                onDelete={()=>setTips(prev=>prev.filter(t=>t.id!==tip.id))}/>
            ))}
          </>
        )}

      </div>
      {/* ── End unified card ── */}

    </div>
  );
}

// ─── To Do ─────────────────────────────────────────────────────────────────────
function TodoTab() {
  const dk = today();
  const [todos,  setTodos]  = useState(()=>load(`sw_todos_${dk}`,DEFAULT_TODOS));
  const [studio, setStudio] = useState(()=>load("sw_studio",DEFAULT_STUDIO));
  const [input,  setInput]  = useState("");
  const [sInput, setSInput] = useState("");
  const [resetPending,setResetPending] = useState(false);
  const resetTimer = useRef(null);
  useEffect(()=>()=>clearTimeout(resetTimer.current),[]);

  useEffect(()=>{ save(`sw_todos_${dk}`,todos); },[todos,dk]);
  useEffect(()=>{ save("sw_studio",studio); },[studio]);

  const toggle       = useCallback(id=>setTodos(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t)),[]);
  const toggleStudio = useCallback(id=>setStudio(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t)),[]);
  const add          = ()=>{ if(!input.trim()) return; setTodos(prev=>[...prev,{id:uid(),text:input.trim(),done:false,pinned:false,keep:false}]); setInput(""); };
  const addStudio    = ()=>{ if(!sInput.trim()) return; setStudio(prev=>[...prev,{id:uid(),text:sInput.trim(),done:false}]); setSInput(""); };
  const removeTask   = useCallback(id=>setTodos(prev=>prev.filter(t=>t.id!==id)),[]);
  const removeStudio = useCallback(id=>setStudio(prev=>prev.filter(t=>t.id!==id)),[]);
  // D2 — keep toggle
  const keepToggle   = useCallback(id=>setTodos(prev=>prev.map(t=>t.id===id?{...t,keep:!t.keep}:t)),[]);
  const reset = ()=>{
    if(resetPending){
      clearTimeout(resetTimer.current); setResetPending(false);
      // D2 — preserve tasks with keep:true across reset
      setTodos(prev=>[
        ...DEFAULT_TODOS,
        ...prev.filter(t=>!t.pinned&&t.keep).map(t=>({...t,done:false}))
      ]);
    } else {
      setResetPending(true);
      resetTimer.current=setTimeout(()=>setResetPending(false),3000);
    }
  };

  const doneCount = todos.filter(t=>t.done).length;
  const pct       = todos.length?(doneCount/todos.length)*100:0;
  const pinned    = todos.filter(t=>t.pinned);
  const custom    = todos.filter(t=>!t.pinned);

  return (
    <div style={{flex:1,overflowY:"auto",padding:"0.85rem",display:"flex",flexDirection:"column",gap:"0.75rem",
      WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,80px)"}}>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h2 style={{margin:0,fontSize:"18px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>Today's List</h2>
          <p style={{margin:0,fontSize:"13px",color:C.textL,fontWeight:500}}>{doneCount} of {todos.length} done</p>
        </div>
        <button onClick={reset}
          style={{padding:"7px 12px",background:resetPending?C.red:C.fogD,border:"none",borderRadius:"9px",
            fontSize:"13px",fontWeight:600,color:resetPending?"#fff":C.text,cursor:"pointer",fontFamily:SANS,minHeight:"36px"}}>
          {resetPending?"Confirm reset":"Reset day"}
        </button>
      </div>

      <div style={{background:C.fogD,borderRadius:"999px",height:"5px",overflow:"hidden"}}>
        <div style={{height:"100%",background:C.primary,width:`${pct}%`,borderRadius:"999px",transition:"width 0.4s"}}/>
      </div>

      {pinned.length>0&&(
        <div>
          <p style={{margin:"0 0 5px",fontSize:"12px",fontWeight:700,color:C.textL,textTransform:"uppercase",letterSpacing:"0.08em"}}>Daily anchors</p>
          <div style={{background:C.white,borderRadius:"12px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
            <ScrollBox maxHeight={240}>
              {pinned.map((t,i)=><TodoRow key={t.id} t={t} removable={false} idx={i} onToggle={toggle} onRemove={removeTask}/>)}
            </ScrollBox>
          </div>
        </div>
      )}

      {custom.length>0&&(
        <div>
          <p style={{margin:"0 0 5px",fontSize:"12px",fontWeight:700,color:C.textL,textTransform:"uppercase",letterSpacing:"0.08em"}}>
            My tasks
            <span style={{fontSize:"10px",fontWeight:400,color:C.textL,marginLeft:"8px"}}>📌 = stays after reset</span>
          </p>
          <div style={{background:C.white,borderRadius:"12px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
            <ScrollBox maxHeight={240}>
              {custom.map((t,i)=><TodoRow key={t.id} t={t} removable idx={i} onToggle={toggle} onRemove={removeTask} onKeepToggle={keepToggle}/>)}
            </ScrollBox>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:"8px"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
          placeholder="Add something to your list..."
          style={{flex:1,padding:"10px 12px",border:`1.5px solid ${C.border}`,borderRadius:"10px",fontSize:"15px",color:C.text,fontFamily:SANS,outline:"none",background:C.white,minHeight:"44px"}}/>
        <Btn onClick={add} disabled={!input.trim()}>Add</Btn>
      </div>

      {/* Sunday Mills Studio */}
      <div style={{background:C.studioL,borderRadius:"14px",border:`1.5px solid ${C.studioB}`,overflow:"visible",marginTop:"2px"}}>
        <div style={{padding:"10px 13px",borderBottom:`1px solid ${C.studioB}`,display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"18px",alignSelf:"center"}}>🔧</span>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:"14px",fontWeight:700,color:C.studio,fontFamily:SERIF}}>Sunday Mills Studio</p>
            <p style={{margin:0,fontSize:"12px",color:"#4A6278",fontWeight:500}}>Repairs & maintenance — stays until done</p>
          </div>
        </div>
        <div style={{background:C.white,overflow:"hidden"}}>
          <ScrollBox maxHeight={220}>
            {studio.length===0&&(
              <div style={{padding:"14px",textAlign:"center"}}>
                <p style={{margin:0,fontSize:"14px",color:"#4A6278"}}>No repairs logged — add one below</p>
              </div>
            )}
            {studio.map((t,i)=><StudioRow key={t.id} t={t} idx={i} onToggle={toggleStudio} onRemove={removeStudio}/>)}
          </ScrollBox>
        </div>
        <div style={{padding:"9px 12px",borderTop:`1px solid ${C.studioB}`,display:"flex",gap:"8px"}}>
          <input value={sInput} onChange={e=>setSInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStudio()}
            placeholder="Add a repair or job..."
            style={{flex:1,padding:"8px 11px",border:`1.5px solid ${C.studioB}`,borderRadius:"9px",fontSize:"15px",color:C.text,fontFamily:SANS,outline:"none",background:C.white,minHeight:"40px"}}/>
          <button onClick={addStudio} disabled={!sInput.trim()}
            style={{padding:"8px 14px",background:sInput.trim()?C.studio:C.fogD,border:"none",borderRadius:"9px",fontSize:"14px",fontWeight:600,color:sInput.trim()?"#fff":C.textL,cursor:sInput.trim()?"pointer":"default",fontFamily:SANS,minHeight:"40px"}}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification banner ───────────────────────────────────────────────────────
function NotifBanner({ msg, onDismiss }) {
  if (!msg) return null;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:999,background:C.amber,color:"#2C1A00",
      padding:"12px 16px",paddingTop:"calc(12px + env(safe-area-inset-top, 0px))",
      display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:SANS,fontSize:"15px",fontWeight:700}}>
      <span>⏰ {msg}</span>
      <button onClick={onDismiss} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"22px",color:"#2C1A00",lineHeight:1,minWidth:"40px",textAlign:"center"}}>×</button>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [entered,      setEntered]      = useState(false);
  const [tab,          setTab]          = useState("chat");
  const [showCrisis,   setShowCrisis]   = useState(false);
  const [notif,        setNotif]        = useState(null);
  const [overdueBadge, setOverdueBadge] = useState(false);
  const lastNotif = useRef(load("sw_last_notif",""));

  useEffect(()=>{
    const check=()=>{
      const now=new Date(); const h=now.getHours(); const m=now.getMinutes();
      const key=`${h}:${m<10?"0"+m:m}`;
      if(key===lastNotif.current) return;
      // D1 — reminders no longer check hardcoded IDs, just time of day
      const dk=today(); const md=load(`sw_meds_done_${dk}`,{});
      const meds=load("sw_meds_config",DEFAULT_MEDS);
      const amMeds=meds.filter(x=>x.time==="Morning");
      const pmMeds=meds.filter(x=>x.time==="Evening");
      if(h===8&&m===0&&amMeds.some(x=>!md[x.id])){setNotif("Morning medication time — remember to eat first! 💊");lastNotif.current=key;save("sw_last_notif",key);}
      if(h===17&&m===0&&pmMeds.length&&pmMeds.some(x=>!md[x.id])){setNotif("Evening medication time 💊");lastNotif.current=key;save("sw_last_notif",key);}
      if(h===10&&m===15){setNotif("WHTT visit coming up — check your rota 🏥");lastNotif.current=key;save("sw_last_notif",key);}
      if(h===16&&m===45){setNotif("WHTT evening visit coming up — check your rota 🏥");lastNotif.current=key;save("sw_last_notif",key);}
    };
    check();
    const iv=setInterval(check,30000);
    return()=>clearInterval(iv);
  },[]);

  if (!entered) return <Splash onEnter={()=>setEntered(true)}/>;

  const TABS=[
    {id:"chat",  label:"Chat",    icon:"💬"},
    {id:"today", label:"Today",   icon:"☀️",badge:overdueBadge},
    {id:"diary", label:"Diary",   icon:"📖"},
    {id:"plan",  label:"My Plan", icon:"📋"},
    {id:"todo",  label:"To Do",   icon:"✓"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.fog,fontFamily:SANS,overflow:"hidden"}}>
      <NotifBanner msg={notif} onDismiss={()=>setNotif(null)}/>

      <div style={{background:C.white,borderBottom:`1.5px solid ${C.border}`,padding:"8px 14px",
        paddingTop:notif?"calc(52px + env(safe-area-inset-top, 0px))":"env(safe-area-inset-top, 10px)",
        display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:2,transition:"padding-top 0.2s"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"44px",height:"44px",borderRadius:"12px",background:C.primaryL,border:`1.5px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <GeishaIcon size={32}/>
          </div>
          <div>
            <p style={{margin:0,fontSize:"16px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>SolAraWeb</p>
            <p style={{margin:0,fontSize:"11px",color:C.textL}}>Wendy's Safe Space</p>
          </div>
        </div>
        <button onClick={()=>setShowCrisis(v=>!v)}
          style={{fontSize:"13px",fontWeight:700,padding:"8px 13px",borderRadius:"10px",
            border:`1.5px solid ${C.amberB}`,background:showCrisis?C.amberB:C.amberL,
            color:C.amber,cursor:"pointer",fontFamily:SANS,minHeight:"44px"}}>
          Crisis
        </button>
      </div>

      {showCrisis&&(
        <div style={{background:C.amberL,borderBottom:`1.5px solid ${C.amberB}`,padding:"8px 12px",
          flexShrink:0,zIndex:2,maxHeight:"240px",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <p style={{margin:"0 0 8px",fontSize:"11px",fontWeight:700,color:C.amber,letterSpacing:"0.08em",textTransform:"uppercase"}}>Immediate help</p>
          <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
            <div style={{background:C.white,border:`1.5px solid ${C.amberB}`,borderRadius:"10px",padding:"8px 12px"}}>
              <p style={{margin:"0 0 2px",fontSize:"12px",color:C.amber,fontWeight:700}}>HOME TREATMENT TEAM (WHTT)</p>
              <p style={{margin:0,fontSize:"17px",color:"#3D2000",fontWeight:700,lineHeight:1.5}}>0203 513 6605</p>
              <p style={{margin:0,fontSize:"17px",color:"#3D2000",fontWeight:700}}>0203 513 6681</p>
              <p style={{margin:"3px 0 0",fontSize:"17px",color:C.red,fontWeight:700}}>0787 572 7262</p>
            </div>
            <div style={{display:"flex",gap:"7px"}}>
              <div style={{flex:1,background:C.white,border:`1.5px solid ${C.amberB}`,borderRadius:"10px",padding:"8px 12px"}}>
                <p style={{margin:"0 0 2px",fontSize:"12px",color:C.amber,fontWeight:700}}>JAMIE</p>
                <p style={{margin:0,fontSize:"17px",color:"#3D2000",fontWeight:700}}>0735 61 30 140</p>
              </div>
              <div style={{flex:1,background:C.white,border:`1.5px solid ${C.amberB}`,borderRadius:"10px",padding:"8px 12px"}}>
                <p style={{margin:"0 0 2px",fontSize:"12px",color:C.amber,fontWeight:700}}>EMAD</p>
                <p style={{margin:0,fontSize:"16px",color:"#3D2000",fontWeight:700}}>+49 177 77 90 353</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {tab==="chat" &&<ChatTab/>}
        {tab==="today"&&<TodayTab setOverdueBadge={setOverdueBadge}/>}
        {tab==="diary"&&<DiaryTab/>}
        {tab==="plan" &&<PlanTab/>}
        {tab==="todo" &&<TodoTab/>}
      </div>

      <div style={{background:C.white,borderTop:`1.5px solid ${C.border}`,display:"flex",flexShrink:0,zIndex:2,
        paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"8px 4px 7px",background:"transparent",border:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",
              borderTop:`3px solid ${tab===t.id?C.primary:"transparent"}`,
              transition:"border-color 0.15s",minHeight:"62px",position:"relative"}}>
            <div style={{width:"24px",height:"24px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",lineHeight:1}}>
              {t.icon}
            </div>
            {t.badge&&<span style={{position:"absolute",top:"7px",right:"calc(50% - 15px)",width:"8px",height:"8px",borderRadius:"50%",background:C.red,border:`2px solid ${C.white}`}}/>}
            <span style={{fontSize:"12px",fontWeight:tab===t.id?700:500,color:tab===t.id?C.primary:C.textL}}>{t.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes pulse{0%,80%,100%{opacity:.25;transform:scale(.75)}40%{opacity:1;transform:scale(1)}}
        @keyframes fadeOut{0%{opacity:1}100%{opacity:0}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        *{-webkit-tap-highlight-color:transparent}
      `}</style>
    </div>
  );
}
