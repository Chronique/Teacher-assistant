
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AppState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

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

export const chatWithGemini = async (
  prompt: string, 
  currentState: AppState,
  history: { role: string; parts: { text: string }[] }[] = []
) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: `Anda adalah GuruMate, asisten pribadi untuk guru di Indonesia. 
        Tugas Anda membantu mengelola:
        1. Jadwal Pelajaran
        2. Nilai Siswa
        3. Rangkuman Kegiatan Siswa
        
        Data saat ini:
        ${JSON.stringify(currentState)}
        
        Berikan jawaban yang ramah, profesional, dan gunakan bahasa Indonesia yang baik. 
        Jika guru ingin menambah data, gunakan function calling yang tersedia.
        Jika ditanya tentang data yang ada, ringkaslah dengan baik dalam format markdown.`,
        tools: [{ functionDeclarations: [addScheduleFn, addGradeFn, addActivityFn] }],
      },
    });

    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
