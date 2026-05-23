import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, timeAgo } from "../data/constants";
import { Spinner, Avatar, Badge, WatchCard } from "../components/UI";
import { UserBadges } from "../components/UserBadges";
import { PostCard } from "./FeedPage";

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
function ProfilePage({ userId, currentUser, onNavigate }) {
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
              {isOwn&&<button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("settings")}>⚙️ Ajustes</button>}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:20, fontWeight:700 }}>{profile.name}</span>
              {profile.verified&&<Badge text="✓" bg="#2563eb" color="#fff" />}
              {profile.account_type==="repairer"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
              {profile.account_type==="brand"&&<Badge text="Marca" bg="#f0f6ff" color="#2563eb" />}
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
            {(profile.karma||0)>0&&<div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:18, color:"#b8963e" }}>⚡{profile.karma||0}</div><div style={{ ...S.muted, fontSize:12 }}>karma</div></div>}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
        {[["posts","Posts"],["coleccion","Colección"],["wishlist","Wish List"],["siguiendo","Siguiendo"],["seguidores","Seguidores"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab===id?"#1a2744":"#f0ede6", color:tab===id?"#fff":"#666", fontWeight:tab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {tab==="posts"&&(<div>{posts.length===0&&<p style={S.muted}>Sin publicaciones aún.</p>}{posts.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onNavigate={onNavigate} />)}</div>)}
      {tab==="coleccion"&&(<div>{isOwn&&<div style={{ marginBottom:16 }}>{!showAddWatch?<button style={S.btn("outline")} onClick={()=>setShowAddWatch(true)}>+ Añadir reloj</button>:<WatchSearchBox toWishlist={false} />}</div>}{watches.length===0&&<p style={S.muted}>Colección vacía.</p>}<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12 }}>{watches.map(w=>w.watch&&<WatchCard key={w.id} watch={w.watch} onClick={()=>onNavigate("watch",w.watch.slug)} />)}</div></div>)}
      {tab==="wishlist"&&(<div>{isOwn&&<div style={{ marginBottom:16 }}>{!showAddWish?<button style={S.btn("outline")} onClick={()=>setShowAddWish(true)}>+ Añadir a Wish List</button>:<WatchSearchBox toWishlist={true} />}</div>}{wishlist.length===0&&<p style={S.muted}>Wish List vacía.</p>}<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12 }}>{wishlist.map(w=>w.watch&&(<div key={w.id} style={{ position:"relative" }}><WatchCard watch={w.watch} onClick={()=>onNavigate("watch",w.watch.slug)} />{isOwn&&<button style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:"50%", width:22, height:22, cursor:"pointer", fontSize:12 }} onClick={e=>{e.stopPropagation();removeWish(w.watch.id);}}>×</button>}</div>))}</div></div>)}
      {tab==="siguiendo"&&(<div>{followingList.length===0&&<p style={S.muted}>Aún no sigue a nadie.</p>}{followingList.map(u=>(<div key={u.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}><div style={S.row}><Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a2744"} emoji={u.avatar_emoji||null} /><div><div style={{ fontWeight:600 }}>{u.name}</div><div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div></div></div></div>))}</div>)}
      {tab==="seguidores"&&(<div>{followers.length===0&&<p style={S.muted}>Sin seguidores aún.</p>}{followers.map(u=>(<div key={u.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}><div style={S.row}><Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a2744"} emoji={u.avatar_emoji||null} /><div><div style={{ fontWeight:600 }}>{u.name}</div><div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div></div></div></div>))}</div>)}
    </div>
  );
}
