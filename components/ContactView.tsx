
import React from 'react';
import { StudentContact } from '../types';

interface ContactViewProps {
  contacts: StudentContact[];
  onSync: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ contacts, onSync }) => {
  const handleWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center">
            <span className="mr-2">📇</span> Kontak Orang Tua
          </h3>
          <p className="text-sm text-gray-500">Daftar kontak WhatsApp orang tua siswa terdaftar.</p>
        </div>
        <button 
          onClick={onSync}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center"
        >
          <span className="mr-2">🔄</span> Sinkronisasi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length > 0 ? contacts.map((contact) => (
          <div key={contact.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{contact.studentName}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{contact.className}</p>
              </div>
              <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded font-black">SISWA</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <span className="w-8 text-lg">👤</span>
                <span className="text-gray-600 font-medium">{contact.parentName}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-8 text-lg">📱</span>
                <span className="text-indigo-600 font-mono font-bold">{contact.phoneNumber}</span>
              </div>
            </div>

            <button 
              onClick={() => handleWhatsApp(contact.phoneNumber)}
              className="mt-5 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.513-2.961-2.628-.086-.115-.718-.954-.718-1.817 0-.863.454-1.287.614-1.46.16-.174.354-.218.472-.218s.235 0 .338.005c.106.005.247-.04.388.301.144.349.494 1.205.536 1.292.042.086.07.187.012.301-.058.115-.088.187-.174.288-.086.1-.183.224-.261.306-.086.092-.175.192-.077.361.098.169.435.719.935 1.165.641.571 1.181.748 1.35.833.169.086.267.072.367-.042.1-.115.424-.494.538-.662.115-.169.229-.141.388-.083.158.058 1.003.472 1.175.558.172.086.287.129.33.201.042.072.042.417-.101.821zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.179L2 22l4.954-1.302C8.384 21.503 10.12 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
              <span>Hubungi Ortu</span>
            </button>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <span className="text-4xl mb-4 block">📭</span>
            <p className="text-gray-500 font-bold">Belum ada data kontak.</p>
            <p className="text-xs text-gray-400">Klik Sinkronisasi untuk menarik data kontak.</p>
          </div>
        )}
      </div>
    </div>
  );
};
