
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
  description: 'Menambahkan pengingat ke Google Tasks.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING },
      date: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ['Rendah', 'Sedang', 'Tinggi'] },
    },
    required: ['text', 'date', 'priority'],
  },
};

const syncContactsFn: FunctionDeclaration = {
  name: 'syncContacts',
  description: 'Menyimpan kontak orang tua.',
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
        systemInstruction: `Anda adalah GuruMate AI untuk SMPN 21 Kota Jambi.
        
        TUGAS UTAMA:
        - Membantu guru mengelola Jadwal, Nilai Akademik, dan Nilai Kelakuan (Sikap).
        - Jika user mengunggah gambar/file berisi daftar nilai atau catatan perilaku, ekstrak datanya menggunakan function call 'addGrade' atau 'addBehaviorRecord'.
        - Predikat Nilai Kelakuan: A (Sangat Baik), B (Baik), C (Cukup), D (Kurang).
        - Setiap pengingat disinkronkan ke Google Tasks.
        
        Berikan jawaban dalam Bahasa Indonesia yang ramah dan efisien.`,
        tools: [{ functionDeclarations: [addScheduleFn, addGradeFn, addBehaviorRecordFn, addReminderFn, syncContactsFn] }],
      },
    });

    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
