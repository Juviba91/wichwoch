import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, BRAND_COLORS, brandFromSlug } from "../data/constants";
import { Avatar } from "../components/UI";

const AVATAR_COLORS = [
  "#1a2744","#006039","#1a3a6b","#8b0000","#2c4a2e",
  "#c8a84b","#4a4a8a","#2563eb","#4a7c59","#b45309"
];

const FOUNDER_LIMIT = 500;

export function OnboardingPage({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Watch step
  const [watchSearch, setWatchSearch] = useState("");
  const [watchSuggestions, setWatchSuggestions] = useState([]);
  const [selectedWatch, setSelectedWatch] = useState(null);

  // Service step
  const [condition, setCondition] = useState("muy_bueno");
  const [hasBox, setHasBox] = useState(false);
  const [hasPapers, setHasPapers] = useState(false);
  const [purchaseYear, setPurchaseYear] = useState("");
  const [lastService, setLastService] = useState("");
  const [workshop, setWorkshop] = useState("");

  // Profile step
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarColor, setAvatarColor] = useState("#1a2744");

  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    supabase.from("profiles").select("*",{count:"exact",head:true})
      .then(({count})=>{
        setTotalUsers(count||0);
        // Pre-assign founder badge on first load
        if((count||0) <= FOUNDER_LIMIT) {
          supabase.from("user_badges").insert({
            user_id: user.id,
            badge_type: "founder",
            brand_slug: null
          }).catch(()=>{});
        }
      });
  },[]);

  async function searchWatches(q) {
    if(!q||q.length<2){setWatchSuggestions([]);return;}
    const {data}=await supabase.from("watches").select("id,slug,model,brand_slug,image_url").or(`slug.ilike.%${q}%,model.ilike.%${q}%`).eq("status","approved").limit(8);
    setWatchSuggestions(data||[]);
  }

  async function saveAndComplete() {
    setSaving(true);

    // 1. Update profile
    await supabase.from("profiles").update({
      name: name.trim()||user.email.split("@")[0],
      location: location.trim()||null,
      bio: bio.trim()||null,
      avatar_color: avatarColor,
      onboarding_complete: true,
    }).eq("id",user.id);

    // 2. Add watch to garage if selected
    if(selectedWatch) {
      const {data:reg}=await supabase.from("watch_registrations").insert({
        user_id: user.id,
        watch_id: selectedWatch.id,
        is_public: true,
        condition,
        has_box: hasBox,
        has_papers: hasPapers,
        purchase_year: purchaseYear?parseInt(purchaseYear):null,
      }).select().single();

      // 3. Add service history if provided
      if(reg&&lastService) {
        await supabase.from("watch_service_history").insert({
          registration_id: reg.id,
          user_id: user.id,
          service_date: lastService,
          workshop: workshop||null,
          description: "Revisión registrada en el onboarding",
        });
      }

      // +10 Flow por añadir reloj
      await supabase.rpc("increment_flow",{user_id:user.id,amount:10}).catch(()=>{});
    }

    // 4. +20 Flow por completar perfil
    await supabase.rpc("increment_flow",{user_id:user.id,amount:20}).catch(()=>{});

    // 5. Badge fundador si está entre los primeros 500
    if(totalUsers<=FOUNDER_LIMIT) {
      await supabase.from("user_badges").insert({
        user_id: user.id,
        badge_type: "founder",
        brand_slug: null
      }).catch(()=>{});
    }

    setSaving(false);
    onComplete();
  }

  async function skip() {
    await supabase.from("profiles").update({ onboarding_complete:true }).eq("id",user.id);
    onComplete();
  }

  const isFounder = totalUsers <= FOUNDER_LIMIT;
  const bg = selectedWatch ? BRAND_COLORS[(selectedWatch.slug||"").split("_")[0]]||"#1a2744" : "#1a2744";

  return (
    <div style={{ minHeight:"100vh", background:"#f8f7f4", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width:"100%", maxWidth:520 }}>

        {/* Progress */}
        <div style={{ display:"flex", gap:6, marginBottom:32, justifyContent:"center" }}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{ height:4, flex:1, borderRadius:2, background:i<=step?"#1a2744":"#e0ddd6", transition:"background 0.3s" }} />
          ))}
        </div>

        {/* Founder badge teaser */}
        {isFounder&&(
          <div style={{ background:"linear-gradient(135deg,#1a2744,#2a3a5a)", borderRadius:10, padding:"10px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🎖️</span>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:"#b8963e" }}>Badge Fundador disponible</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>Estás entre los primeros {FOUNDER_LIMIT} usuarios de Wich Woch</div>
            </div>
          </div>
        )}

        {/* ─── STEP 1: Tu primer reloj ─── */}
        {step===1&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 1 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:6 }}>¿Cuál es tu reloj?</h2>
            <p style={{ ...S.muted, marginBottom:20 }}>Añade el reloj que más llevas. Lo guardaremos en tu Garage.</p>

            <div style={{ position:"relative" }}>
              <input style={{ ...S.input, fontSize:15, padding:"12px 16px" }}
                placeholder="Submariner, Speedmaster, Royal Oak..."
                value={watchSearch}
                onChange={e=>{ setWatchSearch(e.target.value); searchWatches(e.target.value); }}
                autoFocus />
              {watchSuggestions.length>0&&(
                <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e8e8e8", borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", zIndex:50, marginTop:4 }}>
                  {watchSuggestions.map(w=>(
                    <div key={w.id} style={{ padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f5f5f5", display:"flex", alignItems:"center", gap:12 }}
                      onMouseDown={()=>{ setSelectedWatch(w); setWatchSearch(w.model); setWatchSuggestions([]); }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:BRAND_COLORS[(w.slug||"").split("_")[0]]||"#1a2744", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>⌚</div>
                      <div>
                        <div style={{ fontWeight:600 }}>{w.model}</div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#aaa" }}>{brandFromSlug(w.slug)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedWatch&&(
              <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14, padding:"12px 16px", background:"#f0f9f4", borderRadius:8, border:"1px solid #b3dfc4" }}>
                <div style={{ width:40, height:40, borderRadius:8, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⌚</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700 }}>{selectedWatch.model}</div>
                  <div style={{ fontSize:12, color:"#888" }}>{brandFromSlug(selectedWatch.slug)}</div>
                </div>
                <span style={{ color:"#16a34a", fontSize:18 }}>✓</span>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:24, alignItems:"center" }}>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:13, fontFamily:"'DM Sans',sans-serif" }} onClick={()=>setStep(2)}>
                No tengo reloj ahora mismo →
              </button>
              <button style={S.btn("primary")} onClick={()=>setStep(2)} disabled={!selectedWatch}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Estado y mantenimiento ─── */}
        {step===2&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 2 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:6 }}>
              {selectedWatch?`Tu ${selectedWatch.model}`:"Estado del reloj"}
            </h2>
            <p style={{ ...S.muted, marginBottom:20 }}>Esto nos ayuda a recordarte cuándo revisarlo.</p>

            {selectedWatch&&(<>
              {/* Estado */}
              <div style={{ marginBottom:16 }}>
                <span style={S.label}>Estado</span>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[{id:"mint",label:"Mint",color:"#16a34a"},{id:"muy_bueno",label:"Muy bueno",color:"#2563eb"},{id:"bueno",label:"Bueno",color:"#d97706"},{id:"usado",label:"Usado",color:"#dc2626"}].map(c=>(
                    <label key={c.id} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"10px 12px", borderRadius:8, border:`1px solid ${condition===c.id?c.color:"#e8e8e8"}`, background:condition===c.id?`${c.color}10`:"#fff" }}>
                      <input type="radio" name="cond" value={c.id} checked={condition===c.id} onChange={()=>setCondition(c.id)} style={{ accentColor:c.color }} />
                      <span style={{ fontWeight:600, fontSize:13, color:c.color }}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Caja y papeles */}
              <div style={{ marginBottom:16 }}>
                <span style={S.label}>¿Tienes la documentación original?</span>
                <div style={{ display:"flex", gap:16 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                    <input type="checkbox" checked={hasBox} onChange={e=>setHasBox(e.target.checked)} />
                    <span style={{ fontSize:13 }}>📦 Caja original</span>
                  </label>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                    <input type="checkbox" checked={hasPapers} onChange={e=>setHasPapers(e.target.checked)} />
                    <span style={{ fontSize:13 }}>📄 Papeles / garantía</span>
                  </label>
                </div>
              </div>

              {/* Año compra */}
              <div style={{ marginBottom:16 }}>
                <span style={S.label}>¿Cuándo lo compraste?</span>
                <input style={S.input} type="number" placeholder="2021" min="1950" max={new Date().getFullYear()} value={purchaseYear} onChange={e=>setPurchaseYear(e.target.value)} />
              </div>

              {/* Último servicio */}
              <div style={{ marginBottom:8 }}>
                <span style={S.label}>¿Cuándo fue el último servicio? <span style={{ color:"#aaa",fontWeight:400 }}>(opcional)</span></span>
                <input style={{ ...S.input, marginBottom:8 }} type="date" value={lastService} onChange={e=>setLastService(e.target.value)} />
                {lastService&&<input style={S.input} placeholder="¿En qué taller?" value={workshop} onChange={e=>setWorkshop(e.target.value)} />}
              </div>

              {/* Service tip */}
              <div style={{ background:"#f8f6f0", borderRadius:8, padding:"10px 14px", marginTop:12, fontSize:12, color:"#666" }}>
                🔧 Te avisaremos cuando sea hora de revisar tu reloj según las recomendaciones del fabricante.
              </div>
            </>)}

            {!selectedWatch&&(
              <div style={{ textAlign:"center", padding:20, color:"#888" }}>
                <p>No hay problema, puedes añadir relojes a tu Garage en cualquier momento.</p>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
              <button style={{ ...S.btn("outline") }} onClick={()=>setStep(1)}>← Atrás</button>
              <button style={S.btn("primary")} onClick={()=>setStep(3)}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Tu perfil ─── */}
        {step===3&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 3 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:6 }}>Tu perfil</h2>
            <p style={{ ...S.muted, marginBottom:20 }}>Cuéntanos un poco sobre ti.</p>

            {/* Avatar preview */}
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
              <Avatar name={name||user.email} size={60} color={avatarColor} />
              <div>
                <span style={S.label}>Color de avatar</span>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {AVATAR_COLORS.map(c=>(
                    <div key={c} style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:avatarColor===c?"3px solid #1a1a1a":"3px solid transparent", boxSizing:"border-box" }} onClick={()=>setAvatarColor(c)} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <span style={S.label}>Tu nombre</span>
              <input style={S.input} placeholder="Juan García" value={name} onChange={e=>setName(e.target.value)} autoFocus />
            </div>
            <div style={{ marginBottom:12 }}>
              <span style={S.label}>Ciudad</span>
              <input style={S.input} placeholder="Madrid" value={location} onChange={e=>setLocation(e.target.value)} />
            </div>
            <div style={{ marginBottom:20 }}>
              <span style={S.label}>Bio corta <span style={{ color:"#aaa",fontWeight:400 }}>(opcional)</span></span>
              <textarea style={{ ...S.input, resize:"none" }} rows={2} placeholder="Coleccionista de relojes vintage. Apasionado de la relojería suiza." value={bio} onChange={e=>setBio(e.target.value)} />
            </div>

            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button style={S.btn("outline")} onClick={()=>setStep(2)}>← Atrás</button>
              <button style={S.btn("primary")} onClick={()=>setStep(4)}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Resumen y completar ─── */}
        {step===4&&(
          <div style={S.card}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#b8963e", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Paso 4 de 4</div>
            <h2 style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, marginBottom:6 }}>¡Listo para empezar!</h2>
            <p style={{ ...S.muted, marginBottom:20 }}>Esto es lo que hemos configurado para ti.</p>

            {/* Summary */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              {selectedWatch&&(
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"#f8f6f0", borderRadius:8 }}>
                  <span style={{ fontSize:20 }}>⌚</span>
                  <div>
                    <div style={{ fontWeight:600 }}>{selectedWatch.model} añadido al Garage</div>
                    <div style={{ fontSize:12, color:"#888" }}>Estado: {condition} {hasBox?"· Caja ✓":""} {hasPapers?"· Papeles ✓":""}</div>
                  </div>
                  <span style={{ marginLeft:"auto", color:"#16a34a", fontWeight:700 }}>+10 Flow</span>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"#f8f6f0", borderRadius:8 }}>
                <Avatar name={name||user.email} size={36} color={avatarColor} />
                <div>
                  <div style={{ fontWeight:600 }}>{name||user.email.split("@")[0]}</div>
                  {location&&<div style={{ fontSize:12, color:"#888" }}>{location}</div>}
                </div>
                <span style={{ marginLeft:"auto", color:"#16a34a", fontWeight:700 }}>+20 Flow</span>
              </div>
              {isFounder&&(
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"linear-gradient(135deg,#1a2744,#2a3a5a)", borderRadius:8 }}>
                  <span style={{ fontSize:24 }}>🎖️</span>
                  <div>
                    <div style={{ fontWeight:700, color:"#b8963e" }}>Badge Fundador</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>Eres de los primeros {FOUNDER_LIMIT} en Wich Woch</div>
                  </div>
                </div>
              )}
            </div>

            {/* Total flow */}
            <div style={{ textAlign:"center", marginBottom:24, padding:"16px", background:"#f0f9f4", borderRadius:8, border:"1px solid #b3dfc4" }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:32, fontWeight:700, color:"#b8963e" }}>
                +{selectedWatch?30:20} ⚡ Flow
              </div>
              <div style={{ fontSize:13, color:"#2a7a4a", fontWeight:600 }}>ganado al completar el onboarding</div>
            </div>

            <button style={{ ...S.btn("primary"), width:"100%", padding:"14px", fontSize:15, textAlign:"center" }} onClick={saveAndComplete} disabled={saving}>
              {saving?"Configurando tu cuenta…":"¡Empezar en Wich Woch! →"}
            </button>

            <button style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:12, fontFamily:"'DM Sans',sans-serif", display:"block", margin:"12px auto 0", textDecoration:"underline" }} onClick={()=>setStep(3)}>
              ← Atrás
            </button>
          </div>
        )}

        {/* Skip */}
        {step===1&&(
          <div style={{ textAlign:"center", marginTop:16 }}>
            <button style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:12, fontFamily:"'DM Sans',sans-serif" }} onClick={skip}>
              Saltar por ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
