/* Hi-Fi Afterglow: editorial vinyl catalog, warm paper surfaces, oxide-red signal color, asymmetric rail + inventory rows. */
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query as firestoreQuery, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { Search, SlidersHorizontal, Disc3, ArrowUpRight, X, ChevronDown, Library, ScanSearch, Plus, Download, Pencil, Trash2 } from "lucide-react";
import { catalog, type VinylRecord } from "@/data/catalog";

const heroImage = "/manus-storage/vinyl-hero_3aab6521.jpg";
const markImage = "/manus-storage/vinyl-mark_2bf6004b.png";
const categoryImages: Record<string, string> = {
  "01 — Chanson & voce franceză": "/manus-storage/vinyl-chanson_dcebd37f.jpg",
  "02 — România": "/manus-storage/vinyl-romania_9ef6ee69.jpg",
  "03 — Rock": "/manus-storage/vinyl-rock_62b5136e.jpg",
};

const categories = Array.from(new Set(catalog.map((item) => item.category)));
const categoryShort = (category: string) => category.replace(/^\d+ — /, "");
const artistSuggestions = Array.from(new Set(catalog.map((item) => item.artist).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ro"));
const formatSuggestions = Array.from(new Set(catalog.map((item) => item.format).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ro"));
const labelSuggestions = Array.from(new Set(catalog.map((item) => item.label).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ro"));

function SuggestField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder?: string }) {
  const [manual, setManual] = useState(Boolean(value) && !options.includes(value));
  const selectedValue = manual ? "__manual__" : value;
  return <div className="select-or-manual"><label>{label}<select value={selectedValue} onChange={(event) => { const next = event.target.value; if (next === "__manual__") { setManual(true); onChange(""); } else { setManual(false); onChange(next); } }}><option value="">{placeholder || "Selectează o valoare"}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}<option value="__manual__">Introdu manual…</option></select></label>{manual && <label className="manual-inline">Valoare nouă<input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Scrie valoarea nouă" /></label>}</div>;
}

function RecordRow({ record, onOpen }: { record: VinylRecord; onOpen: (record: VinylRecord) => void }) {
  return (
    <button className="record-row" onClick={() => onOpen(record)} aria-label={`Vezi detalii pentru ${record.artist} — ${record.title}`}>
      <span className="record-index">{String(record.position).padStart(3, "0")}</span>
      <span className="record-main"><strong>{record.artist}</strong><span>{record.title}</span></span>
      <span className="record-year">{record.year}</span>
      <span className="record-format">{record.format.split(",")[0]}</span>
      <ArrowUpRight size={16} strokeWidth={1.5} className="row-arrow" />
    </button>
  );
}

function AddVinylSheet({ onClose, onAdded, nextPosition }: { onClose: () => void; onAdded: (record: VinylRecord) => void; nextPosition: number }) {
  const [form, setForm] = useState({ artist: "", title: "", year: "", category: categories[0], format: "LP, Album", label: "", catalog: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.artist.trim() || !form.title.trim()) return;
    onAdded({ position: nextPosition, artist: form.artist.trim(), title: form.title.trim(), year: form.year.trim() || "—", format: form.format.trim() || "LP, Album", label: form.label.trim(), category: form.category, group: form.artist.trim(), catalog: form.catalog.trim() || `LOCAL-${nextPosition}` });
    onClose();
  };
  return <div className="sheet-backdrop" onClick={onClose}><aside className="detail-sheet add-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Adaugă vinil">
    <button className="icon-button close-button" onClick={onClose} aria-label="Închide formularul"><X size={20} /></button>
    <p className="eyebrow">KALLAX / NEW ENTRY</p><h2>Adaugă un<br /><i>vinil nou.</i></h2><p className="form-intro">Înregistrarea se salvează în acest browser și rămâne disponibilă pe dispozitivul curent.</p>
    <form className="add-form" onSubmit={submit}>
      <SuggestField label="Artist *" value={form.artist} onChange={(value) => update("artist", value)} options={artistSuggestions} placeholder="Selectează sau scrie un artist" />
      <label>Titlu *<input required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="ex. Aurelian Andreescu" /></label>
      <div className="form-two"><label>An<input value={form.year} onChange={(e) => update("year", e.target.value)} placeholder="1987" /></label><SuggestField label="Format" value={form.format} onChange={(value) => update("format", value)} options={formatSuggestions} placeholder="Selectează sau scrie formatul" /></div>
      <label>Categorie<select value={form.category} onChange={(e) => update("category", e.target.value)}>{categories.map((category) => <option key={category} value={category}>{category.replace(/^\d+ — /, "")}</option>)}</select></label>
      <div className="form-two"><SuggestField label="Label" value={form.label} onChange={(value) => update("label", value)} options={labelSuggestions} placeholder="Selectează sau scrie label-ul" /><label>Catalog #<input value={form.catalog} onChange={(e) => update("catalog", e.target.value)} placeholder="opțional" /></label></div>
      <button className="submit-button" type="submit"><Plus size={17} /> Salvează în catalog</button>
    </form>
  </aside></div>;
}

function EditVinylSheet({ record, onClose, onUpdated }: { record: VinylRecord; onClose: () => void; onUpdated: (record: VinylRecord) => void }) {
  const [form, setForm] = useState({ artist: record.artist, title: record.title, year: String(record.year), category: record.category, format: record.format, label: record.label, catalog: record.catalog });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!form.artist.trim() || !form.title.trim()) return; onUpdated({ ...record, artist: form.artist.trim(), title: form.title.trim(), year: form.year.trim() || "—", format: form.format.trim() || "LP, Album", label: form.label.trim(), category: form.category, group: form.artist.trim(), catalog: form.catalog.trim() }); onClose(); };
  return <div className="sheet-backdrop" onClick={onClose}><aside className="detail-sheet add-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editează vinil"><button className="icon-button close-button" onClick={onClose} aria-label="Închide"><X size={20} /></button><p className="eyebrow">KALLAX / EDIT ENTRY</p><h2>Editează<br /><i>vinilul.</i></h2><form className="add-form" onSubmit={submit}><SuggestField label="Artist *" value={form.artist} onChange={(value) => update("artist", value)} options={artistSuggestions} placeholder="Selectează sau scrie un artist" /><label>Titlu *<input required value={form.title} onChange={(e) => update("title", e.target.value)} /></label><div className="form-two"><label>An<input value={form.year} onChange={(e) => update("year", e.target.value)} /></label><SuggestField label="Format" value={form.format} onChange={(value) => update("format", value)} options={formatSuggestions} placeholder="Selectează sau scrie formatul" /></div><label>Categorie<select value={form.category} onChange={(e) => update("category", e.target.value)}>{categories.map((category) => <option key={category} value={category}>{categoryShort(category)}</option>)}</select></label><div className="form-two"><SuggestField label="Label" value={form.label} onChange={(value) => update("label", value)} options={labelSuggestions} placeholder="Selectează sau scrie label-ul" /><label>Catalog #<input value={form.catalog} onChange={(e) => update("catalog", e.target.value)} /></label></div><button className="submit-button" type="submit"><Pencil size={17} /> Salvează modificările</button></form></aside></div>;
}

function DetailSheet({ record, onClose, onEdit, onDelete }: { record: VinylRecord | null; onClose: () => void; onEdit: (record: VinylRecord) => void; onDelete: (record: VinylRecord) => void }) {
  if (!record) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <aside className="detail-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Detalii disc">
        <button className="icon-button close-button" onClick={onClose} aria-label="Închide detaliile"><X size={20} /></button>
        <div className="detail-art"><img src={categoryImages[record.category] || heroImage} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div className="detail-disc"><Disc3 size={70} strokeWidth={1} /></div></div>
        <p className="eyebrow">KALLAX / {String(record.position).padStart(3, "0")}</p>
        <h2>{record.title}</h2>
        <p className="detail-artist">{record.artist}</p>
        <div className="detail-grid">
          <div><span>Categoria</span><strong>{categoryShort(record.category)}</strong></div>
          <div><span>An</span><strong>{record.year}</strong></div>
          <div><span>Format</span><strong>{record.format}</strong></div>
          <div><span>Label</span><strong>{record.label || "—"}</strong></div>
        </div>
        <div className="detail-note"><span>Artist group</span><p>{record.group}</p></div>
        <div className="detail-actions"><button className="edit-record-button" onClick={() => onEdit(record)}><Pencil size={15} /> Editează</button><button className="delete-record-button" onClick={() => onDelete(record)}><Trash2 size={15} /> Șterge</button></div>
      </aside>
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Toată colecția");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VinylRecord | null>(null);
  const [editing, setEditing] = useState<VinylRecord | null>(null);
  const [sortBy, setSortBy] = useState<"position" | "artist" | "year">("position");
  const ownerEmail = "mihai.alex480@gmail.com";
  const [sharedRecords, setSharedRecords] = useState<VinylRecord[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("adriwinx1313@gmail.com");
  const [authError, setAuthError] = useState("");
  useEffect(() => onAuthStateChanged(auth, async (user) => { setAuthUser(user); setAuthLoading(false); setSharedRecords([]); setIsMember(false); if (!user) return; try { const owner = user.email?.toLowerCase() === ownerEmail; const metaRef = doc(db, "collections", "main"); const metaSnapshot = await getDoc(metaRef); if (!metaSnapshot.exists() && owner) { await setDoc(metaRef, { ownerEmail, memberEmails: [ownerEmail], updatedAt: new Date().toISOString() }); const batch = writeBatch(db); catalog.forEach((record) => batch.set(doc(db, "vinylRecords", String(record.position)), { ...record, ownerEmail })); await batch.commit(); setSharedRecords(catalog); setIsMember(true); } else if (metaSnapshot.exists()) { const members = (metaSnapshot.data().memberEmails || []) as string[]; const member = user.email ? members.includes(user.email.toLowerCase()) : false; setIsMember(member); if (!member) { setAuthError("Acest cont nu are acces la colecția privată."); return; } const snapshot = await getDocs(firestoreQuery(collection(db, "vinylRecords"), orderBy("position", "asc"))); setSharedRecords(snapshot.docs.map((item) => item.data() as VinylRecord)); } else { setAuthError("Colecția nu este încă inițializată de contul proprietar."); } } catch (error) { console.error(error); setAuthError("Nu am putut încărca colecția privată din Firebase."); } }), []);
  const allRecords = sharedRecords;
  const addRecord = async (record: VinylRecord) => { if (!authUser || !isMember) { setAuthError("Ai nevoie de acces la colecție înainte să adaugi un vinil."); return; } try { const stored = { ...record, ownerEmail }; await setDoc(doc(db, "vinylRecords", String(record.position)), stored); setSharedRecords((current) => [...current, record].sort((a, b) => a.position - b.position)); } catch (error) { console.error(error); setAuthError("Vinilul nu a putut fi salvat în Firebase."); } };
  const updateRecord = async (record: VinylRecord) => { try { await updateDoc(doc(db, "vinylRecords", String(record.position)), { ...record, ownerEmail }); setSharedRecords((current) => current.map((item) => item.position === record.position ? record : item)); setSelected(record); } catch (error) { console.error(error); setAuthError("Modificările nu au putut fi salvate."); } };
  const deleteRecord = async (record: VinylRecord) => { if (!window.confirm(`Ștergi definitiv „${record.title}” de ${record.artist}?`)) return; try { await deleteDoc(doc(db, "vinylRecords", String(record.position))); setSharedRecords((current) => current.filter((item) => item.position !== record.position)); setSelected(null); } catch (error) { console.error(error); setAuthError("Vinilul nu a putut fi șters."); } };
  const inviteCollaborator = async () => { if (!authUser || authUser.email?.toLowerCase() !== ownerEmail) { setAuthError("Doar proprietarul colecției poate invita colaboratori."); return; } const email = inviteEmail.trim().toLowerCase(); if (!email) return; try { await updateDoc(doc(db, "collections", "main"), { memberEmails: arrayUnion(email), updatedAt: new Date().toISOString() }); setShowInvite(false); setAuthError(`Invitația pentru ${email} a fost adăugată. Persoana se poate autentifica acum cu Google.`); } catch (error) { console.error(error); setAuthError("Invitația nu a putut fi salvată."); } };
  const exportLocalRecords = () => { const blob = new Blob([JSON.stringify(allRecords, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "vinyl-kallax-collection.json"; link.click(); URL.revokeObjectURL(url); };
  const signIn = async () => { try { setAuthError(""); await signInWithPopup(auth, googleProvider); } catch (error) { console.error(error); const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "unknown"; setAuthError(`Autentificarea Google nu a reușit (${code}). Verifică setările Firebase.`); } };
  const signOutUser = () => signOut(auth);

  const visibleRecords = useMemo(() => {
    const needle = query.toLocaleLowerCase("ro").trim();
    const filtered = allRecords.filter((record) => {
      const inCategory = activeCategory === "Toată colecția" || record.category === activeCategory;
      const haystack = `${record.artist} ${record.title} ${record.label} ${record.year}`.toLocaleLowerCase("ro");
      return inCategory && (!needle || haystack.includes(needle));
    });
    return [...filtered].sort((a, b) => sortBy === "artist" ? a.artist.localeCompare(b.artist, "ro") : sortBy === "year" ? String(a.year).localeCompare(String(b.year)) : a.position - b.position);
  }, [activeCategory, query, sortBy, allRecords]);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Vinyl KALLAX Catalog home"><span className="brand-mark"><img src={markImage} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /></span><span>VINYL<br /><em>KALLAX</em></span></a>
        <div className="topbar-meta"><span className="status-dot" /> catalog live <span className="meta-divider" /> {allRecords.length} records</div>
        <div className="topbar-actions">{authUser ? <button className="account-button" onClick={signOutUser} title="Ieșire din cont"><span className="avatar-dot">{(authUser.displayName || authUser.email || "G")[0].toUpperCase()}</span>{authUser.displayName?.split(" ")[0] || "Cont"}</button> : <button className="login-button" onClick={signIn}>{authLoading ? "..." : "Intră cu Google"}</button>}{authUser && isMember && authUser.email?.toLowerCase() === ownerEmail && <button className="invite-button" onClick={() => setShowInvite(true)}>Invită</button>}<button className="add-top-button" onClick={() => authUser ? (isMember ? setShowAdd(true) : setAuthError("Acest cont nu are acces la colecție.")) : signIn()}><Plus size={15} /> Adaugă vinil</button><a className="topbar-link" href="#catalog">Explore collection <ArrowUpRight size={15} /></a></div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy"><p className="eyebrow">PRIVATE LISTENING ROOM / 2026</p><h1>Raftul tău,<br /><i>pus în ordine.</i></h1><p className="hero-intro">Un catalog interactiv pentru colecția de viniluri, aranjată pe rafturi KALLAX și gata de explorat.</p><div className="hero-links"><a href="#catalog" className="hero-cta">Intră în catalog <ArrowUpRight size={17} /></a><a href={`${import.meta.env.BASE_URL}kallax`} className="hero-cta secondary-cta">Vezi KALLAX în 3D <ArrowUpRight size={17} /></a></div></div>
          <div className="hero-visual"><img src={heroImage} alt="Vinyl records arranged on a warm listening room table" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div className="hero-stamp">NO.<br />{isMember ? <><b>{allRecords.length}</b><br />PRESSINGS</> : <><b>—</b><br />PRIVATE</>}</div><div className="hero-caption">ANALOG ARCHIVE<br /><span>Organized with intent</span></div></div>
        </section>

        <section className="stats-strip" aria-label="Statistici colecție"><div><span>01</span><strong>{allRecords.length}</strong><small>discuri în colecție</small></div><div><span>02</span><strong>{categories.length}</strong><small>zone de raft</small></div><div><span>03</span><strong>∞</strong><small>ore de ascultare</small></div><p>„Caută după artist,<br />titlu sau atmosferă.”</p></section>

        <section className="catalog-layout" id="catalog">
          <aside className="category-rail"><div className="rail-heading"><span>Index</span><span>01—07</span></div><button className={`category-link ${activeCategory === "Toată colecția" ? "active" : ""}`} onClick={() => setActiveCategory("Toată colecția")}><span>00</span><strong>Toată colecția</strong><em>{allRecords.length}</em></button>{categories.map((category, index) => <button key={category} className={`category-link ${activeCategory === category ? "active" : ""}`} onClick={() => setActiveCategory(category)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{categoryShort(category)}</strong><em>{allRecords.filter((item) => item.category === category).length}</em></button>)}<div className="rail-footer"><Library size={17} /><span>Ordine KALLAX<br /><b>stânga → dreapta</b></span></div></aside>

          <div className="catalog-content">{!authUser ? <div className="private-gate"><p className="eyebrow">PRIVATE LISTENING ROOM</p><h2>Autentifică-te pentru<br /><i>a vedea colecția.</i></h2><p>Colecția este privată și aparține contului Mihai. Doar proprietarul și colaboratorii invitați pot vedea sau adăuga discuri.</p><button className="login-button" onClick={signIn}>Intră cu Google</button></div> : !isMember ? <div className="private-gate"><p className="eyebrow">ACCESS REQUIRED</p><h2>Acest cont nu are<br /><i>acces încă.</i></h2><p>Roagă proprietarul colecției să te invite cu adresa ta Google.</p></div> : <><div className="catalog-heading"><div><p className="eyebrow">THE COLLECTION / {activeCategory === "Toată colecția" ? "ALL SHELVES" : activeCategory.split(" — ")[0]}</p><h2>{activeCategory === "Toată colecția" ? "Toată colecția" : categoryShort(activeCategory)}</h2></div><span className="result-count">{visibleRecords.length} rezultate</span><div className="catalog-actions"><button className="export-button" onClick={exportLocalRecords}><Download size={14} /> Exportă</button><button className="add-inline-button" onClick={() => authUser ? setShowAdd(true) : signIn()}><Plus size={14} /> Adaugă vinil</button></div></div>
            <div className="tool-row"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută artist, titlu, label..." aria-label="Caută în colecție" />{query && <button onClick={() => setQuery("")} aria-label="Șterge căutarea"><X size={16} /></button>}</label><div className="sort-control"><SlidersHorizontal size={16} /><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sortează colecția"><option value="position">Ordine KALLAX</option><option value="artist">Artist A—Z</option><option value="year">An</option></select><ChevronDown size={15} /></div></div>
            {activeCategory !== "Toată colecția" && categoryImages[activeCategory] && <div className="category-banner"><img src={categoryImages[activeCategory]} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div><span>Zone note</span><strong>{categoryShort(activeCategory)}</strong></div><span className="banner-count">{visibleRecords.length} / {allRecords.filter((item) => item.category === activeCategory).length}</span></div>}
            <div className="records-list">{visibleRecords.map((record) => <RecordRow key={`${record.position}-${record.catalog}`} record={record} onOpen={setSelected} />)}{visibleRecords.length === 0 && <div className="empty-state"><ScanSearch size={30} /><h3>Nimic găsit</h3><p>Încearcă un alt artist, titlu sau schimbă categoria.</p></div>}</div></>}
          </div>
        </section>
      </main>
      {authError && <div className="auth-toast" role="status">{authError}<button onClick={() => setAuthError("")} aria-label="Închide mesajul"><X size={15} /></button></div>}
      <footer className="site-footer"><span>VINYL KALLAX CATALOG</span><span>{authUser ? `Shared cloud archive / ${authUser.email}` : "Shared archive / sign in to sync"}</span><span>01—{String(allRecords.length).padStart(3, "0")}</span></footer>
      <DetailSheet record={selected} onClose={() => setSelected(null)} onEdit={(record) => { setEditing(record); setSelected(null); }} onDelete={deleteRecord} />{editing && <EditVinylSheet record={editing} onClose={() => setEditing(null)} onUpdated={updateRecord} />}{showAdd && <AddVinylSheet nextPosition={Math.max(...allRecords.map((item) => item.position), 0) + 1} onAdded={addRecord} onClose={() => setShowAdd(false)} />}{showInvite && <div className="sheet-backdrop" onClick={() => setShowInvite(false)}><aside className="detail-sheet add-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Invită colaborator"><button className="icon-button close-button" onClick={() => setShowInvite(false)} aria-label="Închide"><X size={20} /></button><p className="eyebrow">COLLECTION / ACCESS</p><h2>Invită un<br /><i>colaborator.</i></h2><p className="form-intro">Colaboratorul va putea vedea colecția și adăuga viniluri după autentificarea cu adresa Google invitată.</p><form className="add-form" onSubmit={(event) => { event.preventDefault(); inviteCollaborator(); }}><label>Adresă Google<input type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} /></label><button className="submit-button" type="submit">Trimite invitația</button></form></aside></div>}
    </div>
  );
}
