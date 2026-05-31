import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, timeAgo } from "../data/constants";
import { Avatar, Badge, Spinner, StarRating } from "../components/UI";

// ─── WATCH REVIEWS ────────────────────────────────────────────────────────────
function QuickRating({ watchId, currentUser, onRated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(r) {
    setSaving(true);
    const {data:col}=await supabase.from("watch_registrations").select("id").eq("user_id",currentUser.id).eq("watch_id",watchId).maybeSingle();
    await supabase.from("watch_reviews").insert({
      watch_id:watchId, author_id:currentUser.id,
      rating:r, title:"Valoración rápida", content:"", is_owner:!!col, rating_only:true
    }).catch(()=>{});
    setDone(true); setSaving(false); if(onRated) onRated();
  }

  if(done) return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border:"1px solid #b3dfc4", borderRadius:8, background:"#f0fdf4" }}>
      {[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:20, color:i<=rating?"#f59e0b":"#e2e8f0" }}>★</span>)}
      <span style={{ fontSize:13, color:"#16a34a", fontWeight:600 }}>✓ Guardado</span>
    </div>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", border:"1px solid #e8e8e8", borderRadius:8, background:"#fff" }}>
      <span style={{ fontSize:12, color:"#888" }}>Tu nota rápida:</span>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{ fontSize:22, cursor:"pointer", color:i<=(hover||rating)?"#f59e0b":"#e2e8f0", transition:"color 0.1s" }}
          onClick={()=>{ setRating(i); submit(i); }}
          onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)}>★</span>
      ))}
    </div>
  );
}


export function WatchRatingSummary({ watchId }) {
  const [data, setData] = useState(null);
  useEffect(()=>{
    if(!watchId) return;
    supabase.from("watch_reviews")
      .select("rating, author:profiles(flow)")
      .eq("watch_id", watchId)
      .then(({data:reviews})=>{
        if(!reviews||!reviews.length) return;
        const totalFlow = reviews.reduce((s,r)=>s+(r.author?.flow||1),0)||1;
        const weightedAvg = reviews.reduce((s,r)=>s+r.rating*(r.author?.flow||1),0)/totalFlow;
        setData({ avg:weightedAvg.toFixed(1), count:reviews.length });
      });
  },[watchId]);

  if(!data) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8 }}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{ fontSize:18, color:i<=Math.round(data.avg)?"#f59e0b":"#e2e8f0" }}>★</span>
      ))}
      <span style={{ fontSize:13, color:"#888", fontFamily:"'DM Mono',monospace" }}>{data.avg}</span>
      <span style={{ fontSize:12, color:"#aaa" }}>({data.count} valoraciones)</span>
    </div>
  );
}

export function WatchReviews({ watchId, currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [form, setForm] = useState({ rating:0, title:"", content:"" });
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(()=>{ load(); },[watchId]);

  async function load() {
    setLoading(true);
    const {data}=await supabase.from("watch_reviews")
      .select("*, author:profiles(id,name,handle,avatar_color,avatar_emoji,flow)")
      .eq("watch_id",watchId)
      .order("is_owner",{ascending:false})
      .order("created_at",{ascending:false});
    setReviews(data||[]);
    if(currentUser?.id) {
      const mine = (data||[]).find(r=>r.author_id===currentUser.id);
      setMyReview(mine||null);
      if(mine) setForm({rating:mine.rating,title:mine.title,content:mine.content});
      // Check if owner
      const {data:col}=await supabase.from("watch_registrations").select("id").eq("user_id",currentUser.id).eq("watch_id",watchId).maybeSingle();
      setIsOwner(!!col);
    }
    setLoading(false);
  }

  async function submitReview() {
    if(!form.rating||!form.title.trim()||!form.content.trim()) return;
    setSaving(true);
    const payload = { watch_id:watchId, author_id:currentUser.id, rating:form.rating, title:form.title.trim(), content:form.content.trim(), is_owner:isOwner };
    if(myReview) await supabase.from("watch_reviews").update(payload).eq("id",myReview.id);
    else await supabase.from("watch_reviews").insert(payload);
    setShowForm(false); await load(); setSaving(false);
  }

  // Flow-weighted average
  const totalFlow = reviews.reduce((s,r)=>s+(r.author?.flow||1),0)||1;
  const weightedAvg = reviews.length
    ? (reviews.reduce((s,r)=>s+r.rating*(r.author?.flow||1),0)/totalFlow).toFixed(1)
    : null;
  const avgRating = weightedAvg;

  return (
    <div>
      {/* Summary */}
      {reviews.length>0&&(
        <div style={{ ...S.card, display:"flex", alignItems:"center", gap:20, marginBottom:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:36, fontWeight:700, fontFamily:"'DM Mono',monospace", color:"#1a2744" }}>{avgRating}</div>
            <StarRating value={Math.round(avgRating)} readonly size={16} />
            <div style={{ ...S.muted, fontSize:12, marginTop:4 }}>{reviews.length} reseña{reviews.length!==1?"s":""}</div>
          </div>
          <div style={{ flex:1 }}>
            {[5,4,3,2,1].map(s=>{
              const count = reviews.filter(r=>r.rating===s).length;
              const pct = reviews.length ? (count/reviews.length*100) : 0;
              return (
                <div key={s} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:11, color:"#888", width:8 }}>{s}</span>
                  <span style={{ fontSize:12 }}>★</span>
                  <div style={{ flex:1, height:6, background:"#f0ede6", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:"#f59e0b", borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:11, color:"#888", width:16 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rating/review buttons */}
      {currentUser&&!showForm&&(
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          <button style={{ ...S.btn(myReview?"outline":"primary"), fontSize:13 }} onClick={()=>setShowForm(true)}>
            {myReview?"✏️ Editar reseña":"✍️ Escribir reseña"}
          </button>
          {!myReview&&<QuickRating watchId={watchId} currentUser={currentUser} onRated={load} />}
        </div>
      )}

      {/* Review form */}
      {showForm&&currentUser&&(
        <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:16 }}>
          <h3 style={{ ...S.h2, marginBottom:16 }}>{myReview?"Editar reseña":"Tu reseña"}</h3>
          {isOwner&&<div style={{ marginBottom:12 }}><Badge text="✓ Propietario verificado" bg="#fff8e8" color="#b8963e" /></div>}
          <div style={{ marginBottom:14 }}>
            <span style={S.label}>Puntuación</span>
            <StarRating value={form.rating} onChange={v=>setForm(f=>({...f,rating:v}))} size={28} />
          </div>
          <div style={{ marginBottom:12 }}><span style={S.label}>Título</span><input style={S.input} placeholder="Resume tu opinión en una frase" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} /></div>
          <div style={{ marginBottom:16 }}><span style={S.label}>Reseña</span><textarea rows={4} style={{ ...S.input, resize:"none" }} placeholder="Cuéntanos tu experiencia con este reloj..." value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} /></div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button style={S.btn("outline")} onClick={()=>setShowForm(false)}>Cancelar</button>
            <button style={S.btn("primary")} onClick={submitReview} disabled={saving||!form.rating||!form.title.trim()}>{saving?"Guardando…":"Publicar reseña"}</button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading?<Spinner />:reviews.length===0?<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin reseñas aún. ¡Sé el primero!</div>:reviews.map(r=>(
        <div key={r.id} style={S.card}>
          <div style={{ ...S.row, justifyContent:"space-between", marginBottom:10 }}>
            <div style={S.row}>
              <Avatar name={r.author?.name||"?"} size={36} color={r.author?.avatar_color||"#1a2744"} emoji={r.author?.avatar_emoji||null} />
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  {r.author?.name}
                  {r.is_owner&&<Badge text="Propietario" bg="#fff8e8" color="#b8963e" />}
                </div>
                <div style={S.muted}>@{r.author?.handle} · {timeAgo(r.created_at)}</div>
              </div>
            </div>
            <StarRating value={r.rating} readonly size={14} />
          </div>
          <div style={{ fontWeight:700, marginBottom:6 }}>{r.title}</div>
          <p style={{ fontSize:14, color:"#444", lineHeight:1.65, margin:0 }}>{r.content}</p>
        </div>
      ))}
    </div>
  );
}


// ─── Auto-generated forum threads (static rotating) ──────────────────────────
const AUTO_FORUM_THREADS = [
  { watch_slug:"rolex_submariner", flair:"debate", title:"¿Sigue valiendo lo que cuesta el Submariner en 2025?", content:"Con el mercado gris disparado y los precios oficiales subiendo cada año, ¿sigue siendo el Submariner una compra justificada o hay alternativas mejores?" },
  { watch_slug:"omega_speedmaster", flair:"curiosidad", title:"El Speedmaster y la NASA: historia completa", content:"¿Sabíais que la NASA sometió a más de 10 relojes a pruebas extremas antes de elegir el Speedmaster? ¿Qué detalles del proceso no son tan conocidos?" },
  { watch_slug:"patek_nautilus", flair:"debate", title:"Nautilus 5711: ¿burbuja o precio real?", content:"El Nautilus se vende por 3-4x el precio de lista en el mercado secundario. ¿Es una burbuja que va a estallar o el precio refleja su valor real?" },
  { watch_slug:"ap_royal_oak", flair:"valoracion", title:"Royal Oak Jumbo 15202: el dress watch que lo cambió todo", content:"En 1972 Gérald Genta diseñó el Royal Oak en una noche. 50 años después sigue siendo el referente del luxury sport watch. ¿Qué lo hace tan especial?" },
  { watch_slug:"tudor_black_bay", flair:"debate", title:"Tudor Black Bay vs Rolex Submariner: ¿cuál elegirías?", content:"Mismo ADN, precio muy diferente. El Black Bay ofrece movimiento in-house, garantía Rolex y estética similar. ¿Merece la pena el salto al Submariner?" },
  { watch_slug:"gs_snowflake", flair:"curiosidad", title:"Grand Seiko Snowflake: el reloj más infravalorado del mercado", content:"El SBGA211 tiene un acabado imposible de replicar, movimiento Spring Drive único en el mundo y una esfera que parece arte. ¿Por qué no tiene más fama?" },
  { watch_slug:"iwc_portugieser", flair:"valoracion", title:"Portugieser: el dress watch para los que no quieren dress watch", content:"Grande, legible, con reserva de marcha prominente. El Portugieser rompe todas las reglas del reloj de vestir clásico. ¿Es eso su mayor virtud o su mayor defecto?" },
  { watch_slug:"breitling_navitimer", flair:"curiosidad", title:"Navitimer: ¿alguien usa realmente la regla de cálculo?", content:"La regla de cálculo circular del Navitimer fue diseñada para pilotos. En 2025, ¿hay alguien que la use realmente o es solo decoración histórica?" },
];

function getTodayAutoThread() {
  const day = Math.floor(Date.now() / (1000*60*60*24));
  return AUTO_FORUM_THREADS[day % AUTO_FORUM_THREADS.length];
}
