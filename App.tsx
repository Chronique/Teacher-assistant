
import React, { useState, useRef, useEffect } from 'react';
import { AppState, ChatMessage, Schedule, StudentGrade, StudentActivity, Reminder, ParentReport, StudentContact } from './types';
import { chatWithGemini } from './services/geminiService';
import { DataView } from './components/DataView';
import { StatsCard } from './components/StatsCard';
import { ContactView } from './components/ContactView';

// Initial Mock Data
const INITIAL_STATE: AppState = {
  schedules: [
    { id: '1', day: 'Senin', subject: 'Matematika', time: '08:00 - 09:30', className: '9A' },
    { id: '2', day: 'Senin', subject: 'Fisika', time: '10:00 - 11:30', className: '9B' },
  ],
  grades: [
    { id: '1', studentName: 'Budi Santoso', subject: 'Matematika', score: 85 },
    { id: '2', studentName: 'Ani Wijaya', subject: 'Matematika', score: 72 },
  ],
  activities: [
    { id: '1', studentName: 'Budi Santoso', description: 'Aktif bertanya di kelas dan membantu teman yang kesulitan.', category: 'Akademik', date: '2023-10-25' },
    { id: '2', studentName: 'Rina Kurnia', description: 'Membantu merapikan perpustakaan sekolah setelah jam pulang.', category: 'Ekstrakurikuler', date: '2023-10-26' },
  ],
  reminders: [
    { id: '1', text: 'Kumpulkan nilai UTS 9A ke kurikulum', date: 'Besok, 09:00', priority: 'Tinggi' },
  ],
  parentReports: [
    { 
      id: 'demo-1', 
      studentName: 'Budi Santoso', 
      phoneNumber: '6285368452424', 
      content: 'Assalamu\'alaikum Bapak/Ibu orang tua Budi Santoso. Ingin melaporkan bahwa Budi sangat aktif di kelas hari ini. Semangat belajarnya luar biasa! 🌟', 
      date: '25/10/2023' 
    }
  ],
  contacts: [
    { id: 'c1', studentName: 'Budi Santoso', parentName: 'Bpk. Santoso', phoneNumber: '6285368452424', className: '9A' },
    { id: 'c2', studentName: 'Ani Wijaya', parentName: 'Ibu Wijaya', phoneNumber: '6281234567890', className: '9A' },
  ]
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Halo Pak/Bu Guru! Saya GuruMate. Saya bisa membantu atur jadwal, catat nilai, buat pengingat, atau mengelola kontak orang tua siswa. \n\nKetik `/kontak` untuk melihat daftar no WhatsApp orang tua.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'chat' | 'dashboard' | 'contacts'>('chat');
  const [showHelp, setShowHelp] = useState(false);
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSyncContacts = () => {
    // Simulated Sync
    const newContacts: StudentContact[] = [
      ...state.contacts,
      { id: Date.now().toString(), studentName: 'Rina Kurnia', parentName: 'Ibu Kurnia', phoneNumber: '628987654321', className: '9B' }
    ];
    setState(prev => ({ ...prev, contacts: newContacts }));
    alert('Kontak berhasil disinkronkan!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    // Handle Slash Commands Locally for faster UX
    const command = input.trim().toLowerCase();
    if (command.startsWith('/')) {
      if (command === '/list') {
        setShowHelp(true);
        setMessages(prev => [...prev, { role: 'user', text: input, timestamp: new Date() }]);
        setInput('');
        return;
      }
      if (command === '/nilai') {
        setView('dashboard');
        setInput('');
        return;
      }
      if (command === '/kontak') {
        setView('contacts');
        setInput('');
        return;
      }
      if (command === '/reset') {
        setMessages([{ role: 'model', text: 'Percakapan telah diatur ulang. Ada yang bisa saya bantu?', timestamp: new Date() }]);
        setInput('');
        return;
      }
    }

    const userMessage: ChatMessage = { role: 'user', text: input || (selectedFile ? `Mengirim file: ${selectedFile.name}` : ''), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    const currentFile = selectedFile;
    
    setInput('');
    removeFile();
    setIsLoading(true);

    try {
      let fileData = undefined;
      if (currentFile) {
        const base64 = await fileToBase64(currentFile);
        fileData = {
          mimeType: currentFile.type,
          data: base64
        };
      }

      const history = messages.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithGemini(currentInput || "Tolong analisis file ini", state, history, fileData);
      
      let botText = response.text || "Maaf, saya tidak mengerti instruksi tersebut.";
      
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          
          if (fc.name === 'addSchedule') {
            const newItem: Schedule = { id: Date.now().toString(), ...args };
            setState(prev => ({ ...prev, schedules: [...prev.schedules, newItem] }));
            botText += `\n\n✅ *Jadwal berhasil ditambahkan!*`;
          } else if (fc.name === 'addGrade') {
            const newItem: StudentGrade = { id: Date.now().toString(), ...args };
            setState(prev => ({ ...prev, grades: [...prev.grades, newItem] }));
            botText += `\n\n✅ *Nilai berhasil dicatat!*`;
          } else if (fc.name === 'addActivity') {
            const newItem: StudentActivity = { id: Date.now().toString(), ...args };
            setState(prev => ({ ...prev, activities: [...prev.activities, newItem] }));
            botText += `\n\n✅ *Kegiatan berhasil dirangkum!*`;
          } else if (fc.name === 'addReminder') {
            const newItem: Reminder = { id: Date.now().toString(), ...args };
            setState(prev => ({ ...prev, reminders: [...prev.reminders, newItem] }));
            botText += `\n\n🔔 *Pengingat ditambahkan:* ${args.text}`;
          } else if (fc.name === 'generateParentReport') {
            const newItem: ParentReport = { 
              id: Date.now().toString(), 
              studentName: args.studentName, 
              phoneNumber: args.phoneNumber,
              content: args.content, 
              date: new Date().toLocaleDateString('id-ID') 
            };
            setState(prev => ({ ...prev, parentReports: [...prev.parentReports, newItem] }));
            botText += `\n\n📩 *Laporan WhatsApp untuk ${args.studentName} telah draf-kan dan siap dikirim melalui Dashboard.*`;
          } else if (fc.name === 'syncContacts') {
            handleSyncContacts();
            botText += `\n\n🔄 *Sinkronisasi kontak berhasil dijalankan.*`;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: botText, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Maaf, terjadi kesalahan teknis. Silakan coba lagi nanti.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const commandList = [
    { icon: '📜', title: '/list', desc: 'Buka bantuan', example: '/list' },
    { icon: '📅', title: 'Jadwal', desc: 'Atur jam mengajar', example: 'Tambah jadwal IPA hari Selasa jam 10:00 kelas 9B' },
    { icon: '🏆', title: 'Nilai', desc: 'Input hasil ujian', example: 'Catat nilai Ani Wijaya untuk Matematika skor 95' },
    { icon: '📝', title: 'Kegiatan', desc: 'Rangkum catatan harian', example: 'Catat kegiatan: Budi aktif bertanya di kelas hari ini' },
    { icon: '🔔', title: 'Pengingat', desc: 'Catat tugas pribadi', example: 'Ingatkan saya koreksi tugas jam 3 sore' },
    { icon: '📇', title: '/kontak', desc: 'Nomor WhatsApp ortu', example: '/kontak' },
    { icon: '📎', title: 'Attachment', desc: 'Kirim file/gambar', example: 'Kirim foto tabel nilai untuk diinput' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-full bg-white overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-30 shrink-0 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg flex items-center justify-center text-white text-2xl transform hover:scale-105 transition-transform">
            🏫
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">GuruMate</h1>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span> Smart Assistant
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button 
              onClick={() => setView('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'chat' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('contacts')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'contacts' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kontak
            </button>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-sm ${showHelp ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-400 hover:text-indigo-600'}`}
          >
            ❓
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Persistent Command Sidebar */}
        <aside className={`bg-gray-50 border-r w-72 flex-col overflow-y-auto shrink-0 transition-all duration-300 hidden md:flex ${showHelp ? 'translate-x-0' : '-ml-72'}`}>
          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Pusat Perintah</h2>
              <p className="text-[11px] text-gray-500 font-medium mt-1">Gunakan teks atau klik di bawah</p>
            </div>
            
            <nav className="space-y-4">
              {commandList.map((cmd, i) => (
                <div key={i} className="group">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{cmd.icon}</span>
                    <h3 className="text-xs font-bold text-gray-700">{cmd.title}</h3>
                  </div>
                  <button 
                    onClick={() => setInput(cmd.example)}
                    className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
                  >
                    <p className="text-[10px] text-gray-400 font-medium uppercase mb-1">{cmd.desc}</p>
                    <p className="text-[11px] text-indigo-600 italic font-medium leading-tight">"{cmd.example}"</p>
                  </button>
                </div>
              ))}
            </nav>

            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Data Kontak 📱</p>
              <p className="text-xs font-medium leading-relaxed">
                Anda bisa menanyakan nomor WhatsApp orang tua secara langsung ke asisten!
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-white">
          {view === 'chat' ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-5xl mx-auto">
                <StatsCard title="Jadwal" value={state.schedules.length} icon="📅" color="border-blue-500" />
                <StatsCard title="Kontak" value={state.contacts.length} icon="📇" color="border-indigo-500" />
                <StatsCard title="Pengingat" value={state.reminders.length} icon="🔔" color="border-red-500" />
                <StatsCard title="Pesan WA" value={state.parentReports.length} icon="📩" color="border-green-500" />
              </div>

              <div className="space-y-4 max-w-4xl mx-auto pb-32">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed font-medium">{m.text}</p>
                      <p className={`text-[10px] mt-2 text-right font-medium ${m.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 italic">GuruMate sedang berpikir...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          ) : view === 'dashboard' ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-gray-50">
              <div className="max-w-5xl mx-auto">
                <header className="mb-8 border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 flex items-center">
                        Administrasi Kelas <span className="ml-2 text-indigo-600">🚀</span>
                      </h2>
                      <p className="text-gray-500 font-medium">Jadwal, nilai, dan laporan siswa.</p>
                    </div>
                  </div>
                </header>
                <DataView state={state} />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-gray-50">
              <div className="max-w-5xl mx-auto">
                <ContactView contacts={state.contacts} onSync={handleSyncContacts} />
              </div>
            </div>
          )}

          {/* Floating Input Bar */}
          <div className={`p-4 md:p-6 bg-white/90 backdrop-blur-md border-t absolute bottom-0 left-0 right-0 transition-all duration-300 z-20 ${view !== 'chat' ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
            <div className="max-w-4xl mx-auto">
              
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3 flex items-center animate-in slide-in-from-bottom-2">
                  <div className="relative group">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-indigo-200 shadow-md" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">FILE</span>
                      </div>
                    )}
                    <button 
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-600 shadow-sm"
                    >
                      ✕
                    </button>
                    <div className="absolute top-0 left-20 bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm min-w-[120px]">
                      <p className="text-[10px] font-bold text-gray-800 truncate max-w-[150px]">{selectedFile.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="relative flex items-center space-x-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-xl border-2 transition-all shrink-0 ${selectedFile ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-indigo-200 hover:text-indigo-500'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tanya asisten atau ketik perintah..."
                    className="w-full border-2 border-gray-200 rounded-2xl pl-5 pr-14 py-4 text-sm md:text-base focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && !selectedFile)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition shadow-lg active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
              
              <div className="mt-3 flex flex-wrap gap-2 justify-center lg:hidden">
                {['/list', '/nilai', '/kontak', '/reset'].map((cmd, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setInput(cmd); }}
                    className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-indigo-600 text-white">
              <h2 className="text-xl font-black">Bantuan</h2>
              <button onClick={() => setShowHelp(false)} className="text-white font-bold p-2">✕</button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {commandList.map((cmd, i) => (
                <button 
                  key={i} 
                  onClick={() => { setInput(cmd.example); setShowHelp(false); }}
                  className="w-full flex space-x-4 items-center p-4 bg-gray-50 rounded-2xl hover:bg-indigo-50 text-left border border-gray-100"
                >
                  <div className="text-2xl">{cmd.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-900">{cmd.title}</h3>
                    <p className="text-xs text-indigo-600 italic">"{cmd.example}"</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
