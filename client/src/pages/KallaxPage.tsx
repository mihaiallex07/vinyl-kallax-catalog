/* Hi-Fi Afterglow: tactile KALLAX visualization with warm wood, paper labels, and quiet editorial motion. */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import { onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query as firestoreQuery } from "firebase/firestore";
import { ArrowLeft, ArrowUpRight, Disc3, LogIn } from "lucide-react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { type VinylRecord } from "@/data/catalog";

const ownerEmail = "mihai.alex480@gmail.com";
const cubbyNames = ["Chanson", "România", "Rock", "Pop", "Alternative", "Soul / jazz", "Clasică", "Soundtrack"];

export default function KallaxPage() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<VinylRecord[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<VinylRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (current) => {
    setUser(current);
    if (!current) { setLoading(false); return; }
    try {
      const meta = await getDoc(doc(db, "collections", "main"));
      const members = meta.exists() ? ((meta.data().memberEmails || []) as string[]) : [];
      const isAllowed = Boolean(current.email && members.includes(current.email.toLowerCase()));
      setAllowed(isAllowed);
      if (isAllowed) {
        const snapshot = await getDocs(firestoreQuery(collection(db, "vinylRecords"), orderBy("position", "asc")));
        setRecords(snapshot.docs.map((item) => item.data() as VinylRecord));
      }
    } catch (cause) { console.error(cause); setError("Nu am putut încărca poziționarea KALLAX."); }
    setLoading(false);
  }), []);

  const cubbies = useMemo(() => Array.from({ length: 8 }, (_, index) => records.filter((record) => Math.floor((record.position - 1) / Math.max(1, Math.ceil(Math.max(records.length, 1) / 8))) === index)), [records]);
  const signIn = async () => { try { await signInWithPopup(auth, googleProvider); } catch (cause) { console.error(cause); setError("Autentificarea Google nu a reușit."); } };

  return <div className="kallax-page">
    <header className="kallax-header"><Link href="/" className="back-link"><ArrowLeft size={16} /> Catalog</Link><div className="kallax-wordmark"><span className="brand-mark"><Disc3 size={20} /></span><span>VINYL<br /><em>KALLAX</em></span></div><span className="kallax-meta">2 × 4 / 77 × 147 cm</span></header>
    <main className="kallax-main">
      <div className="kallax-intro"><div><p className="eyebrow">THE LISTENING WALL / 02</p><h1>Raftul,<br /><i>în perspectivă.</i></h1><p>Opt cuburi, o singură hartă a colecției. Treci peste un disc pentru detalii.</p></div><div className="kallax-actions"><Link href="/" className="text-link">Înapoi la catalog <ArrowUpRight size={15} /></Link>{user && allowed && <span className="signed-note">cloud synced / {records.length} discuri</span>}</div></div>
      {!user && !loading && <div className="kallax-gate"><LogIn size={24} /><h2>Autentifică-te pentru a vedea raftul.</h2><p>Vizualizarea KALLAX este privată, la fel ca întreaga colecție.</p><button className="login-button" onClick={signIn}>Intră cu Google</button></div>}
      {user && !allowed && !loading && <div className="kallax-gate"><h2>Acest cont nu are acces.</h2><p>Proprietarul colecției trebuie să îți trimită o invitație.</p></div>}
      {error && <div className="auth-toast" role="status">{error}</div>}
      {allowed && <section className="kallax-stage" aria-label="KALLAX 2x4 visualization"><div className="kallax-frame">{cubbies.map((cubby, cubbyIndex) => <div className="kallax-cubby" key={cubbyIndex}><div className="cubby-label"><span>0{cubbyIndex + 1}</span>{cubbyNames[cubbyIndex]}</div><div className="record-spines">{cubby.map((record, index) => <button key={`${record.position}-${record.catalog}`} className="record-spine" style={{ "--spine": `${(record.position * 37 + index * 23) % 360}` } as CSSProperties} onMouseEnter={() => setHovered(record)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(record)} onBlur={() => setHovered(null)} aria-label={`${record.artist} — ${record.title}`}><span>{record.artist}</span></button>)}</div><span className="cubby-count">{cubby.length} discuri</span></div>)}</div><div className="kallax-shadow" /></section>}
      {hovered && <div className="vinyl-hover-card"><span className="eyebrow">POSITION / {String(hovered.position).padStart(3, "0")}</span><h2>{hovered.title}</h2><p>{hovered.artist}</p><dl><div><dt>Categoria</dt><dd>{hovered.category.replace(/^\d+ — /, "")}</dd></div><div><dt>An</dt><dd>{hovered.year}</dd></div><div><dt>Label</dt><dd>{hovered.label || "—"}</dd></div></dl></div>}
    </main>
  </div>;
}
