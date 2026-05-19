import { User } from 'firebase/auth';
import { Link } from 'react-router';
import { Camera, FileText } from 'lucide-react';

export function HomePage({ user }: { user: User | null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 border-x border-[#121212]/10 min-h-[calc(100vh-140px)]">
      <div className="font-sans text-[10px] uppercase font-bold text-white bg-[#121212] px-2 py-1 mb-8 inline-block tracking-widest">
        OCR Active: Gemini-Pro v1.5
      </div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-[#121212] mb-8 max-w-4xl italic">
        The Hegemony of <br className="hidden md:block"/> Shared Knowledge.
      </h1>
      <p className="text-xl md:text-2xl font-medium text-[#121212]/80 mb-12 max-w-2xl leading-relaxed">
        Digitize handwritten observations. Let AI transcribe and correct seamlessly. Form a collective archive of documented thought.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <Link to="/capture" className="bg-[#121212] hover:bg-black text-white px-10 py-5 font-sans font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-3 transition-colors border border-[#121212] w-full sm:w-auto justify-center">
          <Camera size={18} /> Initialize Scan
        </Link>
        {!user && (
          <p className="font-sans text-[9px] uppercase tracking-tighter opacity-50 max-w-[200px] text-left leading-relaxed">
            Guest capture active.<br/>Login to accumulate archive points.
          </p>
        )}
      </div>

      {/* Feature grid */}
      <div className="grid md:grid-cols-3 mt-32 text-left w-full border-t border-[#121212]/10 divide-y md:divide-y-0 md:divide-x divide-[#121212]/10 bg-white/50 backdrop-blur-sm">
        <div className="p-8 md:p-12">
          <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-[#121212]/40 mb-4 block">01 / Process</span>
          <h3 className="text-3xl font-bold mb-4 italic">Instant OCR</h3>
          <p className="text-[#121212]/70 font-medium">Advanced Gemini AI converts your organic scribbles directly into structured data with uncompromising precision.</p>
        </div>
        <div className="p-8 md:p-12">
          <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-[#121212]/40 mb-4 block">02 / Refine</span>
          <h3 className="text-3xl font-bold mb-4 italic">AI Corrections</h3>
          <p className="text-[#121212]/70 font-medium">Automatic grammar parsing and spelling syntax resolution applied prior to final network synchronization.</p>
        </div>
        <div className="p-8 md:p-12">
          <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-[#121212]/40 mb-4 block">03 / Ascend</span>
          <h3 className="text-3xl font-bold mb-4 italic">Social Graph</h3>
          <p className="text-[#121212]/70 font-medium">Accumulate prestige tokens for disseminating high-fidelity artifacts. Scale the global archive ladder.</p>
        </div>
      </div>
    </div>
  );
}
