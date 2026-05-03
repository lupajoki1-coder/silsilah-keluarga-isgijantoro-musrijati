import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let ai;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey });
}

export const validateFamilyAddition = async (newName, gender, relation, referenceName) => {
  if (!ai) {
    // Mode Demo Tanpa API Key: Logika Penjaga Bawaan
    console.log("Mode Demo AI: Menggunakan logika lokal karena API Key Gemini belum dipasang.");
    const relLower = relation.toLowerCase();
    
    if (relLower.includes("suami") && gender === "Perempuan") {
      return { valid: false, message: "Halo! Sepertinya ada sedikit kekeliruan. Relasi 'Suami' biasanya diperuntukkan bagi Laki-laki. Apakah Anda ingin mengoreksi data ini?" };
    }
    if (relLower.includes("istri") && gender === "Laki-laki") {
      return { valid: false, message: "Halo! Relasi 'Istri' biasanya untuk Perempuan. Mohon periksa kembali pilihan gender Anda." };
    }
    if ((relLower.includes("ayah") || relLower.includes("kakek")) && gender === "Perempuan") {
      return { valid: false, message: "Hmm, relasi tersebut biasanya bergender Laki-laki. Apakah Anda salah tekan?" };
    }
    if ((relLower.includes("ibu") || relLower.includes("nenek")) && gender === "Laki-laki") {
      return { valid: false, message: "Relasi tersebut biasanya bergender Perempuan. Mohon koreksi pilihan Anda ya!" };
    }
    return { valid: true, message: "" };
  }

  const prompt = `
  Anda adalah "Asisten Penjaga Silsilah", seorang pendamping digital yang sangat cerdas, sabar, dan hangat layaknya seorang tetua keluarga yang bijaksana. 
  
  Pengguna sedang mencoba menambahkan data anggota keluarga baru ke dalam buku silsilah:
  - Nama Anggota Baru: ${newName}
  - Gender: ${gender}
  - Status/Relasi: ${relation} dari ${referenceName}
  
  Tugas Anda:
  Lakukan audit logika silsilah secara mutlak:
  1. Suami HARUS Laki-laki.
  2. Istri HARUS Perempuan.
  3. Ayah atau Kakek HARUS Laki-laki.
  4. Ibu atau Nenek HARUS Perempuan.
  5. Jika relasi adalah "Anak" atau "Saudara", maka gender bebas (valid).
  
  Balas HANYA dengan format JSON murni tanpa ada embel-embel markdown sama sekali:
  {
    "valid": true, 
    "message": "" 
  }
  
  PENTING: Jika logika di atas dilanggar (misalnya Suami diisi Perempuan), isi "valid" dengan false, dan tuliskan "message" dengan teguran yang SANGAT manusiawi, sopan, dan hangat. 
  Contoh jika salah: "Halo keluarga! Sepertinya ada sedikit kesalahan ketik. Posisi 'Suami' biasanya diperuntukkan bagi anggota keluarga Laki-laki. Mari kita perbaiki agar silsilah kita tetap rapi."
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback pass if network error to avoid breaking the app
    return { valid: true, message: "" }; 
  }
};

export const generateFamilyStory = async (treeData) => {
  if (!ai) {
    return "Maaf, fitur cerita keluarga AI memerlukan API Key Gemini yang aktif. Pasang API Key Anda di file .env untuk memulai petualangan kisah keluarga ini!";
  }

  const prompt = `
  Anda adalah "Sejarawan Digital Keluarga". Tugas Anda adalah merangkai sebuah narasi yang sangat hangat, puitis, dan menyentuh hati berdasarkan data silsilah keluarga berikut:
  
  DATA SILSILAH:
  ${JSON.stringify(treeData)}
  
  INSTRUKSI:
  1. Tuliskan sebuah ringkasan kisah yang "manusiawi" tentang perjalanan keturunan ini.
  2. Fokus pada bagaimana setiap generasi saling terhubung dan harapan untuk masa depan.
  3. Gunakan bahasa Indonesia yang sangat indah, sopan, dan puitis (Sastra).
  4. Jangan terlalu panjang, maksimal 3-4 paragraf.
  5. Jika ada banyak nama yang sudah meninggal (RIP), berikan penghormatan singkat atas warisan mereka.
  
  Tuliskan ceritanya sekarang:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Story Error:", error);
    return "Terjadi kesalahan saat merangkai kisah. Mohon coba lagi nanti.";
  }
};
