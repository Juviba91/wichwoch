import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, timeAgo } from "../data/constants";
import { Spinner, StarRating, Avatar } from "../components/UI";

const SPECIALTY_LABELS = {
  vintage: "⏳ Vintage",
  sport: "🏃 Sport",
  diver: "🤿 Buceo",
  complicaciones: "⚙️ Complicaciones",
  restauracion: "🔨 Restauración",
  certificado: "✓ Certificado",
  chrono: "⏱️ Cronógrafo",
  dress: "👔 Dress",
};

export function WorkshopsPage({ currentUser, onNavigate }) {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterCity, setFilterCity] = useState("");
  const [filterSpec, setFilterSpec] = useState("");

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    const {data}=await supabase.from("workshops").select("*").order("verified",{ascending:false}).order("name");
    // Also load taller profiles (account_type=taller, verified_business=true)
    const {data:tallerProfiles}=await supabase.from("profiles").select("id,name,location,bio,corporate_url,verified_business,account_type").eq("account_type","taller");
    // Merge - show workshop table entries + verified taller profiles not already in table
    const workshopIds = new Set((data||[]).map(w=>w.name));
    const extraTalleres = (tallerProfiles||[]).filter(p=>!workshopIds.has(p.name)).map(p=>({
      id:p.id, name:p.name, city:p.location, description:p.bio,
      website:p.corporate_url, verified:p.verified_business,
      specialties:[], brands:[], _isProfile:true
    }));
    const allWorkshops = [...(data||[]), ...extraTalleres];
    setWorkshops(allWorkshops);
    setLoading(false);
  }

  const cities = [...new Set((workshops||[]).map(w=>w.city).filter(Boolean))];
  const filtered = workshops.filter(w=>{
    if(filterCity&&w.city!==filterCity) return false;
    if(filterSpec&&!w.specialties?.includes(filterSpec)) return false;
    return true;
  });

  if(selected) return <WorkshopDetail workshop={selected} currentUser={currentUser} onBack={()=>setSelected(null)} onNavigate={onNavigate} />;

  return (
    <div>
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>🔧 Talleres</h2>
          <p style={S.muted}>Encuentra el taller de confianza para tu reloj</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        <button onClick={()=>{setFilterCity("");setFilterSpec("");}} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:!filterCity&&!filterSpec?"#1a2744":"#f0ede6", color:!filterCity&&!filterSpec?"#fff":"#666" }}>Todos</button>
        {cities.map(c=>(
          <button key={c} onClick={()=>setFilterCity(filterCity===c?"":c)} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:filterCity===c?"#1a2744":"#f0ede6", color:filterCity===c?"#fff":"#666" }}>{c}</button>
        ))}
        <div style={{ width:1, background:"#ddd", margin:"0 4px" }} />
        {Object.entries(SPECIALTY_LABELS).map(([k,v])=>(
          <button key={k} onClick={()=>setFilterSpec(filterSpec===k?"":k)} style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontFamily:"'DM Sans',sans-serif", background:filterSpec===k?"#1a2744":"#f0ede6", color:filterSpec===k?"#fff":"#666" }}>{v}</button>
        ))}
      </div>

      {loading?<Spinner />:(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
          {filtered.map(w=>(
            <div key={w.id} style={{ ...S.card, cursor:"pointer", padding:0, overflow:"hidden", marginBottom:0 }}
              onClick={()=>setSelected(w)}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"; }}>
              {/* Header */}
              <div style={{ height:120, background:"linear-gradient(135deg,#1a2744,#2a3a5a)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                {w.photo_url
                  ? <img src={w.photo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"} />
                  : <span style={{ fontSize:48, opacity:0.3 }}>🔧</span>
                }
                {w.verified&&<div style={{ position:"absolute", top:10, right:10, background:"#b8963e", borderRadius:4, padding:"2px 8px", fontSize:10, color:"#fff", fontWeight:700, fontFamily:"'DM Mono',monospace" }}>✓ Verificado</div>}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.7))", padding:"20px 16px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:16, color:"#fff" }}>{w.name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>📍 {w.city}</div>
                </div>
              </div>
              {/* Info */}
              <div style={{ padding:"14px 16px" }}>
                <p style={{ fontSize:13, color:"#555", margin:"0 0 10px", lineHeight:1.5 }}>{w.description?.slice(0,80)}{w.description?.length>80?"…":""}</p>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {(w.specialties||[]).slice(0,3).map(s=>(
                    <span key={s} style={{ fontSize:10, background:"#f0ede6", borderRadius:4, padding:"2px 6px", color:"#666" }}>{SPECIALTY_LABELS[s]||s}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div style={{ gridColumn:"1/-1", ...S.card, textAlign:"center", color:"#888", padding:40 }}>Sin talleres para estos filtros.</div>}
        </div>
      )}
    </div>
  );
}

export function WorkshopDetail({ workshop, currentUser, onBack, onNavigate }) {
  const [reviews, setReviews] = useState([]);
  const [showAppointment, setShowAppointment] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ loadReviews(); },[workshop.id]);

  async function loadReviews() {
    const {data}=await supabase.from("workshop_reviews")
      .select("*, author:profiles(id,name,handle,avatar_color,flow)")
      .eq("workshop_id",workshop.id).order("created_at",{ascending:false});
    setReviews(data||[]);
    if(currentUser?.id) setMyReview((data||[]).find(r=>r.author_id===currentUser.id)||null);
    setLoading(false);
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s,r)=>s+r.rating*(r.author?.flow||1),0) / (reviews.reduce((s,r)=>s+(r.author?.flow||1),0)||1)).toFixed(1)
    : null;

  return (
    <div>
      <button style={{ ...S.btn("outline"), marginBottom:20, fontSize:12 }} onClick={onBack}>← Volver a talleres</button>

      {/* Hero */}
      <div style={{ height:200, background:"linear-gradient(135deg,#1a2744,#2a3a5a)", borderRadius:12, marginBottom:20, display:"flex", alignItems:"flex-end", padding:"0 32px 24px", position:"relative", overflow:"hidden" }}>
        {workshop.photo_url&&<img src={workshop.photo_url} alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.4 }} />}
        <div style={{ position:"relative" }}>
          {workshop.verified&&<div style={{ marginBottom:8, display:"inline-block", background:"#b8963e", borderRadius:4, padding:"2px 10px", fontSize:11, color:"#fff", fontWeight:700 }}>✓ Taller Verificado</div>}
          <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:26, color:"#fff", fontWeight:700, marginBottom:4 }}>{workshop.name}</h2>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>📍 {workshop.address||workshop.city}{workshop.city&&`, ${workshop.city}`}</div>
          {avgRating&&(
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
              {[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:16, color:i<=Math.round(avgRating)?"#f59e0b":"rgba(255,255,255,0.3)" }}>★</span>)}
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{avgRating} ({reviews.length} reseñas)</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
        <div>
          {/* Descripción */}
          <div style={S.card}>
            <p style={{ fontSize:14, lineHeight:1.7, color:"#444", margin:0 }}>{workshop.description||"Sin descripción."}</p>
          </div>

          {/* Especialidades */}
          {workshop.specialties?.length>0&&(
            <div style={S.card}>
              <h3 style={{ ...S.h2, marginBottom:12 }}>Especialidades</h3>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {workshop.specialties.map(s=>(
                  <span key={s} style={{ padding:"6px 14px", background:"#f0ede6", borderRadius:20, fontSize:13, fontWeight:600 }}>{SPECIALTY_LABELS[s]||s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Marcas */}
          {workshop.brands?.length>0&&(
            <div style={S.card}>
              <h3 style={{ ...S.h2, marginBottom:12 }}>Marcas que trabajan</h3>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {workshop.brands.map(b=>(
                  <span key={b} style={{ padding:"4px 12px", background:"#1a2744", color:"#fff", borderRadius:20, fontSize:12, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* Reseñas */}
          <div style={S.card}>
            <div style={{ ...S.row, justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ ...S.h2, marginBottom:0 }}>Reseñas</h3>
              {currentUser&&!myReview&&<button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>setShowReview(true)}>+ Escribir reseña</button>}
            </div>
            {showReview&&<WorkshopReviewForm workshopId={workshop.id} currentUser={currentUser} onSaved={()=>{ setShowReview(false); loadReviews(); }} onCancel={()=>setShowReview(false)} />}
            {loading?<Spinner />:reviews.length===0?<p style={S.muted}>Sin reseñas aún.</p>:reviews.map(r=>(
              <div key={r.id} style={{ paddingBottom:14, marginBottom:14, borderBottom:"1px solid #f0ede6" }}>
                <div style={{ ...S.row, justifyContent:"space-between", marginBottom:8 }}>
                  <div style={S.row}>
                    <div style={{ width:32,height:32,borderRadius:"50%",background:r.author?.avatar_color||"#1a2744",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",fontSize:12,fontFamily:"'DM Mono',monospace" }}>
                      {(r.author?.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>@{r.author?.handle}</div>
                      <div style={S.muted}>{timeAgo(r.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:14, color:i<=r.rating?"#f59e0b":"#e2e8f0" }}>★</span>)}</div>
                </div>
                {r.content&&<p style={{ fontSize:13, color:"#444", margin:0, lineHeight:1.5 }}>{r.content}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Pedir cita */}
          <div style={{ ...S.card, background:"linear-gradient(135deg,#1a2744,#2a3a5a)", border:"none" }}>
            <h3 style={{ fontFamily:"'DM Mono',monospace", fontSize:16, color:"#fff", marginBottom:12 }}>Pedir cita</h3>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:16 }}>El taller te confirmará la disponibilidad.</p>
            {currentUser
              ? <button style={{ ...S.btn("gold"), width:"100%", textAlign:"center" }} onClick={()=>setShowAppointment(true)}>📅 Solicitar cita</button>
              : <button style={{ ...S.btn("gold"), width:"100%", textAlign:"center" }} onClick={()=>onNavigate("feed")}>Regístrate para pedir cita</button>
            }
          </div>

          {/* Contacto */}
          <div style={S.card}>
            <h3 style={{ ...S.h2, marginBottom:12 }}>Contacto</h3>
            {workshop.phone&&<div style={{ marginBottom:8 }}><span style={S.label}>Teléfono</span><div style={{ fontSize:13 }}>📞 {workshop.phone}</div></div>}
            {workshop.email&&<div style={{ marginBottom:8 }}><span style={S.label}>Email</span><div style={{ fontSize:13 }}>✉️ {workshop.email}</div></div>}
            {workshop.website&&<div><span style={S.label}>Web</span><a href={workshop.website} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#1a2744" }}>🌐 {workshop.website}</a></div>}
            {!workshop.phone&&!workshop.email&&!workshop.website&&<p style={S.muted}>Sin datos de contacto.</p>}
          </div>

          {/* Mapa placeholder */}
          {workshop.lat&&workshop.lng&&(
            <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
              <a href={`https://maps.google.com/?q=${workshop.lat},${workshop.lng}`} target="_blank" rel="noreferrer">
                <img src={`https://maps.googleapis.com/maps/api/staticmap?center=${workshop.lat},${workshop.lng}&zoom=15&size=300x200&markers=${workshop.lat},${workshop.lng}&key=AIzaSyD-placeholder`}
                  alt="Mapa" style={{ width:"100%", height:160, objectFit:"cover", display:"block", background:"#f0ede6" }}
                  onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                <div style={{ display:"none", height:160, alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, background:"#f0ede6", cursor:"pointer" }}>
                  <span style={{ fontSize:32 }}>📍</span>
                  <span style={{ fontSize:13, color:"#888" }}>Ver en Google Maps</span>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Appointment modal */}
      {showAppointment&&currentUser&&(
        <AppointmentModal workshop={workshop} currentUser={currentUser} onClose={()=>setShowAppointment(false)} />
      )}
    </div>
  );
}

function WorkshopReviewForm({ workshopId, currentUser, onSaved, onCancel }) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [hover, setHover] = useState(0);

  async function submit() {
    if(!rating) return;
    setSaving(true);
    await supabase.from("workshop_reviews").insert({ workshop_id:workshopId, author_id:currentUser.id, rating, content:content.trim()||null });
    setSaving(false); onSaved();
  }

  return (
    <div style={{ background:"#f8f6f0", borderRadius:8, padding:16, marginBottom:16 }}>
      <div style={{ marginBottom:12 }}>
        <span style={S.label}>Puntuación</span>
        <div style={{ display:"flex", gap:4 }}>
          {[1,2,3,4,5].map(i=>(
            <span key={i} style={{ fontSize:28, cursor:"pointer", color:i<=(hover||rating)?"#f59e0b":"#e2e8f0" }}
              onClick={()=>setRating(i)} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}>★</span>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <span style={S.label}>Tu opinión <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
        <textarea style={{ ...S.input, resize:"none" }} rows={3} placeholder="¿Cómo fue tu experiencia?" value={content} onChange={e=>setContent(e.target.value)} />
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button style={S.btn("outline")} onClick={onCancel}>Cancelar</button>
        <button style={S.btn("primary")} onClick={submit} disabled={saving||!rating}>{saving?"Guardando…":"Publicar reseña"}</button>
      </div>
    </div>
  );
}

function AppointmentModal({ workshop, currentUser, onClose }) {
  const [watches, setWatches] = useState([]);
  const [form, setForm] = useState({ watch_id:"", preferred_date:"", message:"" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(()=>{
    supabase.from("watch_registrations").select("watch:watches(id,slug,model)").eq("user_id",currentUser.id)
      .then(({data})=>setWatches((data||[]).map(r=>r.watch).filter(Boolean)));
  },[]);

  async function submit() {
    setSaving(true);
    await supabase.from("workshop_appointments").insert({
      workshop_id:workshop.id, user_id:currentUser.id,
      watch_id:form.watch_id||null,
      preferred_date:form.preferred_date||null,
      message:form.message.trim()||null,
    });
    setDone(true); setSaving(false);
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:12, padding:28, width:"100%", maxWidth:480 }}>
        {done ? (
          <div style={{ textAlign:"center", padding:20 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
            <h3 style={{ fontFamily:"'DM Mono',monospace", fontSize:20, marginBottom:8 }}>Solicitud enviada</h3>
            <p style={{ color:"#888", marginBottom:20 }}>{workshop.name} recibirá tu solicitud y se pondrá en contacto contigo.</p>
            <button style={S.btn("primary")} onClick={onClose}>Perfecto</button>
          </div>
        ) : (
          <>
            <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontFamily:"'DM Mono',monospace", fontSize:18, margin:0 }}>Pedir cita en {workshop.name}</h3>
              <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#aaa" }} onClick={onClose}>×</button>
            </div>
            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Reloj a revisar <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
              <select style={S.input} value={form.watch_id} onChange={e=>setForm(f=>({...f,watch_id:e.target.value}))}>
                <option value="">Selecciona un reloj...</option>
                {watches.map(w=><option key={w.id} value={w.id}>{w.model}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Fecha preferida <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
              <input style={S.input} type="date" value={form.preferred_date} onChange={e=>setForm(f=>({...f,preferred_date:e.target.value}))} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div style={{ marginBottom:20 }}>
              <span style={S.label}>Mensaje</span>
              <textarea style={{ ...S.input, resize:"none" }} rows={3} placeholder="Describe el problema o el servicio que necesitas..." value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} autoFocus />
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button style={S.btn("outline")} onClick={onClose}>Cancelar</button>
              <button style={S.btn("primary")} onClick={submit} disabled={saving}>{saving?"Enviando…":"Solicitar cita"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
