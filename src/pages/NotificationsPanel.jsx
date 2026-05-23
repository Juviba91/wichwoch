import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, timeAgo } from "../data/constants";

function NotificationsPanel({ userId, onClose, onNavigate }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    supabase.from("notifications").select("*, sender:profiles(name,handle,avatar_color,avatar_emoji)").eq("recipient_id",userId).order("created_at",{ascending:false}).limit(20)
      .then(({data})=>{ setNotifs(data||[]); setLoading(false); });
    supabase.from("notifications").update({read:true}).eq("recipient_id",userId).eq("read",false);
  },[userId]);

  const icons={follow:"👤",like:"♥",comment:"💬",reply:"💬",news:"📢"};

  return (
    <div style={{ position:"absolute", right:0, top:48, width:340, background:"#fff", border:"1px solid #e8e8e8", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:200 }}>
      <div style={{ padding:"14px 16px", borderBottom:"1px solid #f0f0f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:700, fontFamily:"'DM Mono',monospace", fontSize:13 }}>Notificaciones</span>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:16 }} onClick={onClose}>×</button>
      </div>
      {loading&&<div style={{ padding:20, textAlign:"center", color:"#888" }}>Cargando…</div>}
      {!loading&&notifs.length===0&&<div style={{ padding:24, textAlign:"center", color:"#888", fontSize:13 }}>Sin notificaciones aún</div>}
      {notifs.map(n=>(
        <div key={n.id} style={{ padding:"12px 16px", borderBottom:"1px solid #f8f8f8", background:n.read?"#fff":"#f8faff" }}>
          <div style={{ ...S.row, marginBottom:4 }}>
            <span style={{ fontSize:16 }}>{icons[n.type]||"🔔"}</span>
            <div style={{ flex:1 }}><span style={{ fontWeight:600, fontSize:13 }}>{n.sender?.name||"Wich Woch"}</span><span style={{ fontSize:13, color:"#555", marginLeft:6 }}>{n.content}</span></div>
          </div>
          <div style={{ ...S.muted, fontSize:11, paddingLeft:28 }}>{timeAgo(n.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function WichWoch() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState({name:"feed"});
  const [authChecked, setAuthChecked] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); if(session){ loadProfile(session.user.id); loadUnread(session.user.id); } setAuthChecked(true); });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{ setSession(session); if(session){ loadProfile(session.user.id); loadUnread(session.user.id); } else setProfile(null); });
    return ()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(uid) { const {data}=await supabase.from("profiles").select("*").eq("id",uid).single(); setProfile(data); }
  async function loadUnread(uid) {
    try {
      const {count}=await supabase.from("notifications").select("*",{count:"exact",head:true}).eq("recipient_id",uid).eq("read",false);
      setUnreadCount(count||0);
    } catch(e) { setUnreadCount(0); }
  }

  const navigate=(name,id=null)=>{ setPage({name,id}); setShowNotifs(false); };
  async function signOut() { await supabase.auth.signOut(); setSession(null); setProfile(null); setPage({name:"explore"}); }

  if(!authChecked) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", background:"#1a2744" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Logo height={60} />
    </div>
  );

  if(!session && !guestMode) return <AuthPage onExplore={()=>{ setGuestMode(true); setPage({name:"explore"}); }} />;

  const NAV = session
    ? [{id:"feed",label:"Feed"},{id:"explore",label:"Explorar"},{id:"relojes",label:"Relojes"},{id:"foros",label:"Foros"}]
    : [{id:"explore",label:"Explorar"},{id:"relojes",label:"Relojes"},{id:"foros",label:"Foros"}];

  const currentUser = session ? session.user : null;

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <nav style={S.nav}>
        <div style={{ cursor:"pointer" }} onClick={()=>navigate(session?"feed":"explore")}><Logo height={38} /></div>
        <div style={{ display:"flex", gap:4 }}>{NAV.map(n=><button key={n.id} style={S.navLink(page.name===n.id)} onClick={()=>navigate(n.id)}>{n.label}</button>)}</div>
        <div style={{ ...S.row, position:"relative" }}>
          {session ? (<>
            <div style={{ position:"relative", cursor:"pointer" }} onClick={()=>{ setShowNotifs(!showNotifs); if(!showNotifs) setUnreadCount(0); }}>
              <span style={{ fontSize:18 }}>🔔</span>
              {unreadCount>0&&<span style={{ position:"absolute", top:-4, right:-4, background:"#e11d48", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700 }}>{unreadCount}</span>}
            </div>
            {showNotifs&&<NotificationsPanel userId={session.user.id} onClose={()=>setShowNotifs(false)} onNavigate={navigate} />}
            <div style={{ cursor:"pointer" }} onClick={()=>navigate("profile",session.user.id)}>
              <Avatar name={profile?.name||session.user.email} size={34} color={profile?.avatar_color||"#1a2744"} emoji={profile?.avatar_emoji||null} />
            </div>
            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, padding:"0 2px" }} onClick={()=>navigate("settings")}>⚙️</button>
            <button style={{ background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", color:"#fff", padding:"5px 12px", borderRadius:6, fontSize:12, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} onClick={signOut}>Salir</button>
          </>) : (
            <button style={{ background:"#b8963e", border:"none", cursor:"pointer", color:"#fff", padding:"7px 16px", borderRadius:6, fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} onClick={()=>setGuestMode(false)}>Entrar / Registrarse</button>
          )}
        </div>
      </nav>
      <main style={S.main}>
        {page.name==="feed"&&session&&<FeedPage user={session.user} onNavigate={navigate} />}
        {page.name==="feed"&&!session&&<ExplorePage onNavigate={navigate} currentUser={null} />}
        {page.name==="explore"&&<ExplorePage onNavigate={navigate} currentUser={currentUser} />}
        {page.name==="relojes"&&<RelojesPage onNavigate={navigate} />}
        {page.name==="foros"&&<ForosPage currentUser={currentUser} onNavigate={navigate} onLoginRequired={()=>setGuestMode(false)} />}
        {page.name==="watch"&&<WatchPage slug={page.id} currentUser={currentUser} onNavigate={navigate} onLoginRequired={()=>setGuestMode(false)} />}
        {page.name==="brand"&&<BrandPage brandSlug={page.id} currentUser={currentUser} onNavigate={navigate} />}
        {page.name==="thread"&&<ThreadPage threadId={page.id} currentUser={currentUser} onNavigate={navigate} onLoginRequired={()=>setGuestMode(false)} />}
        {page.name==="profile"&&<ProfilePage userId={page.id} currentUser={currentUser||{id:""}} onNavigate={navigate} />}
        {page.name==="settings"&&session&&<SettingsPage user={session.user} onSaved={()=>{ loadProfile(session.user.id); navigate("profile",session.user.id); }} />}
      </main>
    </div>
  );
}
