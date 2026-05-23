import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, timeAgo } from "../data/constants";
import { Spinner, Avatar, Badge } from "../components/UI";
import { UserBadges } from "../components/UserBadges";

// ─── THREAD PAGE (bug fix) ────────────────────────────────────────────────────
export function ThreadPage({ threadId, currentUser, onNavigate, onLoginRequired }) {
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // reply_id we're responding to
  const [replyContent, setReplyContent] = useState("");

  useEffect(()=>{ load(); },[threadId]);

  async function load() {
    setLoading(true);
    // FIX: query explícita con campos necesarios
    const {data:t, error}=await supabase.from("forum_threads")
      .select("id, title, content, votes, replies_count, created_at, watch_id, author_id, author:profiles(id,name,handle,avatar_color,avatar_emoji), watch:watches(id,slug,model)")
      .eq("id",threadId)
      .single();
    if(error) { console.error("Thread error:", error); setLoading(false); return; }
    setThread(t);
    const {data:r}=await supabase.from("forum_replies")
      .select("id, content, votes, created_at, author_id, parent_reply_id, author:profiles(id,name,handle,account_type,avatar_color,avatar_emoji)")
      .eq("thread_id",threadId)
      .order("created_at",{ascending:true});
    setReplies(r||[]); setLoading(false);
  }

  async function submitReply() {
    if(!content.trim()) return; setPosting(true);
    await supabase.from("forum_replies").insert({thread_id:threadId,author_id:currentUser.id,content:content.trim()});
    if(thread?.author_id&&thread.author_id!==currentUser.id) {
      await supabase.from("notifications").insert({recipient_id:thread.author_id,sender_id:currentUser.id,type:"reply",content:`ha respondido en tu foro "${thread.title.slice(0,40)}"`}).catch(()=>{});
    }
    setContent(""); await load(); setPosting(false);
  }

  async function deleteThread() {
    if(!window.confirm("¿Borrar este foro? Se eliminarán todas las respuestas.")) return;
    await supabase.from("forum_threads").delete().eq("id",threadId);
    onNavigate("foros");
  }

  async function deleteReply(replyId) {
    if(!window.confirm("¿Borrar esta respuesta?")) return;
    await supabase.from("forum_replies").delete().eq("id",replyId);
    await load();
  }

  async function submitNestedReply(parentId) {
    if(!replyContent.trim()) return;
    setPosting(true);
    await supabase.from("forum_replies").insert({
      thread_id:threadId, author_id:currentUser.id,
      content:replyContent.trim(), parent_reply_id:parentId
    });
    setReplyingTo(null); setReplyContent(""); await load(); setPosting(false);
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
  if(!thread) return (
    <div style={S.card}>
      <p style={S.muted}>Hilo no encontrado.</p>
      <button style={S.btn("outline")} onClick={()=>onNavigate("foros")}>← Volver a Foros</button>
    </div>
  );

  return (
    <div>
      <button style={{ ...S.btn("outline"), marginBottom:16, fontSize:12 }} onClick={()=>onNavigate("watch",thread.watch?.slug)}>← @{thread.watch?.slug}</button>
      <div style={S.card}>
        <div style={{ ...S.mono, fontSize:11, color:"#b8963e", marginBottom:8 }}>@{thread.watch?.slug} / {thread.title.toLowerCase().replace(/\s+/g,"_").slice(0,30)}</div>
        <h2 style={{ ...S.h1, marginBottom:10 }}>{thread.title}</h2>
        <div style={{ ...S.row, justifyContent:"space-between", marginBottom:14 }}>
          <div style={S.row}>
            <Avatar name={thread.author?.name||"?"} size={30} color={thread.author?.avatar_color||"#1a2744"} emoji={thread.author?.avatar_emoji||null} />
            <span style={S.muted}>@{thread.author?.handle} · {timeAgo(thread.created_at)}</span>
          </div>
          {thread.author_id===currentUser?.id&&<button style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#ccc" }} onClick={deleteThread}>🗑️ Borrar foro</button>}
        </div>
        <p style={{ fontSize:15, lineHeight:1.65, margin:"0 0 16px" }}>{thread.content}</p>
        <div style={S.row}>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#888", padding:"0 4px" }} onClick={()=>vote("thread",threadId,1)}>▲</button>
          <span style={{ fontWeight:700, fontFamily:"'DM Mono',monospace", color:thread.votes>0?"#2a7a4a":thread.votes<0?"#d44":"#888" }}>{thread.votes}</span>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#888", padding:"0 4px" }} onClick={()=>vote("thread",threadId,-1)}>▼</button>
          <span style={{ ...S.muted, marginLeft:8 }}>· {thread.replies_count||0} respuestas</span>
        </div>
      </div>
      {currentUser ? (
        <div style={S.card}>
          <span style={S.label}>Tu respuesta</span>
          <textarea rows={3} style={{ ...S.input, resize:"none", marginBottom:10 }} value={content} onChange={e=>setContent(e.target.value)} />
          <div style={{ display:"flex", justifyContent:"flex-end" }}><button style={S.btn("primary")} onClick={submitReply} disabled={posting||!content.trim()}>{posting?"Publicando…":"Responder"}</button></div>
        </div>
      ) : (
        <div style={{ ...S.card, textAlign:"center", padding:24, background:"#f8f6f0", border:"1px solid #e8d9b8" }}>
          <p style={{ margin:"0 0 12px", color:"#666" }}>Regístrate para participar en este debate</p>
          <button style={S.btn("primary")} onClick={()=>onLoginRequired?.()}>Entrar / Registrarse</button>
        </div>
      )}
      {replies.filter(r=>!r.parent_reply_id).map(r=>(
        <div key={r.id}>
          <div style={{ ...S.card, display:"flex", gap:14 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:36 }}>
              <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#888", padding:0 }} onClick={()=>vote("reply",r.id,1)}>▲</button>
              <span style={{ fontWeight:700, fontSize:13, fontFamily:"'DM Mono',monospace", color:r.votes>0?"#2a7a4a":r.votes<0?"#d44":"#888" }}>{r.votes}</span>
              <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#888", padding:0 }} onClick={()=>vote("reply",r.id,-1)}>▼</button>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ ...S.row, justifyContent:"space-between", marginBottom:8 }}>
                <div style={S.row}>
                  <Avatar name={r.author?.name||"?"} size={28} color={r.author?.avatar_color||"#1a2744"} emoji={r.author?.avatar_emoji||null} />
                  <span style={{ fontWeight:600, fontSize:13 }}>@{r.author?.handle}</span>
                  {r.author?.account_type==="repairer"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
                  <UserBadges userId={r.author_id} inline />
                  <span style={S.muted}>{timeAgo(r.created_at)}</span>
                </div>
                <div style={S.row}>
                  {currentUser&&<button style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#888" }} onClick={()=>setReplyingTo(replyingTo===r.id?null:r.id)}>↩ Responder</button>}
                  {r.author_id===currentUser?.id&&<button style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#ccc" }} onClick={()=>deleteReply(r.id)}>🗑️</button>}
                </div>
              </div>
              <p style={{ fontSize:14, lineHeight:1.6, margin:"0 0 8px" }}>{r.content}</p>
              {replyingTo===r.id&&(
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <input style={{ ...S.input, fontSize:13, padding:"7px 12px" }} placeholder={`Responder a @${r.author?.handle}…`} value={replyContent} onChange={e=>setReplyContent(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&submitNestedReply(r.id)} />
                  <button style={{ ...S.btn("primary"), padding:"7px 14px", fontSize:12, flexShrink:0 }} onClick={()=>submitNestedReply(r.id)} disabled={posting}>→</button>
                </div>
              )}
            </div>
          </div>
          {/* Nested replies */}
          {replies.filter(nr=>nr.parent_reply_id===r.id).map(nr=>(
            <div key={nr.id} style={{ ...S.card, display:"flex", gap:14, marginLeft:40, borderLeft:"2px solid #f0ede6", marginTop:-8 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:28 }}>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#888", padding:0 }} onClick={()=>vote("reply",nr.id,1)}>▲</button>
                <span style={{ fontWeight:700, fontSize:11, fontFamily:"'DM Mono',monospace", color:nr.votes>0?"#2a7a4a":nr.votes<0?"#d44":"#888" }}>{nr.votes}</span>
                <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#888", padding:0 }} onClick={()=>vote("reply",nr.id,-1)}>▼</button>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ ...S.row, justifyContent:"space-between", marginBottom:6 }}>
                  <div style={S.row}>
                    <Avatar name={nr.author?.name||"?"} size={22} color={nr.author?.avatar_color||"#1a2744"} emoji={nr.author?.avatar_emoji||null} />
                    <span style={{ fontWeight:600, fontSize:12 }}>@{nr.author?.handle}</span>
                    <span style={{ ...S.muted, fontSize:11 }}>{timeAgo(nr.created_at)}</span>
                  </div>
                  {nr.author_id===currentUser?.id&&<button style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#ccc" }} onClick={()=>deleteReply(nr.id)}>🗑️</button>}
                </div>
                <p style={{ fontSize:13, lineHeight:1.5, margin:0, color:"#444" }}>{nr.content}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
      {replies.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888" }}>Sé el primero en responder.</div>}
    </div>
  );
}
