import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { S, brandColor, brandFromSlug, timeAgo } from "../data/constants";
import { Avatar, Spinner } from "../components/UI";

export function ListasPage({ currentUser, onNavigate }) {
  const [lists, setLists] = useState([]);
  const [myLists, setMyLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", is_public:true });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null); // list detail view

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    const [{data:pub},{data:mine}] = await Promise.all([
      supabase.from("watch_lists")
        .select("*, user:profiles(id,name,handle,avatar_color), items:watch_list_items(id, watch:watches(id,slug,model,image_url,brand_slug))")
        .eq("is_public",true).order("created_at",{ascending:false}).limit(20),
      currentUser?.id ? supabase.from("watch_lists")
        .select("*, items:watch_list_items(id, watch:watches(id,slug,model,image_url,brand_slug))")
        .eq("user_id",currentUser.id).order("created_at",{ascending:false}) : {data:[]},
    ]);
    setLists(pub||[]);
    setMyLists(mine.data||[]);
    setLoading(false);
  }

  async function createList() {
    if(!form.title.trim()) return;
    setSaving(true);
    const {data}=await supabase.from("watch_lists").insert({
      user_id:currentUser.id,
      title:form.title.trim(),
      description:form.description.trim()||null,
      is_public:form.is_public,
    }).select().single();
    setShowCreate(false);
    setForm({title:"",description:"",is_public:true});
    await load();
    if(data) setSelected(data.id);
    setSaving(false);
  }

  async function deleteList(id) {
    if(!window.confirm("¿Borrar esta lista?")) return;
    await supabase.from("watch_lists").delete().eq("id",id);
    setSelected(null);
    await load();
  }

  if(loading) return <Spinner />;

  // List detail view
  if(selected) {
    const list = [...lists,...myLists].find(l=>l.id===selected);
    if(!list) { setSelected(null); return null; }
    return <ListDetail list={list} currentUser={currentUser} onBack={()=>{ setSelected(null); load(); }} onNavigate={onNavigate} onDelete={deleteList} />;
  }

  return (
    <div>
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>Listas</h2>
          <p style={S.muted}>Colecciones temáticas de la comunidad</p>
        </div>
        {currentUser&&<button style={S.btn("primary")} onClick={()=>setShowCreate(true)}>+ Nueva lista</button>}
      </div>

      {showCreate&&(
        <div style={{ ...S.card, border:"1px solid #1a2744", marginBottom:20 }}>
          <h3 style={{ ...S.h2, marginBottom:16 }}>Nueva lista</h3>
          <div style={{ marginBottom:12 }}><span style={S.label}>Título</span><input style={S.input} placeholder="Ej: Relojes negros chulos" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus /></div>
          <div style={{ marginBottom:12 }}><span style={S.label}>Descripción <span style={{ color:"#aaa",fontWeight:400 }}>(opcional)</span></span><input style={S.input} placeholder="De qué trata esta lista..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} /></div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", marginBottom:16 }}>
            <input type="checkbox" checked={form.is_public} onChange={e=>setForm(f=>({...f,is_public:e.target.checked}))} />
            <span style={{ fontSize:13 }}>Lista pública — visible para todos</span>
          </label>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button style={S.btn("outline")} onClick={()=>setShowCreate(false)}>Cancelar</button>
            <button style={S.btn("primary")} onClick={createList} disabled={saving||!form.title.trim()}>{saving?"Creando…":"Crear lista"}</button>
          </div>
        </div>
      )}

      {/* Mis listas */}
      {myLists.length>0&&(
        <div style={{ marginBottom:28 }}>
          <h3 style={{ ...S.h2, marginBottom:12 }}>Mis listas</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
            {myLists.map(l=><ListCard key={l.id} list={l} onClick={()=>setSelected(l.id)} />)}
          </div>
        </div>
      )}

      {/* Listas de la comunidad */}
      <h3 style={{ ...S.h2, marginBottom:12 }}>De la comunidad</h3>
      {lists.length===0&&<div style={{ ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin listas aún. ¡Sé el primero!</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
        {lists.filter(l=>!myLists.find(m=>m.id===l.id)).map(l=><ListCard key={l.id} list={l} onClick={()=>setSelected(l.id)} showAuthor />)}
      </div>
    </div>
  );
}

function ListCard({ list, onClick, showAuthor=false }) {
  const items = list.items?.slice(0,3)||[];
  return (
    <div style={{ ...S.card, cursor:"pointer", padding:0, overflow:"hidden", marginBottom:0 }} onClick={onClick}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)"; }}>
      {/* Mini grid de relojes */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", height:80 }}>
        {[0,1,2].map(i=>{
          const w = items[i]?.watch;
          const bg = w ? brandColor(w.slug) : "#f0ede6";
          return (
            <div key={i} style={{ background:`linear-gradient(135deg,${bg},${bg}88)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {w?.image_url
                ? <img src={w.image_url} alt="" style={{ height:"80%", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
                : <span style={{ fontSize:18, opacity:0.4 }}>⌚</span>
              }
            </div>
          );
        })}
      </div>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{list.title}</div>
        {list.description&&<p style={{ fontSize:12, color:"#888", margin:"0 0 6px", lineHeight:1.4 }}>{list.description.slice(0,60)}{list.description.length>60?"…":""}</p>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#aaa" }}>{list.items?.length||0} relojes</span>
          {showAuthor&&list.user&&<span style={{ fontSize:11, color:"#aaa" }}>@{list.user.handle}</span>}
          {!list.is_public&&<span style={{ fontSize:10, color:"#888", fontFamily:"'DM Mono',monospace" }}>🔒 Privada</span>}
        </div>
      </div>
    </div>
  );
}

function ListDetail({ list, currentUser, onBack, onNavigate, onDelete }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchSearch, setWatchSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const isOwn = currentUser?.id === list.user_id;

  useEffect(()=>{ loadItems(); },[list.id]);

  async function loadItems() {
    const {data}=await supabase.from("watch_list_items")
      .select("*, watch:watches(id,slug,model,reference,brand_slug,image_url,market_price)")
      .eq("list_id",list.id).order("created_at",{ascending:true});
    setItems(data||[]); setLoading(false);
  }

  async function searchWatches(q) {
    if(!q||q.length<2){setSuggestions([]);return;}
    const {data}=await supabase.from("watches").select("id,slug,model,brand_slug").or(`slug.ilike.%${q}%,model.ilike.%${q}%`).limit(6);
    setSuggestions(data||[]);
  }

  async function addWatch(watch) {
    await supabase.from("watch_list_items").insert({list_id:list.id,watch_id:watch.id}).catch(()=>{});
    setWatchSearch(""); setSuggestions([]);
    await loadItems();
  }

  async function removeItem(id) {
    await supabase.from("watch_list_items").delete().eq("id",id);
    await loadItems();
  }

  return (
    <div>
      <button style={{ ...S.btn("outline"), marginBottom:20, fontSize:12 }} onClick={onBack}>← Volver a listas</button>
      <div style={{ ...S.row, justifyContent:"space-between", marginBottom:20 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom:4 }}>{list.title}</h2>
          {list.description&&<p style={S.muted}>{list.description}</p>}
          <div style={{ fontSize:12, color:"#aaa", marginTop:4 }}>{items.length} relojes · {list.is_public?"Pública":"Privada"}</div>
        </div>
        {isOwn&&<button style={{ ...S.btn("outline"), fontSize:12, color:"#dc2626", borderColor:"#fcc" }} onClick={()=>onDelete(list.id)}>Borrar lista</button>}
      </div>

      {isOwn&&(
        <div style={{ ...S.card, marginBottom:20, position:"relative" }}>
          <span style={S.label}>Añadir reloj</span>
          <input style={S.input} placeholder="Busca un reloj..." value={watchSearch}
            onChange={e=>{ setWatchSearch(e.target.value); searchWatches(e.target.value); }} />
          {suggestions.length>0&&(
            <div style={{ position:"absolute", left:20, right:20, top:"100%", background:"#fff", border:"1px solid #e8e8e8", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.1)", zIndex:50 }}>
              {suggestions.map(w=>(
                <div key={w.id} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f5f5f5", fontSize:13 }}
                  onMouseDown={()=>addWatch(w)}>
                  <span style={{ fontWeight:600 }}>{w.model}</span>
                  <span style={{ color:"#aaa", marginLeft:8, fontFamily:"'DM Mono',monospace", fontSize:11 }}>{brandFromSlug(w.slug)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading?<Spinner />:(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
          {items.map(item=>item.watch&&(
            <div key={item.id} style={{ position:"relative" }}>
              <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid #ece9e2", cursor:"pointer", background:"#fff" }} onClick={()=>onNavigate("watch",item.watch.slug)}>
                <div style={{ height:130, background:`linear-gradient(135deg,${brandColor(item.watch.slug)},${brandColor(item.watch.slug)}88)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {item.watch.image_url
                    ? <img src={item.watch.image_url} alt="" style={{ height:"85%", objectFit:"contain", filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={e=>e.target.style.display="none"} />
                    : <span style={{ fontSize:32 }}>⌚</span>
                  }
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{item.watch.model}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#aaa" }}>{brandFromSlug(item.watch.slug)}</div>
                  {item.watch.market_price&&<div style={{ fontSize:11, color:"#b8963e", marginTop:2 }}>{item.watch.market_price}</div>}
                </div>
              </div>
              {isOwn&&<button style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:"50%", width:24, height:24, cursor:"pointer", fontSize:12 }} onClick={()=>removeItem(item.id)}>×</button>}
            </div>
          ))}
          {items.length===0&&<div style={{ gridColumn:"1/-1", ...S.card, textAlign:"center", color:"#888", padding:32 }}>Sin relojes en esta lista aún.</div>}
        </div>
      )}
    </div>
  );
}
