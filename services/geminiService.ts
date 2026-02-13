
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AppState } from "../types";

// Pastikan window.process.env ada sebelum diakses
const getApiKey = () => {
  if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
    return (window as any).process.env.API_KEY;
  }
  return process.env.API_KEY || "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

const addScheduleFn: FunctionDeclaration = {
  name: 'addSchedule',
  description: 'Menambahkan jadwal mata pelajaran baru.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING, description: 'Hari (contoh: Senin, Selasa)' },
      subject: { type: Type.STRING, description: 'Nama mata pelajaran' },
      time: { type: Type.STRING, description: 'Waktu (contoh: 08:00 - 09:30)' },
      className: { type: Type.STRING, description: 'Nama kelas' },
    },
    required: ['day', 'subject', 'time', 'className'],
  },
};

const addGradeFn: FunctionDeclaration = {
  name: 'addGrade',
  description: 'Menambahkan nilai siswa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: 'Nama lengkap siswa' },
      subject: { type: Type.STRING, description: 'Mata pelajaran' },
      score: { type: Type.NUMBER, description: 'Nilai angka' },
    },
    required: ['studentName', 'subject', 'score'],
  },
};

const addActivityFn: FunctionDeclaration = {
  name: 'addActivity',
  description: 'Mencatat rangkuman kegiatan atau perilaku siswa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: 'Nama lengkap siswa' },
      description: { type: Type.STRING, description: 'Deskripsi kegiatan/perilaku' },
      category: { 
        type: Type.STRING, 
        description: 'Kategori kegiatan',
        enum: ['Akademik', 'Perilaku', 'Ekstrakurikuler'] 
      },
      date: { type: Type.STRING, description: 'Tanggal (YYYY-MM-DD)' },
    },
    required: ['studentName', 'description', 'category', 'date'],
  },
};

const addReminderFn: FunctionDeclaration = {
  name: 'addReminder',
  description: 'Menambahkan pengingat untuk tugas atau kegiatan guru.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: 'Isi pengingat' },
      date: { type: Type.STRING, description: 'Tanggal atau waktu pengingat' },
      priority: { 
        type: Type.STRING, 
        description: 'Tingkat kepentingan',
        enum: ['Rendah', 'Sedang', 'Tinggi']
      },
    },
    required: ['text', 'date', 'priority'],
  },
};

const generateParentReportFn: FunctionDeclaration = {
  name: 'generateParentReport',
  description: 'Membuat draf laporan perkembangan siswa untuk dikirim ke orang tua via WhatsApp.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: 'Nama siswa' },
      phoneNumber: { type: Type.STRING, description: 'Nomor WhatsApp orang tua' },
      content: { type: Type.STRING, description: 'Isi pesan WhatsApp yang lengkap dan sopan' },
    },
    required: ['studentName', 'phoneNumber', 'content'],
  },
};

const syncContactsFn: FunctionDeclaration = {
  name: 'syncContacts',
  description: 'Sinkronisasi data kontak orang tua dari daftar siswa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      className: { type: Type.STRING, description: 'Nama kelas untuk disinkronkan' },
    },
  },
};

export const chatWithGemini = async (
  prompt: string, 
  currentState: AppState,
  history: { role: string; parts: any[] }[] = [],
  fileData?: { mimeType: string; data: string }
) => {
  if (!apiKey) {
    throw new Error("API Key tidak ditemukan. Pastikan sudah diatur di environment variable.");
  }
  
  try {
    const userParts: any[] = [{ text: prompt }];
    if (fileData) {
      userParts.push({
        inlineData: fileData
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: userParts }],
      config: {
        systemInstruction: `Anda adalah GuruMate, asisten pribadi multimodal untuk guru di Indonesia. 
        Tugas Anda membantu mengelola administrasi kelas.
        
        KEMAMPUAN KHUSUS:
        1. Anda bisa menerima unggahan file (gambar tabel nilai, foto jadwal, atau dokumen tugas). 
        2. Anda dapat mengelola daftar kontak orang tua siswa.
        
        FITUR UTAMA:
        - Jadwal Pelajaran (Tambah & Cek)
        - Nilai Siswa (Input & Rekap)
        - Rangkuman Kegiatan Siswa
        - Pengingat/Reminder
        - Laporan WhatsApp untuk Orang Tua
        - Manajemen Kontak Orang Tua
        
        SLASH COMMANDS:
        - /list: Menampilkan daftar kemampuan.
        - /jadwal: Ringkasan jadwal.
        - /nilai: Ringkasan nilai.
        - /kontak: Buka tab kontak orang tua.
        
        Data saat ini:
        ${JSON.stringify(currentState)}
        
        Jika user menanyakan nomor WhatsApp, gunakan data dari 'contacts' jika ada. Jika tidak ada, gunakan default: 6285368452424.
        
        Berikan jawaban yang ramah, profesional, dan gunakan bahasa Indonesia yang baik.`,
        tools: [{ functionDeclarations: [addScheduleFn, addGradeFn, addActivityFn, addReminderFn, generateParentReportFn, syncContactsFn] }],
      },
    });

    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
