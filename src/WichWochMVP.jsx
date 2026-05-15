import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kmxpachollvsiytppvyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteHBhY2hvbGx2c2l5dHBwdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTk0MTYsImV4cCI6MjA5NDIzNTQxNn0.w6tVaItGQi-tuWuoqRqcRl6Z7gIpBIFIcji6szRTXI4"
);

// ─── Noticias estáticas rotativas ────────────────────────────────────────────
const STATIC_NEWS = [
  { type:"curiosidad", content:"El primer reloj de pulsera del mundo fue creado por Patek Philippe en 1868 para la Condesa Koscowicz de Hungría. Hasta entonces, los relojes eran exclusivamente de bolsillo." },
  { type:"tecnico", content:"Un tourbillon es un mecanismo inventado por Abraham-Louis Breguet en 1801 para compensar los efectos de la gravedad en la precisión del reloj. Hoy es símbolo de alta relojería." },
  { type:"noticia", content:"El mercado de relojes de lujo de segunda mano superó los 22.000 millones de dólares en 2023, con plataformas como Chrono24 y WatchBox liderando el crecimiento." },
  { type:"curiosidad", content:"El Rolex Submariner fue el primer reloj certificado resistente al agua hasta 100 metros en 1953. James Bond lo llevó en 'Dr. No' en 1962, disparando su popularidad." },
  { type:"tecnico", content:"Un movimiento automático se carga gracias al rotor, una masa excéntrica que gira con el movimiento de la muñeca. Un día normal de actividad es suficiente para mantenerlo cargado." },
  { type:"noticia", content:"Audemars Piguet vendió su boutique de segunda mano AP House en Ginebra en 2022, certificando relojes vintage con garantía oficial. Un modelo que más marcas están adoptando." },
  { type:"curiosidad", content:"El titanio, usado en muchos relojes deportivos modernos, es un 30% más resistente que el acero y un 50% más ligero. IWC fue pionera en su uso en 1980 con el Ocean 2000." },
  { type:"tecnico", content:"La reserva de marcha indica cuántas horas funcionará un reloj sin recargarse. Un buen automático tiene entre 40 y 80 horas. El Patek Philippe Calibre 89 alcanzó 29 días." },
  { type:"noticia", content:"Rolex produce aproximadamente un millón de relojes al año pero la demanda supera ampliamente la oferta, especialmente en modelos deportivos como el Submariner y el Daytona." },
  { type:"curiosidad", content:"El Omega Speedmaster fue seleccionado por la NASA en 1965 tras pasar pruebas extremas de temperatura, vibración y vacío. Es el único reloj certificado para vuelos espaciales tripulados." },
  { type:"tecnico", content:"El zafiro sintético, utilizado en la mayoría de cristales de relojes de lujo, tiene una dureza de 9 en la escala de Mohs — solo el diamante lo supera. Es casi imposible rayarlo." },
  { type:"curiosidad", content:"Hans Wilsdorf fundó Rolex en Londres en 1905, pero trasladó la empresa a Ginebra en 1919 para evitar los altos impuestos británicos sobre importaciones de movimientos suizos." },
  { type:"tecnico", content:"La certificación COSC (Contrôle Officiel Suisse des Chronomètres) garantiza una precisión de -4/+6 segundos por día. Omega va más allá con su certificación METAS: ±0,5 segundos." },
  { type:"noticia", content:"Tudor, la marca hermana de Rolex, ha ganado enorme popularidad entre coleccionistas por ofrecer movimientos in-house de calidad comparable a Rolex a precios significativamente menores." },
  { type:"curiosidad", content:"El récord de subasta para un reloj de pulsera lo tiene el Patek Philippe Grandmaster Chime Ref. 6300A, vendido en 2019 por 31 millones de francos suizos en la subasta Only Watch." },
  { type:"tecnico", content:"Una complicación en relojería es cualquier función más allá de mostrar horas y minutos. Las más valoradas son el tourbillon, el calendrier perpétuel y la répétition à minutes." },
  { type:"noticia", content:"El mercado de NFTs de relojes creció exponencialmente en 2021-2022, con marcas como Jacob & Co lanzando ediciones digitales. Sin embargo, el interés se ha moderado significativamente." },
  { type:"curiosidad", content:"El acero Oystersteel de Rolex es una aleación especial de la familia 904L, excepcionalmente resistente a la corrosión. La mayoría de la industria usa acero 316L, más común y económico." },
  { type:"tecnico", content:"El bisel giratorio unidireccional de los relojes de buceo no puede girar hacia adelante accidentalmente, garantizando que el buceador nunca sobreestime el tiempo de inmersión restante." },
  { type:"noticia", content:"Jaeger-LeCoultre ha producido más de 1.400 calibres diferentes en su historia, más que cualquier otra manufactura suiza. Su Atmos, que funciona con cambios de temperatura, es icónico." },
  { type:"curiosidad", content:"El término 'Swiss Made' requiere por ley que al menos el 60% del valor de producción y el movimiento sean suizos. Es una de las denominaciones de origen más estrictas del mundo." },
  { type:"tecnico", content:"La lucha contra las réplicas ha llevado a las marcas a incorporar hologramas, microimpresiones y marcas de agua invisibles. Rolex usa un cristal con microestructura láser invisible al ojo." },
  { type:"noticia", content:"Watches & Wonders Ginebra se ha consolidado como la principal feria de alta relojería, sustituyendo a Baselworld tras el éxodo masivo de marcas de lujo en 2020 durante la pandemia." },
  { type:"curiosidad", content:"El movimiento manual más fino del mundo es el Piaget Calibre 900P, con apenas 2mm de grosor. Está montado en la caja del reloj, no en una platina separada, para reducir el espesor total." },
  { type:"tecnico", content:"El choque más común en un reloj es el daño al pivote del áncora o al escape. Por eso los relojes de alta gama incorporan sistemas antichoque como el Incabloc o el Kif Flector." },
  { type:"noticia", content:"La demanda de relojes vintage ha disparado los precios de modelos como el Rolex Paul Newman Daytona, que pasó de valer unos pocos cientos de dólares en los 80 a superar el millón hoy." },
  { type:"curiosidad", content:"Breguet inventó el muelle espiral de forma particular llamado 'espiral Breguet' con la curva final elevada, mejorando enormemente la isocronia — la consistencia del movimiento del péndulo." },
  { type:"tecnico", content:"Un GMT funciona con una aguja adicional que da una vuelta completa cada 24 horas, permitiendo leer simultáneamente la hora local y la de una segunda zona horaria con un bezel bicolor." },
  { type:"noticia", content:"A. Lange & Söhne, la joya de la relojería alemana, fue nationalizada en la RDA en 1948 y refundada en 1990 tras la reunificación. Sus relojes con acabado glashütte son codiciados mundialmente." },
  { type:"curiosidad", content:"El Patek Philippe Calibre 89, presentado en 1989 para el 150 aniversario de la marca, tiene 33 complicaciones, 1.728 piezas y tardó 9 años en desarrollarse. Sigue siendo el reloj más complicado jamás creado." },
];

function getDailyNews() {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const idx = day % 10;
  const pool = [...STATIC_NEWS];
  const result = [];
  const types = ["curiosidad", "noticia", "tecnico"];
  for(const type of types) {
    const filtered = pool.filter(n=>n.type===type);
    result.push(filtered[idx % filtered.length]);
  }
  return result;
}

const BRAND_COLORS = { rolex:"#006039", omega:"#c8a84b", patek:"#1a3a6b", ap:"#1a1a1a", iwc:"#8b0000", jlc:"#2c4a2e", tudor:"#6b0000" };
const AVATAR_COLORS = ["#1a1a1a","#006039","#1a3a6b","#8b0000","#2c4a2e","#c8a84b","#4a4a8a","#7c3aed","#2563eb","#4a7c59","#b45309","#0369a1"];
const AVATAR_EMOJIS = ["🕰️","⌚","🔧","🏆","💎","🌟","🎯","🦅","🌊","🏔️","🎖️","🔑","⚓","🎨","🦁"];

function brandColor(slug) { const p=(slug||"").split("_")[0]; return BRAND_COLORS[p]||"#1a1a1a"; }
function brandFromSlug(slug) { const p=(slug||"").split("_")[0]; return ({rolex:"Rolex",omega:"Omega",patek:"Patek Philippe",ap:"Audemars Piguet",iwc:"IWC",jlc:"Jaeger-LeCoultre",tudor:"Tudor"})[p]||p; }

function parseContent(text, onNavigate) {
  if(!text) return null;
  const parts = text.split(/(@[a-z][a-z0-9_]*)/g);
  return parts.map((part, i) => {
    if(part.startsWith("@")) {
      const slug = part.slice(1);
      return <span key={i} style={{ color:"#2563eb", cursor:"pointer", fontWeight:600 }} onClick={()=>onNavigate("watch", slug)}>{part}</span>;
    }
    return part;
  });
}

const S = {
  app: { fontFamily:"'DM Sans',sans-serif", background:"#fafaf8", minHeight:"100vh", color:"#1a1a1a" },
  nav: { background:"#fff", borderBottom:"1px solid #e8e8e8", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, position:"sticky", top:0, zIndex:100 },
  logo: { fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, letterSpacing:-0.5, color:"#1a1a1a", cursor:"pointer" },
  main: { maxWidth:900, margin:"0 auto", padding:"28px 20px" },
  card: { background:"#fff", border:"1px solid #e8e8e8", borderRadius:8, padding:20, marginBottom:16 },
  h1: { fontSize:22, fontWeight:700, marginBottom:4, fontFamily:"'DM Mono',monospace", letterSpacing:-0.5 },
  h2: { fontSize:16, fontWeight:700, marginBottom:16, fontFamily:"'DM Mono',monospace" },
  label: { fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#999", fontFamily:"'DM Mono',monospace", marginBottom:6, display:"block" },
  muted: { color:"#888", fontSize:13 },
  mono: { fontFamily:"'DM Mono',monospace" },
  input: { width:"100%", border:"1px solid #e8e8e8", borderRadius:6, padding:"10px 12px", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box", background:"#fff" },
  btn: (v="primary") => ({ padding:"9px 18px", borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer", border:v==="outline"?"1px solid #ddd":"none", fontFamily:"'DM Sans',sans-serif", background:v==="primary"?"#1a1a1a":v==="outline"?"transparent":"#f0f0f0", color:v==="primary"?"#fff":"#1a1a1a" }),
  row: { display:"flex", alignItems:"center", gap:12 },
  col: { display:"flex", flexDirection:"column", gap:4 },
  error: { background:"#fff3f3", border:"1px solid #fcc", borderRadius:6, padding:"10px 14px", fontSize:13, color:"#c00", marginBottom:16 },
  success: { background:"#f0f9f4", border:"1px solid #b3dfc4", borderRadius:6, padding:"10px 14px", fontSize:13, color:"#2a7a4a", marginBottom:16 },
  navLink: (a) => ({ padding:"6px 12px", borderRadius:6, fontSize:13, cursor:"pointer", fontWeight:a?600:400, background:a?"#1a1a1a":"transparent", color:a?"#fff":"#666", border:"none", fontFamily:"'DM Sans',sans-serif" }),
};

function Badge({ text, bg="#f0f0f0", color="#1a1a1a" }) {
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", padding:"2px 8px", background:bg, color, borderRadius:3, fontFamily:"'DM Mono',monospace", marginLeft:6 }}>{text}</span>;
}

function Avatar({ name="?", size=36, color="#1a1a1a", emoji=null }) {
  const i = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:emoji?size*0.5:size*0.35, fontWeight:700, flexShrink:0, fontFamily:"'DM Mono',monospace" }}>
      {emoji||i}
    </div>
  );
}

function Spinner() { return <div style={{ textAlign:"center", padding:40, color:"#888", fontFamily:"'DM Mono',monospace", fontSize:13 }}>Cargando…</div>; }

function timeAgo(ts) {
  const d=Date.now()-new Date(ts), m=Math.floor(d/60000);
  if(m<1) return "ahora"; if(m<60) return `hace ${m}m`;
  const h=Math.floor(m/60); if(h<24) return `hace ${h}h`;
  return `hace ${Math.floor(h/24)}d`;
}

function WatchCard({ watch, onClick }) {
  const bg=brandColor(watch.slug);
  return (
    <div style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:"1px solid #e8e8e8", background:"#fff" }} onClick={onClick}>
      <div style={{ height:100, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.5)", letterSpacing:2, textTransform:"uppercase" }}>{brandFromSlug(watch.slug)}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:"#fff", fontWeight:700, textAlign:"center", padding:"0 8px" }}>{watch.model}</div>
      </div>
      <div style={{ padding:"10px 12px" }}>
        <div style={{ fontWeight:700, fontSize:12, marginBottom:1 }}>{watch.model}</div>
        <div style={{ ...S.mono, fontSize:10, color:"#aaa" }}>@{watch.slug}</div>
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", name:"", handle:"", account_type:"collector" });
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
        const {error}=await supabase.auth.signUp({email:form.email,password:form.password,options:{data:{name:form.name,handle:form.handle,account_type:form.account_type}}});
        if(error) throw error;
        setSuccess("¡Cuenta creada! Revisa tu email para confirmar.");
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  }
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fafaf8" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:420, padding:40 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:28, fontWeight:700, marginBottom:8, letterSpacing:-1 }}>WICH WOCH</div>
          <div style={{ color:"#888", fontSize:14 }}>La comunidad de relojes</div>
        </div>
        <div style={{ ...S.card, padding:32 }}>
          <div style={{ display:"flex", marginBottom:24, background:"#f5f5f3", borderRadius:6, padding:3, gap:3 }}>
            {["login","register"].map(m=>(
              <button key={m} style={{ flex:1, padding:"8px 0", borderRadius:4, border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer", background:mode===m?"#fff":"transparent", color:"#1a1a1a", boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.1)":"none" }} onClick={()=>setMode(m)}>
                {m==="login"?"Entrar":"Registrarse"}
              </button>
            ))}
          </div>
          {error&&<div style={S.error}>{error}</div>}
          {success&&<div style={S.success}>{success}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="register"&&(<>
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
            <div><span style={S.label}>Email</span><input style={S.input} type="email" placeholder="tu@email.com" value={form.email} onChange={e=>set("email",e.target.value)} /></div>
            <div><span style={S.label}>Contraseña</span><input style={S.input} type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e=>set("password",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} /></div>
            <button style={{ ...S.btn("primary"), width:"100%", marginTop:4, padding:13, fontSize:15 }} onClick={handleSubmit} disabled={loading}>
              {loading?"Cargando…":mode==="login"?"Entrar":"Crear cuenta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POST COMPOSER ────────────────────────────────────────────────────────────
function PostComposer({ user, onPosted }) {
  const [type, setType] = useState("text");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsLink, setNewsLink] = useState("");
  const [posting, setPosting] = useState(false);

  const types=[{id:"text",label:"💬"},{id:"photo",label:"📷"},{id:"video",label:"🎬"},{id:"news",label:"📰"}];

  async function submit() {
    if(!content.trim()) return; setPosting(true);
    const payload={author_id:user.id,content:content.trim(),post_type:type};
    if(type==="photo"||type==="video") payload.media_url=mediaUrl.trim();
    if(type==="news"){payload.news_title=newsTitle.trim();payload.news_link=newsLink.trim();}
    await supabase.from("posts").insert(payload);
    setContent(""); setMediaUrl(""); setNewsTitle(""); setNewsLink("");
    setPosting(false); onPosted();
  }

  return (
    <div style={S.card}>
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {types.map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)} style={{ padding:"6px 12px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:type===t.id?"#1a1a1a":"#f0f0f0", color:type===t.id?"#fff":"#666", fontWeight:type===t.id?600:400 }}>{t.label} {t.id==="text"?"Texto":t.id==="photo"?"Foto":t.id==="video"?"Vídeo":"Noticia"}</button>
        ))}
      </div>
      {type==="news"&&<input style={{ ...S.input, marginBottom:8 }} placeholder="Título de la noticia" value={newsTitle} onChange={e=>setNewsTitle(e.target.value)} />}
      <textarea
        placeholder={type==="text"?"¿Qué hay en tu muñeca? Menciona @rolex_submariner para enlazar un reloj…":type==="photo"?"Describe la foto…":type==="video"?"Describe el vídeo…":"Resumen de la noticia…"}
        value={content} onChange={e=>setContent(e.target.value)}
        style={{ width:"100%", border:"none", outline:"none", resize:"none", fontSize:15, fontFamily:"'DM Sans',sans-serif", background:"transparent", color:"#1a1a1a", boxSizing:"border-box" }} rows={3}
      />
      {(type==="photo"||type==="video")&&<input style={{ ...S.input, marginTop:8 }} placeholder={type==="photo"?"URL de la imagen…":"URL del vídeo (YouTube...)"} value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} />}
      {type==="news"&&<input style={{ ...S.input, marginTop:8 }} placeholder="Link (opcional)" value={newsLink} onChange={e=>setNewsLink(e.target.value)} />}
      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:12, borderTop:"1px solid #f0f0f0", marginTop:10 }}>
        <button style={S.btn("primary")} onClick={submit} disabled={posting||!content.trim()}>{posting?"Publicando…":"Publicar"}</button>
      </div>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onNavigate }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count||0);
  const author=post.author;

  async function toggleLike() {
    if(liked){await supabase.from("likes").delete().match({user_id:currentUser.id,post_id:post.id});setLikes(l=>l-1);}
    else{await supabase.from("likes").insert({user_id:currentUser.id,post_id:post.id});setLikes(l=>l+1);}
    setLiked(!liked);
  }

  function getYouTubeId(url) { const m=url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/); return m?m[1]:null; }

  return (
    <div style={S.card}>
      <div style={{ ...S.row, marginBottom:12 }}>
        <div style={{ cursor:"pointer" }} onClick={()=>onNavigate("profile",author?.id)}>
          <Avatar name={author?.name||"?"} size={40} color={author?.avatar_color||"#1a1a1a"} emoji={author?.avatar_emoji||null} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:14, cursor:"pointer" }} onClick={()=>onNavigate("profile",author?.id)}>
            {author?.name}
            {author?.account_type==="repairer"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
            {author?.account_type==="brand"&&<Badge text="Marca" bg="#f0f6ff" color="#2563eb" />}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={S.muted}>@{author?.handle} · {timeAgo(post.created_at)}</span>
            {author?.location&&<span style={{ ...S.muted, fontSize:12 }}>· 📍{author.location}</span>}
          </div>
        </div>
      </div>

      {post.post_type==="news"&&post.news_title&&(
        <div style={{ background:"#f8f8f6", borderRadius:6, padding:"10px 14px", marginBottom:10 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{post.news_title}</div>
          {post.news_link&&<a href={post.news_link} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#2563eb" }}>Leer →</a>}
        </div>
      )}

      <p style={{ fontSize:15, lineHeight:1.65, margin:"0 0 12px" }}>{parseContent(post.content,onNavigate)}</p>

      {post.post_type==="photo"&&post.media_url&&(
        <div style={{ marginBottom:12, borderRadius:8, overflow:"hidden", background:"#f0f0f0" }}>
          <img src={post.media_url} alt="" style={{ width:"100%", maxHeight:400, objectFit:"cover", display:"block" }} onError={e=>e.target.style.display="none"} />
        </div>
      )}

      {post.post_type==="video"&&post.media_url&&(
        <div style={{ marginBottom:12 }}>
          {getYouTubeId(post.media_url) ? (
            <iframe width="100%" height="280" src={`https://www.youtube.com/embed/${getYouTubeId(post.media_url)}`} frameBorder="0" allowFullScreen style={{ borderRadius:8, display:"block" }} />
          ) : (
            <a href={post.media_url} target="_blank" rel="noreferrer" style={{ display:"block", padding:"12px 14px", background:"#f8f8f6", borderRadius:6, color:"#2563eb", fontSize:13 }}>🎬 Ver vídeo →</a>
          )}
        </div>
      )}

      {post.watch&&(
        <div style={{ background:"#f5f5f3", borderRadius:6, padding:"7px 12px", marginBottom:10, fontSize:12, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }} onClick={()=>onNavigate("watch",post.watch.slug)}>
          <span style={{ fontWeight:600 }}>🕐 {post.watch.model}</span>
          <span style={{ ...S.mono, color:"#aaa" }}>@{post.watch.slug}</span>
        </div>
      )}

      <div style={{ ...S.row, borderTop:"1px solid #f5f5f3", paddingTop:10, marginTop:4 }}>
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:liked?"#e11d48":"#888", fontFamily:"'DM Sans',sans-serif", padding:"0 8px 0 0", display:"flex", alignItems:"center", gap:4 }} onClick={toggleLike}>
          {liked?"♥":"♡"} {likes}
        </button>
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#888", fontFamily:"'DM Sans',sans-serif", padding:0, display:"flex", alignItems:"center", gap:4 }}>
          💬 {post.comments_count||0}
        </button>
      </div>
    </div>
  );
}

// ─── AI NEWS CARD ─────────────────────────────────────────────────────────────
function AINewsCard({ item }) {
  const icons={curiosidad:"🕰️",noticia:"📰",tecnico:"⚙️"};
  const labels={curiosidad:"Curiosidad del día",noticia:"Noticia",tecnico:"¿Sabías que?"};
  const colors={curiosidad:"#1a3a6b",noticia:"#006039",tecnico:"#8b0000"};
  const bg=colors[item.type]||"#1a1a1a";
  return (
    <div style={{ ...S.card, borderLeft:`4px solid ${bg}`, background:"#fefefe" }}>
      <div style={{ ...S.row, marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{icons[item.type]||"🕰️"}</div>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:bg }}>{labels[item.type]||"Wich Woch"}</div>
          <div style={S.muted}>Wich Woch · Hoy</div>
        </div>
      </div>
      <p style={{ fontSize:14, lineHeight:1.7, margin:0, color:"#333" }}>{item.content}</p>
    </div>
  );
}

// ─── BRAND NEWS CARD ──────────────────────────────────────────────────────────
function BrandNewsCard({ item, onNavigate }) {
  const bg=BRAND_COLORS[item.brand_slug]||"#1a1a1a";
  return (
    <div style={{ ...S.card, borderLeft:`4px solid ${bg}` }}>
      <div style={{ ...S.row, marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700, flexShrink:0 }}>
          {(item.brand_slug||"").slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight:600, fontSize:14, cursor:"pointer" }} onClick={()=>onNavigate("brand",item.brand_slug)}>
            {brandFromSlug(item.brand_slug)}
            <Badge text="Marca" bg="#f0f6ff" color="#2563eb" />
            {item.owners_only&&<Badge text="Propietarios" bg="#fff8e8" color="#b8860b" />}
          </div>
          <span style={S.muted}>{timeAgo(item.created_at)}</span>
        </div>
      </div>
      <div style={{ fontWeight:700, marginBottom:6 }}>{item.title}</div>
      <p style={{ fontSize:14, lineHeight:1.6, margin:0, color:"#444" }}>{item.content}</p>
    </div>
  );
}

// ─── FEED ─────────────────────────────────────────────────────────────────────
function FeedPage({ user, onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [brandNews, setBrandNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const aiNews = getDailyNews();

  useEffect(()=>{ loadAll(); },[tab]);

  async function loadAll() {
    setLoading(true);
    const [postsRes, bnRes] = await Promise.all([
      tab==="following"
        ? supabase.from("follows").select("following_id").eq("follower_id",user.id).then(async({data:follows})=>{
            const ids=(follows||[]).map(f=>f.following_id);
            if(!ids.length) return {data:[]};
            return supabase.from("posts").select("*, author:profiles(id,name,handle,account_type,avatar_color,avatar_emoji,location), watch:watches(id,slug,model)").in("author_id",ids).order("created_at",{ascending:false}).limit(20);
          })
        : supabase.from("posts").select("*, author:profiles(id,name,handle,account_type,avatar_color,avatar_emoji,location), watch:watches(id,slug,model)").order("created_at",{ascending:false}).limit(20),
      supabase.from("brand_news").select("*").eq("owners_only",false).order("created_at",{ascending:false}).limit(4),
    ]);
    setPosts(postsRes.data||[]);
    setBrandNews(bnRes.data||[]);
    setLoading(false);
  }

  function buildFeed() {
    const feed=[];
    aiNews.forEach(n=>feed.push({type:"ai",data:n}));
    let bi=0;
    (posts||[]).forEach((p,i)=>{
      feed.push({type:"post",data:p});
      if((i+1)%5===0&&bi<brandNews.length) feed.push({type:"brand",data:brandNews[bi++]});
    });
    while(bi<brandNews.length) feed.push({type:"brand",data:brandNews[bi++]});
    return feed;
  }

  return (
    <div>
      <PostComposer user={user} onPosted={loadAll} />
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        <button style={S.navLink(tab==="all")} onClick={()=>setTab("all")}>Todo</button>
        <button style={S.navLink(tab==="following")} onClick={()=>setTab("following")}>Siguiendo</button>
      </div>
      {loading?<Spinner />:buildFeed().map((item,i)=>{
        if(item.type==="post") return <PostCard key={`p-${item.data.id}`} post={item.data} currentUser={user} onNavigate={onNavigate} />;
        if(item.type==="ai") return <AINewsCard key={`ai-${i}`} item={item.data} />;
        if(item.type==="brand") return <BrandNewsCard key={`bn-${item.data.id}`} item={item.data} onNavigate={onNavigate} />;
        return null;
      })}
      {!loading&&buildFeed().length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:40 }}>{tab==="following"?"Sigue a alguien para ver sus posts.":"Aún no hay publicaciones."}</div>}
    </div>
  );
}

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
            <Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a1a1a"} emoji={u.avatar_emoji||null} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600 }}>{u.name}{u.verified&&<Badge text="Verificado" bg="#f0f6ff" color="#2563eb" />}</div>
              <div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div>
              {u.bio&&<p style={{ fontSize:13, color:"#666", margin:"4px 0 0" }}>{u.bio}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE (estilo Instagram) ───────────────────────────────────────────────
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
    const [
      {data:p},{data:po},{data:w},{data:wl},
      {data:f},{data:fList},{data:flList}
    ]=await Promise.all([
      supabase.from("profiles").select("*").eq("id",userId).single(),
      supabase.from("posts").select("*, author:profiles(id,name,handle,account_type,avatar_color,avatar_emoji,location), watch:watches(id,slug,model)").eq("author_id",userId).order("created_at",{ascending:false}).limit(20),
      supabase.from("watch_registrations").select("*, watch:watches(id,slug,model,reference)").eq("user_id",userId).eq("is_public",true),
      supabase.from("watch_wishlist").select("*, watch:watches(id,slug,model,reference)").eq("user_id",userId),
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
    if(isFollowing){await supabase.from("follows").delete().match({follower_id:currentUser.id,following_id:userId});setIsFollowing(false);setProfile(p=>({...p,followers_count:Math.max(0,(p.followers_count||1)-1)}));}
    else{await supabase.from("follows").insert({follower_id:currentUser.id,following_id:userId});setIsFollowing(true);setProfile(p=>({...p,followers_count:(p.followers_count||0)+1}));}
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

  const avatarColor = profile.avatar_color||"#1a1a1a";
  const avatarEmoji = profile.avatar_emoji||null;

  function WatchSearchBox({ toWishlist }) {
    return (
      <div style={{ ...S.card, border:"1px solid #1a1a1a", marginBottom:16 }}>
        <span style={S.label}>Busca el reloj</span>
        <input style={S.input} placeholder="Submariner, @rolex_daytona..." value={watchSearch}
          onChange={e=>{setWatchSearch(e.target.value);searchWatches(e.target.value);}} autoFocus />
        {watchSuggestions.length>0&&(
          <div style={{ border:"1px solid #e8e8e8", borderRadius:6, marginTop:4 }}>
            {watchSuggestions.map(w=>(
              <div key={w.id} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f5f5f5", display:"flex", justifyContent:"space-between" }} onMouseDown={()=>addWatch(w,toWishlist)}>
                <div><span style={{ fontWeight:600 }}>{w.model}</span><span style={{ ...S.mono, color:"#aaa", fontSize:11, marginLeft:8 }}>@{w.slug}</span></div>
                <span style={{ fontSize:12, color:"#2a7a4a" }}>+ Añadir</span>
              </div>
            ))}
          </div>
        )}
        <button style={{ ...S.btn("outline"), marginTop:10, fontSize:12 }} onClick={()=>{setShowAddWatch(false);setShowAddWish(false);setWatchSearch("");setWatchSuggestions([]);}}>Cancelar</button>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header estilo Instagram ── */}
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        {/* Banner de color */}
        <div style={{ height:100, background:`linear-gradient(135deg, ${avatarColor}dd, ${avatarColor}66)`, position:"relative" }} />

        {/* Avatar + info */}
        <div style={{ padding:"0 24px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:-40, marginBottom:16 }}>
            <div style={{ width:80, height:80, borderRadius:"50%", border:"4px solid #fff", overflow:"hidden", background:avatarColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:avatarEmoji?36:26, fontWeight:700, color:"#fff", fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
              {avatarEmoji||(profile.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div style={S.row}>
              {!isOwn&&<button style={S.btn(isFollowing?"outline":"primary")} onClick={toggleFollow} disabled={followLoading}>{followLoading?"…":isFollowing?"✓ Siguiendo":"Seguir"}</button>}
              {isOwn&&<button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("settings")}>⚙️ Ajustes</button>}
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:20, fontWeight:700 }}>{profile.name}</span>
              {profile.verified&&<Badge text="✓" bg="#2563eb" color="#fff" />}
              {profile.account_type==="repairer"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
              {profile.account_type==="brand"&&<Badge text="Marca" bg="#f0f6ff" color="#2563eb" />}
            </div>
            <div style={{ ...S.mono, fontSize:13, color:"#888", marginBottom:6 }}>@{profile.handle}</div>
            {profile.location&&<div style={{ fontSize:13, color:"#666", marginBottom:6 }}>📍 {profile.location}</div>}
            {profile.bio&&<p style={{ fontSize:14, color:"#444", lineHeight:1.6, margin:0 }}>{profile.bio}</p>}
            {profile.website&&<a href={profile.website} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#2563eb", display:"block", marginTop:4 }}>{profile.website.replace(/https?:\/\//,"")}</a>}
          </div>

          {/* Contadores */}
          <div style={{ display:"flex", gap:32, paddingTop:12, borderTop:"1px solid #f0f0f0" }}>
            <div style={{ textAlign:"center", cursor:"pointer" }} onClick={()=>setSubPage("followers")}>
              <div style={{ fontWeight:700, fontSize:18 }}>{profile.followers_count||0}</div>
              <div style={{ ...S.muted, fontSize:12, textDecoration:"underline" }}>seguidores</div>
            </div>
            <div style={{ textAlign:"center", cursor:"pointer" }} onClick={()=>setSubPage("following")}>
              <div style={{ fontWeight:700, fontSize:18 }}>{profile.following_count||0}</div>
              <div style={{ ...S.muted, fontSize:12, textDecoration:"underline" }}>siguiendo</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:18 }}>{watches.length}</div>
              <div style={{ ...S.muted, fontSize:12 }}>relojes</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:18 }}>{posts.length}</div>
              <div style={{ ...S.muted, fontSize:12 }}>posts</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pestañas ── */}
      <div style={{ display:"flex", gap:4, marginBottom:20, flexWrap:"wrap" }}>
        {[["posts",`Posts`],["coleccion",`Colección`],["wishlist",`Wish List`],["siguiendo","Siguiendo"],["seguidores","Seguidores"]].map(([id,label])=>(
          <button key={id} style={S.navLink(tab===id)} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── Contenido ── */}
      {tab==="posts"&&(
        <div>
          {posts.length===0&&<p style={S.muted}>Sin publicaciones aún.</p>}
          {posts.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onNavigate={onNavigate} />)}
        </div>
      )}

      {tab==="coleccion"&&(
        <div>
          {isOwn&&<div style={{ marginBottom:16 }}>{!showAddWatch?<button style={S.btn("outline")} onClick={()=>setShowAddWatch(true)}>+ Añadir reloj</button>:<WatchSearchBox toWishlist={false} />}</div>}
          {watches.length===0&&<p style={S.muted}>Colección vacía.</p>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {watches.map(w=>w.watch&&<WatchCard key={w.id} watch={w.watch} onClick={()=>onNavigate("watch",w.watch.slug)} />)}
          </div>
        </div>
      )}

      {tab==="wishlist"&&(
        <div>
          {isOwn&&<div style={{ marginBottom:16 }}>{!showAddWish?<button style={S.btn("outline")} onClick={()=>setShowAddWish(true)}>+ Añadir a Wish List</button>:<WatchSearchBox toWishlist={true} />}</div>}
          {wishlist.length===0&&<p style={S.muted}>Wish List vacía — añade relojes que te gustaría tener.</p>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {wishlist.map(w=>w.watch&&(
              <div key={w.id} style={{ position:"relative" }}>
                <WatchCard watch={w.watch} onClick={()=>onNavigate("watch",w.watch.slug)} />
                {isOwn&&<button style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:"50%", width:22, height:22, cursor:"pointer", fontSize:12 }} onClick={e=>{e.stopPropagation();removeWish(w.watch.id);}}>×</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="siguiendo"&&(
        <div>
          {followingList.length===0&&<p style={S.muted}>Aún no sigue a nadie.</p>}
          {followingList.map(u=>(
            <div key={u.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}>
              <div style={S.row}>
                <Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a1a1a"} emoji={u.avatar_emoji||null} />
                <div><div style={{ fontWeight:600 }}>{u.name}</div><div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="seguidores"&&(
        <div>
          {followers.length===0&&<p style={S.muted}>Aún no tiene seguidores.</p>}
          {followers.map(u=>(
            <div key={u.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}>
              <div style={S.row}>
                <Avatar name={u.name||"?"} size={46} color={u.avatar_color||"#1a1a1a"} emoji={u.avatar_emoji||null} />
                <div><div style={{ fontWeight:600 }}>{u.name}</div><div style={S.muted}>@{u.handle}{u.location&&` · 📍${u.location}`}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsPage({ user, onSaved }) {
  const [form, setForm] = useState({ name:"", bio:"", location:"", website:"", avatar_color:"#1a1a1a", avatar_emoji:"" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  useEffect(()=>{
    supabase.from("profiles").select("*").eq("id",user.id).single().then(({data})=>{
      if(data) setForm({ name:data.name||"", bio:data.bio||"", location:data.location||"", website:data.website||"", avatar_color:data.avatar_color||"#1a1a1a", avatar_emoji:data.avatar_emoji||"" });
      setLoading(false);
    });
  },[user]);

  async function save() {
    setSaving(true); setMsg(null);
    const {error}=await supabase.from("profiles").update({ name:form.name, bio:form.bio, location:form.location, website:form.website, avatar_color:form.avatar_color, avatar_emoji:form.avatar_emoji||null }).eq("id",user.id);
    if(error) setMsg({type:"error",text:error.message});
    else { setMsg({type:"success",text:"¡Ajustes guardados!"}); setTimeout(onSaved, 1500); }
    setSaving(false);
  }

  if(loading) return <Spinner />;

  const preview = form.avatar_emoji || (form.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom:6 }}>Ajustes</h2>
      <p style={{ ...S.muted, marginBottom:24 }}>Personaliza tu perfil</p>

      {msg&&<div style={msg.type==="success"?S.success:S.error}>{msg.text}</div>}

      {/* Preview avatar */}
      <div style={{ ...S.card, textAlign:"center", padding:32, marginBottom:20 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:form.avatar_color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:form.avatar_emoji?36:26, fontWeight:700, color:"#fff", margin:"0 auto 12px", fontFamily:"'DM Mono',monospace" }}>
          {preview}
        </div>
        <div style={{ fontWeight:600, fontSize:16 }}>{form.name||"Tu nombre"}</div>
        {form.location&&<div style={{ ...S.muted, marginTop:4 }}>📍 {form.location}</div>}
      </div>

      {/* Color avatar */}
      <div style={S.card}>
        <h3 style={{ ...S.h2, marginBottom:16 }}>Color del avatar</h3>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {AVATAR_COLORS.map(c=>(
            <div key={c} onClick={()=>setF("avatar_color",c)} style={{ width:36, height:36, borderRadius:"50%", background:c, cursor:"pointer", border:form.avatar_color===c?"3px solid #2563eb":"3px solid transparent", boxSizing:"border-box", transition:"transform 0.1s", transform:form.avatar_color===c?"scale(1.15)":"scale(1)" }} />
          ))}
        </div>
      </div>

      {/* Emoji avatar */}
      <div style={S.card}>
        <h3 style={{ ...S.h2, marginBottom:16 }}>Emoji del avatar <span style={{ fontWeight:400, color:"#888", fontSize:13 }}>(opcional)</span></h3>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
          <div onClick={()=>setF("avatar_emoji","")} style={{ width:44, height:44, borderRadius:"50%", background:form.avatar_color, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:!form.avatar_emoji?"3px solid #2563eb":"3px solid transparent", boxSizing:"border-box", fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'DM Mono',monospace" }}>AB</div>
          {AVATAR_EMOJIS.map(e=>(
            <div key={e} onClick={()=>setF("avatar_emoji",e)} style={{ width:44, height:44, borderRadius:"50%", background:form.avatar_color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, cursor:"pointer", border:form.avatar_emoji===e?"3px solid #2563eb":"3px solid transparent", boxSizing:"border-box" }}>{e}</div>
          ))}
        </div>
      </div>

      {/* Info personal */}
      <div style={S.card}>
        <h3 style={{ ...S.h2, marginBottom:16 }}>Información personal</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><span style={S.label}>Nombre</span><input style={S.input} placeholder="Tu nombre" value={form.name} onChange={e=>setF("name",e.target.value)} /></div>
          <div><span style={S.label}>Bio</span><textarea rows={3} style={{ ...S.input, resize:"none" }} placeholder="Cuéntanos sobre ti y tus relojes…" value={form.bio} onChange={e=>setF("bio",e.target.value)} /></div>
          <div><span style={S.label}>Ciudad</span><input style={S.input} placeholder="Madrid, Barcelona, Valencia…" value={form.location} onChange={e=>setF("location",e.target.value)} /></div>
          <div><span style={S.label}>Web</span><input style={S.input} placeholder="https://…" value={form.website} onChange={e=>setF("website",e.target.value)} /></div>
        </div>
      </div>

      <button style={{ ...S.btn("primary"), width:"100%", padding:14, fontSize:15 }} onClick={save} disabled={saving}>{saving?"Guardando…":"Guardar cambios"}</button>
    </div>
  );
}

// ─── RELOJES PAGE ─────────────────────────────────────────────────────────────
function RelojesPage({ onNavigate }) {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(()=>{ supabase.from("watches").select("*").order("brand_slug").then(({data})=>{ setWatches(data||[]); setLoading(false); }); },[]);
  const filtered=watches.filter(w=>w.model.toLowerCase().includes(search.toLowerCase())||(w.slug||"").includes(search.toLowerCase())||brandFromSlug(w.slug||"").toLowerCase().includes(search.toLowerCase()));
  const byBrand=filtered.reduce((acc,w)=>{ const b=brandFromSlug(w.slug||""); if(!acc[b]) acc[b]=[]; acc[b].push(w); return acc; },{});
  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom:6 }}>Relojes</h2>
      <p style={{ ...S.muted, marginBottom:20 }}>Los modelos más icónicos de la relojería</p>
      <input style={{ ...S.input, marginBottom:24 }} placeholder="Busca por marca o modelo…" value={search} onChange={e=>setSearch(e.target.value)} />
      {loading?<Spinner />:Object.entries(byBrand).map(([brand,ws])=>(
        <div key={brand} style={{ marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <h3 style={{ fontSize:13, fontWeight:700, fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:"uppercase", color:"#666", margin:0 }}>{brand}</h3>
            <span style={{ fontSize:11, color:"#bbb", fontFamily:"'DM Mono',monospace", cursor:"pointer" }} onClick={()=>onNavigate("brand",ws[0]?.brand_slug)}>@{ws[0]?.brand_slug} →</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
            {ws.map(w=><WatchCard key={w.id} watch={w} onClick={()=>onNavigate("watch",w.slug)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BRAND PAGE ───────────────────────────────────────────────────────────────
function BrandPage({ brandSlug, currentUser, onNavigate }) {
  const [brand, setBrand] = useState(null);
  const [watches, setWatches] = useState([]);
  const [news, setNews] = useState([]);
  const [tab, setTab] = useState("relojes");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({title:"",content:"",owners_only:false});
  const [posting, setPosting] = useState(false);

  useEffect(()=>{ load(); },[brandSlug]);

  async function load() {
    setLoading(true);
    const [{data:b},{data:w},{data:n},{data:profile}]=await Promise.all([
      supabase.from("brand_pages").select("*").eq("slug",brandSlug).single(),
      supabase.from("watches").select("*").eq("brand_slug",brandSlug).order("model"),
      supabase.from("brand_news").select("*").eq("brand_slug",brandSlug).order("created_at",{ascending:false}),
      supabase.from("profiles").select("account_type,handle").eq("id",currentUser.id).single(),
    ]);
    setBrand(b); setWatches(w||[]); setNews(n||[]);
    setIsOwner(profile?.account_type==="brand"&&profile?.handle===brandSlug);
    setLoading(false);
  }

  async function postNews() {
    if(!newsForm.title.trim()||!newsForm.content.trim()) return; setPosting(true);
    await supabase.from("brand_news").insert({brand_slug:brandSlug,author_id:currentUser.id,title:newsForm.title.trim(),content:newsForm.content.trim(),owners_only:newsForm.owners_only});
    setNewsForm({title:"",content:"",owners_only:false}); setShowNewsForm(false); await load(); setPosting(false);
  }

  if(loading) return <Spinner />;
  if(!brand) return <div style={S.muted}>Marca no encontrada.</div>;
  const bg=BRAND_COLORS[brandSlug]||"#1a1a1a";

  return (
    <div>
      <div style={{ height:140, background:`linear-gradient(135deg, ${bg}, ${bg}aa)`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, marginBottom:0 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:30, color:"#fff", fontWeight:700, letterSpacing:-1 }}>{brand.name}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"rgba(255,255,255,0.5)" }}>@{brand.slug}</div>
      </div>
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none", marginBottom:20 }}>
        <p style={{ fontSize:14, color:"#555", lineHeight:1.65, margin:"0 0 14px" }}>{brand.description}</p>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <span style={S.muted}>📍 {brand.country}</span>
          <span style={S.muted}>🏛 Est. {brand.founded}</span>
          {brand.website&&<a href={brand.website} target="_blank" rel="noreferrer" style={{ ...S.muted, color:"#2563eb" }}>🌐 Web oficial</a>}
        </div>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        <button style={S.navLink(tab==="relojes")} onClick={()=>setTab("relojes")}>Relojes ({watches.length})</button>
        <button style={S.navLink(tab==="novedades")} onClick={()=>setTab("novedades")}>Novedades ({news.length})</button>
      </div>
      {tab==="relojes"&&(
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12 }}>
          {watches.map(w=><WatchCard key={w.id} watch={w} onClick={()=>onNavigate("watch",w.slug)} />)}
        </div>
      )}
      {tab==="novedades"&&(
        <div>
          {isOwner&&(
            <div style={{ marginBottom:16 }}>
              {!showNewsForm?<button style={S.btn("primary")} onClick={()=>setShowNewsForm(true)}>+ Publicar novedad</button>:(
                <div style={{ ...S.card, border:"1px solid #1a1a1a" }}>
                  <h3 style={{ ...S.h2, marginBottom:16 }}>Nueva novedad</h3>
                  <div style={{ marginBottom:12 }}><span style={S.label}>Título</span><input style={S.input} value={newsForm.title} onChange={e=>setNewsForm(f=>({...f,title:e.target.value}))} /></div>
                  <div style={{ marginBottom:12 }}><span style={S.label}>Contenido</span><textarea rows={4} style={{ ...S.input, resize:"none" }} value={newsForm.content} onChange={e=>setNewsForm(f=>({...f,content:e.target.value}))} /></div>
                  <div style={{ ...S.row, justifyContent:"space-between" }}>
                    <label style={{ ...S.row, gap:8, fontSize:13, cursor:"pointer" }}><input type="checkbox" checked={newsForm.owners_only} onChange={e=>setNewsForm(f=>({...f,owners_only:e.target.checked}))} /> Solo propietarios</label>
                    <div style={S.row}><button style={S.btn("outline")} onClick={()=>setShowNewsForm(false)}>Cancelar</button><button style={S.btn("primary")} onClick={postNews} disabled={posting}>{posting?"Publicando…":"Publicar"}</button></div>
                  </div>
                </div>
              )}
            </div>
          )}
          {news.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin novedades aún.</div>}
          {news.map(n=>(
            <div key={n.id} style={S.card}>
              <div style={{ ...S.row, justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontWeight:700 }}>{n.title}</div>
                <div style={{ display:"flex", gap:6 }}>{n.owners_only&&<Badge text="Propietarios" bg="#fff8e8" color="#b8860b" />}<span style={S.muted}>{timeAgo(n.created_at)}</span></div>
              </div>
              <p style={{ fontSize:14, color:"#444", lineHeight:1.6, margin:0 }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WATCH PAGE ───────────────────────────────────────────────────────────────
function WatchPage({ slug, currentUser, onNavigate }) {
  const [watch, setWatch] = useState(null);
  const [threads, setThreads] = useState([]);
  const [news, setNews] = useState([]);
  const [tab, setTab] = useState("info");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ load(); },[slug]);

  async function load() {
    setLoading(true);
    const {data:w}=await supabase.from("watches").select("*").eq("slug",slug).single();
    setWatch(w);
    if(w) {
      const [{data:t},{data:n}]=await Promise.all([
        supabase.from("forum_threads").select("*, author:profiles(id,name,handle)").eq("watch_id",w.id).order("votes",{ascending:false}).limit(10),
        supabase.from("brand_news").select("*").eq("brand_slug",w.brand_slug||"").order("created_at",{ascending:false}).limit(10),
      ]);
      setThreads(t||[]); setNews(n||[]);
    }
    setLoading(false);
  }

  if(loading) return <Spinner />;
  if(!watch) return <div style={S.muted}>Reloj no encontrado.</div>;
  const bg=brandColor(watch.slug);
  const specs=watch.specs||{};

  return (
    <div>
      <div style={{ height:140, background:`linear-gradient(135deg, ${bg}, ${bg}88)`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6, marginBottom:0 }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:3, textTransform:"uppercase", cursor:"pointer" }} onClick={()=>onNavigate("brand",watch.brand_slug)}>@{watch.brand_slug} →</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:24, color:"#fff", fontWeight:700 }}>{watch.model}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.45)" }}>@{watch.slug}</div>
      </div>
      <div style={{ ...S.card, borderTopLeftRadius:0, borderTopRightRadius:0, borderTop:"none", marginBottom:20 }}>
        <span style={{ ...S.mono, fontSize:13, color:"#888" }}>Ref. {watch.reference}{watch.year?` · ${watch.year}`:""}</span>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        <button style={S.navLink(tab==="info")} onClick={()=>setTab("info")}>Info</button>
        <button style={S.navLink(tab==="foros")} onClick={()=>setTab("foros")}>Foros ({threads.length})</button>
        <button style={S.navLink(tab==="novedades")} onClick={()=>setTab("novedades")}>Novedades ({news.length})</button>
      </div>
      {tab==="info"&&(
        <div style={S.card}>
          {Object.keys(specs).length>0?(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {Object.entries(specs).map(([k,v])=>(
                <div key={k} style={{ background:"#f8f8f6", borderRadius:6, padding:"10px 14px" }}>
                  <div style={S.label}>{k.replace(/_/g," ")}</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
          ):<p style={S.muted}>Sin especificaciones técnicas aún.</p>}
        </div>
      )}
      {tab==="foros"&&(
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <button style={S.btn("primary")} onClick={()=>onNavigate("foros")}>+ Crear foro</button>
          </div>
          {threads.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin foros aún. ¡Crea el primero!</div>}
          {threads.map(t=>(
            <div key={t.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("thread",t.id)}>
              <div style={{ display:"flex", gap:14 }}>
                <div style={{ minWidth:36, textAlign:"center" }}>
                  <div style={{ fontWeight:700, fontSize:15, fontFamily:"'DM Mono',monospace", color:t.votes>0?"#2a7a4a":t.votes<0?"#d44":"#888" }}>{t.votes}</div>
                  <div style={{ fontSize:10, color:"#aaa" }}>pts</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, marginBottom:4 }}>{t.title}</div>
                  <div style={{ display:"flex", gap:16 }}><span style={S.muted}>@{t.author?.handle}</span><span style={S.muted}>💬 {t.replies_count||0}</span><span style={S.muted}>{timeAgo(t.created_at)}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==="novedades"&&(
        <div>
          {news.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin novedades de {brandFromSlug(watch.slug)} aún.</div>}
          {news.map(n=>(
            <div key={n.id} style={S.card}>
              <div style={{ ...S.row, justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontWeight:700 }}>{n.title}</div>
                <span style={S.muted}>{timeAgo(n.created_at)}</span>
              </div>
              <p style={{ fontSize:14, color:"#444", lineHeight:1.6, margin:0 }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FOROS PAGE ───────────────────────────────────────────────────────────────
function ForosPage({ currentUser, onNavigate }) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentThreads, setRecentThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({watchQuery:"",watchId:null,watchSlug:"",title:"",content:""});
  const [watchSuggestions, setWatchSuggestions] = useState([]);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  useEffect(()=>{ loadRecent(); },[]);

  async function loadRecent() {
    setLoading(true);
    const {data}=await supabase.from("forum_threads").select("*, author:profiles(id,name,handle), watch:watches(id,slug,model)").order("created_at",{ascending:false}).limit(20);
    setRecentThreads(data||[]); setLoading(false);
  }

  async function searchW(q, forNew=false) {
    if(!q||q.length<2){forNew?setWatchSuggestions([]):setSuggestions([]);return;}
    const {data}=await supabase.from("watches").select("id,slug,model").or(`slug.ilike.%${q.replace(/^@/,"")}%,model.ilike.%${q.replace(/^@/,"")}%`).limit(6);
    forNew?setWatchSuggestions(data||[]):setSuggestions(data||[]);
  }

  async function submitThread() {
    setPostError(null);
    if(!newForm.watchId){setPostError("Selecciona un reloj.");return;}
    if(!newForm.title.trim()){setPostError("Escribe un título.");return;}
    if(!newForm.content.trim()){setPostError("Escribe el contenido.");return;}
    setPosting(true);
    const {error}=await supabase.from("forum_threads").insert({watch_id:newForm.watchId,author_id:currentUser.id,title:newForm.title.trim(),content:newForm.content.trim(),is_news:false});
    if(error){setPostError(error.message);setPosting(false);return;}
    setNewForm({watchQuery:"",watchId:null,watchSlug:"",title:"",content:""});
    setShowNew(false); await loadRecent(); setPosting(false);
  }

  return (
    <div>
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20 }}>
        <div><h2 style={{ ...S.h1, marginBottom:4 }}>Foros</h2><p style={S.muted}>Debates sobre relojes concretos</p></div>
        <button style={S.btn("primary")} onClick={()=>setShowNew(!showNew)}>+ Nuevo foro</button>
      </div>
      <div style={{ position:"relative", marginBottom:24 }}>
        <input style={{ ...S.input, paddingLeft:36 }} placeholder="Busca @rolex_submariner…" value={search} onChange={e=>{setSearch(e.target.value);searchW(e.target.value);}} />
        <span style={{ position:"absolute", left:12, top:10, color:"#888" }}>🔍</span>
        {suggestions.length>0&&(
          <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e8e8e8", borderRadius:6, boxShadow:"0 4px 12px rgba(0,0,0,0.08)", zIndex:50 }}>
            {suggestions.map(w=>(
              <div key={w.id} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f5f5f5" }} onMouseDown={()=>{setSearch("");setSuggestions([]);onNavigate("watch",w.slug);}}>
                <span style={{ fontWeight:600 }}>{w.model}</span><span style={{ ...S.mono, color:"#aaa", fontSize:11, marginLeft:8 }}>@{w.slug}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {showNew&&(
        <div style={{ ...S.card, border:"1px solid #1a1a1a", marginBottom:24 }}>
          <h3 style={{ ...S.h2, marginBottom:16 }}>Nuevo foro</h3>
          {postError&&<div style={S.error}>{postError}</div>}
          <div style={{ marginBottom:12, position:"relative" }}>
            <span style={S.label}>Reloj</span>
            <input style={S.input} placeholder="@rolex_submariner o nombre del modelo…" value={newForm.watchQuery} onChange={e=>{setNewForm(f=>({...f,watchQuery:e.target.value,watchId:null,watchSlug:""}));searchW(e.target.value,true);}} />
            {newForm.watchId&&<div style={{ marginTop:5, fontSize:12, color:"#2a7a4a", fontFamily:"'DM Mono',monospace" }}>✓ @{newForm.watchSlug}</div>}
            {watchSuggestions.length>0&&!newForm.watchId&&(
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e8e8e8", borderRadius:6, boxShadow:"0 4px 12px rgba(0,0,0,0.08)", zIndex:50, marginTop:2 }}>
                {watchSuggestions.map(w=>(
                  <div key={w.id} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f5f5f5" }} onMouseDown={()=>{setNewForm(f=>({...f,watchQuery:`@${w.slug}`,watchId:w.id,watchSlug:w.slug}));setWatchSuggestions([]);}}>
                    <span style={{ fontWeight:600 }}>{w.model}</span><span style={{ ...S.mono, color:"#aaa", fontSize:11, marginLeft:8 }}>@{w.slug}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom:12 }}>
            <span style={S.label}>Título</span>
            <input style={S.input} placeholder="ej: ¿Vale la pena al precio actual?" value={newForm.title} onChange={e=>setNewForm(f=>({...f,title:e.target.value}))} />
            {newForm.watchSlug&&newForm.title&&<div style={{ marginTop:5, fontSize:11, color:"#bbb", fontFamily:"'DM Mono',monospace" }}>@{newForm.watchSlug}/{newForm.title.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"").slice(0,30)}</div>}
          </div>
          <div style={{ marginBottom:16 }}><span style={S.label}>Contenido</span><textarea rows={4} style={{ ...S.input, resize:"none" }} value={newForm.content} onChange={e=>setNewForm(f=>({...f,content:e.target.value}))} /></div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button style={S.btn("outline")} onClick={()=>{setShowNew(false);setPostError(null);}}>Cancelar</button>
            <button style={S.btn("primary")} onClick={submitThread} disabled={posting}>{posting?"Publicando…":"Crear foro"}</button>
          </div>
        </div>
      )}
      <h3 style={{ ...S.h2, marginBottom:12 }}>Foros recientes</h3>
      {loading?<Spinner />:recentThreads.map(t=>(
        <div key={t.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("thread",t.id)}>
          <div style={{ display:"flex", gap:14 }}>
            <div style={{ minWidth:36, textAlign:"center" }}>
              <div style={{ fontWeight:700, fontSize:15, fontFamily:"'DM Mono',monospace", color:t.votes>0?"#2a7a4a":t.votes<0?"#d44":"#888" }}>{t.votes}</div>
              <div style={{ fontSize:10, color:"#aaa" }}>pts</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ ...S.mono, fontSize:11, color:"#aaa", marginBottom:3 }}>@{t.watch?.slug}</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{t.title}</div>
              <div style={{ display:"flex", gap:16 }}><span style={S.muted}>@{t.author?.handle}</span><span style={S.muted}>💬 {t.replies_count||0}</span><span style={S.muted}>{timeAgo(t.created_at)}</span></div>
            </div>
          </div>
        </div>
      ))}
      {!loading&&recentThreads.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin foros aún.</div>}
    </div>
  );
}

// ─── THREAD PAGE ──────────────────────────────────────────────────────────────
function ThreadPage({ threadId, currentUser, onNavigate }) {
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(()=>{ load(); },[threadId]);

  async function load() {
    setLoading(true);
    const {data:t}=await supabase.from("forum_threads").select("*, author:profiles(id,name,handle,avatar_color,avatar_emoji), watch:watches(id,slug,model)").eq("id",threadId).single();
    setThread(t);
    const {data:r}=await supabase.from("forum_replies").select("*, author:profiles(id,name,handle,account_type,avatar_color,avatar_emoji)").eq("thread_id",threadId).order("votes",{ascending:false});
    setReplies(r||[]); setLoading(false);
  }

  async function submitReply() {
    if(!content.trim()) return; setPosting(true);
    await supabase.from("forum_replies").insert({thread_id:threadId,author_id:currentUser.id,content:content.trim()});
    setContent(""); await load(); setPosting(false);
  }

  async function vote(type,id,value) {
    const table=type==="thread"?"thread_votes":"reply_votes";
    const field=type==="thread"?"thread_id":"reply_id";
    const {data:ex}=await supabase.from(table).select("*").eq(field,id).eq("user_id",currentUser.id).maybeSingle();
    if(ex){await supabase.from(table).delete().match({[field]:id,user_id:currentUser.id});if(ex.value!==value) await supabase.from(table).insert({[field]:id,user_id:currentUser.id,value});}
    else await supabase.from(table).insert({[field]:id,user_id:currentUser.id,value});
    await load();
  }

  if(loading) return <Spinner />;
  if(!thread) return <div style={S.muted}>Hilo no encontrado.</div>;

  return (
    <div>
      <button style={{ ...S.btn("outline"), marginBottom:16, fontSize:12 }} onClick={()=>onNavigate("watch",thread.watch?.slug)}>← @{thread.watch?.slug}</button>
      <div style={S.card}>
        <div style={{ ...S.mono, fontSize:11, color:"#bbb", marginBottom:8 }}>@{thread.watch?.slug} / {thread.title.toLowerCase().replace(/\s+/g,"_").slice(0,30)}</div>
        <h2 style={{ ...S.h1, marginBottom:10 }}>{thread.title}</h2>
        <div style={{ ...S.row, marginBottom:14 }}>
          <Avatar name={thread.author?.name||"?"} size={30} color={thread.author?.avatar_color||"#1a1a1a"} emoji={thread.author?.avatar_emoji||null} />
          <span style={S.muted}>@{thread.author?.handle} · {timeAgo(thread.created_at)}</span>
        </div>
        <p style={{ fontSize:15, lineHeight:1.65, margin:"0 0 16px" }}>{thread.content}</p>
        <div style={S.row}>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#888", padding:"0 4px" }} onClick={()=>vote("thread",threadId,1)}>▲</button>
          <span style={{ fontWeight:700, fontFamily:"'DM Mono',monospace", color:thread.votes>0?"#2a7a4a":thread.votes<0?"#d44":"#888" }}>{thread.votes}</span>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#888", padding:"0 4px" }} onClick={()=>vote("thread",threadId,-1)}>▼</button>
          <span style={{ ...S.muted, marginLeft:8 }}>· {thread.replies_count||0} respuestas</span>
        </div>
      </div>
      <div style={S.card}>
        <span style={S.label}>Tu respuesta</span>
        <textarea rows={3} style={{ ...S.input, resize:"none", marginBottom:10 }} placeholder="Escribe tu respuesta…" value={content} onChange={e=>setContent(e.target.value)} />
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button style={S.btn("primary")} onClick={submitReply} disabled={posting||!content.trim()}>{posting?"Publicando…":"Responder"}</button>
        </div>
      </div>
      {replies.map(r=>(
        <div key={r.id} style={{ ...S.card, display:"flex", gap:14 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:36 }}>
            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#888", padding:0 }} onClick={()=>vote("reply",r.id,1)}>▲</button>
            <span style={{ fontWeight:700, fontSize:13, fontFamily:"'DM Mono',monospace", color:r.votes>0?"#2a7a4a":r.votes<0?"#d44":"#888" }}>{r.votes}</span>
            <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#888", padding:0 }} onClick={()=>vote("reply",r.id,-1)}>▼</button>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ ...S.row, marginBottom:8 }}>
              <Avatar name={r.author?.name||"?"} size={28} color={r.author?.avatar_color||"#1a1a1a"} emoji={r.author?.avatar_emoji||null} />
              <span style={{ fontWeight:600, fontSize:13 }}>@{r.author?.handle}</span>
              {r.author?.account_type==="repairer"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
              <span style={S.muted}>{timeAgo(r.created_at)}</span>
            </div>
            <p style={{ fontSize:14, lineHeight:1.6, margin:0 }}>{r.content}</p>
          </div>
        </div>
      ))}
      {replies.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888" }}>Sé el primero en responder.</div>}
    </div>
  );
}

// ─── EXPLORE ──────────────────────────────────────────────────────────────────
function ExplorePage({ onNavigate }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  useEffect(()=>{ load(); },[tab]);
  async function load() {
    setLoading(true);
    let q=supabase.from("profiles").select("*").order("followers_count",{ascending:false}).limit(20);
    if(tab!=="all") q=q.eq("account_type",tab);
    const {data}=await q; setProfiles(data||[]); setLoading(false);
  }
  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom:6 }}>Explorar</h2>
      <p style={{ ...S.muted, marginBottom:20 }}>Descubre marcas, talleres y coleccionistas</p>
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {[["all","Todos"],["collector","Coleccionistas"],["brand","Marcas"],["repairer","Talleres"]].map(([v,label])=><button key={v} style={S.navLink(tab===v)} onClick={()=>setTab(v)}>{label}</button>)}
      </div>
      {loading?<Spinner />:profiles.map(p=>(
        <div key={p.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>onNavigate("profile",p.id)}>
          <div style={S.row}>
            <Avatar name={p.name} size={48} color={p.avatar_color||"#1a1a1a"} emoji={p.avatar_emoji||null} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600 }}>{p.name}{p.verified&&<Badge text="✓" bg="#2563eb" color="#fff" />}{p.account_type==="repairer"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}{p.account_type==="brand"&&<Badge text="Marca" bg="#f5f0ff" color="#7c3aed" />}</div>
              <div style={S.muted}>@{p.handle}{p.location&&` · 📍${p.location}`}</div>
              {p.bio&&<p style={{ fontSize:13, color:"#555", margin:"4px 0 0", lineHeight:1.4 }}>{p.bio.slice(0,80)}{p.bio.length>80?"…":""}</p>}
            </div>
            <div style={{ textAlign:"right" }}><div style={{ fontWeight:700 }}>{p.followers_count||0}</div><div style={S.muted}>seg.</div></div>
          </div>
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

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); if(session) loadProfile(session.user.id); setAuthChecked(true); });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{ setSession(session); if(session) loadProfile(session.user.id); else setProfile(null); });
    return ()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(uid) { const {data}=await supabase.from("profiles").select("*").eq("id",uid).single(); setProfile(data); }
  const navigate=(name,id=null)=>setPage({name,id});
  async function signOut() { await supabase.auth.signOut(); setSession(null); setProfile(null); setPage({name:"feed"}); }

  if(!authChecked) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ fontFamily:"'DM Mono',monospace", color:"#888" }}>Cargando…</div>
    </div>
  );
  if(!session) return <AuthPage />;

  const NAV=[{id:"feed",label:"Feed"},{id:"relojes",label:"Relojes"},{id:"foros",label:"Foros"},{id:"explore",label:"Explorar"}];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <nav style={S.nav}>
        <span style={S.logo} onClick={()=>navigate("feed")}>WICH WOCH</span>
        <div style={{ display:"flex", gap:4 }}>{NAV.map(n=><button key={n.id} style={S.navLink(page.name===n.id)} onClick={()=>navigate(n.id)}>{n.label}</button>)}</div>
        <div style={S.row}>
          <div style={{ cursor:"pointer" }} onClick={()=>navigate("profile",session.user.id)}>
            <Avatar name={profile?.name||session.user.email} size={34} color={profile?.avatar_color||"#1a1a1a"} emoji={profile?.avatar_emoji||null} />
          </div>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, padding:"0 4px" }} onClick={()=>navigate("settings")} title="Ajustes">⚙️</button>
          <button style={{ ...S.btn("outline"), padding:"5px 12px", fontSize:12 }} onClick={signOut}>Salir</button>
        </div>
      </nav>
      <main style={S.main}>
        {page.name==="feed"&&<FeedPage user={session.user} onNavigate={navigate} />}
        {page.name==="relojes"&&<RelojesPage onNavigate={navigate} />}
        {page.name==="foros"&&<ForosPage currentUser={session.user} onNavigate={navigate} />}
        {page.name==="explore"&&<ExplorePage onNavigate={navigate} />}
        {page.name==="watch"&&<WatchPage slug={page.id} currentUser={session.user} onNavigate={navigate} />}
        {page.name==="brand"&&<BrandPage brandSlug={page.id} currentUser={session.user} onNavigate={navigate} />}
        {page.name==="thread"&&<ThreadPage threadId={page.id} currentUser={session.user} onNavigate={navigate} />}
        {page.name==="profile"&&<ProfilePage userId={page.id} currentUser={session.user} onNavigate={navigate} />}
        {page.name==="settings"&&<SettingsPage user={session.user} onSaved={()=>{ loadProfile(session.user.id); navigate("profile",session.user.id); }} />}
      </main>
    </div>
  );
}
