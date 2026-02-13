
import React from 'react';
import { AppState } from '../types';

interface DataViewProps {
  state: AppState;
}

export const DataView: React.FC<DataViewProps> = ({ state }) => {
  const handleWhatsAppSend = (phoneNumber: string, content: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(content)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Jadwal Pelajaran - Mobile Card Style */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center">
            <span className="material-symbols-rounded mr-2 text-indigo-600">calendar_month</span> Jadwal Mengajar
          </h3>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">LIVE</span>
        </div>
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 scroll-hide">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Hari</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Mapel</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Jam</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Kelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {state.schedules.length > 0 ? state.schedules.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-100">{s.day}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">{s.subject}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{s.time}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-indigo-600 font-black">{s.className}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-400 italic">Belum ada jadwal.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {/* 2. Nilai Siswa - Compact List */}
        <section>
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="material-symbols-rounded mr-2 text-amber-500">star</span> Nilai Siswa
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto scroll-hide">
              {state.grades.length > 0 ? state.grades.map((g) => (
                <div key={g.id} className="p-4 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{g.studentName}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{g.subject}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${g.score >= 75 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                    {g.score}
                  </span>
                </div>
              )) : (
                <div className="p-6 text-center text-xs text-gray-400 italic">Data nilai kosong.</div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Laporan WhatsApp - Action Cards */}
        <section>
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="material-symbols-rounded mr-2 text-emerald-500">whatsapp</span> Draf Laporan
          </h3>
          <div className="space-y-3">
            {state.parentReports && state.parentReports.length > 0 ? state.parentReports.map((p) => (
              <div key={p.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{p.studentName}</p>
                  <span className="text-[10px] font-bold text-gray-400">{p.date}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 italic leading-relaxed bg-gray-50 dark:bg-black p-2 rounded-xl">"{p.content}"</p>
                <button 
                  onClick={() => handleWhatsAppSend(p.phoneNumber, p.content)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <span className="material-symbols-rounded text-sm">send</span>
                  Kirim Sekarang
                </button>
              </div>
            )) : (
              <div className="p-6 text-center text-xs text-gray-400 italic bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                Belum ada draf laporan.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
