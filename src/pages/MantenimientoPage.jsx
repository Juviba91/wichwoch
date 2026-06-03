import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug } from "../data/constants";
import { Spinner } from "../components/UI";

const SERVICE_INTERVALS = {
  rolex:10, omega:8, patek:5, ap:5, iwc:5, jlc:5, tudor:10,
  cartier:5, breitling:5, tag:5, vc:5, hublot:5, panerai:5, gs:5, zenith:5
};

function getInterval(slug) { return SERVICE_INTERVALS[(slug||"").split("_")[0]] || 5; }

function getNextService(lastDate, slug) {
  if(!lastDate) return null;
  const d = new Date(lastDate);
  d.setFullYear(d.getFullYear() + getInterval(slug));
  return d;
}

function getStatus(watch, lastSvc) {
  const next = getNextService(lastSvc?.service_date, watch?.slug);
  if(!next) return { status:"sin_historial", label:"Sin historial", color:"#aaa", urgent:false };
  const months = (next - new Date()) / (1000*60*60*24*30);
  if(months < 0) return { status:"vencido", label:"Revisión vencida", color:"#dc2626", urgent:true };
  if(months < 6) return { status:"proximo", label:"Revisión próxima", color:"#d97706", urgent:true };
  return { status:"ok", label:"Al día", color:"#16a34a", urgent:false };
}

export function MantenimientoPage({ currentUser, onNavigate }) {
  const [watches, setWatches] = useState([]);
  const [services, setServices] = useState({});
  const [todos, setTodos] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("overview"); // overview | detail

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    const {data:regs}=await supabase.from("watch_registrations")
      .select("id,watch:watches(id,slug,model,image_url,brand_slug,market_price)")
      .eq("user_id",currentUser.id);
    const regIds=(regs||[]).map(r=>r.id);
    if(regIds.length>0) {
      const [{data:svcs},{data:tdos}]=await Promise.all([
        supabase.from("watch_service_history").select("*").in("registration_id",regIds).order("service_date",{ascending:false}),
        supabase.from("maintenance_todos").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:true}),
      ]);
      const svcMap = {};
      (svcs||[]).forEach(s=>{ if(!svcMap[s.registration_id]) svcMap[s.registration_id]=s; });
      const svcAllMap = {};
      (svcs||[]).forEach(s=>{ if(!svcAllMap[s.registration_id]) svcAllMap[s.registration_id]=[]; svcAllMap[s.registration_id].push(s); });
      setServices({...svcMap, _all:svcAllMap});
      const todoMap = {};
      (tdos||[]).forEach(t=>{ if(!todoMap[t.registration_id]) todoMap[t.registration_id]=[]; todoMap[t.registration_id].push(t); });
      setTodos(todoMap);
    }
    setWatches(regs||[]);
    setLoading(false);
  }

  const urgent = watches.filter(w=>getStatus(w.watch,services[w.id]).urgent);


  if(loading) return <Spinner />;
  if(view==="detail"&&selected) return (
    <WatchMaintDetail reg={selected} services={services._all?.[selected.id]||[]} todos={todos[selected.id]||[]} currentUser={currentUser} onBack={()=>{ setView("overview"); load(); }} onNavigate={onNavigate} />
  );

  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom:4 }}>🔧 Mantenimiento</h2>
      <p style={{ ...S.muted, marginBottom:20 }}>Seguimiento del cuidado de tu colección</p>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
        <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:20 }}>
          <div style={{ fontSize:28, marginBottom:4 }}>⌚</div>
          <div style={{ fontWeight:700, fontSize:22 }}>{watches.length}</div>
          <div style={S.muted}>relojes</div>
        </div>

        <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:20 }}>
          <div style={{ fontSize:28, marginBottom:4 }}>✓</div>
          <div style={{ fontWeight:700, fontSize:22, color:urgent.length>0?"#dc2626":"#16a34a" }}>{urgent.length}</div>
          <div style={S.muted}>{urgent.length===1?"necesita atención":"necesitan atención"}</div>
        </div>
      </div>

      {/* Alertas */}
      {urgent.length>0&&(
        <div style={{ ...S.card, borderLeft:"4px solid #dc2626", background:"#fff5f5", marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#dc2626", marginBottom:10 }}>⚠️ Atención requerida</div>
          {urgent.map(w=>{
            const s=getStatus(w.watch,services[w.id]);
            return (
              <div key={w.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div>
                  <span style={{ fontSize:13, fontWeight:600 }}>{w.watch?.model}</span>
                  <span style={{ fontSize:12, color:s.color, marginLeft:8, fontWeight:600 }}>{s.label}</span>
                </div>
                <button style={{ ...S.btn("outline"), fontSize:11, padding:"3px 10px" }} onClick={()=>onNavigate("talleres")}>Buscar taller →</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Relojes */}
      {watches.length===0&&(
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔧</div>
          <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Sin relojes en tu Garage</div>
          <button style={S.btn("primary")} onClick={()=>onNavigate("garage")}>Ir al Garage</button>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {watches.map(w=>{
          const lastSvc=services[w.id];
          const status=getStatus(w.watch,lastSvc);
          const next=getNextService(lastSvc?.service_date,w.watch?.slug);
          const interval=getInterval(w.watch?.slug);
          const pendingTodos=(todos[w.id]||[]).filter(t=>!t.completed).length;

          return (
            <div key={w.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}
              onClick={()=>onNavigate("garage_watch", w.id)}>
              <div style={{ width:52, height:52, borderRadius:10, background:`linear-gradient(135deg,${brandColor(w.watch?.slug||"")},${brandColor(w.watch?.slug||"")}88)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {w.watch?.image_url?<img src={w.watch.image_url} alt="" style={{ height:"85%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:22 }}>⌚</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{w.watch?.model}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#aaa" }}>{brandFromSlug(w.watch?.slug||"")}</div>
                {pendingTodos>0&&<div style={{ fontSize:11, color:"#d97706", marginTop:2 }}>📋 {pendingTodos} tarea{pendingTodos>1?"s":""} pendiente{pendingTodos>1?"s":""}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, fontWeight:700, color:status.color }}>{status.label}</div>
                {next&&<div style={{ fontSize:11, color:"#aaa" }}>Próx: {next.getFullYear()}</div>}
                {!lastSvc&&<div style={{ fontSize:11, color:"#aaa" }}>Sin servicios</div>}
                <div style={{ fontSize:11, color:"#aaa" }}>Cada {interval} años</div>
              </div>
              <span style={{ color:"#aaa", fontSize:16 }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DETALLE DE MANTENIMIENTO POR RELOJ ──────────────────────────────────────
function WatchMaintDetail({ reg, services, todos: initialTodos, currentUser, onBack, onNavigate }) {
  const watch = reg.watch;
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);
  const status = getStatus(watch, services[0]);
  const next = getNextService(services[0]?.service_date, watch?.slug);
  const interval = getInterval(watch?.slug);

  async function addTodo() {
    if(!newTodo.trim()) return;
    const {data}=await supabase.from("maintenance_todos").insert({
      user_id:currentUser.id, registration_id:reg.id, title:newTodo.trim()
    }).select().single();
    if(data) setTodos(t=>[...t,data]);
    setNewTodo(""); setAddingTodo(false);
  }

  async function toggleTodo(id, completed) {
    await supabase.from("maintenance_todos").update({completed:!completed, completed_at:!completed?new Date().toISOString():null}).eq("id",id);
    setTodos(t=>t.map(td=>td.id===id?{...td,completed:!completed}:td));
  }

  async function deleteTodo(id) {
    await supabase.from("maintenance_todos").delete().eq("id",id);
    setTodos(t=>t.filter(td=>td.id!==id));
  }

  const bg = brandColor(watch?.slug||"");
  const BRAND_TIPS = {
    rolex:"Los Rolex modernos son muy robustos. Revision recomendada cada 10 años o si notas pérdida de precisión.",
    omega:"Omega recomienda revisión cada 8-10 años. Los Co-Axial son especialmente duraderos.",
    patek:"Patek Philippe recomienda revisión cada 5 años para mantener la garantía y el valor.",
    ap:"Audemars Piguet recomienda revisión cada 5 años. El Royal Oak es especialmente resistente.",
  };
  const brandSlug = (watch?.slug||"").split("_")[0];
  const tip = BRAND_TIPS[brandSlug];

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={onBack}>← Mantenimiento</button>
        <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("garage")}>⌚ Garage</button>
      </div>

      {/* Hero */}
      <div style={{ height:160, background:`linear-gradient(135deg,${bg},${bg}88)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", marginBottom:20, overflow:"hidden" }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>{brandFromSlug(watch?.slug||"")}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, color:"#fff", fontWeight:700 }}>{watch?.model}</div>
          <div style={{ marginTop:8, display:"inline-block", background:status.color, borderRadius:20, padding:"3px 12px", fontSize:12, color:"#fff", fontWeight:700 }}>{status.label}</div>
        </div>
        {watch?.image_url&&<img src={watch.image_url} alt="" style={{ height:"80%", objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }} onError={e=>e.target.style.display="none"} />}
      </div>

      {/* Info rápida */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:14 }}>
          <div style={S.label}>Intervalo</div>
          <div style={{ fontWeight:700 }}>Cada {interval} años</div>
        </div>
        <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:14 }}>
          <div style={S.label}>Último servicio</div>
          <div style={{ fontWeight:700 }}>{services[0]?.service_date||"—"}</div>
        </div>
        <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:14, background:status.urgent?"#fff5f5":"#fff" }}>
          <div style={S.label}>Próxima revisión</div>
          <div style={{ fontWeight:700, color:status.color }}>{next?next.getFullYear():"—"}</div>
        </div>
      </div>

      {/* Tip de marca */}
      {tip&&(
        <div style={{ ...S.card, background:"#f8f6f0", marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>💡 Consejo de mantenimiento</div>
          <p style={{ fontSize:13, color:"#555", margin:0, lineHeight:1.6 }}>{tip}</p>
        </div>
      )}

      {/* Timeline */}
      <div style={{ ...S.card, marginBottom:20 }}>
        <div style={{ ...S.row, justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ ...S.h2, marginBottom:0 }}>📅 Historial</h3>
          <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("garage")}>+ Añadir servicio</button>
        </div>
        {services.length===0&&<p style={S.muted}>Sin servicios registrados.</p>}
        <div style={{ position:"relative" }}>
          {services.map((s,i)=>(
            <div key={s.id} style={{ display:"flex", gap:14, marginBottom:i<services.length-1?20:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:12, height:12, borderRadius:"50%", background:"#b8963e", flexShrink:0, marginTop:4 }} />
                {i<services.length-1&&<div style={{ width:2, flex:1, background:"#e0ddd6", margin:"4px 0" }} />}
              </div>
              <div style={{ flex:1, paddingBottom:i<services.length-1?0:0 }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", marginBottom:2 }}>{s.service_date}</div>
                {s.workshop&&<div style={{ fontWeight:600, fontSize:14 }}>{s.workshop}</div>}
                <div style={{ fontSize:13, color:"#444" }}>{s.description}</div>
                {s.price&&<div style={{ fontSize:12, color:"#888", marginTop:2 }}>{s.price.toLocaleString()}€</div>}
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  {s.photo_url&&<a href={s.photo_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#1a2744" }}>📷 Foto</a>}
                  {s.invoice_url&&<a href={s.invoice_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#1a2744" }}>📄 Factura</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {next&&(
          <div style={{ display:"flex", gap:14, marginTop:services.length>0?20:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:status.urgent?"#dc2626":"#e0ddd6", flexShrink:0, marginTop:4, border:"2px dashed #b8963e" }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:status.urgent?"#dc2626":"#aaa", marginBottom:2 }}>{next.toLocaleDateString("es-ES",{year:"numeric",month:"long"})}</div>
              <div style={{ fontSize:13, color:status.urgent?"#dc2626":"#aaa", fontStyle:"italic" }}>Próxima revisión estimada</div>
              {status.urgent&&<button style={{ ...S.btn("primary"), fontSize:12, marginTop:8 }} onClick={()=>onNavigate("talleres")}>🔧 Buscar taller →</button>}
            </div>
          </div>
        )}
      </div>

      {/* To-do list */}
      <div style={S.card}>
        <div style={{ ...S.row, justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ ...S.h2, marginBottom:0 }}>📋 Tareas pendientes</h3>
          <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>setAddingTodo(true)}>+ Añadir</button>
        </div>
        {addingTodo&&(
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <input style={{ ...S.input, flex:1 }} placeholder="Ej: Revisar corona, cambiar correa..." value={newTodo} onChange={e=>setNewTodo(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&addTodo()} />
            <button style={S.btn("primary")} onClick={addTodo}>Añadir</button>
            <button style={S.btn("outline")} onClick={()=>{ setAddingTodo(false); setNewTodo(""); }}>✕</button>
          </div>
        )}
        {todos.length===0&&!addingTodo&&<p style={S.muted}>Sin tareas. ¡Todo en orden!</p>}
        {todos.map(t=>(
          <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f5f3ef" }}>
            <input type="checkbox" checked={t.completed} onChange={()=>toggleTodo(t.id,t.completed)} style={{ width:16, height:16, cursor:"pointer", accentColor:"#1a2744" }} />
            <span style={{ flex:1, fontSize:13, color:t.completed?"#aaa":"#1a1a1a", textDecoration:t.completed?"line-through":"none" }}>{t.title}</span>
            <button style={{ background:"none", border:"none", cursor:"pointer", color:"#ddd", fontSize:14 }} onClick={()=>deleteTodo(t.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
