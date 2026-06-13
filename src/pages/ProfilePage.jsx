import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, timeAgo, brandColor } from "../data/constants";
import { Spinner, Avatar, Badge, WatchCard } from "../components/UI";
import { UserBadges } from "../components/UserBadges";
import { PostCard, PostComposer } from "./FeedPage";
import { WorkshopDetail } from "./WorkshopsPage";

// ─── USER LIST ────────────────────────────────────────────────────────────────
function UserList({ title, users, onNavigate, onBack }) {
  return (
    <div>
      <button style={{ ...S.btn("outline"), marginBottom:20, fontSize:12 }} onClick={onBack}>← Volver</button>
      <h2 style={{ ...S.h1, marginBottom:20 }}>{title}</h2>
      {users.length===0&&<p style={S.muted}>Sin usuarios aún.</p>}
      {users.map(u=>(
        <div key={u.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}>
          <div style={S.row}>
            <Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a2744"} emoji={u.avatar_emoji||null} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600 }}>{u.name}</div>
              <div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div>
              {u.bio&&<p style={{ fontSize:13, color:"#666", margin:"4px 0 0" }}>{u.bio.slice(0,80)}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function UserListas({ userId, currentUser, onNavigate }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOwn = currentUser?.id === userId;

  useEffect(()=>{
    supabase.from("watch_lists")
      .select("*, items:watch_list_items(id,watch:watches(id,slug,image_url,brand_slug))")
      .eq("user_id",userId)
      .then(({data})=>{ setLists(data||[]); setLoading(false); });
  },[userId]);

  if(loading) return <Spinner />;

  return (
    <div>
      {isOwn&&<div style={{ marginBottom:16 }}><button style={S.btn("primary")} onClick={()=>onNavigate("listas")}>Gestionar mis listas →</button></div>}
      {lists.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin listas aún.</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
        {lists.map(l=>(
          <div key={l.id} style={{ ...S.card, cursor:"pointer", padding:0, overflow:"hidden", marginBottom:0 }} onClick={()=>onNavigate("listas")}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", height:70 }}>
              {[0,1,2].map(i=>{ const w=l.items?.[i]?.watch; const bg=w?brandColor(w.slug):"#f0ede6"; return <div key={i} style={{ background:`linear-gradient(135deg,${bg},${bg}88)`, display:"flex", alignItems:"center", justifyContent:"center" }}>{w?.image_url?<img src={w.image_url} alt="" style={{ height:"80%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:16, opacity:0.4 }}>⌚</span>}</div>; })}
            </div>
            <div style={{ padding:"10px 12px" }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{l.title}</div>
              <div style={{ fontSize:11, color:"#aaa" }}>{l.items?.length||0} relojes</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserListasPreview({ userId, onNavigate }) {
  const [lists, setLists] = useState([]);
  useEffect(()=>{
    supabase.from("watch_lists")
      .select("id,title,is_public,items:watch_list_items(id,watch:watches(slug,image_url,brand_slug))")
      .eq("user_id",userId).order("created_at",{ascending:false}).limit(6)
      .then(({data})=>setLists(data||[]));
  },[userId]);
  if(!lists.length) return <div style={{ ...S.card, textAlign:"center", color:"#888", padding:24 }}>Sin listas aún.</div>;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
      {lists.map(l=>(
        <div key={l.id} style={{ ...S.card, cursor:"pointer", padding:0, overflow:"hidden", marginBottom:0 }} onClick={()=>onNavigate("listas")}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", height:70 }}>
            {[0,1,2].map(i=>{ const w=l.items?.[i]?.watch; const bg=w?brandColor(w.slug):"#f0ede6"; return <div key={i} style={{ background:`linear-gradient(135deg,${bg},${bg}88)`, display:"flex", alignItems:"center", justifyContent:"center" }}>{w?.image_url?<img src={w.image_url} alt="" style={{ height:"80%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:16, opacity:0.4 }}>⌚</span>}</div>; })}
          </div>
          <div style={{ padding:"10px 12px" }}>
            <div style={{ fontWeight:700, fontSize:13 }}>{l.title}</div>
            <div style={{ fontSize:11, color:"#aaa" }}>{l.items?.length||0} relojes {!l.is_public&&"· 🔒"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TallerProfileRedirect({ profile, isOwn, currentUser, onNavigate }) {
  const [workshopId, setWorkshopId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    supabase.from("workshops").select("id").eq("owner_id", profile.id).maybeSingle()
      .then(({data})=>{ setWorkshopId(data?.id||null); setLoading(false); });
  },[profile.id]);

  if(loading) return <Spinner />;

  // If has workshop entry, show it via WorkshopsPage workshop detail
  const [workshop, setWorkshop] = useState(null);
  const [wsLoaded, setWsLoaded] = useState(false);

  useEffect(()=>{
    if(!workshopId) return;
    supabase.from("workshops").select("*").eq("id",workshopId).single()
      .then(({data})=>{ setWorkshop(data); setWsLoaded(true); });
  },[workshopId]);

  if(workshopId && !wsLoaded) return <Spinner />;
  if(workshopId && workshop) return <WorkshopDetail workshop={workshop} currentUser={currentUser} onBack={()=>onNavigate("talleres")} onNavigate={onNavigate} />;

  // No workshop entry yet - show basic taller profile with prompt to complete
  return (
    <div>
      <div style={{ height:160, background:"linear-gradient(135deg,#1a2744,#2a3a5a)", borderRadius:12, display:"flex", alignItems:"flex-end", padding:"0 28px 20px", marginBottom:0 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#b8963e", fontFamily:"'DM Mono',monospace", marginBottom:6 }}>🔧 Taller</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:24, fontWeight:700, color:"#fff" }}>{profile.name}</div>
          {profile.location&&<div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:4 }}>📍 {profile.location}</div>}
        </div>
      </div>
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0 }}>
        {profile.pending_approval
          ? <div style={{ padding:"12px 16px", background:"#fff8e8", borderRadius:6, fontSize:13, color:"#b8963e" }}>⏳ Tu perfil está pendiente de verificación por el equipo de Wich Woch.</div>
          : <div style={{ padding:"12px 16px", background:"#f0fdf4", borderRadius:6, fontSize:13, color:"#16a34a" }}>✓ Perfil verificado</div>
        }
        {profile.bio&&<p style={{ fontSize:14, color:"#555", margin:"12px 0 0", lineHeight:1.6 }}>{profile.bio}</p>}
      </div>
    </div>
  );
}

function TallerProfile({ profile, isOwn, currentUser, onNavigate, posts }) {
  const [following, setFollowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workshop, setWorkshop] = useState(null);
  const [tab, setTab] = useState("info");

  useEffect(()=>{
    if(!currentUser?.id||isOwn) return;
    supabase.from("follows").select("id").eq("follower_id",currentUser.id).eq("following_id",profile.id).maybeSingle()
      .then(({data})=>setFollowing(!!data));
    supabase.from("workshops").select("*").eq("owner_id",profile.id).maybeSingle()
      .then(({data})=>setWorkshop(data));
  },[profile.id, currentUser?.id]);

  useEffect(()=>{
    if(isOwn) {
      supabase.from("workshops").select("*").eq("owner_id",profile.id).maybeSingle()
        .then(({data})=>setWorkshop(data));
    }
  },[isOwn]);

  async function toggleFollow() {
    if(!currentUser?.id) return;
    setSaving(true);
    if(following) {
      await supabase.from("follows").delete().match({follower_id:currentUser.id,following_id:profile.id});
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({follower_id:currentUser.id,following_id:profile.id});
      setFollowing(true);
    }
    setSaving(false);
  }

  const SPEC = { vintage:"⏳ Vintage", sport:"🏃 Sport", certificado:"✓ Certificado", restauracion:"🔨 Restauración", complicaciones:"⚙️ Complicaciones", diver:"🤿 Buceo", chrono:"⏱️ Cronógrafo", dress:"👔 Dress" };

  return (
    <div>
      {/* Hero */}
      <div style={{ height:200, background:"linear-gradient(135deg,#1a2744,#2a3a5a)", borderRadius:12, marginBottom:0, position:"relative", overflow:"hidden" }}>
        {workshop?.photo_url&&<img src={workshop.photo_url} alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.35 }} />}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,rgba(0,0,0,0.8))", padding:"32px 28px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#b8963e", fontFamily:"'DM Mono',monospace" }}>🔧 Taller</span>
            {profile.verified_business&&<span style={{ fontSize:10, background:"#b8963e", color:"#fff", borderRadius:4, padding:"2px 8px", fontWeight:700 }}>✓ Verificado</span>}
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:26, fontWeight:700, color:"#fff" }}>{profile.name}</div>
          {profile.location&&<div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:4 }}>📍 {profile.location}</div>}
        </div>
      </div>

      {/* Stats + actions */}
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none", marginBottom:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ display:"flex", gap:24 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:20 }}>{profile.followers_count||0}</div><div style={S.muted}>seguidores</div></div>
            {workshop?.specialties?.length>0&&<div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:20 }}>{workshop.specialties.length}</div><div style={S.muted}>especialidades</div></div>}
            {workshop?.brands?.length>0&&<div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:20 }}>{workshop.brands.length}</div><div style={S.muted}>marcas</div></div>}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {!isOwn&&currentUser&&<button style={S.btn(following?"outline":"primary")} onClick={toggleFollow} disabled={saving}>{following?"Siguiendo":"Seguir"}</button>}
            {!isOwn&&currentUser&&<button style={{ ...S.btn("gold") }} onClick={()=>onNavigate("talleres")}>📅 Pedir cita</button>}
            {isOwn&&<button style={S.btn("outline")} onClick={()=>onNavigate("settings")}>⚙️ Editar perfil</button>}
          </div>
        </div>
        {profile.bio&&<p style={{ fontSize:14, color:"#555", margin:"0 0 8px", lineHeight:1.6 }}>{profile.bio}</p>}
        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
          {profile.corporate_url&&<a href={profile.corporate_url.startsWith("http")?profile.corporate_url:`https://${profile.corporate_url}`} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#1a2744" }}>🌐 Web</a>}
          {workshop?.phone&&<span style={{ fontSize:13, color:"#555" }}>📞 {workshop.phone}</span>}
        </div>
        {profile.pending_approval&&isOwn&&<div style={{ marginTop:12, padding:"8px 14px", background:"#fff8e8", borderRadius:6, fontSize:12, color:"#b8963e" }}>⏳ Pendiente de verificación.</div>}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, margin:"16px 0" }}>
        {[["info","Info"],["especialidades","Especialidades"],["posts","Publicaciones"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"6px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab===id?"#1a2744":"#f0ede6", color:tab===id?"#fff":"#666", fontWeight:tab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {tab==="info"&&(
        <div style={S.card}>
          {workshop?.address&&<div style={{ marginBottom:10 }}><span style={S.label}>Dirección</span><div style={{ fontSize:14 }}>📍 {workshop.address}</div></div>}
          {workshop?.brands?.length>0&&<div>
            <span style={S.label}>Marcas con las que trabajamos</span>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
              {workshop.brands.map(b=><span key={b} style={{ padding:"4px 12px", background:"#1a2744", color:"#fff", borderRadius:20, fontSize:11, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>{b}</span>)}
            </div>
          </div>}
          {!workshop&&<p style={S.muted}>Sin información adicional aún.</p>}
        </div>
      )}

      {tab==="especialidades"&&(
        <div style={S.card}>
          {workshop?.specialties?.length>0
            ? <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {workshop.specialties.map(s=>(
                  <div key={s} style={{ background:"#f8f6f0", borderRadius:8, padding:"12px 16px", fontWeight:600, fontSize:14 }}>{SPEC[s]||s}</div>
                ))}
              </div>
            : <p style={S.muted}>Sin especialidades registradas.</p>
          }
        </div>
      )}

      {tab==="posts"&&(
        <div>
          {posts.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin publicaciones aún.</div>}
          {posts.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onNavigate={onNavigate} />)}
        </div>
      )}
    </div>
  );
}

function MarcaProfile({ profile, isOwn, currentUser, onNavigate, posts }) {
  const [watches, setWatches] = useState([]);
  const [following, setFollowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const brandSlug = profile.brand_slug_linked || profile.handle;

  useEffect(()=>{
    supabase.from("watches").select("id,slug,model,image_url,brand_slug,market_price").eq("brand_slug",brandSlug).eq("status","approved").limit(12)
      .then(({data})=>setWatches(data||[]));
    if(!currentUser?.id||isOwn) return;
    supabase.from("follows").select("id").eq("follower_id",currentUser.id).eq("following_id",profile.id).maybeSingle()
      .then(({data})=>setFollowing(!!data));
  },[profile.id, currentUser?.id]);

  async function toggleFollow() {
    if(!currentUser?.id) return;
    setSaving(true);
    if(following) {
      await supabase.from("follows").delete().match({follower_id:currentUser.id,following_id:profile.id});
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({follower_id:currentUser.id,following_id:profile.id});
      setFollowing(true);
    }
    setSaving(false);
  }

  const BRAND_COLORS = { rolex:"#006039", omega:"#c8a84b", patek:"#1a3a6b", ap:"#1a1a1a", iwc:"#8b0000", jlc:"#2c4a2e", tudor:"#6b0000", cartier:"#8b0000", breitling:"#1a3a6b", tag:"#c00000", vc:"#2c2c5e", hublot:"#2a2a2a", panerai:"#1a3020", gs:"#1a1a3a", zenith:"#1a2744" };
  const bg = BRAND_COLORS[brandSlug]||"#1a2744";

  return (
    <div>
      {/* Hero */}
      <div style={{ height:180, background:`linear-gradient(135deg,${bg},${bg}88)`, borderRadius:12, marginBottom:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", overflow:"hidden" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,0.6)", fontFamily:"'DM Mono',monospace" }}>🏷️ Marca oficial</span>
            {profile.verified_business&&<span style={{ fontSize:10, background:"#b8963e", color:"#fff", borderRadius:4, padding:"2px 6px", fontWeight:700 }}>✓ Verificada</span>}
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:28, fontWeight:700, color:"#fff", marginBottom:4 }}>{profile.name}</div>
          {profile.location&&<div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>📍 {profile.location}</div>}
        </div>
      </div>

      {/* Info */}
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:24 }}>
            <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:18 }}>{profile.followers_count||0}</div><div style={S.muted}>seguidores</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:18 }}>{watches.length}</div><div style={S.muted}>relojes</div></div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {!isOwn&&currentUser&&<button style={S.btn(following?"outline":"primary")} onClick={toggleFollow} disabled={saving}>{following?"Siguiendo":"Seguir"}</button>}
            {isOwn&&<button style={S.btn("outline")} onClick={()=>onNavigate("settings")}>⚙️ Editar perfil</button>}
            {isOwn&&<button style={S.btn("primary")} onClick={()=>onNavigate("create-watch")}>+ Añadir reloj</button>}
          </div>
        </div>
        {profile.bio&&<p style={{ fontSize:14, color:"#555", margin:"12px 0 0", lineHeight:1.6 }}>{profile.bio}</p>}
        {profile.corporate_url&&<a href={profile.corporate_url.startsWith("http")?profile.corporate_url:`https://${profile.corporate_url}`} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#1a2744", display:"block", marginTop:8 }}>🌐 {profile.corporate_url}</a>}
        {profile.pending_approval&&isOwn&&<div style={{ marginTop:12, padding:"8px 14px", background:"#fff8e8", borderRadius:6, fontSize:12, color:"#b8963e" }}>⏳ Tu cuenta está pendiente de verificación.</div>}
      </div>

      {/* Catálogo */}
      {watches.length>0&&(
        <div style={{ marginBottom:24 }}>
          <h3 style={{ ...S.h2, marginBottom:12 }}>Catálogo</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {watches.map(w=>(
              <div key={w.id} style={{ borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", background:"#fff", cursor:"pointer" }} onClick={()=>onNavigate("watch",w.slug)}>
                <div style={{ height:110, background:`linear-gradient(135deg,${bg},${bg}88)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {w.image_url?<img src={w.image_url} alt="" style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:28 }}>⌚</span>}
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{w.model}</div>
                  {w.market_price&&<div style={{ fontSize:11, color:"#b8963e", marginTop:2 }}>{w.market_price}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      <h3 style={{ ...S.h2, marginBottom:12 }}>Publicaciones</h3>
      {posts.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin publicaciones aún.</div>}
      {posts.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onNavigate={onNavigate} />)}
    </div>
  );
}

export function ProfilePage({ userId, currentUser, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [watches, setWatches] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [tab, setTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [showAddWish, setShowAddWish] = useState(false);
  const [watchSearch, setWatchSearch] = useState("");
  const [watchSuggestions, setWatchSuggestions] = useState([]);
  const [subPage, setSubPage] = useState(null);
  const isOwn = userId===currentUser?.id;

  useEffect(()=>{ load(); },[userId]);

  async function load() {
    setLoading(true);
    const [{data:p},{data:po},{data:w},{data:wl},{data:f},{data:fList},{data:flList}]=await Promise.all([
      supabase.from("profiles").select("*").eq("id",userId).single(),
      supabase.from("posts").select("*, author:profiles(id,name,handle,account_type,avatar_color,avatar_emoji,location), watch:watches(id,slug,model)").eq("author_id",userId).order("created_at",{ascending:false}).limit(20),
      supabase.from("watch_registrations").select("*, watch:watches(id,slug,model,reference,image_url)").eq("user_id",userId).eq("is_public",true),
      supabase.from("watch_wishlist").select("*, watch:watches(id,slug,model,reference,image_url)").eq("user_id",userId),
      supabase.from("follows").select("id").eq("follower_id",currentUser.id).eq("following_id",userId).maybeSingle(),
      supabase.from("follows").select("follower:profiles!follows_follower_id_fkey(id,name,handle,bio,account_type,verified,followers_count,avatar_color,avatar_emoji,location)").eq("following_id",userId),
      supabase.from("follows").select("following:profiles!follows_following_id_fkey(id,name,handle,bio,account_type,verified,followers_count,avatar_color,avatar_emoji,location)").eq("follower_id",userId),
    ]);
    setProfile(p); setPosts(po||[]); setWatches(w||[]); setWishlist(wl||[]);
    setIsFollowing(!!f);
    setFollowers((fList||[]).map(x=>x.follower).filter(Boolean));
    setFollowingList((flList||[]).map(x=>x.following).filter(Boolean));
    setLoading(false);
  }

  async function toggleFollow() {
    setFollowLoading(true);
    if(isFollowing){
      await supabase.from("follows").delete().match({follower_id:currentUser.id,following_id:userId});
      setIsFollowing(false); setProfile(p=>({...p,followers_count:Math.max(0,(p.followers_count||1)-1)}));
    } else {
      await supabase.from("follows").insert({follower_id:currentUser.id,following_id:userId});
      await supabase.from("notifications").insert({recipient_id:userId,sender_id:currentUser.id,type:"follow",content:"ha empezado a seguirte"}).catch(()=>{});
      setIsFollowing(true); setProfile(p=>({...p,followers_count:(p.followers_count||0)+1}));
    }
    setFollowLoading(false);
  }

  async function searchWatches(q) {
    if(!q||q.length<2){setWatchSuggestions([]);return;}
    const {data}=await supabase.from("watches").select("id,slug,model").or(`slug.ilike.%${q}%,model.ilike.%${q}%`).limit(6);
    setWatchSuggestions(data||[]);
  }

  async function addWatch(watch, toWishlist=false) {
    const table=toWishlist?"watch_wishlist":"watch_registrations";
    const {data:ex}=await supabase.from(table).select("id").eq("user_id",currentUser.id).eq("watch_id",watch.id).maybeSingle();
    if(!ex) await supabase.from(table).insert({user_id:currentUser.id,watch_id:watch.id,is_public:true});
    setWatchSearch(""); setWatchSuggestions([]); setShowAddWatch(false); setShowAddWish(false); await load();
  }

  async function removeWish(watchId) {
    await supabase.from("watch_wishlist").delete().match({user_id:currentUser.id,watch_id:watchId});
    await load();
  }

  if(loading) return <Spinner />;
  if(!profile) return <div style={S.muted}>Perfil no encontrado.</div>;

  if(profile.account_type==="taller") return <TallerProfileRedirect profile={profile} isOwn={isOwn} currentUser={currentUser} onNavigate={onNavigate} />;
  if(profile.account_type==="marca") return <MarcaProfile profile={profile} isOwn={isOwn} currentUser={currentUser} onNavigate={onNavigate} posts={posts} />;
  if(subPage==="followers") return <UserList title="Seguidores" users={followers} onNavigate={onNavigate} onBack={()=>setSubPage(null)} />;
  if(subPage==="following") return <UserList title="Siguiendo" users={followingList} onNavigate={onNavigate} onBack={()=>setSubPage(null)} />;

  const avatarColor=profile.avatar_color||"#1a2744";
  const avatarEmoji=profile.avatar_emoji||null;

  function WatchSearchBox({ toWishlist }) {
    return (
      <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:16 }}>
        <span style={S.label}>Busca el reloj</span>
        <input style={S.input} placeholder="Submariner, @rolex_daytona..." value={watchSearch} onChange={e=>{setWatchSearch(e.target.value);searchWatches(e.target.value);}} autoFocus />
        {watchSuggestions.length>0&&(
          <div style={{ border:"1px solid #e8e8e8", borderRadius:6, marginTop:4 }}>
            {watchSuggestions.map(w=>(<div key={w.id} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f5f5f5", display:"flex", justifyContent:"space-between" }} onMouseDown={()=>addWatch(w,toWishlist)}><div><span style={{ fontWeight:600 }}>{w.model}</span><span style={{ ...S.mono, color:"#aaa", fontSize:11, marginLeft:8 }}>@{w.slug}</span></div><span style={{ fontSize:12, color:"#2a7a4a" }}>+ Añadir</span></div>))}
          </div>
        )}
        <button style={{ ...S.btn("outline"), marginTop:10, fontSize:12 }} onClick={()=>{setShowAddWatch(false);setShowAddWish(false);setWatchSearch("");setWatchSuggestions([]);}}>Cancelar</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        <div style={{ height:100, background:`linear-gradient(135deg, ${avatarColor}dd, ${avatarColor}55)` }} />
        <div style={{ padding:"0 24px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:-40, marginBottom:16 }}>
            <div style={{ width:80, height:80, borderRadius:"50%", border:"4px solid #fff", background:avatarColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:avatarEmoji?36:26, fontWeight:700, color:"#fff", fontFamily:"'DM Mono',monospace" }}>
              {avatarEmoji||(profile.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={S.row}>
              {!isOwn&&<button style={S.btn(isFollowing?"outline":"primary")} onClick={toggleFollow} disabled={followLoading}>{followLoading?"…":isFollowing?"✓ Siguiendo":"Seguir"}</button>}
              {isOwn&&<div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("garage")}>⌚ Garage</button>
            <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("settings")}>⚙️ Ajustes</button>
          </div>}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:20, fontWeight:700 }}>{profile.name}</span>
              {profile.verified&&<Badge text="✓" bg="#2563eb" color="#fff" />}
              {profile.account_type==="taller"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
              {profile.account_type==="marca"&&<Badge text="Marca" bg="#f0f6ff" color="#2563eb" />}
            </div>
            <div style={{ ...S.mono, fontSize:13, color:"#888", marginBottom:4 }}>@{profile.handle}</div>
            {profile.location&&<div style={{ fontSize:13, color:"#666", marginBottom:6 }}>📍 {profile.location}</div>}
            {profile.bio&&<p style={{ fontSize:14, color:"#444", lineHeight:1.6, margin:"0 0 4px" }}>{profile.bio}</p>}
            {profile.website&&<a href={profile.website} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#b8963e" }}>{profile.website.replace(/https?:\/\//,"")}</a>}
          </div>
          <div style={{ display:"flex", gap:24, paddingTop:12, borderTop:"1px solid #f0ede6", flexWrap:"wrap" }}>
            <div style={{ textAlign:"center", cursor:"pointer" }} onClick={()=>setSubPage("followers")}><div style={{ fontWeight:700, fontSize:18 }}>{profile.followers_count||0}</div><div style={{ ...S.muted, fontSize:12, textDecoration:"underline" }}>seguidores</div></div>
            <div style={{ textAlign:"center", cursor:"pointer" }} onClick={()=>setSubPage("following")}><div style={{ fontWeight:700, fontSize:18 }}>{profile.following_count||0}</div><div style={{ ...S.muted, fontSize:12, textDecoration:"underline" }}>siguiendo</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:18 }}>{watches.length}</div><div style={{ ...S.muted, fontSize:12 }}>relojes</div></div>
            <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:18 }}>{posts.length}</div><div style={{ ...S.muted, fontSize:12 }}>posts</div></div>
            {(profile.flow||0)>=0&&<div style={{ textAlign:"center", cursor:"pointer" }} onClick={()=>window.alert("⚡ El Flow es tu nivel de aportación a la comunidad Wich Woch. Sube cuando otros votan positivo tus respuestas en foros. Cuanto más útiles e interesantes sean tus aportaciones, más Flow acumulas.")}><div style={{ fontWeight:700, fontSize:18, color:"#b8963e" }}>⚡{profile.flow||0}</div><div style={{ ...S.muted, fontSize:12, textDecoration:"underline" }}>flow</div></div>}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
        {[["posts","Posts"],["listas","Listas"],["siguiendo","Siguiendo"],["seguidores","Seguidores"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab===id?"#1a2744":"#f0ede6", color:tab===id?"#fff":"#666", fontWeight:tab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {tab==="posts"&&<div>{isOwn&&<PostComposer user={currentUser} onPosted={load} />}{posts.length===0&&<p style={S.muted}>Sin publicaciones aún.</p>}{posts.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onNavigate={onNavigate} onReload={load} />)}</div>}

      {tab==="garage"&&(
        <div>
          {profileWatches.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Garage privado o vacío.</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {profileWatches.map(w=>w.watch&&(
              <div key={w.id} style={{ borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", background:"#fff", cursor:"pointer" }} onClick={()=>onNavigate("watch",w.watch.slug)}>
                <div style={{ height:120, background:`linear-gradient(135deg,${brandColor(w.watch.slug)},${brandColor(w.watch.slug)}88)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {w.watch.image_url?<img src={w.watch.image_url} alt="" style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:28 }}>⌚</span>}
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{w.watch.model}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#aaa" }}>{brandFromSlug(w.watch.slug)}</div>
                  {w.condition&&<div style={{ fontSize:10, color:"#888", marginTop:2, textTransform:"capitalize" }}>{w.condition.replace("_"," ")}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="wishlist"&&(
        <div>
          {profileWishlist.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Wish List vacía.</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {profileWishlist.map((w,i)=>w.watch&&(
              <div key={i} style={{ borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", background:"#fff", cursor:"pointer" }} onClick={()=>onNavigate("watch",w.watch.slug)}>
                <div style={{ height:120, background:`linear-gradient(135deg,${brandColor(w.watch.slug)},${brandColor(w.watch.slug)}88)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  {w.watch.image_url?<img src={w.watch.image_url} alt="" style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:28 }}>⌚</span>}
                  <div style={{ position:"absolute", top:6, left:6, background:"rgba(184,150,62,0.9)", borderRadius:4, padding:"2px 6px", fontSize:9, color:"#fff", fontWeight:700 }}>❤️</div>
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{w.watch.model}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#aaa" }}>{brandFromSlug(w.watch.slug)}</div>
                  {w.watch.market_price&&<div style={{ fontSize:10, color:"#b8963e", marginTop:2 }}>{w.watch.market_price}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="resenas"&&(
        <div>
          {profileReviews.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin reseñas escritas aún.</div>}
          {profileReviews.map((r,i)=>r.watch&&(
            <div key={i} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("watch",r.watch.slug)}>
              <div style={{ display:"flex", gap:12, marginBottom:8 }}>
                <div style={{ width:44, height:44, borderRadius:8, background:`linear-gradient(135deg,${brandColor(r.watch.slug)},${brandColor(r.watch.slug)}88)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {r.watch.image_url?<img src={r.watch.image_url} alt="" style={{ height:"80%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />:<span>⌚</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{r.watch.model}</div>
                  <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:14, color:s<=r.rating?"#f59e0b":"#e2e8f0" }}>★</span>)}</div>
                </div>
              </div>
              {r.title&&<div style={{ fontWeight:600, marginBottom:4 }}>{r.title}</div>}
              {r.content&&<p style={{ fontSize:13, color:"#555", margin:0, lineHeight:1.5 }}>{r.content}</p>}
            </div>
          ))}
        </div>
      )}
      {tab==="listas"&&(
        <div>
          <div style={{ marginBottom:16 }}>
            <button style={S.btn("primary")} onClick={()=>onNavigate("listas")}>
              {isOwn?"Gestionar mis listas →":"Ver listas →"}
            </button>
          </div>
          <UserListasPreview userId={userId} onNavigate={onNavigate} />
        </div>
      )}
      {tab==="siguiendo"&&(<div>{followingList.length===0&&<p style={S.muted}>Aún no sigue a nadie.</p>}{followingList.map(u=>(<div key={u.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}><div style={S.row}><Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a2744"} emoji={u.avatar_emoji||null} /><div><div style={{ fontWeight:600 }}>{u.name}</div><div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div></div></div></div>))}</div>)}
      {tab==="seguidores"&&(<div>{followers.length===0&&<p style={S.muted}>Sin seguidores aún.</p>}{followers.map(u=>(<div key={u.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}><div style={S.row}><Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a2744"} emoji={u.avatar_emoji||null} /><div><div style={{ fontWeight:600 }}>{u.name}</div><div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div></div></div></div>))}</div>)}
    </div>
  );
}
