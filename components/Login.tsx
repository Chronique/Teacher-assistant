
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    // Simulasi proses OAuth Google Gmail
    setTimeout(() => {
      onLogin({
        name: 'Bapak Guru Indonesia',
        email: 'guru.profesional@gmail.com', // Contoh email Gmail
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher&backgroundColor=b6e3f4'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black p-8 justify-between animate-fade-in">
      <div className="mt-20 space-y-4">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none mb-8">
          <span className="material-symbols-rounded text-4xl">school</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tighter">
          Asisten Kelas<br/><span className="text-indigo-600">Berbasis Gmail.</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[280px]">
          Kelola nilai dan jadwal yang tersinkron otomatis dengan Google Tasks Anda.
        </p>
      </div>

      <div className="space-y-4 mb-10">
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 py-4 rounded-3xl flex items-center justify-center gap-3 font-black text-gray-700 dark:text-gray-200 shadow-sm active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
              Masuk dengan Google (Gmail)
            </>
          )}
        </button>
        <div className="flex flex-col items-center gap-2 px-4">
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Sinkronisasi Aktif:
          </p>
          <div className="flex gap-4">
            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="w-5 h-5 grayscale opacity-50" title="Google Calendar" />
            <img src="https://www.gstatic.com/images/branding/product/1x/keep_2020q4_48dp.png" className="w-5 h-5 grayscale opacity-50" title="Google Keep" />
            <img src="https://www.gstatic.com/images/branding/product/1x/tasks_2020q4_48dp.png" className="w-5 h-5 grayscale opacity-50" title="Google Tasks" />
          </div>
        </div>
      </div>
    </div>
  );
};
