
import React from 'react';
import { AppState } from '../types';

interface DataViewProps {
  state: AppState;
}

export const DataView: React.FC<DataViewProps> = ({ state }) => {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">📅</span> Jadwal Mengajar
        </h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
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
                <tr key={s.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.day}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.className}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-400 italic">Belum ada jadwal.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">🏆</span> Nilai Siswa
          </h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {state.grades.length > 0 ? state.grades.map((g) => (
                <li key={g.id} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{g.studentName}</p>
                    <p className="text-xs text-gray-500">{g.subject}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${g.score >= 75 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    {g.score}
                  </span>
                </li>
              )) : (
                <li className="px-4 py-3 text-center text-sm text-gray-400 italic">Belum ada nilai.</li>
              )}
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="mr-2">📝</span> Kegiatan Siswa
          </h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {state.activities.length > 0 ? state.activities.map((a) => (
                <li key={a.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-gray-800">{a.studentName}</p>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{a.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">{a.description}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${
                    a.category === 'Akademik' ? 'bg-blue-100 text-blue-800' : 
                    a.category === 'Perilaku' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {a.category}
                  </span>
                </li>
              )) : (
                <li className="px-4 py-3 text-center text-sm text-gray-400 italic">Belum ada catatan.</li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
