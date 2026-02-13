
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
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* 1. Jadwal Pelajaran */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
            <span className="material-symbols-rounded mr-2 text-indigo-600 dark:text-indigo-400">calendar_month</span> Jadwal Mengajar
          </h3>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">Update Real-time</span>
        </div>
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hari</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mapel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kelas</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {state.schedules.length > 0 ? state.schedules.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{s.day}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{s.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 font-semibold">{s.className}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400 italic">Belum ada jadwal yang tercatat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Nilai Siswa */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <span className="material-symbols-rounded mr-2 text-yellow-600 dark:text-yellow-400">workspace_premium</span> Nilai Siswa
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto scroll-hide">
              {state.grades.length > 0 ? state.grades.map((g) => (
                <li key={g.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between items-center transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{g.studentName}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-tight dark:text-gray-400">{g.subject}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${g.score >= 75 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                      {g.score}
                    </span>
                  </div>
                </li>
              )) : (
                <li className="px-5 py-8 text-center text-sm text-gray-400 italic">Belum ada data nilai.</li>
              )}
            </ul>
          </div>
        </section>

        {/* 3. Pengingat (Reminders) */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <span className="material-symbols-rounded mr-2 text-red-600 dark:text-red-400">notifications</span> Pengingat Tugas
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto scroll-hide">
              {state.reminders && state.reminders.length > 0 ? state.reminders.map((r) => (
                <li key={r.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{r.text}</p>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                        <span className="material-symbols-rounded text-xs mr-1">schedule</span> {r.date}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      r.priority === 'Tinggi' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      r.priority === 'Sedang' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {r.priority}
                    </span>
                  </div>
                </li>
              )) : (
                <li className="px-5 py-8 text-center text-sm text-gray-400 italic">Tidak ada pengingat aktif.</li>
              )}
            </ul>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 4. Kegiatan Siswa */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <span className="material-symbols-rounded mr-2 text-blue-600 dark:text-blue-400">edit_note</span> Catatan Harian Siswa
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto scroll-hide">
              {state.activities.length > 0 ? state.activities.map((a) => (
                <li key={a.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.studentName}</p>
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{a.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{a.description}</p>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                    a.category === 'Akademik' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                    a.category === 'Perilaku' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                  }`}>
                    {a.category}
                  </span>
                </li>
              )) : (
                <li className="px-5 py-8 text-center text-sm text-gray-400 italic">Belum ada catatan kegiatan.</li>
              )}
            </ul>
          </div>
        </section>

        {/* 5. Laporan Orang Tua */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <span className="material-symbols-rounded mr-2 text-green-600 dark:text-green-400">outgoing_mail</span> Laporan WhatsApp
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto scroll-hide">
              {state.parentReports && state.parentReports.length > 0 ? state.parentReports.map((p) => (
                <li key={p.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{p.studentName}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500 font-medium">No WA: {p.phoneNumber}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{p.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 italic">"{p.content}"</p>
                  <button 
                    onClick={() => handleWhatsAppSend(p.phoneNumber, p.content)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-rounded text-sm">send</span>
                    <span>Kirim via WhatsApp</span>
                  </button>
                </li>
              )) : (
                <li className="px-5 py-8 text-center text-sm text-gray-400 italic">Belum ada laporan yang dibuat.</li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
