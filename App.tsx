
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
    { role: 'model', text: 'Halo Bapak/Ibu Guru! 🏫\n\nSaya **GuruMate**, asisten pintar Anda. Data Anda saat ini masih kosong.\n\nSilakan instruksikan saya untuk:\n- 📅 Menambahkan **Jadwal Pelajaran**\n- 📝 Memasukkan **Nilai Siswa**\n- ✍️ Mencatat **Kegiatan/Perilaku Siswa**\n- 🔔 Membuat **Pengingat**\n\nApa yang ingin Anda lakukan pertama kali?', timestamp: new Date() }
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  const handleSyncContacts = () => {
    // Fungsi sinkronisasi kontak sekarang hanya memberi tahu user untuk menambahkan via chat
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: 'Fitur Sinkronisasi Kontak: Silakan ucapkan atau ketik "Tambahkan kontak [Nama] nomor [HP]" untuk mengisi daftar kontak Anda.', 
      timestamp: new Date() 
    }]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOffline) {
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ **Anda sedang offline**. Mohon periksa koneksi internet Anda.', timestamp: new Date() }]);
      return;
    }
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const cmd = input.trim().toLowerCase();
    if (cmd === '/list') { setShowHelp(true); setInput(''); return; }
    if (cmd === '/reset') { 
      if(confirm('Hapus semua data dan mulai ulang chat?')) {
        setState(INITIAL_STATE);
        setMessages([{ role: 'model', text: 'Aplikasi telah diatur ulang ke kondisi awal.', timestamp: new Date() }]);
      }
      setInput(''); 
      return; 
    }

    const userMsg: ChatMessage = { role: 'user', text: input || `File: ${selectedFile?.name}`, timestamp: new Date() };
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

      const history = messages.slice(-6).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await chatWithGemini(currentInput || "Analisis file ini", state, history, fileData);
      
      let botText = response.text || "Saya telah memproses permintaan Anda.";
      
      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          if (fc.name === 'addSchedule') setState(p => ({ ...p, schedules: [...p.schedules, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addGrade') setState(p => ({ ...p, grades: [...p.grades, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addActivity') setState(p => ({ ...p, activities: [...p.activities, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addReminder') setState(p => ({ ...p, reminders: [...p.reminders, { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'generateParentReport') setState(p => ({ ...p, parentReports: [...p.parentReports, { id: Date.now().toString(), ...args, date: new Date().toLocaleDateString() }] }));
          if (fc.name === 'syncContacts') handleSyncContacts();
        }
      }
      setMessages(prev => [...prev, { role: 'model', text: botText, timestamp: new Date() }]);
    } catch (err: any) {
      let errorMsg = 'Gagal memproses pesan.';
      if (err.message?.includes('429')) errorMsg = 'Kuota API telah tercapai. Mohon tunggu beberapa saat.';
      else if (err.message?.includes('403')) errorMsg = 'Masalah otentikasi API. Hubungi admin.';
      setMessages(prev => [...prev, { role: 'model', text: `❌ **Error**: ${errorMsg}`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {isOffline && (
        <div className="bg-amber-500 text-white text-[10px] font-bold py-1 px-4 text-center z-[60] flex items-center justify-center gap-2">
          <span className="material-symbols-rounded text-sm">wifi_off</span>
          MODE OFFLINE - BEBERAPA FITUR MUNGKIN TIDAK TERSEDIA
        </div>
      )}

      <header className="px-6 pt-4 pb-2 flex justify-between items-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-30 border-b border-gray-50 dark:border-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <span className="material-symbols-rounded">school</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">GuruMate</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <span className="material-symbols-rounded">{darkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => setShowHelp(true)} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <span className="material-symbols-rounded">help_outline</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full overflow-y-auto pb-32 scroll-hide ${view !== 'chat' ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-950'}`}>
          <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
            {view === 'chat' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <StatsCard title="Jadwal" value={state.schedules.length} icon="calendar_month" color="border-blue-500" />
                  <StatsCard title="Reminder" value={state.reminders.length} icon="notifications" color="border-red-500" />
                </div>
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`max-w-[90%] md:max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800 rounded-tl-none'
                    }`}>
                      <div className="prose-custom text-sm font-medium">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.text}
                        </ReactMarkdown>
                      </div>
                      <p className="text-[10px] mt-2 opacity-60 text-right">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-1.5 p-2 items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-800 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            {view === 'dashboard' && <DataView state={state} />}
            {view === 'contacts' && <ContactView contacts={state.contacts} onSync={handleSyncContacts} />}
          </div>
        </div>

        {view === 'chat' && (
          <div className="absolute bottom-6 left-0 right-0 px-4 z-40">
            <div className="max-w-4xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-2 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-none">
              {filePreview && (
                <div className="px-3 pb-3 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 mb-2">
                  <div className="relative">
                    <img src={filePreview} className="w-14 h-14 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                    <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md">
                      <span className="material-symbols-rounded text-[12px]">close</span>
                    </button>
                  </div>
                  <p className="text-xs font-bold text-gray-400 truncate max-w-[150px]">{selectedFile?.name}</p>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-1 md:gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f) { setSelectedFile(f); const r = new FileReader(); r.onload = () => setFilePreview(r.result as string); r.readAsDataURL(f); }
                }} />
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-colors shrink-0">
                  <span className="material-symbols-rounded text-2xl">attach_file</span>
                </button>

                <button type="button" onClick={toggleListening} className={`p-3 rounded-2xl transition-all shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
                  <span className="material-symbols-rounded text-2xl">{isListening ? 'mic' : 'mic_none'}</span>
                </button>

                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? "Mendengarkan..." : "Ketik instruksi..."} className="flex-1 bg-transparent py-3.5 px-2 outline-none text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder:text-gray-400" />

                <button type="submit" disabled={isLoading || (!input.trim() && !selectedFile)} className={`p-3.5 rounded-2xl shadow-lg active:scale-95 transition-all shrink-0 ${(!input.trim() && !selectedFile) ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}>
                  <span className="material-symbols-rounded text-2xl">send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <nav className="flex justify-around items-center bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 py-3 pb-8 shrink-0 z-50">
        {[
          { id: 'chat', label: 'Asisten', icon: 'chat_bubble' },
          { id: 'dashboard', label: 'Data', icon: 'table_chart' },
          { id: 'contacts', label: 'Kontak', icon: 'alternate_email' }
        ].map((item) => (
          <button key={item.id} onClick={() => setView(item.id as any)} className={`flex flex-col items-center gap-1.5 transition-all min-w-[70px] ${view === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
            <div className={`px-5 py-1.5 rounded-2xl transition-all ${view === item.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
              <span className={`material-symbols-rounded text-2xl ${view === item.id ? 'FILL-1' : ''}`}>{item.icon}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {showHelp && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <span className="material-symbols-rounded">auto_awesome</span>
                </div>
                <h2 className="text-xl font-black tracking-tight dark:text-white">Tips Perintah</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-rounded text-gray-400">close</span>
              </button>
            </div>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto scroll-hide">
              <p className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Contoh Format Pesan:</p>
              {[
                { i: 'mic', t: 'Suara', d: 'Gunakan suara untuk input cepat.' },
                { i: 'table_rows', t: 'Rekap Data', d: '"Buatkan tabel nilai matematika kelas 9A"' },
                { i: 'code', t: 'Formula', d: '"Tunjukkan kode python untuk menghitung rata-rata nilai"' },
                { i: 'description', t: 'Analisis', d: 'Unggah foto tabel nilai untuk dianalisis.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100/50 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                    <span className="material-symbols-rounded text-lg">{item.i}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">{item.t}</p>
                    <p className="text-xs text-gray-500 font-medium italic mt-0.5">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHelp(false)} className="w-full mt-8 bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all">Siap Menggunakan</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
