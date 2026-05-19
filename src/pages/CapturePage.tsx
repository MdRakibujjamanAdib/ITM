import { useState, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import Webcam from 'react-webcam';
import { db } from '../firebase/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router';
import { Camera, Upload, Wand2, Check, ArrowRight, Loader2, Sparkles, RefreshCcw, FileText } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export function CapturePage({ user }: { user: User | null }) {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Image, 2: Review text
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();
  const { error: showError, success } = useToast();

  const [hasDiagram, setHasDiagram] = useState(false);
  const [diagramDesc, setDiagramDesc] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const src = webcamRef.current.getScreenshot();
      setImageSrc(src);
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const processImage = async () => {
    if (!imageSrc) return;
    setLoadingOCR(true);
    setStep(2);
    setGeneratedImageUrl(null);

    try {
      // convert dataURI to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'capture.jpg');
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.text) {
        setExtractedText(data.text);
        if (data.hasDiagram) {
           setHasDiagram(true);
           setDiagramDesc(data.diagramDescription || '');
        } else {
           setHasDiagram(false);
           setDiagramDesc('');
        }
        success("Artifact analysis complete.");
      } else {
        showError(data.error || 'Failed to extract text');
        setStep(1);
      }
    } catch (error) {
      console.error(error);
      showError('Error extracting text');
      setStep(1);
    } finally {
      setLoadingOCR(false);
    }
  };

  const generateDiagram = async () => {
    if (!diagramDesc) return;
    setGeneratingImage(true);
    try {
       const response = await fetch('/api/generate-image', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ description: diagramDesc })
       });
       const data = await response.json();
       if (data.imageUrl) {
         setGeneratedImageUrl(data.imageUrl);
         success("Graph reconstructed successfully.");
       } else {
         showError(data.error || 'Failed to generate diagram');
       }
    } catch (error) {
       console.error(error);
       showError('Error generating diagram');
    } finally {
       setGeneratingImage(false);
    }
  };

  const getSuggestions = async () => {
    if (!extractedText) return;
    setSuggesting(true);
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText })
      });
      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (error) {
      console.error(error);
    } finally {
      setSuggesting(false);
    }
  };

  const saveNote = async () => {
    if (!extractedText || !title) {
      showError('Please provide a title and ensure text is extracted.');
      return;
    }
    setSaving(true);
    try {
      const noteData: any = {
        title,
        text: extractedText,
        authorId: user?.uid || 'anonymous',
        authorUsername: user?.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
      };

      if (generatedImageUrl) {
        noteData.imageUrl = generatedImageUrl;
      }
      
      const docRef = await addDoc(collection(db, 'notes'), noteData);
      
      // Give points if logged in
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          points: increment(10)
        });
      }
      
      success("Artifact transmitted to archive.");
      navigate(`/notes/${docRef.id}`);
    } catch (error) {
      console.error('Save Note error', error);
      showError('Failed to save note');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-5xl font-black mb-8 italic">Digitization Hub</h1>

      {step === 1 && (
        <div className="bg-white/50 backdrop-blur-sm p-8 shadow-sm border border-[#121212]/10 relative">
          <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-[#121212]/40 mb-6 block text-center">Protocol: Visual Acquisition</span>
          {!imageSrc ? (
            <div className="space-y-8">
              <div className="flex border border-[#121212]/20 divider-x divide-x divide-[#121212]/20">
                <button 
                  onClick={() => setMode('upload')}
                  className={`flex-1 py-4 font-sans text-[11px] uppercase tracking-widest font-bold transition-colors ${mode === 'upload' ? 'bg-[#121212] text-white' : 'bg-transparent text-[#121212] hover:bg-[#121212]/5'}`}
                >
                  Document Upload
                </button>
                <button 
                  onClick={() => setMode('camera')}
                  className={`flex-1 py-4 font-sans text-[11px] uppercase tracking-widest font-bold transition-colors ${mode === 'camera' ? 'bg-[#121212] text-white' : 'bg-transparent text-[#121212] hover:bg-[#121212]/5'}`}
                >
                  Live Capture
                </button>
              </div>

              {mode === 'camera' && (
                <div className="flex flex-col items-center border-[3px] border-[#121212] p-2 bg-[#FDFCFB]">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full max-w-lg mb-6 grayscale hover:grayscale-0 transition-all duration-700 object-cover aspect-video"
                    videoConstraints={{ facingMode: "environment" }}
                  />
                  <button onClick={capture} className="w-full bg-[#121212] text-white py-4 font-sans text-xs uppercase font-bold tracking-[0.2em] hover:bg-black flex items-center justify-center gap-2 border-t-[3px] border-[#121212] cursor-pointer">
                    <Camera size={16} /> Execute Capture
                  </button>
                </div>
              )}

              {mode === 'upload' && (
                <div className="flex flex-col items-center justify-center border-[3px] border-dashed border-[#121212]/30 p-16 relative hover:bg-[#121212]/5 transition-colors">
                  <Upload size={32} className="text-[#121212] mb-6" />
                  <p className="font-serif text-2xl italic tracking-tight mb-2">Drag and drop artifacts here</p>
                  <p className="font-sans text-[10px] uppercase font-bold tracking-[0.1em] text-[#121212]/50 mb-8">Format: JPG, PNG</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="bg-transparent border-2 border-[#121212] px-8 py-3 text-[#121212] font-sans text-[10px] font-bold uppercase tracking-widest hover:bg-[#121212] hover:text-white transition-colors pointer-events-none">
                    Select File
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-8">
              <img src={imageSrc} alt="Captured" className="w-full max-w-lg border-[4px] border-white shadow-inner bg-white grayscale" />
              <div className="flex gap-4 w-full max-w-lg">
                <button onClick={() => setImageSrc(null)} className="flex-1 py-4 border border-[#121212] bg-transparent hover:bg-[#121212]/5 text-[#121212] font-sans text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <RefreshCcw size={16} /> Override
                </button>
                <button onClick={processImage} disabled={loadingOCR} className="flex-1 py-4 bg-[#121212] hover:bg-black text-white font-sans text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 cursor-pointer">
                  {loadingOCR ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} 
                  {loadingOCR ? 'Processing...' : 'Engage OCR'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white/50 backdrop-blur-sm p-8 shadow-sm border border-[#121212]/10 relative">
            <h2 className="text-3xl font-black mb-8 italic border-b border-[#121212]/10 pb-6 flex items-center justify-between">
              Extracted Transcription
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-white bg-[#121212] px-3 py-1 not-italic">Stage 02</span>
            </h2>
            
            {loadingOCR ? (
              <div className="flex flex-col items-center justify-center py-32 text-[#121212]/50">
                <Loader2 size={32} className="animate-spin mb-6 text-[#121212]" />
                <p className="font-sans text-[11px] font-bold uppercase tracking-widest">Querying Vision Model...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <label className="block font-sans text-[10px] font-bold uppercase tracking-widest text-[#121212]/40 mb-3">Nomenclature</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Dissertation Notes - Vol II" 
                    className="w-full border-b-[2px] border-[#121212] bg-transparent rounded-none p-3 outline-none focus:border-[#121212] transition-colors font-serif text-2xl italic placeholder:text-[#121212]/20"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-widest text-[#121212]/40">Raw Manuscript Data</label>
                    <button 
                      onClick={getSuggestions} 
                      disabled={suggesting}
                      className="text-[#121212] border border-[#121212] px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#121212] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Syntax Analysis
                    </button>
                  </div>
                  <textarea 
                    value={extractedText} 
                    onChange={e => setExtractedText(e.target.value)}
                    rows={12} 
                    className="w-full border border-[#121212]/20 bg-[#FDFCFB] p-6 font-serif text-lg leading-relaxed outline-none focus:border-[#121212] transition-colors resize-y"
                  />
                </div>

                {hasDiagram && !generatedImageUrl && (
                  <div className="p-6 bg-blue-50 border-l-[3px] border-blue-400 text-sm shadow-inner mt-6 flex justify-between items-center">
                    <div>
                      <h4 className="font-sans text-[10px] uppercase font-bold tracking-widest text-blue-900 mb-1">Visual Content Detected</h4>
                      <p className="font-serif italic text-blue-900/80">The system has identified diagrams in the manuscript.</p>
                    </div>
                    <button 
                      onClick={generateDiagram} 
                      disabled={generatingImage}
                      className="px-4 py-2 bg-blue-900 text-white font-sans text-[10px] uppercase font-bold tracking-widest hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {generatingImage ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      {generatingImage ? 'Reconstructing...' : 'Reconstruct Graph'}
                    </button>
                  </div>
                )}
                
                {generatedImageUrl && (
                  <div className="mt-6 border border-[#121212]/20 p-2 bg-[#FDFCFB]">
                    <div className="flex justify-between items-center mb-2 px-2">
                       <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#121212]/50">Reconstructed Graph</span>
                       <button onClick={() => setGeneratedImageUrl(null)} className="text-[#121212]/50 hover:text-[#121212] text-xs uppercase font-bold font-sans cursor-pointer tracking-widest border-b border-transparent hover:border-[#121212]">Remove</button>
                    </div>
                    <img src={generatedImageUrl} alt="Reconstructed diagram" className="w-full grayscale mix-blend-multiply" />
                  </div>
                )}

                {suggestion && (
                  <div className="p-6 bg-amber-50 border-l-[3px] border-amber-300 text-sm shadow-inner">
                    <h4 className="font-sans text-[10px] uppercase font-bold tracking-widest text-amber-900 mb-3 flex items-center gap-2">Protocol: AI Suggestion</h4>
                    <div className="whitespace-pre-wrap font-serif italic text-base leading-relaxed text-amber-950/80">{suggestion}</div>
                  </div>
                )}
                
                <div className="flex justify-between pt-8 border-t border-[#121212]/10 mt-8">
                   <button onClick={() => setStep(1)} className="px-8 py-3 border border-[#121212] bg-transparent hover:bg-[#121212]/5 text-[#121212] font-sans text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer">
                    Abort
                  </button>
                  <button onClick={saveNote} disabled={saving} className="px-8 py-3 bg-[#121212] hover:bg-black text-white font-sans text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 transition-colors disabled:opacity-70 cursor-pointer">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {saving ? 'Transmitting...' : 'Commit to Archive'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
