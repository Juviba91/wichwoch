import { useState } from "react";
import { supabase } from "../lib/supabase";
import { S } from "../data/constants";

const SPECIALTIES = [
  {id:"vintage",label:"⏳ Vintage"},
  {id:"sport",label:"🏃 Sport"},
  {id:"diver",label:"🤿 Buceo"},
  {id:"complicaciones",label:"⚙️ Complicaciones"},
  {id:"restauracion",label:"🔨 Restauración"},
  {id:"certificado",label:"✓ Certificado oficial"},
  {id:"chrono",label:"⏱️ Cronógrafo"},
  {id:"dress",label:"👔 Dress"},
];

const BRANDS = ["rolex","omega","patek","ap","iwc","jlc","tudor","cartier","breitling","tag","vc","hublot","panerai","gs","zenith"];

export function OnboardingTaller({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:"", city:"", address:"", phone:"", website:"",
    description:"", specialties:[], brands:[], photo_url:"",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleArr = (k,v) => setForm(f=>({ ...f, [k]: f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v] }));

  async function uploadPhoto(file) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `talleres/${user.id}.${ext}`;
    const {error}=await supabase.storage.from("watch-photos").upload(path, file, {upsert:true});
    if(!error) {
      const {data}=supabase.storage.from("watch-photos").getPublicUrl(path);
      setF("photo_url", data.publicUrl);
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    // Update profile
    await supabase.from("profiles").update({
      name: form.name.trim(),
      location: form.city.trim()||null,
      bio: form.description.trim()||null,
      corporate_url: form.website.trim()||null,
      onboarding_complete: true,
    }).eq("id", user.id);

    // Create workshop entry
    const slug = form.name.trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"") + "-" + user.id.slice(0,6);
    await supabase.from("workshops").insert({
      name: form.name.trim(),
      slug,
      description: form.description.trim()||null,
      city: form.city.trim()||null,
      address: form.address.trim()||null,
      phone: form.phone.trim()||null,
      website: form.website.trim()||null,
      photo_url: form.photo_url||null,
      specialties: form.specialties.length>0 ? form.specialties : null,
      brands: form.brands.length>0 ? form.brands : null,
      owner_id: user.id,
      verified: false,
    }).catch(()=>{});

    setSaving(false);
    onComplete();
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width:"100%", maxWidth:540 }}>

        {/* Progress */}
        <div style={{ display:"flex", gap:6, marginBottom:28, justifyContent:"center" }}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{ height:4, flex:1, borderRadius:2, background:i<=step?"#1a2744":"#e0ddd6", transition:"background 0.3s" }} />
          ))}
        </div>

        {/* Aviso verificación */}
        <div style={{ background:"linear-gradient(135deg,#1a2744,#2a3a5a)", borderRadius:10, padding:"12px 18px", marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:20 }}>🔧</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#b8963e" }}>Perfil de Taller</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>Tu perfil será revisado y verificado por el equipo de Wich Woch</div>
          </div>
        </div>

        {/* PASO 1: Info básica */}
        {step===1&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 1 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:20 }}>Tu taller</h2>
            <div style={{ marginBottom:12 }}><span style={S.label}>Nombre del taller *</span><input style={S.input} placeholder="Relojería García" value={form.name} onChange={e=>setF("name",e.target.value)} autoFocus /></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div><span style={S.label}>Ciudad *</span><input style={S.input} placeholder="Madrid" value={form.city} onChange={e=>setF("city",e.target.value)} /></div>
              <div><span style={S.label}>Teléfono</span><input style={S.input} placeholder="+34 600 000 000" value={form.phone} onChange={e=>setF("phone",e.target.value)} /></div>
            </div>
            <div style={{ marginBottom:12 }}><span style={S.label}>Dirección</span><input style={S.input} placeholder="Calle Mayor 1, Madrid" value={form.address} onChange={e=>setF("address",e.target.value)} /></div>
            <div style={{ marginBottom:20 }}><span style={S.label}>Web</span><input style={S.input} placeholder="www.mitaller.com" value={form.website} onChange={e=>setF("website",e.target.value)} /></div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button style={S.btn("primary")} onClick={()=>setStep(2)} disabled={!form.name.trim()||!form.city.trim()}>Continuar →</button>
            </div>
          </div>
        )}

        {/* PASO 2: Especialidades */}
        {step===2&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 2 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:8 }}>Especialidades</h2>
            <p style={{ ...S.muted, marginBottom:20 }}>¿En qué tipo de relojes os especializáis?</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
              {SPECIALTIES.map(s=>(
                <label key={s.id} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 14px", borderRadius:8, border:`1px solid ${form.specialties.includes(s.id)?"#1a2744":"#e8e8e8"}`, background:form.specialties.includes(s.id)?"#f0f4ff":"#fff" }}>
                  <input type="checkbox" checked={form.specialties.includes(s.id)} onChange={()=>toggleArr("specialties",s.id)} style={{ accentColor:"#1a2744" }} />
                  <span style={{ fontSize:13, fontWeight:form.specialties.includes(s.id)?600:400 }}>{s.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button style={S.btn("outline")} onClick={()=>setStep(1)}>← Atrás</button>
              <button style={S.btn("primary")} onClick={()=>setStep(3)}>Continuar →</button>
            </div>
          </div>
        )}

        {/* PASO 3: Marcas */}
        {step===3&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 3 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:8 }}>Marcas</h2>
            <p style={{ ...S.muted, marginBottom:20 }}>¿Con qué marcas trabajáis habitualmente?</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
              {BRANDS.map(b=>(
                <button key={b} onClick={()=>toggleArr("brands",b)}
                  style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${form.brands.includes(b)?"#b8963e":"#e0ddd6"}`, background:form.brands.includes(b)?"#b8963e":"#fff", color:form.brands.includes(b)?"#fff":"#666", cursor:"pointer", fontSize:12, fontFamily:"'DM Mono',monospace", textTransform:"uppercase", letterSpacing:1 }}>{b}</button>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button style={S.btn("outline")} onClick={()=>setStep(2)}>← Atrás</button>
              <button style={S.btn("primary")} onClick={()=>setStep(4)}>Continuar →</button>
            </div>
          </div>
        )}

        {/* PASO 4: Foto y descripción */}
        {step===4&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 4 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:20 }}>Foto y descripción</h2>

            <div style={{ marginBottom:16 }}>
              <span style={S.label}>Foto del taller</span>
              {form.photo_url
                ? <div style={{ position:"relative", display:"inline-block" }}>
                    <img src={form.photo_url} alt="" style={{ height:120, borderRadius:8, display:"block" }} />
                    <button style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", borderRadius:"50%", width:24, height:24, cursor:"pointer" }} onClick={()=>setF("photo_url","")}>×</button>
                  </div>
                : <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"16px", border:"2px dashed #e0ddd6", borderRadius:8, color:"#888", fontSize:13 }}>
                    {uploading?"⏳ Subiendo…":"📷 Subir foto del taller"}
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>e.target.files[0]&&uploadPhoto(e.target.files[0])} />
                  </label>
              }
            </div>

            <div style={{ marginBottom:24 }}>
              <span style={S.label}>Descripción del taller</span>
              <textarea style={{ ...S.input, resize:"none" }} rows={4} placeholder="Cuéntanos sobre tu taller: historia, servicios especiales, certificaciones..." value={form.description} onChange={e=>setF("description",e.target.value)} />
            </div>

            {/* Resumen */}
            <div style={{ background:"#f8f6f0", borderRadius:8, padding:"14px 16px", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Resumen</div>
              <div style={{ fontSize:13, color:"#555", lineHeight:1.8 }}>
                <div>📍 {form.name} · {form.city}</div>
                {form.specialties.length>0&&<div>⚙️ {form.specialties.length} especialidades</div>}
                {form.brands.length>0&&<div>🏷️ {form.brands.length} marcas</div>}
              </div>
            </div>

            <div style={{ padding:"10px 14px", background:"#fff8e8", borderRadius:8, marginBottom:20, fontSize:12, color:"#b8963e" }}>
              ⏳ Tu perfil será revisado por el equipo de Wich Woch antes de aparecer como verificado.
            </div>

            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button style={S.btn("outline")} onClick={()=>setStep(3)}>← Atrás</button>
              <button style={S.btn("primary")} onClick={save} disabled={saving}>{saving?"Guardando…":"Crear perfil de taller →"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
