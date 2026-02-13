
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
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center">
            <span className="material-symbols-rounded mr-2 text-indigo-600 dark:text-indigo-400">contact_page</span> Kontak Orang Tua
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Daftar kontak WhatsApp orang tua siswa terdaftar.</p>
        </div>
        <button 
          onClick={onSync}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center"
        >
          <span className="material-symbols-rounded text-sm mr-2">sync</span> Sinkronisasi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length > 0 ? contacts.map((contact) => (
          <div key={contact.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{contact.studentName}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{contact.className}</p>
              </div>
              <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-1 rounded font-black flex items-center">
                <span className="material-symbols-rounded text-[12px] mr-1">person_book</span> SISWA
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="material-symbols-rounded text-gray-400 w-8 text-lg">person</span>
                <span className="font-medium">{contact.parentName}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="material-symbols-rounded text-gray-400 w-8 text-lg">smartphone</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{contact.phoneNumber}</span>
              </div>
            </div>

            <button 
              onClick={() => handleWhatsApp(contact.phoneNumber)}
              className="mt-5 w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-rounded text-sm">chat</span>
              <span>Hubungi Ortu</span>
            </button>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <span className="material-symbols-rounded text-4xl mb-4 text-gray-300 dark:text-gray-700">contact_support</span>
            <p className="text-gray-500 dark:text-gray-400 font-bold">Belum ada data kontak.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Klik Sinkronisasi untuk menarik data kontak.</p>
          </div>
        )}
      </div>
    </div>
  );
};
