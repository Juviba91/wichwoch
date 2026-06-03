import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug } from "../data/constants";
import { Spinner } from "../components/UI";

const CONDITIONS = [
  { id:"mint", label:"Mint", desc:"Como nuevo, sin uso o uso mínimo", color:"#16a34a" },
  { id:"muy_bueno", label:"Muy bueno", desc:"Marcas mínimas de uso normal", color:"#2563eb" },
  { id:"bueno", label:"Bueno", desc:"Uso normal visible", color:"#d97706" },
  { id:"usado", label:"Usado", desc:"Marcas de uso evidentes", color:"#dc2626" },
];

const SOURCES = [
  { id:"ad_oficial", label:"AD Oficial" },
  { id:"autorizado", label:"Distribuidor autorizado" },
  { id:"segunda_mano", label:"Segunda mano" },
  { id:"particular", label:"Particular" },
  { id:"subasta", label:"Subasta" },
];

// ─── GARAGE CAROUSEL ──────────────────────────────────────────────────────────
function GarageCarousel({ watches, onSelect }) {
  const [idx, setIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const w = watches[idx];
  if(!w?.watch) return null;
  const bg = brandColor(w.watch.slug);

  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ position:"relative", height:280, borderRadius:16, background:`linear-gradient(135deg,${bg},${bg}88)`, overflow:"hidden", cursor:"pointer" }}
        onClick={()=>onSelect({...w,watch:w.watch})}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", padding:"0 40px" }}>
          {w.watch.image_url&&!imgError
            ? <img src={w.watch.image_url} alt={w.watch.model} style={{ maxHeight:200, objectFit:"contain", filter:"drop-shadow(0 12px 32px rgba(0,0,0,0.5))" }} onError={()=>setImgError(true)} />
            : <span style={{ fontSize:80, opacity:0.3 }}>⌚</span>
          }
        </div>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.75))", padding:"32px 24px 20px" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>{brandFromSlug(w.watch.slug)}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, color:"#fff", fontWeight:700 }}>{w.watch.model}</div>
          {w.watch.market_price&&<div style={{ fontSize:13, color:"#b8963e", marginTop:4 }}>💰 {w.watch.market_price}</div>}
        </div>
        {w.condition&&<div style={{ position:"absolute", top:16, right:16, background:"rgba(0,0,0,0.5)", borderRadius:6, padding:"4px 10px", fontSize:11, color:"#fff", fontWeight:700, textTransform:"capitalize" }}>{w.condition.replace("_"," ")}</div>}
        <div style={{ position:"absolute", top:16, left:16, background:"rgba(0,0,0,0.4)", borderRadius:6, padding:"4px 10px", fontSize:11, color:"rgba(255,255,255,0.7)" }}>Ver Watch Passport →</div>
      </div>
      {watches.length>1&&(
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:12 }}>
          {watches.map((_,i)=>(
            <div key={i} onClick={()=>{ setIdx(i); setImgError(false); }}
              style={{ width:i===idx?24:8, height:8, borderRadius:4, background:i===idx?"#1a2744":"#e0ddd6", cursor:"pointer", transition:"width 0.3s" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── GARAGE PUBLIC TOGGLE ─────────────────────────────────────────────────────
function GaragePublicToggle({ userId }) {
  const [isPublic, setIsPublic] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(()=>{
    supabase.from("profiles").select("garage_public").eq("id",userId).single()
      .then(({data})=>{ setIsPublic(data?.garage_public!==false); setLoaded(true); });
  },[userId]);

  async function toggle() {
    const newVal = !isPublic;
    setIsPublic(newVal);
    await supabase.from("profiles").update({garage_public:newVal}).eq("id",userId);
  }

  if(!loaded) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }} onClick={toggle}>
      <span style={{ fontSize:13, color:"#888", fontFamily:"'DM Sans',sans-serif" }}>{isPublic?"👁 Público":"🔒 Privado"}</span>
      <div style={{ width:40, height:22, borderRadius:11, background:isPublic?"#1a2744":"#ddd", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:isPublic?20:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

// ─── WATCH PASSPORT ───────────────────────────────────────────────────────────
function WatchPassport({ registration, watch, currentUser, onBack, onUpdated, defaultTab }) {
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({ service_date:"", workshop:"", description:"", price:"", photo_url:"", invoice_url:"" });
  const [savingService, setSavingService] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab||"mantenimiento");
  const [imgError, setImgError] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(()=>{ loadServices(); },[registration?.id]);

  async function loadServices() {
    if(!registration?.id) return;
    const {data}=await supabase.from("watch_service_history").select("*").eq("registration_id",registration.id).order("service_date",{ascending:false});
    setServices(data||[]);
  }

  async function addService() {
    if(!serviceForm.description.trim()||!serviceForm.service_date) return;
    setSavingService(true);
    await supabase.from("watch_service_history").insert({
      registration_id:registration.id, user_id:currentUser.id,
      service_date:serviceForm.service_date, workshop:serviceForm.workshop||null,
      description:serviceForm.description.trim(),
      price:serviceForm.price?parseInt(serviceForm.price):null,
      photo_url:serviceForm.photo_url||null, invoice_url:serviceForm.invoice_url||null,
    });
    setServiceForm({service_date:"",workshop:"",description:"",price:"",photo_url:"",invoice_url:""});
    setShowServiceForm(false); await loadServices(); setSavingService(false);
  }

  async function uploadFile(file, type) {
    const ext = file.name.split(".").pop();
    const path = `services/${currentUser.id}/${Date.now()}.${ext}`;
    const {error}=await supabase.storage.from("watch-photos").upload(path, file);
    if(!error) {
      const {data}=supabase.storage.from("watch-photos").getPublicUrl(path);
      setServiceForm(f=>({...f,[type]:data.publicUrl}));
    }
  }

  async function deleteService(id) {
    if(!window.confirm("¿Borrar este servicio?")) return;
    await supabase.from("watch_service_history").delete().eq("id",id);
    await loadServices();
  }

  const bg = brandColor(watch.slug);
  const cond = CONDITIONS.find(c=>c.id===registration?.condition);
  const source = SOURCES.find(s=>s.id===registration?.purchase_source);

  return (
    <div>
      <button style={{ ...S.btn("outline"), marginBottom:20, fontSize:12 }} onClick={onBack}>← Volver al Garage</button>

      <div style={{ height:200, background:`linear-gradient(135deg,${bg},${bg}88)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", marginBottom:0, overflow:"hidden" }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{brandFromSlug(watch.slug)}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:28, color:"#fff", fontWeight:700, marginBottom:4 }}>{watch.model}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.5)" }}>@{watch.slug} · Ref. {watch.reference}</div>
          {cond&&<div style={{ marginTop:10, display:"inline-block", background:cond.color, borderRadius:4, padding:"3px 10px", fontSize:11, color:"#fff", fontWeight:700 }}>{cond.label}</div>}
        </div>
        {watch.image_url&&!imgError
          ? <img src={watch.image_url} alt={watch.model} style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.4))", cursor:"zoom-in" }} onError={()=>setImgError(true)} onClick={()=>setLightbox(watch.image_url)} />
          : <div style={{ fontSize:64, opacity:0.3 }}>⌚</div>
        }
      </div>

      {lightbox&&(
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.95)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="" style={{ maxWidth:"95vw", maxHeight:"95vh", objectFit:"contain", borderRadius:8 }} />
          <button style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:"50%", width:40, height:40, fontSize:20, cursor:"pointer" }}>×</button>
        </div>
      )}

      <div style={{ display:"flex", gap:4, margin:"16px 0", flexWrap:"wrap" }}>
        {[["mantenimiento","🔧 Mantenimiento"],["info","📋 Info"],["fotos","📷 Fotos"],["specs","⚙️ Specs"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:activeTab===id?"#1a2744":"#f0ede6", color:activeTab===id?"#fff":"#666", fontWeight:activeTab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {activeTab==="mantenimiento"&&(
        <WatchPassportMaint registration={registration} watch={watch} services={services} currentUser={currentUser} onAddService={()=>setActiveTab("servicios")} />
      )}
      {activeTab==="info"&&(
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            ["Estado", cond?.label||"—", cond?.color],
            ["Caja original", registration?.has_box?"✓ Sí":"✗ No", registration?.has_box?"#16a34a":"#dc2626"],
            ["Papeles / Garantía", registration?.has_papers?"✓ Sí":"✗ No", registration?.has_papers?"#16a34a":"#dc2626"],
            ["Año de compra", registration?.purchase_year||"—"],
            ["Comprado en", source?.label||"—"],
            ["Precio pagado", registration?.purchase_price?`${registration.purchase_price.toLocaleString()}€`:"—"],
            ["Precio de mercado", watch.market_price||"—"],
            ["Servicios", services.length],
          ].map(([k,v,color])=>(
            <div key={k} style={{ background:"#f8f6f0", borderRadius:8, padding:"12px 16px" }}>
              <div style={S.label}>{k}</div>
              <div style={{ fontSize:15, fontWeight:600, color:color||"#1a1a1a" }}>{v}</div>
            </div>
          ))}
          {registration?.serial_last4&&(
            <div style={{ background:"#f8f6f0", borderRadius:8, padding:"12px 16px" }}>
              <div style={S.label}>Número de serie</div>
              <div style={{ fontSize:15, fontWeight:600, fontFamily:"'DM Mono',monospace" }}>****{registration.serial_last4} <span style={{ fontSize:11, color:"#aaa", fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>🔒</span></div>
            </div>
          )}
          {registration?.notes&&(
            <div style={{ gridColumn:"1/-1", background:"#f8f6f0", borderRadius:8, padding:"12px 16px" }}>
              <div style={S.label}>Notas</div>
              <p style={{ fontSize:14, color:"#444", margin:0, lineHeight:1.6 }}>{registration.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab==="fotos"&&(
        <div>
          {(!registration?.photos||registration.photos.length===0)&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:40 }}>Sin fotos propias aún.</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {(registration?.photos||[]).map((url,i)=>(
              <img key={i} src={url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:10, border:"1px solid #ece9e2", cursor:"zoom-in" }} onClick={()=>setLightbox(url)} />
            ))}
          </div>
        </div>
      )}

      {activeTab==="servicios"&&(
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <button style={S.btn("primary")} onClick={()=>setShowServiceForm(!showServiceForm)}>+ Añadir servicio</button>
          </div>
          {showServiceForm&&(
            <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:16 }}>
              <h3 style={{ ...S.h2, marginBottom:16 }}>Nuevo servicio</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div><span style={S.label}>Fecha *</span><input style={S.input} type="date" value={serviceForm.service_date} onChange={e=>setServiceForm(f=>({...f,service_date:e.target.value}))} /></div>
                <div><span style={S.label}>Taller</span><input style={S.input} placeholder="Nombre del taller" value={serviceForm.workshop} onChange={e=>setServiceForm(f=>({...f,workshop:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:12 }}><span style={S.label}>Descripción *</span><textarea style={{ ...S.input, resize:"none" }} rows={2} placeholder="Revisión completa, cambio de correa..." value={serviceForm.description} onChange={e=>setServiceForm(f=>({...f,description:e.target.value}))} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div><span style={S.label}>Coste (€)</span><input style={S.input} type="number" placeholder="250" value={serviceForm.price} onChange={e=>setServiceForm(f=>({...f,price:e.target.value}))} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div>
                  <span style={S.label}>Foto del reloj <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
                  <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"8px 12px", border:"1px dashed #e0ddd6", borderRadius:8, fontSize:12, color:"#888" }}>
                    {serviceForm.photo_url?"✓ Foto subida":"📷 Subir foto"}
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],"photo_url")} />
                  </label>
                </div>
                <div>
                  <span style={S.label}>Factura <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
                  <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", padding:"8px 12px", border:"1px dashed #e0ddd6", borderRadius:8, fontSize:12, color:"#888" }}>
                    {serviceForm.invoice_url?"✓ Factura subida":"📄 Subir factura"}
                    <input type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],"invoice_url")} />
                  </label>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                <button style={S.btn("outline")} onClick={()=>setShowServiceForm(false)}>Cancelar</button>
                <button style={S.btn("primary")} onClick={addService} disabled={savingService||!serviceForm.description.trim()||!serviceForm.service_date}>{savingService?"Guardando…":"Guardar"}</button>
              </div>
            </div>
          )}
          {services.length===0&&!showServiceForm&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin servicios registrados aún.</div>}
          {services.map(s=>(
            <div key={s.id} style={{ ...S.card }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", marginBottom:4 }}>{s.service_date}</div>
                  {s.workshop&&<div style={{ fontWeight:600, marginBottom:4 }}>{s.workshop}</div>}
                  <p style={{ fontSize:14, color:"#444", margin:0 }}>{s.description}</p>
                  {s.price&&<div style={{ fontSize:12, color:"#888", marginTop:4 }}>Coste: {s.price.toLocaleString()}€</div>}
                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    {s.photo_url&&<a href={s.photo_url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#1a2744" }}>📷 Ver foto</a>}
                    {s.invoice_url&&<a href={s.invoice_url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#1a2744" }}>📄 Ver factura</a>}
                  </div>
                </div>
                <button style={{ background:"none", border:"none", cursor:"pointer", color:"#ddd", fontSize:16, marginLeft:12 }} onClick={()=>deleteService(s.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab==="specs"&&(
        <div style={S.card}>
          {watch.specs&&Object.keys(watch.specs).length>0
            ? <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {Object.entries(watch.specs).map(([k,v])=>(
                  <div key={k} style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px" }}>
                    <div style={S.label}>{k.replace(/_/g," ")}</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>
            : <p style={S.muted}>Sin especificaciones técnicas.</p>
          }
        </div>
      )}
    </div>
  );
}


// ─── WATCH PASSPORT MAINT TAB ─────────────────────────────────────────────────
function WatchPassportMaint({ registration, watch, services, currentUser, onAddService }) {
  const INTERVALS = { rolex:10, omega:8, patek:5, ap:5, iwc:5, jlc:5, tudor:10, cartier:5, breitling:5, tag:5, vc:5, hublot:5, panerai:5, gs:5, zenith:5 };
  const brandSlug = (watch?.slug||"").split("_")[0];
  const interval = INTERVALS[brandSlug] || 5;

  // Smart calculation: use last service OR purchase year
  let lastDate = services[0]?.service_date || null;
  let basedOn = "último servicio";
  if(!lastDate && registration?.purchase_year) {
    lastDate = `${registration.purchase_year}-01-01`;
    basedOn = "año de compra";
  }

  let nextDate = null, yearsLeft = null, status = "sin_datos";
  if(lastDate) {
    const base = new Date(lastDate);
    nextDate = new Date(base);
    nextDate.setFullYear(nextDate.getFullYear() + interval);
    const now = new Date();
    const diffYears = (nextDate - now) / (1000*60*60*24*365);
    yearsLeft = diffYears;
    if(diffYears < 0) status = "vencido";
    else if(diffYears < 0.5) status = "urgente";
    else if(diffYears < 1) status = "proximo";
    else status = "ok";
  }

  const statusConfig = {
    vencido: { color:"#dc2626", label:"Revisión vencida", bg:"#fff5f5" },
    urgente: { color:"#dc2626", label:"Revisión urgente", bg:"#fff5f5" },
    proximo: { color:"#d97706", label:"Revisión próxima", bg:"#fff8e8" },
    ok: { color:"#16a34a", label:"Al día", bg:"#f0fdf4" },
    sin_datos: { color:"#aaa", label:"Sin datos", bg:"#f8f8f8" },
  };
  const sc = statusConfig[status];

  return (
    <div>
      {/* Estado */}
      <div style={{ background:sc.bg, borderRadius:10, padding:"16px 20px", marginBottom:16, borderLeft:`4px solid ${sc.color}` }}>
        <div style={{ fontWeight:700, fontSize:16, color:sc.color, marginBottom:4 }}>{sc.label}</div>
        {nextDate&&(
          <div style={{ fontSize:13, color:"#555" }}>
            {status==="vencido"
              ? `Debería haberse revisado en ${nextDate.toLocaleDateString("es-ES",{year:"numeric",month:"long"})}`
              : `Próxima revisión: ${nextDate.toLocaleDateString("es-ES",{year:"numeric",month:"long"})}`
            }
          </div>
        )}
        {lastDate&&<div style={{ fontSize:12, color:"#aaa", marginTop:4 }}>Basado en {basedOn}</div>}
      </div>

      {/* Datos clave */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        <div style={{ background:"#f8f6f0", borderRadius:8, padding:"12px 14px" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#aaa", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Intervalo</div>
          <div style={{ fontWeight:700, fontSize:15 }}>Cada {interval} años</div>
        </div>
        <div style={{ background:"#f8f6f0", borderRadius:8, padding:"12px 14px" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#aaa", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>{basedOn==="último servicio"?"Último servicio":"Año de compra"}</div>
          <div style={{ fontWeight:700, fontSize:15 }}>{lastDate?.split("-")[0]||"—"}</div>
        </div>
        <div style={{ background:sc.bg, borderRadius:8, padding:"12px 14px", border:`1px solid ${sc.color}30` }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#aaa", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>Años restantes</div>
          <div style={{ fontWeight:700, fontSize:15, color:sc.color }}>{yearsLeft!==null?yearsLeft>0?`${Math.abs(yearsLeft).toFixed(1)} años`:"Vencido":"—"}</div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        <button style={{ background:"#1a2744", border:"none", color:"#fff", borderRadius:8, padding:"10px 18px", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} onClick={onAddService}>
          + Registrar servicio
        </button>
        {(status==="vencido"||status==="urgente"||status==="proximo")&&(
          <a href="/talleres" style={{ background:"#b8963e", border:"none", color:"#fff", borderRadius:8, padding:"10px 18px", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600, textDecoration:"none" }}>
            🔧 Buscar taller
          </a>
        )}
      </div>

      {/* Historial mini */}
      {services.length>0&&(
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#aaa", fontFamily:"'DM Mono',monospace", marginBottom:10 }}>Historial</div>
          {services.slice(0,3).map((s,i)=>(
            <div key={s.id} style={{ display:"flex", gap:12, paddingBottom:10, marginBottom:10, borderBottom:i<Math.min(services.length,3)-1?"1px solid #f0ede6":"none" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#b8963e", marginTop:5, flexShrink:0 }} />
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e" }}>{s.service_date}</div>
                {s.workshop&&<div style={{ fontWeight:600, fontSize:13 }}>{s.workshop}</div>}
                <div style={{ fontSize:12, color:"#666" }}>{s.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {services.length===0&&(
        <div style={{ textAlign:"center", padding:"24px 0", color:"#aaa", fontSize:13 }}>Sin servicios registrados aún.</div>
      )}
    </div>
  );
}

// ─── ADD WATCH FORM ───────────────────────────────────────────────────────────
function AddWatchForm({ currentUser, onSaved, onCancel, toWishlist=false }) {
  const [step, setStep] = useState(1);
  const [watchSearch, setWatchSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [form, setForm] = useState({ condition:"muy_bueno", has_box:false, has_papers:false, purchase_year:"", purchase_source:"", purchase_price:"", notes:"", serial:"" });
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  async function searchWatches(q) {
    if(!q||q.length<2){setSuggestions([]);return;}
    const {data}=await supabase.from("watches").select("id,slug,model,brand_slug,image_url,market_price,specs,watch_type").or(`slug.ilike.%${q}%,model.ilike.%${q}%`).limit(8);
    setSuggestions(data||[]);
  }

  async function uploadPhoto(file) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${currentUser.id}/${Date.now()}.${ext}`;
    const {error}=await supabase.storage.from("watch-photos").upload(path, file);
    if(!error) {
      const {data}=supabase.storage.from("watch-photos").getPublicUrl(path);
      setPhotos(p=>[...p, data.publicUrl]);
    }
    setUploading(false);
  }

  async function save() {
    if(!selectedWatch) return;
    setSaving(true);
    const table = toWishlist ? "watch_wishlist" : "watch_registrations";
    const {data:ex}=await supabase.from(table).select("id").eq("user_id",currentUser.id).eq("watch_id",selectedWatch.id).maybeSingle();
    if(toWishlist) {
      if(!ex) await supabase.from(table).insert({user_id:currentUser.id,watch_id:selectedWatch.id,is_public:true});
      setSaving(false); onSaved(null);
    } else {
      let serialHash=null, serialLast4=null;
      if(form.serial.trim()) { serialLast4=form.serial.trim().slice(-4); serialHash=btoa(form.serial.trim()).slice(0,32); }
      const payload = { user_id:currentUser.id, watch_id:selectedWatch.id, is_public:true, condition:form.condition, has_box:form.has_box, has_papers:form.has_papers, purchase_year:form.purchase_year?parseInt(form.purchase_year):null, purchase_source:form.purchase_source||null, purchase_price:form.purchase_price?parseInt(form.purchase_price):null, notes:form.notes||null, photos:photos.length>0?photos:null, serial_hash:serialHash, serial_last4:serialLast4 };
      if(ex) await supabase.from(table).update(payload).eq("id",ex.id);
      else await supabase.from(table).insert(payload);
      setSaving(false);
      onSaved(selectedWatch);
    }
  }

  const bg = selectedWatch ? brandColor(selectedWatch.slug) : "#1a2744";

  return (
    <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:20 }}>
      {step===1&&(
        <>
          <h3 style={{ ...S.h2, marginBottom:16 }}>{toWishlist?"Añadir a Wish List":"Añadir reloj al Garage"}</h3>
          <span style={S.label}>Busca tu reloj</span>
          <div style={{ position:"relative" }}>
            <input style={S.input} placeholder="Submariner, @rolex_daytona, Speedmaster..." value={watchSearch} onChange={e=>{setWatchSearch(e.target.value);searchWatches(e.target.value);}} autoFocus />
            {suggestions.length>0&&(
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e8e8e8", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.1)", zIndex:50, marginTop:4 }}>
                {suggestions.map(w=>(
                  <div key={w.id} style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f5f5f5", display:"flex", alignItems:"center", gap:12 }}
                    onMouseDown={()=>{ setSelectedWatch(w); setWatchSearch(w.model); setSuggestions([]); if(!toWishlist) setStep(2); else save(); }}>
                    <div style={{ width:40, height:40, borderRadius:8, background:brandColor(w.slug), display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>⌚</div>
                    <div><div style={{ fontWeight:600 }}>{w.model}</div><div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#aaa" }}>@{w.slug}{w.market_price&&` · ${w.market_price}`}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14 }}>
            <button style={S.btn("outline")} onClick={onCancel}>Cancelar</button>
          </div>
        </>
      )}
      {step===2&&selectedWatch&&(
        <>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", background:"#f8f6f0", borderRadius:8 }}>
            <div style={{ width:48, height:48, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>⌚</div>
            <div><div style={{ fontWeight:700, fontSize:16 }}>{selectedWatch.model}</div><div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#888" }}>@{selectedWatch.slug}</div></div>
            <button style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#aaa" }} onClick={()=>{setStep(1);setSelectedWatch(null);}}>✏️</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            <div>
              <span style={S.label}>Estado</span>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {CONDITIONS.map(c=>(
                  <label key={c.id} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"8px 12px", borderRadius:6, border:`1px solid ${form.condition===c.id?c.color:"#e8e8e8"}`, background:form.condition===c.id?`${c.color}10`:"#fff" }}>
                    <input type="radio" name="cond" value={c.id} checked={form.condition===c.id} onChange={()=>setF("condition",c.id)} style={{ accentColor:c.color }} />
                    <div><div style={{ fontWeight:600, fontSize:13, color:c.color }}>{c.label}</div><div style={{ fontSize:11, color:"#888" }}>{c.desc}</div></div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <span style={S.label}>Documentación</span>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:8 }}><input type="checkbox" checked={form.has_box} onChange={e=>setF("has_box",e.target.checked)} /><span style={{ fontSize:13 }}>📦 Caja original</span></label>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}><input type="checkbox" checked={form.has_papers} onChange={e=>setF("has_papers",e.target.checked)} /><span style={{ fontSize:13 }}>📄 Papeles</span></label>
              </div>
              <div><span style={S.label}>Año de compra</span><input style={S.input} type="number" placeholder="2023" min="1950" max={new Date().getFullYear()} value={form.purchase_year} onChange={e=>setF("purchase_year",e.target.value)} /></div>
              <div><span style={S.label}>Dónde lo compraste</span><select style={S.input} value={form.purchase_source} onChange={e=>setF("purchase_source",e.target.value)}><option value="">Seleccionar...</option>{SOURCES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
              <div><span style={S.label}>Precio pagado <span style={{ color:"#aaa", fontWeight:400 }}>(privado)</span></span><div style={{ position:"relative" }}><input style={{ ...S.input, paddingLeft:28 }} type="number" placeholder="8500" value={form.purchase_price} onChange={e=>setF("purchase_price",e.target.value)} /><span style={{ position:"absolute", left:10, top:11, color:"#888" }}>€</span></div></div>
              <div>
                <span style={S.label}>Número de serie <span style={{ color:"#aaa", fontWeight:400 }}>(privado 🔒)</span></span>
                <input style={S.input} placeholder="Solo tú podrás verlo" value={form.serial} onChange={e=>setF("serial",e.target.value)} />
              </div>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <span style={S.label}>Tus fotos <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
              {photos.map((url,i)=>(
                <div key={i} style={{ position:"relative" }}>
                  <img src={url} alt="" style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1px solid #e8e8e8" }} />
                  <button style={{ position:"absolute", top:-6, right:-6, background:"#e11d48", border:"none", color:"#fff", borderRadius:"50%", width:20, height:20, cursor:"pointer", fontSize:11 }} onClick={()=>setPhotos(p=>p.filter((_,j)=>j!==i))}>×</button>
                </div>
              ))}
              <label style={{ width:80, height:80, border:"2px dashed #e8e8e8", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#aaa", fontSize:24, flexShrink:0 }}>
                {uploading?"⏳":"📷"}<input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>Array.from(e.target.files).forEach(uploadPhoto)} />
              </label>
            </div>
          </div>
          <div style={{ marginBottom:20 }}><span style={S.label}>Notas <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span><textarea style={{ ...S.input, resize:"none" }} rows={2} placeholder="Historia del reloj, detalles especiales..." value={form.notes} onChange={e=>setF("notes",e.target.value)} /></div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button style={S.btn("outline")} onClick={()=>setStep(1)}>← Atrás</button>
            <button style={S.btn("primary")} onClick={save} disabled={saving||uploading}>{saving?"Guardando…":"Añadir al Garage"}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── POST REGISTRATION INFO ───────────────────────────────────────────────────
function PostRegistrationInfo({ watch, onClose }) {
  const BRAND_WEBSITES = { rolex:"https://www.rolex.com", omega:"https://www.omegawatches.com", patek:"https://www.patek.com", ap:"https://www.audemarspiguet.com", iwc:"https://www.iwc.com", jlc:"https://www.jaeger-lecoultre.com", tudor:"https://www.tudorwatch.com", cartier:"https://www.cartier.com", breitling:"https://www.breitling.com", tag:"https://www.tagheuer.com", vc:"https://www.vacheron-constantin.com", hublot:"https://www.hublot.com", panerai:"https://www.panerai.com", gs:"https://www.grand-seiko.com", zenith:"https://www.zenith-watches.com" };
  const brandSlug = watch.slug?.split("_")[0];
  const interval = { rolex:10, omega:8, patek:5, ap:5, iwc:5, jlc:5, tudor:10, cartier:5, breitling:5, tag:5, vc:5, hublot:5, panerai:5, gs:5, zenith:5 }[brandSlug] || 5;
  const bg = brandColor(watch.slug);

  return (
    <div>
      <div style={{ height:180, background:`linear-gradient(135deg,${bg},${bg}88)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", marginBottom:24, overflow:"hidden" }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>✓ Reloj registrado</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:26, color:"#fff", fontWeight:700 }}>{watch.model}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:4 }}>{brandFromSlug(watch.slug)}</div>
        </div>
        {watch.image_url&&<img src={watch.image_url} alt="" style={{ height:"80%", objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }} onError={e=>e.target.style.display="none"} />}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
        <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:20 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🔧</div>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Cada {interval} años</div>
          <div style={S.muted}>Revisión recomendada</div>
        </div>
        {watch.market_price&&(
          <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:20 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>💰</div>
            <div style={{ fontWeight:700, fontSize:16, color:"#b8963e", marginBottom:4 }}>{watch.market_price}</div>
            <div style={S.muted}>Precio de mercado</div>
          </div>
        )}
      </div>
      {watch.specs&&Object.keys(watch.specs).length>0&&(
        <div style={{ ...S.card, marginBottom:20 }}>
          <h3 style={{ ...S.h2, marginBottom:14 }}>Especificaciones técnicas</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {Object.entries(watch.specs).slice(0,6).map(([k,v])=>(
              <div key={k} style={{ background:"#f8f6f0", borderRadius:6, padding:"8px 12px" }}>
                <div style={S.label}>{k.replace(/_/g," ")}</div>
                <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {BRAND_WEBSITES[brandSlug]&&<a href={BRAND_WEBSITES[brandSlug]} target="_blank" rel="noreferrer" style={{ ...S.btn("outline"), textDecoration:"none", fontSize:13 }}>🌐 Web oficial</a>}
        <button style={S.btn("primary")} onClick={onClose}>Ver mi Garage →</button>
      </div>
    </div>
  );
}

// ─── GARAGE PAGE ──────────────────────────────────────────────────────────────
export function GaragePage({ currentUser, onNavigate, openWatchId }) {
  const [watches, setWatches] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [showAddWish, setShowAddWish] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showPostInfo, setShowPostInfo] = useState(false);
  const [savedWatch, setSavedWatch] = useState(null);

  useEffect(()=>{ if(currentUser?.id) load(); },[currentUser]);

  useEffect(()=>{
    if(openWatchId&&watches.length>0) {
      const found = watches.find(w=>w.id===openWatchId);
      if(found) setSelectedRegistration({...found, defaultTab:"mantenimiento"});
    }
  },[openWatchId, watches]);

  async function load() {
    setLoading(true);
    const [{data:w},{data:wl}]=await Promise.all([
      supabase.from("watch_registrations").select("*, watch:watches(id,slug,model,reference,brand_slug,image_url,market_price,watch_type,year,specs)").eq("user_id",currentUser.id),
      supabase.from("watch_wishlist").select("*, watch:watches(id,slug,model,reference,brand_slug,image_url,market_price,watch_type)").eq("user_id",currentUser.id),
    ]);
    setWatches(w||[]); setWishlist(wl||[]); setLoading(false);
  }

  async function removeWatch(watchId, fromWishlist=false) {
    const table=fromWishlist?"watch_wishlist":"watch_registrations";
    await supabase.from(table).delete().match({user_id:currentUser.id,watch_id:watchId});
    await load();
  }

  async function togglePublic(regId, currentValue) {
    await supabase.from("watch_registrations").update({is_public:!currentValue}).eq("id",regId);
    await load();
  }

  // Insights
  const allWatches = watches.map(w=>w.watch).filter(Boolean);
  const brandCount = allWatches.reduce((acc,w)=>{ const b=brandFromSlug(w.slug); acc[b]=(acc[b]||0)+1; return acc; },{});
  const topBrand = Object.entries(brandCount).sort((a,b)=>b[1]-a[1])[0];
  const typeCount = allWatches.reduce((acc,w)=>{ const t=w.watch_type||"otros"; acc[t]=(acc[t]||0)+1; return acc; },{});
  const topType = Object.entries(typeCount).sort((a,b)=>b[1]-a[1])[0];

  if(loading) return <Spinner />;

  if(showPostInfo&&savedWatch) return <PostRegistrationInfo watch={savedWatch} onClose={()=>{ setShowPostInfo(false); setSavedWatch(null); }} />;
  if(selectedRegistration) return <WatchPassport registration={selectedRegistration} watch={selectedRegistration.watch} currentUser={currentUser} onBack={()=>setSelectedRegistration(null)} onUpdated={load} defaultTab={selectedRegistration.defaultTab} />;

  return (
    <div>
      {/* Header */}
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>Mi Garage</h2>
          <p style={S.muted}>{watches.length} {watches.length===1?"reloj":"relojes"}</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <GaragePublicToggle userId={currentUser.id} />
          <button style={S.btn("primary")} onClick={()=>setShowAddWatch(true)}>+ Añadir reloj</button>
        </div>
      </div>

      {/* Add forms */}
      {showAddWatch&&<AddWatchForm currentUser={currentUser} toWishlist={false} onSaved={(w)=>{ setShowAddWatch(false); if(w){ setSavedWatch(w); setShowPostInfo(true); } load(); }} onCancel={()=>setShowAddWatch(false)} />}

      {watches.length===0&&!showAddWatch&&(
        <div style={{ ...S.card, textAlign:"center", padding:56 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>⌚</div>
          <div style={{ fontWeight:700, fontSize:20, marginBottom:8 }}>Tu garage está vacío</div>
          <p style={{ ...S.muted, marginBottom:24, maxWidth:320, margin:"0 auto 24px" }}>Añade tu primer reloj para empezar tu colección digital</p>
          <button style={S.btn("primary")} onClick={()=>setShowAddWatch(true)}>+ Añadir mi primer reloj</button>
        </div>
      )}

      {/* Carousel */}
      {watches.length>0&&<GarageCarousel watches={watches} onSelect={setSelectedRegistration} />}

      {/* Stats */}
      {watches.length>0&&(()=>{
        const totalValue = watches.reduce((s,w)=>{
          if(!w.watch?.market_price) return s;
          const num = parseInt(w.watch.market_price.replace(/[~€\s.]/g,"").replace(/,/g,""));
          return s + (isNaN(num)?0:num);
        },0);
        return (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12, marginBottom:24 }}>
            <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"16px 12px" }}>
              <div style={{ fontSize:24, marginBottom:4 }}>⌚</div>
              <div style={{ fontWeight:700, fontSize:22 }}>{watches.length}</div>
              <div style={S.muted}>{watches.length===1?"reloj":"relojes"}</div>
            </div>
            <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"16px 12px" }}>
              <div style={{ fontSize:24, marginBottom:4 }}>❤️</div>
              <div style={{ fontWeight:700, fontSize:22 }}>{wishlist.length}</div>
              <div style={S.muted}>wish list</div>
            </div>
            {topBrand&&<div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"16px 12px" }}>
              <div style={{ fontSize:24, marginBottom:4 }}>🏆</div>
              <div style={{ fontWeight:700, fontSize:16, textTransform:"capitalize" }}>{topBrand[0]}</div>
              <div style={S.muted}>marca favorita</div>
            </div>}
            {totalValue>0&&<div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:"16px 12px" }}>
              <div style={{ fontSize:24, marginBottom:4 }}>💰</div>
              <div style={{ fontWeight:700, fontSize:16, color:"#b8963e" }}>{totalValue.toLocaleString()}€</div>
              <div style={S.muted}>valor estimado</div>
            </div>}
          </div>
        );
      })()}

      {/* Wish List */}
      {wishlist.length>0&&(
        <div>
          <div style={{ ...S.row, justifyContent:"space-between", marginBottom:12 }}>
            <h3 style={{ ...S.h2, marginBottom:0 }}>❤️ Wish List</h3>
            <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>setShowAddWish(!showAddWish)}>+ Añadir</button>
          </div>
          {showAddWish&&<AddWatchForm currentUser={currentUser} toWishlist={true} onSaved={()=>{ setShowAddWish(false); load(); }} onCancel={()=>setShowAddWish(false)} />}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {wishlist.map(w=>w.watch&&(
              <div key={w.id} style={{ position:"relative" }}>
                <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", background:"#fff", cursor:"pointer" }} onClick={()=>onNavigate("watch",w.watch.slug)}>
                  <div style={{ height:120, background:`linear-gradient(135deg,${brandColor(w.watch.slug)},${brandColor(w.watch.slug)}88)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                    {w.watch.image_url?<img src={w.watch.image_url} alt="" style={{ height:"85%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:28 }}>⌚</span>}
                    <div style={{ position:"absolute", top:6, left:6, background:"rgba(184,150,62,0.9)", borderRadius:4, padding:"2px 6px", fontSize:9, color:"#fff", fontWeight:700 }}>❤️</div>
                  </div>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{w.watch.model}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#aaa" }}>{brandFromSlug(w.watch.slug)}</div>
                    {w.watch.market_price&&<div style={{ fontSize:11, color:"#b8963e", marginTop:2 }}>{w.watch.market_price}</div>}
                  </div>
                </div>
                <button style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:"50%", width:22, height:22, cursor:"pointer", fontSize:12 }} onClick={e=>{e.stopPropagation();removeWatch(w.watch.id,true);}}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!showAddWish&&wishlist.length===0&&(
        <div style={{ marginTop:8 }}>
          <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>setShowAddWish(true)}>+ Añadir a Wish List</button>
        </div>
      )}
      {showAddWish&&wishlist.length===0&&<AddWatchForm currentUser={currentUser} toWishlist={true} onSaved={()=>{ setShowAddWish(false); load(); }} onCancel={()=>setShowAddWish(false)} />}
    </div>
  );
}
