import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug, timeAgo } from "../data/constants";
import { Spinner, Badge, Avatar, StarRating } from "../components/UI";
import { UserBadges } from "../components/UserBadges";
import { WatchReviews, WatchRatingSummary } from "./WatchReviews";


// ─── ADD TO LIST MODAL ────────────────────────────────────────────────────────
function AddToListModal({ watchId, lists, onClose, currentUser, onNavigate }) {
  const [newListTitle, setNewListTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [added, setAdded] = useState(false);

  async function addToList(listId) {
    await supabase.from("watch_list_items").insert({list_id:listId, watch_id:watchId}).catch(()=>{});
    setAdded(true);
    setTimeout(onClose, 1000);
  }

  async function createAndAdd() {
    if(!newListTitle.trim()) return;
    setCreating(true);
    const {data}=await supabase.from("watch_lists").insert({
      user_id:currentUser.id, title:newListTitle.trim(), is_public:true
    }).select().single();
    if(data) await addToList(data.id);
    setCreating(false);
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:12, padding:24, width:"100%", maxWidth:400 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ fontFamily:"'DM Mono',monospace", fontSize:16, margin:0 }}>Añadir a lista</h3>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#aaa" }} onClick={onClose}>×</button>
        </div>
        {added&&<div style={{ textAlign:"center", padding:16, color:"#16a34a", fontWeight:700 }}>✓ Añadido a la lista</div>}
        {!added&&<>
          {lists.length>0&&(
            <div style={{ marginBottom:16 }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#999", fontFamily:"'DM Mono',monospace", marginBottom:8, display:"block" }}>Mis listas</span>
              {lists.map(l=>(
                <button key={l.id} style={{ width:"100%", padding:"10px 14px", background:"#f8f6f0", border:"1px solid #e8e8e8", borderRadius:8, cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontSize:13, marginBottom:6, fontWeight:600 }} onClick={()=>addToList(l.id)}>
                  📋 {l.title}
                </button>
              ))}
            </div>
          )}
          <div style={{ borderTop:"1px solid #f0ede6", paddingTop:16 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#999", fontFamily:"'DM Mono',monospace", marginBottom:8, display:"block" }}>Nueva lista</span>
            <div style={{ display:"flex", gap:8 }}>
              <input style={{ flex:1, border:"1px solid #e0ddd6", borderRadius:8, padding:"9px 12px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }} placeholder="Nombre de la lista..." value={newListTitle} onChange={e=>setNewListTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createAndAdd()} autoFocus={lists.length===0} />
              <button style={{ background:"#1a2744", border:"none", color:"#fff", borderRadius:8, padding:"9px 16px", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600, flexShrink:0 }} onClick={createAndAdd} disabled={creating||!newListTitle.trim()}>{creating?"…":"Crear"}</button>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

export function WatchPage({ slug, currentUser, onNavigate, onLoginRequired }) {
  const [watch, setWatch] = useState(null);
  const [threads, setThreads] = useState([]);
  const [news, setNews] = useState([]);
  const [tab, setTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [inCollection, setInCollection] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myBrandVote, setMyBrandVote] = useState(null);
  const [brandVotes, setBrandVotes] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [userLists, setUserLists] = useState([]);
  const [imgError, setImgError] = useState(false);
  const [lightbox, setLightbox] = useState(null);

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
      if(currentUser?.id) {
        setInCollection(!!results[2].data); setInWishlist(!!results[3].data);
        const {data:lists}=await supabase.from("watch_lists").select("id,title").eq("user_id",currentUser.id);
        setUserLists(lists||[]);
      }
      // Load brand votes
      if(w) {
        const brandSlug = w.slug.split("_")[0];
        const [{data:votes},{data:myVote}] = await Promise.all([
          supabase.from("brand_watch_votes").select("watch_id, count:watch_id.count()").eq("brand_slug",brandSlug),
          currentUser?.id ? supabase.from("brand_watch_votes").select("watch_id").eq("user_id",currentUser.id).eq("brand_slug",brandSlug).maybeSingle() : {data:null},
        ]);
        setBrandVotes(votes||[]);
        setMyBrandVote(myVote?.watch_id||null);
      }
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

  async function voteBestWatch() {
    if(!currentUser?.id||!watch) { onLoginRequired?.(); return; }
    const brandSlug = watch.slug.split("_")[0];
    if(myBrandVote===watch.id) {
      await supabase.from("brand_watch_votes").delete().match({user_id:currentUser.id,brand_slug:brandSlug});
      setMyBrandVote(null);
    } else {
      await supabase.from("brand_watch_votes").upsert({user_id:currentUser.id,watch_id:watch.id,brand_slug:brandSlug});
      setMyBrandVote(watch.id);
    }
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
          <img src={watch.image_url} alt={watch.model} style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 8px 24px rgba(0,0,0,0.4))", cursor:"zoom-in" }} onError={()=>setImgError(true)} onClick={()=>setLightbox(watch.image_url)} />
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:8, opacity:0.6 }}>⌚</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:1 }}>Ref. {watch.reference}</div>
          </div>
        )}
      </div>

      {lightbox&&(
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.95)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="" style={{ maxWidth:"95vw", maxHeight:"95vh", objectFit:"contain", borderRadius:8 }} />
          <button style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:"50%", width:40, height:40, fontSize:20, cursor:"pointer" }}>×</button>
        </div>
      )}

      {/* Info + botones */}
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <span style={{ ...S.mono, fontSize:13, color:"#888" }}>Ref. {watch.reference}{watch.year?` · ${watch.year}`:""}</span>
            {watch.market_price&&<div style={{ fontSize:13, color:"#b8963e", fontWeight:600, marginTop:4 }}>💰 {watch.market_price}</div>}
          <WatchRatingSummary watchId={watch?.id} />
          <button style={{ marginTop:8, background:"none", border:`1px solid ${myBrandVote===watch?.id?"#b8963e":"#e0ddd6"}`, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12, color:myBrandVote===watch?.id?"#b8963e":"#888", fontFamily:"'DM Sans',sans-serif", fontWeight:myBrandVote===watch?.id?600:400 }} onClick={voteBestWatch}>
            {myBrandVote===watch?.id?"⭐ Tu voto al mejor":"⭐ Votar mejor reloj de la marca"}
          </button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button style={{ ...S.btn(inCollection?"primary":"outline"), fontSize:12, padding:"6px 14px" }} onClick={toggleCollection} disabled={saving}>
              {inCollection?"✓ En tu Garage":"+ Añadir al Garage"}
            </button>
            <button style={{ ...S.btn(inWishlist?"gold":"outline"), fontSize:12, padding:"6px 14px" }} onClick={toggleWishlist} disabled={saving}>
              {inWishlist?"♥ En Wish List":"♡ Wish List"}
            </button>
            {currentUser&&<button style={{ ...S.btn("outline"), fontSize:12, padding:"6px 14px" }} onClick={()=>setShowListModal(true)}>
              📋 Añadir a lista
            </button>}
          </div>
          {showListModal&&currentUser&&<AddToListModal watchId={watch.id} lists={userLists} onClose={()=>setShowListModal(false)} currentUser={currentUser} onNavigate={onNavigate} />}
        </div>
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
        {[["info","Info"],["resenas","Reseñas"],["foros",`Foros (${threads.length})`]].map(([id,label])=>(
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
