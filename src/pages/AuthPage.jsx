import { useState } from "react";
import { supabase } from "../lib/supabase";
import { S } from "../data/constants";
import { Logo } from "../components/UI";

export function AuthPage({ onExplore, onNewSignup }) {
  const [mode, setMode] = useState("login");
  const [accountType, setAccountType] = useState("user");
  const [corporateUrl, setCorporateUrl] = useState("");
  const [form, setForm] = useState({ email:"", password:"", name:"", handle:"", account_type:"collector", corporate_url:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  async function handleSubmit() {
    setError(null); setSuccess(null); setLoading(true);
    try {
      if(mode==="login") {
        const {error}=await supabase.auth.signInWithPassword({email:form.email,password:form.password});
        if(error) throw error;
      } else {
        if(!form.handle.match(/^[a-z0-9_]{3,20}$/)) throw new Error("Handle: solo minúsculas, números y _ (3-20 caracteres)");
        const {error}=await supabase.auth.signUp({email:form.email,password:form.password,options:{data:{name:form.name,handle:form.handle,account_type:form.account_type,corporate_url:form.corporate_url||null,pending_approval:form.account_type!=="collector"}}});
        if(error) throw error;
        setSuccess("¡Cuenta creada! Revisa tu email para confirmar.");
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#1a2744", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:440, padding:20 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><Logo height={60} /></div>
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:14 }}>La comunidad de relojes</div>
        </div>
        <div style={{ background:"#fff", borderRadius:16, padding:32, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ display:"flex", marginBottom:24, background:"#f5f5f3", borderRadius:8, padding:3, gap:3 }}>
            {["login","register"].map(m=>(
              <button key={m} style={{ flex:1, padding:"8px 0", borderRadius:6, border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer", background:mode===m?"#fff":"transparent", color:mode===m?"#1a2744":"#888", boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.1)":"none" }} onClick={()=>setMode(m)}>
                {m==="login"?"Entrar":"Registrarse"}
              </button>
            ))}
          </div>
          {error&&<div style={S.error}>{error}</div>}
          {success&&<div style={S.success}>{success}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="register"&&(<>
              {/* Tipo de cuenta - ARRIBA DEL TODO */}
              <div style={{ marginBottom:16 }}>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[{v:"collector",icon:"⌚",l:"Coleccionista"},{v:"repairer",icon:"🔧",l:"Taller"},{v:"brand",icon:"🏷️",l:"Marca"}].map(t=>(
                    <button key={t.v} type="button" onClick={()=>set("account_type",t.v)}
                      style={{ padding:"10px 8px", borderRadius:8, border:`2px solid ${form.account_type===t.v?"#1a2744":"#e0ddd6"}`, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, background:form.account_type===t.v?"#1a2744":"#fff", color:form.account_type===t.v?"#fff":"#444", fontWeight:form.account_type===t.v?700:400, textAlign:"center" }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{t.icon}</div>{t.l}
                    </button>
                  ))}
                </div>
                {form.account_type!=="collector"&&(
                  <div style={{ marginTop:10 }}>
                    <span style={S.label}>Web o email corporativo</span>
                    <input style={S.input} placeholder={form.account_type==="repairer"?"www.mitaller.com":"www.mimarca.com"} value={form.corporate_url||""} onChange={e=>set("corporate_url",e.target.value)} />
                    <div style={{ fontSize:11, color:"#888", marginTop:4 }}>Necesario para verificación.</div>
                  </div>
                )}
              </div>
              <div><span style={S.label}>Nombre</span><input style={S.input} placeholder="Juan García" value={form.name} onChange={e=>set("name",e.target.value)} /></div>
              <div><span style={S.label}>Handle</span><input style={S.input} placeholder="juan_garcia" value={form.handle} onChange={e=>set("handle",e.target.value.toLowerCase())} /></div>
              <div><span style={S.label}>Tipo de cuenta</span>
                <select style={S.input} value={form.account_type} onChange={e=>set("account_type",e.target.value)}>
                  <option value="collector">Coleccionista / Aficionado</option>
                  <option value="repairer">Taller / Reparador</option>
                  <option value="brand">Marca oficial</option>
                </select>
              </div>
            </>)}
            <button type="button" onClick={async()=>{ await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo:"https://wichwoch.vercel.app" } }); }}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"11px", border:"1px solid #e0ddd6", borderRadius:8, background:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, color:"#444", marginBottom:6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar con Google
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 6px" }}>
              <div style={{ flex:1, height:1, background:"#e0ddd6" }} />
              <span style={{ fontSize:12, color:"#aaa" }}>o con email</span>
              <div style={{ flex:1, height:1, background:"#e0ddd6" }} />
            </div>
            <div><span style={S.label}>Email</span><input style={S.input} type="email" placeholder="tu@email.com" value={form.email} onChange={e=>set("email",e.target.value)} /></div>
            <div><span style={S.label}>Contraseña</span><input style={S.input} type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e=>set("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} /></div>
            <button style={{ ...S.btn("primary"), width:"100%", marginTop:4, padding:13, fontSize:15 }} onClick={handleSubmit} disabled={loading}>
              {loading?"Cargando…":mode==="login"?"Entrar":"Crear cuenta"}
            </button>
          </div>
          {mode==="login"&&(
            <div style={{ textAlign:"center", marginTop:20, paddingTop:20, borderTop:"1px solid #f0f0f0" }}>
              <span style={{ ...S.muted, fontSize:13 }}>¿Sin cuenta? </span>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#b8963e", fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }} onClick={()=>setMode("register")}>Regístrate gratis</button>
            </div>
          )}
        </div>
        {/* Explorar sin cuenta */}
        <div style={{ textAlign:"center", marginTop:20 }}>
          <button style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:13, fontFamily:"'DM Sans',sans-serif", textDecoration:"underline" }} onClick={onExplore}>
            Explorar sin cuenta →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EXPLORAR PAGE (rediseñado) ───────────────────────────────────────────────
function ExplorePage({ onNavigate, currentUser }) {
  const [watches, setWatches] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    if(!search.trim()||search.length<2) { setSearchResults(null); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(()=>doSearch(search), 300);
    return ()=>clearTimeout(timerRef.current);
  },[search]);

  async function load() {
    setLoading(true);
    const [{data:w},{data:p}]=await Promise.all([
      supabase.from("watches").select("*").order("brand_slug").limit(20),
      supabase.from("profiles").select("*").order("followers_count",{ascending:false}).limit(12),
    ]);
    setWatches(w||[]); setProfiles(p||[]); setLoading(false);
  }

  async function doSearch(q) {
    setSearching(true);
    try {
      const clean=q.replace(/^@/,"");
      const [u,w,t]=await Promise.all([
        supabase.from("profiles").select("id,name,handle,bio,account_type,avatar_color,avatar_emoji,location,followers_count").or(`name.ilike.%${clean}%,handle.ilike.%${clean}%`).limit(5),
        supabase.from("watches").select("id,slug,model,reference,brand_slug,image_url").or(`model.ilike.%${clean}%,slug.ilike.%${clean}%`).limit(6),
        supabase.from("forum_threads").select("id,title,content,watch:watches(slug,model)").ilike("title",`%${clean}%`).limit(4),
      ]);
      setSearchResults({ users:u.data||[], watches:w.data||[], threads:t.data||[] });
    } catch(e) {
      console.error("Search error:", e);
      setSearchResults({ users:[], watches:[], threads:[] });
    }
    setSearching(false);
  }

  const byBrand = watches.reduce((acc,w)=>{ const b=brandFromSlug(w.slug||""); if(!acc[b]) acc[b]=[]; acc[b].push(w); return acc; },{});
  const brands = Object.keys(BRAND_COLORS);

  return (
    <div>
      {/* Buscador prominente */}
      <div style={{ background:"linear-gradient(135deg, #1a2744, #2a3a5a)", borderRadius:16, padding:"32px 28px", marginBottom:28, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:150, height:150, borderRadius:"50%", background:"rgba(184,150,62,0.1)" }} />
        <div style={{ position:"absolute", bottom:-30, left:60, width:100, height:100, borderRadius:"50%", background:"rgba(184,150,62,0.08)" }} />
        <h2 style={{ color:"#fff", fontFamily:"'DM Mono',monospace", fontSize:20, fontWeight:700, marginBottom:8, position:"relative" }}>Descubre el mundo del reloj</h2>
        <p style={{ color:"rgba(255,255,255,0.6)", fontSize:14, marginBottom:20, position:"relative" }}>Busca marcas, modelos, coleccionistas y debates</p>
        <div style={{ position:"relative" }}>
          <input style={{ ...S.input, paddingLeft:44, fontSize:15, borderRadius:10, border:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.2)" }}
            placeholder="@rolex_submariner, Omega, coleccionistas Madrid…"
            value={search} onChange={e=>setSearch(e.target.value)} />
          <span style={{ position:"absolute", left:14, top:12, fontSize:18 }}>🔍</span>
          {search&&<button style={{ position:"absolute", right:12, top:10, background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:18 }} onClick={()=>setSearch("")}>×</button>}
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {search.length>=2&&(
        <div style={{ marginBottom:28 }}>
          {searching&&<Spinner />}
          {!searching&&searchResults&&(
            <>
              {searchResults.watches.length>0&&(
                <div style={{ marginBottom:24 }}>
                  <h3 style={{ fontSize:13, fontWeight:700, fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:"uppercase", color:"#666", marginBottom:14 }}>⌚ Relojes</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
                    {searchResults.watches.map(w=><WatchCard key={w.id} watch={w} onClick={()=>onNavigate("watch",w.slug)} />)}
                  </div>
                </div>
              )}
              {searchResults.users.length>0&&(
                <div style={{ marginBottom:24 }}>
                  <h3 style={{ fontSize:13, fontWeight:700, fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:"uppercase", color:"#666", marginBottom:14 }}>👤 Personas</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {searchResults.users.map(u=>(
                      <div key={u.id} style={{ ...S.card, cursor:"pointer", padding:14 }} onClick={()=>onNavigate("profile",u.id)}>
                        <div style={S.row}>
                          <Avatar name={u.name||"?"} size={44} color={u.avatar_color||"#1a2744"} emoji={u.avatar_emoji||null} />
                          <div><div style={{ fontWeight:600 }}>{u.name}</div><div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.threads.length>0&&(
                <div>
                  <h3 style={{ fontSize:13, fontWeight:700, fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:"uppercase", color:"#666", marginBottom:14 }}>💬 Foros</h3>
                  {searchResults.threads.map(t=>(
                    <div key={t.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("thread",t.id)}>
                      <div style={{ ...S.mono, fontSize:11, color:"#c8a84b", marginBottom:4 }}>@{t.watch?.slug}</div>
                      <div style={{ fontWeight:700, marginBottom:4 }}>{t.title}</div>
                      <p style={{ fontSize:13, color:"#555", margin:0 }}>{t.content.slice(0,100)}…</p>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.watches.length===0&&searchResults.users.length===0&&searchResults.threads.length===0&&(
                <div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin resultados para "{search}"</div>
              )}
            </>
          )}
        </div>
      )}

      {!search&&!loading&&(<>
        {/* Marcas destacadas */}
        <div style={{ marginBottom:32 }}>
          <h3 style={{ ...S.h2, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>🏷️ Marcas</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
            {brands.map(slug=>{
              const bg=BRAND_COLORS[slug];
              const name=brandFromSlug(slug);
              const watchCount=watches.filter(w=>w.brand_slug===slug).length;
              return (
                <div key={slug} style={{ cursor:"pointer", borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
                  onClick={()=>onNavigate("brand",slug)}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                  <div style={{ height:80, background:`linear-gradient(135deg, ${bg}, ${bg}cc)`, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4 }}>
                    <div style={{ fontSize:24 }}>{BRAND_LOGOS[slug]||"⌚"}</div>
                  </div>
                  <div style={{ padding:"10px 12px", background:"#fff" }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{name}</div>
                    <div style={{ ...S.mono, fontSize:10, color:"#aaa" }}>{watchCount} modelos</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Relojes icónicos */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h3 style={{ ...S.h2, marginBottom:0, display:"flex", alignItems:"center", gap:8 }}>⌚ Relojes icónicos</h3>
            <button style={{ ...S.btn("outline"), fontSize:12, padding:"6px 14px" }} onClick={()=>onNavigate("relojes")}>Ver todos →</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
            {watches.slice(0,8).map(w=><WatchCard key={w.id} watch={w} onClick={()=>onNavigate("watch",w.slug)} />)}
          </div>
        </div>

        {/* Coleccionistas destacados */}
        <div style={{ marginBottom:32 }}>
          <h3 style={{ ...S.h2, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>👥 Coleccionistas</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:12 }}>
            {profiles.filter(p=>p.account_type==="collector").slice(0,6).map(p=>(
              <div key={p.id} style={{ ...S.card, cursor:"pointer", padding:16 }} onClick={()=>onNavigate("profile",p.id)}>
                <div style={{ ...S.row, marginBottom:8 }}>
                  <Avatar name={p.name||"?"} size={44} color={p.avatar_color||"#1a2744"} emoji={p.avatar_emoji||null} />
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{p.name}</div>
                    <div style={S.muted}>@{p.handle}</div>
                  </div>
                </div>
                {p.location&&<div style={{ fontSize:12, color:"#888" }}>📍 {p.location}</div>}
                {p.bio&&<p style={{ fontSize:12, color:"#555", margin:"6px 0 0", lineHeight:1.4 }}>{p.bio.slice(0,60)}{p.bio.length>60?"…":""}</p>}
                <div style={{ marginTop:8, display:"flex", gap:16 }}>
                  <div style={{ textAlign:"center" }}><div style={{ fontWeight:700, fontSize:14 }}>{p.followers_count||0}</div><div style={{ fontSize:11, color:"#aaa" }}>seg.</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Talleres */}
        {profiles.filter(p=>p.account_type==="repairer").length>0&&(
          <div>
            <h3 style={{ ...S.h2, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>🔧 Talleres</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {profiles.filter(p=>p.account_type==="repairer").slice(0,4).map(p=>(
                <div key={p.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",p.id)}>
                  <div style={S.row}>
                    <div style={{ width:48, height:48, borderRadius:10, background:"#2c4a2e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔧</div>
                    <div>
                      <div style={{ fontWeight:600 }}>{p.name}<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" /></div>
                      <div style={S.muted}>{p.location||"Sin ubicación"}</div>
                      {p.bio&&<p style={{ fontSize:12, color:"#555", margin:"4px 0 0" }}>{p.bio.slice(0,60)}…</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>)}
    </div>
  );
}
