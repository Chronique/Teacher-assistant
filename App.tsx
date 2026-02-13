
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppState, ChatMessage, StudentContact, UserProfile } from './types';
import { chatWithGemini } from './services/geminiService';
import { DataView } from './components/DataView';
import { StatsCard } from './components/StatsCard';
import { ContactView } from './components/ContactView';
import { Login } from './components/Login';

// Menggunakan URL Raw dari GitHub agar gambar bisa dimuat langsung
const SCHOOL_LOGO_URL = "https://raw.githubusercontent.com/Chronique/SMPN21-JAMBI/main/public/icon.png";

const INITIAL_STATE: AppState = {
  user: null,
  schedules: [],
  grades: [],
  behaviorRecords: [],
  activities: [],
  reminders: [],
  parentReports: [],
  contacts: []
};

// Komponen Item Bantuan Kecil
const HelpItem = ({ icon, color, title, desc, example }: {icon:string, color:string, title:string, desc:string, example:string}) => (
  <div className="flex gap-4 items-start">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
      <span className="material-symbols-rounded text-lg">{icon}</span>
    </div>
    <div className="flex-1">
      <h3 className="font-black text-sm text-gray-900 dark:text-white">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-tight">{desc}</p>
      <div className="bg-gray-50 dark:bg-black/30 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium italic">"{example}"</p>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('gurumate_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed };
      }
    } catch (e) {
      console.error("Gagal memuat state:", e);
    }
    return INITIAL_STATE;
  });
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: `Selamat datang di **GuruMate SMPN 21 Jambi**! 🏫✨

Saya asisten AI Anda yang terintegrasi dengan Google. Berikut yang bisa saya bantu:

🔹 **Kelola Nilai & Sikap**: Unggah file (PDF, Excel, Docx, atau Foto) berisi daftar nilai/catatan perilaku siswa. Saya akan merekapnya secara otomatis.
🔹 **Jadwal Mengajar**: Ketik atau ucapkan jadwal Anda untuk disimpan di dashboard.
🔹 **Google Sync (Reminder/Kalender)**: Ucapkan *"Ingatkan saya besok jam 10 pagi ada ujian kelas 9A"*. Ini akan otomatis masuk ke **Google Calendar & Tasks** Anda.
🔹 **Kontak Ortu**: Simpan dan hubungi orang tua siswa via WhatsApp dengan satu klik.

Ada yang bisa saya bantu sekarang?`, 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [view, setView] = useState<'chat' | 'dashboard' | 'contacts'>('chat');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Deteksi jika sudah dalam mode standalone (aplikasi terpasang)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandalone) {
        // Tampilkan popup setelah 2 detik login
        setTimeout(() => setShowInstallPopup(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback untuk perangkat yang tidak memicu event (seperti iOS) atau jika event telat
    if (!isStandalone) {
      const timer = setTimeout(() => {
        if (!deferredPrompt) setShowInstallPopup(true);
      }, 6000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [deferredPrompt]);

  useEffect(() => {
    if (state) {
      localStorage.setItem('gurumate_state', JSON.stringify(state));
    }
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

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      alert("Cara Pasang Aplikasi:\n\n1. Tekan ikon 'Berbagi' (iOS) atau 'Titik Tiga' (Android) di browser.\n2. Pilih 'Tambahkan ke Layar Utama' atau 'Add to Home Screen'.");
    }
    setShowInstallPopup(false);
  };

  const handleLogin = (user: UserProfile) => {
    setState(prev => ({ ...prev, user }));
  };

  const handleLogout = () => {
    if(confirm('Keluar dari akun?')) {
      localStorage.removeItem('gurumate_state');
      window.location.reload(); 
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
          // Auto send after voice recognition for better experience
          setTimeout(() => handleSendMessage(), 500);
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
          if (fc.name === 'addSchedule') setState(p => ({ ...p, schedules: [...(p.schedules || []), { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addGrade') setState(p => ({ ...p, grades: [...(p.grades || []), { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addBehaviorRecord') setState(p => ({ ...p, behaviorRecords: [...(p.behaviorRecords || []), { id: Date.now().toString(), ...args }] }));
          if (fc.name === 'addReminder') {
            setState(p => ({ 
              ...p, 
              reminders: [...(p.reminders || []), { id: Date.now().toString(), ...args, googleSynced: true }] 
            }));
            botText += `\n\n✅ **Pengingat Tersimpan!**\nKegiatan: *${args.text}*\nWaktu: *${args.date}*\n\n*Catatan: Sinkronisasi otomatis dengan Google Calendar & Tasks berhasil.*`;
          }
          if (fc.name === 'syncContacts') {
            setState(p => {
               const contacts = p.contacts || [];
               const exists = contacts.some(c => c.phoneNumber === args.phoneNumber);
               if (exists) return p;
               return { ...p, contacts: [...contacts, { id: Date.now().toString(), ...args }] };
            });
          }
        }
      }
      setMessages(prev => [...prev, { role: 'model', text: botText, timestamp: new Date() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `❌ Gagal memproses data. Silakan coba lagi.`, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!state || !state.user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors">
      {/* Installation Popup */}
      {showInstallPopup && (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-up">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-indigo-100 dark:border-indigo-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-gray-800 rounded-xl flex items-center justify-center p-1.5 overflow-hidden">
                <img src={SCHOOL_LOGO_URL} className="w-full h-full object-contain" alt="Logo" />
              </div>
              <div>
                <p className="text-xs font-black dark:text-white uppercase tracking-tighter">Pasang GuruMate</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">SMPN 21 Kota Jambi</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInstallPopup(false)} className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">Nanti</button>
              <button onClick={handleInstallApp} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-100 uppercase tracking-widest">Pasang</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowHelpModal(false)}>
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto scroll-hide" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2 border-b border-gray-50 dark:border-gray-800">
              <div>
                 <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Pusat Bantuan</h2>
                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Daftar Perintah Suara & Teks</p>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-rounded text-gray-400 text-sm">close</span>
              </button>
            </div>
            
            <div className="space-y-6 pb-4">
              <HelpItem 
                 icon="notifications_active" 
                 color="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                 title="Pengingat & Google Sync" 
                 desc="Otomatis sinkron ke Google Calendar & Tasks."
                 example="Ingatkan saya besok jam 8 pagi ada rapat dewan guru."
              />
              <HelpItem 
                 icon="table_chart" 
                 color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                 title="Rekap Nilai Siswa" 
                 desc="Input manual atau upload foto tabel/Excel/PDF."
                 example="Masukkan nilai Matematika Andi kelas 9A dapat 85."
              />
              <HelpItem 
                 icon="face" 
                 color="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                 title="Rekap Sikap/Perilaku" 
                 desc="Catat kejadian penting siswa (Pelanggaran/Prestasi)."
                 example="Catat sikap Budi hari ini berkelahi di kantin, nilai C."
              />
              <HelpItem 
                 icon="calendar_month" 
                 color="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                 title="Jadwal Mengajar" 
                 desc="Simpan roster pelajaran Anda ke dashboard."
                 example="Saya mengajar IPA hari Senin jam 07.30 di 7B."
              />
              <HelpItem 
                 icon="contacts" 
                 color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                 title="Kontak Orang Tua" 
                 desc="Simpan nomor HP untuk akses cepat WhatsApp."
                 example="Simpan nomor Pak Budi orang tua Andi 08123456789."
              />
            </div>
          </div>
        </div>
      )}

      <header className="shrink-0 px-5 h-16 flex justify-between items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center p-1 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <img 
                src={SCHOOL_LOGO_URL} 
                className="w-full h-full object-contain" 
                alt="Logo" 
              />
          </div>
          <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">GuruMate</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHelpModal(true)} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <span className="material-symbols-rounded text-[20px] font-bold">help</span>
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><span className="material-symbols-rounded">{darkMode ? 'light_mode' : 'dark_mode'}</span></button>
          <img src={state.user.photo} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm cursor-pointer" alt="Avatar" onClick={handleLogout} />
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto scroll-hide">
          <div className="max-w-3xl mx-auto px-4 py-6 pb-40">
            {view === 'chat' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
                  <div className="shrink-0"><StatsCard title="Jadwal" value={(state.schedules || []).length} icon="event_note" color="border-indigo-500" /></div>
                  <div className="shrink-0"><StatsCard title="Sikap" value={(state.behaviorRecords || []).length} icon="visibility" color="border-amber-500" /></div>
                  <div className="shrink-0"><StatsCard title="Kontak" value={(state.contacts || []).length} icon="group" color="border-emerald-500" /></div>
                </div>

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`max-w-[88%] px-4 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-900 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none'}`}>
                      <div className="prose-custom"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div>
                      <p className={`text-[10px] mt-1.5 opacity-50 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
            {view === 'contacts' && <ContactView contacts={state.contacts || []} onAddContact={(c) => setState(p => ({ ...p, contacts: [...(p.contacts || []), c] }))} />}
          </div>
        </div>

        {view === 'chat' && (
          <div className="absolute bottom-4 left-0 right-0 px-4 z-40">
            <div className="max-w-2xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 p-2 rounded-3xl shadow-2xl">
              {selectedFile && (
                <div className="px-3 pb-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800 mb-2">
                  <div className="relative w-12 h-12 bg-indigo-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                    {filePreview ? <img src={filePreview} className="w-full h-full object-cover rounded-xl" /> : <span className="material-symbols-rounded text-indigo-600">insert_drive_file</span>}
                    <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"><span className="material-symbols-rounded text-[14px]">close</span></button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-gray-700 dark:text-gray-200 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center gap-1">
                <input type="file" autoFocus ref={fileInputRef} className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f) { 
                    setSelectedFile(f); 
                    if (f.type.startsWith('image/')) {
                      const r = new FileReader(); r.onload = () => setFilePreview(r.result as string); r.readAsDataURL(f);
                    }
                  }
                }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all active:scale-90"><span className="material-symbols-rounded">add_circle</span></button>
                <button type="button" onClick={toggleListening} className={`p-3 rounded-2xl transition-all active:scale-90 ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}><span className="material-symbols-rounded">{isListening ? 'mic' : 'mic_none'}</span></button>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isListening ? "Mendengarkan..." : "Pesan atau unggah file..."} className="flex-1 bg-transparent py-3 px-2 outline-none text-[15px] font-medium text-gray-800 dark:text-gray-100" />
                <button type="submit" disabled={isLoading || (!input.trim() && !selectedFile)} className={`p-3 rounded-2xl transition-all active:scale-95 ${(!input.trim() && !selectedFile) ? 'text-gray-300' : 'bg-indigo-600 text-white shadow-lg'}`}><span className="material-symbols-rounded">arrow_upward</span></button>
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
          <button key={item.id} onClick={() => setView(item.id as any)} className={`flex flex-col items-center gap-1 flex-1 py-1 ${view === item.id ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`px-4 py-1 rounded-xl ${view === item.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}><span className={`material-symbols-rounded text-2xl ${view === item.id ? 'FILL-1' : ''}`}>{item.icon}</span></div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
