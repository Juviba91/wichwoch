import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { S, BRAND_COLORS, BRAND_LOGOS, BRAND_LOGO_URLS, brandFromSlug, brandColor } from "../data/constants";
import { Spinner, WatchCard, Avatar, Badge } from "../components/UI";

export function ExplorePage({ onNavigate, currentUser }) {
  const [watches, setWatches] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [topWishlisted, setTopWishlisted] = useState([]);
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
                  <div style={{ height:80, background:`linear-gradient(135deg, ${bg}, ${bg}cc)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {BRAND_LOGO_URLS[slug] ? (
                      <img src={BRAND_LOGO_URLS[slug]} alt={slug} style={{ height:44, objectFit:"contain", filter:"none" }} onError={e=>e.target.style.display="none"} />
                    ) : (
                      <div style={{ fontSize:24 }}>{BRAND_LOGOS[slug]||"⌚"}</div>
                    )}
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


// ─── QUOTE POST (repost con comentario) ──────────────────────────────────────
function QuotePostModal({ original, currentUser, onClose, onPosted }) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit() {
    if(!content.trim()) return;
    setPosting(true);
    await supabase.from("posts").insert({
      author_id: currentUser.id,
      content: content.trim(),
      post_type: "text",
      repost_of: original.id
    });
    setPosting(false); onPosted(); onClose();
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:12, padding:24, width:"100%", maxWidth:500, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ ...S.row, justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ ...S.h2, marginBottom:0 }}>Repostear con comentario</h3>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#aaa" }} onClick={onClose}>×</button>
        </div>
        <textarea
          autoFocus
          placeholder="Añade tu comentario…"
          value={content} onChange={e=>setContent(e.target.value)}
          style={{ width:"100%", border:"1px solid #e8e8e8", borderRadius:8, padding:"10px 12px", fontSize:15, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", boxSizing:"border-box", marginBottom:12 }} rows={3} />
        {/* Preview del post original */}
        <div style={{ border:"1px solid #e8e8e8", borderRadius:8, padding:12, marginBottom:16, background:"#f8f6f0" }}>
          <div style={{ ...S.muted, marginBottom:6 }}>@{original.author?.handle}</div>
          <p style={{ fontSize:13, color:"#444", margin:0, lineHeight:1.5 }}>{original.content?.slice(0,120)}{original.content?.length>120?"…":""}</p>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button style={S.btn("outline")} onClick={onClose}>Cancelar</button>
          <button style={S.btn("primary")} onClick={submit} disabled={posting||!content.trim()}>{posting?"Reposteando…":"Repostear"}</button>
        </div>
      </div>
    </div>
  );
}
