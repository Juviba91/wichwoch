import { useState } from "react";
import { supabase } from "../lib/supabase";
import { S, BRAND_COLORS } from "../data/constants";

const BRANDS = [
  {slug:"rolex",name:"Rolex"},{slug:"omega",name:"Omega"},{slug:"patek",name:"Patek Philippe"},
  {slug:"ap",name:"Audemars Piguet"},{slug:"iwc",name:"IWC"},{slug:"jlc",name:"Jaeger-LeCoultre"},
  {slug:"tudor",name:"Tudor"},{slug:"cartier",name:"Cartier"},{slug:"breitling",name:"Breitling"},
  {slug:"tag",name:"TAG Heuer"},{slug:"vc",name:"Vacheron Constantin"},{slug:"hublot",name:"Hublot"},
  {slug:"panerai",name:"Panerai"},{slug:"gs",name:"Grand Seiko"},{slug:"zenith",name:"Zenith"},
  {slug:"otra",name:"Otra marca"},
];

const TYPES = ["sport","dress","pilot","diver","chrono"];
const GENDERS = [{id:"unisex",label:"Unisex"},{id:"hombre",label:"Hombre"},{id:"mujer",label:"Mujer"}];

export function CreateWatchPage({ currentUser, onNavigate }) {
  const [form, setForm] = useState({
    brand_slug:"", model:"", reference:"", year:"",
    watch_type:"sport", gender:"unisex", market_price:"",
    description:"",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  async function submit() {
    if(!form.brand_slug||!form.model.trim()||!form.reference.trim()) {
      setError("Marca, modelo y referencia son obligatorios."); return;
    }
    setSaving(true); setError(null);
    const slug = `${form.brand_slug}_${form.model.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"").slice(0,30)}`;
    const {error:err} = await supabase.from("watches").insert({
      brand_slug: form.brand_slug,
      model: form.model.trim(),
      reference: form.reference.trim(),
      year: form.year ? parseInt(form.year) : null,
      slug,
      watch_type: form.watch_type,
      gender: form.gender,
      market_price: form.market_price ? `~${form.market_price}€` : null,
      created_by: currentUser.id,
      status: "pending",
    });
    if(err) { setError(err.message); setSaving(false); return; }
    setSaved(true); setSaving(false);
  }

  if(saved) return (
    <div style={{ ...S.card, textAlign:"center", padding:48 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
      <div style={{ fontWeight:700, fontSize:20, marginBottom:8 }}>¡Reloj enviado!</div>
      <p style={{ ...S.muted, marginBottom:24 }}>Lo revisaremos y lo publicaremos pronto. Gracias por contribuir a la comunidad.</p>
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        <button style={S.btn("outline")} onClick={()=>onNavigate("relojes")}>Ver relojes</button>
        <button style={S.btn("primary")} onClick={()=>{ setSaved(false); setForm({brand_slug:"",model:"",reference:"",year:"",watch_type:"sport",gender:"unisex",market_price:"",description:""}); }}>Añadir otro</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ ...S.row, marginBottom:24 }}>
        <button style={{ ...S.btn("outline"), fontSize:12 }} onClick={()=>onNavigate("relojes")}>← Volver</button>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>Añadir reloj</h2>
          <p style={S.muted}>¿No encuentras un reloj? Añádelo tú. Lo revisaremos antes de publicarlo.</p>
        </div>
      </div>

      {error&&<div style={S.error}>{error}</div>}

      <div style={S.card}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {/* Marca */}
          <div style={{ gridColumn:"1/-1" }}>
            <span style={S.label}>Marca *</span>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {BRANDS.map(b=>(
                <button key={b.slug} onClick={()=>setF("brand_slug",b.slug)}
                  style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${form.brand_slug===b.slug?BRAND_COLORS[b.slug]||"#1a2744":"#e8e8e8"}`, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", background:form.brand_slug===b.slug?BRAND_COLORS[b.slug]||"#1a2744":"#fff", color:form.brand_slug===b.slug?"#fff":"#444", fontWeight:form.brand_slug===b.slug?600:400 }}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={S.label}>Modelo *</span>
            <input style={S.input} placeholder="Submariner Date" value={form.model} onChange={e=>setF("model",e.target.value)} />
          </div>

          <div>
            <span style={S.label}>Referencia *</span>
            <input style={S.input} placeholder="126610LN" value={form.reference} onChange={e=>setF("reference",e.target.value)} />
          </div>

          <div>
            <span style={S.label}>Año de lanzamiento</span>
            <input style={S.input} type="number" placeholder="2020" min="1900" max={new Date().getFullYear()} value={form.year} onChange={e=>setF("year",e.target.value)} />
          </div>

          <div>
            <span style={S.label}>Precio de mercado aproximado (€)</span>
            <input style={S.input} type="number" placeholder="9500" value={form.market_price} onChange={e=>setF("market_price",e.target.value)} />
          </div>

          <div>
            <span style={S.label}>Tipo</span>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {TYPES.map(t=>(
                <button key={t} onClick={()=>setF("watch_type",t)}
                  style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, fontFamily:"'DM Mono',monospace", background:form.watch_type===t?"#1a2744":"#f0ede6", color:form.watch_type===t?"#fff":"#666", textTransform:"capitalize" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={S.label}>Género</span>
            <div style={{ display:"flex", gap:6 }}>
              {GENDERS.map(g=>(
                <button key={g.id} onClick={()=>setF("gender",g.id)}
                  style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif", background:form.gender===g.id?"#1a2744":"#f0ede6", color:form.gender===g.id?"#fff":"#666" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop:16, padding:"12px 16px", background:"#f8f6f0", borderRadius:8 }}>
          <p style={{ fontSize:13, color:"#888", margin:0 }}>📋 Tu propuesta será revisada por el equipo de Wich Woch antes de aparecer en el catálogo. Normalmente en menos de 48h.</p>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
          <button style={S.btn("primary")} onClick={submit} disabled={saving}>{saving?"Enviando…":"Enviar propuesta"}</button>
        </div>
      </div>
    </div>
  );
}
