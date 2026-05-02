export const activityLogs = [];

export const addLog = (level, action, details) => {
  const timestamp = new Date().toLocaleString('id-ID');
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${action} - ${details}`;
  
  // Simpan ke memori sementara (array)
  activityLogs.push(logEntry);
  
  // Jika ini error, tampilkan juga di konsol browser
  if (level === 'error') {
    console.error(logEntry);
  } else {
    console.log(logEntry);
  }
};

export const downloadLogs = () => {
  if (activityLogs.length === 0) {
    alert("Belum ada log aktivitas yang tercatat di sesi ini.");
    return;
  }
  
  const dataStr = activityLogs.join('\n');
  const blob = new Blob([dataStr], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `Log_Aktivitas_Silsilah_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
