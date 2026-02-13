
import React, { useState } from 'react';
import { StudentContact } from '../types';

interface ContactViewProps {
  contacts: StudentContact[];
  onAddContact: (contact: StudentContact) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ contacts, onAddContact }) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    phoneNumber: '',
    className: ''
  });

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleSync = async () => {
    const props = ['name', 'tel'];
    const opts = { multiple: true };

    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const contactsPicker = await (navigator as any).contacts.select(props, opts);
        if (contactsPicker.length > 0) {
          contactsPicker.forEach((c: any) => {
            const newContact: StudentContact = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              studentName: c.name?.[0] || 'Siswa Baru',
              parentName: c.name?.[0] || 'Orang Tua',
              phoneNumber: c.tel?.[0] || '',
              className: '-'
            };
            onAddContact(newContact);
          });
          alert(`${contactsPicker.length} kontak berhasil diimpor.`);
        }
      } catch (err) {
        console.error('Contact Picker Error:', err);
        alert('Gagal mengakses kontak. Pastikan Anda memberikan izin atau gunakan fitur Impor Manual.');
      }
    } else {
      alert('Browser Anda tidak mendukung fitur akses kontak otomatis. Silakan gunakan tombol "Impor Manual".');
    }
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.phoneNumber) return;

    const newContact: StudentContact = {
      id: Date.now().toString(),
      ...formData
    };

    onAddContact(newContact);
    setFormData({ studentName: '', parentName: '', phoneNumber: '', className: '' });
    setShowManualModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center">
            <span className="material-symbols-rounded mr-2 text-indigo-600 dark:text-indigo-400">contact_page</span> Manajemen Kontak
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola daftar kontak WhatsApp orang tua siswa.</p>
        </div>
        
        <div className="flex gap-2 w-full">
          <button 
            onClick={handleSync}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-3 rounded-2xl text-[11px] font-black shadow-md transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider"
          >
            <span className="material-symbols-rounded text-sm mr-2">sync</span> Sync HP
          </button>
          <button 
            onClick={() => setShowManualModal(true)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-3 rounded-2xl text-[11px] font-black shadow-md transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider"
          >
            <span className="material-symbols-rounded text-sm mr-2">add</span> Manual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.length > 0 ? contacts.map((contact) => (
          <div key={contact.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{contact.studentName}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{contact.className || 'Kelas Belum Diatur'}</p>
              </div>
              <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-1 rounded font-black flex items-center uppercase tracking-tighter">
                <span className="material-symbols-rounded text-[12px] mr-1">person</span> SISWA
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="material-symbols-rounded text-gray-400 w-8 text-lg">person_edit</span>
                <span className="font-medium text-xs">{contact.parentName || '-'} (Ortu)</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="material-symbols-rounded text-gray-400 w-8 text-lg">smartphone</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">{contact.phoneNumber}</span>
              </div>
            </div>

            <button 
              onClick={() => handleWhatsApp(contact.phoneNumber)}
              className="mt-5 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-rounded text-sm">chat</span>
              <span>Hubungi Sekarang</span>
            </button>
          </div>
        )) : (
          <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-rounded text-2xl text-gray-300 dark:text-gray-700">contacts</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">Belum Ada Kontak</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px] mx-auto">Gunakan fitur Sync HP atau Tambah Manual untuk mulai mengisi data.</p>
          </div>
        )}
      </div>

      {/* Manual Import Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black dark:text-white uppercase tracking-tight">Tambah Kontak Manual</h2>
              <button onClick={() => setShowManualModal(false)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                <span className="material-symbols-rounded text-gray-400 text-sm">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nama Siswa</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={formData.studentName} 
                  onChange={e => setFormData({...formData, studentName: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-bold dark:text-white outline-indigo-600"
                  placeholder="Contoh: Andi Wijaya"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nama Orang Tua</label>
                <input 
                  type="text" 
                  value={formData.parentName} 
                  onChange={e => setFormData({...formData, parentName: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-bold dark:text-white outline-indigo-600"
                  placeholder="Contoh: Pak Budi"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">No WhatsApp</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-bold dark:text-white outline-indigo-600"
                    placeholder="628..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Kelas</label>
                  <input 
                    type="text" 
                    value={formData.className} 
                    onChange={e => setFormData({...formData, className: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-bold dark:text-white outline-indigo-600"
                    placeholder="9A"
                  />
                </div>
              </div>
              <button type="submit" className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all">
                Simpan Kontak
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
