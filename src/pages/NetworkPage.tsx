import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { Link } from 'react-router';

export function NetworkPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNetworkData() {
      try {
        // Load leaders
        const leadersQuery = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
        const leadersSnapshot = await getDocs(leadersQuery);
        setLeaders(leadersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Load notes
        const notesQuery = query(collection(db, 'notes'), orderBy('createdAt', 'desc'), limit(50));
        const notesSnapshot = await getDocs(notesQuery);
        setNotes(notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error loading network data", error);
      } finally {
        setLoading(false);
      }
    }
    loadNetworkData();
  }, []);

  const filteredNotes = notes.filter(note => 
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
      <div className="flex-1 space-y-12">
        <div>
          <h1 className="text-6xl font-black mb-4 italic">Global Archive</h1>
          <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#121212]/50 mb-8">Access the collective knowledge network.</p>
          
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-[#121212]/30" size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Query archive records..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FDFCFB] border border-[#121212]/20 py-4 pl-12 pr-4 font-sans text-xs uppercase tracking-widest font-bold placeholder:text-[#121212]/30 outline-none focus:border-[#121212] transition-colors"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center font-sans text-[11px] font-bold uppercase tracking-widest text-[#121212]/50 flex justify-center"><Loader2 className="animate-spin text-[#121212]" /></div>
            ) : filteredNotes.length === 0 ? (
              <div className="py-20 text-center font-sans text-[11px] font-bold uppercase tracking-widest text-[#121212]/50 border border-dashed border-[#121212]/20">No matching records found.</div>
            ) : (
              filteredNotes.map(note => (
                <Link key={note.id} to={`/notes/${note.id}`} className="block border border-[#121212]/10 bg-white/50 p-6 hover:bg-[#121212] hover:text-white transition-colors group">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="font-serif text-2xl font-bold italic line-clamp-1">{note.title}</h3>
                    <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-[#121212]/40 group-hover:text-white/40 whitespace-nowrap">
                      {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'UNKNOWN'}
                    </span>
                  </div>
                  <p className="text-sm font-medium opacity-70 line-clamp-2 mb-4 font-serif leading-relaxed text-justify">
                    "{note.text}"
                  </p>
                  <div className="flex items-center gap-2 font-sans text-[9px] uppercase font-bold tracking-widest opacity-60">
                     <span>Agent_@{note.authorUsername}</span>
                     {note.imageUrl && <span className="px-2 py-0.5 border border-current">GRAPHIC</span>}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:w-96 flex-shrink-0">
        <h2 className="text-3xl font-black mb-4 italic">Leader Tree</h2>
        <p className="font-sans text-[9px] font-bold uppercase tracking-widest text-[#121212]/50 mb-8 border-b border-[#121212]/10 pb-4">Top Contributors</p>
        
        <div className="border border-[#121212]/10 bg-white/50 backdrop-blur-sm relative">
          <div className="absolute top-0 right-4 transform -translate-y-1/2">
            <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-white bg-[#121212] px-3 py-1">Live Update</span>
          </div>
          {loading ? (
            <div className="py-12 text-center font-sans text-[9px] font-bold uppercase tracking-widest text-[#121212]/50">Fetching...</div>
          ) : leaders.length === 0 ? (
            <div className="py-12 text-center font-sans text-[9px] font-bold uppercase tracking-widest text-[#121212]/50">Empty Tree</div>
          ) : (
            <div className="divide-y divide-[#121212]/5">
              {leaders.map((leader, index) => (
                <div key={leader.id} className="flex items-center justify-between p-4 hover:bg-[#121212]/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="font-sans text-sm font-black text-[#121212]/30 group-hover:text-[#121212] w-6 text-center">
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 border border-[#121212] bg-white flex items-center justify-center font-serif text-sm italic shadow-inner">
                      {leader.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider truncate max-w-[100px]">{leader.username}</span>
                  </div>
                  <span className="font-serif text-lg font-medium italic">{leader.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
