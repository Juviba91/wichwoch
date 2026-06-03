import { S } from "../data/constants";

export function Footer({ onNavigate }) {
  return (
    <footer style={{ background:"#1a2744", color:"rgba(255,255,255,0.7)", marginTop:48, padding:"40px 0 24px" }}>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"0 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:32, marginBottom:32 }}>
          {/* Brand */}
          <div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:20, fontWeight:700, color:"#fff", marginBottom:8 }}>wich woch</div>
            <p style={{ fontSize:13, lineHeight:1.7, color:"rgba(255,255,255,0.5)", maxWidth:240 }}>La red social de los amantes de los relojes. Gestiona tu colección, descubre nuevos modelos y conecta con la comunidad relojera.</p>
          </div>
          {/* Plataforma */}
          <div>
            <div style={{ fontWeight:700, fontSize:12, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:14, fontFamily:"'DM Mono',monospace" }}>Plataforma</div>
            {[["feed","Feed"],["explore","Explorar"],["relojes","Relojes"],["foros","Foros"],["listas","Listas"]].map(([page,label])=>(
              <div key={page} style={{ marginBottom:8 }}><button onClick={()=>onNavigate(page)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:13, fontFamily:"'DM Sans',sans-serif", padding:0, textAlign:"left" }}>{label}</button></div>
            ))}
          </div>
          {/* Comunidad */}
          <div>
            <div style={{ fontWeight:700, fontSize:12, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:14, fontFamily:"'DM Mono',monospace" }}>Comunidad</div>
            {[["talleres","Talleres"],["mantenimiento","Mantenimiento"],["garage","Mi Garage"],["ranking","Rankings"]].map(([page,label])=>(
              <div key={page} style={{ marginBottom:8 }}><button onClick={()=>onNavigate(page)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:13, fontFamily:"'DM Sans',sans-serif", padding:0, textAlign:"left" }}>{label}</button></div>
            ))}
          </div>
          {/* Empresa */}
          <div>
            <div style={{ fontWeight:700, fontSize:12, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:14, fontFamily:"'DM Mono',monospace" }}>Empresa</div>
            <div style={{ marginBottom:8 }}><a href="mailto:jdevill@hotmail.com" target="_blank" rel="noreferrer" style={{ color:"rgba(255,255,255,0.6)", fontSize:13, textDecoration:"none" }}>Contacto</a></div>
            <div style={{ marginBottom:8 }}><a href="mailto:jdevill@hotmail.com" target="_blank" rel="noreferrer" style={{ color:"rgba(255,255,255,0.6)", fontSize:13, textDecoration:"none" }}>Para marcas</a></div>
            <div style={{ marginBottom:8 }}><a href="mailto:jdevill@hotmail.com" target="_blank" rel="noreferrer" style={{ color:"rgba(255,255,255,0.6)", fontSize:13, textDecoration:"none" }}>Para talleres</a></div>
          </div>
        </div>
        {/* Bottom */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>© {new Date().getFullYear()} Wich Woch. Todos los derechos reservados.</div>
          <div style={{ display:"flex", gap:16 }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>Privacidad</span>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>Términos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
