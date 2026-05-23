import { useState } from "react";
import { S, brandColor, brandFromSlug, timeAgo } from "../data/constants";

export function Badge({ text, bg="#f0f0f0", color="#1a1a1a" }) {
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", padding:"2px 8px", background:bg, color, borderRadius:3, fontFamily:"'DM Mono',monospace", marginLeft:6 }}>{text}</span>;
}

export function Avatar({ name="?", size=36, color="#1a2744", emoji=null }) {
  const i = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:emoji?size*0.5:size*0.35, fontWeight:700, flexShrink:0, fontFamily:"'DM Mono',monospace" }}>{emoji||i}</div>;
}

export function Spinner() {
  return <div style={{ textAlign:"center", padding:40, color:"#888", fontFamily:"'DM Mono',monospace", fontSize:13 }}>Cargando…</div>;
}

export function Logo({ height=36 }) {
  return <img src="/logo.png" height={height} alt="Wich Woch" style={{ display:"block" }} />;
}

export function FlairBadge({ flair }) {
  const FLAIRS = [
    { id:"debate", label:"Debate", bg:"#e8f0ff", color:"#2563eb" },
    { id:"pregunta", label:"Pregunta", bg:"#fef3c7", color:"#d97706" },
    { id:"valoracion", label:"Valoración", bg:"#f0fdf4", color:"#16a34a" },
    { id:"coleccion", label:"Colección", bg:"#fdf2f8", color:"#9333ea" },
    { id:"mantenimiento", label:"Mantenimiento", bg:"#fff7ed", color:"#ea580c" },
    { id:"compraventa", label:"Compraventa", bg:"#f0f9ff", color:"#0284c7" },
    { id:"novedad", label:"Novedad", bg:"#fef2f2", color:"#dc2626" },
  ];
  const f = FLAIRS.find(fl=>fl.id===flair) || FLAIRS[0];
  return <span style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", padding:"2px 8px", background:f.bg, color:f.color, borderRadius:20, fontFamily:"'DM Mono',monospace", marginRight:6 }}>{f.label}</span>;
}

export function StarRating({ value, onChange, size=20, readonly=false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(i=>(
        <span key={i} style={{ fontSize:size, cursor:readonly?"default":"pointer", color:i<=(hover||value)?"#f59e0b":"#e2e8f0", lineHeight:1 }}
          onClick={()=>!readonly&&onChange&&onChange(i)}
          onMouseEnter={()=>!readonly&&setHover(i)}
          onMouseLeave={()=>!readonly&&setHover(0)}>★</span>
      ))}
    </div>
  );
}

export function WatchCard({ watch, onClick, size="normal" }) {
  const bg = brandColor(watch.slug);
  const [imgError, setImgError] = useState(false);
  const h = size==="large" ? 160 : 110;
  return (
    <div style={{ cursor:"pointer", borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", transition:"transform 0.15s, box-shadow 0.15s" }}
      onClick={onClick}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)"; }}>
      <div style={{ height:h, background:`linear-gradient(135deg, ${bg}, ${bg}cc)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
        {watch.image_url && !imgError ? (
          <img src={watch.image_url} alt={watch.model} style={{ height:"90%", objectFit:"contain", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={()=>setImgError(true)} />
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:size==="large"?32:22, marginBottom:4 }}>⌚</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:size==="large"?15:12, color:"#fff", fontWeight:700 }}>{watch.model}</div>
          </div>
        )}
        <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,0.4)", borderRadius:4, padding:"2px 8px", fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.8)", letterSpacing:1.5, textTransform:"uppercase" }}>{brandFromSlug(watch.slug)}</div>
      </div>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontWeight:700, fontSize:size==="large"?15:13, marginBottom:2 }}>{watch.model}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#aaa", marginBottom:4 }}>Ref. {watch.reference}</div>
        <div style={{ fontSize:10, color:"#c8a84b", fontFamily:"'DM Mono',monospace" }}>@{watch.slug}</div>
      </div>
    </div>
  );
}
