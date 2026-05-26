import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandFromSlug } from "../data/constants";
import { Spinner, WatchCard } from "../components/UI";

export function RelojesPage({ onNavigate, currentUser }) {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(()=>{
    let q = supabase.from("watches").select("id,slug,model,reference,brand_slug,image_url,market_price,watch_type,gender").eq("status","approved").order("brand_slug");
    q.then(({data})=>{ setWatches(data||[]); setLoading(false); });
  },[]);

  const filtered = watches.filter(w=>{
    const matchSearch = w.model.toLowerCase().includes(search.toLowerCase())||(w.slug||"").includes(search.toLowerCase())||brandFromSlug(w.slug||"").toLowerCase().includes(search.toLowerCase());
    const matchGender = !filterGender || w.gender===filterGender || w.gender==="unisex" || !w.gender;
    const matchType = !filterType || w.watch_type===filterType;
    return matchSearch && matchGender && matchType;
  });

  const byBrand=filtered.reduce((acc,w)=>{ const b=brandFromSlug(w.slug||""); if(!acc[b]) acc[b]=[]; acc[b].push(w); return acc; },{});
  const types = [...new Set(watches.map(w=>w.watch_type).filter(Boolean))];

  return (
    <div>
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:6 }}>
        <h2 style={{ ...S.h1, marginBottom:0 }}>Relojes</h2>
        {currentUser&&<button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("create-watch")}>+ Proponer reloj</button>}
      </div>
      <p style={{ ...S.muted, marginBottom:16 }}>Los modelos más icónicos de la relojería</p>

      <input style={{ ...S.input, marginBottom:12 }} placeholder="Busca por marca o modelo…" value={search} onChange={e=>setSearch(e.target.value)} />

      {/* Filtros género y tipo */}
      <div style={{ display:"flex", gap:6, marginBottom:24, flexWrap:"wrap" }}>
        {[["","Todos"],["hombre","Hombre"],["mujer","Mujer"]].map(([v,label])=>(
          <button key={v} onClick={()=>setFilterGender(v)} style={{ padding:"4px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif", background:filterGender===v?"#1a2744":"#f0ede6", color:filterGender===v?"#fff":"#666" }}>{label}</button>
        ))}
        <div style={{ width:1, background:"#ddd", margin:"0 4px" }} />
        {types.map(t=>(
          <button key={t} onClick={()=>setFilterType(filterType===t?"":t)} style={{ padding:"4px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontFamily:"'DM Mono',monospace", background:filterType===t?"#1a2744":"#f0ede6", color:filterType===t?"#fff":"#888", textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>
      {loading?<Spinner />:Object.entries(byBrand).map(([brand,ws])=>(
        <div key={brand} style={{ marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <h3 style={{ fontSize:13, fontWeight:700, fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:"uppercase", color:"#666", margin:0 }}>{brand}</h3>
            <span style={{ fontSize:11, color:"#b8963e", fontFamily:"'DM Mono',monospace", cursor:"pointer" }} onClick={()=>onNavigate("brand",ws[0]?.brand_slug)}>@{ws[0]?.brand_slug} →</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
            {ws.map(w=><WatchCard key={w.id} watch={w} onClick={()=>onNavigate("watch",w.slug)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BRAND PAGE ───────────────────────────────────────────────────────────────
