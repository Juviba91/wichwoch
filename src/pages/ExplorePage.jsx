import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { S, BRAND_COLORS, BRAND_LOGOS, BRAND_LOGO_URLS, brandFromSlug, brandColor } from "../data/constants";
import { Spinner, Avatar } from "../components/UI";

export function ExplorePage({ onNavigate, currentUser }) {
  const [watches, setWatches] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [topWishlisted, setTopWishlisted] = useState([]);
  const [topThreads, setTopThreads] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    if(!search.trim()||search.length<2){ setSearchResults(null); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(()=>doSearch(search), 350);
    return ()=>clearTimeout(timerRef.current);
  },[search]);

  async function load() {
    setLoading(true);
    try {
      const [{data:w},{data:p},{data:wl},{data:th}] = await Promise.all([
        supabase.from("watches").select("id,slug,model,reference,brand_slug,image_url,market_price").order("brand_slug").limit(100),
        supabase.from("profiles").select("id,name,handle,avatar_color,bio,location,followers_count,flow").order("flow",{ascending:false}).limit(10),
        supabase.from("watch_wishlist").select("watch_id, watch:watches(id,slug,model,brand_slug,image_url,market_price)"),
        supabase.from("forum_threads").select("id,title,votes,replies_count,watch:watches(slug,model)").order("votes",{ascending:false}).limit(1),
      ]);
      setWatches(w||[]);
      setProfiles(p||[]);
      setTopThreads(th||[]);
      const counts = {};
      (wl||[]).forEach(item=>{
        if(!item.watch_id) return;
        if(!counts[item.watch_id]) counts[item.watch_id]={count:0,watch:item.watch};
        counts[item.watch_id].count++;
      });
      setTopWishlisted(Object.values(counts).sort((a,b)=>b.count-a.count).slice(0,8));
    } catch(e){ console.error(e); }
    setLoading(false);
  }

  async function doSearch(q) {
    setSearching(true);
    try {
      const clean = q.replace(/^@/,"");
      const [u,w,t] = await Promise.all([
        supabase.from("profiles").select("id,name,handle,avatar_color,followers_count,account_type").or(`name.ilike.%${clean}%,handle.ilike.%${clean}%`).limit(5),
        supabase.from("watches").select("id,slug,model,brand_slug,image_url").or(`model.ilike.%${clean}%,slug.ilike.%${clean}%`).limit(6),
        supabase.from("forum_threads").select("id,title,watch:watches(slug,model)").ilike("title",`%${clean}%`).limit(4),
      ]);
      setSearchResults({ users:u.data||[], watches:w.data||[], threads:t.data||[] });
    } catch(e){ setSearchResults({users:[],watches:[],threads:[]}); }
    setSearching(false);
  }

  const BRANDS = ["rolex","omega","patek","ap","iwc","jlc","tudor","cartier","breitling","tag","vc","hublot","panerai","gs","zenith"];

  // Hero items
  const heroItems = [
    topWishlisted[0] ? { type:"wishlisted", label:"❤️ Más deseado", data:topWishlisted[0] } : null,
    profiles[0] ? { type:"collector", label:"⚡ Top coleccionista", data:profiles[0] } : null,
    topThreads[0] ? { type:"thread", label:"💬 Foro del momento", data:topThreads[0] } : null,
  ].filter(Boolean);

  const hero = heroItems.length > 0 ? heroItems[heroIndex % heroItems.length] : null;
  const heroWatch = hero?.type==="wishlisted" ? hero.data?.watch : null;
  const heroBg = heroWatch ? brandColor(heroWatch.slug) : hero?.type==="collector" ? hero?.data?.avatar_color||"#1a2744" : "#1a2744";

  return (
    <div>
      {/* Buscador */}
      <div style={{ position:"relative", marginBottom:20 }}>
        <input style={{ ...S.input, paddingLeft:44, fontSize:16, padding:"14px 16px 14px 44px" }}
          placeholder="Busca relojes, marcas, usuarios o foros…"
          value={search} onChange={e=>setSearch(e.target.value)} />
        <span style={{ position:"absolute", left:14, top:14, color:"#888", fontSize:18 }}>🔍</span>
        {search&&<button style={{ position:"absolute", right:14, top:14, background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:18 }} onClick={()=>{ setSearch(""); setSearchResults(null); }}>×</button>}
      </div>

      {/* Resultados de búsqueda */}
      {searchResults&&(
        <div style={{ marginBottom:24 }}>
          {searching&&<Spinner />}
          {!searching&&searchResults.watches.length===0&&searchResults.users.length===0&&searchResults.threads.length===0&&(
            <div style={{ ...S.card, textAlign:"center", color:"#888" }}>Sin resultados para "{search}"</div>
          )}
          {searchResults.watches.length>0&&(
            <div style={{ marginBottom:16 }}>
              <h3 style={{ ...S.h2, marginBottom:10 }}>Relojes</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
                {searchResults.watches.map(w=>(
                  <div key={w.id} style={{ borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", background:"#fff", cursor:"pointer" }} onClick={()=>onNavigate("watch",w.slug)}>
                    <div style={{ height:90, background:`linear-gradient(135deg,${brandColor(w.slug)},${brandColor(w.slug)}88)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {w.image_url?<img src={w.image_url} alt="" style={{ height:"85%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:24 }}>⌚</span>}
                    </div>
                    <div style={{ padding:"8px 10px" }}>
                      <div style={{ fontWeight:700, fontSize:12 }}>{w.model}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#aaa" }}>{brandFromSlug(w.slug)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {searchResults.users.length>0&&(
            <div style={{ marginBottom:16 }}>
              <h3 style={{ ...S.h2, marginBottom:10 }}>Usuarios</h3>
              {searchResults.users.map(u=>(
                <div key={u.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}>
                  <div style={{ width:40,height:40,borderRadius:"50%",background:u.avatar_color||"#1a2744",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",fontSize:14,fontFamily:"'DM Mono',monospace" }}>
                    {(u.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:600 }}>{u.name}
                      {u.account_type==="taller"&&<span style={{ marginLeft:6, fontSize:10, background:"#f0ede6", borderRadius:4, padding:"1px 6px", color:"#888" }}>🔧 Taller</span>}
                      {u.account_type==="marca"&&<span style={{ marginLeft:6, fontSize:10, background:"#1a2744", borderRadius:4, padding:"1px 6px", color:"#fff" }}>🏷️ Marca</span>}
                    </div>
                    <div style={{ ...S.muted, fontSize:12 }}>@{u.handle}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {searchResults.threads.length>0&&(
            <div style={{ marginBottom:16 }}>
              <h3 style={{ ...S.h2, marginBottom:10 }}>Foros</h3>
              {searchResults.threads.map(t=>(
                <div key={t.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("thread",t.id)}>
                  <div style={{ fontWeight:600 }}>{t.title}</div>
                  {t.watch&&<div style={{ ...S.muted, fontSize:12 }}>@{t.watch.slug}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searchResults&&!loading&&(<>

        {/* Hero — 3 cards verticales */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:24 }}>
          {/* Card 1: Reloj más deseado */}
          {topWishlisted[0]?.watch&&(
            <div style={{ borderRadius:12, background:`linear-gradient(135deg,${brandColor(topWishlisted[0].watch.slug)},${brandColor(topWishlisted[0].watch.slug)}88)`, padding:"20px 16px", cursor:"pointer", display:"flex", flexDirection:"column", minHeight:160 }}
              onClick={()=>onNavigate("watch",topWishlisted[0].watch.slug)}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.6)",fontFamily:"'DM Mono',monospace",marginBottom:8 }}>❤️ Más deseado</div>
              {topWishlisted[0].watch.image_url&&<img src={topWishlisted[0].watch.image_url} alt="" style={{ height:70,objectFit:"contain",filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.4))",marginBottom:10 }} onError={e=>e.target.style.display="none"} />}
              <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:2 }}>{topWishlisted[0].watch.model}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)" }}>❤️ {topWishlisted[0].count} wishlists</div>
            </div>
          )}
          {/* Card 2: Foro más comentado */}
          {topThreads[0]&&(
            <div style={{ borderRadius:12, background:"linear-gradient(135deg,#1a2744,#2a3a5a)", padding:"20px 16px", cursor:"pointer", display:"flex", flexDirection:"column", minHeight:160 }}
              onClick={()=>onNavigate("thread",topThreads[0].id)}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.6)",fontFamily:"'DM Mono',monospace",marginBottom:8 }}>💬 Foro del momento</div>
              <div style={{ fontSize:28,marginBottom:10 }}>💬</div>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:2,lineHeight:1.3 }}>{topThreads[0].title?.slice(0,50)}{topThreads[0].title?.length>50?"…":""}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:"auto" }}>{topThreads[0].replies_count||0} respuestas · ⬆️{topThreads[0].votes||0}</div>
            </div>
          )}
          {/* Card 3: Mejor experto (más Flow) */}
          {profiles[0]&&(
            <div style={{ borderRadius:12, background:"linear-gradient(135deg,#b8963e,#8a6f2e)", padding:"20px 16px", cursor:"pointer", display:"flex", flexDirection:"column", minHeight:160 }}
              onClick={()=>onNavigate("profile",profiles[0].id)}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.6)",fontFamily:"'DM Mono',monospace",marginBottom:8 }}>⚡ Mejor experto</div>
              <div style={{ width:48,height:48,borderRadius:"50%",background:profiles[0].avatar_color||"#1a2744",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",fontSize:18,fontFamily:"'DM Mono',monospace",marginBottom:10 }}>
                {(profiles[0].name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{ fontWeight:700,fontSize:14,color:"#fff",marginBottom:2 }}>{profiles[0].name}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.8)" }}>⚡{profiles[0].flow||0} Flow</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)" }}>@{profiles[0].handle}</div>
            </div>
          )}
        </div>

        {/* Más deseados */}
        {topWishlisted.length>0&&(
          <div style={{ marginBottom:28 }}>
            <h3 style={{ ...S.h2, marginBottom:12 }}>❤️ Más deseados</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
              {topWishlisted.slice(0,6).map(({watch,count})=>watch&&(
                <div key={watch.id} style={{ borderRadius:10,overflow:"hidden",border:"1px solid #ece9e2",background:"#fff",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }} onClick={()=>onNavigate("watch",watch.slug)}>
                  <div style={{ height:110,background:`linear-gradient(135deg,${brandColor(watch.slug)},${brandColor(watch.slug)}99)`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative" }}>
                    {watch.image_url?<img src={watch.image_url} alt="" style={{ height:"85%",objectFit:"contain",filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:28 }}>⌚</span>}
                    <div style={{ position:"absolute",top:6,right:6,background:"rgba(184,150,62,0.9)",borderRadius:10,padding:"2px 8px",fontSize:10,color:"#fff",fontWeight:700 }}>❤️ {count}</div>
                  </div>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ fontWeight:700,fontSize:13 }}>{watch.model}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:"#aaa" }}>{brandFromSlug(watch.slug)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top coleccionistas */}
        {profiles.length>0&&(
          <div style={{ marginBottom:28 }}>
            <h3 style={{ ...S.h2, marginBottom:12 }}>⚡ Top coleccionistas</h3>
            <div style={{ display:"flex",gap:10,overflowX:"auto",paddingBottom:8 }}>
              {profiles.map((p,i)=>(
                <div key={p.id} style={{ minWidth:120,background:"#fff",border:"1px solid #ece9e2",borderRadius:10,padding:"14px 12px",textAlign:"center",cursor:"pointer",flexShrink:0 }} onClick={()=>onNavigate("profile",p.id)}>
                  <div style={{ width:44,height:44,borderRadius:"50%",background:p.avatar_color||"#1a2744",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#fff",fontSize:16,fontFamily:"'DM Mono',monospace",margin:"0 auto 8px" }}>
                    {(p.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  {i<3&&<div style={{ fontSize:14,marginBottom:4 }}>{i===0?"🥇":i===1?"🥈":"🥉"}</div>}
                  <div style={{ fontWeight:700,fontSize:12,marginBottom:2 }}>{p.name?.split(" ")[0]||"?"}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:"#aaa",marginBottom:4 }}>@{p.handle}</div>
                  <div style={{ fontSize:11,color:"#b8963e",fontWeight:600 }}>⚡{p.flow||0}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marcas */}
        <div style={{ marginBottom:28 }}>
          <h3 style={{ ...S.h2, marginBottom:12 }}>Marcas</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
            {BRANDS.map(slug=>{
              const bg = BRAND_COLORS[slug]||"#1a2744";
              const watchCount = watches.filter(w=>w.brand_slug===slug).length;
              const logoUrl = BRAND_LOGO_URLS[slug];
              return (
                <div key={slug} style={{ borderRadius:10,overflow:"hidden",border:"1px solid #ece9e2",background:"#fff",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }} onClick={()=>onNavigate("brand",slug)}>
                  <div style={{ height:80,background:`linear-gradient(135deg,${bg},${bg}cc)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    {logoUrl
                      ? <img src={logoUrl} alt={slug} style={{ height:44,objectFit:"contain",filter:"none" }} onError={e=>e.target.style.display="none"} />
                      : <span style={{ fontSize:22,color:"#fff",fontWeight:700,fontFamily:"'DM Mono',monospace" }}>{BRAND_LOGOS[slug]||slug[0].toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ padding:"10px 12px" }}>
                    <div style={{ fontWeight:700,fontSize:13 }}>{brandFromSlug(`${slug}_x`)}</div>
                    <div style={{ ...S.muted,fontSize:11 }}>{watchCount} modelos</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Relojes destacados */}
        <div style={{ marginBottom:28 }}>
          <h3 style={{ ...S.h2, marginBottom:12 }}>Relojes icónicos</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
            {watches.slice(0,12).map(w=>(
              <div key={w.id} style={{ borderRadius:10,overflow:"hidden",border:"1px solid #ece9e2",background:"#fff",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }} onClick={()=>onNavigate("watch",w.slug)}>
                <div style={{ height:100,background:`linear-gradient(135deg,${brandColor(w.slug)},${brandColor(w.slug)}88)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  {w.image_url?<img src={w.image_url} alt="" style={{ height:"85%",objectFit:"contain",filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={e=>e.target.style.display="none"} />:<span style={{ fontSize:28 }}>⌚</span>}
                </div>
                <div style={{ padding:"8px 10px" }}>
                  <div style={{ fontWeight:700,fontSize:12 }}>{w.model}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:"#aaa" }}>{brandFromSlug(w.slug)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </>)}

      {loading&&<Spinner />}
    </div>
  );
}
