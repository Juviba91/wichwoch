import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S } from "../data/constants";
import { Spinner } from "../components/UI";

const ADMIN_EMAILS = ["jdevill@hotmail.com"]; // ← pon tu email aquí

export function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

export function AdminPage({ user, onNavigate }) {
  const [tab, setTab] = useState("metricas");
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ loadAll(); },[tab]);

  async function loadAll() {
    setLoading(true);
    if(tab==="metricas") await loadMetrics();
    if(tab==="usuarios") await loadUsers();
    if(tab==="contenido") await loadContent();
    if(tab==="relojes") await loadPendingWatches();
    setLoading(false);
  }

  async function loadMetrics() {
    try {
      const [u, p, t, w, ru, tp] = await Promise.all([
        supabase.from("profiles").select("*",{count:"exact",head:true}),
        supabase.from("posts").select("*",{count:"exact",head:true}),
        supabase.from("forum_threads").select("*",{count:"exact",head:true}),
        supabase.from("watches").select("*",{count:"exact",head:true}),
        supabase.from("profiles").select("id,name,handle,created_at,account_type").order("created_at",{ascending:false}).limit(5),
        supabase.from("posts").select("id,content,likes_count,comments_count,created_at,author:profiles(name,handle)").order("likes_count",{ascending:false}).limit(5),
      ]);
      let totalReviews = 0;
      try {
        const rv = await supabase.from("watch_reviews").select("*",{count:"exact",head:true});
        totalReviews = rv.count||0;
      } catch(e) {}
      setMetrics({
        totalUsers: u.count||0,
        totalPosts: p.count||0,
        totalThreads: t.count||0,
        totalWatches: w.count||0,
        totalReviews,
        recentUsers: ru.data||[],
        topPosts: tp.data||[]
      });
    } catch(e) {
      console.error("Metrics error:", e);
      setMetrics({ totalUsers:0, totalPosts:0, totalThreads:0, totalWatches:0, totalReviews:0, recentUsers:[], topPosts:[] });
    }
  }

  async function loadUsers() {
    const {data}=await supabase.from("profiles").select("*").order("created_at",{ascending:false}).limit(50);
    setUsers(data||[]);
  }

  const [pendingWatches, setPendingWatches] = useState([]);

  async function loadPendingWatches() {
    const {data}=await supabase.from("watches").select("*, creator:profiles(name,handle)").eq("status","pending").order("created_at",{ascending:false});
    setPendingWatches(data||[]);
  }

  async function approveWatch(id) {
    await supabase.from("watches").update({status:"approved"}).eq("id",id);
    await loadPendingWatches();
  }

  async function rejectWatch(id) {
    if(!window.confirm("¿Rechazar este reloj?")) return;
    await supabase.from("watches").update({status:"rejected"}).eq("id",id);
    await loadPendingWatches();
  }

  async function loadContent() {
    const [{data:p},{data:t}]=await Promise.all([
      supabase.from("posts").select("*, author:profiles(name,handle)").order("created_at",{ascending:false}).limit(30),
      supabase.from("forum_threads").select("*, author:profiles(name,handle), watch:watches(slug,model)").order("created_at",{ascending:false}).limit(30),
    ]);
    setPosts(p||[]); setThreads(t||[]);
  }

  async function deletePost(id) {
    if(!window.confirm("¿Borrar este post?")) return;
    await supabase.from("posts").delete().eq("id",id);
    await loadContent();
  }

  async function deleteThread(id) {
    if(!window.confirm("¿Borrar este foro?")) return;
    await supabase.from("forum_threads").delete().eq("id",id);
    await loadContent();
  }

  async function suspendUser(id) {
    if(!window.confirm("¿Suspender este usuario?")) return;
    await supabase.from("profiles").update({suspended:true}).eq("id",id);
    await loadUsers();
  }

  if(!isAdmin(user)) return (
    <div style={{ ...S.card, textAlign:"center", padding:40 }}>
      <p style={S.muted}>No tienes acceso a esta sección.</p>
      <button style={S.btn("outline")} onClick={()=>onNavigate("feed")}>← Volver</button>
    </div>
  );

  const TABS = [["metricas","📊 Métricas"],["usuarios","👥 Usuarios"],["contenido","📝 Contenido"],["relojes","⌚ Relojes pendientes"]];

  return (
    <div>
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>Panel de Admin</h2>
          <p style={S.muted}>Solo visible para administradores</p>
        </div>
        <button style={S.btn("outline")} onClick={()=>onNavigate("feed")}>← Volver</button>
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:24 }}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab===id?"#1a2744":"#f0ede6", color:tab===id?"#fff":"#666", fontWeight:tab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {loading ? <Spinner /> : (<>

        {/* MÉTRICAS */}
        {tab==="metricas"&&metrics&&(
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:24 }}>
              {[
                ["👥 Usuarios", metrics.totalUsers],
                ["📝 Posts", metrics.totalPosts],
                ["💬 Foros", metrics.totalThreads],
                ["⌚ Relojes", metrics.totalWatches],
                ["⭐ Reseñas", metrics.totalReviews||0],
              ].map(([label,val])=>(
                <div key={label} style={{ ...S.card, textAlign:"center", padding:20, marginBottom:0 }}>
                  <div style={{ fontSize:28, fontWeight:700, fontFamily:"'DM Mono',monospace", color:"#1a2744" }}>{val||0}</div>
                  <div style={S.muted}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div style={S.card}>
                <h3 style={{ ...S.h2, marginBottom:16 }}>Usuarios recientes</h3>
                {metrics.recentUsers.map(u=>(
                  <div key={u.id} style={{ ...S.row, justifyContent:"space-between", marginBottom:10, paddingBottom:10, borderBottom:"1px solid #f5f5f3" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                      <div style={S.muted}>@{u.handle} · {u.account_type}</div>
                    </div>
                    <div style={{ ...S.muted, fontSize:11 }}>{new Date(u.created_at).toLocaleDateString("es-ES")}</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <h3 style={{ ...S.h2, marginBottom:16 }}>Posts más populares</h3>
                {metrics.topPosts.map(p=>(
                  <div key={p.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:"1px solid #f5f5f3" }}>
                    <div style={{ fontSize:13, color:"#444", marginBottom:4 }}>{p.content.slice(0,60)}…</div>
                    <div style={S.muted}>@{p.author?.handle} · ♥{p.likes_count||0} · 💬{p.comments_count||0}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USUARIOS */}
        {tab==="usuarios"&&(
          <div style={S.card}>
            <h3 style={{ ...S.h2, marginBottom:16 }}>Usuarios ({users.length})</h3>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:"2px solid #f0ede6" }}>
                    {["Nombre","Handle","Tipo","Ciudad","Registrado","Acciones"].map(h=>(
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#888", fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.id} style={{ borderBottom:"1px solid #f5f5f3", background:u.suspended?"#fff5f5":"#fff" }}>
                      <td style={{ padding:"10px 12px", fontWeight:600 }}>{u.name}{u.suspended&&<span style={{ color:"#c00", fontSize:11, marginLeft:6 }}>[suspendido]</span>}</td>
                      <td style={{ padding:"10px 12px", fontFamily:"'DM Mono',monospace", color:"#888" }}>@{u.handle}</td>
                      <td style={{ padding:"10px 12px" }}>{u.account_type}</td>
                      <td style={{ padding:"10px 12px", color:"#888" }}>{u.location||"—"}</td>
                      <td style={{ padding:"10px 12px", color:"#888", fontSize:12 }}>{new Date(u.created_at).toLocaleDateString("es-ES")}</td>
                      <td style={{ padding:"10px 12px" }}>
                        {!u.suspended&&<button style={{ background:"none", border:"1px solid #fcc", color:"#c00", borderRadius:4, padding:"2px 8px", fontSize:11, cursor:"pointer" }} onClick={()=>suspendUser(u.id)}>Suspender</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENIDO */}
        {tab==="contenido"&&(
          <div>
            <h3 style={{ ...S.h2, marginBottom:12 }}>Posts recientes</h3>
            {posts.map(p=>(
              <div key={p.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={S.muted}>@{p.author?.handle} · {new Date(p.created_at).toLocaleDateString("es-ES")}</div>
                  <p style={{ fontSize:13, color:"#444", margin:"4px 0 0" }}>{p.content.slice(0,120)}{p.content.length>120?"…":""}</p>
                </div>
                <button style={{ background:"none", border:"1px solid #fcc", color:"#c00", borderRadius:4, padding:"4px 10px", fontSize:12, cursor:"pointer", marginLeft:12, flexShrink:0 }} onClick={()=>deletePost(p.id)}>Borrar</button>
              </div>
            ))}
            <h3 style={{ ...S.h2, marginBottom:12, marginTop:8 }}>Foros recientes</h3>
            {threads.map(t=>(
              <div key={t.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={S.muted}>@{t.author?.handle} · @{t.watch?.slug} · {new Date(t.created_at).toLocaleDateString("es-ES")}</div>
                  <div style={{ fontWeight:600, fontSize:13, marginTop:4 }}>{t.title}</div>
                </div>
                <button style={{ background:"none", border:"1px solid #fcc", color:"#c00", borderRadius:4, padding:"4px 10px", fontSize:12, cursor:"pointer", marginLeft:12, flexShrink:0 }} onClick={()=>deleteThread(t.id)}>Borrar</button>
              </div>
            ))}
          </div>
        )}

        {/* RELOJES PENDIENTES */}
        {tab==="relojes"&&(
          <div>
            <h3 style={{ ...S.h2, marginBottom:16 }}>Relojes pendientes de aprobación ({pendingWatches.length})</h3>
            {pendingWatches.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin relojes pendientes ✓</div>}
            {pendingWatches.map(w=>(
              <div key={w.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{w.model}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#888", marginBottom:4 }}>@{w.slug} · Ref. {w.reference}</div>
                  <div style={S.muted}>Propuesto por @{w.creator?.handle} · {w.watch_type} · {w.gender}</div>
                  {w.market_price&&<div style={{ fontSize:12, color:"#b8963e", marginTop:2 }}>💰 {w.market_price}</div>}
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <button style={{ background:"#f0fdf4", border:"1px solid #b3dfc4", color:"#16a34a", borderRadius:6, padding:"6px 14px", fontSize:13, cursor:"pointer", fontWeight:600 }} onClick={()=>approveWatch(w.id)}>✓ Aprobar</button>
                  <button style={{ background:"#fff3f3", border:"1px solid #fcc", color:"#dc2626", borderRadius:6, padding:"6px 14px", fontSize:13, cursor:"pointer" }} onClick={()=>rejectWatch(w.id)}>✗ Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </>)}
    </div>
  );
}
