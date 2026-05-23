import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function UserBadges({ userId, inline=false }) {
  const [badges, setBadges] = useState([]);
  useEffect(()=>{
    if(!userId) return;
    supabase.from("user_badges").select("*").eq("user_id",userId)
      .then(({data})=>setBadges(data||[]));
  },[userId]);
  if(!badges.length) return null;
  const brandNames = { rolex:"Rolex Owner", omega:"Omega Owner", patek:"Patek Owner", ap:"AP Owner", iwc:"IWC Owner", jlc:"JLC Owner", tudor:"Tudor Owner", cartier:"Cartier Owner", breitling:"Breitling Owner", tag:"TAG Owner", vc:"VC Owner", hublot:"Hublot Owner", panerai:"Panerai Owner", gs:"GS Owner", zenith:"Zenith Owner" };
  return (
    <span style={{ display:"inline-flex", gap:4, flexWrap:"wrap" }}>
      {badges.map(b=>(
        <span key={b.id} style={{ fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", padding:"1px 6px", background:"#fff8e8", color:"#b8963e", borderRadius:3, fontFamily:"'DM Mono',monospace", border:"1px solid #f0d080" }}>
          {brandNames[b.brand_slug]||b.brand_slug}
        </span>
      ))}
    </span>
  );
}
