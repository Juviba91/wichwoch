import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, BRAND_COLORS, brandFromSlug, timeAgo, getDailyNews } from "../data/constants";
import { Avatar, Badge, Spinner } from "../components/UI";
import { CommentsSection } from "../components/Comments";
import { UserBadges } from "../components/UserBadges";

export function parseContent(text, onNavigate) {
  if(!text) return null;
  const parts = text.split(/(@[a-z][a-z0-9_]*)/g);
  return parts.map((part,i) => {
    if(part.startsWith("@")) return <span key={i} style={{ color:"#b8963e", cursor:"pointer", fontWeight:600 }} onClick={()=>onNavigate("watch",part.slice(1))}>{part}</span>;
    return part;
  });
}

// ─── QUOTE POST (repost con comentario) ──────────────────────────────────────
function QuotePostModal({ original, currentUser, onClose, onPosted }) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit() {
    if(!content.trim()) return;
    setPosting(true);
    await supabase.from("posts").insert({
      author_id: currentUser.id,
      content: content.trim(),
      post_type: "text",
      repost_of: original.id
    });
    setPosting(false); onPosted(); onClose();
  }

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:12, padding:24, width:"100%", maxWidth:500, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ ...S.row, justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ ...S.h2, marginBottom:0 }}>Repostear con comentario</h3>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#aaa" }} onClick={onClose}>×</button>
        </div>
        <textarea
          autoFocus
          placeholder="Añade tu comentario…"
          value={content} onChange={e=>setContent(e.target.value)}
          style={{ width:"100%", border:"1px solid #e8e8e8", borderRadius:8, padding:"10px 12px", fontSize:15, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", boxSizing:"border-box", marginBottom:12 }} rows={3} />
        {/* Preview del post original */}
        <div style={{ border:"1px solid #e8e8e8", borderRadius:8, padding:12, marginBottom:16, background:"#f8f6f0" }}>
          <div style={{ ...S.muted, marginBottom:6 }}>@{original.author?.handle}</div>
          <p style={{ fontSize:13, color:"#444", margin:0, lineHeight:1.5 }}>{original.content?.slice(0,120)}{original.content?.length>120?"…":""}</p>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button style={S.btn("outline")} onClick={onClose}>Cancelar</button>
          <button style={S.btn("primary")} onClick={submit} disabled={posting||!content.trim()}>{posting?"Reposteando…":"Repostear"}</button>
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
  const types=[{id:"text",label:"💬 Texto"},{id:"photo",label:"📷 Foto"},{id:"video",label:"🎬 Vídeo"},{id:"news",label:"📰 Noticia"}];

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
        {types.map(t=>(<button key={t.id} onClick={()=>setType(t.id)} style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, background:type===t.id?"#1a2744":"#f0ede6", color:type===t.id?"#fff":"#666", fontWeight:type===t.id?600:400 }}>{t.label}</button>))}
      </div>
      {type==="news"&&<input style={{ ...S.input, marginBottom:8 }} placeholder="Título de la noticia" value={newsTitle} onChange={e=>setNewsTitle(e.target.value)} />}
      <textarea placeholder={type==="text"?"¿Qué hay en tu muñeca? Usa @rolex_submariner para mencionar un reloj…":type==="photo"?"Describe la foto…":type==="video"?"Describe el vídeo…":"Resumen…"} value={content} onChange={e=>setContent(e.target.value)} style={{ width:"100%", border:"none", outline:"none", resize:"none", fontSize:15, fontFamily:"'DM Sans',sans-serif", background:"transparent", color:"#1a1a1a", boxSizing:"border-box" }} rows={3} />
      {(type==="photo"||type==="video")&&<input style={{ ...S.input, marginTop:8 }} placeholder={type==="photo"?"URL de la imagen…":"URL del vídeo (YouTube...)"} value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)} />}
      {type==="news"&&<input style={{ ...S.input, marginTop:8 }} placeholder="Link (opcional)" value={newsLink} onChange={e=>setNewsLink(e.target.value)} />}
      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:12, borderTop:"1px solid #f5f3ef", marginTop:10 }}>
        <button style={S.btn("primary")} onClick={submit} disabled={posting||!content.trim()}>{posting?"Publicando…":"Publicar"}</button>
      </div>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onNavigate, onDeleted, onReload }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count||0);
  const [showComments, setShowComments] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [repostOf, setRepostOf] = useState(null);
  const author=post.author;
  const isOwn = post.author_id===currentUser?.id;

  useEffect(()=>{
    if(!currentUser?.id) return;
    supabase.from("likes").select("id").eq("user_id",currentUser.id).eq("post_id",post.id).maybeSingle()
      .then(({data})=>{ if(data) setLiked(true); });
    if(post.repost_of) {
      supabase.from("posts").select("*, author:profiles(id,name,handle,avatar_color,avatar_emoji)").eq("id",post.repost_of).single()
        .then(({data})=>{ if(data) setRepostOf(data); });
    }
  },[post.id, currentUser?.id]);

  async function toggleLike() {
    if(!currentUser?.id) return;
    if(liked){await supabase.from("likes").delete().match({user_id:currentUser.id,post_id:post.id});setLikes(l=>l-1);}
    else{await supabase.from("likes").insert({user_id:currentUser.id,post_id:post.id});setLikes(l=>l+1);}
    setLiked(!liked);
  }

  async function deletePost() {
    if(!window.confirm("¿Borrar este post?")) return;
    await supabase.from("posts").delete().eq("id",post.id);
    setDeleted(true); if(onDeleted) onDeleted();
  }

  if(deleted) return null;

  function getYouTubeId(url) { const m=url?.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/); return m?m[1]:null; }

  return (
    <div style={S.card}>
      <div style={{ ...S.row, marginBottom:12 }}>
        <div style={{ cursor:"pointer" }} onClick={()=>onNavigate("profile",author?.id)}>
          <Avatar name={author?.name||"?"} size={40} color={author?.avatar_color||"#1a2744"} emoji={author?.avatar_emoji||null} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:14, cursor:"pointer" }} onClick={()=>onNavigate("profile",author?.id)}>
            {author?.name}
            {author?.account_type==="repairer"&&<Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
            {author?.account_type==="brand"&&<Badge text="Marca" bg="#f0f6ff" color="#2563eb" />}
            <UserBadges userId={post.author_id} inline />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <span style={S.muted}>@{author?.handle} · {timeAgo(post.created_at)}</span>
            {author?.location&&<span style={{ ...S.muted, fontSize:12 }}>· 📍{author.location}</span>}
          </div>
        </div>
      </div>
      {post.post_type==="news"&&post.news_title&&(
        <div style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px", marginBottom:10, borderLeft:"3px solid #b8963e" }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{post.news_title}</div>
          {post.news_link&&<a href={post.news_link} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#b8963e" }}>Leer →</a>}
        </div>
      )}
      <p style={{ fontSize:15, lineHeight:1.65, margin:"0 0 12px" }}>{parseContent(post.content,onNavigate)}</p>
      {post.post_type==="photo"&&post.media_url&&(
        <div style={{ marginBottom:12, borderRadius:10, overflow:"hidden" }}>
          <img src={post.media_url} alt="" style={{ width:"100%", maxHeight:400, objectFit:"cover", display:"block" }} onError={e=>e.target.style.display="none"} />
        </div>
      )}
      {post.post_type==="video"&&post.media_url&&(
        <div style={{ marginBottom:12 }}>
          {getYouTubeId(post.media_url) ? (
            <iframe width="100%" height="280" src={`https://www.youtube.com/embed/${getYouTubeId(post.media_url)}`} frameBorder="0" allowFullScreen style={{ borderRadius:10, display:"block" }} />
          ) : (
            <a href={post.media_url} target="_blank" rel="noreferrer" style={{ display:"block", padding:"12px 14px", background:"#f8f6f0", borderRadius:8, color:"#b8963e", fontSize:13 }}>🎬 Ver vídeo →</a>
          )}
        </div>
      )}
      {post.watch&&(
        <div style={{ background:"#f8f6f0", borderRadius:6, padding:"7px 12px", marginBottom:10, fontSize:12, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6, border:"1px solid #ece9e2" }} onClick={()=>onNavigate("watch",post.watch.slug)}>
          <span style={{ fontWeight:600 }}>⌚ {post.watch.model}</span>
          <span style={{ ...S.mono, color:"#b8963e", fontSize:11 }}>@{post.watch.slug}</span>
        </div>
      )}
      {/* Repost preview */}
      {repostOf&&(
        <div style={{ border:"1px solid #e8e8e8", borderRadius:8, padding:"10px 14px", marginBottom:12, background:"#f8f6f0", cursor:"pointer" }} onClick={()=>onNavigate("profile",repostOf.author?.id)}>
          <div style={{ ...S.muted, marginBottom:4, fontSize:12 }}>@{repostOf.author?.handle}</div>
          <p style={{ fontSize:13, color:"#444", margin:0, lineHeight:1.5 }}>{repostOf.content?.slice(0,100)}{repostOf.content?.length>100?"…":""}</p>
        </div>
      )}

      <div style={{ ...S.row, borderTop:"1px solid #f5f3ef", paddingTop:10, marginTop:4, justifyContent:"space-between" }}>
        <div style={S.row}>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:liked?"#e11d48":"#888", fontFamily:"'DM Sans',sans-serif", padding:"0 8px 0 0", display:"flex", alignItems:"center", gap:4 }} onClick={toggleLike}>
            {liked?"♥":"♡"} {likes}
          </button>
          <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:showComments?"#1a2744":"#888", fontFamily:"'DM Sans',sans-serif", padding:"0 8px 0 0", display:"flex", alignItems:"center", gap:4 }} onClick={()=>setShowComments(!showComments)}>
            💬 {post.comments_count||0}
          </button>
          {currentUser&&<button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#888", fontFamily:"'DM Sans',sans-serif", padding:0, display:"flex", alignItems:"center", gap:4 }} onClick={()=>setShowQuote(true)}>
            🔁 Repostear
          </button>}
        </div>
        {isOwn&&<button style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#ccc", fontFamily:"'DM Sans',sans-serif", padding:0 }} onClick={deletePost}>🗑️</button>}
      </div>
      {showComments&&<CommentsSection postId={post.id} currentUser={currentUser} />}
      {showQuote&&currentUser&&<QuotePostModal original={post} currentUser={currentUser} onClose={()=>setShowQuote(false)} onPosted={()=>onReload&&onReload()} />}
    </div>
  );
}

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

// ─── AI + BRAND NEWS CARDS ────────────────────────────────────────────────────
function AINewsCard({ item, currentUser }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [fakePostId] = useState(`ai-${item.type}-${Math.floor(Date.now()/(1000*60*60*24))}`);
  const icons={curiosidad:"🕰️",noticia:"📰",tecnico:"⚙️"};
  const labels={curiosidad:"Curiosidad del día",noticia:"Noticia",tecnico:"¿Sabías que?"};
  const colors={curiosidad:"#1a3a6b",noticia:"#006039",tecnico:"#8b0000"};
  const bg=colors[item.type]||"#1a2744";
  return (
    <div style={{ ...S.card, borderLeft:`4px solid ${bg}` }}>
      <div style={{ ...S.row, marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{icons[item.type]}</div>
        <div><div style={{ fontWeight:700, fontSize:13, color:bg }}>{labels[item.type]}</div><div style={S.muted}>Wich Woch · Hoy</div></div>
      </div>
      <p style={{ fontSize:14, lineHeight:1.7, margin:"0 0 12px", color:"#333" }}>{item.content}</p>
      <div style={{ ...S.row, borderTop:"1px solid #f5f3ef", paddingTop:10 }}>
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:liked?"#e11d48":"#888", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:4, padding:"0 8px 0 0" }} onClick={()=>setLiked(!liked)}>
          {liked?"♥":"♡"} {liked?likes+1:likes}
        </button>
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#888", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:4 }} onClick={()=>setShowComments(!showComments)}>
          💬 Comentar
        </button>
      </div>
      {showComments&&currentUser&&(
        <div style={{ marginTop:12, borderTop:"1px solid #f0ede6", paddingTop:12 }}>
          <AICommentBox label={labels[item.type]} content={item.content} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
}

function AICommentBox({ label, content, currentUser }) {
  const [comment, setComment] = useState("");
  const [posted, setPosted] = useState(false);
  async function submit() {
    if(!comment.trim()) return;
    await supabase.from("posts").insert({ author_id:currentUser.id, content:`💬 Re: ${label} — ${comment.trim()}`, post_type:"text" });
    setComment(""); setPosted(true);
  }
  if(posted) return <div style={{ fontSize:13, color:"#2a7a4a" }}>✓ Comentario publicado en tu feed</div>;
  return (
    <div style={{ display:"flex", gap:8 }}>
      <input style={{ ...S.input, fontSize:13, padding:"7px 12px" }} placeholder="Tu opinión sobre esta noticia…" value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
      <button style={{ ...S.btn("primary"), padding:"7px 14px", fontSize:12, flexShrink:0 }} onClick={submit} disabled={!comment.trim()}>→</button>
    </div>
  );
}

function BrandNewsCard({ item, onNavigate }) {
  const bg=BRAND_COLORS[item.brand_slug]||"#1a2744";
  return (
    <div style={{ ...S.card, borderLeft:`4px solid ${bg}` }}>
      <div style={{ ...S.row, marginBottom:10 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontFamily:"'DM Mono',monospace", fontSize:11, fontWeight:700, flexShrink:0 }}>{(item.brand_slug||"").slice(0,2).toUpperCase()}</div>
        <div>
          <div style={{ fontWeight:600, fontSize:14, cursor:"pointer" }} onClick={()=>onNavigate("brand",item.brand_slug)}>
            {brandFromSlug(item.brand_slug)}<Badge text="Marca" bg="#f0f6ff" color="#2563eb" />
            {item.owners_only&&<Badge text="Propietarios" bg="#fff8e8" color="#b8960b" />}
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
        : supabase.from("posts").select("*, author:profiles(id,name,handle,account_type,avatar_color,avatar_emoji,location), watch:watches(id,slug,model)").is("repost_of",null).order("created_at",{ascending:false}).limit(20),
      supabase.from("brand_news").select("*").eq("owners_only",false).order("created_at",{ascending:false}).limit(4),
    ]);
    setPosts(postsRes.data||[]); setBrandNews(bnRes.data||[]); setLoading(false);
  }

  function buildFeed() {
    const feed=[];
    aiNews.forEach(n=>feed.push({type:"ai",data:n}));
    let bi=0;
    (posts||[]).forEach((p,i)=>{ feed.push({type:"post",data:p}); if((i+1)%5===0&&bi<brandNews.length) feed.push({type:"brand",data:brandNews[bi++]}); });
    while(bi<brandNews.length) feed.push({type:"brand",data:brandNews[bi++]});
    return feed;
  }

  return (
    <div>
      <PostComposer user={user} onPosted={loadAll} />
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        <button onClick={()=>setTab("all")} style={{ background:tab==="all"?"#1a2744":"#f0ede6", color:tab==="all"?"#fff":"#666", padding:"6px 16px", borderRadius:8, border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", fontWeight:tab==="all"?600:400 }}>Todo</button>
        <button onClick={()=>setTab("following")} style={{ background:tab==="following"?"#1a2744":"#f0ede6", color:tab==="following"?"#fff":"#666", padding:"6px 16px", borderRadius:8, border:"none", fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", fontWeight:tab==="following"?600:400 }}>Siguiendo</button>
      </div>
      {loading?<Spinner />:buildFeed().map((item,i)=>{
        if(item.type==="post") return <PostCard key={`p-${item.data.id}`} post={item.data} currentUser={user} onNavigate={onNavigate} onReload={loadAll} />;
        if(item.type==="ai") return <AINewsCard key={`ai-${i}`} item={item.data} currentUser={user} />;
        if(item.type==="brand") return <BrandNewsCard key={`bn-${item.data.id}`} item={item.data} onNavigate={onNavigate} />;
        return null;
      })}
      {!loading&&buildFeed().length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:40 }}>{tab==="following"?"Sigue a alguien para ver sus posts.":"Aún no hay publicaciones."}</div>}
    </div>
  );
}
