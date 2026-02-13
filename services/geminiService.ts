
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState } from "../types";

// Langsung gunakan process.env.API_KEY sesuai panduan
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const addScheduleFn: FunctionDeclaration = {
  name: 'addSchedule',
  description: 'Menambahkan jadwal mata pelajaran baru.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING },
      subject: { type: Type.STRING },
      time: { type: Type.STRING },
      className: { type: Type.STRING },
    },
    required: ['day', 'subject', 'time', 'className'],
  },
};

const addGradeFn: FunctionDeclaration = {
  name: 'addGrade',
  description: 'Menambahkan nilai akademik siswa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING },
      subject: { type: Type.STRING },
      score: { type: Type.NUMBER },
    },
    required: ['studentName', 'subject', 'score'],
  },
};

const addBehaviorRecordFn: FunctionDeclaration = {
  name: 'addBehaviorRecord',
  description: 'Menambahkan rekap nilai kelakuan/sikap siswa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING },
      grade: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'], description: 'Predikat nilai kelakuan' },
      description: { type: Type.STRING, description: 'Catatan perilaku spesifik' },
      date: { type: Type.STRING, description: 'Tanggal pencatatan' },
    },
    required: ['studentName', 'grade', 'description', 'date'],
  },
};

const addReminderFn: FunctionDeclaration = {
  name: 'addReminder',
  description: 'Menambahkan pengingat yang akan disinkronkan ke Google Calendar dan Google Tasks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: 'Isi pengingat atau kegiatan' },
      date: { type: Type.STRING, description: 'Tanggal dan waktu (ISO atau format deskriptif)' },
      priority: { type: Type.STRING, enum: ['Rendah', 'Sedang', 'Tinggi'] },
    },
    required: ['text', 'date', 'priority'],
  },
};

const syncContactsFn: FunctionDeclaration = {
  name: 'syncContacts',
  description: 'Menyimpan kontak orang tua siswa ke buku telepon digital.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING },
      parentName: { type: Type.STRING },
      phoneNumber: { type: Type.STRING },
      className: { type: Type.STRING },
    },
    required: ['studentName', 'parentName', 'phoneNumber', 'className']
  },
};

export const chatWithGemini = async (
  prompt: string, 
  currentState: AppState,
  history: { role: string; parts: any[] }[] = [],
  fileData?: { mimeType: string; data: string }
) => {
  try {
    const userParts: any[] = [{ text: prompt }];
    if (fileData) userParts.push({ inlineData: fileData });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: userParts }],
      config: {
        systemInstruction: `Anda adalah GuruMate AI, asisten administrasi digital untuk Guru SMPN 21 Kota Jambi.
        
        KEMAMPUAN UTAMA:
        1. ANALISIS DOKUMEN: Anda bisa membaca file PDF, Excel, Docx, atau Foto Tabel Nilai. Jika user mengunggah file tersebut, ekstrak nama siswa, nilai, atau catatan perilaku dan gunakan fungsi 'addGrade' atau 'addBehaviorRecord' untuk setiap baris data yang ditemukan.
        2. GOOGLE SYNC: Setiap kali user meminta diingatkan (misal: "Ingatkan saya besok jam 8 ada rapat"), gunakan fungsi 'addReminder'. Beritahu user bahwa ini otomatis tersinkron dengan Google Calendar & Google Tasks mereka.
        3. LAPORAN WHATSAPP: Anda membantu merangkum perkembangan siswa untuk dikirim ke orang tua.
        4. KONTAK: Anda bisa menyimpan data kontak orang tua.
        
        GAYA BAHASA: Sopan, profesional, dan sangat membantu. Gunakan format Markdown (tebal, list) agar mudah dibaca.
        
        Jika user memberikan instruksi suara/teks seperti "Besok jam 9 pagi ada tugas untuk kelas 9A", Anda harus langsung memanggil 'addReminder' dengan parameter yang tepat.`,
        tools: [{ functionDeclarations: [addScheduleFn, addGradeFn, addBehaviorRecordFn, addReminderFn, syncContactsFn] }],
      },
    });

    return response;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
