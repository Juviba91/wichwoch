import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, BRAND_COLORS, BRAND_LOGOS, BRAND_LOGO_URLS, brandFromSlug, timeAgo } from "../data/constants";
import { Spinner, WatchCard, Badge } from "../components/UI";

export function BrandPage({ brandSlug, currentUser, onNavigate }) {
  const [brand, setBrand] = useState(null);
  const [watches, setWatches] = useState([]);
  const [news, setNews] = useState([]);
  const [tab, setTab] = useState("relojes");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({title:"",content:"",owners_only:false});
  const [posting, setPosting] = useState(false);

  useEffect(()=>{ load(); },[brandSlug]);

  async function load() {
    setLoading(true);
    try {
      const queries = [
        supabase.from("brand_pages").select("*").eq("slug",brandSlug).single(),
        supabase.from("watches").select("*").eq("brand_slug",brandSlug).order("model"),
        supabase.from("brand_news").select("*").eq("brand_slug",brandSlug).order("created_at",{ascending:false}),
      ];
      if(currentUser?.id) queries.push(supabase.from("profiles").select("account_type,handle").eq("id",currentUser.id).single());
      const results = await Promise.all(queries);
      setBrand(results[0].data); setWatches(results[1].data||[]); setNews(results[2].data||[]);
      if(currentUser?.id) setIsOwner(results[3].data?.account_type==="brand"&&results[3].data?.handle===brandSlug);
    } catch(e) { console.error("BrandPage error:", e); }
    setLoading(false);
  }

  async function postNews() {
    if(!newsForm.title.trim()||!newsForm.content.trim()) return; setPosting(true);
    await supabase.from("brand_news").insert({brand_slug:brandSlug,author_id:currentUser.id,title:newsForm.title.trim(),content:newsForm.content.trim(),owners_only:newsForm.owners_only});
    setNewsForm({title:"",content:"",owners_only:false}); setShowNewsForm(false); await load(); setPosting(false);
  }

  if(loading) return <Spinner />;
  if(!brand) return <div style={S.muted}>Marca no encontrada.</div>;
  const bg=BRAND_COLORS[brandSlug]||"#1a2744";

  return (
    <div>
      <div style={{ height:160, background:`linear-gradient(135deg, ${bg}, ${bg}99)`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", overflow:"hidden" }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:30, color:"#fff", fontWeight:700, marginBottom:4 }}>{brand.name}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.5)" }}>@{brand.slug}</div>
        </div>
        {BRAND_LOGO_URLS[brandSlug] ? (
          <img src={BRAND_LOGO_URLS[brandSlug]} alt={brand.name}
            style={{ height:100, objectFit:"contain", filter:"none" }}
            onError={e=>e.target.style.display="none"} />
        ) : (
          <div style={{ fontSize:48, opacity:0.4 }}>{BRAND_LOGOS[brandSlug]||"⌚"}</div>
        )}
      </div>
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none", marginBottom:20 }}>
        <p style={{ fontSize:14, color:"#555", lineHeight:1.65, margin:"0 0 12px" }}>{brand.description}</p>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <span style={S.muted}>📍 {brand.country}</span>
          <span style={S.muted}>🏛 Est. {brand.founded}</span>
          {brand.website&&<a href={brand.website} target="_blank" rel="noreferrer" style={{ ...S.muted, color:"#b8963e" }}>🌐 Web oficial</a>}
        </div>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        <button onClick={()=>setTab("relojes")} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab==="relojes"?"#1a2744":"#f0ede6", color:tab==="relojes"?"#fff":"#666", fontWeight:tab==="relojes"?600:400 }}>Relojes ({watches.length})</button>

      </div>
      {tab==="relojes"&&<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>{watches.map(w=><WatchCard key={w.id} watch={w} onClick={()=>onNavigate("watch",w.slug)} size="large" />)}</div>}
      {tab==="novedades"&&(
        <div>
          {isOwner&&(<div style={{ marginBottom:16 }}>{!showNewsForm?<button style={S.btn("primary")} onClick={()=>setShowNewsForm(true)}>+ Publicar novedad</button>:(<div style={{ ...S.card, border:"1px solid #1a2744" }}><div style={{ marginBottom:12 }}><span style={S.label}>Título</span><input style={S.input} value={newsForm.title} onChange={e=>setNewsForm(f=>({...f,title:e.target.value}))} /></div><div style={{ marginBottom:12 }}><span style={S.label}>Contenido</span><textarea rows={4} style={{ ...S.input, resize:"none" }} value={newsForm.content} onChange={e=>setNewsForm(f=>({...f,content:e.target.value}))} /></div><div style={{ ...S.row, justifyContent:"space-between" }}><label style={{ ...S.row, gap:8, fontSize:13, cursor:"pointer" }}><input type="checkbox" checked={newsForm.owners_only} onChange={e=>setNewsForm(f=>({...f,owners_only:e.target.checked}))} /> Solo propietarios</label><div style={S.row}><button style={S.btn("outline")} onClick={()=>setShowNewsForm(false)}>Cancelar</button><button style={S.btn("primary")} onClick={postNews} disabled={posting}>{posting?"Publicando…":"Publicar"}</button></div></div></div>)}</div>)}
          {news.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin novedades aún.</div>}
          {news.map(n=>(<div key={n.id} style={S.card}><div style={{ ...S.row, justifyContent:"space-between", marginBottom:8 }}><div style={{ fontWeight:700 }}>{n.title}</div><div style={{ display:"flex", gap:6 }}>{n.owners_only&&<Badge text="Propietarios" bg="#fff8e8" color="#b8960b" />}<span style={S.muted}>{timeAgo(n.created_at)}</span></div></div><p style={{ fontSize:14, color:"#444", lineHeight:1.6, margin:0 }}>{n.content}</p></div>))}
        </div>
      )}
    </div>
  );
}

// ─── WATCH PAGE ───────────────────────────────────────────────────────────────
