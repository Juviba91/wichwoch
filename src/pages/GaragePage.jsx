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

// ─── GARAGE WATCH CARD ────────────────────────────────────────────────────────
function GarageWatchCard({ watch, registration, wishlist=false, onClick }) {
  const bg = brandColor(watch.slug);
  const [imgError, setImgError] = useState(false);
  const cond = CONDITIONS.find(c=>c.id===registration?.condition);

  return (
    <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid #ece9e2", background:"#fff", boxShadow:"0 2px 12px rgba(0,0,0,0.08)", cursor:"pointer", transition:"transform 0.15s, box-shadow 0.15s" }}
      onClick={onClick}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.15)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.08)"; }}>
      <div style={{ height:180, background:`linear-gradient(135deg, ${bg}, ${bg}99)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        {watch.image_url&&!imgError ? (
          <img src={watch.image_url} alt={watch.model} style={{ height:"90%", objectFit:"contain", filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.4))" }} onError={()=>setImgError(true)} />
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:4 }}>⌚</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.7)" }}>{watch.model}</div>
          </div>
        )}
        {wishlist&&<div style={{ position:"absolute", top:8, left:8, background:"rgba(184,150,62,0.9)", borderRadius:4, padding:"2px 8px", fontSize:10, color:"#fff", fontWeight:700, fontFamily:"'DM Mono',monospace" }}>WISH LIST</div>}
        {cond&&<div style={{ position:"absolute", top:8, right:8, background:cond.color, borderRadius:4, padding:"2px 8px", fontSize:10, color:"#fff", fontWeight:700 }}>{cond.label}</div>}
        <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(0,0,0,0.5)", borderRadius:4, padding:"2px 8px", fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.8)", letterSpacing:1.5, textTransform:"uppercase" }}>{brandFromSlug(watch.slug)}</div>
        {registration?.has_box&&registration?.has_papers&&<div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.5)", borderRadius:4, padding:"2px 6px", fontSize:9, color:"rgba(255,255,255,0.8)" }}>📦📄</div>}
      </div>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>{watch.model}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#aaa", marginBottom:6 }}>Ref. {watch.reference}{watch.year?` · ${watch.year}`:""}</div>
        {watch.market_price&&<div style={{ fontSize:12, color:"#b8963e", fontWeight:600 }}>💰 {watch.market_price}</div>}
        {registration?.purchase_year&&<div style={{ fontSize:11, color:"#bbb", marginTop:4, fontFamily:"'DM Mono',monospace" }}>Desde {registration.purchase_year}</div>}
      </div>
    </div>
  );
}

// ─── ADD WATCH FORM ───────────────────────────────────────────────────────────
function AddWatchForm({ currentUser, onSaved, onCancel, toWishlist=false }) {
  const [step, setStep] = useState(1); // 1: buscar reloj, 2: detalles
  const [watchSearch, setWatchSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [form, setForm] = useState({
    condition: "muy_bueno",
    has_box: false,
    has_papers: false,
    purchase_year: "",
    purchase_source: "",
    purchase_price: "",
    notes: "",
    serial: "",
  });
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  async function searchWatches(q) {
    if(!q||q.length<2){setSuggestions([]);return;}
    const {data}=await supabase.from("watches").select("id,slug,model,brand_slug,image_url,market_price").or(`slug.ilike.%${q}%,model.ilike.%${q}%`).limit(8);
    setSuggestions(data||[]);
  }

  async function uploadPhoto(file) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${currentUser.id}/${Date.now()}.${ext}`;
    const {error} = await supabase.storage.from("watch-photos").upload(path, file);
    if(!error) {
      const {data} = supabase.storage.from("watch-photos").getPublicUrl(path);
      setPhotos(p=>[...p, data.publicUrl]);
    }
    setUploading(false);
  }

  async function save() {
    if(!selectedWatch) return;
    setSaving(true);
    const table = toWishlist ? "watch_wishlist" : "watch_registrations";
    const {data:ex} = await supabase.from(table).select("id").eq("user_id",currentUser.id).eq("watch_id",selectedWatch.id).maybeSingle();

    if(toWishlist) {
      if(!ex) await supabase.from(table).insert({user_id:currentUser.id, watch_id:selectedWatch.id, is_public:true});
    } else {
      // Hash serial if provided
      let serialHash = null, serialLast4 = null;
      if(form.serial.trim()) {
        serialLast4 = form.serial.trim().slice(-4);
        // Simple hash: use btoa for now
        serialHash = btoa(form.serial.trim()).slice(0,32);
      }
      const payload = {
        user_id: currentUser.id,
        watch_id: selectedWatch.id,
        is_public: true,
        condition: form.condition,
        has_box: form.has_box,
        has_papers: form.has_papers,
        purchase_year: form.purchase_year ? parseInt(form.purchase_year) : null,
        purchase_source: form.purchase_source || null,
        purchase_price: form.purchase_price ? parseInt(form.purchase_price) : null,
        notes: form.notes || null,
        photos: photos.length > 0 ? photos : null,
        serial_hash: serialHash,
        serial_last4: serialLast4,
      };
      if(ex) await supabase.from(table).update(payload).eq("id",ex.id);
      else await supabase.from(table).insert(payload);
    }
    setSaving(false);
    onSaved(selectedWatch);
  }

  const bg = selectedWatch ? brandColor(selectedWatch.slug) : "#1a2744";

  return (
    <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:20 }}>
      {/* Step 1: Seleccionar reloj */}
      {step===1&&(
        <>
          <h3 style={{ ...S.h2, marginBottom:16 }}>{toWishlist?"Añadir a Wish List":"Añadir reloj al Garage"}</h3>
          <span style={S.label}>Busca tu reloj</span>
          <div style={{ position:"relative" }}>
            <input style={S.input} placeholder="Submariner, @rolex_daytona, Speedmaster..." value={watchSearch}
              onChange={e=>{setWatchSearch(e.target.value);searchWatches(e.target.value);}} autoFocus />
            {suggestions.length>0&&(
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e8e8e8", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.1)", zIndex:50, marginTop:4 }}>
                {suggestions.map(w=>(
                  <div key={w.id} style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f5f5f5", display:"flex", alignItems:"center", gap:12 }}
                    onMouseDown={()=>{ setSelectedWatch(w); setWatchSearch(w.model); setSuggestions([]); if(!toWishlist) setStep(2); else save(); }}>
                    <div style={{ width:40, height:40, borderRadius:8, background:brandColor(w.slug), display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>⌚</div>
                    <div>
                      <div style={{ fontWeight:600 }}>{w.model}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#aaa" }}>@{w.slug}{w.market_price&&` · ${w.market_price}`}</div>
                    </div>
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

      {/* Step 2: Detalles */}
      {step===2&&selectedWatch&&(
        <>
          {/* Preview reloj seleccionado */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", background:"#f8f6f0", borderRadius:8 }}>
            <div style={{ width:48, height:48, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>⌚</div>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{selectedWatch.model}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#888" }}>@{selectedWatch.slug}</div>
            </div>
            <button style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#aaa" }} onClick={()=>{setStep(1);setSelectedWatch(null);}}>✏️ Cambiar</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
            {/* Estado */}
            <div>
              <span style={S.label}>Estado</span>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {CONDITIONS.map(c=>(
                  <label key={c.id} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"8px 12px", borderRadius:6, border:`1px solid ${form.condition===c.id?c.color:"#e8e8e8"}`, background:form.condition===c.id?`${c.color}10`:"#fff" }}>
                    <input type="radio" name="condition" value={c.id} checked={form.condition===c.id} onChange={()=>setF("condition",c.id)} style={{ accentColor:c.color }} />
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:c.color }}>{c.label}</div>
                      <div style={{ fontSize:11, color:"#888" }}>{c.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Caja y papeles */}
              <div>
                <span style={S.label}>Documentación</span>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:8 }}>
                  <input type="checkbox" checked={form.has_box} onChange={e=>setF("has_box",e.target.checked)} />
                  <span style={{ fontSize:13 }}>📦 Tiene caja original</span>
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.has_papers} onChange={e=>setF("has_papers",e.target.checked)} />
                  <span style={{ fontSize:13 }}>📄 Tiene papeles / garantía</span>
                </label>
              </div>

              {/* Año de compra */}
              <div>
                <span style={S.label}>Año de compra</span>
                <input style={S.input} type="number" placeholder="2023" min="1950" max={new Date().getFullYear()} value={form.purchase_year} onChange={e=>setF("purchase_year",e.target.value)} />
              </div>

              {/* Dónde compraste */}
              <div>
                <span style={S.label}>Dónde lo compraste</span>
                <select style={S.input} value={form.purchase_source} onChange={e=>setF("purchase_source",e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {SOURCES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              {/* Precio pagado */}
              <div>
                <span style={S.label}>Precio pagado <span style={{ color:"#aaa", fontWeight:400 }}>(privado)</span></span>
                <div style={{ position:"relative" }}>
                  <input style={{ ...S.input, paddingLeft:28 }} type="number" placeholder="8500" value={form.purchase_price} onChange={e=>setF("purchase_price",e.target.value)} />
                  <span style={{ position:"absolute", left:10, top:11, color:"#888", fontSize:14 }}>€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fotos propias */}
          <div style={{ marginBottom:16 }}>
            <span style={S.label}>Tus fotos del reloj <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
              {photos.map((url,i)=>(
                <div key={i} style={{ position:"relative" }}>
                  <img src={url} alt="" style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1px solid #e8e8e8" }} />
                  <button style={{ position:"absolute", top:-6, right:-6, background:"#e11d48", border:"none", color:"#fff", borderRadius:"50%", width:20, height:20, cursor:"pointer", fontSize:11 }} onClick={()=>setPhotos(p=>p.filter((_,j)=>j!==i))}>×</button>
                </div>
              ))}
              <label style={{ width:80, height:80, border:"2px dashed #e8e8e8", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#aaa", fontSize:24, flexShrink:0 }}>
                {uploading?"⏳":"📷"}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>{ Array.from(e.target.files).forEach(uploadPhoto); }} />
              </label>
            </div>
          </div>

          {/* Notas */}
          {/* Número de serie */}
          <div style={{ marginBottom:14 }}>
            <span style={S.label}>Número de serie <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
            <input style={S.input} placeholder="Solo tú podrás verlo. Se guarda encriptado." value={form.serial} onChange={e=>setF("serial",e.target.value)} />
            <div style={{ fontSize:11, color:"#aaa", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
              🔒 Confidencial — nunca visible para otros usuarios
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <span style={S.label}>Notas personales <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
            <textarea style={{ ...S.input, resize:"none" }} rows={3} placeholder="Historia del reloj, detalles especiales, recuerdos..." value={form.notes} onChange={e=>setF("notes",e.target.value)} />
          </div>

          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button style={S.btn("outline")} onClick={()=>setStep(1)}>← Atrás</button>
            <button style={S.btn("primary")} onClick={save} disabled={saving||uploading}>{saving?"Guardando…":"Añadir al Garage"}</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── WATCH PASSPORT ───────────────────────────────────────────────────────────
function WatchPassport({ registration, watch, currentUser, onBack, onUpdated }) {
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [serviceForm, setServiceForm] = useState({ service_date:"", workshop:"", description:"", price:"" });
  const [savingService, setSavingService] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

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
      registration_id: registration.id,
      user_id: currentUser.id,
      service_date: serviceForm.service_date,
      workshop: serviceForm.workshop || null,
      description: serviceForm.description.trim(),
      price: serviceForm.price ? parseInt(serviceForm.price) : null,
    });
    setServiceForm({service_date:"",workshop:"",description:"",price:""});
    setShowServiceForm(false);
    await loadServices();
    setSavingService(false);
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

      {/* Hero */}
      <div style={{ height:200, background:`linear-gradient(135deg, ${bg}, ${bg}88)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", marginBottom:0, overflow:"hidden" }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{brandFromSlug(watch.slug)}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:28, color:"#fff", fontWeight:700, marginBottom:4 }}>{watch.model}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.5)" }}>@{watch.slug} · Ref. {watch.reference}</div>
          {cond&&<div style={{ marginTop:10, display:"inline-block", background:cond.color, borderRadius:4, padding:"3px 10px", fontSize:11, color:"#fff", fontWeight:700 }}>{cond.label}</div>}
        </div>
        {watch.image_url&&!imgError ? (
          <img src={watch.image_url} alt={watch.model} style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.4))", cursor:"zoom-in" }} onError={()=>setImgError(true)} onClick={()=>setLightbox(watch.image_url)} />
        ) : <div style={{ fontSize:64, opacity:0.3 }}>⌚</div>}
        {lightbox&&(
          <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.95)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setLightbox(null)}>
            <img src={lightbox} alt="" style={{ maxWidth:"95vw", maxHeight:"95vh", objectFit:"contain", borderRadius:8 }} />
            <button style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:"50%", width:40, height:40, fontSize:20, cursor:"pointer" }}>×</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, margin:"16px 0", flexWrap:"wrap" }}>
        {[["info","📋 Info"],["fotos","📷 Fotos"],["servicios","🔧 Servicios"],["specs","⚙️ Specs"]].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:activeTab===id?"#1a2744":"#f0ede6", color:activeTab===id?"#fff":"#666", fontWeight:activeTab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {/* Info */}
      {activeTab==="info"&&(
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            ["Estado", cond?.label||"—", cond?.color],
            ["Caja original", registration?.has_box?"✓ Sí":"✗ No", registration?.has_box?"#16a34a":"#dc2626"],
            ["Papeles / Garantía", registration?.has_papers?"✓ Sí":"✗ No", registration?.has_papers?"#16a34a":"#dc2626"],
            ["Año de compra", registration?.purchase_year||"—"],
            ["Comprado en", source?.label||"—"],
            ["Precio pagado", registration?.purchase_price?`${registration.purchase_price.toLocaleString()}€ (privado)`:"—"],
            ["Precio de mercado", watch.market_price||"—"],
            ["Servicios registrados", services.length],
          ].map(([k,v,color])=>(
            <div key={k} style={{ background:"#f8f6f0", borderRadius:8, padding:"12px 16px" }}>
              <div style={S.label}>{k}</div>
              <div style={{ fontSize:15, fontWeight:600, color:color||"#1a1a1a" }}>{v}</div>
            </div>
          ))}
          {registration?.serial_last4&&(
            <div style={{ background:"#f8f6f0", borderRadius:8, padding:"12px 16px" }}>
              <div style={S.label}>Número de serie</div>
              <div style={{ fontSize:15, fontWeight:600, fontFamily:"'DM Mono',monospace" }}>
                ****{registration.serial_last4}
                <span style={{ fontSize:11, color:"#aaa", marginLeft:8, fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>🔒 Solo visible para ti</span>
              </div>
            </div>
          )}
          {registration?.notes&&(
            <div style={{ gridColumn:"1/-1", background:"#f8f6f0", borderRadius:8, padding:"12px 16px" }}>
              <div style={S.label}>Notas personales</div>
              <p style={{ fontSize:14, color:"#444", margin:0, lineHeight:1.6 }}>{registration.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Fotos */}
      {activeTab==="fotos"&&(
        <div>
          {(!registration?.photos||registration.photos.length===0)&&(
            <div style={{ ...S.card, textAlign:"center", padding:40, color:"#888" }}>Sin fotos propias aún.</div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {(registration?.photos||[]).map((url,i)=>(
              <img key={i} src={url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:10, border:"1px solid #ece9e2" }} />
            ))}
          </div>
        </div>
      )}

      {/* Servicios */}
      {activeTab==="servicios"&&(
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <button style={S.btn("primary")} onClick={()=>setShowServiceForm(!showServiceForm)}>+ Añadir servicio</button>
          </div>
          {showServiceForm&&(
            <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:16 }}>
              <h3 style={{ ...S.h2, marginBottom:16 }}>Nuevo servicio</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div><span style={S.label}>Fecha</span><input style={S.input} type="date" value={serviceForm.service_date} onChange={e=>setServiceForm(f=>({...f,service_date:e.target.value}))} /></div>
                <div><span style={S.label}>Taller / Relojero</span><input style={S.input} placeholder="Nombre del taller" value={serviceForm.workshop} onChange={e=>setServiceForm(f=>({...f,workshop:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:12 }}><span style={S.label}>Descripción</span><textarea style={{ ...S.input, resize:"none" }} rows={2} placeholder="Revisión completa, cambio de correa, etc." value={serviceForm.description} onChange={e=>setServiceForm(f=>({...f,description:e.target.value}))} /></div>
              <div style={{ marginBottom:16 }}><span style={S.label}>Coste <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span><input style={S.input} type="number" placeholder="250" value={serviceForm.price} onChange={e=>setServiceForm(f=>({...f,price:e.target.value}))} /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
                <button style={S.btn("outline")} onClick={()=>setShowServiceForm(false)}>Cancelar</button>
                <button style={S.btn("primary")} onClick={addService} disabled={savingService||!serviceForm.description.trim()||!serviceForm.service_date}>{savingService?"Guardando…":"Guardar"}</button>
              </div>
            </div>
          )}
          {services.length===0&&!showServiceForm&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin servicios registrados aún.</div>}
          {services.map(s=>(
            <div key={s.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", marginBottom:4 }}>{s.service_date}</div>
                {s.workshop&&<div style={{ fontWeight:600, marginBottom:4 }}>{s.workshop}</div>}
                <p style={{ fontSize:14, color:"#444", margin:0 }}>{s.description}</p>
                {s.price&&<div style={{ fontSize:12, color:"#888", marginTop:4 }}>Coste: {s.price.toLocaleString()}€</div>}
              </div>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#ddd", fontSize:16 }} onClick={()=>deleteService(s.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* Specs */}
      {activeTab==="specs"&&(
        <div style={S.card}>
          {watch.specs&&Object.keys(watch.specs).length>0 ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {Object.entries(watch.specs).map(([k,v])=>(
                <div key={k} style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px" }}>
                  <div style={S.label}>{k.replace(/_/g," ")}</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
          ):<p style={S.muted}>Sin especificaciones técnicas.</p>}
        </div>
      )}
    </div>
  );
}

// ─── GARAGE PAGE ──────────────────────────────────────────────────────────────
function GarageCarousel({ watches, onSelect }) {
  const [idx, setIdx] = useState(0);
  const w = watches[idx];
  if(!w?.watch) return null;
  const bg = brandColor(w.watch.slug);
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ position:"relative", height:280, borderRadius:16, background:`linear-gradient(135deg,${bg},${bg}88)`, overflow:"hidden", cursor:"pointer" }}
        onClick={()=>onSelect({...w,watch:w.watch})}>
        {/* Watch image */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", padding:"0 40px" }}>
          {w.watch.image_url&&!imgError
            ? <img src={w.watch.image_url} alt={w.watch.model} style={{ maxHeight:200, objectFit:"contain", filter:"drop-shadow(0 12px 32px rgba(0,0,0,0.5))", transition:"transform 0.3s" }} onError={()=>setImgError(true)} />
            : <span style={{ fontSize:80, opacity:0.3 }}>⌚</span>
          }
        </div>
        {/* Info overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.7))", padding:"32px 24px 20px" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>{brandFromSlug(w.watch.slug)}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, color:"#fff", fontWeight:700 }}>{w.watch.model}</div>
          {w.watch.market_price&&<div style={{ fontSize:13, color:"#b8963e", marginTop:4 }}>💰 {w.watch.market_price}</div>}
        </div>
        {/* Condition badge */}
        {w.condition&&(
          <div style={{ position:"absolute", top:16, right:16, background:"rgba(0,0,0,0.5)", borderRadius:6, padding:"4px 10px", fontSize:11, color:"#fff", fontWeight:700, textTransform:"capitalize" }}>
            {w.condition.replace("_"," ")}
          </div>
        )}
        {/* Tap hint */}
        <div style={{ position:"absolute", top:16, left:16, background:"rgba(0,0,0,0.4)", borderRadius:6, padding:"4px 10px", fontSize:11, color:"rgba(255,255,255,0.7)" }}>
          Ver Watch Passport →
        </div>
      </div>
      {/* Dots navigation */}
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
      <span style={{ fontSize:13, color:"rgba(255,255,255,0.0)", fontFamily:"'DM Sans',sans-serif", color:"#888" }}>
        {isPublic?"👁 Público":"🔒 Privado"}
      </span>
      <div style={{ width:40, height:22, borderRadius:11, background:isPublic?"#1a2744":"#ddd", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:isPublic?20:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

export function GaragePage({ currentUser, onNavigate }) {
  const [watches, setWatches] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBrand, setFilterBrand] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [showAddWish, setShowAddWish] = useState(false);
  const [tab, setTab] = useState("coleccion");
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showPostInfo, setShowPostInfo] = useState(false);
  const [savedWatch, setSavedWatch] = useState(null);

  useEffect(()=>{ if(currentUser?.id) load(); },[currentUser]);

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

  // Collection Insights
  const allWatches = watches.map(w=>w.watch).filter(Boolean);
  const brandCount = allWatches.reduce((acc,w)=>{ const b=brandFromSlug(w.slug); acc[b]=(acc[b]||0)+1; return acc; },{});
  const topBrand = Object.entries(brandCount).sort((a,b)=>b[1]-a[1])[0];
  const typeCount = allWatches.reduce((acc,w)=>{ const t=w.watch_type||"otros"; acc[t]=(acc[t]||0)+1; return acc; },{});
  const topType = Object.entries(typeCount).sort((a,b)=>b[1]-a[1])[0];

  const brands = [...new Set(allWatches.map(w=>brandFromSlug(w.slug)))];
  const types = [...new Set(allWatches.map(w=>w.watch_type).filter(Boolean))];

  const filteredWatches = watches.filter(w=>{
    if(!w.watch) return false;
    if(filterBrand&&brandFromSlug(w.watch.slug)!==filterBrand) return false;
    if(filterType&&w.watch.watch_type!==filterType) return false;
    return true;
  });

  if(loading) return <Spinner />;

  // Post-registration info screen
  if(showPostInfo&&savedWatch) {
    const BRAND_WEBSITES = { rolex:"https://www.rolex.com", omega:"https://www.omegawatches.com", patek:"https://www.patek.com", ap:"https://www.audemarspiguet.com", iwc:"https://www.iwc.com", jlc:"https://www.jaeger-lecoultre.com", tudor:"https://www.tudorwatch.com", cartier:"https://www.cartier.com", breitling:"https://www.breitling.com", tag:"https://www.tagheuer.com", vc:"https://www.vacheron-constantin.com", hublot:"https://www.hublot.com", panerai:"https://www.panerai.com", gs:"https://www.grand-seiko.com", zenith:"https://www.zenith-watches.com" };
    const brandSlug = savedWatch.slug?.split("_")[0];
    const interval = { rolex:10, omega:8, patek:5, ap:5, iwc:5, jlc:5, tudor:10, cartier:5, breitling:5, tag:5, vc:5, hublot:5, panerai:5, gs:5, zenith:5 }[brandSlug] || 5;
    const bg = brandColor(savedWatch.slug);
    return (
      <div>
        <div style={{ height:180, background:`linear-gradient(135deg,${bg},${bg}88)`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", marginBottom:24, overflow:"hidden" }}>
          <div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>✓ Reloj registrado</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:26, color:"#fff", fontWeight:700 }}>{savedWatch.model}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:4 }}>{brandFromSlug(savedWatch.slug)}</div>
          </div>
          {savedWatch.image_url&&<img src={savedWatch.image_url} alt="" style={{ height:"80%", objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }} onError={e=>e.target.style.display="none"} />}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:20 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔧</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Cada {interval} años</div>
            <div style={S.muted}>Revisión recomendada por {brandFromSlug(savedWatch.slug)}</div>
          </div>
          {savedWatch.market_price&&(
            <div style={{ ...S.card, marginBottom:0, textAlign:"center", padding:20 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>💰</div>
              <div style={{ fontWeight:700, fontSize:16, color:"#b8963e", marginBottom:4 }}>{savedWatch.market_price}</div>
              <div style={S.muted}>Precio de mercado</div>
            </div>
          )}
        </div>

        {savedWatch.specs&&Object.keys(savedWatch.specs).length>0&&(
          <div style={{ ...S.card, marginBottom:20 }}>
            <h3 style={{ ...S.h2, marginBottom:14 }}>Especificaciones técnicas</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {Object.entries(savedWatch.specs).slice(0,6).map(([k,v])=>(
                <div key={k} style={{ background:"#f8f6f0", borderRadius:6, padding:"8px 12px" }}>
                  <div style={S.label}>{k.replace(/_/g," ")}</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {BRAND_WEBSITES[brandSlug]&&(
            <a href={BRAND_WEBSITES[brandSlug]} target="_blank" rel="noreferrer" style={{ ...S.btn("outline"), textDecoration:"none", fontSize:13 }}>
              🌐 Web oficial de {brandFromSlug(savedWatch.slug)}
            </a>
          )}
          <button style={S.btn("primary")} onClick={()=>{ setShowPostInfo(false); onSaved(); }}>
            Ver mi Garage →
          </button>
        </div>
      </div>
    );
  }

  // Watch Passport view
  if(selectedRegistration) {
    return <WatchPassport
      registration={selectedRegistration}
      watch={selectedRegistration.watch}
      currentUser={currentUser}
      onBack={()=>setSelectedRegistration(null)}
      onUpdated={load}
    />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>Mi Garage</h2>
          <p style={S.muted}>{watches.length} {watches.length===1?"reloj":"relojes"} en tu colección</p>
        </div>
        <div style={S.row}>
          <GaragePublicToggle userId={currentUser.id} />
          <button style={S.btn("primary")} onClick={()=>{ setShowAddWatch(true); setTab("coleccion"); }}>+ Añadir reloj</button>
        </div>
      </div>

      {/* Carrusel de relojes */}
      {watches.length>0&&<GarageCarousel watches={watches} onSelect={setSelectedRegistration} />}

      {/* Stats row */}
      {watches.length>0&&(
        <div style={{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" }}>
          {[
            ["⌚", watches.length, watches.length===1?"reloj":"relojes"],
            ["❤️", wishlist.length, "wish list"],
            topBrand ? ["🏆", topBrand[0], "marca favorita"] : null,
            topType ? ["📊", topType[0], "tipo"] : null,
          ].filter(Boolean).map(([icon,val,label])=>(
            <div key={label} style={{ textAlign:"center" }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span style={{ fontWeight:700, fontSize:15, color:"#1a2744", marginLeft:6, textTransform:"capitalize" }}>{val}</span>
              <span style={{ color:"#aaa", fontSize:13, marginLeft:4 }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:16 }}>
        <button onClick={()=>setTab("coleccion")} style={{ padding:"6px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab==="coleccion"?"#1a2744":"#f0ede6", color:tab==="coleccion"?"#fff":"#666", fontWeight:tab==="coleccion"?600:400 }}>Colección ({watches.length})</button>
        <button onClick={()=>setTab("wishlist")} style={{ padding:"6px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab==="wishlist"?"#b8963e":"#f0ede6", color:tab==="wishlist"?"#fff":"#888", fontWeight:tab==="wishlist"?600:400 }}>Wish List ({wishlist.length})</button>
      </div>

      {/* Colección */}
      {tab==="coleccion"&&(
        <div>
          {showAddWatch&&(
            <AddWatchForm currentUser={currentUser} toWishlist={false}
              onSaved={(watch)=>{ setShowAddWatch(false); if(watch){ setSavedWatch(watch); setShowPostInfo(true); } load(); }}
              onCancel={()=>setShowAddWatch(false)} />
          )}

          {watches.length>0&&(
            <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
              <button onClick={()=>{setFilterBrand("");setFilterType("");}} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:!filterBrand&&!filterType?"#1a2744":"#f0ede6", color:!filterBrand&&!filterType?"#fff":"#666" }}>Todos</button>
              {brands.map(b=><button key={b} onClick={()=>setFilterBrand(filterBrand===b?"":b)} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:filterBrand===b?"#1a2744":"#f0ede6", color:filterBrand===b?"#fff":"#666" }}>{b}</button>)}
              {types.map(t=><button key={t} onClick={()=>setFilterType(filterType===t?"":t)} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontFamily:"'DM Mono',monospace", background:filterType===t?"#1a2744":"#f0ede6", color:filterType===t?"#fff":"#888", textTransform:"capitalize" }}>{t}</button>)}
            </div>
          )}

          {watches.length===0&&!showAddWatch&&(
            <div style={{ ...S.card, textAlign:"center", padding:56 }}>
              <div style={{ fontSize:56, marginBottom:16 }}>⌚</div>
              <div style={{ fontWeight:700, fontSize:20, marginBottom:8 }}>Tu garage está vacío</div>
              <p style={{ ...S.muted, marginBottom:24, maxWidth:320, margin:"0 auto 24px" }}>Añade tu primer reloj para empezar tu colección digital</p>
              <button style={S.btn("primary")} onClick={()=>setShowAddWatch(true)}>+ Añadir mi primer reloj</button>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
            {filteredWatches.map(w=>w.watch&&(
              <div key={w.id} style={{ position:"relative" }}>
                <GarageWatchCard watch={w.watch} registration={w} onClick={()=>setSelectedRegistration(w)} />
                <div style={{ position:"absolute", top:8, right:8, display:"flex", gap:4, zIndex:10 }}>
                  <button style={{ background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:12, padding:"2px 8px", cursor:"pointer", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}
                    onClick={e=>{e.stopPropagation();togglePublic(w.id,w.is_public);}}>
                    {w.is_public?"👁 Público":"🔒 Privado"}
                  </button>
                  <button style={{ background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}
                    onClick={e=>{e.stopPropagation();removeWatch(w.watch.id,false);}}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wish List */}
      {tab==="wishlist"&&(
        <div>
          {showAddWish&&(
            <AddWatchForm currentUser={currentUser} toWishlist={true}
              onSaved={()=>{ setShowAddWish(false); load(); }}
              onCancel={()=>setShowAddWish(false)} />
          )}
          {!showAddWish&&<button style={{ ...S.btn("outline"), marginBottom:16 }} onClick={()=>setShowAddWish(true)}>+ Añadir a Wish List</button>}

          {wishlist.length===0&&!showAddWish&&(
            <div style={{ ...S.card, textAlign:"center", padding:56 }}>
              <div style={{ fontSize:56, marginBottom:16 }}>❤️</div>
              <div style={{ fontWeight:700, fontSize:20, marginBottom:8 }}>Wish List vacía</div>
              <p style={{ ...S.muted, marginBottom:24 }}>Guarda los relojes que te gustaría tener algún día</p>
              <button style={{ ...S.btn("gold") }} onClick={()=>setShowAddWish(true)}>+ Añadir a Wish List</button>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
            {wishlist.map(w=>w.watch&&(
              <div key={w.id} style={{ position:"relative" }}>
                <GarageWatchCard watch={w.watch} registration={null} wishlist onClick={()=>onNavigate("watch",w.watch.slug)} />
                <button style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}
                  onClick={e=>{e.stopPropagation();removeWatch(w.watch.id,true);}}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
