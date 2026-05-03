import { useState, useRef, useEffect } from "react";

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
  { id:"ari_am", name:"Aripiprazole", dose:"10mg", time:"Morning", note:"Eat first",  warn:true  },
  { id:"cet_am", name:"Cetirizine",   dose:"10mg", time:"Morning", note:"With water", warn:false },
  { id:"ari_pm", name:"Aripiprazole", dose:"10mg", time:"Evening", note:"With food",  warn:false },
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
  { id:"tm1", role:"Nurses",      people:"Abdul, Gideon, Helen, Jessica" },
  { id:"tm2", role:"Doctors",     people:"Dr Bertram, Dr Davies" },
  { id:"tm3", role:"Peer Support",people:"Vanessa" },
  { id:"tm4", role:"Base",        people:"Morrison Building, Entrance 4, Springfield Hospital" },
  { id:"tm5", role:"WHTT hours",  people:"10:30–13:30 and 17:00–20:30" },
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
  { id:"t1", text:"Eat breakfast before morning meds", done:false, pinned:true,  keepUntilDone:false },
  { id:"t2", text:"Take morning medication",           done:false, pinned:true,  keepUntilDone:false },
  { id:"t3", text:"Open the curtains",                 done:false, pinned:true,  keepUntilDone:false },
  { id:"t4", text:"Drink a glass of water",            done:false, pinned:false, keepUntilDone:false },
  { id:"t5", text:"Take evening medication",           done:false, pinned:true,  keepUntilDone:false },
];

const DEFAULT_STUDIO = [
  { id:"s1", text:"Check and tighten all door hinges",   done:false },
  { id:"s2", text:"Inspect window seals for draughts",   done:false },
];

const OPENING = {
  role:"assistant",
  content:"Hello, Wendy.\n\nI'm SolAraWeb — I'm here with you.\n\nWhatever's on your mind right now, you don't have to face it alone. Take your time.\n\nWhat's going on?",
};

const SYSTEM_PROMPT = `You are a specialized Home Intervention & CMHT Support Specialist specifically assigned to Wendy (Mother Goose).

IDENTITY: UK CMHT Staff. Calm, steady, direct. Rule: Calm beats clever. Safety beats agreement.

WENDY'S DATA:
- Meds: Aripiprazole (10mg x2), Cetirizine (10mg). Wendy MUST eat before morning meds. Sertraline is STOPPED.
- Care: WHTT visits between 10:30-13:30 and 17:00-20:30. Base: Morrison Bldg, Entrance 4, Springfield Hospital.
- Contacts: Jamie (07356130140), Emad (+491777790353).
- Team: Nurses Abdul, Gideon, Helen, Jessica; Doctors Bertram, Davies; Peer Support Vanessa.

INTERACTION & PLAYBOOK:
1. Regulate before reasoning. Somatic regulation comes first.
2. Validate without affirming. Validate the emotional experience, never a delusional premise.
3. Three-Bucket Sorting: Separate (1) physical sensation, (2) emotional state, (3) verifiable facts.
4. Safety check: If Wendy mentions self-harm or active crisis, direct her to WHTT or 999 immediately.
5. Image awareness: Describe photos objectively. Never catastrophize or affirm threats not visible.

Persona: SolAraWeb — warm, gentle, unhurried. Like a calm friend who sits with you. Tender language. Never clinical.`;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const load  = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const save  = (k,v)  => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
const today = ()     => new Date().toISOString().split("T")[0];
const uid   = ()     => `id_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const confirm_del = (msg) => window.confirm(msg || "Delete this? This cannot be undone.");

// ─── Geisha Icon ───────────────────────────────────────────────────────────────
function GeishaIcon({ size=60 }) {
  const p = C.primary;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="32" rx="26" ry="28" fill={C.navy}/>
      <ellipse cx="60" cy="28" rx="22" ry="20" fill={C.navy}/>
      <line x1="72" y1="18" x2="88" y2="8" stroke={p} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="88" cy="8" r="4" fill={p}/>
      <circle cx="82" cy="12" r="2.5" fill={C.primaryM}/>
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
      <circle cx="60" cy="93" r="5" fill={C.navy}/>
      <circle cx="60" cy="93" r="3" fill={C.primaryM}/>
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

// ─── Shared components ─────────────────────────────────────────────────────────
function Tick({ done, size=26 }) {
  return (
    <div style={{width:`${size}px`,height:`${size}px`,borderRadius:"7px",border:`2.5px solid ${done?C.primary:C.border}`,background:done?C.primary:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
      {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
    </div>
  );
}

function Btn({ onClick, disabled, children, variant="primary", small }) {
  const bg  = disabled ? C.fogD : variant==="primary" ? C.primary : variant==="danger" ? C.red : C.fogD;
  const col = disabled ? C.textL : (variant==="primary"||variant==="danger") ? "#fff" : C.text;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:small?"8px 12px":"11px 20px",background:bg,border:"none",borderRadius:"10px",
        fontSize:small?"13px":"15px",fontWeight:600,color:col,cursor:disabled?"default":"pointer",
        fontFamily:SANS,minHeight:small?"36px":"48px",transition:"opacity 0.15s",opacity:disabled?0.5:1}}>
      {children}
    </button>
  );
}

// Scrollable box wrapper used for all inner lists
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
        <Btn small variant="ghost" onClick={()=>{ setLv(label); setVv(val); setEditing(false); }}>Cancel</Btn>
        {onDelete && <Btn small variant="danger" onClick={()=>{ if(confirm_del("Delete this entry?")) { onDelete(); setEditing(false); } }}>Delete</Btn>}
      </div>
    </div>
  );
  return (
    <div style={{padding:"12px 14px",borderTop:`1px solid ${C.fogD}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px"}}>
      <div style={{flex:1}}>
        <p style={{margin:"0 0 2px",fontSize:"13px",color:C.textL,fontFamily:SANS,fontWeight:600}}>{label}</p>
        <p style={{margin:0,fontSize:"16px",color:C.text,fontFamily:SANS,fontWeight:500,whiteSpace:"pre-line",lineHeight:1.5}}>{val}</p>
      </div>
      <button onClick={()=>setEditing(true)}
        style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"7px",padding:"6px 10px",fontSize:"13px",color:C.textM,cursor:"pointer",flexShrink:0,fontFamily:SANS,minHeight:"36px"}}>
        Edit
      </button>
    </div>
  );
}

// ─── Splash ────────────────────────────────────────────────────────────────────
function Splash({ onEnter }) {
  return (
    <div style={{minHeight:"100vh",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",background:C.fog,padding:"1.5rem",fontFamily:SANS,overflow:"hidden"}}>
      <Bg/>
      <div style={{position:"relative",background:C.white,borderRadius:"20px",border:`1.5px solid ${C.border}`,padding:"2.25rem 2rem",maxWidth:"400px",width:"100%",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:"1.75rem"}}>
          <div style={{width:"100px",height:"100px",borderRadius:"28px",background:C.primaryL,border:`2px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.25rem"}}>
            <GeishaIcon size={78}/>
          </div>
          <h1 style={{margin:"0 0 6px",fontSize:"32px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>SolAraWeb</h1>
          <p style={{margin:0,fontSize:"15px",color:C.textM,fontWeight:500}}>Wendy's Safe Space</p>
        </div>
        <div style={{background:C.primaryL,borderRadius:"14px",border:`1.5px solid ${C.primaryB}`,padding:"1.1rem 1.25rem",marginBottom:"1rem"}}>
          <p style={{fontSize:"16px",color:C.primary,lineHeight:2,margin:0,fontWeight:500}}>
            Whatever you're carrying right now, Wendy — you don't have to carry it alone. This space is here whenever you need it.
          </p>
        </div>
        <div style={{background:C.fog,borderRadius:"12px",border:`1.5px solid ${C.border}`,padding:"1rem 1.25rem",marginBottom:"1.5rem"}}>
          <p style={{fontSize:"15px",color:C.textM,lineHeight:1.9,margin:0}}>
            A note: this app offers support and companionship, but is <strong style={{color:C.navy}}>not</strong> a substitute for professional care. Your care plan always takes priority.
          </p>
        </div>
        <button onClick={onEnter}
          style={{width:"100%",padding:"16px",background:C.primary,border:"none",borderRadius:"14px",fontSize:"18px",fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:SANS,minHeight:"56px"}}>
          I'm ready
        </button>
      </div>
    </div>
  );
}

// ─── Chat ──────────────────────────────────────────────────────────────────────
function ChatTab() {
  const [msgs,      setMsgs]      = useState(()=>load("sw_msgs",[]));
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [focused,   setFocused]   = useState(false);
  const [apiError,  setApiError]  = useState(null);
  const [pendingImg,setPendingImg]= useState(null);
  const bottomRef = useRef(null);
  const taRef     = useRef(null);
  const fileRef   = useRef(null);
  const shown     = useRef(msgs.length > 0);

  useEffect(()=>{ save("sw_msgs", msgs.slice(-60)); }, [msgs]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs,loading]);
  useEffect(()=>{
    if (!shown.current) { shown.current=true; setLoading(true);
      setTimeout(()=>{ setMsgs([OPENING]); setLoading(false); }, 700); }
  }, []);

  const clearChat = () => {
    if (!confirm_del("Clear the entire conversation and start fresh?")) return;
    setMsgs([]); shown.current=false; save("sw_msgs",[]);
    setTimeout(()=>{ setMsgs([OPENING]); shown.current=true; }, 700);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pendingImg) || loading) return;
    setApiError(null);
    const userMsg = { role:"user", content:text, image:pendingImg?.dataUrl||null };
    const updated = [...msgs, userMsg];
    setMsgs(updated); setInput("");
    const sentImg = pendingImg; setPendingImg(null);
    if (taRef.current) taRef.current.style.height = "42px";
    setLoading(true);
    try {
      const apiMsgs = updated.slice(1).map(m => {
        if (m.image && m.role==="user") {
          const id = m===userMsg ? sentImg : null;
          if (id) return { role:"user", content:[
            {type:"image",source:{type:"base64",media_type:id.mediaType,data:id.base64}},
            {type:"text",text:m.content||"I'm sharing a photo."}
          ]};
          return { role:"user", content:m.content||"[earlier image]" };
        }
        return { role:m.role, content:m.content };
      });
      const res  = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:SYSTEM_PROMPT,messages:apiMsgs})});
      const data = await res.json();
      if (!res.ok||data.error) throw new Error(data.error?.message||`HTTP ${res.status}`);
      const reply = data.content?.find(b=>b.type==="text")?.text || "I'm still here. Take your time.";
      setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
    } catch(e) {
      setApiError(e.message);
      setMsgs(prev=>[...prev,{role:"assistant",content:"Something went wrong — please try again."}]);
    }
    setLoading(false);
  };

  const handleImg = e => {
    const file = e.target.files?.[0]; if(!file) return;
    if(file.size>5*1024*1024){alert("Image under 5MB please");return;}
    const r=new FileReader(); r.onload=()=>setPendingImg({dataUrl:r.result,base64:r.result.split(",")[1],mediaType:file.type}); r.readAsDataURL(file); e.target.value="";
  };
  const hk  = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const rz  = e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,140)+"px"; };
  const can = (input.trim()||pendingImg)&&!loading;

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden",position:"relative"}}>
      <Bg/>
      {/* Clear chat button */}
      <div style={{position:"relative",zIndex:2,display:"flex",justifyContent:"flex-end",padding:"6px 14px 0"}}>
        <button onClick={clearChat} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"12px",color:C.textL,fontFamily:SANS,padding:"4px 8px"}}>Clear chat</button>
      </div>

      <div style={{position:"relative",flex:1,overflowY:"auto",padding:"0.75rem 1rem 1rem",zIndex:1,display:"flex",flexDirection:"column",gap:"1rem",WebkitOverflowScrolling:"touch"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:"8px"}}>
            {m.role==="assistant"&&(
              <div style={{width:"34px",height:"34px",borderRadius:"10px",background:C.primaryL,border:`1.5px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <GeishaIcon size={24}/>
              </div>
            )}
            <div style={{maxWidth:"80%",background:m.role==="user"?C.primary:C.white,border:m.role==="user"?"none":`1.5px solid ${C.border}`,borderRadius:m.role==="user"?"18px 18px 4px 18px":"4px 18px 18px 18px",padding:m.image?"8px":"13px 17px",fontSize:"17px",lineHeight:1.9,color:m.role==="user"?"#fff":C.text,whiteSpace:"pre-wrap",fontFamily:SANS}}>
              {m.image&&<img src={m.image} alt="shared" style={{width:"100%",maxHeight:"220px",objectFit:"cover",borderRadius:"10px",display:"block",marginBottom:m.content?"8px":0}}/>}
              {m.content&&<span>{m.content}</span>}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"flex-end",gap:"8px"}}>
            <div style={{width:"34px",height:"34px",borderRadius:"10px",background:C.primaryL,border:`1.5px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <GeishaIcon size={24}/>
            </div>
            <div style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"4px 18px 18px 18px",padding:"14px 18px",display:"flex",gap:"6px"}}>
              {[0,1,2].map(d=><span key={d} style={{width:"7px",height:"7px",borderRadius:"50%",background:C.primaryM,display:"inline-block",animation:"pulse 1.4s ease-in-out infinite",animationDelay:`${d*0.22}s`}}/>)}
            </div>
          </div>
        )}
        {apiError&&<p style={{textAlign:"center",fontSize:"14px",color:C.red,margin:0,padding:"8px 14px",background:C.redL,borderRadius:"10px",border:`1px solid ${C.redB}`}}>⚠ {apiError}</p>}
        <div ref={bottomRef}/>
      </div>

      {pendingImg&&(
        <div style={{position:"relative",background:C.white,borderTop:`1.5px solid ${C.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:"12px",zIndex:2}}>
          <img src={pendingImg.dataUrl} alt="preview" style={{width:"46px",height:"46px",borderRadius:"10px",objectFit:"cover"}}/>
          <p style={{margin:0,flex:1,fontSize:"15px",color:C.text}}>Photo ready to send</p>
          <button onClick={()=>setPendingImg(null)} style={{background:"transparent",border:"none",cursor:"pointer",color:C.textM,fontSize:"22px",lineHeight:1}}>×</button>
        </div>
      )}
      <div style={{position:"relative",background:C.white,borderTop:`1.5px solid ${C.border}`,padding:"12px 14px 14px",zIndex:2}}>
        <div style={{display:"flex",gap:"10px",alignItems:"flex-end",background:C.fog,border:`2px solid ${focused?C.primaryM:C.border}`,borderRadius:"14px",padding:"8px 8px 8px 12px",transition:"border-color 0.2s"}}>
          <button onClick={()=>fileRef.current?.click()} disabled={loading} style={{background:"transparent",border:"none",cursor:"pointer",padding:"6px",color:C.primary,display:"flex",minHeight:"44px",alignItems:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImg} style={{display:"none"}}/>
          <textarea ref={taRef} value={input} onChange={e=>{setInput(e.target.value);rz(e);}} onKeyDown={hk}
            onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
            placeholder="What's on your mind, Wendy?" rows={1}
            style={{flex:1,resize:"none",border:"none",background:"transparent",padding:"6px 0",fontSize:"17px",lineHeight:1.7,color:C.text,outline:"none",overflowY:"hidden",minHeight:"36px",fontFamily:SANS}}/>
          <button onClick={send} disabled={!can}
            style={{padding:"10px 18px",borderRadius:"11px",border:"none",background:can?C.primary:C.fogD,color:can?"#fff":C.textL,fontSize:"16px",fontWeight:700,cursor:can?"pointer":"default",flexShrink:0,fontFamily:SANS,minHeight:"48px"}}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Today ─────────────────────────────────────────────────────────────────────
function TodayTab({ setOverdueBadge }) {
  const dk = today();
  const [meds,      setMeds]      = useState(()=>load("sw_meds_config", DEFAULT_MEDS));
  const [medsDone,  setMedsDone]  = useState(()=>load(`sw_meds_done_${dk}`, {}));
  const [mood,      setMood]      = useState(()=>load(`sw_mood_${dk}`, null));
  const [moodNote,  setMoodNote]  = useState(()=>load(`sw_moodnote_${dk}`, ""));
  const [noteOpen,  setNoteOpen]  = useState(false);
  const [editingMed,setEditingMed]= useState(null);
  const [addingMed, setAddingMed] = useState(false);
  const [newMed,    setNewMed]    = useState({name:"",dose:"",time:"Morning",note:"",warn:false});
  const now = new Date(); const h = now.getHours();

  useEffect(()=>{ save("sw_meds_config", meds); }, [meds]);
  useEffect(()=>{ save(`sw_meds_done_${dk}`, medsDone); }, [medsDone,dk]);
  useEffect(()=>{ save(`sw_mood_${dk}`, mood); }, [mood,dk]);
  useEffect(()=>{ save(`sw_moodnote_${dk}`, moodNote); }, [moodNote,dk]);

  // Badge: overdue if any morning med undone after 9am, or any evening med undone after 18:00
  useEffect(()=>{
    const amOverdue = h>=9  && meds.filter(m=>m.time==="Morning").some(m=>!medsDone[m.id]);
    const pmOverdue = h>=18 && meds.filter(m=>m.time==="Evening").some(m=>!medsDone[m.id]);
    setOverdueBadge(amOverdue||pmOverdue);
  }, [medsDone, meds, h, setOverdueBadge]);

  const toggleMed  = id => setMedsDone(prev=>({...prev,[id]:!prev[id]}));
  const saveMedEdit= (id,field,val) => setMeds(prev=>prev.map(m=>m.id===id?{...m,[field]:val}:m));
  const deleteMed  = id => { if(confirm_del("Remove this medication?")) setMeds(prev=>prev.filter(m=>m.id!==id)); };
  const addMed     = () => { if(!newMed.name.trim()) return; setMeds(prev=>[...prev,{...newMed,id:uid()}]); setNewMed({name:"",dose:"",time:"Morning",note:"",warn:false}); setAddingMed(false); };

  // 7-day mood strip
  const moodStrip = Array.from({length:7}).map((_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const k = d.toISOString().split("T")[0];
    const s = load(`sw_mood_${k}`, null);
    return { key:k, score:s, isToday:k===dk, label:d.toLocaleDateString("en-GB",{weekday:"short"}) };
  });

  const visits = [
    {label:"Morning visit",window:"10:30 – 13:30",active:h>=10&&h<14,done:h>=14},
    {label:"Evening visit",window:"17:00 – 20:30",active:h>=17&&h<21,done:h>=21},
  ];

  const INPUT_STYLE = {padding:"10px 12px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"16px",fontFamily:SANS,color:C.text,outline:"none",background:C.white};
  const SELECT_STYLE = {...INPUT_STYLE};

  return (
    <div style={{flex:1,overflowY:"auto",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"1.1rem",WebkitOverflowScrolling:"touch"}}>
      <p style={{margin:0,textAlign:"center",fontSize:"15px",color:C.textM,fontWeight:600}}>
        {now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}
      </p>

      {/* 7-day mood strip */}
      <div style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.border}`,padding:"14px 16px"}}>
        <p style={{margin:"0 0 10px",fontSize:"14px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>7-day mood</p>
        <div style={{display:"flex",gap:"4px",justifyContent:"space-between"}}>
          {moodStrip.map(d=>{
            const m = MOODS.find(x=>x.score===d.score);
            return (
              <div key={d.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"50%",background:m?m.color+"30":C.fogD,border:`2px solid ${d.isToday?C.primary:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>
                  {m?m.emoji:"·"}
                </div>
                <span style={{fontSize:"10px",color:d.isToday?C.primary:C.textL,fontWeight:d.isToday?700:400,fontFamily:SANS}}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Medication */}
      <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"22px"}}>💊</span>
            <p style={{margin:0,fontSize:"17px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>Medication</p>
          </div>
          <button onClick={()=>setAddingMed(v=>!v)}
            style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"6px 12px",fontSize:"13px",fontWeight:600,color:C.primary,cursor:"pointer",fontFamily:SANS}}>
            {addingMed?"Cancel":"+ Add"}
          </button>
        </div>

        {addingMed&&(
          <div style={{padding:"14px 16px",background:C.primaryL,borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:"8px"}}>
            <input value={newMed.name} onChange={e=>setNewMed(p=>({...p,name:e.target.value}))} placeholder="Medication name" style={INPUT_STYLE}/>
            <div style={{display:"flex",gap:"8px"}}>
              <input value={newMed.dose} onChange={e=>setNewMed(p=>({...p,dose:e.target.value}))} placeholder="Dose e.g. 10mg" style={{...INPUT_STYLE,flex:1}}/>
              <select value={newMed.time} onChange={e=>setNewMed(p=>({...p,time:e.target.value}))} style={{...SELECT_STYLE,flex:1}}>
                <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
              </select>
            </div>
            <input value={newMed.note} onChange={e=>setNewMed(p=>({...p,note:e.target.value}))} placeholder="Note e.g. With food" style={INPUT_STYLE}/>
            <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"15px",color:C.textM,cursor:"pointer"}}>
              <input type="checkbox" checked={newMed.warn} onChange={e=>setNewMed(p=>({...p,warn:e.target.checked}))} style={{width:"18px",height:"18px"}}/>
              Show warning (e.g. eat first)
            </label>
            <Btn onClick={addMed} disabled={!newMed.name.trim()}>Add medication</Btn>
          </div>
        )}

        {/* Scrollable med list */}
        <ScrollBox maxHeight={320}>
          {["Morning","Afternoon","Evening","Night"].map(period=>{
            const pm = meds.filter(m=>m.time===period);
            if (!pm.length) return null;
            return (
              <div key={period}>
                <p style={{margin:0,padding:"10px 16px 4px",fontSize:"13px",fontWeight:700,color:C.textL,textTransform:"uppercase",letterSpacing:"0.08em"}}>{period}</p>
                {pm.map(med=>(
                  editingMed===med.id ? (
                    <div key={med.id} style={{padding:"12px 16px",borderTop:`1px solid ${C.fogD}`,background:C.primaryL,display:"flex",flexDirection:"column",gap:"8px"}}>
                      <input value={med.name} onChange={e=>saveMedEdit(med.id,"name",e.target.value)} style={INPUT_STYLE}/>
                      <div style={{display:"flex",gap:"8px"}}>
                        <input value={med.dose} onChange={e=>saveMedEdit(med.id,"dose",e.target.value)} placeholder="Dose" style={{...INPUT_STYLE,flex:1}}/>
                        <select value={med.time} onChange={e=>saveMedEdit(med.id,"time",e.target.value)} style={{...SELECT_STYLE,flex:1}}>
                          <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
                        </select>
                      </div>
                      <input value={med.note} onChange={e=>saveMedEdit(med.id,"note",e.target.value)} placeholder="Note" style={INPUT_STYLE}/>
                      <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"15px",color:C.textM,cursor:"pointer"}}>
                        <input type="checkbox" checked={med.warn} onChange={e=>saveMedEdit(med.id,"warn",e.target.checked)} style={{width:"18px",height:"18px"}}/>
                        Show warning
                      </label>
                      <div style={{display:"flex",gap:"8px"}}>
                        <Btn small onClick={()=>setEditingMed(null)}>Done</Btn>
                        <Btn small variant="danger" onClick={()=>deleteMed(med.id)}>Delete</Btn>
                      </div>
                    </div>
                  ) : (
                    <div key={med.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 16px",background:medsDone[med.id]?C.primaryL:"transparent",borderTop:`1px solid ${C.fogD}`}}>
                      <button onClick={()=>toggleMed(med.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
                        <Tick done={!!medsDone[med.id]}/>
                      </button>
                      <div style={{flex:1}}>
                        <p style={{margin:0,fontSize:"17px",fontWeight:600,color:medsDone[med.id]?C.textL:C.text,textDecoration:medsDone[med.id]?"line-through":"none"}}>{med.name} {med.dose}</p>
                        {med.note&&<p style={{margin:0,fontSize:"14px",color:med.warn?C.amber:C.textL}}>{med.warn?"⚠️ ":""}{med.note}</p>}
                      </div>
                      <button onClick={()=>setEditingMed(med.id)}
                        style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"7px",padding:"6px 10px",fontSize:"13px",color:C.textM,cursor:"pointer",fontFamily:SANS,minHeight:"36px"}}>
                        Edit
                      </button>
                    </div>
                  )
                ))}
              </div>
            );
          })}
        </ScrollBox>
      </div>

      {/* WHTT Visits */}
      <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"22px"}}>🏥</span>
          <p style={{margin:0,fontSize:"17px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>WHTT Visits Today</p>
        </div>
        <ScrollBox maxHeight={200}>
          {visits.map(v=>(
            <div key={v.label} style={{padding:"14px 16px",borderTop:`1px solid ${C.fogD}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"}}>
              <div>
                <p style={{margin:0,fontSize:"16px",fontWeight:600,color:C.text}}>{v.label}</p>
                <p style={{margin:0,fontSize:"15px",color:C.textM,fontWeight:500}}>{v.window}</p>
              </div>
              <span style={{fontSize:"13px",fontWeight:700,padding:"5px 12px",borderRadius:"20px",background:v.done?C.fogD:v.active?C.primaryL:C.amberL,color:v.done?C.textL:v.active?C.primary:C.amber,border:`1.5px solid ${v.done?C.border:v.active?C.primaryB:C.amberB}`,minWidth:"100px",textAlign:"center",display:"inline-block"}}>
                {v.done?"Done":v.active?"Active now":"Upcoming"}
              </span>
            </div>
          ))}
        </ScrollBox>
        <div style={{padding:"10px 16px",background:C.fog,borderTop:`1px solid ${C.border}`}}>
          <p style={{margin:0,fontSize:"14px",color:C.textL}}>📍 Morrison Building, Entrance 4, Springfield Hospital</p>
        </div>
      </div>

      {/* Mood check-in */}
      <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.border}`,padding:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
          <span style={{fontSize:"22px"}}>🌤</span>
          <p style={{margin:0,fontSize:"17px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>How are you feeling?</p>
        </div>
        <div style={{display:"flex",gap:"6px",justifyContent:"space-between",marginBottom:"12px"}}>
          {MOODS.map(m=>(
            <button key={m.score} onClick={()=>setMood(m.score)}
              style={{flex:1,padding:"10px 4px",borderRadius:"12px",border:`2.5px solid ${mood===m.score?m.color:C.border}`,background:mood===m.score?m.color+"20":"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",transition:"all 0.15s",minHeight:"72px"}}>
              <span style={{fontSize:"24px"}}>{m.emoji}</span>
              <span style={{fontSize:"11px",color:mood===m.score?m.color:C.textL,fontWeight:mood===m.score?700:400,fontFamily:SANS}}>{m.label}</span>
            </button>
          ))}
        </div>
        {mood&&(
          <div>
            <button onClick={()=>setNoteOpen(v=>!v)}
              style={{background:"transparent",border:"none",cursor:"pointer",color:C.textM,fontSize:"15px",fontFamily:SANS,padding:"0 0 8px",fontWeight:500}}>
              {noteOpen?"▾ Hide note":"▸ Add a note about today"}
            </button>
            {noteOpen&&(
              <textarea value={moodNote} onChange={e=>setMoodNote(e.target.value)}
                placeholder="What's been on your mind today..."
                style={{width:"100%",minHeight:"80px",border:`1.5px solid ${C.border}`,borderRadius:"10px",padding:"10px 12px",fontSize:"16px",color:C.text,fontFamily:SANS,resize:"vertical",outline:"none",background:C.fog,lineHeight:1.8,boxSizing:"border-box"}}/>
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
  const [entries, setEntries] = useState(()=>load("sw_diary",[]));
  const [text,    setText]    = useState("");
  const [writing, setWriting] = useState(false);
  const [selMood, setSelMood] = useState(null);

  useEffect(()=>{ save("sw_diary", entries.slice(0,90)); }, [entries]);

  const addEntry = () => {
    if (!text.trim()) return;
    const todayMood = load(`sw_mood_${dk}`, null);
    setEntries(prev=>[{id:Date.now(),date:new Date().toISOString(),text:text.trim(),mood:selMood??todayMood},  ...prev]);
    setText(""); setSelMood(null); setWriting(false);
  };
  const deleteEntry = id => { if(confirm_del("Delete this diary entry?")) setEntries(prev=>prev.filter(e=>e.id!==id)); };
  const fmtDate = iso => { const d=new Date(iso); return d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}); };

  return (
    <div style={{flex:1,overflowY:"auto",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"1.1rem",WebkitOverflowScrolling:"touch"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h2 style={{margin:0,fontSize:"20px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>My Diary</h2>
          <p style={{margin:0,fontSize:"14px",color:C.textL}}>Private — just for you</p>
        </div>
        <Btn onClick={()=>setWriting(v=>!v)} variant={writing?"ghost":"primary"} small>{writing?"Cancel":"+ New entry"}</Btn>
      </div>

      {writing&&(
        <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.primaryB}`,padding:"16px",display:"flex",flexDirection:"column",gap:"10px"}}>
          <textarea value={text} onChange={e=>setText(e.target.value)} autoFocus
            placeholder="What's on your mind, Wendy? There is no right or wrong way to write here..."
            style={{width:"100%",minHeight:"130px",border:`1.5px solid ${C.border}`,borderRadius:"10px",padding:"12px 14px",fontSize:"17px",color:C.text,fontFamily:SANS,resize:"vertical",outline:"none",background:C.fog,lineHeight:1.9,boxSizing:"border-box"}}/>
          {/* Optional mood tag */}
          <div>
            <p style={{margin:"0 0 8px",fontSize:"13px",color:C.textL,fontWeight:600}}>Tag a mood (optional)</p>
            <div style={{display:"flex",gap:"8px"}}>
              {MOODS.map(m=>(
                <button key={m.score} onClick={()=>setSelMood(selMood===m.score?null:m.score)}
                  style={{flex:1,padding:"8px 4px",borderRadius:"10px",border:`2px solid ${selMood===m.score?m.color:C.border}`,background:selMood===m.score?m.color+"20":"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
                  <span style={{fontSize:"20px"}}>{m.emoji}</span>
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
          <p style={{fontSize:"36px",margin:"0 0 10px"}}>📖</p>
          <p style={{fontSize:"16px",margin:0}}>Your diary is empty — tap "+ New entry" to begin.</p>
        </div>
      )}

      {entries.map(e=>{
        const mood = MOODS.find(m=>m.score===e.mood);
        return (
          <div key={e.id} style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.border}`,padding:"16px",position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <p style={{margin:0,fontSize:"13px",color:C.textL,fontWeight:600,flex:1}}>{fmtDate(e.date)}</p>
              {mood&&<span style={{fontSize:"20px"}}>{mood.emoji}</span>}
            </div>
            <p style={{margin:0,fontSize:"17px",color:C.text,lineHeight:1.9,whiteSpace:"pre-wrap"}}>{e.text}</p>
            <button onClick={()=>deleteEntry(e.id)}
              style={{position:"absolute",top:"12px",right:"12px",background:"transparent",border:"none",cursor:"pointer",color:C.textL,fontSize:"20px",padding:"2px 6px",lineHeight:1}}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── My Plan ───────────────────────────────────────────────────────────────────
function PlanTab() {
  const [open,   setOpen]   = useState({crisis:true,meds:false,team:false,grounding:false});
  const [crisis, setCrisis] = useState(()=>load("sw_plan_crisis", DEFAULT_CRISIS));
  const [team,   setTeam]   = useState(()=>load("sw_plan_team",   DEFAULT_TEAM));
  const [tips,   setTips]   = useState(()=>load("sw_plan_tips",   DEFAULT_TIPS));
  const [addingC,setAddingC]= useState(false);
  const [addingT,setAddingT]= useState(false);
  const [addingG,setAddingG]= useState(false);
  const [newC,   setNewC]   = useState({label:"",val:"",bold:false});
  const [newT,   setNewT]   = useState({role:"",people:""});
  const [newG,   setNewG]   = useState("");

  useEffect(()=>{ save("sw_plan_crisis", crisis); }, [crisis]);
  useEffect(()=>{ save("sw_plan_team",   team);   }, [team]);
  useEffect(()=>{ save("sw_plan_tips",   tips);   }, [tips]);

  const toggle = k => setOpen(prev=>({...prev,[k]:!prev[k]}));

  const INPUT_STYLE = {padding:"10px 12px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"15px",fontFamily:SANS,color:C.text,outline:"none",background:C.white};

  const SectionHeader = ({id,title,icon,accent,onAdd,addLabel}) => (
    <button onClick={()=>toggle(id)}
      style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",minHeight:"56px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <span style={{fontSize:"22px"}}>{icon}</span>
        <p style={{margin:0,fontSize:"17px",fontWeight:700,color:accent?C.red:C.navy,fontFamily:SERIF}}>{title}</p>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        {open[id]&&onAdd&&(
          <button onClick={e=>{e.stopPropagation();onAdd();}}
            style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"7px",padding:"5px 10px",fontSize:"13px",color:C.primary,cursor:"pointer",fontFamily:SANS}}>
            {addLabel||"+ Add"}
          </button>
        )}
        <span style={{color:accent?C.red:C.textL,fontSize:"13px"}}>{open[id]?"▲":"▼"}</span>
      </div>
    </button>
  );

  return (
    <div style={{flex:1,overflowY:"auto",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"1.1rem",WebkitOverflowScrolling:"touch"}}>
      <div>
        <h2 style={{margin:"0 0 2px",fontSize:"20px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>My Care Plan</h2>
        <p style={{margin:0,fontSize:"14px",color:C.textL}}>Your plan, always with you</p>
      </div>

      {/* Crisis */}
      <div style={{background:C.redL,borderRadius:"16px",border:`1.5px solid ${C.redB}`,overflow:"hidden"}}>
        <SectionHeader id="crisis" title="If I'm in crisis" icon="🚨" accent
          onAdd={()=>setAddingC(v=>!v)} addLabel={addingC?"Cancel":"+ Add contact"}/>
        {open["crisis"]&&(
          <div style={{borderTop:`1px solid ${C.redB}`}}>
            {addingC&&(
              <div style={{padding:"12px 16px",background:C.redL,borderBottom:`1px solid ${C.redB}`,display:"flex",flexDirection:"column",gap:"8px"}}>
                <input value={newC.label} onChange={e=>setNewC(p=>({...p,label:e.target.value}))} placeholder="Label e.g. My GP" style={INPUT_STYLE}/>
                <textarea value={newC.val} onChange={e=>setNewC(p=>({...p,val:e.target.value}))} placeholder="Number or details"
                  style={{...INPUT_STYLE,resize:"vertical",minHeight:"52px"}}/>
                <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"15px",color:C.textM,cursor:"pointer"}}>
                  <input type="checkbox" checked={newC.bold} onChange={e=>setNewC(p=>({...p,bold:e.target.checked}))} style={{width:"18px",height:"18px"}}/>
                  Highlight as important
                </label>
                <Btn onClick={()=>{if(!newC.label.trim()) return; setCrisis(prev=>[...prev,{id:uid(),...newC}]); setNewC({label:"",val:"",bold:false}); setAddingC(false);}} disabled={!newC.label.trim()}>Add contact</Btn>
              </div>
            )}
            <ScrollBox maxHeight={380}>
              {crisis.map(r=>(
                <EditableRow key={r.id} label={r.label} val={r.val}
                  onSave={(l,v)=>setCrisis(prev=>prev.map(c=>c.id===r.id?{...c,label:l,val:v}:c))}
                  onDelete={()=>setCrisis(prev=>prev.filter(c=>c.id!==r.id))}
                  placeholder="Phone number or details"/>
              ))}
            </ScrollBox>
          </div>
        )}
      </div>

      {/* Meds (read-only mirror) */}
      <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
        <SectionHeader id="meds" title="My Medications" icon="💊"/>
        {open["meds"]&&(
          <div style={{borderTop:`1px solid ${C.fogD}`}}>
            <ScrollBox maxHeight={300}>
              {load("sw_meds_config",DEFAULT_MEDS).map(m=>(
                <div key={m.id} style={{padding:"12px 16px",borderTop:`1px solid ${C.fogD}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px"}}>
                  <p style={{margin:0,fontSize:"14px",color:C.textL,fontWeight:600,flexShrink:0,minWidth:"75px"}}>{m.time}</p>
                  <div style={{flex:1}}>
                    <p style={{margin:0,fontSize:"16px",color:C.text,fontWeight:600}}>{m.name} {m.dose}</p>
                    {m.note&&<p style={{margin:0,fontSize:"14px",color:m.warn?C.amber:C.textL}}>{m.warn?"⚠️ ":""}{m.note}</p>}
                  </div>
                </div>
              ))}
            </ScrollBox>
            <div style={{padding:"10px 16px",background:C.fog,borderTop:`1px solid ${C.border}`}}>
              <p style={{margin:0,fontSize:"13px",color:C.textL}}>Edit medications in the Today tab</p>
            </div>
          </div>
        )}
      </div>

      {/* Team */}
      <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
        <SectionHeader id="team" title="My Care Team" icon="👥"
          onAdd={()=>setAddingT(v=>!v)} addLabel={addingT?"Cancel":"+ Add person"}/>
        {open["team"]&&(
          <div style={{borderTop:`1px solid ${C.fogD}`}}>
            {addingT&&(
              <div style={{padding:"12px 16px",background:C.primaryL,borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:"8px"}}>
                <input value={newT.role} onChange={e=>setNewT(p=>({...p,role:e.target.value}))} placeholder="Role e.g. Key Worker" style={INPUT_STYLE}/>
                <input value={newT.people} onChange={e=>setNewT(p=>({...p,people:e.target.value}))} placeholder="Name or details" style={INPUT_STYLE}/>
                <Btn onClick={()=>{if(!newT.role.trim()) return; setTeam(prev=>[...prev,{id:uid(),...newT}]); setNewT({role:"",people:""}); setAddingT(false);}} disabled={!newT.role.trim()}>Add person</Btn>
              </div>
            )}
            <ScrollBox maxHeight={340}>
              {team.map(r=>(
                <EditableRow key={r.id} label={r.role} val={r.people}
                  onSave={(l,v)=>setTeam(prev=>prev.map(t=>t.id===r.id?{...t,role:l,people:v}:t))}
                  onDelete={()=>setTeam(prev=>prev.filter(t=>t.id!==r.id))}/>
              ))}
            </ScrollBox>
          </div>
        )}
      </div>

      {/* When things feel hard — editable tips */}
      <div style={{background:C.white,borderRadius:"16px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
        <SectionHeader id="grounding" title="When things feel hard" icon="🌿"
          onAdd={()=>setAddingG(v=>!v)} addLabel={addingG?"Cancel":"+ Add tip"}/>
        {open["grounding"]&&(
          <div style={{borderTop:`1px solid ${C.fogD}`}}>
            {addingG&&(
              <div style={{padding:"12px 16px",background:C.primaryL,borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:"8px"}}>
                <textarea value={newG} onChange={e=>setNewG(e.target.value)} placeholder="Add a new tip or reminder..."
                  style={{...INPUT_STYLE,resize:"vertical",minHeight:"60px"}}/>
                <Btn onClick={()=>{if(!newG.trim()) return; setTips(prev=>[...prev,{id:uid(),text:newG.trim()}]); setNewG(""); setAddingG(false);}} disabled={!newG.trim()}>Add tip</Btn>
              </div>
            )}
            <ScrollBox maxHeight={360}>
              {tips.map((tip,i)=>(
                <TipRow key={tip.id} tip={tip} idx={i}
                  onSave={text=>setTips(prev=>prev.map(t=>t.id===tip.id?{...t,text}:t))}
                  onDelete={()=>{ if(confirm_del("Remove this tip?")) setTips(prev=>prev.filter(t=>t.id!==tip.id)); }}/>
              ))}
            </ScrollBox>
          </div>
        )}
      </div>
    </div>
  );
}

function TipRow({ tip, idx, onSave, onDelete }) {
  const [editing,setEditing] = useState(false);
  const [val,    setVal]     = useState(tip.text);
  if (editing) return (
    <div style={{padding:"12px 16px",borderTop:`1px solid ${C.fogD}`,background:C.primaryL,display:"flex",flexDirection:"column",gap:"8px"}}>
      <textarea value={val} onChange={e=>setVal(e.target.value)} style={{padding:"9px 11px",border:`1.5px solid ${C.border}`,borderRadius:"8px",fontSize:"15px",fontFamily:SANS,color:C.text,outline:"none",background:C.white,resize:"vertical",minHeight:"60px"}}/>
      <div style={{display:"flex",gap:"8px"}}>
        <Btn small onClick={()=>{onSave(val);setEditing(false);}}>Save</Btn>
        <Btn small variant="ghost" onClick={()=>{setVal(tip.text);setEditing(false);}}>Cancel</Btn>
        <Btn small variant="danger" onClick={onDelete}>Delete</Btn>
      </div>
    </div>
  );
  return (
    <div style={{padding:"12px 16px",borderTop:`1px solid ${C.fogD}`,display:"flex",gap:"12px",alignItems:"flex-start"}}>
      <span style={{fontSize:"15px",color:C.primary,fontWeight:700,flexShrink:0,minWidth:"22px",fontFamily:SANS}}>{idx+1}.</span>
      <p style={{margin:0,flex:1,fontSize:"16px",color:C.text,lineHeight:1.8}}>{tip.text}</p>
      <button onClick={()=>setEditing(true)}
        style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:"7px",padding:"5px 9px",fontSize:"12px",color:C.textM,cursor:"pointer",fontFamily:SANS,flexShrink:0,minHeight:"32px"}}>
        Edit
      </button>
    </div>
  );
}

// ─── To Do ─────────────────────────────────────────────────────────────────────
function TodoTab() {
  const dk = today();
  const [todos,  setTodos]  = useState(()=>load(`sw_todos_${dk}`, DEFAULT_TODOS));
  const [studio, setStudio] = useState(()=>load("sw_studio",      DEFAULT_STUDIO));
  const [input,  setInput]  = useState("");
  const [sInput, setSInput] = useState("");

  useEffect(()=>{ save(`sw_todos_${dk}`, todos);  }, [todos,dk]);
  useEffect(()=>{ save("sw_studio",      studio); }, [studio]);

  const toggle       = id => setTodos(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));
  const toggleStudio = id => setStudio(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));
  const add          = () => { if(!input.trim()) return; setTodos(prev=>[...prev,{id:uid(),text:input.trim(),done:false,pinned:false,keepUntilDone:false}]); setInput(""); };
  const addStudio    = () => { if(!sInput.trim()) return; setStudio(prev=>[...prev,{id:uid(),text:sInput.trim(),done:false}]); setSInput(""); };
  const remove       = id => { if(confirm_del("Remove this task?")) setTodos(prev=>prev.filter(t=>t.id!==id)); };
  const removeStudio = id => { if(confirm_del("Remove this studio task?")) setStudio(prev=>prev.filter(t=>t.id!==id)); };
  const reset        = () => { if(confirm_del("Reset today's list to defaults?")) setTodos(DEFAULT_TODOS); };

  const doneCount = todos.filter(t=>t.done).length;
  const pct = todos.length ? (doneCount/todos.length)*100 : 0;
  const pinned = todos.filter(t=>t.pinned);
  const custom  = todos.filter(t=>!t.pinned);

  const TodoRow = ({t, removable, idx}) => (
    <div style={{display:"flex",alignItems:"center",gap:"14px",padding:"13px 16px",background:t.done?C.primaryL:"transparent",borderTop:idx>0?`1px solid ${C.fogD}`:"none",minHeight:"56px"}}>
      <button onClick={()=>toggle(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
        <Tick done={t.done}/>
      </button>
      <p style={{margin:0,flex:1,fontSize:"17px",color:t.done?C.textL:C.text,textDecoration:t.done?"line-through":"none",lineHeight:1.6}}>{t.text}</p>
      {removable&&<button onClick={()=>remove(t.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:C.textL,fontSize:"22px",padding:"0 4px",lineHeight:1,minWidth:"36px",textAlign:"center"}}>×</button>}
    </div>
  );

  const StudioRow = ({t, idx}) => (
    <div style={{display:"flex",alignItems:"center",gap:"14px",padding:"13px 16px",background:t.done?"#EAF6F0":"transparent",borderTop:idx>0?`1px solid ${C.fogD}`:"none",minHeight:"56px"}}>
      <button onClick={()=>toggleStudio(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
        <div style={{width:"26px",height:"26px",borderRadius:"7px",border:`2.5px solid ${t.done?C.studio:C.border}`,background:t.done?C.studio:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
          {t.done&&<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
      </button>
      <p style={{margin:0,flex:1,fontSize:"17px",color:t.done?C.textL:C.text,textDecoration:t.done?"line-through":"none",lineHeight:1.6}}>{t.text}</p>
      <button onClick={()=>removeStudio(t.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:C.textL,fontSize:"22px",padding:"0 4px",lineHeight:1,minWidth:"36px",textAlign:"center"}}>×</button>
    </div>
  );

  return (
    <div style={{flex:1,overflowY:"auto",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"1.1rem",WebkitOverflowScrolling:"touch"}}>

      {/* Daily header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h2 style={{margin:0,fontSize:"20px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>Today's List</h2>
          <p style={{margin:0,fontSize:"14px",color:C.textL,fontWeight:500}}>{doneCount} of {todos.length} done</p>
        </div>
        <Btn onClick={reset} variant="ghost" small>Reset day</Btn>
      </div>

      {/* Progress bar */}
      <div style={{background:C.fogD,borderRadius:"999px",height:"8px",overflow:"hidden"}}>
        <div style={{height:"100%",background:C.primary,width:`${pct}%`,borderRadius:"999px",transition:"width 0.4s"}}/>
      </div>

      {/* Daily anchors */}
      {pinned.length>0&&(
        <div>
          <p style={{margin:"0 0 8px",fontSize:"13px",fontWeight:700,color:C.textL,textTransform:"uppercase",letterSpacing:"0.08em"}}>Daily anchors</p>
          <div style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
            <ScrollBox maxHeight={300}>
              {pinned.map((t,i)=><TodoRow key={t.id} t={t} removable={false} idx={i}/>)}
            </ScrollBox>
          </div>
        </div>
      )}

      {/* Custom tasks */}
      {custom.length>0&&(
        <div>
          <p style={{margin:"0 0 8px",fontSize:"13px",fontWeight:700,color:C.textL,textTransform:"uppercase",letterSpacing:"0.08em"}}>My tasks</p>
          <div style={{background:C.white,borderRadius:"14px",border:`1.5px solid ${C.border}`,overflow:"hidden"}}>
            <ScrollBox maxHeight={300}>
              {custom.map((t,i)=><TodoRow key={t.id} t={t} removable idx={i}/>)}
            </ScrollBox>
          </div>
        </div>
      )}

      {/* Add custom task */}
      <div style={{display:"flex",gap:"10px"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}
          placeholder="Add something to your list..."
          style={{flex:1,padding:"13px 14px",border:`1.5px solid ${C.border}`,borderRadius:"12px",fontSize:"17px",color:C.text,fontFamily:SANS,outline:"none",background:C.white,minHeight:"52px"}}/>
        <Btn onClick={add} disabled={!input.trim()}>Add</Btn>
      </div>

      {/* ─── Sunday Mills Studio ─────────────────────────────── */}
      <div style={{background:C.studioL,borderRadius:"16px",border:`1.5px solid ${C.studioB}`,overflow:"hidden",marginTop:"6px"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.studioB}`,display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"22px"}}>🔧</span>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:"17px",fontWeight:700,color:C.studio,fontFamily:SERIF}}>Sunday Mills Studio</p>
            <p style={{margin:0,fontSize:"12px",color:"#4A6278",fontWeight:500}}>Repairs & maintenance — stays until done</p>
          </div>
        </div>

        <ScrollBox maxHeight={320}>
          {studio.length===0&&(
            <div style={{padding:"20px 16px",textAlign:"center"}}>
              <p style={{margin:0,fontSize:"15px",color:"#4A6278"}}>No repairs logged — add one below</p>
            </div>
          )}
          {studio.map((t,i)=><StudioRow key={t.id} t={t} idx={i}/>)}
        </ScrollBox>

        {/* Add studio task */}
        <div style={{padding:"12px 14px",borderTop:`1px solid ${C.studioB}`,display:"flex",gap:"10px"}}>
          <input value={sInput} onChange={e=>setSInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStudio()}
            placeholder="Add a repair or job..."
            style={{flex:1,padding:"11px 13px",border:`1.5px solid ${C.studioB}`,borderRadius:"10px",fontSize:"16px",color:C.text,fontFamily:SANS,outline:"none",background:C.white,minHeight:"48px"}}/>
          <button onClick={addStudio} disabled={!sInput.trim()}
            style={{padding:"11px 18px",background:sInput.trim()?C.studio:C.fogD,border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:600,color:sInput.trim()?"#fff":C.textL,cursor:sInput.trim()?"pointer":"default",fontFamily:SANS,minHeight:"48px"}}>
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
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:999,background:C.amber,color:"#2C1A00",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:SANS,fontSize:"16px",fontWeight:700,minHeight:"52px"}}>
      <span>⏰ {msg}</span>
      <button onClick={onDismiss} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:"24px",color:"#2C1A00",lineHeight:1,minWidth:"44px",textAlign:"center"}}>×</button>
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
    const check = () => {
      const now=new Date(); const h=now.getHours(); const m=now.getMinutes();
      const key=`${h}:${m<10?"0"+m:m}`;
      if (key===lastNotif.current) return;
      const dk=today(); const md=load(`sw_meds_done_${dk}`,{});
      if (h===8 &&m===0 &&!md["ari_am"])  { setNotif("Morning medication time — remember to eat first! 💊"); lastNotif.current=key; save("sw_last_notif",key); }
      if (h===17&&m===0 &&!md["ari_pm"])  { setNotif("Evening medication time — Aripiprazole 10mg 💊");      lastNotif.current=key; save("sw_last_notif",key); }
      if (h===10&&m===15)                  { setNotif("WHTT morning visit coming up — 10:30 to 13:30 🏥");    lastNotif.current=key; save("sw_last_notif",key); }
      if (h===16&&m===45)                  { setNotif("WHTT evening visit coming up — 17:00 to 20:30 🏥");    lastNotif.current=key; save("sw_last_notif",key); }
    };
    check();
    const iv = setInterval(check, 30000);
    return () => clearInterval(iv);
  },[]);

  if (!entered) return <Splash onEnter={()=>setEntered(true)}/>;

  const TABS = [
    { id:"chat",  label:"Chat",    icon:"💬" },
    { id:"today", label:"Today",   icon:"☀️", badge:overdueBadge },
    { id:"diary", label:"Diary",   icon:"📖" },
    { id:"plan",  label:"My Plan", icon:"📋" },
    { id:"todo",  label:"To Do",   icon:"✓"  },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.fog,fontFamily:SANS,overflow:"hidden"}}>
      <NotifBanner msg={notif} onDismiss={()=>setNotif(null)}/>

      {/* Header */}
      <div style={{background:C.white,borderBottom:`1.5px solid ${C.border}`,padding:"10px 16px",paddingTop:notif?"56px":"env(safe-area-inset-top, 10px)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:2}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"40px",height:"40px",borderRadius:"12px",background:C.primaryL,border:`1.5px solid ${C.primaryB}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <GeishaIcon size={30}/>
          </div>
          <div>
            <p style={{margin:0,fontSize:"17px",fontWeight:700,color:C.navy,fontFamily:SERIF}}>SolAraWeb</p>
            <p style={{margin:0,fontSize:"12px",color:C.textL}}>Wendy's Safe Space</p>
          </div>
        </div>
        <button onClick={()=>setShowCrisis(v=>!v)}
          style={{fontSize:"13px",fontWeight:700,padding:"9px 14px",borderRadius:"10px",border:`1.5px solid ${C.amberB}`,background:showCrisis?C.amberB:C.amberL,color:C.amber,cursor:"pointer",fontFamily:SANS,minHeight:"44px"}}>
          Crisis
        </button>
      </div>

      {/* Crisis panel */}
      {showCrisis&&(
        <div style={{background:C.amberL,borderBottom:`1.5px solid ${C.amberB}`,padding:"12px 16px",flexShrink:0,zIndex:2,maxHeight:"260px",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
          <p style={{margin:"0 0 10px",fontSize:"12px",fontWeight:700,color:C.amber,letterSpacing:"0.08em",textTransform:"uppercase"}}>Immediate help</p>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            <div style={{background:C.white,border:`1.5px solid ${C.amberB}`,borderRadius:"10px",padding:"10px 14px"}}>
              <p style={{margin:"0 0 3px",fontSize:"13px",color:C.amber,fontWeight:700}}>HOME TREATMENT TEAM (WHTT)</p>
              <p style={{margin:0,fontSize:"18px",color:"#3D2000",fontWeight:700,lineHeight:1.6}}>0203 513 6605</p>
              <p style={{margin:0,fontSize:"18px",color:"#3D2000",fontWeight:700}}>0203 513 6681</p>
              <p style={{margin:"4px 0 0",fontSize:"18px",color:C.red,fontWeight:700}}>0787 572 7262</p>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <div style={{flex:1,background:C.white,border:`1.5px solid ${C.amberB}`,borderRadius:"10px",padding:"10px 14px"}}>
                <p style={{margin:"0 0 3px",fontSize:"13px",color:C.amber,fontWeight:700}}>JAMIE</p>
                <p style={{margin:0,fontSize:"18px",color:"#3D2000",fontWeight:700}}>0735 61 30 140</p>
              </div>
              <div style={{flex:1,background:C.white,border:`1.5px solid ${C.amberB}`,borderRadius:"10px",padding:"10px 14px"}}>
                <p style={{margin:"0 0 3px",fontSize:"13px",color:C.amber,fontWeight:700}}>EMAD</p>
                <p style={{margin:0,fontSize:"17px",color:"#3D2000",fontWeight:700}}>+49 177 77 90 353</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {tab==="chat" &&<ChatTab/>}
        {tab==="today"&&<TodayTab setOverdueBadge={setOverdueBadge}/>}
        {tab==="diary"&&<DiaryTab/>}
        {tab==="plan" &&<PlanTab/>}
        {tab==="todo" &&<TodoTab/>}
      </div>

      {/* Bottom nav */}
      <div style={{background:C.white,borderTop:`1.5px solid ${C.border}`,display:"flex",flexShrink:0,zIndex:2,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"10px 4px 9px",background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",borderTop:`3px solid ${tab===t.id?C.primary:"transparent"}`,transition:"border-color 0.15s",minHeight:"58px",position:"relative"}}>
            <span style={{fontSize:"22px",lineHeight:1}}>{t.icon}</span>
            {t.badge&&(
              <span style={{position:"absolute",top:"8px",right:"calc(50% - 14px)",width:"9px",height:"9px",borderRadius:"50%",background:C.red,border:`2px solid ${C.white}`}}/>
            )}
            <span style={{fontSize:"11px",fontWeight:tab===t.id?700:500,color:tab===t.id?C.primary:C.textL}}>{t.label}</span>
          </button>
        ))}
      </div>

      <style>{`@keyframes pulse{0%,80%,100%{opacity:.25;transform:scale(.75)}40%{opacity:1;transform:scale(1)}}*{-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}
