import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandFromSlug } from "../data/constants";
import { Spinner, WatchCard } from "../components/UI";

function RelojesPage({ onNavigate }) {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  useEffect(()=>{ supabase.from("watches").select("id,slug,model,reference,brand_slug,image_url,market_price,watch_type").order("brand_slug").then(({data})=>{ setWatches(data||[]); setLoading(false); }); },[]);
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
