import { useState, useEffect, useRef } from "react";

// ─── Palette (Version A colors + Version B layout) ──────────
const C = {
  bg:          "#f0f4f8",
  bgDeep:      "#e2e8f0",
  navy:        "#1e3a5f",
  navyMid:     "#2d5a8e",
  navyLight:   "#4a7ab5",
  navyPale:    "#c7daf0",
  white:       "#ffffff",
  glass:       "rgba(255,255,255,0.62)",
  glassBorder: "rgba(255,255,255,0.85)",
  text:        "#0f1f35",
  textMid:     "#2d4a6b",
  textSoft:    "#6b8aaa",
  accent:      "#3b82f6",
  accentDark:  "#1e40af",
  good:        "#0e7a50",
  warn:        "#b45309",
  danger:      "#b91c1c",
};

const AIRPORTS = {
  GRU:{ city:"São Paulo",    full:"Guarulhos International" },
  CGH:{ city:"São Paulo",    full:"Congonhas" },
  GIG:{ city:"Rio de Janeiro", full:"Galeão International" },
  SDU:{ city:"Rio de Janeiro", full:"Santos Dumont" },
  BSB:{ city:"Brasília",     full:"Presidente JK" },
  SSA:{ city:"Salvador",     full:"Dep. Luís Eduardo Magalhães" },
  FOR:{ city:"Fortaleza",    full:"Pinto Martins" },
  REC:{ city:"Recife",       full:"Guararapes–Gilberto Freyre" },
  MIA:{ city:"Miami",        full:"Miami International" },
  JFK:{ city:"Nova York",    full:"John F. Kennedy" },
  LHR:{ city:"Londres",      full:"Heathrow" },
  CDG:{ city:"Paris",        full:"Charles de Gaulle" },
  MAD:{ city:"Madri",        full:"Adolfo Suárez Barajas" },
  LIS:{ city:"Lisboa",       full:"Humberto Delgado" },
  FCO:{ city:"Roma",         full:"Leonardo da Vinci" },
  EZE:{ city:"Buenos Aires", full:"Ministro Pistarini" },
  SCL:{ city:"Santiago",     full:"Arturo Merino Benítez" },
  CUN:{ city:"Cancún",       full:"Cancún International" },
  DXB:{ city:"Dubai",        full:"Dubai International" },
  NRT:{ city:"Tóquio",       full:"Narita International" },
};

const RESULTS = [
  { id:1, airline:"LATAM", logo:"LA", origin:"GRU", destination:"LIS",
    departure:"23:15", arrival:"13:40+1", duration:"10h25", stops:0,
    price:2890, miles:48000, program:"LATAM Pass", score:98,
    tags:["Melhor custo-benefício","Direto"], cabin:"Econômica",
    aircraft:"Boeing 787", baggage:"1 × 23 kg", cashback:true,
    history:[3200,3100,2990,2890,2890,2950,2890],
    tip:"Voo direto com LATAM Pass. Se você tem cartão Itaú ou BB, transfira milhas com bônus de até 100%.",
    color:"#c0392b", buyUrl:"https://www.latam.com" },
  { id:2, airline:"TAP Air Portugal", logo:"TP", origin:"GRU", destination:"LIS",
    departure:"21:50", arrival:"11:20+1", duration:"9h30", stops:0,
    price:3240, miles:52000, program:"Miles&Go", score:91,
    tags:["Mais rápido","Conexão Lisboa grátis"], cabin:"Econômica",
    aircraft:"Airbus A330", baggage:"2 × 23 kg", cashback:false,
    history:[3800,3600,3400,3300,3240,3100,3240],
    tip:"O mais rápido e inclui conexão gratuita em Lisboa para qualquer cidade europeia.",
    color:"#0e7a50", buyUrl:"https://www.tap.pt" },
  { id:3, airline:"Emirates + LATAM", logo:"EK", origin:"GRU", destination:"LIS",
    departure:"01:30", arrival:"22:10+1", duration:"20h40", stops:1, stopCity:"Dubai",
    price:2340, miles:38000, program:"Smiles", score:85,
    tags:["Menor preço","1 escala Dubai"], cabin:"Econômica",
    aircraft:"B777 + A380", baggage:"2 × 23 kg", cashback:true,
    history:[2800,2700,2500,2400,2340,2290,2340],
    tip:"Menor preço absoluto. Escala de 4h em Dubai — terminal espetacular da Emirates.",
    color:"#b45309", buyUrl:"https://www.emirates.com" },
];

const ALERTS = [
  { route:"GRU → LIS", current:2890, target:2500, change:-8,  status:"watching" },
  { route:"GRU → MIA", current:1890, target:1600, change:-15, status:"alert" },
  { route:"CGH → BCN", current:3100, target:2800, change:+3,  status:"watching" },
];

const SOURCES = [
  { name:"Google Flights", type:"Agregador" },
  { name:"Seats.aero",     type:"Milhas" },
  { name:"LATAM Pass",     type:"Programa" },
  { name:"Smiles",         type:"Programa" },
  { name:"TudoAzul",       type:"Programa" },
  { name:"Miles&Go",       type:"Programa" },
  { name:"MaxMilhas",      type:"Balcão" },
  { name:"Decolar",        type:"OTA" },
];


// ─── API ─────────────────────────────────────────────────────
const API_URL = "https://voomax-api.vercel.app";

const AIRLINE_COLORS = {
  LA:"#c0392b", TP:"#0e7a50", G3:"#e63946", AD:"#0066cc",
  EK:"#b45309", AA:"#0078d2", LH:"#002d6e", AF:"#002395",
  KL:"#00a1de", IB:"#e10d0d", UA:"#003580",
};

const AIRLINE_URLS = {
  LA:"https://www.latam.com", TP:"https://www.tap.pt",
  G3:"https://www.voegol.com.br", AD:"https://www.voeazul.com.br",
  EK:"https://www.emirates.com", AA:"https://www.aa.com",
};

function adaptResult(r, i) {
  const code = r.airlineCode || "??";
  const stops = r.stops || 0;
  const tags = [];
  if (stops === 0) tags.push("Direto");
  if (i === 0) tags.push("Melhor custo-benefício");
  if (r.miles > 0) tags.push("Disponível em milhas");
  if (r.price > 0 && i === (r.price < 2500 ? 0 : -1)) tags.push("Menor preço");

  return {
    id:          r.id || i,
    airline:     r.airline || code,
    logo:        code.slice(0, 2).toUpperCase(),
    color:       AIRLINE_COLORS[code] || "#4a7ab5",
    origin:      r.origin,
    destination: r.destination,
    departure:   r.departure || "—",
    arrival:     r.arrival || "—",
    duration:    r.duration || "—",
    stops,
    stopCity:    r.stopCities?.[0] || "",
    price:       r.price || 0,
    miles:       r.miles || 0,
    program:     r.program || r.source || "—",
    score:       r.score || 80,
    tags,
    cabin:       r.cabin || "Econômica",
    baggage:     r.baggage || "Verificar",
    cashback:    false,
    history:     [r.price, r.price, r.price, r.price, r.price, r.price, r.price].filter(Boolean),
    tip:         r.source === "seats.aero"
      ? `Disponível via ${r.program}. Transfira pontos com antecedência para garantir assentos prêmio.`
      : `Voo operado por ${r.airline}. Reserve com antecedência para garantir este preço.`,
    buyUrl:      AIRLINE_URLS[code] || "https://www.google.com/flights",
  };
}

// Fallback enquanto API não retorna resultados
const RESULTS_FALLBACK = [];

const LOADING_STEPS = [
  "Consultando Google Flights",
  "Varrendo Seats.aero",
  "Verificando LATAM Pass",
  "Verificando Smiles",
  "Consultando TudoAzul",
  "Cruzando tabelas ocultas",
  "Analisando histórico de preços",
  "Calculando melhor estratégia",
];

// ─── Sparkline ───────────────────────────────────────────────
function Spark({ data, up }) {
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const W = 64, H = 22;
  const pts = data.map((v,i) => `${(i/(data.length-1))*W},${H-((v-mn)/rng)*(H-4)-2}`).join(" ");
  const col = up ? C.warn : C.good;
  const last = pts.split(" ").at(-1).split(",");
  return (
    <svg width={W} height={H} style={{ flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={col}/>
    </svg>
  );
}

// ─── Pill ────────────────────────────────────────────────────
function Pill({ children, blue }) {
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99, whiteSpace:"nowrap",
      background: blue ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.55)",
      color: blue ? C.accentDark : C.textMid,
      border: `1px solid ${blue ? "rgba(59,130,246,0.25)" : C.glassBorder}`,
    }}>{children}</span>
  );
}

// ─── Airport autocomplete ─────────────────────────────────────
function AirportInput({ label, icon, onChange }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const filtered = Object.entries(AIRPORTS)
    .filter(([c,i]) => !q || c.toLowerCase().includes(q.toLowerCase()) || i.city.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 6);

  const pick = (code) => {
    setQ(`${AIRPORTS[code].city} (${code})`);
    onChange(code);
    setOpen(false);
  };

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ flex:1, minWidth:0, position:"relative" }}>
      <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:C.textSoft }}>{label}</p>
      <div style={{ display:"flex", alignItems:"center", gap:10, background:C.glass, border:`1.5px solid ${C.glassBorder}`, borderRadius:16, padding:"13px 14px", backdropFilter:"blur(12px)", cursor:"text" }}
        onClick={() => setOpen(true)}>
        <span style={{ fontSize:17, flexShrink:0 }}>{icon}</span>
        <input value={q} onChange={e=>{ setQ(e.target.value); onChange(""); setOpen(true); }}
          placeholder="Cidade ou código"
          style={{ border:"none", background:"transparent", outline:"none", fontSize:14, fontWeight:600, color:C.text, width:"100%", minWidth:0, fontFamily:"inherit" }}/>
      </div>
      {open && filtered.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"rgba(240,244,248,0.97)", backdropFilter:"blur(20px)", border:`1px solid ${C.glassBorder}`, borderRadius:16, overflow:"hidden", boxShadow:"0 12px 32px rgba(15,31,53,0.14)", zIndex:200 }}>
          {filtered.map(([code,info]) => (
            <div key={code} onClick={() => pick(code)}
              style={{ padding:"11px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid rgba(255,255,255,0.5)` }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.6)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:12, color:C.accent, width:34, flexShrink:0 }}>{code}</span>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{info.city}</div>
                <div style={{ fontSize:11, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{info.full}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modern loading animation ─────────────────────────────────
function LoadingScreen({ step, pct }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", gap:0 }}>
      <style>{`
        @keyframes plane-fly {
          0%   { transform: translateX(-18px) translateY(0px) rotate(-3deg); }
          25%  { transform: translateX(0px) translateY(-10px) rotate(1deg); }
          50%  { transform: translateX(18px) translateY(0px) rotate(3deg); }
          75%  { transform: translateX(0px) translateY(10px) rotate(-1deg); }
          100% { transform: translateX(-18px) translateY(0px) rotate(-3deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.85); opacity: 0.6; }
          50%  { transform: scale(1.15); opacity: 0.15; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity:0.3; }
          40%            { transform: translateY(-8px); opacity:1; }
        }
        @keyframes scan-line {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes fade-in-up {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Plane with pulse rings */}
      <div style={{ position:"relative", width:96, height:96, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:32 }}>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${C.navyPale}`, animation:"pulse-ring 2s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", inset:12, borderRadius:"50%", border:`2px solid ${C.navyPale}`, animation:"pulse-ring 2s ease-in-out infinite 0.4s" }}/>
        <div style={{ position:"absolute", inset:24, borderRadius:"50%", background:`rgba(59,130,246,0.08)` }}/>
        <div style={{ fontSize:36, animation:"plane-fly 3s ease-in-out infinite", position:"relative", zIndex:1 }}>✈️</div>
      </div>

      <h2 style={{ fontWeight:900, fontSize:22, color:C.text, letterSpacing:"-0.03em", margin:"0 0 6px", textAlign:"center" }}>
        Varrendo a internet…
      </h2>

      {/* Current source with animated transition */}
      <p key={step} style={{ color:C.textSoft, fontSize:13, margin:"0 0 36px", textAlign:"center", animation:"fade-in-up 0.35s ease" }}>
        {LOADING_STEPS[step] || LOADING_STEPS[LOADING_STEPS.length-1]}
      </p>

      {/* Sources grid — lights up as each is scanned */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:360, marginBottom:32 }}>
        {SOURCES.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.name} style={{
              display:"flex", alignItems:"center", gap:6,
              background: done ? "rgba(59,130,246,0.12)" : active ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.4)",
              border: `1px solid ${done ? "rgba(59,130,246,0.3)" : active ? "rgba(59,130,246,0.2)" : C.glassBorder}`,
              borderRadius:99, padding:"5px 12px",
              transition:"all 0.4s ease",
              backdropFilter:"blur(8px)",
            }}>
              <span style={{
                width:6, height:6, borderRadius:"50%", flexShrink:0,
                background: done ? C.accent : active ? C.warn : C.textSoft,
                boxShadow: active ? `0 0 6px ${C.warn}` : done ? `0 0 4px ${C.accent}66` : "none",
                transition:"all 0.4s",
              }}/>
              <span style={{ fontSize:11, fontWeight:700, color: done ? C.accentDark : active ? C.warn : C.textSoft, transition:"color 0.4s" }}>
                {s.name}
              </span>
              {done && <span style={{ fontSize:10, color:C.good }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Thin scan-line track */}
      <div style={{ width:"100%", maxWidth:320, height:3, background:"rgba(255,255,255,0.4)", borderRadius:99, overflow:"hidden", position:"relative", border:`1px solid ${C.glassBorder}` }}>
        <div style={{ position:"absolute", inset:0, background:`linear-gradient(90deg, transparent, ${C.accent}, transparent)`, animation:"scan-line 1.6s linear infinite", width:"40%" }}/>
      </div>

      {/* 3 bouncing dots */}
      <div style={{ display:"flex", gap:6, marginTop:20 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:C.accent, animation:`dot-bounce 1.2s ease-in-out infinite ${i*0.2}s` }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Result Card ─────────────────────────────────────────────
function Card({ r, rank, onSelect }) {
  const medals = ["🥇","🥈","🥉"];
  const rankLabel = ["Top escolha","2ª opção","3ª opção"];
  const up = r.price > Math.min(...r.history);

  return (
    <div onClick={() => onSelect(r)}
      style={{
        background: C.glass,
        backdropFilter:"blur(14px)",
        border:`1.5px solid ${rank===0 ? "rgba(59,130,246,0.45)" : C.glassBorder}`,
        borderRadius:22,
        padding:"20px",
        cursor:"pointer",
        boxShadow: rank===0 ? "0 6px 28px rgba(59,130,246,0.14)" : "0 2px 12px rgba(15,31,53,0.06)",
        transition:"transform 0.2s, box-shadow 0.2s",
        position:"relative", overflow:"hidden",
      }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 36px rgba(59,130,246,0.18)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=rank===0?"0 6px 28px rgba(59,130,246,0.14)":"0 2px 12px rgba(15,31,53,0.06)"; }}>

      {rank===0 && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.accent},#6366f1)`, borderRadius:"22px 22px 0 0" }}/>}

      {/* Row 1: airline + rank + score */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`${r.color}18`, border:`1.5px solid ${r.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12, color:r.color, flexShrink:0 }}>{r.logo}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:14, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.airline}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{r.aircraft} · {r.cabin}</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:700, color:C.textMid, whiteSpace:"nowrap" }}>{medals[rank]} {rankLabel[rank]}</span>
          <span style={{ fontSize:11, fontWeight:800, color:r.score>=95?C.good:r.score>=88?C.accent:C.warn }}>{r.score}/100</span>
        </div>
      </div>

      {/* Row 2: route */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        {/* Departure */}
        <div style={{ flexShrink:0 }}>
          <div style={{ fontWeight:900, fontSize:24, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>{r.departure}</div>
          <div style={{ fontWeight:700, fontSize:12, color:C.accent, marginTop:2 }}>{r.origin}</div>
        </div>
        {/* Middle */}
        <div style={{ flex:1, textAlign:"center", minWidth:0 }}>
          <div style={{ fontSize:11, color:C.textSoft, marginBottom:3 }}>{r.duration}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ flex:1, height:1, background:`${C.accent}33` }}/>
            <span style={{ fontSize:13 }}>✈</span>
            <div style={{ flex:1, height:1, background:`${C.accent}33` }}/>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:r.stops===0?C.good:C.warn, marginTop:3 }}>
            {r.stops===0?"Direto":`Escala · ${r.stopCity}`}
          </div>
        </div>
        {/* Arrival */}
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontWeight:900, fontSize:24, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>{r.arrival}</div>
          <div style={{ fontWeight:700, fontSize:12, color:C.accent, marginTop:2 }}>{r.destination}</div>
        </div>
        {/* Price — constrained, never overflows */}
        <div style={{ marginLeft:8, textAlign:"right", flexShrink:0, maxWidth:110 }}>
          <div style={{ fontWeight:900, fontSize:20, color:C.text, letterSpacing:"-0.03em", lineHeight:1.1, wordBreak:"break-all" }}>
            R${r.price.toLocaleString("pt-BR")}
          </div>
          <div style={{ fontSize:11, color:C.textSoft, marginTop:2, lineHeight:1.3 }}>
            {(r.miles/1000).toFixed(0)}k mi<br/>{r.program}
          </div>
        </div>
      </div>

      {/* Row 3: tags + spark + buy */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", minWidth:0, flex:1 }}>
          {r.tags.map(t=><Pill key={t} blue>{t}</Pill>)}
          {r.cashback && <Pill>💰 Cashback</Pill>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <Spark data={r.history} up={up}/>
          <button onClick={e=>{ e.stopPropagation(); window.open(r.buyUrl,"_blank"); }}
            style={{ background:`linear-gradient(135deg,${C.navy},${C.accent})`, color:"#fff", border:"none", borderRadius:11, padding:"9px 16px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", boxShadow:`0 4px 12px ${C.accent}44` }}>
            Comprar →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────
function Dashboard({ onBack }) {
  return (
    <div style={{ padding:"24px 0 48px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <BtnGlass onClick={onBack}>← Buscar</BtnGlass>
        <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:C.text, letterSpacing:"-0.03em" }}>Monitor de Preços</h2>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {[["🔔","3","Alertas ativos"],["💰","R$1.040","Economia potencial"],["✈️","7","Rotas monitoradas"]].map(([icon,val,lab])=>(
          <div key={lab} style={{ background:C.glass, border:`1.5px solid ${C.glassBorder}`, borderRadius:20, padding:"16px 12px", backdropFilter:"blur(12px)", boxShadow:"0 2px 10px rgba(15,31,53,0.07)", textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
            <div style={{ fontWeight:900, fontSize:18, color:C.text, letterSpacing:"-0.02em" }}>{val}</div>
            <div style={{ fontSize:11, color:C.textSoft, fontWeight:600, marginTop:2, lineHeight:1.3 }}>{lab}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.glass, border:`1.5px solid ${C.glassBorder}`, borderRadius:22, overflow:"hidden", backdropFilter:"blur(14px)", marginBottom:12, boxShadow:"0 4px 20px rgba(15,31,53,0.07)" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid rgba(255,255,255,0.5)`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:800, fontSize:14, color:C.text }}>Alertas de Preço</span>
          <button style={{ background:C.accent, color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>+ Novo</button>
        </div>
        {ALERTS.map((a,i)=>(
          <div key={i} style={{ padding:"14px 18px", borderBottom:i<ALERTS.length-1?"1px solid rgba(255,255,255,0.4)":"none", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{a.route}</div>
              <div style={{ fontSize:11, color:C.textSoft }}>Meta: R${a.target.toLocaleString("pt-BR")}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:800, fontSize:15, color:C.text }}>R${a.current.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize:11, fontWeight:700, color:a.change<0?C.good:C.danger }}>{a.change<0?"↓":"↑"} {Math.abs(a.change)}%</div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:"4px 10px", borderRadius:99, whiteSpace:"nowrap",
                background:a.status==="alert"?"rgba(180,83,9,0.12)":"rgba(59,130,246,0.1)",
                color:a.status==="alert"?C.warn:C.accent,
                border:`1px solid ${a.status==="alert"?"rgba(180,83,9,0.25)":"rgba(59,130,246,0.25)"}` }}>
                {a.status==="alert"?"⚡ Alerta":"👁 Watch"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:C.glass, border:`1.5px solid ${C.glassBorder}`, borderRadius:22, padding:"18px", backdropFilter:"blur(14px)" }}>
        <div style={{ fontWeight:800, fontSize:13, color:C.text, marginBottom:12 }}>Fontes Ativas</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
          {SOURCES.map(s=>(
            <span key={s.name} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.55)", border:`1px solid ${C.glassBorder}`, borderRadius:99, padding:"5px 12px", fontSize:11, fontWeight:600, color:C.textMid }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:C.good, display:"inline-block", flexShrink:0 }}/>
              {s.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Detail ──────────────────────────────────────────────────
function Detail({ r, onBack }) {
  return (
    <div style={{ padding:"20px 0 48px" }}>
      <BtnGlass onClick={onBack} style={{ marginBottom:20 }}>← Resultados</BtnGlass>
      <div style={{ background:C.glass, border:`1.5px solid ${C.glassBorder}`, borderRadius:26, padding:"24px", backdropFilter:"blur(16px)", boxShadow:"0 8px 32px rgba(15,31,53,0.09)" }}>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`${r.color}15`, border:`1.5px solid ${r.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:r.color, flexShrink:0 }}>{r.logo}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:18, color:C.text }}>{r.airline}</div>
            <div style={{ fontSize:12, color:C.textSoft }}>{r.aircraft} · {r.cabin}</div>
          </div>
          <div style={{ marginLeft:"auto", textAlign:"right", flexShrink:0 }}>
            <div style={{ fontWeight:900, fontSize:28, color:C.text, letterSpacing:"-0.04em", lineHeight:1 }}>R${r.price.toLocaleString("pt-BR")}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>por pessoa</div>
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.45)", borderRadius:18, padding:"18px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:26, color:C.text, letterSpacing:"-0.03em" }}>{r.departure}</div>
            <div style={{ fontWeight:700, fontSize:13, color:C.accent }}>{r.origin}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{AIRPORTS[r.origin]?.city}</div>
          </div>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:11, color:C.textSoft, marginBottom:4 }}>{r.duration}</div>
            <div style={{ height:2, background:`linear-gradient(90deg,${C.accent},#6366f1)`, borderRadius:2 }}/>
            <div style={{ fontSize:11, fontWeight:700, color:r.stops===0?C.good:C.warn, marginTop:4 }}>
              {r.stops===0?"✈ Voo Direto":`1 escala · ${r.stopCity}`}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontWeight:900, fontSize:26, color:C.text, letterSpacing:"-0.03em" }}>{r.arrival}</div>
            <div style={{ fontWeight:700, fontSize:13, color:C.accent }}>{r.destination}</div>
            <div style={{ fontSize:11, color:C.textSoft }}>{AIRPORTS[r.destination]?.city}</div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
          {[["🧳","Bagagem",r.baggage],["⭐","Programa",r.program],["🪙","Milhas",(r.miles/1000).toFixed(0)+"k"]].map(([ic,lb,vl])=>(
            <div key={lb} style={{ background:"rgba(255,255,255,0.45)", borderRadius:14, padding:"14px 10px", textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:5 }}>{ic}</div>
              <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{vl}</div>
              <div style={{ fontSize:10, color:C.textSoft }}>{lb}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(59,130,246,0.07)", border:"1.5px solid rgba(59,130,246,0.18)", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:12, color:C.accent, marginBottom:5 }}>💡 Dica do especialista</div>
          <div style={{ fontSize:13, color:C.textMid, lineHeight:1.6 }}>{r.tip}</div>
        </div>

        <button onClick={()=>window.open(r.buyUrl,"_blank")}
          style={{ width:"100%", background:`linear-gradient(135deg,${C.navy},${C.accent})`, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 6px 18px ${C.accent}44` }}>
          Comprar por R${r.price.toLocaleString("pt-BR")} →
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function BtnGlass({ onClick, children, style }) {
  return (
    <button onClick={onClick} style={{ background:C.glass, border:`1px solid ${C.glassBorder}`, borderRadius:10, padding:"8px 14px", cursor:"pointer", fontWeight:700, fontSize:12, color:C.textMid, fontFamily:"inherit", backdropFilter:"blur(8px)", ...style }}>
      {children}
    </button>
  );
}

// ─── Navbar ──────────────────────────────────────────────────
function Navbar({ onSearch, onDash, active }) {
  return (
    <div style={{ background:"rgba(240,244,248,0.75)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.glassBorder}`, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:54, position:"sticky", top:0, zIndex:100 }}>
      <div onClick={onSearch} style={{ fontWeight:900, fontSize:19, color:C.text, cursor:"pointer", letterSpacing:"-0.04em" }}>
        Voo<span style={{ color:C.accent }}>Max</span>
      </div>
      <div style={{ display:"flex", gap:4 }}>
        {[["search","🔍 Buscar",onSearch],["dashboard","📡 Monitor",onDash]].map(([k,lb,fn])=>(
          <button key={k} onClick={fn}
            style={{ border:`1px solid ${active===k?"rgba(59,130,246,0.3)":"transparent"}`, borderRadius:10, padding:"7px 13px", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit",
              background:active===k?"rgba(59,130,246,0.1)":"transparent",
              color:active===k?C.accent:C.textSoft }}>
            {lb}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────
export default function VooMax() {
  const [view, setView] = useState("search");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState("roundtrip");
  const [dateGo, setDateGo] = useState("");
  const [dateBack, setDateBack] = useState("");
  const [loadStep, setLoadStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  const doSearch = async () => {
    if (!origin || !destination || !dateGo) return;
    setView("loading");
    setLoadStep(0);
    setResults([]);
    setSearchError(null);

    let i = 0;
    const iv = setInterval(() => {
      i++;
      setLoadStep(i);
      if (i >= LOADING_STEPS.length) clearInterval(iv);
    }, 500);

    try {
      const res = await fetch(`${API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          departureDate: dateGo,
          returnDate: tripType !== "oneway" && dateBack ? dateBack : undefined,
          adults: 1,
        }),
      });

      const data = await res.json();
      clearInterval(iv);

      if (!res.ok || !data.results?.length) {
        setSearchError(data.error || "Nenhum resultado encontrado para esta rota e data.");
        setView("results");
        return;
      }

      setResults(data.results.map(adaptResult));
      setView("results");

    } catch (err) {
      clearInterval(iv);
      setSearchError("Erro de conexão com o servidor. Tente novamente.");
      setView("results");
    }
  };

  const pageBg = {
    minHeight:"100vh",
    background:`radial-gradient(ellipse at 15% 10%, #c7daf0 0%, ${C.bg} 45%, ${C.bgDeep} 100%)`,
    fontFamily:"'DM Sans','Segoe UI',sans-serif",
  };

  if (view==="dashboard") return (
    <div style={pageBg}>
      <Navbar onSearch={()=>setView("search")} onDash={()=>setView("dashboard")} active="dashboard"/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"0 18px" }}>
        <Dashboard onBack={()=>setView("search")}/>
      </div>
    </div>
  );

  if (view==="detail" && selected) return (
    <div style={pageBg}>
      <Navbar onSearch={()=>setView("search")} onDash={()=>setView("dashboard")}/>
      <div style={{ maxWidth:720, margin:"0 auto", padding:"0 18px" }}>
        <Detail r={selected} onBack={()=>setView("results")}/>
      </div>
    </div>
  );

  return (
    <div style={pageBg}>
      <Navbar onSearch={()=>setView("search")} onDash={()=>setView("dashboard")} active={view==="search"||view==="loading"?"search":""}/>

      {view==="search" && (
        <div style={{ padding:"44px 18px 0", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.5)", backdropFilter:"blur(8px)", borderRadius:99, padding:"5px 14px", marginBottom:16, fontSize:11, fontWeight:700, color:C.textMid, border:`1px solid ${C.glassBorder}` }}>
            ✈️ Especialista em milhas, balcão e melhores preços
          </div>
          <h1 style={{ margin:"0 0 6px", fontSize:44, fontWeight:900, color:C.text, letterSpacing:"-0.04em", lineHeight:1 }}>
            Voo<span style={{ color:C.accent }}>Max</span>
          </h1>
          <p style={{ margin:"0 0 36px", fontSize:15, color:C.textSoft }}>Buscador inteligente de passagens aéreas</p>
        </div>
      )}

      <div style={{ maxWidth:720, margin:"0 auto", padding: view==="search"?"0 18px 60px":"18px 18px 60px" }}>

        {/* Search form */}
        {view==="search" && (
          <div style={{ background:C.glass, border:`1.5px solid ${C.glassBorder}`, borderRadius:26, padding:"22px", backdropFilter:"blur(18px)", boxShadow:"0 8px 40px rgba(15,31,53,0.09)" }}>

            <div style={{ display:"flex", gap:5, marginBottom:20, background:"rgba(255,255,255,0.35)", borderRadius:13, padding:4 }}>
              {[["oneway","Só ida"],["roundtrip","Ida e volta"],["flexible","Melhor preço"]].map(([v,lb])=>(
                <button key={v} onClick={()=>setTripType(v)}
                  style={{ flex:1, padding:"9px 6px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"inherit", transition:"all 0.15s",
                    background:tripType===v?`linear-gradient(135deg,${C.navy},${C.accent})`:"transparent",
                    color:tripType===v?"#fff":C.textSoft,
                    boxShadow:tripType===v?`0 3px 10px ${C.accent}44`:"none" }}>
                  {lb}
                </button>
              ))}
            </div>

            <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
              <AirportInput label="Origem" icon="🛫" onChange={setOrigin}/>
              <AirportInput label="Destino" icon="🛬" onChange={setDestination}/>
            </div>

            <div style={{ display:"flex", gap:12, marginBottom:22 }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:C.textSoft }}>Ida</p>
                <input type="date" value={dateGo} onChange={e=>setDateGo(e.target.value)}
                  style={{ width:"100%", padding:"12px 14px", border:`1.5px solid ${C.glassBorder}`, borderRadius:14, fontSize:13, fontFamily:"inherit", color:C.text, background:C.glass, outline:"none", backdropFilter:"blur(8px)", boxSizing:"border-box" }}/>
              </div>
              {tripType!=="oneway" && (
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:C.textSoft }}>Volta</p>
                  <input type="date" value={dateBack} onChange={e=>setDateBack(e.target.value)}
                    style={{ width:"100%", padding:"12px 14px", border:`1.5px solid ${C.glassBorder}`, borderRadius:14, fontSize:13, fontFamily:"inherit", color:C.text, background:C.glass, outline:"none", backdropFilter:"blur(8px)", boxSizing:"border-box" }}/>
                </div>
              )}
            </div>

            <button onClick={doSearch}
              style={{ width:"100%", background:`linear-gradient(135deg,${C.navy},${C.accent})`, color:"#fff", border:"none", borderRadius:14, padding:"15px", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 6px 20px ${C.accent}44`, transition:"transform 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 8px 26px ${C.accent}55`; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 6px 20px ${C.accent}44`; }}>
              Buscar melhor passagem ✈
            </button>
          </div>
        )}

        {/* Loading */}
        {view==="loading" && <LoadingScreen step={loadStep} pct={Math.round((loadStep/LOADING_STEPS.length)*100)}/>}

        {/* Results */}
        {view==="results" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22, gap:12 }}>
              <div>
                <p style={{ margin:"0 0 3px", fontSize:11, fontWeight:700, color:C.textSoft, letterSpacing:"0.08em", textTransform:"uppercase" }}>Melhores resultados</p>
                <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:C.text, letterSpacing:"-0.03em", lineHeight:1.2 }}>
                  {AIRPORTS[origin]?.city||origin} → {AIRPORTS[destination]?.city||destination}
                </h2>
              </div>
              <BtnGlass onClick={()=>setView("search")} style={{ flexShrink:0, marginTop:4 }}>← Nova busca</BtnGlass>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {results.map((r,i)=>(
                <Card key={r.id} r={r} rank={i} onSelect={r=>{ setSelected(r); setView("detail"); }}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
