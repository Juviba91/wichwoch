import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug, timeAgo } from "../data/constants";
import { Spinner, Badge, Avatar, StarRating } from "../components/UI";
import { UserBadges } from "../components/UserBadges";
import { WatchReviews } from "./WatchReviews";

export function WatchPage({ slug, currentUser, onNavigate, onLoginRequired }) {
  const [watch, setWatch] = useState(null);
  const [threads, setThreads] = useState([]);
  const [news, setNews] = useState([]);
  const [tab, setTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [inCollection, setInCollection] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(()=>{ load(); },[slug]);

  async function load() {
    setLoading(true);
    const {data:w}=await supabase.from("watches").select("*").eq("slug",slug).single();
    setWatch(w);
    if(w) {
      const queries = [
        supabase.from("forum_threads").select("*, author:profiles(id,name,handle)").eq("watch_id",w.id).order("votes",{ascending:false}).limit(10),
        supabase.from("brand_news").select("*").eq("brand_slug",w.brand_slug||"").order("created_at",{ascending:false}).limit(10),
      ];
      if(currentUser?.id) {
        queries.push(supabase.from("watch_registrations").select("id").eq("user_id",currentUser.id).eq("watch_id",w.id).maybeSingle());
        queries.push(supabase.from("watch_wishlist").select("id").eq("user_id",currentUser.id).eq("watch_id",w.id).maybeSingle());
      }
      const results = await Promise.all(queries);
      setThreads(results[0].data||[]); setNews(results[1].data||[]);
      if(currentUser?.id) { setInCollection(!!results[2].data); setInWishlist(!!results[3].data); }
    }
    setLoading(false);
  }

  async function toggleCollection() {
    if(!currentUser) { onLoginRequired?.(); return; }
    if(!watch) return; setSaving(true);
    if(inCollection) {
      await supabase.from("watch_registrations").delete().match({user_id:currentUser.id,watch_id:watch.id});
      setInCollection(false);
    } else {
      await supabase.from("watch_registrations").insert({user_id:currentUser.id,watch_id:watch.id,is_public:true});
      setInCollection(true);
    }
    setSaving(false);
  }

  async function toggleWishlist() {
    if(!currentUser) { onLoginRequired?.(); return; }
    if(!watch) return; setSaving(true);
    if(inWishlist) {
      await supabase.from("watch_wishlist").delete().match({user_id:currentUser.id,watch_id:watch.id});
      setInWishlist(false);
    } else {
      await supabase.from("watch_wishlist").insert({user_id:currentUser.id,watch_id:watch.id,is_public:true});
      setInWishlist(true);
    }
    setSaving(false);
  }

  if(loading) return <Spinner />;
  if(!watch) return <div style={S.muted}>Reloj no encontrado.</div>;
  const bg=brandColor(watch.slug);
  const specs=watch.specs||{};

  return (
    <div>
      {/* Hero con imagen */}
      <div style={{ height:200, background:`linear-gradient(135deg, ${bg}, ${bg}88)`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", marginBottom:0, overflow:"hidden" }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:3, textTransform:"uppercase", cursor:"pointer", marginBottom:8 }} onClick={()=>onNavigate("brand",watch.brand_slug)}>@{watch.brand_slug} →</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:28, color:"#fff", fontWeight:700, marginBottom:4 }}>{watch.model}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.5)" }}>@{watch.slug}</div>
        </div>
        {watch.image_url&&!imgError ? (
          <img src={watch.image_url} alt={watch.model} style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }} onError={()=>setImgError(true)} crossOrigin="anonymous" />
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:8, opacity:0.6 }}>⌚</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:1 }}>Ref. {watch.reference}</div>
          </div>
        )}
      </div>

      {/* Info + botones */}
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <span style={{ ...S.mono, fontSize:13, color:"#888" }}>Ref. {watch.reference}{watch.year?` · ${watch.year}`:""}</span>
            {watch.market_price&&<div style={{ fontSize:13, color:"#b8963e", fontWeight:600, marginTop:4 }}>💰 {watch.market_price}</div>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ ...S.btn(inCollection?"primary":"outline"), fontSize:12, padding:"6px 14px" }} onClick={toggleCollection} disabled={saving}>
              {inCollection?"✓ En mi colección":"+ Colección"}
            </button>
            <button style={{ ...S.btn(inWishlist?"gold":"outline"), fontSize:12, padding:"6px 14px" }} onClick={toggleWishlist} disabled={saving}>
              {inWishlist?"♥ En Wish List":"♡ Wish List"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
        {[["info","Info"],["resenas","Reseñas"],["foros",`Foros (${threads.length})`],["novedades",`Novedades (${news.length})`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab===id?"#1a2744":"#f0ede6", color:tab===id?"#fff":"#666", fontWeight:tab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {tab==="info"&&(
        <div style={S.card}>
          {Object.keys(specs).length>0?(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {Object.entries(specs).map(([k,v])=>(<div key={k} style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px" }}><div style={S.label}>{k.replace(/_/g," ")}</div><div style={{ fontSize:14, fontWeight:600 }}>{v}</div></div>))}
            </div>
          ):<p style={S.muted}>Sin especificaciones.</p>}
        </div>
      )}

      {tab==="resenas"&&<WatchReviews watchId={watch.id} currentUser={currentUser} />}

      {tab==="foros"&&(
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}><button style={S.btn("primary")} onClick={()=>onNavigate("foros")}>+ Crear foro</button></div>
          {threads.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin foros aún.</div>}
          {threads.map(t=>(<div key={t.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("thread",t.id)}><div style={{ display:"flex", gap:14 }}><div style={{ minWidth:36, textAlign:"center" }}><div style={{ fontWeight:700, fontSize:15, fontFamily:"'DM Mono',monospace", color:t.votes>0?"#2a7a4a":t.votes<0?"#d44":"#888" }}>{t.votes}</div><div style={{ fontSize:10, color:"#aaa" }}>pts</div></div><div style={{ flex:1 }}><div style={{ fontWeight:700, marginBottom:4 }}>{t.title}</div><div style={{ display:"flex", gap:16 }}><span style={S.muted}>@{t.author?.handle}</span><span style={S.muted}>💬 {t.replies_count||0}</span><span style={S.muted}>{timeAgo(t.created_at)}</span></div></div></div></div>))}
        </div>
      )}

      {tab==="novedades"&&(
        <div>
          {news.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin novedades de {brandFromSlug(watch.slug)} aún.</div>}
          {news.map(n=>(<div key={n.id} style={S.card}><div style={{ ...S.row, justifyContent:"space-between", marginBottom:8 }}><div style={{ fontWeight:700 }}>{n.title}</div><span style={S.muted}>{timeAgo(n.created_at)}</span></div><p style={{ fontSize:14, color:"#444", lineHeight:1.6, margin:0 }}>{n.content}</p></div>))}
        </div>
      )}
    </div>
  );
}
