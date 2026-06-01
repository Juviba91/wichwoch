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
  // Only show special badges (founder etc), not brand owner badges
  const specialBadges = badges.filter(b=>b.badge_type!=="brand_owner"&&!b.brand_slug);
  if(!specialBadges.length) return null;
  return (
    <span style={{ display:"inline-flex", gap:4, flexWrap:"wrap" }}>
      {specialBadges.map(b=>(
        <span key={b.id} style={{ fontSize:9, fontWeight:700, letterSpacing:1, textTransform:"uppercase", padding:"1px 6px", background:b.badge_type==="founder"?"linear-gradient(135deg,#b8963e,#8a6f2e)":"#fff8e8", color:b.badge_type==="founder"?"#fff":"#b8963e", borderRadius:3, fontFamily:"'DM Mono',monospace", border:"1px solid #f0d080" }}>
          {b.badge_type==="founder"?"🎖️ Fundador":b.badge_type}
        </span>
      ))}
    </span>
  );
}
