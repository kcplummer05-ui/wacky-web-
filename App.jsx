import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Wifi, 
  Zap, 
  History, 
  Search, 
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Activity,
  Globe,
  Database,
  Link,
  Info,
  ShieldAlert,
  Trash2,
  Terminal,
  Stars,
  Ghost,
  Lightbulb,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

// --- CONFIGURATION ---
// These are provided by the environment automatically
const apiKey = ""; 
const firebaseConfig = JSON.parse(__firebase_config);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mr-heppard-wacky-web';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('security');
  const [targetUrl, setTargetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [error, setError] = useState(null);
  const [wackyTip, setWackyTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(false);

  // --- RULE 3: AUTHENTICATION FIRST ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth failed", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- RULE 1 & 2: CLOUD DATA ---
  useEffect(() => {
    if (!user) return;

    // RULE 1: Specific collection path for private data
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'scans');
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // RULE 2: Sort in memory (No complex server-side queries)
      setScanHistory(docs.sort((a, b) => b.timestamp - a.timestamp));
    }, (err) => {
      console.error("Database sync error", err);
    });

    return () => unsubscribe();
  }, [user]);

  // --- WACKY TIP OF THE DAY ---
  useEffect(() => {
    const fetchTip = async () => {
      setLoadingTip(true);
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Tell me a short, wacky fact about internet history." }] }],
            systemInstruction: { parts: [{ text: "You are Mr. Heppard's Wacky Historian. Keep facts under 20 words. No quotes." }] }
          })
        });
        const data = await response.json();
        setWackyTip(data.candidates?.[0]?.content?.parts?.[0]?.text || "The first domain name was symbolics.com.");
      } catch (e) {
        setWackyTip("The internet is too wacky to explain right now.");
      } finally {
        setLoadingTip(false);
      }
    };
    fetchTip();
  }, []);

  // --- AI SECURITY SCANNER ---
  const analyzeUrl = async () => {
    if (!targetUrl || !user) return;
    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze safety of: ${targetUrl}` }] }],
          systemInstruction: { parts: [{ text: 'Return JSON: {"status": "safe"|"suspicious"|"malicious", "reason": "1-sentence wacky explanation"}' }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      setScanResult(result);

      // Save to Firestore
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'scans'), {
        url: targetUrl,
        ...result,
        timestamp: Date.now()
      });
    } catch (e) {
      setError("The wacky-waves are jammed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const deleteLog = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'scans', id));
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-300 font-mono pb-28">
      {/* CYBER HEADER */}
      <header className="px-6 pt-10 pb-6 border-b border-purple-900/30 bg-[#08090d]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/50 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Ghost size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest text-white uppercase italic leading-none mb-1">Mr. Heppard's</h1>
              <h2 className="text-sm font-black tracking-tighter text-cyan-400 uppercase italic leading-none">Wacky Web Terminal</h2>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Secure</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-5 max-w-md mx-auto space-y-6">
        {/* WACKY TIP */}
        <section className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-purple-500/20 p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-yellow-400">
            <Sparkles size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Wacky Wonder</span>
          </div>
          <p className="text-xs italic text-slate-400">
            {loadingTip ? "Consulting ghosts..." : `"${wackyTip}"`}
          </p>
        </section>

        {/* SCANNER VIEW */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900/40 border border-purple-900/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 text-cyan-400">
                <Terminal size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">PROTOCOL: WACKY_SCAN</span>
              </div>
              <input 
                type="text"
                placeholder="INPUT_URL_DATA..."
                className="w-full bg-black/60 border border-slate-800 rounded-xl py-4 px-4 text-sm font-mono text-cyan-300 outline-none focus:border-cyan-500 transition-all placeholder:text-slate-800"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
              <button 
                onClick={analyzeUrl}
                disabled={isScanning || !targetUrl}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                {isScanning ? <RefreshCw className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                {isScanning ? "PROCESSING..." : "EXECUTE_SCAN"}
              </button>
            </div>

            {/* RESULTS */}
            {scanResult && !isScanning && (
              <div className={`p-6 rounded-2xl border ${
                scanResult.status === 'safe' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
                scanResult.status === 'suspicious' ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' :
                'border-rose-500/50 bg-rose-500/10 text-rose-400'
              } animate-in zoom-in-95`}>
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} />
                  <h3 className="text-xs font-black uppercase">Analysis Complete: {scanResult.status}</h3>
                </div>
                <p className="text-xs leading-relaxed italic opacity-80 border-l-2 border-current pl-3">
                  "{scanResult.reason}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* ARCHIVE VIEW */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Wacky_Archive_Logs</h3>
            {scanHistory.map(log => (
              <div key={log.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group">
                <div className="truncate pr-4">
                  <p className="text-xs font-bold text-white truncate">{log.url}</p>
                  <p className={`text-[9px] uppercase font-bold ${
                    log.status === 'safe' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>{log.status} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
                <button onClick={() => deleteLog(log.id)} className="text-slate-700 hover:text-rose-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MOBILE NAV */}
      <nav className="fixed bottom-6 left-6 right-6 h-18 bg-black/80 backdrop-blur-xl border border-purple-900/20 rounded-2xl px-6 flex justify-around items-center z-50">
        <NavButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18} />} label="Scan" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18} />} label="Logs" />
        <NavButton active={activeTab === 'network'} onClick={() => setActiveTab('network')} icon={<Wifi size={18} />} label="Net" />
        <NavButton active={activeTab === 'boost'} onClick={() => setActiveTab('boost')} icon={<Zap size={18} />} label="Boost" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-cyan-400' : 'text-slate-600'}`}>
    <div className={`p-1 ${active ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : ''}`}>{icon}</div>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

export default App;

