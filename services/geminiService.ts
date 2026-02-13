
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AppState } from "../types";

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
  description: 'Menambahkan jadwal mata pelajaran baru ke database lokal.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING, description: 'Hari' },
      subject: { type: Type.STRING, description: 'Mapel' },
      time: { type: Type.STRING, description: 'Waktu' },
      className: { type: Type.STRING, description: 'Kelas' },
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
      studentName: { type: Type.STRING, description: 'Nama' },
      subject: { type: Type.STRING, description: 'Mapel' },
      score: { type: Type.NUMBER, description: 'Nilai' },
    },
    required: ['studentName', 'subject', 'score'],
  },
};

const addActivityFn: FunctionDeclaration = {
  name: 'addActivity',
  description: 'Mencatat kegiatan siswa.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING, description: 'Nama' },
      description: { type: Type.STRING, description: 'Kegiatan' },
      category: { type: Type.STRING, enum: ['Akademik', 'Perilaku', 'Ekstrakurikuler'] },
      date: { type: Type.STRING, description: 'Tanggal' },
    },
    required: ['studentName', 'description', 'category', 'date'],
  },
};

const addReminderFn: FunctionDeclaration = {
  name: 'addReminder',
  description: 'Menambahkan pengingat tugas yang akan disinkronkan ke Google Reminder/Tasks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: 'Isi Pengingat' },
      date: { type: Type.STRING, description: 'Waktu/Tanggal (format bebas atau ISO)' },
      priority: { type: Type.STRING, enum: ['Rendah', 'Sedang', 'Tinggi'] },
    },
    required: ['text', 'date', 'priority'],
  },
};

const generateParentReportFn: FunctionDeclaration = {
  name: 'generateParentReport',
  description: 'Membuat laporan untuk orang tua via WhatsApp.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentName: { type: Type.STRING },
      phoneNumber: { type: Type.STRING },
      content: { type: Type.STRING },
    },
    required: ['studentName', 'phoneNumber', 'content'],
  },
};

const syncContactsFn: FunctionDeclaration = {
  name: 'syncContacts',
  description: 'Menyimpan kontak orang tua siswa.',
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
  if (!apiKey) throw new Error("API Key Missing");
  
  try {
    const userParts: any[] = [{ text: prompt }];
    if (fileData) userParts.push({ inlineData: fileData });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: userParts }],
      config: {
        systemInstruction: `Anda adalah GuruMate AI, asisten pribadi multimodal yang terintegrasi dengan ekosistem Google (Gmail/Tasks).
        
        KEMAMPUAN INTEGRASI GOOGLE:
        - User (Guru) masuk menggunakan akun GMAIL.
        - Setiap fungsi 'addReminder' akan disinkronkan ke Google Tasks/Reminder user. Pastikan Anda menginformasikan ini kepada user setelah mereka membuat pengingat.
        
        KEMAMPUAN MULTIMODAL:
        - Anda dapat menganalisis GAMBAR dan DOKUMEN (PDF, Excel, Word).
        - Ekstrak data dari file tersebut (misal: daftar nilai atau jadwal) dan gunakan function call yang sesuai.
        
        Berikan jawaban dalam Bahasa Indonesia yang sopan, ringkas, dan sangat membantu pekerjaan guru.`,
        tools: [{ functionDeclarations: [addScheduleFn, addGradeFn, addActivityFn, addReminderFn, generateParentReportFn, syncContactsFn] }],
      },
    });

    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
