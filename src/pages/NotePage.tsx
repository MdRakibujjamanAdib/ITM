import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import Markdown from 'react-markdown';
import { Calendar, User as UserIcon, Share2, Copy, CheckCircle2 } from 'lucide-react';

export function NotePage({ user }: { user: User | null }) {
  const { id } = useParams<{id: string}>();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadNote() {
      if (!id) return;
      try {
        const docRef = doc(db, 'notes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNote({ id: docSnap.id, ...docSnap.data() });
        } else {
          setNote(null);
        }
      } catch (error) {
        console.error("Error loading note", error);
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [id]);

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="py-20 text-center text-neutral-500">Loading note...</div>;
  }

  if (!note) {
    return <div className="py-20 text-center text-neutral-500">Note not found.</div>;
  }

  const date = note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Unknown date';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative border border-[#121212]/10 bg-white/50 backdrop-blur-sm mb-12">
        <div className="absolute top-0 right-8 font-sans text-[80px] sm:text-[120px] font-black text-[#121212]/5 pointer-events-none select-none italic -mt-6">
          REF_{id?.slice(0, 3).toUpperCase()}
        </div>
        
        <div className="p-8 md:p-12 border-b border-[#121212]/10 relative z-10">
          <span className="font-sans text-[10px] uppercase font-bold text-white bg-[#121212] px-2 py-1 mb-6 inline-block tracking-widest">
            Artifact Record
          </span>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[0.9] text-[#121212] mb-6 italic">{note.title}</h1>
              <div className="flex flex-wrap items-center gap-6 font-sans text-[10px] font-bold uppercase tracking-widest text-[#121212]/40">
                <span className="flex items-center gap-2">BY @{note.authorUsername}</span>
                <span className="flex items-center gap-2">&bull; ARCHIVED ON {date}</span>
              </div>
            </div>
            <button 
              onClick={copyLink}
              className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-3 border border-[#121212] bg-transparent uppercase font-sans text-[10px] font-bold tracking-widest text-[#121212] hover:bg-[#121212] hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
              {copied ? 'Link Cloned' : 'Distribute'}
            </button>
          </div>
        </div>
        
        <div className="p-8 md:p-12">
          {note.imageUrl && (
            <div className="mb-10 border-[3px] border-[#121212] bg-[#FDFCFB] p-2">
              <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-[#121212]/40 mb-2 block">Reconstructed Graphic</span>
              <img src={note.imageUrl} alt="Artifact Diagram" className="w-full object-cover grayscale mix-blend-multiply" />
            </div>
          )}
          <div className="prose prose-lg font-serif font-medium text-[#121212]/85 leading-relaxed text-left sm:text-justify max-w-3xl prose-p:first-letter:text-5xl prose-p:first-letter:font-black prose-p:first-letter:mr-3 prose-p:first-letter:float-left prose-p:first-letter:mt-1 prose-a:text-[#121212] prose-a:underline prose-a:decoration-2 prose-headings:font-black prose-headings:tracking-tight prose-headings:italic">
            <Markdown>{note.text}</Markdown>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center pb-12">
        <Link to="/" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#121212]/60 hover:text-[#121212] transition-colors border-b border-transparent hover:border-[#121212] pb-1">
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
