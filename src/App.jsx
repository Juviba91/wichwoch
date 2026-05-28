import { useState, useEffect } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { supabase } from "./lib/supabase";
import { S } from "./data/constants";
import { Logo, Avatar } from "./components/UI";
import { AdminPage, isAdmin } from "./admin/AdminPage";

// Pages
import { FeedPage } from "./pages/FeedPage";
import { GaragePage } from "./pages/GaragePage";
import { WristCheckPage } from "./pages/WristCheckPage";
import { MantenimientoPage } from "./pages/MantenimientoPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { CreateWatchPage } from "./pages/CreateWatchPage";
import { ExplorePage } from "./pages/ExplorePage";
import { RelojesPage } from "./pages/RelojesPage";
import { ForosPage } from "./pages/ForosPage";
import { WatchPage } from "./pages/WatchPage";
import { BrandPage } from "./pages/BrandPage";
import { ThreadPage } from "./pages/ThreadPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuthPage } from "./pages/AuthPage";
import { NotificationsPanel } from "./pages/NotificationsPanel";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState({name:"feed"});
  const [authChecked, setAuthChecked] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [guestMode, setGuestMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setSession(session);
      if(session){ loadProfile(session.user.id); loadUnread(session.user.id); }
      setAuthChecked(true);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{
      setSession(session);
      if(session){ loadProfile(session.user.id); loadUnread(session.user.id); }
      else setProfile(null);
    });
    return ()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(uid) {
    const {data}=await supabase.from("profiles").select("*").eq("id",uid).single();
    setProfile(data);
  }

  async function loadUnread(uid) {
    try {
      const {count}=await supabase.from("notifications").select("*",{count:"exact",head:true}).eq("recipient_id",uid).eq("read",false);
      setUnreadCount(count||0);
    } catch(e) { setUnreadCount(0); }
  }

  const navigate=(name,id=null)=>{ setPage({name,id}); setShowNotifs(false); setShowUserMenu(false); };
  async function signOut() {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setGuestMode(false); setPage({name:"explore"});
  }

  if(!authChecked) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", background:"#1a2744" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Logo height={60} />
    </div>
  );

  if(!session && !guestMode) return <AuthPage onExplore={()=>{ setGuestMode(true); setPage({name:"explore"}); }} />;
  if(session && profile && !profile.onboarding_complete) return <OnboardingPage user={session.user} onComplete={()=>{ loadProfile(session.user.id); setPage({name:"feed"}); }} />;

  const currentUser = session ? session.user : null;
  const NAV = session
    ? [{id:"feed",label:"Feed"},{id:"explore",label:"Explorar"},{id:"relojes",label:"Relojes"},{id:"foros",label:"Foros"}]
    : [{id:"explore",label:"Explorar"},{id:"relojes",label:"Relojes"},{id:"foros",label:"Foros"}];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <SpeedInsights />
      <nav style={S.nav}>
        <div style={{ cursor:"pointer" }} onClick={()=>navigate(session?"feed":"explore")}><Logo height={38} /></div>
        <div style={{ display:"flex", gap:4 }}>
          {NAV.map(n=><button key={n.id} style={S.navLink(page.name===n.id)} onClick={()=>navigate(n.id)}>{n.label}</button>)}
          {isAdmin(session?.user)&&<button style={{ ...S.navLink(page.name==="admin"), background:page.name==="admin"?"#b8963e":"rgba(255,255,255,0.1)", color:"#fff" }} onClick={()=>navigate("admin")}>⚙️ Admin</button>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, position:"relative" }}>
          {session ? (<>
            <div style={{ position:"relative", cursor:"pointer" }} onClick={()=>{ setShowNotifs(!showNotifs); if(!showNotifs) setUnreadCount(0); }}>
              <span style={{ fontSize:18 }}>🔔</span>
              {unreadCount>0&&<span style={{ position:"absolute", top:-4, right:-4, background:"#e11d48", color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700 }}>{unreadCount}</span>}
            </div>
            {showNotifs&&<NotificationsPanel userId={session.user.id} onClose={()=>setShowNotifs(false)} onNavigate={navigate} />}
            {/* User avatar dropdown */}
            <div style={{ position:"relative" }}>
              <div style={{ cursor:"pointer" }} onClick={()=>setShowUserMenu(!showUserMenu)}>
                <Avatar name={profile?.name||session.user.email} size={34} color={profile?.avatar_color||"#1a2744"} />
              </div>
              {showUserMenu&&(
                <div style={{ position:"absolute", right:0, top:44, width:200, background:"#fff", border:"1px solid #e8e8e8", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:200, overflow:"hidden" }}>
                  {[
                    {icon:"👤", label:"Mi Perfil", action:()=>{ navigate("profile",session.user.id); setShowUserMenu(false); }},
                    {icon:"⌚", label:"Garage", action:()=>{ navigate("garage"); setShowUserMenu(false); }},
                    {icon:"🔧", label:"Mantenimiento", action:()=>{ navigate("mantenimiento"); setShowUserMenu(false); }},
                  ].map(item=>(
                    <button key={item.label} onClick={item.action} style={{ width:"100%", padding:"11px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, textAlign:"left", display:"flex", alignItems:"center", gap:10, color:"#1a1a1a" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8f6f0"}
                      onMouseLeave={e=>e.currentTarget.style.background="none"}>
                      <span>{item.icon}</span>{item.label}
                    </button>
                  ))}
                  <div style={{ borderTop:"1px solid #f0ede6" }} />
                  {[
                    {icon:"⚙️", label:"Ajustes", action:()=>{ navigate("settings"); setShowUserMenu(false); }},
                    {icon:"🚪", label:"Salir", action:()=>{ signOut(); setShowUserMenu(false); }, color:"#dc2626"},
                  ].map(item=>(
                    <button key={item.label} onClick={item.action} style={{ width:"100%", padding:"11px 16px", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, textAlign:"left", display:"flex", alignItems:"center", gap:10, color:item.color||"#1a1a1a" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8f6f0"}
                      onMouseLeave={e=>e.currentTarget.style.background="none"}>
                      <span>{item.icon}</span>{item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isAdmin(session?.user)&&<button style={{ ...S.navLink(page.name==="admin"), background:page.name==="admin"?"#b8963e":"rgba(255,255,255,0.1)", color:"#fff", fontSize:12 }} onClick={()=>navigate("admin")}>Admin</button>}
          </>) : (
            <button style={{ background:"#b8963e", border:"none", cursor:"pointer", color:"#fff", padding:"7px 16px", borderRadius:6, fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} onClick={()=>setGuestMode(false)}>Entrar</button>
          )}
        </div>
      </nav>
      <main style={S.main}>
        {page.name==="feed"&&session&&<FeedPage user={session.user} onNavigate={navigate} />}
        {page.name==="feed"&&!session&&<ExplorePage onNavigate={navigate} currentUser={null} />}
        {page.name==="explore"&&<ExplorePage onNavigate={navigate} currentUser={currentUser} />}
        {page.name==="relojes"&&<RelojesPage onNavigate={navigate} currentUser={currentUser} />}
        {page.name==="foros"&&<ForosPage currentUser={currentUser} onNavigate={navigate} onLoginRequired={()=>setGuestMode(false)} />}
        {page.name==="watch"&&<WatchPage slug={page.id} currentUser={currentUser} onNavigate={navigate} onLoginRequired={()=>setGuestMode(false)} />}
        {page.name==="brand"&&<BrandPage brandSlug={page.id} currentUser={currentUser} onNavigate={navigate} />}
        {page.name==="thread"&&<ThreadPage threadId={page.id} currentUser={currentUser} onNavigate={navigate} onLoginRequired={()=>setGuestMode(false)} />}
        {page.name==="profile"&&<ProfilePage userId={page.id} currentUser={currentUser||{id:""}} onNavigate={navigate} />}
        {page.name==="settings"&&session&&<SettingsPage user={session.user} onSaved={()=>{ loadProfile(session.user.id); navigate("profile",session.user.id); }} />}
        {page.name==="garage"&&session&&<GaragePage currentUser={session.user} onNavigate={navigate} />}
        {page.name==="mantenimiento"&&session&&<MantenimientoPage currentUser={session.user} onNavigate={navigate} />}
        {page.name==="wristcheck"&&<WristCheckPage currentUser={currentUser} onNavigate={navigate} />}
        {page.name==="create-watch"&&session&&<CreateWatchPage currentUser={session.user} onNavigate={navigate} />}
        {page.name==="admin"&&<AdminPage user={session?.user} onNavigate={navigate} />}
      </main>
    </div>
  );
}
