/* Hi-Fi Afterglow: editorial vinyl catalog, warm paper surfaces, oxide-red signal color, asymmetric rail + inventory rows. */
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Disc3, ArrowUpRight, X, ChevronDown, Library, ScanSearch, Plus, Download } from "lucide-react";
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
      <label>Artist *<input required value={form.artist} onChange={(e) => update("artist", e.target.value)} placeholder="ex. Aurelian Andreescu" /></label>
      <label>Titlu *<input required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="ex. Aurelian Andreescu" /></label>
      <div className="form-two"><label>An<input value={form.year} onChange={(e) => update("year", e.target.value)} placeholder="1987" /></label><label>Format<input value={form.format} onChange={(e) => update("format", e.target.value)} /></label></div>
      <label>Categorie<select value={form.category} onChange={(e) => update("category", e.target.value)}>{categories.map((category) => <option key={category} value={category}>{category.replace(/^\d+ — /, "")}</option>)}</select></label>
      <div className="form-two"><label>Label<input value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="Casa de discuri" /></label><label>Catalog #<input value={form.catalog} onChange={(e) => update("catalog", e.target.value)} placeholder="opțional" /></label></div>
      <button className="submit-button" type="submit"><Plus size={17} /> Salvează în catalog</button>
    </form>
  </aside></div>;
}

function DetailSheet({ record, onClose }: { record: VinylRecord | null; onClose: () => void }) {
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
      </aside>
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Toată colecția");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VinylRecord | null>(null);
  const [sortBy, setSortBy] = useState<"position" | "artist" | "year">("position");
  const [localRecords, setLocalRecords] = useState<VinylRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  useEffect(() => { try { setLocalRecords(JSON.parse(localStorage.getItem("vinyl-kallax-local-records") || "[]")); } catch { setLocalRecords([]); } }, []);
  const allRecords = useMemo(() => [...catalog, ...localRecords], [localRecords]);
  const addRecord = (record: VinylRecord) => { const next = [...localRecords, record]; setLocalRecords(next); localStorage.setItem("vinyl-kallax-local-records", JSON.stringify(next)); };
  const exportLocalRecords = () => { const blob = new Blob([JSON.stringify(localRecords, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "vinyl-kallax-new-records.json"; link.click(); URL.revokeObjectURL(url); };

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
        <div className="topbar-actions"><button className="add-top-button" onClick={() => setShowAdd(true)}><Plus size={15} /> Adaugă vinil</button><a className="topbar-link" href="#catalog">Explore collection <ArrowUpRight size={15} /></a></div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy"><p className="eyebrow">PRIVATE LISTENING ROOM / 2026</p><h1>Raftul tău,<br /><i>pus în ordine.</i></h1><p className="hero-intro">Un catalog interactiv pentru colecția de viniluri, aranjată pe rafturi KALLAX și gata de explorat.</p><a href="#catalog" className="hero-cta">Intră în catalog <ArrowUpRight size={17} /></a></div>
          <div className="hero-visual"><img src={heroImage} alt="Vinyl records arranged on a warm listening room table" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div className="hero-stamp">NO.<br /><b>127</b><br />PRESSINGS</div><div className="hero-caption">ANALOG ARCHIVE<br /><span>Organized with intent</span></div></div>
        </section>

        <section className="stats-strip" aria-label="Statistici colecție"><div><span>01</span><strong>{allRecords.length}</strong><small>discuri în colecție</small></div><div><span>02</span><strong>{categories.length}</strong><small>zone de raft</small></div><div><span>03</span><strong>∞</strong><small>ore de ascultare</small></div><p>„Caută după artist,<br />titlu sau atmosferă.”</p></section>

        <section className="catalog-layout" id="catalog">
          <aside className="category-rail"><div className="rail-heading"><span>Index</span><span>01—07</span></div><button className={`category-link ${activeCategory === "Toată colecția" ? "active" : ""}`} onClick={() => setActiveCategory("Toată colecția")}><span>00</span><strong>Toată colecția</strong><em>{allRecords.length}</em></button>{categories.map((category, index) => <button key={category} className={`category-link ${activeCategory === category ? "active" : ""}`} onClick={() => setActiveCategory(category)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{categoryShort(category)}</strong><em>{allRecords.filter((item) => item.category === category).length}</em></button>)}<div className="rail-footer"><Library size={17} /><span>Ordine KALLAX<br /><b>stânga → dreapta</b></span></div></aside>

          <div className="catalog-content"><div className="catalog-heading"><div><p className="eyebrow">THE COLLECTION / {activeCategory === "Toată colecția" ? "ALL SHELVES" : activeCategory.split(" — ")[0]}</p><h2>{activeCategory === "Toată colecția" ? "Toată colecția" : categoryShort(activeCategory)}</h2></div><span className="result-count">{visibleRecords.length} rezultate</span><div className="catalog-actions">{localRecords.length > 0 && <button className="export-button" onClick={exportLocalRecords}><Download size={14} /> Exportă {localRecords.length}</button>}<button className="add-inline-button" onClick={() => setShowAdd(true)}><Plus size={14} /> Adaugă vinil</button></div></div>
            <div className="tool-row"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Caută artist, titlu, label..." aria-label="Caută în colecție" />{query && <button onClick={() => setQuery("")} aria-label="Șterge căutarea"><X size={16} /></button>}</label><div className="sort-control"><SlidersHorizontal size={16} /><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sortează colecția"><option value="position">Ordine KALLAX</option><option value="artist">Artist A—Z</option><option value="year">An</option></select><ChevronDown size={15} /></div></div>
            {activeCategory !== "Toată colecția" && categoryImages[activeCategory] && <div className="category-banner"><img src={categoryImages[activeCategory]} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /><div><span>Zone note</span><strong>{categoryShort(activeCategory)}</strong></div><span className="banner-count">{visibleRecords.length} / {allRecords.filter((item) => item.category === activeCategory).length}</span></div>}
            <div className="records-list">{visibleRecords.map((record) => <RecordRow key={`${record.position}-${record.catalog}`} record={record} onOpen={setSelected} />)}{visibleRecords.length === 0 && <div className="empty-state"><ScanSearch size={30} /><h3>Nimic găsit</h3><p>Încearcă un alt artist, titlu sau schimbă categoria.</p></div>}</div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><span>VINYL KALLAX CATALOG</span><span>Analog archive / made for the listening room</span><span>01—127</span></footer>
      <DetailSheet record={selected} onClose={() => setSelected(null)} />{showAdd && <AddVinylSheet nextPosition={Math.max(...allRecords.map((item) => item.position), 0) + 1} onAdded={addRecord} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
