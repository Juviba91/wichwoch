import { useState } from "react";
import { supabase } from "../lib/supabase";
import { S, BRAND_COLORS } from "../data/constants";

const COUNTRIES = ["España","México","Argentina","Colombia","Chile","Estados Unidos","Reino Unido","Francia","Alemania","Italia","Suiza","Otro"];

export function OnboardingMarca({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:"", country:"", founded:"", website:"", email:"",
    description:"", logo_url:"", instagram:"", type:"boutique",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  async function uploadLogo(file) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `marcas/${user.id}.${ext}`;
    const {error}=await supabase.storage.from("watch-photos").upload(path, file, {upsert:true});
    if(!error) {
      const {data}=supabase.storage.from("watch-photos").getPublicUrl(path);
      setF("logo_url", data.publicUrl);
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    const slug = form.name.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    await supabase.from("profiles").update({
      name: form.name.trim(),
      location: form.country||null,
      bio: form.description.trim()||null,
      corporate_url: form.website.trim()||null,
      onboarding_complete: true,
      brand_slug_linked: slug,
    }).eq("id", user.id);
    setSaving(false);
    onComplete();
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:"100%", maxWidth:540 }}>

        <div style={{ display:"flex", gap:6, marginBottom:28, justifyContent:"center" }}>
          {[1,2,3].map(i=>(
            <div key={i} style={{ height:4, flex:1, borderRadius:2, background:i<=step?"#1a2744":"#e0ddd6", transition:"background 0.3s" }} />
          ))}
        </div>

        <div style={{ background:"linear-gradient(135deg,#1a2744,#2a3a5a)", borderRadius:10, padding:"12px 18px", marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>🏷️</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#b8963e" }}>Perfil de Marca</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>Crea la presencia oficial de tu marca en Wich Woch</div>
          </div>
        </div>

        {/* PASO 1: Info básica */}
        {step===1&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 1 de 3</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:20 }}>Tu marca</h2>

            <div style={{ marginBottom:12 }}><span style={S.label}>Nombre de la marca *</span><input style={S.input} placeholder="Ej: Montres de Luxe" value={form.name} onChange={e=>setF("name",e.target.value)} autoFocus /></div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <span style={S.label}>País de origen</span>
                <select style={S.input} value={form.country} onChange={e=>setF("country",e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><span style={S.label}>Año de fundación</span><input style={S.input} type="number" placeholder="1985" min="1800" max={new Date().getFullYear()} value={form.founded} onChange={e=>setF("founded",e.target.value)} /></div>
            </div>

            <div style={{ marginBottom:12 }}><span style={S.label}>Web oficial *</span><input style={S.input} placeholder="www.tumarca.com" value={form.website} onChange={e=>setF("website",e.target.value)} /></div>
            <div style={{ marginBottom:12 }}><span style={S.label}>Email corporativo *</span><input style={S.input} type="email" placeholder="info@tumarca.com" value={form.email} onChange={e=>setF("email",e.target.value)} /></div>

            <div style={{ marginBottom:20 }}>
              <span style={S.label}>Tipo de marca</span>
              <div style={{ display:"flex", gap:8 }}>
                {[["boutique","🏪 Boutique independiente"],["grande","🏢 Marca establecida"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setF("type",v)} style={{ flex:1, padding:"10px", borderRadius:8, border:`2px solid ${form.type===v?"#1a2744":"#e0ddd6"}`, background:form.type===v?"#1a2744":"#fff", color:form.type===v?"#fff":"#666", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:form.type===v?600:400 }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button style={S.btn("primary")} onClick={()=>setStep(2)} disabled={!form.name.trim()||!form.website.trim()||!form.email.trim()}>Continuar →</button>
            </div>
          </div>
        )}

        {/* PASO 2: Logo y descripción */}
        {step===2&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 2 de 3</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:20 }}>Logo y descripción</h2>

            <div style={{ marginBottom:20 }}>
              <span style={S.label}>Logo de la marca</span>
              {form.logo_url
                ? <div style={{ position:"relative", display:"inline-block" }}>
                    <img src={form.logo_url} alt="" style={{ height:100, borderRadius:8, display:"block", objectFit:"contain", background:"#f0ede6", padding:8 }} />
                    <button style={{ position:"absolute", top:4, right:4, background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", borderRadius:"50%", width:22, height:22, cursor:"pointer", fontSize:12 }} onClick={()=>setF("logo_url","")}>×</button>
                  </div>
                : <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"16px", border:"2px dashed #e0ddd6", borderRadius:8, color:"#888", fontSize:13 }}>
                    {uploading?"⏳ Subiendo…":"🖼️ Subir logo (PNG o JPG)"}
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files[0]&&uploadLogo(e.target.files[0])} />
                  </label>
              }
            </div>

            <div style={{ marginBottom:16 }}>
              <span style={S.label}>Descripción de la marca</span>
              <textarea style={{ ...S.input, resize:"none" }} rows={4} placeholder="Cuéntanos la historia de tu marca, vuestra filosofía, qué os hace únicos..." value={form.description} onChange={e=>setF("description",e.target.value)} />
            </div>

            <div style={{ marginBottom:24 }}>
              <span style={S.label}>Instagram <span style={{ color:"#aaa", fontWeight:400 }}>(opcional)</span></span>
              <input style={S.input} placeholder="@tumarca" value={form.instagram} onChange={e=>setF("instagram",e.target.value)} />
            </div>

            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button style={S.btn("outline")} onClick={()=>setStep(1)}>← Atrás</button>
              <button style={S.btn("primary")} onClick={()=>setStep(3)}>Continuar →</button>
            </div>
          </div>
        )}

        {/* PASO 3: Resumen */}
        {step===3&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 3 de 3</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:20 }}>¡Casi listo!</h2>

            <div style={{ background:"#f8f6f0", borderRadius:10, padding:20, marginBottom:20 }}>
              {form.logo_url&&<img src={form.logo_url} alt="" style={{ height:60, objectFit:"contain", marginBottom:12, display:"block" }} />}
              <div style={{ fontWeight:700, fontSize:18, marginBottom:4 }}>{form.name}</div>
              {form.country&&<div style={{ fontSize:13, color:"#888" }}>📍 {form.country}{form.founded&&` · Fundada en ${form.founded}`}</div>}
              {form.website&&<div style={{ fontSize:13, color:"#1a2744", marginTop:4 }}>🌐 {form.website}</div>}
              {form.description&&<p style={{ fontSize:13, color:"#555", marginTop:10, lineHeight:1.6 }}>{form.description.slice(0,120)}...</p>}
            </div>

            <div style={{ padding:"12px 16px", background:"#fff8e8", borderRadius:8, marginBottom:20, fontSize:12, color:"#b8963e", lineHeight:1.6 }}>
              ⏳ Tu perfil será revisado por el equipo de Wich Woch. Una vez verificado, aparecerás como marca oficial y podrás añadir relojes al catálogo sin aprobación previa.
            </div>

            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button style={S.btn("outline")} onClick={()=>setStep(2)}>← Atrás</button>
              <button style={S.btn("primary")} onClick={save} disabled={saving}>{saving?"Creando perfil…":"Crear perfil de marca →"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
