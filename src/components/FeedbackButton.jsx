import { useState } from "react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");

  function send() {
    if(!msg.trim()) return;
    const subject = encodeURIComponent("Feedback Wich Woch");
    const body = encodeURIComponent(msg.trim());
    window.open(`mailto:jdevill@hotmail.com?subject=${subject}&body=${body}`, "_blank");
    setMsg("");
    setOpen(false);
  }

  return (
    <>
      <button onClick={()=>setOpen(true)} style={{ position:"fixed", bottom:24, right:24, background:"#1a2744", color:"#fff", border:"none", borderRadius:24, padding:"10px 18px", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:"pointer", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", zIndex:100, display:"flex", alignItems:"center", gap:8 }}>
        💬 Feedback
      </button>

      {open&&(
        <div style={{ position:"fixed", bottom:80, right:24, width:320, background:"#fff", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.15)", zIndex:200, padding:20, border:"1px solid #e8e8e8" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:15, fontFamily:"'DM Mono',monospace" }}>¿Qué piensas?</div>
            <button onClick={()=>setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#aaa" }}>×</button>
          </div>
          <textarea autoFocus rows={4} style={{ width:"100%", border:"1px solid #e0ddd6", borderRadius:8, padding:"10px 12px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", boxSizing:"border-box", marginBottom:12 }}
            placeholder="Cuéntanos qué funciona, qué falla, o qué echarías de menos..."
            value={msg} onChange={e=>setMsg(e.target.value)} />
          <button onClick={send} disabled={!msg.trim()} style={{ width:"100%", background:"#1a2744", border:"none", color:"#fff", borderRadius:8, padding:"10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:600, cursor:"pointer" }}>
            Enviar feedback
          </button>
        </div>
      )}
    </>
  );
}
