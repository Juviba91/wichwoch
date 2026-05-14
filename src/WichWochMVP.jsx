import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kmxpachollvsiytppvyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteHBhY2hvbGx2c2l5dHBwdnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTk0MTYsImV4cCI6MjA5NDIzNTQxNn0.w6tVaItGQi-tuWuoqRqcRl6Z7gIpBIFIcji6szRTXI4"
);

const S = {
  app: { fontFamily: "'DM Sans', sans-serif", background: "#fafaf8", minHeight: "100vh", color: "#1a1a1a" },
  nav: { background: "#fff", borderBottom: "1px solid #e8e8e8", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 100 },
  logo: { fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, letterSpacing: -0.5, color: "#1a1a1a", cursor: "pointer" },
  navLinks: { display: "flex", gap: 4 },
  navLink: (a) => ({ padding: "6px 12px", borderRadius: 4, fontSize: 13, cursor: "pointer", fontWeight: a ? 600 : 400, background: a ? "#1a1a1a" : "transparent", color: a ? "#fff" : "#666", border: "none", fontFamily: "'DM Sans', sans-serif" }),
  main: { maxWidth: 860, margin: "0 auto", padding: "28px 20px" },
  card: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6, padding: 20, marginBottom: 16 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'DM Mono', monospace", letterSpacing: -0.5 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 16, fontFamily: "'DM Mono', monospace" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#999", fontFamily: "'DM Mono', monospace", marginBottom: 6, display: "block" },
  muted: { color: "#888", fontSize: 13 },
  mono: { fontFamily: "'DM Mono', monospace" },
  input: { width: "100%", border: "1px solid #e8e8e8", borderRadius: 4, padding: "9px 12px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "#fff" },
  btn: (v = "primary") => ({ padding: "9px 18px", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer", border: v === "outline" ? "1px solid #ddd" : "none", fontFamily: "'DM Sans', sans-serif", background: v === "primary" ? "#1a1a1a" : v === "outline" ? "transparent" : "#f0f0f0", color: v === "primary" ? "#fff" : "#1a1a1a" }),
  row: { display: "flex", alignItems: "center", gap: 12 },
  col: { display: "flex", flexDirection: "column", gap: 4 },
  error: { background: "#fff3f3", border: "1px solid #fcc", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#c00", marginBottom: 16 },
  success: { background: "#f0f9f4", border: "1px solid #b3dfc4", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#2a7a4a", marginBottom: 16 },
};

function Badge({ text, bg = "#f0f0f0", color = "#1a1a1a" }) {
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", background: bg, color, borderRadius: 2, fontFamily: "'DM Mono', monospace", marginLeft: 6 }}>{text}</span>;
}

function Avatar({ name = "?", size = 36, color = "#1a1a1a" }) {
  const i = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{i}</div>;
}

function Spinner() {
  return <div style={{ textAlign: "center", padding: 40, color: "#888", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Cargando…</div>;
}

function timeAgo(ts) {
  const d = Date.now() - new Date(ts);
  const m = Math.floor(d / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", handle: "", account_type: "collector" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else {
        if (!form.handle.match(/^[a-z0-9_]{3,20}$/)) throw new Error("Handle: solo minúsculas, números y _ (3-20 caracteres)");
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { name: form.name, handle: form.handle, account_type: form.account_type } }
        });
        if (error) throw error;
        setSuccess("¡Cuenta creada! Revisa tu email para confirmar.");
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafaf8" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: 400, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>WICH WOCH</div>
          <div style={{ color: "#888", fontSize: 14 }}>La comunidad de relojes</div>
        </div>
        <div style={{ ...S.card, padding: 28 }}>
          <div style={{ display: "flex", marginBottom: 24, background: "#f5f5f3", borderRadius: 4, padding: 3, gap: 3 }}>
            {["login", "register"].map(m => (
              <button key={m} style={{ flex: 1, padding: "7px 0", borderRadius: 3, border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", background: mode === m ? "#fff" : "transparent", color: "#1a1a1a", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }} onClick={() => setMode(m)}>
                {m === "login" ? "Entrar" : "Registrarse"}
              </button>
            ))}
          </div>
          {error && <div style={S.error}>{error}</div>}
          {success && <div style={S.success}>{success}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (<>
              <div><span style={S.label}>Nombre</span><input style={S.input} placeholder="Juan García" value={form.name} onChange={e => set("name", e.target.value)} /></div>
              <div><span style={S.label}>Handle</span><input style={S.input} placeholder="juan_garcia" value={form.handle} onChange={e => set("handle", e.target.value.toLowerCase())} /></div>
              <div><span style={S.label}>Tipo de cuenta</span>
                <select style={S.input} value={form.account_type} onChange={e => set("account_type", e.target.value)}>
                  <option value="collector">Coleccionista / Aficionado</option>
                  <option value="repairer">Taller / Reparador</option>
                  <option value="brand">Marca oficial</option>
                </select>
              </div>
            </>)}
            <div><span style={S.label}>Email</span><input style={S.input} type="email" placeholder="tu@email.com" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><span style={S.label}>Contraseña</span><input style={S.input} type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} /></div>
            <button style={{ ...S.btn("primary"), width: "100%", marginTop: 4, padding: 12, fontSize: 14 }} onClick={handleSubmit} disabled={loading}>
              {loading ? "Cargando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POST CARD ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onNavigate }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || 0);
  const author = post.author;

  async function toggleLike() {
    if (liked) {
      await supabase.from("likes").delete().match({ user_id: currentUser.id, post_id: post.id });
      setLikes(l => l - 1);
    } else {
      await supabase.from("likes").insert({ user_id: currentUser.id, post_id: post.id });
      setLikes(l => l + 1);
    }
    setLiked(!liked);
  }

  return (
    <div style={S.card}>
      <div style={{ ...S.row, marginBottom: 12 }}>
        <div style={{ cursor: "pointer" }} onClick={() => onNavigate("profile", author?.id)}>
          <Avatar name={author?.name || "?"} size={38} color={author?.account_type === "repairer" ? "#4a7c59" : "#1a1a1a"} />
        </div>
        <div style={S.col}>
          <div style={{ fontWeight: 600, fontSize: 14, cursor: "pointer" }} onClick={() => onNavigate("profile", author?.id)}>
            {author?.name}
            {author?.account_type === "repairer" && <Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
            {author?.account_type === "brand" && <Badge text="Marca" bg="#f0f6ff" color="#2563eb" />}
          </div>
          <span style={S.muted}>@{author?.handle} · {timeAgo(post.created_at)}</span>
        </div>
      </div>
      {post.watch && (
        <div style={{ background: "#f8f8f6", borderRadius: 4, padding: "7px 12px", marginBottom: 10, fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>{post.watch.model}</span>
          <span style={{ color: "#888" }}> · Ref. {post.watch.reference}</span>
        </div>
      )}
      <p style={{ fontSize: 15, lineHeight: 1.6, margin: "0 0 14px" }}>{post.content}</p>
      <div style={S.row}>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: liked ? "#d44" : "#888", fontFamily: "'DM Sans', sans-serif", padding: 0 }} onClick={toggleLike}>
          {liked ? "♥" : "♡"} {likes}
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#888", fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
          💬 {post.comments_count || 0}
        </button>
      </div>
    </div>
  );
}

// ─── FEED ─────────────────────────────────────────────────────────────────────
function FeedPage({ user, onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState("all");

  useEffect(() => { loadPosts(); }, [tab]);

  async function loadPosts() {
    setLoading(true);
    if (tab === "following") {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (follows || []).map(f => f.following_id);
      if (ids.length === 0) { setPosts([]); setLoading(false); return; }
      const { data } = await supabase.from("posts")
        .select("*, author:profiles(id,name,handle,account_type), watch:watches(model,reference)")
        .in("author_id", ids).order("created_at", { ascending: false }).limit(30);
      setPosts(data || []);
    } else {
      const { data } = await supabase.from("posts")
        .select("*, author:profiles(id,name,handle,account_type), watch:watches(model,reference)")
        .order("created_at", { ascending: false }).limit(30);
      setPosts(data || []);
    }
    setLoading(false);
  }

  async function submitPost() {
    if (!content.trim()) return;
    setPosting(true);
    await supabase.from("posts").insert({ author_id: user.id, content: content.trim() });
    setContent(""); await loadPosts();
    setPosting(false);
  }

  return (
    <div>
      <div style={S.card}>
        <textarea placeholder="¿Qué hay en tu muñeca hoy?" value={content} onChange={e => setContent(e.target.value)}
          style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 15, fontFamily: "'DM Sans', sans-serif", background: "transparent", color: "#1a1a1a", boxSizing: "border-box" }} rows={3} />
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
          <button style={S.btn("primary")} onClick={submitPost} disabled={posting || !content.trim()}>
            {posting ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <button style={S.navLink(tab === "all")} onClick={() => setTab("all")}>Todo</button>
        <button style={S.navLink(tab === "following")} onClick={() => setTab("following")}>Siguiendo</button>
      </div>
      {loading ? <Spinner /> : posts.map(p => <PostCard key={p.id} post={p} currentUser={user} onNavigate={onNavigate} />)}
      {!loading && posts.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", color: "#888", padding: 40 }}>
          {tab === "following" ? "Sigue a alguien para ver sus posts aquí." : "Aún no hay publicaciones. ¡Sé el primero!"}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfilePage({ userId, currentUser, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [watches, setWatches] = useState([]);
  const [tab, setTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwn = userId === currentUser?.id;

  useEffect(() => { load(); }, [userId]);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: po }, { data: w }, { data: f }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("posts").select("*, author:profiles(id,name,handle,account_type), watch:watches(model,reference)").eq("author_id", userId).order("created_at", { ascending: false }),
      supabase.from("watch_registrations").select("*, watch:watches(model,reference)").eq("user_id", userId).eq("is_public", true),
      supabase.from("follows").select("id").eq("follower_id", currentUser.id).eq("following_id", userId).maybeSingle(),
    ]);
    setProfile(p); setPosts(po || []); setWatches(w || []); setFollowing(!!f);
    setLoading(false);
  }

  async function toggleFollow() {
    setFollowLoading(true);
    if (following) {
      await supabase.from("follows").delete().match({ follower_id: currentUser.id, following_id: userId });
      setFollowing(false);
      setProfile(p => ({ ...p, followers_count: Math.max(0, (p.followers_count || 1) - 1) }));
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: userId });
      setFollowing(true);
      setProfile(p => ({ ...p, followers_count: (p.followers_count || 0) + 1 }));
    }
    setFollowLoading(false);
  }

  if (loading) return <Spinner />;
  if (!profile) return <div style={S.muted}>Perfil no encontrado.</div>;

  return (
    <div>
      <div style={S.card}>
        <div style={{ ...S.row, marginBottom: 16 }}>
          <Avatar name={profile.name} size={60} color={profile.account_type === "repairer" ? "#4a7c59" : "#1a1a1a"} />
          <div>
            <div style={{ ...S.row, gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.name}</span>
              {profile.verified && <Badge text="Verificado" bg="#f0f6ff" color="#2563eb" />}
              {profile.account_type === "repairer" && <Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
              {profile.account_type === "brand" && <Badge text="Marca" bg="#f0f6ff" color="#2563eb" />}
            </div>
            <span style={{ ...S.mono, fontSize: 13, color: "#888" }}>@{profile.handle}</span>
          </div>
        </div>
        {profile.bio && <p style={{ fontSize: 14, color: "#444", lineHeight: 1.6, marginBottom: 16 }}>{profile.bio}</p>}
        <div style={{ display: "flex", gap: 28, marginBottom: 16 }}>
          <div><div style={{ fontWeight: 700, fontSize: 18 }}>{profile.followers_count || 0}</div><div style={S.muted}>seguidores</div></div>
          <div><div style={{ fontWeight: 700, fontSize: 18 }}>{profile.following_count || 0}</div><div style={S.muted}>siguiendo</div></div>
        </div>
        {!isOwn && (
          <button style={S.btn(following ? "outline" : "primary")} onClick={toggleFollow} disabled={followLoading}>
            {followLoading ? "…" : following ? "✓ Siguiendo" : "Seguir"}
          </button>
        )}
        {isOwn && <button style={S.btn("outline")} onClick={() => onNavigate("edit-profile")}>Editar perfil</button>}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <button style={S.navLink(tab === "posts")} onClick={() => setTab("posts")}>Posts ({posts.length})</button>
        {profile.account_type === "collector" && <button style={S.navLink(tab === "coleccion")} onClick={() => setTab("coleccion")}>Colección ({watches.length})</button>}
      </div>

      {tab === "posts" && (
        <div>
          {posts.length === 0 && <p style={S.muted}>Sin publicaciones aún.</p>}
          {posts.map(p => <PostCard key={p.id} post={p} currentUser={currentUser} onNavigate={onNavigate} />)}
        </div>
      )}
      {tab === "coleccion" && (
        <div>
          {watches.length === 0 && <p style={S.muted}>Colección privada o sin relojes registrados.</p>}
          {watches.map(w => (
            <div key={w.id} style={S.card}>
              <div style={{ fontWeight: 700 }}>{w.watch?.model}</div>
              <div style={{ ...S.mono, fontSize: 13, color: "#888" }}>Ref. {w.watch?.reference}</div>
              {w.notes && <p style={{ fontSize: 13, color: "#555", marginTop: 8 }}>{w.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MY COLLECTION ────────────────────────────────────────────────────────────
function MyCollectionPage({ user }) {
  const [watches, setWatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ model: "", reference: "", brand: "", year: "", serial_number: "", purchased_from: "", notes: "", is_public: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { load(); }, [user]);

  async function load() {
    setLoading(true);
    const [{ data: w }, { data: n }] = await Promise.all([
      supabase.from("watch_registrations").select("*, watch:watches(model,reference)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*, sender:profiles(name)").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setWatches(w || []); setNotifications(n || []);
    setLoading(false);
  }

  async function registerWatch() {
    setSaving(true); setMsg(null);
    try {
      let watchId;
      const { data: existing } = await supabase.from("watches").select("id").eq("reference", form.reference).maybeSingle();
      if (existing) { watchId = existing.id; }
      else {
        const { data: nw, error } = await supabase.from("watches").insert({ model: form.model, reference: form.reference, year: parseInt(form.year) || null, brand_id: null }).select().single();
        if (error) throw error;
        watchId = nw.id;
      }
      const { error } = await supabase.from("watch_registrations").insert({ user_id: user.id, watch_id: watchId, serial_number: form.serial_number, purchased_from: form.purchased_from, notes: form.notes, is_public: form.is_public });
      if (error) throw error;
      setMsg({ type: "success", text: "Reloj registrado correctamente." });
      setForm({ model: "", reference: "", brand: "", year: "", serial_number: "", purchased_from: "", notes: "", is_public: true });
      setShowForm(false); await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    setSaving(false);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ ...S.h1, marginBottom: 4 }}>Mi Colección</h2>
          <p style={S.muted}>{watches.length} {watches.length === 1 ? "reloj registrado" : "relojes registrados"}</p>
        </div>
        <button style={S.btn("primary")} onClick={() => setShowForm(!showForm)}>+ Registrar reloj</button>
      </div>

      {msg && <div style={msg.type === "success" ? S.success : S.error}>{msg.text}</div>}

      {showForm && (
        <div style={{ ...S.card, border: "1px solid #1a1a1a", marginBottom: 24 }}>
          <h3 style={{ ...S.h2, marginBottom: 20 }}>Registrar reloj</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {[["model","Modelo","ej. Submariner"],["reference","Referencia","ej. 126610LN"],["brand","Marca","ej. Rolex"],["year","Año","ej. 2021"],["serial_number","Nº de serie","opcional"],["purchased_from","Lugar de compra","opcional"]].map(([k,label,ph]) => (
              <div key={k}><span style={S.label}>{label}</span><input style={S.input} placeholder={ph} value={form[k]} onChange={e => setF(k, e.target.value)} /></div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}><span style={S.label}>Notas</span><textarea rows={2} style={{ ...S.input, resize: "none" }} value={form.notes} onChange={e => setF("notes", e.target.value)} /></div>
          <div style={{ ...S.row, justifyContent: "space-between" }}>
            <label style={{ ...S.row, gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_public} onChange={e => setF("is_public", e.target.checked)} /> Perfil público
            </label>
            <div style={S.row}>
              <button style={S.btn("outline")} onClick={() => setShowForm(false)}>Cancelar</button>
              <button style={S.btn("primary")} onClick={registerWatch} disabled={saving || !form.model || !form.reference}>{saving ? "Guardando…" : "Registrar"}</button>
            </div>
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ ...S.h2, marginBottom: 12 }}>Notificaciones de tus marcas</h3>
          {notifications.map(n => (
            <div key={n.id} style={{ ...S.card, borderLeft: "3px solid #1a1a1a", paddingLeft: 16 }}>
              <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{n.sender?.name || "Sistema"}</span>
                <span style={S.muted}>{new Date(n.created_at).toLocaleDateString("es-ES")}</span>
              </div>
              {n.title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.title}</div>}
              <p style={{ fontSize: 14, margin: 0, color: "#333" }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}

      {watches.length === 0 && !showForm && (
        <div style={{ ...S.card, textAlign: "center", padding: 40, color: "#888" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🕰️</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Sin relojes registrados</div>
          <div style={{ fontSize: 13 }}>Registra tu primer reloj para recibir info de la marca.</div>
        </div>
      )}

      {watches.map(w => (
        <div key={w.id} style={S.card}>
          <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{w.watch?.model || "Reloj"}</div>
              <div style={{ ...S.mono, fontSize: 13, color: "#888" }}>Ref. {w.watch?.reference}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "2px 8px", background: w.is_public ? "#f0f6ff" : "#fff3f3", color: w.is_public ? "#2563eb" : "#d44", borderRadius: 2, fontFamily: "'DM Mono', monospace" }}>
              {w.is_public ? "Público" : "Privado"}
            </span>
          </div>
          {w.serial_number && <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Serie: <span style={S.mono}>{w.serial_number}</span></div>}
          {w.purchased_from && <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Comprado en: {w.purchased_from}</div>}
          {w.notes && <p style={{ fontSize: 13, color: "#555", margin: "8px 0 0" }}>{w.notes}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── EDIT PROFILE ─────────────────────────────────────────────────────────────
function EditProfilePage({ user, onSaved }) {
  const [form, setForm] = useState({ name: "", bio: "", location: "", website: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) setForm({ name: data.name || "", bio: data.bio || "", location: data.location || "", website: data.website || "" });
      setLoading(false);
    });
  }, [user]);

  async function save() {
    setSaving(true); setMsg(null);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    if (error) setMsg({ type: "error", text: error.message });
    else { setMsg({ type: "success", text: "Perfil actualizado." }); setTimeout(onSaved, 1200); }
    setSaving(false);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom: 24 }}>Editar perfil</h2>
      {msg && <div style={msg.type === "success" ? S.success : S.error}>{msg.text}</div>}
      <div style={S.card}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["name","Nombre","Tu nombre"],["bio","Bio","Cuéntanos sobre ti"],["location","Ubicación","Ciudad, País"],["website","Web","https://"]].map(([k,label,ph]) => (
            <div key={k}>
              <span style={S.label}>{label}</span>
              {k === "bio" ? <textarea rows={3} style={{ ...S.input, resize: "none" }} placeholder={ph} value={form[k]} onChange={e => setF(k, e.target.value)} />
                : <input style={S.input} placeholder={ph} value={form[k]} onChange={e => setF(k, e.target.value)} />}
            </div>
          ))}
          <button style={{ ...S.btn("primary"), marginTop: 4 }} onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── EXPLORE ──────────────────────────────────────────────────────────────────
function ExplorePage({ onNavigate }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    let q = supabase.from("profiles").select("*").order("followers_count", { ascending: false }).limit(20);
    if (tab !== "all") q = q.eq("account_type", tab);
    const { data } = await q;
    setProfiles(data || []);
    setLoading(false);
  }

  return (
    <div>
      <h2 style={{ ...S.h1, marginBottom: 6 }}>Explorar</h2>
      <p style={{ ...S.muted, marginBottom: 20 }}>Descubre marcas, talleres y coleccionistas</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[["all","Todos"],["collector","Coleccionistas"],["brand","Marcas"],["repairer","Talleres"]].map(([v,label]) => (
          <button key={v} style={S.navLink(tab === v)} onClick={() => setTab(v)}>{label}</button>
        ))}
      </div>
      {loading ? <Spinner /> : profiles.map(p => (
        <div key={p.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => onNavigate("profile", p.id)}>
          <div style={S.row}>
            <Avatar name={p.name} size={44} color={p.account_type === "repairer" ? "#4a7c59" : p.account_type === "brand" ? "#7c3aed" : "#1a1a1a"} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {p.name}
                {p.verified && <Badge text="Verificado" bg="#f0f6ff" color="#2563eb" />}
                {p.account_type === "repairer" && <Badge text="Taller" bg="#e8f4ec" color="#4a7c59" />}
                {p.account_type === "brand" && <Badge text="Marca" bg="#f5f0ff" color="#7c3aed" />}
              </div>
              <div style={S.muted}>@{p.handle} · {p.location || "Sin ubicación"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>{p.followers_count || 0}</div>
              <div style={S.muted}>seguidores</div>
            </div>
          </div>
          {p.bio && <p style={{ fontSize: 13, color: "#555", margin: "10px 0 0", lineHeight: 1.5 }}>{p.bio}</p>}
        </div>
      ))}
      {!loading && profiles.length === 0 && <p style={S.muted}>Aún no hay usuarios en esta categoría.</p>}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function WichWoch() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState({ name: "feed" });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
  }

  const navigate = (name, id = null) => setPage({ name, id });

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setPage({ name: "feed" });
  }

  if (!authChecked) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ fontFamily: "'DM Mono', monospace", color: "#888" }}>Cargando…</div>
    </div>
  );

  if (!session) return <AuthPage />;

  const NAV = [{ id: "feed", label: "Feed" }, { id: "explore", label: "Explorar" }, { id: "collection", label: "Mi Colección" }];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <nav style={S.nav}>
        <span style={S.logo} onClick={() => navigate("feed")}>WICH WOCH</span>
        <div style={S.navLinks}>
          {NAV.map(n => <button key={n.id} style={S.navLink(page.name === n.id)} onClick={() => navigate(n.id)}>{n.label}</button>)}
        </div>
        <div style={S.row}>
          <div style={{ cursor: "pointer" }} onClick={() => navigate("profile", session.user.id)}>
            <Avatar name={profile?.name || session.user.email} size={32} />
          </div>
          <button style={{ ...S.btn("outline"), padding: "5px 12px", fontSize: 12 }} onClick={signOut}>Salir</button>
        </div>
      </nav>
      <main style={S.main}>
        {page.name === "feed" && <FeedPage user={session.user} onNavigate={navigate} />}
        {page.name === "explore" && <ExplorePage onNavigate={navigate} />}
        {page.name === "collection" && <MyCollectionPage user={session.user} />}
        {page.name === "profile" && <ProfilePage userId={page.id} currentUser={session.user} onNavigate={navigate} />}
        {page.name === "edit-profile" && <EditProfilePage user={session.user} onSaved={() => { loadProfile(session.user.id); navigate("profile", session.user.id); }} />}
      </main>
    </div>
  );
}
