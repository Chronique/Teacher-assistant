
import React from 'react';
import { AppState } from '../types';

interface DataViewProps {
  state: AppState;
}

export const DataView: React.FC<DataViewProps> = ({ state }) => {
  const handleWhatsAppSend = (phoneNumber: string, content: string) => {
    // Clean phone number: remove non-numeric
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(content)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* 1. Jadwal Pelajaran */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <span className="mr-2">📅</span> Jadwal Mengajar
          </h3>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Update Real-time</span>
        </div>
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hari</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.schedules.length > 0 ? state.schedules.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.day}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold">{s.className}</td>
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
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🏆</span> Nilai Siswa
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {state.grades.length > 0 ? state.grades.map((g) => (
                <li key={g.id} className="px-5 py-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.studentName}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-tight">{g.subject}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${g.score >= 75 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
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
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🔔</span> Pengingat Tugas
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {state.reminders && state.reminders.length > 0 ? state.reminders.map((r) => (
                <li key={r.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{r.text}</p>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center">
                        <span className="mr-1">🕒</span> {r.date}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      r.priority === 'Tinggi' ? 'bg-red-100 text-red-700' : 
                      r.priority === 'Sedang' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
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
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📝</span> Catatan Harian Siswa
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {state.activities.length > 0 ? state.activities.map((a) => (
                <li key={a.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold text-gray-800">{a.studentName}</p>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{a.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{a.description}</p>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                    a.category === 'Akademik' ? 'bg-blue-100 text-blue-700' : 
                    a.category === 'Perilaku' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
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

        {/* 5. Laporan Orang Tua - Integrated with WhatsApp */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📩</span> Laporan & Pesan WhatsApp
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {state.parentReports && state.parentReports.length > 0 ? state.parentReports.map((p) => (
                <li key={p.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-indigo-700">{p.studentName}</p>
                      <p className="text-[10px] text-gray-500 font-medium">No WA: {p.phoneNumber}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{p.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded border border-gray-100 italic">"{p.content}"</p>
                  <button 
                    onClick={() => handleWhatsAppSend(p.phoneNumber, p.content)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.513-2.961-2.628-.086-.115-.718-.954-.718-1.817 0-.863.454-1.287.614-1.46.16-.174.354-.218.472-.218s.235 0 .338.005c.106.005.247-.04.388.301.144.349.494 1.205.536 1.292.042.086.07.187.012.301-.058.115-.088.187-.174.288-.086.1-.183.224-.261.306-.086.092-.175.192-.077.361.098.169.435.719.935 1.165.641.571 1.181.748 1.35.833.169.086.267.072.367-.042.1-.115.424-.494.538-.662.115-.169.229-.141.388-.083.158.058 1.003.472 1.175.558.172.086.287.129.33.201.042.072.042.417-.101.821zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.179L2 22l4.954-1.302C8.384 21.503 10.12 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                    </svg>
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
