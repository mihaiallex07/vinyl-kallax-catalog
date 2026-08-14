/* Hi-Fi Afterglow: tactile KALLAX visualization with warm wood, paper labels, and quiet editorial motion. */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query as firestoreQuery } from "firebase/firestore";
import { ArrowLeft, ArrowUpRight, Disc3, LogIn } from "lucide-react";
import { auth, db, googleProvider } from "@/lib/firebase";
import { type VinylRecord } from "@/data/catalog";

const ownerEmail = "mihai.alex480@gmail.com";
const cubbyMap = [
  { label: "Chanson", category: "01 — Chanson & voce franceză" },
  { label: "România", category: "02 — România" },
  { label: "Rock", category: "03 — Rock" },
  { label: "Pop", category: "04 — Pop" },
  { label: "Alternative", category: "05 — Alternative / indie / electronic" },
  { label: "Soul / jazz", category: "06 — Soul, jazz, blues, world & folk" },
  { label: "Clasică / film", category: "07 — Clasică, operă, musical & soundtrack" },
  { label: "Rezervă", category: null },
];

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

  const cubbies = useMemo(() => cubbyMap.map(({ category }) => category ? records.filter((record) => record.category === category) : []), [records]);
  const signIn = async () => { try { await signInWithPopup(auth, googleProvider); } catch (cause) { console.error(cause); setError("Autentificarea Google nu a reușit."); } };

  return <div className="kallax-page">
    <header className="kallax-header"><a href={import.meta.env.BASE_URL} className="back-link"><ArrowLeft size={16} /> Catalog</a><div className="kallax-wordmark"><span className="brand-mark"><Disc3 size={20} /></span><span>VINYL<br /><em>KALLAX</em></span></div><span className="kallax-meta">2 × 4 / 77 × 147 cm</span></header>
    <main className="kallax-main">
      <div className="kallax-intro"><div><p className="eyebrow">THE LISTENING WALL / 02</p><h1>Raftul,<br /><i>în perspectivă.</i></h1><p>Opt cuburi, o singură hartă a colecției. Treci peste un disc pentru detalii.</p></div><div className="kallax-actions"><a href={import.meta.env.BASE_URL} className="text-link">Înapoi la catalog <ArrowUpRight size={15} /></a>{user && allowed && <span className="signed-note">cloud synced / {records.length} discuri</span>}</div></div>
      {!user && !loading && <div className="kallax-gate"><LogIn size={24} /><h2>Autentifică-te pentru a vedea raftul.</h2><p>Vizualizarea KALLAX este privată, la fel ca întreaga colecție.</p><button className="login-button" onClick={signIn}>Intră cu Google</button></div>}
      {user && !allowed && !loading && <div className="kallax-gate"><h2>Acest cont nu are acces.</h2><p>Proprietarul colecției trebuie să îți trimită o invitație.</p></div>}
      {error && <div className="auth-toast" role="status">{error}</div>}
      {allowed && <section className="kallax-stage" aria-label="KALLAX 2x4 visualization"><div className="kallax-frame">{cubbies.map((cubby, cubbyIndex) => <div className="kallax-cubby" key={cubbyIndex}><div className="cubby-label"><span>0{cubbyIndex + 1}</span>{cubbyMap[cubbyIndex].label}</div><div className="record-spines">{cubby.map((record, index) => <button key={`${record.position}-${record.catalog}`} className="record-spine" style={{ "--spine": `${(record.position * 37 + index * 23) % 360}` } as CSSProperties} onMouseEnter={() => setHovered(record)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(record)} onBlur={() => setHovered(null)} aria-label={`${record.artist} — ${record.title}`}><span>{record.artist}</span></button>)}</div><span className="cubby-count">{cubby.length} discuri</span></div>)}</div><div className="kallax-shadow" /></section>}
      {hovered && <div className="vinyl-hover-card"><span className="eyebrow">POSITION / {String(hovered.position).padStart(3, "0")}</span><h2>{hovered.title}</h2><p>{hovered.artist}</p><dl><div><dt>Categoria</dt><dd>{hovered.category.replace(/^\d+ — /, "")}</dd></div><div><dt>An</dt><dd>{hovered.year}</dd></div><div><dt>Label</dt><dd>{hovered.label || "—"}</dd></div></dl></div>}
    </main>
  </div>;
}
