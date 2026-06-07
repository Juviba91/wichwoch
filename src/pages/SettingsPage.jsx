import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S } from "../data/constants";
import { Spinner } from "../components/UI";

const BRANDS = ["rolex","omega","patek","ap","iwc","jlc","tudor","cartier","breitling","tag","vc","hublot","panerai","gs","zenith"];
const AVATAR_COLORS = ["#1a2744","#006039","#1a3a6b","#8b0000","#2c4a2e","#c8a84b","#4a4a8a","#2563eb","#4a7c59","#b45309"];

export function SettingsPage({ user, onNavigate }) {
  const [form, setForm] = useState({
    // Perfil público
    name:"", handle:"", bio:"", location:"", avatar_color:"#1a2744",
    // Privacidad
    garage_public:true,
    // Datos personales
    birth_year:"", country:"", watch_count_range:"", brand_interests:[],
    purchase_type:"", gender:"", occupation:"", collector_level:"",
    annual_budget:"", purchase_channel:"", purchase_motivation:"",
    instagram_handle:"", tiktok_handle:"",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState("perfil");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(()=>{ load(); },[]);

  async function load() {
    const {data}=await supabase.from("profiles").select("*").eq("id",user.id).single();
    if(data) setForm({
      name:data.name||"", handle:data.handle||"", bio:data.bio||"", location:data.location||"",
      avatar_color:data.avatar_color||"#1a2744", garage_public:data.garage_public!==false,
      birth_year:data.birth_year||"", country:data.country||"",
      watch_count_range:data.watch_count_range||"", brand_interests:data.brand_interests||[],
      purchase_type:data.purchase_type||"", gender:data.gender||"",
      occupation:data.occupation||"", collector_level:data.collector_level||"",
      annual_budget:data.annual_budget||"", purchase_channel:data.purchase_channel||"",
      purchase_motivation:data.purchase_motivation||"",
      instagram_handle:data.instagram_handle||"", tiktok_handle:data.tiktok_handle||"",
    });
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    await supabase.from("profiles").update({
      name:form.name.trim(), handle:form.handle.trim().toLowerCase(),
      bio:form.bio.trim()||null, location:form.location.trim()||null,
      avatar_color:form.avatar_color, garage_public:form.garage_public,
      birth_year:form.birth_year?parseInt(form.birth_year):null,
      country:form.country.trim()||null,
      watch_count_range:form.watch_count_range||null,
      brand_interests:form.brand_interests.length>0?form.brand_interests:null,
      purchase_type:form.purchase_type||null, gender:form.gender||null,
      occupation:form.occupation||null, collector_level:form.collector_level||null,
      annual_budget:form.annual_budget||null, purchase_channel:form.purchase_channel||null,
      purchase_motivation:form.purchase_motivation||null,
      instagram_handle:form.instagram_handle.trim()||null,
      tiktok_handle:form.tiktok_handle.trim()||null,
    }).eq("id",user.id);
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  }

  async function deleteAccount() {
    await supabase.from("watch_service_history").delete().eq("user_id",user.id);
    await supabase.from("maintenance_todos").delete().eq("user_id",user.id);
    await supabase.from("watch_reviews").delete().eq("author_id",user.id);
    await supabase.from("watch_list_items").delete().in("list_id",
      (await supabase.from("watch_lists").select("id").eq("user_id",user.id)).data?.map(l=>l.id)||[]
    );
    await supabase.from("watch_lists").delete().eq("user_id",user.id);
    await supabase.from("watch_wishlist").delete().eq("user_id",user.id);
    await supabase.from("watch_registrations").delete().eq("user_id",user.id);
    await supabase.from("forum_replies").delete().eq("author_id",user.id);
    await supabase.from("forum_threads").delete().eq("author_id",user.id);
    await supabase.from("posts").delete().eq("author_id",user.id);
    await supabase.from("follows").delete().or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);
    await supabase.from("user_badges").delete().eq("user_id",user.id);
    await supabase.from("profiles").delete().eq("id",user.id);
    await supabase.auth.signOut();
  }

  if(loading) return <Spinner />;

  const SECTIONS = [["perfil","👤 Perfil público"],["privacidad","🔒 Privacidad"],["coleccion","⌚ Mi colección"],["cuenta","⚠️ Cuenta"]];

  return (
    <div style={{ maxWidth:600, margin:"0 auto" }}>
      <h2 style={{ ...S.h1, marginBottom:4 }}>Ajustes</h2>
      <p style={{ ...S.muted, marginBottom:24 }}>Gestiona tu perfil y preferencias</p>

      {/* Sección tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:24, flexWrap:"wrap" }}>
        {SECTIONS.map(([id,label])=>(
          <button key={id} onClick={()=>setSection(id)} style={{ padding:"7px 16px", borderRadius:20, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, background:section===id?"#1a2744":"#f0ede6", color:section===id?"#fff":"#666", fontWeight:section===id?600:400 }}>{label}</button>
        ))}
      </div>

      {/* ─── PERFIL PÚBLICO ─── */}
      {section==="perfil"&&(
        <div style={S.card}>
          <h3 style={{ ...S.h2, marginBottom:20 }}>Perfil público</h3>

          <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
            {AVATAR_COLORS.map(c=>(
              <div key={c} onClick={()=>setF("avatar_color",c)} style={{ width:32, height:32, borderRadius:"50%", background:c, cursor:"pointer", border:form.avatar_color===c?"3px solid #1a1a1a":"3px solid transparent", boxSizing:"border-box" }} />
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><span style={S.label}>Nombre</span><input style={S.input} value={form.name} onChange={e=>setF("name",e.target.value)} /></div>
            <div><span style={S.label}>@usuario</span><input style={S.input} value={form.handle} onChange={e=>setF("handle",e.target.value)} /></div>
          </div>
          <div style={{ marginBottom:12 }}><span style={S.label}>Ciudad</span><input style={S.input} placeholder="Madrid" value={form.location} onChange={e=>setF("location",e.target.value)} /></div>
          <div style={{ marginBottom:0 }}><span style={S.label}>Bio</span><textarea style={{ ...S.input, resize:"none" }} rows={3} value={form.bio} onChange={e=>setF("bio",e.target.value)} /></div>
        </div>
      )}

      {/* ─── PRIVACIDAD ─── */}
      {section==="privacidad"&&(
        <div style={S.card}>
          <h3 style={{ ...S.h2, marginBottom:20 }}>Privacidad</h3>
          <label style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>Garage público</div>
              <div style={{ fontSize:13, color:"#888" }}>Otros usuarios pueden ver tu colección</div>
            </div>
            <div onClick={()=>setF("garage_public",!form.garage_public)} style={{ width:44, height:24, borderRadius:12, background:form.garage_public?"#1a2744":"#ddd", position:"relative", transition:"background 0.2s", flexShrink:0, cursor:"pointer" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left:form.garage_public?22:2, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </label>
        </div>
      )}

      {/* ─── MI COLECCIÓN ─── */}
      {section==="coleccion"&&(
        <div>
          <div style={{ ...S.card, marginBottom:12 }}>
            <h3 style={{ ...S.h2, marginBottom:4 }}>Datos personales</h3>
            <p style={{ ...S.muted, marginBottom:20, fontSize:12 }}>Esta información es privada y nos ayuda a mejorar la plataforma.</p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div><span style={S.label}>Año de nacimiento</span><input style={S.input} type="number" placeholder="1985" min="1940" max="2005" value={form.birth_year} onChange={e=>setF("birth_year",e.target.value)} /></div>
              <div><span style={S.label}>País</span><input style={S.input} placeholder="España" value={form.country} onChange={e=>setF("country",e.target.value)} /></div>
            </div>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Género</span>
              <div style={{ display:"flex", gap:8 }}>
                {[["hombre","Hombre"],["mujer","Mujer"],["otro","Otro"],["nd","Prefiero no decir"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("gender",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.gender===v?"#1a2744":"#e0ddd6"}`, background:form.gender===v?"#1a2744":"#fff", color:form.gender===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Ocupación</span>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["ejecutivo","Ejecutivo"],["empresario","Empresario"],["liberal","Prof. liberal"],["estudiante","Estudiante"],["otro","Otro"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("occupation",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.occupation===v?"#1a2744":"#e0ddd6"}`, background:form.occupation===v?"#1a2744":"#fff", color:form.occupation===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Nivel de coleccionista</span>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["entusiasta","Entusiasta"],["casual","Casual"],["serio","Serio"],["inversor","Inversor"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("collector_level",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.collector_level===v?"#1a2744":"#e0ddd6"}`, background:form.collector_level===v?"#1a2744":"#fff", color:form.collector_level===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...S.card, marginBottom:12 }}>
            <h3 style={{ ...S.h2, marginBottom:16 }}>Hábitos de compra</h3>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>¿Cuántos relojes tienes?</span>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["0","Ninguno"],["1","1"],["2-5","2-5"],["6-10","6-10"],["10+","+10"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("watch_count_range",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.watch_count_range===v?"#1a2744":"#e0ddd6"}`, background:form.watch_count_range===v?"#1a2744":"#fff", color:form.watch_count_range===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Presupuesto anual en relojes</span>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["<500","<500€"],["500-2k","500-2k€"],["2k-10k","2k-10k€"],["10k-50k","10k-50k€"],[">50k",">50k€"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("annual_budget",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.annual_budget===v?"#1a2744":"#e0ddd6"}`, background:form.annual_budget===v?"#1a2744":"#fff", color:form.annual_budget===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>¿Cómo compras relojes?</span>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["nuevo","Nuevo"],["segunda_mano","Segunda mano"],["ambos","Ambos"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("purchase_type",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.purchase_type===v?"#1a2744":"#e0ddd6"}`, background:form.purchase_type===v?"#1a2744":"#fff", color:form.purchase_type===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Canal de compra preferido</span>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["ad","AD Oficial"],["gris","Mercado gris"],["sm_online","2ª mano online"],["subasta","Subasta"],["particular","Particular"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("purchase_channel",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.purchase_channel===v?"#1a2744":"#e0ddd6"}`, background:form.purchase_channel===v?"#1a2744":"#fff", color:form.purchase_channel===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <span style={S.label}>Motivación de compra</span>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[["uso","Uso diario"],["coleccion","Colección"],["inversion","Inversión"],["regalo","Regalo"],["herencia","Herencia"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("purchase_motivation",v)} style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${form.purchase_motivation===v?"#1a2744":"#e0ddd6"}`, background:form.purchase_motivation===v?"#1a2744":"#fff", color:form.purchase_motivation===v?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:0 }}>
              <span style={S.label}>Marcas que te interesan</span>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {BRANDS.map(b=>(
                  <button key={b} onClick={()=>setF("brand_interests", form.brand_interests.includes(b)?form.brand_interests.filter(x=>x!==b):[...form.brand_interests,b])}
                    style={{ padding:"4px 10px", borderRadius:20, border:`1px solid ${form.brand_interests.includes(b)?"#b8963e":"#e0ddd6"}`, background:form.brand_interests.includes(b)?"#b8963e":"#fff", color:form.brand_interests.includes(b)?"#fff":"#666", cursor:"pointer", fontSize:11, fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>{b}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={S.card}>
            <h3 style={{ ...S.h2, marginBottom:16 }}>Redes sociales</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><span style={S.label}>Instagram</span><input style={S.input} placeholder="@tuusuario" value={form.instagram_handle} onChange={e=>setF("instagram_handle",e.target.value)} /></div>
              <div><span style={S.label}>TikTok</span><input style={S.input} placeholder="@tuusuario" value={form.tiktok_handle} onChange={e=>setF("tiktok_handle",e.target.value)} /></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUENTA ─── */}
      {section==="cuenta"&&(
        <div style={{ ...S.card, border:"1px solid #fcc" }}>
          <h3 style={{ ...S.h2, marginBottom:8, color:"#dc2626" }}>Zona de peligro</h3>
          <p style={{ fontSize:13, color:"#666", marginBottom:20, lineHeight:1.6 }}>Borrar tu cuenta eliminará permanentemente todos tus datos, relojes, posts y servicios registrados. Esta acción no se puede deshacer.</p>
          {!showDeleteConfirm
            ? <button style={{ background:"none", border:"1px solid #dc2626", color:"#dc2626", borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} onClick={()=>setShowDeleteConfirm(true)}>Borrar mi cuenta</button>
            : (
              <div>
                <p style={{ fontSize:13, color:"#dc2626", fontWeight:600, marginBottom:16 }}>¿Estás completamente seguro? No hay vuelta atrás.</p>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ background:"#dc2626", border:"none", color:"#fff", borderRadius:8, padding:"10px 20px", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }} onClick={deleteAccount}>Sí, borrar mi cuenta</button>
                  <button style={S.btn("outline")} onClick={()=>setShowDeleteConfirm(false)}>Cancelar</button>
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* Save button */}
      {section!=="cuenta"&&(
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20, gap:10 }}>
          {saved&&<span style={{ fontSize:13, color:"#16a34a", fontWeight:600, alignSelf:"center" }}>✓ Guardado</span>}
          <button style={S.btn("primary")} onClick={save} disabled={saving}>{saving?"Guardando…":"Guardar cambios"}</button>
        </div>
      )}
    </div>
  );
}
