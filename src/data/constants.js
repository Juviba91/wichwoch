export const BRAND_COLORS = {
  rolex:"#006039", omega:"#c8a84b", patek:"#1a3a6b", ap:"#1a1a1a",
  iwc:"#8b0000", jlc:"#2c4a2e", tudor:"#6b0000", cartier:"#8b0000",
  breitling:"#1a3a6b", tag:"#c00000", vc:"#2c2c5e", hublot:"#2a2a2a",
  panerai:"#1a3020", gs:"#1a1a3a", zenith:"#1a2744"
};

export const BRAND_LOGOS = {
  rolex:"⌚", omega:"Ω", patek:"P", ap:"AP", iwc:"IWC", jlc:"JLC", tudor:"T",
  cartier:"C", breitling:"B", tag:"T", vc:"VC", hublot:"H", panerai:"P", gs:"GS", zenith:"Z"
};

const STORAGE = "https://kmxpachollvsiytppvyy.supabase.co/storage/v1/object/public/brand-logos";
export const BRAND_LOGO_URLS = {
  rolex:`${STORAGE}/rolex.jpeg`,
  omega:`${STORAGE}/omega.jpeg`,
  patek:`${STORAGE}/patek.jpeg`,
  ap:`${STORAGE}/ap.jpeg`,
  iwc:`${STORAGE}/iwc.jpeg`,
  jlc:`${STORAGE}/jlc.jpeg`,
  tudor:`${STORAGE}/tudor.jpeg`,
  cartier:`${STORAGE}/cartier.jpeg`,
  breitling:`${STORAGE}/breitling.jpeg`,
  tag:`${STORAGE}/tag.jpeg`,
  vc:`${STORAGE}/vc.jpeg`,
  hublot:`${STORAGE}/hublot.jpeg`,
  panerai:`${STORAGE}/panerai.jpeg`,
  gs:`${STORAGE}/gs.jpeg`,
  zenith:`${STORAGE}/zenith.jpeg`,
};

const STORAGE = "https://kmxpachollvsiytppvyy.supabase.co/storage/v1/object/public/brand-logos";
export const BRAND_LOGO_URLS = {
  rolex:`${STORAGE}/rolex.jpeg`,
  omega:`${STORAGE}/omega.jpeg`,
  patek:`${STORAGE}/patek.jpeg`,
  ap:`${STORAGE}/ap.jpeg`,
  iwc:`${STORAGE}/iwc.jpeg`,
  jlc:`${STORAGE}/jlc.jpeg`,
  tudor:`${STORAGE}/tudor.jpeg`,
  cartier:`${STORAGE}/cartier.jpeg`,
  breitling:`${STORAGE}/breitling.jpeg`,
  tag:`${STORAGE}/tag.jpeg`,
  vc:`${STORAGE}/vc.jpeg`,
  hublot:`${STORAGE}/hublot.jpeg`,
  panerai:`${STORAGE}/panerai.jpeg`,
  gs:`${STORAGE}/gs.jpeg`,
  zenith:`${STORAGE}/zenith.jpeg`,
};

export const BRAND_NAMES = {
  rolex:"Rolex", omega:"Omega", patek:"Patek Philippe", ap:"Audemars Piguet",
  iwc:"IWC", jlc:"Jaeger-LeCoultre", tudor:"Tudor", cartier:"Cartier",
  breitling:"Breitling", tag:"TAG Heuer", vc:"Vacheron Constantin",
  hublot:"Hublot", panerai:"Panerai", gs:"Grand Seiko", zenith:"Zenith"
};

export const AVATAR_COLORS = [
  "#1a1a1a","#006039","#1a3a6b","#8b0000","#2c4a2e","#c8a84b",
  "#4a4a8a","#7c3aed","#2563eb","#4a7c59","#b45309","#0369a1"
];

export const AVATAR_EMOJIS = [
  "⌚","🕰️","⚙️","🔩","🏅","🎖️","💠","🌑","📐","🔬","⬛","🔷","🏴","⚜️","🔮"
];

export const FLAIRS = [
  { id:"debate",        label:"Debate",        bg:"#e8f0ff", color:"#2563eb" },
  { id:"pregunta",      label:"Pregunta",      bg:"#fef3c7", color:"#d97706" },
  { id:"valoracion",    label:"Valoración",    bg:"#f0fdf4", color:"#16a34a" },
  { id:"coleccion",     label:"Colección",     bg:"#fdf2f8", color:"#9333ea" },
  { id:"mantenimiento", label:"Mantenimiento", bg:"#fff7ed", color:"#ea580c" },
  { id:"compraventa",   label:"Compraventa",   bg:"#f0f9ff", color:"#0284c7" },
  { id:"novedad",       label:"Novedad",       bg:"#fef2f2", color:"#dc2626" },
];

export const WEEKLY_THREADS = [
  { title:"⌚ ¿Qué llevas en la muñeca esta semana?", content:"Hilo semanal para compartir el reloj que estás llevando estos días." },
  { title:"🔧 Pregunta rápida de la semana", content:"¿Tienes una duda relojera que no merece hilo propio? Aquí es el sitio." },
  { title:"💰 ¿Cuál es tu mejor compra relojera?", content:"Cuéntanos el reloj que más valor te ha dado por el dinero invertido." },
  { title:"🏆 Debate: ¿El mejor reloj deportivo de la historia?", content:"Submariner, Royal Oak, Nautilus, Speedmaster... ¿Cuál elegirías tú?" },
  { title:"🌍 ¿Dónde comprais vuestros relojes?", content:"AD oficial, gris, segunda mano, Chrono24... Compartid vuestra experiencia." },
  { title:"🔍 Show us your collection", content:"Hilo para compartir vuestra colección completa." },
  { title:"📈 ¿Qué reloj comprarías hoy con 5.000€?", content:"Presupuesto cerrado, mercado nuevo o segunda mano. ¿Qué elegiríais?" },
  { title:"🕰️ Historia y curiosidades relojeras", content:"Compartid datos históricos o anécdotas que os hayan sorprendido." },
];

export const AUTO_FORUM_THREADS = [
  { watch_slug:"rolex_submariner", flair:"debate", title:"¿Sigue valiendo lo que cuesta el Submariner en 2025?", content:"Con el mercado gris disparado y los precios oficiales subiendo cada año, ¿sigue siendo el Submariner una compra justificada?" },
  { watch_slug:"omega_speedmaster", flair:"curiosidad", title:"El Speedmaster y la NASA: historia completa", content:"¿Sabíais que la NASA sometió a más de 10 relojes a pruebas extremas antes de elegir el Speedmaster?" },
  { watch_slug:"patek_nautilus", flair:"debate", title:"Nautilus 5711: ¿burbuja o precio real?", content:"El Nautilus se vende por 3-4x el precio de lista en el mercado secundario. ¿Es una burbuja o el precio refleja su valor real?" },
  { watch_slug:"ap_royal_oak", flair:"valoracion", title:"Royal Oak Jumbo 15202: el dress watch que lo cambió todo", content:"En 1972 Gérald Genta diseñó el Royal Oak en una noche. 50 años después sigue siendo el referente del luxury sport watch." },
  { watch_slug:"tudor_black_bay", flair:"debate", title:"Tudor Black Bay vs Rolex Submariner: ¿cuál elegirías?", content:"Mismo ADN, precio muy diferente. ¿Merece la pena el salto al Submariner?" },
  { watch_slug:"gs_snowflake", flair:"curiosidad", title:"Grand Seiko Snowflake: el reloj más infravalorado del mercado", content:"El SBGA211 tiene acabado imposible de replicar y movimiento Spring Drive único. ¿Por qué no tiene más fama?" },
  { watch_slug:"iwc_portugieser", flair:"valoracion", title:"Portugieser: el dress watch para los que no quieren dress watch", content:"Grande, legible, con reserva de marcha prominente. ¿Es eso su mayor virtud o su mayor defecto?" },
  { watch_slug:"breitling_navitimer", flair:"curiosidad", title:"Navitimer: ¿alguien usa realmente la regla de cálculo?", content:"La regla de cálculo del Navitimer fue diseñada para pilotos. En 2025, ¿hay alguien que la use realmente?" },
];

export const STATIC_NEWS = [
  { type:"curiosidad", content:"El primer reloj de pulsera fue creado por Patek Philippe en 1868 para la Condesa Koscowicz de Hungría. Hasta entonces, los relojes eran exclusivamente de bolsillo." },
  { type:"tecnico", content:"Un tourbillon es un mecanismo inventado por Breguet en 1801 para compensar los efectos de la gravedad. Hoy es símbolo de la más alta relojería." },
  { type:"noticia", content:"El mercado de relojes de lujo de segunda mano superó los 22.000 millones de dólares en 2023, con Chrono24 y WatchBox liderando el crecimiento." },
  { type:"curiosidad", content:"El Rolex Submariner fue el primer reloj certificado resistente al agua hasta 100m en 1953. James Bond lo llevó en 'Dr. No' en 1962." },
  { type:"tecnico", content:"Un movimiento automático se carga con el rotor, una masa excéntrica que gira con el movimiento de la muñeca." },
  { type:"noticia", content:"Rolex produce aproximadamente un millón de relojes al año, pero la demanda supera la oferta, especialmente en el Submariner y el Daytona." },
  { type:"curiosidad", content:"El Omega Speedmaster fue seleccionado por la NASA en 1965 tras pruebas extremas. Es el único reloj certificado para vuelos espaciales tripulados." },
  { type:"tecnico", content:"El zafiro sintético usado en cristales tiene dureza 9 en la escala de Mohs. Solo el diamante lo supera." },
  { type:"noticia", content:"Tudor ha ganado popularidad entre coleccionistas por ofrecer movimientos in-house de calidad comparable a Rolex a precios menores." },
  { type:"curiosidad", content:"El récord de subasta para un reloj lo tiene el Patek Philippe Grandmaster Chime Ref. 6300A: 31 millones de francos suizos en 2019." },
  { type:"tecnico", content:"La certificación COSC garantiza una precisión de -4/+6 segundos por día. Omega va más allá con METAS: ±0,5 segundos por día." },
  { type:"noticia", content:"Watches & Wonders Ginebra es hoy la principal feria de alta relojería, sustituyendo a Baselworld tras el éxodo de marcas en 2020." },
  { type:"curiosidad", content:"El acero Oystersteel de Rolex es de la familia 904L, excepcionalmente resistente a la corrosión." },
  { type:"tecnico", content:"El bisel giratorio unidireccional de los relojes de buceo garantiza que el buceador nunca sobreestime el tiempo de inmersión restante." },
  { type:"noticia", content:"La demanda de relojes vintage ha disparado precios: el Rolex Paul Newman Daytona pasó de unos pocos cientos en los 80 a superar el millón hoy." },
  { type:"curiosidad", content:"Breguet inventó el espiral con curva final elevada, mejorando enormemente la isocronia del movimiento." },
  { type:"tecnico", content:"Un GMT tiene una aguja adicional que da una vuelta cada 24h, permitiendo leer la hora local y la de otra zona horaria." },
  { type:"noticia", content:"A. Lange & Söhne fue nacionalizada en la RDA en 1948 y refundada en 1990. Sus relojes con acabado glashütte son codiciados mundialmente." },
  { type:"curiosidad", content:"El término 'Swiss Made' requiere que al menos el 60% del valor de producción y el movimiento sean suizos." },
  { type:"tecnico", content:"El choque más común en un reloj daña el pivote del áncora. Por eso los relojes de alta gama incorporan sistemas antichoque como el Incabloc." },
];

export function brandColor(slug) {
  const p = (slug||"").split("_")[0];
  return BRAND_COLORS[p] || "#1a1a1a";
}

export function brandFromSlug(slug) {
  const p = (slug||"").split("_")[0];
  return BRAND_NAMES[p] || p;
}

export function flairStyle(flair) {
  return FLAIRS.find(f=>f.id===flair) || FLAIRS[0];
}

export function getDailyNews() {
  const day = Math.floor(Date.now() / (1000*60*60*24));
  return ["curiosidad","noticia","tecnico"].map(type => {
    const filtered = STATIC_NEWS.filter(n=>n.type===type);
    return filtered[day % filtered.length];
  });
}

export function getCurrentWeeklyThread() {
  const week = Math.floor(Date.now() / (1000*60*60*24*7));
  return WEEKLY_THREADS[week % WEEKLY_THREADS.length];
}

export function getTodayAutoThread() {
  const day = Math.floor(Date.now() / (1000*60*60*24));
  return AUTO_FORUM_THREADS[day % AUTO_FORUM_THREADS.length];
}

export function timeAgo(ts) {
  const d = Date.now() - new Date(ts), m = Math.floor(d/60000);
  if(m<1) return "ahora";
  if(m<60) return `hace ${m}m`;
  const h = Math.floor(m/60);
  if(h<24) return `hace ${h}h`;
  return `hace ${Math.floor(h/24)}d`;
}

export const S = {
  app: { fontFamily:"'DM Sans',sans-serif", background:"#f8f7f4", minHeight:"100vh", color:"#1a1a1a", overflowX:"hidden" },
  nav: { background:"#1a2744", padding:"0 12px", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 12px rgba(0,0,0,0.15)" },
  main: { maxWidth:960, margin:"0 auto", padding:"16px 12px 28px", boxSizing:"border-box", width:"100%" },
  card: { background:"#fff", border:"1px solid #ece9e2", borderRadius:10, padding:20, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
  h1: { fontSize:22, fontWeight:700, marginBottom:4, fontFamily:"'DM Mono',monospace", letterSpacing:-0.5 },
  h2: { fontSize:16, fontWeight:700, marginBottom:16, fontFamily:"'DM Mono',monospace" },
  label: { fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#999", fontFamily:"'DM Mono',monospace", marginBottom:6, display:"block" },
  muted: { color:"#888", fontSize:13 },
  mono: { fontFamily:"'DM Mono',monospace" },
  input: { width:"100%", border:"1px solid #e0ddd6", borderRadius:8, padding:"10px 14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box", background:"#fff" },
  btn: (v="primary") => ({ padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:v==="outline"?"1px solid #ddd":"none", fontFamily:"'DM Sans',sans-serif", background:v==="primary"?"#1a2744":v==="gold"?"#b8963e":v==="outline"?"transparent":"#f0ede6", color:v==="primary"||v==="gold"?"#fff":"#1a1a1a" }),
  row: { display:"flex", alignItems:"center", gap:12 },
  col: { display:"flex", flexDirection:"column", gap:4 },
  error: { background:"#fff3f3", border:"1px solid #fcc", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#c00", marginBottom:16 },
  success: { background:"#f0f9f4", border:"1px solid #b3dfc4", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#2a7a4a", marginBottom:16 },
  navLink: (a) => ({ padding:"6px 14px", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:a?600:400, background:a?"rgba(255,255,255,0.15)":"transparent", color:a?"#fff":"rgba(255,255,255,0.7)", border:"none", fontFamily:"'DM Sans',sans-serif" }),
};

// ─── TRADUCCIONES ─────────────────────────────────────────────────────────────
export const T = {
  es: {
    feed:"Feed", explore:"Explorar", forums:"Foros", profile:"Mi Perfil",
    garage:"Garage", maintenance:"Mantenimiento", settings:"Ajustes",
    logout:"Salir", notifications:"Notificaciones",
    follow:"Seguir", following:"Siguiendo", followers:"seguidores",
    watches:"relojes", wishlist:"Wish List",
    addWatch:"+ Añadir reloj", addToGarage:"+ Añadir al Garage",
    addToWishlist:"+ Wish List", inGarage:"✓ En tu Garage",
    reviews:"Reseñas", writeReview:"✍️ Escribir reseña",
    workshopContact:"📅 Pedir cita", verified:"✓ Verificado",
    pending:"⏳ Pendiente de verificación",
    serviceHistory:"Historial de servicios", addService:"+ Registrar servicio",
    nextRevision:"Próxima revisión", lastService:"Último servicio",
    brands:"Marcas", specialties:"Especialidades", posts:"Publicaciones",
    noReviews:"Sin reseñas aún.", noPosts:"Sin publicaciones aún.",
    save:"Guardar cambios", saving:"Guardando…", saved:"✓ Guardado",
    cancel:"Cancelar", back:"← Volver",
    feedback:"💬 Feedback", sendFeedback:"Enviar feedback",
    feedbackPlaceholder:"Cuéntanos qué funciona, qué falla, o qué echarías de menos...",
    thanks:"¡Gracias por tu feedback!",
  },
  en: {
    feed:"Feed", explore:"Explore", forums:"Forums", profile:"My Profile",
    garage:"Garage", maintenance:"Maintenance", settings:"Settings",
    logout:"Sign out", notifications:"Notifications",
    follow:"Follow", following:"Following", followers:"followers",
    watches:"watches", wishlist:"Wish List",
    addWatch:"+ Add watch", addToGarage:"+ Add to Garage",
    addToWishlist:"+ Wish List", inGarage:"✓ In your Garage",
    reviews:"Reviews", writeReview:"✍️ Write a review",
    workshopContact:"📅 Book appointment", verified:"✓ Verified",
    pending:"⏳ Pending verification",
    serviceHistory:"Service history", addService:"+ Log service",
    nextRevision:"Next service", lastService:"Last service",
    brands:"Brands", specialties:"Specialties", posts:"Posts",
    noReviews:"No reviews yet.", noPosts:"No posts yet.",
    save:"Save changes", saving:"Saving…", saved:"✓ Saved",
    cancel:"Cancel", back:"← Back",
    feedback:"💬 Feedback", sendFeedback:"Send feedback",
    feedbackPlaceholder:"Tell us what works, what doesn't, or what you miss...",
    thanks:"Thanks for your feedback!",
  }
};

export function t(lang, key) { return T[lang]?.[key] || T.es[key] || key; }
