import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Link } from 'react-router';
import { FileText, Trophy, Activity, Calendar } from 'lucide-react';

export function ProfilePage({ user }: { user: User | null }) {
  const [profileData, setProfileData] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // Load Profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
        }

        // Load Notes
        const q = query(
          collection(db, 'notes'), 
          where('authorId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const notesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort locally
        notesData.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA; // descending
        });
        
        setNotes(notesData);
      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return <div className="py-20 text-center text-neutral-500">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-neutral-500">
        <p className="mb-4">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="border-b border-[#121212]/10 pb-12 mb-12 flex flex-col items-center sm:items-start sm:flex-row gap-8">
        <div className="w-40 h-40 border border-[#121212] bg-[#FDFCFB] flex-shrink-0 flex items-center justify-center text-6xl italic p-2">
           {user.photoURL ? (
             <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
           ) : (
              <div className="w-full h-full overflow-hidden flex items-center justify-center font-serif text-[#121212]">
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
           )}
        </div>
        
        <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
           <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#121212]/40 mb-2 block">Agent Profile</span>
           <h1 className="text-5xl font-black italic mb-2 tracking-tight">{profileData?.username || user.displayName}</h1>
           <p className="font-sans text-xs font-bold uppercase tracking-widest text-[#121212]/70 border-b border-[#121212]/10 pb-6 mb-6 inline-block">{user.email}</p>
           
           <div className="flex items-center justify-center sm:justify-start gap-4">
             <div className="border border-[#121212] px-6 py-4 bg-white/50 inline-flex flex-col">
                <span className="font-sans text-[9px] uppercase font-bold tracking-[0.2em] text-[#121212]/50 mb-1">Archive Volume</span>
                <span className="font-serif text-3xl font-bold italic">{profileData?.points || 0} pts</span>
             </div>
           </div>
        </div>
      </div>

      <div className="mb-8 font-sans text-[11px] font-bold uppercase tracking-widest text-[#121212]/50 border-b border-[#121212]/10 pb-4">
        Transmitted Artifacts
      </div>

      {notes.length === 0 ? (
        <div className="border border-dashed border-[#121212]/20 p-16 text-center text-[#121212]/40">
          <p className="font-serif text-2xl italic tracking-tight mb-4">No artifacts supplied.</p>
          <Link to="/capture" className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] border-b border-[#121212]/40 hover:text-[#121212] hover:border-[#121212] transition-colors pb-1">Initiate Transmission</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-px bg-[#121212]/10 border border-[#121212]/10">
          {notes.map(note => (
            <Link key={note.id} to={`/notes/${note.id}`} className="bg-[#FDFCFB] p-8 hover:bg-[#121212] hover:text-white transition-colors group flex flex-col h-full">
              <h3 className="font-serif text-2xl font-bold italic mb-4 line-clamp-2">{note.title}</h3>
              <p className="text-sm font-medium opacity-70 line-clamp-3 mb-8 font-serif leading-relaxed text-justify flex-1">
                "{note.text}"
              </p>
              <div className="flex justify-between items-center font-sans text-[9px] uppercase font-bold tracking-widest border-t border-[#121212]/10 group-hover:border-white/20 pt-4 mt-auto">
                <span className="opacity-50">DATE: {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'UNKNOWN'}</span>
                <span>Access &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
