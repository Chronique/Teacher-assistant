
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppState, ChatMessage, StudentContact } from './types';
import { chatWithGemini } from './services/geminiService';
import { DataView } from './components/DataView';
import { StatsCard } from './components/StatsCard';
import { ContactView } from './components/ContactView';

const INITIAL_STATE: AppState = {
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
      text: 'Halo Bapak/Ibu Guru! 🏫\n\nSaya **GuruMate**, asisten pintar Anda. Data Anda saat ini masih kosong.\n\nSilakan instruksikan saya untuk:\n- 📅 Menambahkan **Jadwal Pelajaran**\n- 📝 Memasukkan **Nilai Siswa**\n- ✍️ Mencatat **Kegiatan Siswa**\n- 🔔 Membuat **Pengingat**\n\nApa yang ingin Bapak/Ibu lakukan?', 
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
    if (view === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, view]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'id-ID';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert("Maaf, browser Anda tidak mendukung perintah suara.");
      }
    }
  };

  const handleAddManualContact = (newContact: StudentContact) => {
    setState(p => {
      const exists = p.contacts.some(c => c.phoneNumber === newContact.phoneNumber);
      if (exists) {
        alert('Nomor ini sudah ada dalam daftar kontak.');
        return p;
      }
      return { ...p, contacts: [...p.contacts, newContact] };
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOffline) {
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ **Anda sedang offline**. Mohon periksa koneksi internet Anda.', timestamp: new Date() }]);
      return;
    }
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input || `📎 File terlampir: ${selectedFile?.name}`, timestamp: new Date() };
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
      const response = await chatWithGemini(currentInput || "Tolong bantu analisis foto ini dan catat datanya.", state, history, fileData);
      
      let botText = response.text || "Permintaan Anda sedang diproses.";
      
      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          if (fc.name === 'addSchedule') setState(p => ({ ...p, schedules: [...p.schedules, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addGrade') setState(p => ({ ...p, grades: [...p.grades, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addActivity') setState(p => ({ ...p, activities: [...p.activities, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addReminder') setState(p => ({ ...p, reminders: [...p.reminders, { id: Date.now().toString(), ...args }] }));
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
      setMessages(prev => [...prev, { role: 'model', text: `❌ Maaf, terjadi gangguan pada sistem. Silakan coba lagi nanti.`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors">
      <header className="shrink-0 px-5 h-16 flex justify-between items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-100 dark:shadow-none">
            <span className="material-symbols-rounded text-xl">school</span>
          </div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">GuruMate</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-500 dark:text-gray-400">
            <span className="material-symbols-rounded">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => setShowHelp(true)} className="p-2 text-gray-500 dark:text-gray-400">
            <span className="material-symbols-rounded">help</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto scroll-hide">
          <div className="max-w-3xl mx-auto px-4 py-6 pb-40">
            {view === 'chat' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
                  <div className="shrink-0"><StatsCard title="Jadwal" value={state.schedules.length} icon="event_note" color="border-indigo-500" /></div>
                  <div className="shrink-0"><StatsCard title="Tugas" value={state.reminders.length} icon="task_alt" color="border-rose-500" /></div>
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
                  <div className="flex gap-1.5 p-3 animate-pulse">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            {view === 'dashboard' && <DataView state={state} />}
            {view === 'contacts' && <ContactView contacts={state.contacts} onAddContact={handleAddManualContact} />}
          </div>
        </div>

        {view === 'chat' && (
          <div className="absolute bottom-4 left-0 right-0 px-4 z-40">
            <div className="max-w-2xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-2 rounded-3xl shadow-xl">
              {filePreview && (
                <div className="px-3 pb-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 mb-2">
                  <div className="relative">
                    <img src={filePreview} className="w-12 h-12 object-cover rounded-xl" />
                    <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                      <span className="material-symbols-rounded text-[14px]">close</span>
                    </button>
                  </div>
                  <span className="text-xs font-bold text-gray-400 truncate max-w-[120px]">{selectedFile?.name}</span>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f) { setSelectedFile(f); const r = new FileReader(); r.onload = () => setFilePreview(r.result as string); r.readAsDataURL(f); }
                }} />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all">
                  <span className="material-symbols-rounded">image</span>
                </button>

                <button type="button" onClick={toggleListening} className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
                  <span className="material-symbols-rounded">{isListening ? 'mic' : 'mic_none'}</span>
                </button>

                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder={isListening ? "Mendengarkan..." : "Ketik atau gunakan suara..."} 
                  className="flex-1 bg-transparent py-3 px-2 outline-none text-[15px] font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                />

                <button 
                  type="submit" 
                  disabled={isLoading || (!input.trim() && !selectedFile)} 
                  className={`p-3 rounded-2xl transition-all active:scale-90 ${(!input.trim() && !selectedFile) ? 'text-gray-300' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'}`}
                >
                  <span className="material-symbols-rounded">send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <nav className="shrink-0 flex justify-around items-center bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 safe-bottom z-50 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {[
          { id: 'chat', label: 'Asisten', icon: 'auto_awesome' },
          { id: 'dashboard', label: 'Rekap', icon: 'grid_view' },
          { id: 'contacts', label: 'Kontak', icon: 'person_search' }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setView(item.id as any)} 
            className={`flex flex-col items-center gap-1 transition-all flex-1 py-1 ${view === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}
          >
            <div className={`px-4 py-1 rounded-xl transition-all ${view === item.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
              <span className={`material-symbols-rounded text-2xl ${view === item.id ? 'FILL-1' : ''}`}>{item.icon}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black dark:text-white">Cara Pakai</h2>
              <button onClick={() => setShowHelp(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                <span className="material-symbols-rounded text-gray-400 text-sm">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
                <span className="material-symbols-rounded text-indigo-600">mic</span>
                <p className="text-sm font-medium dark:text-gray-300">Klik ikon mikrofon untuk mencatat nilai atau jadwal lewat suara.</p>
              </div>
              <div className="flex gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30">
                <span className="material-symbols-rounded text-emerald-600">photo_camera</span>
                <p className="text-sm font-medium dark:text-gray-300">Unggah foto catatan/tabel nilai, biarkan AI yang menginputnya.</p>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-6 bg-gray-900 dark:bg-white dark:text-black text-white py-4 rounded-2xl font-black transition-all active:scale-95">Mengerti</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
