import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug, timeAgo } from "../data/constants";
import { Avatar, Spinner } from "../components/UI";

export function WristCheckPage({ currentUser, onNavigate }) {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayCheck, setTodayCheck] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [watches, setWatches] = useState([]);
  const [form, setForm] = useState({ watch_id:"", note:"", photo_url:"" });
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(()=>{ load(); loadMyWatches(); },[]);

  async function load() {
    setLoading(true);
    const [{ data:all },{ data:mine }] = await Promise.all([
      supabase.from("wrist_checks")
        .select("*, user:profiles(id,name,handle,avatar_color), watch:watches(id,slug,model,image_url,brand_slug)")
        .order("created_at",{ascending:false}).limit(30),
      currentUser?.id ? supabase.from("wrist_checks").select("*").eq("user_id",currentUser.id).eq("date",today).maybeSingle() : { data:null }
    ]);
    setChecks(all||[]);
    setTodayCheck(mine||null);
    setLoading(false);
  }

  async function loadMyWatches() {
    if(!currentUser?.id) return;
    const {data}=await supabase.from("watch_registrations").select("watch:watches(id,slug,model,brand_slug)").eq("user_id",currentUser.id);
    setWatches((data||[]).map(w=>w.watch).filter(Boolean));
  }

  async function uploadPhoto(file) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `wristchecks/${currentUser.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("watch-photos").upload(path, file);
    if(!error) {
      const { data } = supabase.storage.from("watch-photos").getPublicUrl(path);
      setForm(f=>({...f, photo_url:data.publicUrl}));
    }
    setUploading(false);
  }

  async function submit() {
    if(!form.watch_id) return;
    setPosting(true);
    await supabase.from("wrist_checks").upsert({
      user_id: currentUser.id,
      watch_id: form.watch_id,
      note: form.note||null,
      photo_url: form.photo_url||null,
      date: today
    });
    setShowForm(false);
    setForm({watch_id:"",note:"",photo_url:""});
    await load();
    setPosting(false);
  }

  async function toggleLike(checkId) {
    if(!currentUser?.id) return;
    const {data:ex}=await supabase.from("wrist_check_likes").select("id").eq("wrist_check_id",checkId).eq("user_id",currentUser.id).maybeSingle();
    if(ex) await supabase.from("wrist_check_likes").delete().match({wrist_check_id:checkId,user_id:currentUser.id});
    else await supabase.from("wrist_check_likes").insert({wrist_check_id:checkId,user_id:currentUser.id});
    await load();
  }

  return (
    <div>
      {/* Header */}
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>⌚ Wrist Check</h2>
          <p style={S.muted}>¿Qué llevas hoy en la muñeca?</p>
        </div>
        {currentUser&&!todayCheck&&(
          <button style={S.btn("primary")} onClick={()=>setShowForm(!showForm)}>+ Mi reloj de hoy</button>
        )}
        {currentUser&&todayCheck&&(
          <div style={{ ...S.card, marginBottom:0, padding:"8px 16px", background:"#f0f9f4", border:"1px solid #b3dfc4" }}>
            <span style={{ fontSize:13, color:"#2a7a4a", fontWeight:600 }}>✓ Ya has publicado hoy</span>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm&&currentUser&&(
        <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:20 }}>
          <h3 style={{ ...S.h2, marginBottom:16 }}>Mi reloj de hoy</h3>

          <div style={{ marginBottom:14 }}>
            <span style={S.label}>¿Qué reloj llevas?</span>
            <select style={S.input} value={form.watch_id} onChange={e=>setForm(f=>({...f,watch_id:e.target.value}))}>
              <option value="">Selecciona un reloj de tu garage...</option>
              {watches.map(w=><option key={w.id} value={w.id}>{brandFromSlug(w.slug)} {w.model}</option>)}
            </select>
            {watches.length===0&&<p style={{ ...S.muted, fontSize:12, marginTop:6 }}>Añade relojes a tu Garage primero</p>}
          </div>

          <div style={{ marginBottom:14 }}>
            <span style={S.label}>Foto <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
            {form.photo_url ? (
              <div style={{ position:"relative", display:"inline-block" }}>
                <img src={form.photo_url} alt="" style={{ maxHeight:200, borderRadius:8, display:"block" }} />
                <button style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", borderRadius:"50%", width:24, height:24, cursor:"pointer" }} onClick={()=>setForm(f=>({...f,photo_url:""}))}>×</button>
              </div>
            ) : (
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"12px 16px", border:"2px dashed #e0ddd6", borderRadius:8, color:"#888", fontSize:13 }}>
                {uploading?"⏳ Subiendo...":"📷 Subir foto de tu muñeca"}
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files[0]&&uploadPhoto(e.target.files[0])} />
              </label>
            )}
          </div>

          <div style={{ marginBottom:16 }}>
            <span style={S.label}>Nota <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
            <input style={S.input} placeholder="¿Por qué este reloj hoy?" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} />
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button style={S.btn("outline")} onClick={()=>setShowForm(false)}>Cancelar</button>
            <button style={S.btn("primary")} onClick={submit} disabled={posting||!form.watch_id||uploading}>{posting?"Publicando…":"Publicar"}</button>
          </div>
        </div>
      )}

      {/* Feed de wrist checks */}
      {loading ? <Spinner /> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
          {checks.map(c=>{
            const bg = c.watch ? brandColor(c.watch.slug) : "#1a2744";
            const [imgError, setImgError] = useState(false);
            return (
              <div key={c.id} style={{ ...S.card, padding:0, overflow:"hidden", marginBottom:0 }}>
                {/* Foto o color de marca */}
                <div style={{ height:220, background:`linear-gradient(135deg, ${bg}, ${bg}88)`, position:"relative", cursor:c.photo_url?"zoom-in":"default" }}
                  onClick={()=>c.photo_url&&setLightbox(c.photo_url)}>
                  {c.photo_url&&!imgError ? (
                    <img src={c.photo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={()=>setImgError(true)} />
                  ) : c.watch?.image_url ? (
                    <img src={c.watch.image_url} alt="" style={{ height:"90%", objectFit:"contain", display:"block", margin:"auto", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} />
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:48 }}>⌚</div>
                  )}
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent, rgba(0,0,0,0.7))", padding:"20px 14px 12px" }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.6)", letterSpacing:1, textTransform:"uppercase" }}>{c.watch?brandFromSlug(c.watch.slug):""}</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#fff" }}>{c.watch?.model||"Reloj desconocido"}</div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ ...S.row, marginBottom:8 }}>
                    <div style={{ cursor:"pointer" }} onClick={()=>onNavigate("profile",c.user?.id)}>
                      <Avatar name={c.user?.name||"?"} size={32} color={c.user?.avatar_color||"#1a2744"} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:13, cursor:"pointer" }} onClick={()=>onNavigate("profile",c.user?.id)}>@{c.user?.handle}</div>
                      <div style={S.muted}>{timeAgo(c.created_at)}</div>
                    </div>
                    <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#888", display:"flex", alignItems:"center", gap:4, fontFamily:"'DM Sans',sans-serif" }} onClick={()=>toggleLike(c.id)}>
                      ♥ {c.likes_count||0}
                    </button>
                  </div>
                  {c.note&&<p style={{ fontSize:13, color:"#444", margin:0, lineHeight:1.5 }}>{c.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading&&checks.length===0&&(
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⌚</div>
          <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Sin wrist checks hoy</div>
          <p style={S.muted}>Sé el primero en compartir lo que llevas en la muñeca</p>
        </div>
      )}

      {/* Lightbox */}
      {lightbox&&(
        <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.95)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="" style={{ maxWidth:"95vw", maxHeight:"95vh", objectFit:"contain", borderRadius:8 }} />
          <button style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:"50%", width:40, height:40, fontSize:20, cursor:"pointer" }}>×</button>
        </div>
      )}
    </div>
  );
}
