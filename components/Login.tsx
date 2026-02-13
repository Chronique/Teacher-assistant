
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

// Gunakan URL Raw dari GitHub
const SCHOOL_LOGO_URL = "https://raw.githubusercontent.com/Chronique/SMPN21-JAMBI/main/public/icon.png";

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        name: 'Guru SMPN 21',
        email: 'guru.smpn21jambi@gmail.com',
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher&backgroundColor=b6e3f4'
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black p-8 justify-between animate-fade-in">
      <div className="mt-16 space-y-4">
        <div className="w-28 h-28 bg-white dark:bg-gray-900 rounded-3xl flex items-center justify-center p-4 shadow-xl shadow-indigo-100 dark:shadow-none mb-8 border border-gray-100 dark:border-gray-800 overflow-hidden">
          <img 
            src={SCHOOL_LOGO_URL} 
            alt="Logo SMPN 21" 
            className="w-full h-full object-contain animate-fade-in"
          />
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tighter">
          GuruMate<br/><span className="text-indigo-600">SMPN 21 Kota Jambi.</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[280px]">
          Asisten AI pintar untuk memudahkan administrasi dan kegiatan belajar mengajar.
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
              Masuk dengan Gmail
            </>
          )}
        </button>
        <div className="flex flex-col items-center gap-2 px-4">
          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Sinkronisasi Akun Google Aktif
          </p>
          <div className="flex gap-4">
            <img src="https://www.gstatic.com/images/branding/product/1x/tasks_2020q4_48dp.png" className="w-5 h-5 grayscale opacity-50" />
            <img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" className="w-5 h-5 grayscale opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};
