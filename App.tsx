
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppState, ChatMessage, StudentContact, UserProfile } from './types';
import { chatWithGemini } from './services/geminiService';
import { DataView } from './components/DataView';
import { StatsCard } from './components/StatsCard';
import { ContactView } from './components/ContactView';
import { Login } from './components/Login';

const INITIAL_STATE: AppState = {
  user: null,
  schedules: [],
  grades: [],
  activities: [],
  reminders: [],
  parentReports: [],
  contacts: []
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('gurumate_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: 'Halo Bapak/Ibu Guru SMPN 21 Kota Jambi! 🏫\n\nSaya **GuruMate**, asisten pintar Anda. Silakan kirim pesan atau unggah file dokumen (PDF, Excel, Gambar) untuk mulai mencatat data kelas.', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [view, setView] = useState<'chat' | 'dashboard' | 'contacts'>('chat');
  const [showHelp, setShowHelp] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const schoolLogoUrl = "https://raw.githubusercontent.com/ai-gen-images/school-logos/main/smpn21jambi.png";

  useEffect(() => {
    localStorage.setItem('gurumate_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (view === 'chat' && state.user) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, view, state.user]);

  const handleLogin = (user: UserProfile) => {
    setState(prev => ({ ...prev, user }));
  };

  const handleLogout = () => {
    if(confirm('Keluar dari akun?')) {
      setState(INITIAL_STATE);
      localStorage.removeItem('gurumate_state');
      window.location.reload(); // Refresh untuk memastikan cache dibersihkan
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'id-ID';
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        recognitionRef.current.onend = () => setIsListening(false);
      }
      
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        setIsListening(true);
        recognitionRef.current.start();
      }
    } else {
      alert("Browser Anda tidak mendukung perintah suara.");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOffline) {
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ Anda sedang offline.', timestamp: new Date() }]);
      return;
    }
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: input || `📎 File terlampir: ${selectedFile?.name}`, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    
    const currentInput = input;
    const currentFile = selectedFile;
    setInput('');
    setSelectedFile(null);
    setFilePreview(null);
    setIsLoading(true);

    try {
      let fileData = undefined;
      if (currentFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((res) => {
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.readAsDataURL(currentFile);
        });
        fileData = { mimeType: currentFile.type, data: await base64Promise };
      }

      const history = messages.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await chatWithGemini(currentInput || "Analisis dokumen terlampir.", state, history, fileData);
      
      let botText = response.text || "Permintaan diproses.";
      
      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          if (fc.name === 'addSchedule') setState(p => ({ ...p, schedules: [...p.schedules, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addGrade') setState(p => ({ ...p, grades: [...p.grades, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addActivity') setState(p => ({ ...p, activities: [...p.activities, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addReminder') {
            setState(p => ({ 
              ...p, 
              reminders: [...p.reminders, { id: Date.now().toString(), ...args, googleSynced: true }] 
            }));
            botText += "\n\n✅ *Berhasil disinkronkan dengan Google Reminder Anda.*";
          }
          if (fc.name === 'generateParentReport') setState(p => ({ ...p, parentReports: [...p.parentReports, { id: Date.now().toString(), ...args, date: new Date().toLocaleDateString() }] }));
          if (fc.name === 'syncContacts') {
            setState(p => {
               const exists = p.contacts.some(c => c.phoneNumber === args.phoneNumber);
               if (exists) return p;
               return { ...p, contacts: [...p.contacts, { id: Date.now().toString(), ...args }] };
            });
          }
        }
      }
      setMessages(prev => [...prev, { role: 'model', text: botText, timestamp: new Date() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `❌ Gagal memproses data.`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('pdf')) return 'picture_as_pdf';
    if (file.type.includes('sheet') || file.type.includes('excel')) return 'table_view';
    if (file.type.includes('word') || file.type.includes('document')) return 'description';
    return 'insert_drive_file';
  };

  if (!state.user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors">
      <header className="shrink-0 px-5 h-16 flex justify-between items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="flex items-center gap-3">
          <img src={schoolLogoUrl} className="w-8 h-8 object-contain" alt="Logo SMPN 21" />
          <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">GuruMate</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-500">
            <span className="material-symbols-rounded">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <img src={state.user.photo} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" alt="Avatar" onClick={handleLogout} />
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto scroll-hide">
          <div className="max-w-3xl mx-auto px-4 py-6 pb-40">
            {view === 'chat' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
                  <div className="shrink-0"><StatsCard title="Jadwal" value={state.schedules.length} icon="event_note" color="border-indigo-500" /></div>
                  <div className="shrink-0"><StatsCard title="Reminders" value={state.reminders.length} icon="notifications_active" color="border-rose-500" /></div>
                  <div className="shrink-0"><StatsCard title="Kontak" value={state.contacts.length} icon="group" color="border-emerald-500" /></div>
                </div>

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`max-w-[88%] px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-900 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                    }`}>
                      <div className="prose-custom">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                      </div>
                      <p className={`text-[10px] mt-1.5 opacity-50 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-1.5 p-3">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            {view === 'dashboard' && <DataView state={state} />}
            {view === 'contacts' && <ContactView contacts={state.contacts} onAddContact={(c) => setState(p => ({ ...p, contacts: [...p.contacts, c] }))} />}
          </div>
        </div>

        {view === 'chat' && (
          <div className="absolute bottom-4 left-0 right-0 px-4 z-40">
            <div className="max-w-2xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-2 rounded-3xl shadow-2xl">
              {selectedFile && (
                <div className="px-3 pb-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 mb-2">
                  <div className="relative w-12 h-12 bg-indigo-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                    {filePreview ? (
                      <img src={filePreview} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="material-symbols-rounded text-indigo-600">{getFileIcon(selectedFile)}</span>
                    )}
                    <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg">
                      <span className="material-symbols-rounded text-[14px]">close</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-gray-700 dark:text-gray-200 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="*" 
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if(f) { 
                      setSelectedFile(f); 
                      if (f.type.startsWith('image/')) {
                        const r = new FileReader(); 
                        r.onload = () => setFilePreview(r.result as string); 
                        r.readAsDataURL(f);
                      } else {
                        setFilePreview(null);
                      }
                    }
                  }} 
                />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all active:scale-90">
                  <span className="material-symbols-rounded">add_circle</span>
                </button>

                <button type="button" onClick={toggleListening} className={`p-3 rounded-2xl transition-all active:scale-90 ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
                  <span className="material-symbols-rounded">{isListening ? 'mic' : 'mic_none'}</span>
                </button>

                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder={isListening ? "Mendengarkan..." : "Pesan atau unggah file..."} 
                  className="flex-1 bg-transparent py-3 px-2 outline-none text-[15px] font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                />

                <button 
                  type="submit" 
                  disabled={isLoading || (!input.trim() && !selectedFile)} 
                  className={`p-3 rounded-2xl transition-all active:scale-95 ${(!input.trim() && !selectedFile) ? 'text-gray-300' : 'bg-indigo-600 text-white shadow-lg'}`}
                >
                  <span className="material-symbols-rounded">arrow_upward</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <nav className="shrink-0 flex justify-around items-center bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 safe-bottom z-50 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        {[
          { id: 'chat', label: 'Asisten', icon: 'chat' },
          { id: 'dashboard', label: 'Rekap', icon: 'analytics' },
          { id: 'contacts', label: 'Kontak', icon: 'contacts' }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id as any)} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 ${view === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <div className={`px-4 py-1 rounded-xl ${view === item.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
              <span className={`material-symbols-rounded text-2xl ${view === item.id ? 'FILL-1' : ''}`}>{item.icon}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
              <span className="material-symbols-rounded text-indigo-600">info</span> Bantuan
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="material-symbols-rounded text-indigo-600">sync</span>
                <p className="text-xs font-bold leading-relaxed dark:text-gray-300">Semua pengingat disinkronkan ke Google Tasks SMPN 21.</p>
              </div>
              <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <span className="material-symbols-rounded text-indigo-600">upload_file</span>
                <p className="text-xs font-bold leading-relaxed dark:text-gray-300">Unggah PDF nilai atau foto tabel untuk input data otomatis.</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-2xl font-black">Lanjutkan</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
