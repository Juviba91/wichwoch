import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug, timeAgo } from "../data/constants";
import { Spinner } from "../components/UI";

const SERVICE_INTERVALS = {
  rolex: 10, omega: 8, patek: 5, ap: 5, iwc: 5,
  jlc: 5, tudor: 10, cartier: 5, breitling: 5,
  tag: 5, vc: 5, hublot: 5, panerai: 5, gs: 5, zenith: 5
};

function getRecommendedInterval(slug) {
  const brand = (slug||"").split("_")[0];
  return SERVICE_INTERVALS[brand] || 5;
}

function getNextServiceDate(lastServiceDate, slug) {
  if(!lastServiceDate) return null;
  const years = getRecommendedInterval(slug);
  const d = new Date(lastServiceDate);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function getServiceStatus(watch, lastService) {
  const next = getNextServiceDate(lastService?.service_date, watch.slug);
  if(!next) return { status:"sin_historial", label:"Sin historial", color:"#aaa" };
  const now = new Date();
  const diffMonths = (next - now) / (1000*60*60*24*30);
  if(diffMonths < 0) return { status:"vencido", label:"Revisión vencida", color:"#dc2626", urgent:true };
  if(diffMonths < 6) return { status:"proximo", label:"Revisión próxima", color:"#d97706", urgent:true };
  return { status:"ok", label:"Al día", color:"#16a34a" };
}

export function MantenimientoPage({ currentUser, onNavigate }) {
  const [watches, setWatches] = useState([]);
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ service_date:"", workshop:"", description:"", price:"" });
  const [saving, setSaving] = useState(false);
  const setF = (k,v) => setServiceForm(f=>({...f,[k]:v}));

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    const {data:regs}=await supabase.from("watch_registrations")
      .select("id, watch:watches(id,slug,model,reference,image_url,brand_slug)")
      .eq("user_id",currentUser.id);

    const regIds = (regs||[]).map(r=>r.id);
    if(regIds.length>0) {
      const {data:svcs}=await supabase.from("watch_service_history")
        .select("*").in("registration_id",regIds)
        .order("service_date",{ascending:false});

      // Group by registration_id
      const grouped = {};
      (svcs||[]).forEach(s=>{ if(!grouped[s.registration_id]) grouped[s.registration_id]=s; });
      setServices(grouped);
    }
    setWatches(regs||[]);
    setLoading(false);
  }

  async function addService() {
    if(!serviceForm.description.trim()||!serviceForm.service_date) return;
    setSaving(true);
    await supabase.from("watch_service_history").insert({
      registration_id: selected.id,
      user_id: currentUser.id,
      service_date: serviceForm.service_date,
      workshop: serviceForm.workshop||null,
      description: serviceForm.description.trim(),
      price: serviceForm.price?parseInt(serviceForm.price):null,
    });
    setServiceForm({service_date:"",workshop:"",description:"",price:""});
    setShowAddService(false);
    await load();
    setSaving(false);
  }

  if(loading) return <Spinner />;

  const urgent = watches.filter(w=>{
    const s = getServiceStatus(w.watch, services[w.id]);
    return s.urgent;
  });

  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom:4 }}>🔧 Mantenimiento</h2>
      <p style={{ ...S.muted, marginBottom:24 }}>Seguimiento del cuidado de tus relojes</p>

      {/* Alertas urgentes */}
      {urgent.length>0&&(
        <div style={{ ...S.card, borderLeft:"4px solid #dc2626", background:"#fff5f5", marginBottom:24 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#dc2626", marginBottom:8 }}>⚠️ {urgent.length} reloj{urgent.length>1?"es":""} {urgent.length>1?"necesitan":"necesita"} atención</div>
          {urgent.map(w=>{
            const s = getServiceStatus(w.watch, services[w.id]);
            return <div key={w.id} style={{ fontSize:13, color:"#555", marginBottom:4 }}>• {w.watch?.model} — <span style={{ color:s.color, fontWeight:600 }}>{s.label}</span></div>;
          })}
        </div>
      )}

      {/* Recomendación de taller */}
      {urgent.length>0&&(
        <div style={{ ...S.card, borderLeft:"4px solid #b8963e", background:"#fff8e8", marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>🔧 ¿Necesitas un taller de confianza?</div>
          <p style={{ fontSize:13, color:"#666", margin:"0 0 12px" }}>Tienes {urgent.length} reloj{urgent.length>1?"es que necesitan":"que necesita"} revisión. Te recomendamos buscar un taller verificado por la comunidad.</p>
          <button style={S.btn("primary")} onClick={()=>onNavigate("explore")}>Ver talleres en Explorar →</button>
        </div>
      )}

      {watches.length===0&&(
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔧</div>
          <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Sin relojes en tu Garage</div>
          <p style={{ ...S.muted, marginBottom:20 }}>Añade relojes a tu Garage para hacer seguimiento de su mantenimiento</p>
          <button style={S.btn("primary")} onClick={()=>onNavigate("garage")}>Ir al Garage</button>
        </div>
      )}

      {/* Lista de relojes */}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {watches.map(w=>{
          const lastSvc = services[w.id];
          const status = getServiceStatus(w.watch, lastSvc);
          const next = getNextServiceDate(lastSvc?.service_date, w.watch?.slug);
          const interval = getRecommendedInterval(w.watch?.slug);
          const isOpen = selected?.id===w.id;
          const bg = brandColor(w.watch?.slug||"");

          return (
            <div key={w.id} style={{ ...S.card, padding:0, overflow:"hidden" }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", cursor:"pointer" }}
                onClick={()=>setSelected(isOpen?null:w)}>
                <div style={{ width:48, height:48, borderRadius:10, background:`linear-gradient(135deg,${bg},${bg}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>⌚</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{w.watch?.model}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#aaa" }}>@{w.watch?.slug} · {brandFromSlug(w.watch?.slug||"")}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:status.color, marginBottom:2 }}>{status.label}</div>
                  {next&&<div style={{ fontSize:11, color:"#aaa" }}>Próx. revisión: {next.getFullYear()}</div>}
                  {!lastSvc&&<div style={{ fontSize:11, color:"#aaa" }}>Sin servicios</div>}
                </div>
                <span style={{ color:"#aaa", fontSize:18, marginLeft:8 }}>{isOpen?"▲":"▼"}</span>
              </div>

              {/* Detail panel */}
              {isOpen&&(
                <div style={{ borderTop:"1px solid #f0ede6", padding:"16px 20px" }}>
                  {/* Info de mantenimiento */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10, marginBottom:16 }}>
                    <div style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px" }}>
                      <div style={S.label}>Intervalo recomendado</div>
                      <div style={{ fontWeight:700 }}>Cada {interval} años</div>
                    </div>
                    <div style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px" }}>
                      <div style={S.label}>Último servicio</div>
                      <div style={{ fontWeight:700 }}>{lastSvc?.service_date||"—"}</div>
                    </div>
                    {lastSvc?.workshop&&(
                      <div style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px" }}>
                        <div style={S.label}>Taller</div>
                        <div style={{ fontWeight:700 }}>{lastSvc.workshop}</div>
                      </div>
                    )}
                    {next&&(
                      <div style={{ background:status.urgent?"#fff5f5":"#f0fdf4", borderRadius:8, padding:"10px 14px", border:`1px solid ${status.urgent?"#fcc":"#b3dfc4"}` }}>
                        <div style={S.label}>Próxima revisión</div>
                        <div style={{ fontWeight:700, color:status.color }}>{next.toLocaleDateString("es-ES",{year:"numeric",month:"long"})}</div>
                      </div>
                    )}
                  </div>

                  {/* Historial de servicios */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ ...S.row, justifyContent:"space-between", marginBottom:10 }}>
                      <span style={{ fontWeight:600, fontSize:14 }}>Historial de servicios</span>
                      <button style={{ ...S.btn("primary"), fontSize:12, padding:"5px 14px" }} onClick={()=>setShowAddService(true)}>+ Añadir</button>
                    </div>

                    {showAddService&&selected?.id===w.id&&(
                      <div style={{ background:"#f8f6f0", borderRadius:8, padding:16, marginBottom:12 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                          <div><span style={S.label}>Fecha</span><input style={S.input} type="date" value={serviceForm.service_date} onChange={e=>setF("service_date",e.target.value)} /></div>
                          <div><span style={S.label}>Taller</span><input style={S.input} placeholder="Nombre del taller" value={serviceForm.workshop} onChange={e=>setF("workshop",e.target.value)} /></div>
                        </div>
                        <div style={{ marginBottom:10 }}><span style={S.label}>Descripción</span><textarea style={{ ...S.input, resize:"none" }} rows={2} placeholder="Revisión completa, cambio de correa..." value={serviceForm.description} onChange={e=>setF("description",e.target.value)} /></div>
                        <div style={{ marginBottom:12 }}><span style={S.label}>Coste (€)</span><input style={S.input} type="number" placeholder="250" value={serviceForm.price} onChange={e=>setF("price",e.target.value)} /></div>
                        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                          <button style={S.btn("outline")} onClick={()=>setShowAddService(false)}>Cancelar</button>
                          <button style={S.btn("primary")} onClick={addService} disabled={saving||!serviceForm.description.trim()||!serviceForm.service_date}>{saving?"Guardando…":"Guardar"}</button>
                        </div>
                      </div>
                    )}

                    <ServiceHistory registrationId={w.id} />
                  </div>

                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("garage")}>Ver en Garage →</button>
                    {getServiceStatus(w.watch, services[w.id]).urgent&&(
                      <button style={{ ...S.btn("gold"), fontSize:12 }} onClick={()=>onNavigate("explore")}>
                        🔧 Buscar taller →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServiceHistory({ registrationId }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    supabase.from("watch_service_history").select("*").eq("registration_id",registrationId)
      .order("service_date",{ascending:false})
      .then(({data})=>{ setServices(data||[]); setLoading(false); });
  },[registrationId]);

  if(loading) return <div style={S.muted}>Cargando...</div>;
  if(services.length===0) return <div style={{ fontSize:13, color:"#aaa", padding:"8px 0" }}>Sin servicios registrados aún.</div>;

  return (
    <div>
      {services.map(s=>(
        <div key={s.id} style={{ padding:"10px 0", borderBottom:"1px solid #f5f3ef", display:"flex", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", marginBottom:2 }}>{s.service_date}</div>
            {s.workshop&&<div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{s.workshop}</div>}
            <div style={{ fontSize:13, color:"#444" }}>{s.description}</div>
          </div>
          {s.price&&<div style={{ fontSize:13, color:"#888", flexShrink:0, marginLeft:12 }}>{s.price.toLocaleString()}€</div>}
        </div>
      ))}
    </div>
  );
}
