import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug } from "../data/constants";
import { Avatar, Spinner } from "../components/UI";

export function RankingPage({ currentUser, onNavigate }) {
  const [tab, setTab] = useState("coleccionistas");
  const [users, setUsers] = useState([]);
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ load(); },[tab]);

  async function load() {
    setLoading(true);
    if(tab==="coleccionistas") {
      const {data}=await supabase.from("profiles")
        .select("id,name,handle,avatar_color,bio,location,flow,followers_count")
        .order("flow",{ascending:false}).limit(20);
      setUsers(data||[]);
    } else if(tab==="activos") {
      const {data}=await supabase.from("profiles")
        .select("id,name,handle,avatar_color,bio,location,flow,followers_count")
        .order("followers_count",{ascending:false}).limit(20);
      setUsers(data||[]);
    } else if(tab==="deseados") {
      const {data}=await supabase.from("watch_wishlist")
        .select("watch_id, watch:watches(id,slug,model,brand_slug,image_url,market_price)");
      const counts = {};
      (data||[]).forEach(item=>{
        if(!item.watch_id) return;
        if(!counts[item.watch_id]) counts[item.watch_id]={count:0,watch:item.watch};
        counts[item.watch_id].count++;
      });
      const sorted = Object.values(counts).sort((a,b)=>b.count-a.count).slice(0,20);
      setWatches(sorted);
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom:4 }}>Rankings</h2>
      <p style={{ ...S.muted, marginBottom:20 }}>Los mejores de la comunidad</p>

      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {[["coleccionistas","⚡ Por Flow"],["activos","👥 Por seguidores"],["deseados","❤️ Más deseados"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:tab===id?"#1a2744":"#f0ede6", color:tab===id?"#fff":"#666", fontWeight:tab===id?600:400 }}>{label}</button>
        ))}
      </div>

      {loading?<Spinner />:(
        <>
          {(tab==="coleccionistas"||tab==="activos")&&users.map((u,i)=>(
            <div key={u.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:14, cursor:"pointer" }} onClick={()=>onNavigate("profile",u.id)}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, color:i<3?"#b8963e":"#aaa", minWidth:32, textAlign:"center" }}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
              </div>
              <Avatar name={u.name||"?"} size={44} color={u.avatar_color||"#1a2744"} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{u.name}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#888" }}>@{u.handle}</div>
                {u.location&&<div style={{ fontSize:12, color:"#aaa" }}>{u.location}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                {tab==="coleccionistas"&&<div style={{ fontWeight:700, color:"#b8963e" }}>⚡{u.flow||0}</div>}
                {tab==="activos"&&<div style={{ fontWeight:700, color:"#1a2744" }}>👥{u.followers_count||0}</div>}
                <div style={{ fontSize:11, color:"#aaa" }}>{tab==="coleccionistas"?"Flow":"seguidores"}</div>
              </div>
            </div>
          ))}

          {tab==="deseados"&&watches.map(({watch,count},i)=>watch&&(
            <div key={watch.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:14, cursor:"pointer" }} onClick={()=>onNavigate("watch",watch.slug)}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, color:i<3?"#b8963e":"#aaa", minWidth:32, textAlign:"center" }}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
              </div>
              <div style={{ width:52, height:52, borderRadius:10, background:`linear-gradient(135deg,${brandColor(watch.slug)},${brandColor(watch.slug)}88)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {watch.image_url
                  ? <img src={watch.image_url} alt="" style={{ height:"85%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
                  : <span style={{ fontSize:22 }}>⌚</span>
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{watch.model}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#888" }}>{brandFromSlug(watch.slug)}</div>
                {watch.market_price&&<div style={{ fontSize:12, color:"#b8963e" }}>{watch.market_price}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, color:"#e11d48", fontSize:16 }}>❤️{count}</div>
                <div style={{ fontSize:11, color:"#aaa" }}>en wishlists</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
