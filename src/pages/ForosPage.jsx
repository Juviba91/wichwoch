import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { S, FLAIRS, BRAND_COLORS, timeAgo, getCurrentWeeklyThread, getTodayAutoThread, flairStyle } from "../data/constants";
import { Spinner, Avatar, FlairBadge } from "../components/UI";
import { UserBadges } from "../components/UserBadges";

// ─── FOROS PAGE ───────────────────────────────────────────────────────────────


// ─── STAR RATING ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size=20, readonly=false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i=>(
        <span key={i}
          style={{ fontSize:size, cursor:readonly?"default":"pointer", color:i<=(hover||value)?"#f59e0b":"#e2e8f0", lineHeight:1 }}
          onClick={()=>!readonly&&onChange&&onChange(i)}
          onMouseEnter={()=>!readonly&&setHover(i)}
          onMouseLeave={()=>!readonly&&setHover(0)}>★</span>
      ))}
    </div>
  );
}

// ─── WATCH REVIEWS ────────────────────────────────────────────────────────────
function WatchReviews({ watchId, currentUser }) {
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
      .select("*, author:profiles(id,name,handle,avatar_color,avatar_emoji)")
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

  const avgRating = reviews.length ? (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1) : null;

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

      {/* Add review button */}
      {currentUser&&!showForm&&(
        <button style={{ ...S.btn(myReview?"outline":"primary"), marginBottom:16, fontSize:13 }} onClick={()=>setShowForm(true)}>
          {myReview?"✏️ Editar mi reseña":"+ Escribir reseña"}
        </button>
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



// ─── USER BADGES ──────────────────────────────────────────────────────────────


export function DebateDelDia({ currentUser, onNavigate, onLoginRequired }) {
  const auto = getTodayAutoThread();

  async function handleClick() {
    if(!currentUser) { onLoginRequired?.(); return; }
    // Check if thread already exists
    const {data:existing}=await supabase.from("forum_threads")
      .select("id").eq("title",auto.title).maybeSingle();
    if(existing) {
      onNavigate("thread", existing.id);
      return;
    }
    // Create thread with watch
    const {data:watch}=await supabase.from("watches").select("id").eq("slug",auto.watch_slug).maybeSingle();
    if(!watch) { onNavigate("foros"); return; }
    const {data:newThread}=await supabase.from("forum_threads").insert({
      watch_id: watch.id,
      author_id: currentUser.id,
      title: auto.title,
      content: auto.content,
      flair: auto.flair,
      is_news: false
    }).select().single();
    if(newThread) onNavigate("thread", newThread.id);
  }

  return (
    <div style={{ ...S.card, marginBottom:16, borderLeft:"4px solid #b8963e", cursor:"pointer" }} onClick={handleClick}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#b8963e", fontFamily:"'DM Mono',monospace", marginBottom:6 }}>🤖 Debate del día</div>
      <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{auto.title}</div>
      <p style={{ fontSize:13, color:"#666", margin:"0 0 8px", lineHeight:1.4 }}>{auto.content.slice(0,100)}…</p>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <FlairBadge flair={auto.flair} />
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#aaa" }}>@{auto.watch_slug}</span>
        <span style={{ marginLeft:"auto", fontSize:12, color:"#b8963e", fontWeight:600 }}>Unirse al debate →</span>
      </div>
    </div>
  );
}

export function ForosPage({ currentUser, onNavigate, onLoginRequired }) {
  const [topicSearch, setTopicSearch] = useState("");
  const [allThreads, setAllThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("hot"); // hot | nuevo | top | marca
  const [filterBrand, setFilterBrand] = useState("");
  const [filterFlair, setFilterFlair] = useState("");
  const [newForm, setNewForm] = useState({watchQuery:"",watchId:null,watchSlug:"",title:"",content:"",flair:"debate"});
  const [watchSuggestions, setWatchSuggestions] = useState([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [savedThreads, setSavedThreads] = useState([]);
  const searchTimer = useRef(null);

  useEffect(()=>{ loadAll(); },[filter,filterBrand,filterFlair]);
  useEffect(()=>{ if(currentUser?.id) loadSaved(); },[currentUser]);

  useEffect(()=>{
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(()=>applySearch(), 250);
    return ()=>clearTimeout(searchTimer.current);
  },[topicSearch, allThreads]);

  async function loadSaved() {
    const {data}=await supabase.from("saved_threads").select("thread_id").eq("user_id",currentUser.id);
    setSavedThreads((data||[]).map(s=>s.thread_id));
  }

  async function toggleSave(threadId, e) {
    e.stopPropagation();
    if(!currentUser) { onLoginRequired?.(); return; }
    if(savedThreads.includes(threadId)) {
      await supabase.from("saved_threads").delete().match({user_id:currentUser.id,thread_id:threadId});
      setSavedThreads(s=>s.filter(id=>id!==threadId));
    } else {
      await supabase.from("saved_threads").insert({user_id:currentUser.id,thread_id:threadId});
      setSavedThreads(s=>[...s,threadId]);
    }
  }

  async function loadAll() {
    setLoading(true);
    let q = supabase.from("forum_threads")
      .select("id, title, content, votes, replies_count, created_at, watch_id, author_id, flair, author:profiles(id,name,handle,avatar_color,avatar_emoji,flow), watch:watches(id,slug,model,brand_slug)");
    if(filter==="top") q = q.order("votes",{ascending:false});
    else q = q.order("created_at",{ascending:false});
    if(filterFlair) q = q.eq("flair",filterFlair);
    const {data} = await q.limit(60);
    let threads = data||[];
    if(filterBrand) threads = threads.filter(t=>t.watch?.brand_slug===filterBrand);
    // Hot algorithm: votes + recency boost
    if(filter==="hot") {
      const now = Date.now();
      threads = threads.sort((a,b)=>{
        const ageA = (now - new Date(a.created_at)) / (1000*60*60);
        const ageB = (now - new Date(b.created_at)) / (1000*60*60);
        const scoreA = (a.votes+1) / Math.pow(ageA+2, 1.5);
        const scoreB = (b.votes+1) / Math.pow(ageB+2, 1.5);
        return scoreB - scoreA;
      });
    }
    setAllThreads(threads); setLoading(false);
  }

  function applySearch() {
    if(!topicSearch.trim()) { setFilteredThreads(allThreads); return; }
    const q = topicSearch.toLowerCase();
    setFilteredThreads(allThreads.filter(t=>
      t.title.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      t.watch?.model?.toLowerCase().includes(q) ||
      t.watch?.slug?.toLowerCase().includes(q)
    ));
  }

  const displayed = topicSearch.trim() ? filteredThreads : allThreads;
  const BRANDS = ["rolex","omega","patek","ap","iwc","jlc","tudor","cartier","breitling","tag","vc","hublot","panerai","gs","zenith"];

  async function searchW(q, forNew=false) {
    if(!q||q.length<2){forNew?setWatchSuggestions([]):setWatchSuggestions2([]);return;}
    const {data}=await supabase.from("watches").select("id,slug,model").or(`slug.ilike.%${q.replace(/^@/,"")}%,model.ilike.%${q.replace(/^@/,"")}%`).limit(6);
    forNew?setWatchSuggestions(data||[]):setWatchSuggestions2(data||[]);
  }

  async function submitThread() {
    setPostError(null);
    if(!newForm.watchId){setPostError("Selecciona un reloj.");return;}
    if(!newForm.title.trim()){setPostError("Escribe un título.");return;}
    if(!newForm.content.trim()){setPostError("Escribe el contenido.");return;}
    setPosting(true);
    const {error}=await supabase.from("forum_threads").insert({watch_id:newForm.watchId,author_id:currentUser.id,title:newForm.title.trim(),content:newForm.content.trim(),flair:newForm.flair,is_news:false});
    if(error){setPostError(error.message);setPosting(false);return;}
    setNewForm({watchQuery:"",watchId:null,watchSlug:"",title:"",content:"",flair:"debate"}); setShowNew(false); await loadAll(); setPosting(false);
  }

  return (
    <div>
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20 }}>
        <div><h2 style={{ ...S.h1, marginBottom:4 }}>Foros</h2><p style={S.muted}>Debates sobre relojes concretos</p></div>
        <button style={S.btn("primary")} onClick={()=>currentUser?setShowNew(!showNew):onLoginRequired?.()}>+ Nuevo foro</button>
      </div>



      {/* Auto-generated thread of the day */}
      <DebateDelDia currentUser={currentUser} onNavigate={onNavigate} onLoginRequired={onLoginRequired} />

      {/* Buscador */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <input style={{ ...S.input, paddingLeft:40, fontSize:15 }} placeholder="Busca por tema, reloj, marca…" value={topicSearch} onChange={e=>setTopicSearch(e.target.value)} />
        <span style={{ position:"absolute", left:12, top:11, color:"#888" }}>🔍</span>
        {topicSearch&&<button style={{ position:"absolute", right:12, top:10, background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:16 }} onClick={()=>setTopicSearch("")}>×</button>}
      </div>

      {/* Filtros de ordenación */}
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        {[["hot","🔥 Hot"],["nuevo","🕐 Nuevo"],["top","⬆️ Top"]].map(([v,label])=>(
          <button key={v} onClick={()=>{ setFilter(v); setFilterBrand(""); }} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, background:filter===v&&!filterBrand?"#1a2744":"#f0ede6", color:filter===v&&!filterBrand?"#fff":"#666", fontWeight:filter===v&&!filterBrand?600:400 }}>{label}</button>
        ))}
        <div style={{ width:1, background:"#ddd", margin:"0 4px" }} />
        {BRANDS.slice(0,8).map(b=>(
          <button key={b} onClick={()=>{ setFilterBrand(filterBrand===b?"":b); }} style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"'DM Mono',monospace", fontSize:10, background:filterBrand===b?"#1a2744":"#f0ede6", color:filterBrand===b?"#fff":"#888", letterSpacing:0.5, textTransform:"uppercase" }}>{b}</button>
        ))}
      </div>

      {/* Filtros de flair */}
      <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
        <button onClick={()=>setFilterFlair("")} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, background:!filterFlair?"#1a2744":"#f0ede6", color:!filterFlair?"#fff":"#666" }}>Todos</button>
        {FLAIRS.map(f=>(
          <button key={f.id} onClick={()=>setFilterFlair(filterFlair===f.id?"":f.id)} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:11, background:filterFlair===f.id?f.color:f.bg, color:filterFlair===f.id?"#fff":f.color, fontWeight:600 }}>{f.label}</button>
        ))}
      </div>
      {showNew&&(
        <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:24 }}>
          <h3 style={{ ...S.h2, marginBottom:16 }}>Nuevo foro</h3>
          {postError&&<div style={S.error}>{postError}</div>}
          <div style={{ marginBottom:12, position:"relative" }}>
            <span style={S.label}>Reloj</span>
            <input style={S.input} placeholder="@rolex_submariner o nombre…" value={newForm.watchQuery} onChange={e=>{setNewForm(f=>({...f,watchQuery:e.target.value,watchId:null,watchSlug:""}));searchW(e.target.value,true);}} />
            {newForm.watchId&&<div style={{ marginTop:5, fontSize:12, color:"#2a7a4a", fontFamily:"'DM Mono',monospace" }}>✓ @{newForm.watchSlug}</div>}
            {watchSuggestions.length>0&&!newForm.watchId&&(<div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e8e8e8", borderRadius:8, boxShadow:"0 4px 12px rgba(0,0,0,0.08)", zIndex:50, marginTop:2 }}>{watchSuggestions.map(w=>(<div key={w.id} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f5f5f5" }} onMouseDown={()=>{setNewForm(f=>({...f,watchQuery:`@${w.slug}`,watchId:w.id,watchSlug:w.slug}));setWatchSuggestions([]);}}><span style={{ fontWeight:600 }}>{w.model}</span><span style={{ ...S.mono, color:"#b8963e", fontSize:11, marginLeft:8 }}>@{w.slug}</span></div>))}</div>)}
          </div>
          <div style={{ marginBottom:12 }}><span style={S.label}>Flair</span>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {FLAIRS.map(f=>(
                <button key={f.id} type="button" onClick={()=>setNewForm(fm=>({...fm,flair:f.id}))} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontFamily:"'DM Sans',sans-serif", background:newForm.flair===f.id?f.color:f.bg, color:newForm.flair===f.id?"#fff":f.color, fontWeight:600 }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}><span style={S.label}>Título</span><input style={S.input} value={newForm.title} onChange={e=>setNewForm(f=>({...f,title:e.target.value}))} /></div>
          <div style={{ marginBottom:16 }}><span style={S.label}>Contenido</span><textarea rows={4} style={{ ...S.input, resize:"none" }} value={newForm.content} onChange={e=>setNewForm(f=>({...f,content:e.target.value}))} /></div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button style={S.btn("outline")} onClick={()=>{setShowNew(false);setPostError(null);}}>Cancelar</button>
            <button style={S.btn("primary")} onClick={submitThread} disabled={posting}>{posting?"Publicando…":"Crear foro"}</button>
          </div>
        </div>
      )}
      {/* Resultados */}
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:12 }}>
        <h3 style={{ ...S.h2, marginBottom:0 }}>{topicSearch?`"${topicSearch}"`:filter==="hot"?"🔥 Hot":filter==="top"?"⬆️ Top":"🕐 Nuevo"}{filterBrand&&` · ${filterBrand}`}{filterFlair&&` · ${FLAIRS.find(f=>f.id===filterFlair)?.label}`}</h3>
        <span style={S.muted}>{displayed.length} hilos</span>
      </div>
      {loading?<Spinner />:displayed.map(t=>(
        <div key={t.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("thread",t.id)}>
          <div style={{ display:"flex", gap:14 }}>
            <div style={{ minWidth:40, textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:16, fontFamily:"'DM Mono',monospace", color:t.votes>0?"#2a7a4a":t.votes<0?"#d44":"#888" }}>{t.votes}</div>
              <div style={{ fontSize:10, color:"#aaa" }}>pts</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <FlairBadge flair={t.flair} />
                <span style={{ ...S.mono, fontSize:11, color:"#b8963e" }}>@{t.watch?.slug}</span>
              </div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{t.title}</div>
              <p style={{ fontSize:13, color:"#666", margin:"0 0 8px", lineHeight:1.4 }}>{t.content.slice(0,120)}{t.content.length>120?"…":""}</p>
              <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                <span style={S.muted}>@{t.author?.handle}</span>
                {t.author?.flow>0&&<span style={{ ...S.mono, fontSize:11, color:"#b8963e" }}>⚡{t.author.flow}</span>}
                <span style={S.muted}>💬 {t.replies_count||0}</span>
                <span style={S.muted}>{timeAgo(t.created_at)}</span>
                <button style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", fontSize:16, color:savedThreads.includes(t.id)?"#b8963e":"#ddd" }} onClick={(e)=>toggleSave(t.id,e)}>{savedThreads.includes(t.id)?"🔖":"🔖"}</button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {!loading&&displayed.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>{topicSearch?"Sin resultados.":"Sin foros aún. ¡Crea el primero!"}</div>}
    </div>
  );
}
