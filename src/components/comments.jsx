import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, timeAgo } from "../data/constants";
import { Avatar } from "./UI";

export function CommentsSection({ postId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(()=>{ if(postId) load(); },[postId]);

  async function load() {
    setLoading(true);
    const {data,error}=await supabase.from("post_comments")
      .select("*, author:profiles(id,name,handle,avatar_color,avatar_emoji)")
      .eq("post_id",postId).order("created_at",{ascending:true});
    if(!error) setComments(data||[]);
    setLoading(false);
  }

  async function submit() {
    if(!content.trim()||!currentUser?.id) return;
    setPosting(true);
    const {error}=await supabase.from("post_comments").insert({post_id:postId,author_id:currentUser.id,content:content.trim()});
    if(!error) { setContent(""); await load(); }
    setPosting(false);
  }

  return (
    <div style={{ borderTop:"1px solid #f0ede6", marginTop:12, paddingTop:12 }}>
      {loading ? <div style={S.muted}>Cargando…</div> : (
        <div style={{ marginBottom:12 }}>
          {comments.map(c=>(
            <div key={c.id} style={{ display:"flex", gap:8, marginBottom:10 }}>
              <Avatar name={c.author?.name||"?"} size={28} color={c.author?.avatar_color||"#1a2744"} emoji={c.author?.avatar_emoji||null} />
              <div style={{ flex:1, background:"#f8f6f0", borderRadius:8, padding:"8px 12px" }}>
                <span style={{ fontWeight:600, fontSize:13 }}>@{c.author?.handle}</span>
                <span style={{ fontSize:13, color:"#444", marginLeft:8 }}>{c.content}</span>
                <div style={{ ...S.muted, fontSize:11, marginTop:2 }}>{timeAgo(c.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {currentUser && (
        <div style={{ display:"flex", gap:8 }}>
          <Avatar name={currentUser?.email||"?"} size={28} color="#1a2744" />
          <div style={{ flex:1, display:"flex", gap:8 }}>
            <input style={{ ...S.input, fontSize:13, padding:"7px 12px" }} placeholder="Escribe un comentario…" value={content} onChange={e=>setContent(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&submit()} />
            <button style={{ ...S.btn("primary"), padding:"7px 14px", fontSize:12, flexShrink:0 }} onClick={submit} disabled={posting||!content.trim()}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}
