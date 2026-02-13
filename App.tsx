
import React, { useState, useRef, useEffect } from 'react';
import { AppState, ChatMessage, Schedule, StudentGrade, StudentActivity } from './types';
import { chatWithGemini } from './services/geminiService';
import { DataView } from './components/DataView';
import { StatsCard } from './components/StatsCard';

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
    { id: '1', studentName: 'Budi Santoso', description: 'Aktif bertanya di kelas', category: 'Akademik', date: '2023-10-25' },
    { id: '2', studentName: 'Rina Kurnia', description: 'Membantu merapikan perpustakaan', category: 'Ekstrakurikuler', date: '2023-10-26' },
  ],
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Halo Pak/Bu Guru! Saya GuruMate. Apa yang bisa saya bantu hari ini? Anda bisa meminta saya mencatat jadwal, nilai, atau laporan siswa.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'chat' | 'dashboard'>('chat');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for Gemini
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await chatWithGemini(input, state, history);
      
      let botText = response.text || "Maaf, saya tidak mengerti.";
      
      // Handle Function Calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          
          if (fc.name === 'addSchedule') {
            const newSchedule: Schedule = {
              id: Date.now().toString(),
              day: args.day,
              subject: args.subject,
              time: args.time,
              className: args.className
            };
            setState(prev => ({ ...prev, schedules: [...prev.schedules, newSchedule] }));
            botText += `\n\n✅ *Jadwal berhasil ditambahkan!*`;
          } else if (fc.name === 'addGrade') {
            const newGrade: StudentGrade = {
              id: Date.now().toString(),
              studentName: args.studentName,
              subject: args.subject,
              score: args.score
            };
            setState(prev => ({ ...prev, grades: [...prev.grades, newGrade] }));
            botText += `\n\n✅ *Nilai berhasil dicatat!*`;
          } else if (fc.name === 'addActivity') {
            const newActivity: StudentActivity = {
              id: Date.now().toString(),
              studentName: args.studentName,
              description: args.description,
              category: args.category,
              date: args.date
            };
            setState(prev => ({ ...prev, activities: [...prev.activities, newActivity] }));
            botText += `\n\n✅ *Kegiatan berhasil dirangkum!*`;
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

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-gray-50 border-x">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl">
            🎓
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">GuruMate</h1>
            <p className="text-xs text-green-500 font-medium flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> AI Assistant Online
            </p>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setView('chat')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'chat' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Obrolan
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Data Master
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {view === 'chat' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {/* Quick Stats Summary for Teacher */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatsCard title="Total Jadwal" value={state.schedules.length} icon="📅" color="border-indigo-500" />
              <StatsCard title="Siswa Dinilai" value={state.grades.length} icon="⭐" color="border-yellow-500" />
              <StatsCard title="Laporan Baru" value={state.activities.length} icon="✍️" color="border-green-500" />
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <p className={`text-[10px] mt-1 text-right opacity-60`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-400">GuruMate sedang berpikir...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <DataView state={state} />
          </div>
        )}

        {/* Input Bar (Only visible in chat view, or always visible) */}
        <div className={`p-4 bg-white border-t transition-opacity duration-300 ${view === 'dashboard' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <form onSubmit={handleSendMessage} className="flex space-x-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik instruksi (cth: 'Tambah jadwal Senin jam 8 Matematika kelas 9A')"
              className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
          <div className="max-w-4xl mx-auto mt-2 flex flex-wrap gap-2">
            <button 
              onClick={() => { setInput("Tampilkan jadwal saya hari ini"); }}
              className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition"
            >
              📅 Cek Jadwal
            </button>
            <button 
              onClick={() => { setInput("Input nilai Budi di Matematika: 90"); }}
              className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition"
            >
              ⭐ Input Nilai
            </button>
            <button 
              onClick={() => { setInput("Catat: Rina terlambat masuk kelas hari ini"); }}
              className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition"
            >
              📝 Catat Kegiatan
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
