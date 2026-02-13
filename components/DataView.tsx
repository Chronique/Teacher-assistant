
import React from 'react';
import { AppState, BehaviorRecord } from '../types';

interface DataViewProps {
  state: AppState;
}

export const DataView: React.FC<DataViewProps> = ({ state }) => {
  const handleWhatsAppSend = (studentName: string, content: string) => {
    // Cari kontak siswa
    const contact = state.contacts.find(c => c.studentName.toLowerCase().includes(studentName.toLowerCase()));
    const phoneNumber = contact ? contact.phoneNumber : "";
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const message = `Halo Bapak/Ibu, saya Guru dari SMPN 21 Jambi. Ingin menginfokan rekap perkembangan siswa:\n\nSiswa: *${studentName}*\n\n${content}\n\nTerima kasih.`;
    
    const url = cleanNumber 
      ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`; // Fallback jika no telp tidak ada
      
    window.open(url, '_blank');
  };

  const getBehaviorColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20';
      case 'B': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20';
      case 'C': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20';
      case 'D': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. Jadwal Pelajaran */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center">
            <span className="material-symbols-rounded mr-2 text-indigo-600">calendar_month</span> Jadwal Mengajar
          </h3>
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

      {/* 2. Rekap Nilai Kelakuan (Sikap) */}
      <section>
        <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="material-symbols-rounded mr-2 text-amber-500">face</span> Rekap Nilai Kelakuan
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {state.behaviorRecords && state.behaviorRecords.length > 0 ? state.behaviorRecords.map((b) => (
            <div key={b.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">{b.studentName}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.date}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${getBehaviorColor(b.grade)}`}>
                  {b.grade}
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed bg-gray-50 dark:bg-black p-3 rounded-xl border border-gray-50 dark:border-gray-800">
                "{b.description}"
              </p>
              <button 
                onClick={() => handleWhatsAppSend(b.studentName, `Nilai Kelakuan: *${b.grade}*\nCatatan: _${b.description}_`)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-rounded text-sm">send</span>
                Kirim Laporan Ke Orang Tua
              </button>
            </div>
          )) : (
            <div className="p-10 text-center text-xs text-gray-400 italic bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
              Belum ada data nilai kelakuan. Unggah foto catatan wali kelas untuk mengisi otomatis.
            </div>
          )}
        </div>
      </section>

      {/* 3. Nilai Akademik */}
      <section>
        <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="material-symbols-rounded mr-2 text-indigo-500">school</span> Nilai Akademik
        </h3>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-64 overflow-y-auto scroll-hide">
            {state.grades.length > 0 ? state.grades.map((g) => (
              <div key={g.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{g.studentName}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{g.subject}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${g.score >= 75 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                    {g.score}
                  </span>
                  <button 
                    onClick={() => handleWhatsAppSend(g.studentName, `Nilai Mata Pelajaran *${g.subject}*: *${g.score}*`)}
                    className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-rounded text-sm">send</span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-xs text-gray-400 italic">Data nilai akademik kosong.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
