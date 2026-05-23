import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, AVATAR_COLORS, AVATAR_EMOJIS } from "../data/constants";
import { Spinner } from "../components/UI";

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsPage({ user, onSaved }) {
  const [form, setForm] = useState({ name:"", bio:"", location:"", website:"", avatar_color:"#1a2744", avatar_emoji:"" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  useEffect(()=>{ supabase.from("profiles").select("*").eq("id",user.id).single().then(({data})=>{ if(data) setForm({ name:data.name||"", bio:data.bio||"", location:data.location||"", website:data.website||"", avatar_color:data.avatar_color||"#1a2744", avatar_emoji:data.avatar_emoji||"" }); setLoading(false); }); },[user]);

  async function save() {
    setSaving(true); setMsg(null);
    const {error}=await supabase.from("profiles").update({ name:form.name, bio:form.bio, location:form.location, website:form.website, avatar_color:form.avatar_color, avatar_emoji:form.avatar_emoji||null }).eq("id",user.id);
    if(error) setMsg({type:"error",text:error.message});
    else { setMsg({type:"success",text:"¡Ajustes guardados!"}); setTimeout(onSaved,1500); }
    setSaving(false);
  }

  if(loading) return <Spinner />;
  const preview=form.avatar_emoji||(form.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom:6 }}>Ajustes</h2>
      <p style={{ ...S.muted, marginBottom:24 }}>Personaliza tu perfil</p>
      {msg&&<div style={msg.type==="success"?S.success:S.error}>{msg.text}</div>}
      <div style={{ ...S.card, textAlign:"center", padding:32, marginBottom:20 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:form.avatar_color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:form.avatar_emoji?36:26, fontWeight:700, color:"#fff", margin:"0 auto 12px", fontFamily:"'DM Mono',monospace" }}>{preview}</div>
        <div style={{ fontWeight:600, fontSize:16 }}>{form.name||"Tu nombre"}</div>
        {form.location&&<div style={{ ...S.muted, marginTop:4 }}>📍 {form.location}</div>}
      </div>
      <div style={S.card}>
        <h3 style={{ ...S.h2, marginBottom:16 }}>Color del avatar</h3>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {AVATAR_COLORS.map(c=>(<div key={c} onClick={()=>setF("avatar_color",c)} style={{ width:36, height:36, borderRadius:"50%", background:c, cursor:"pointer", border:form.avatar_color===c?"3px solid #b8963e":"3px solid transparent", boxSizing:"border-box", transition:"transform 0.1s", transform:form.avatar_color===c?"scale(1.15)":"scale(1)" }} />))}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ ...S.h2, marginBottom:16 }}>Emoji <span style={{ fontWeight:400, color:"#888", fontSize:13 }}>(opcional)</span></h3>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <div onClick={()=>setF("avatar_emoji","")} style={{ width:44, height:44, borderRadius:"50%", background:form.avatar_color, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:!form.avatar_emoji?"3px solid #b8963e":"3px solid transparent", boxSizing:"border-box", fontSize:13, fontWeight:700, color:"#fff", fontFamily:"'DM Mono',monospace" }}>AB</div>
          {AVATAR_EMOJIS.map(e=>(<div key={e} onClick={()=>setF("avatar_emoji",e)} style={{ width:44, height:44, borderRadius:"50%", background:form.avatar_color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, cursor:"pointer", border:form.avatar_emoji===e?"3px solid #b8963e":"3px solid transparent", boxSizing:"border-box" }}>{e}</div>))}
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ ...S.h2, marginBottom:16 }}>Información personal</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><span style={S.label}>Nombre</span><input style={S.input} value={form.name} onChange={e=>setF("name",e.target.value)} /></div>
          <div><span style={S.label}>Bio</span><textarea rows={3} style={{ ...S.input, resize:"none" }} value={form.bio} onChange={e=>setF("bio",e.target.value)} /></div>
          <div><span style={S.label}>Ciudad</span><input style={S.input} placeholder="Madrid, Barcelona…" value={form.location} onChange={e=>setF("location",e.target.value)} /></div>
          <div><span style={S.label}>Web</span><input style={S.input} placeholder="https://…" value={form.website} onChange={e=>setF("website",e.target.value)} /></div>
        </div>
      </div>
      <button style={{ ...S.btn("primary"), width:"100%", padding:14, fontSize:15 }} onClick={save} disabled={saving}>{saving?"Guardando…":"Guardar cambios"}</button>
    </div>
  );
}
