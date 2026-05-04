import React, { useState, useEffect } from 'react';
import './index.css';
import { getAccountsFromDB, syncAccountsToDB, logActivity } from './firebase';
import FamilyTree from './FamilyTree';
import { addLog, downloadLogs } from './logger';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  
  // Login State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Access Management State
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleAssign, setNewRoleAssign] = useState('editor');

  const userRole = currentUser ? currentUser.role : 'guest';

  const roleDescriptions = {
    'super-admin': 'Level Tertinggi: Bisa menambah, mengedit, menghapus anggota, kelola Admin, dan ubah foto profil.',
    'admin': 'Level Admin: Bisa menambah/mengedit anggota, kelola Editor, dan ubah foto profil. Tidak bisa menghapus anggota.',
    'editor': 'Level Editor: Hanya bisa menambah/mengedit data teks anggota. Tidak bisa ubah foto atau hapus anggota.',
    'guest': 'Level Tamu: Hanya bisa melihat, menggeser, zoom silsilah, dan mencetak JPG.'
  };

  useEffect(() => {
    // Memuat daftar akun (Admin & Editor) saat aplikasi berjalan
    getAccountsFromDB().then(data => {
      if (data) setAccounts(data);
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Kunci Rahasia Super-Admin (Hardcoded sesuai instruksi)
    if (loginUsername === 'irincahyo' && loginPassword === '@Akhtar301008') {
      setCurrentUser({ username: 'irincahyo', role: 'super-admin' });
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
      addLog('info', 'Autentikasi', `Super-Admin irincahyo berhasil login.`);
      logActivity('LOGIN_SUCCESS', 'Super-Admin irincahyo masuk ke sistem.', 'irincahyo');
      return;
    }

    // Pengecekan untuk Admin / Editor
    const acc = accounts.find(a => a.username === loginUsername && a.password === loginPassword);
    if (acc) {
      setCurrentUser(acc);
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
      addLog('info', 'Autentikasi', `Pengguna ${loginUsername} berhasil login sebagai ${acc.role}.`);
      logActivity('LOGIN_SUCCESS', `Pengguna ${loginUsername} masuk sebagai ${acc.role}.`, loginUsername);
    } else {
      addLog('error', 'Autentikasi Gagal', `Percobaan login gagal untuk username: ${loginUsername}`);
      logActivity('LOGIN_FAILED', `Gagal login untuk username: ${loginUsername}`, "Unknown");
      alert("Username atau password salah!");
    }
  };

  const handleLogout = () => {
    addLog('info', 'Autentikasi', `Pengguna ${currentUser.username} telah logout.`);
    setCurrentUser(null);
  };

  const handleAddAccess = (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    
    if (newUsername.toLowerCase() === 'irincahyo') {
      alert("Username ini adalah milik Super-Admin dan dilindungi oleh sistem.");
      return;
    }

    // Cek apakah username sudah ada
    if (accounts.some(a => a.username === newUsername)) {
      alert("Username ini sudah digunakan. Pilih username lain.");
      return;
    }

    const updatedAccounts = [...accounts, { username: newUsername, password: newPassword, role: newRoleAssign }];
    setAccounts(updatedAccounts);
    syncAccountsToDB(updatedAccounts);
    
    setNewUsername('');
    setNewPassword('');
    addLog('info', 'Manajemen Akses', `Menambahkan akun baru: ${newUsername} (${newRoleAssign})`);
  };

  const handleRemoveAccess = (username) => {
    const updatedAccounts = accounts.filter(a => a.username !== username);
    setAccounts(updatedAccounts);
    syncAccountsToDB(updatedAccounts);
    addLog('warn', 'Manajemen Akses', `Menghapus akun: ${username}`);
  };

  const handleShareLink = () => {
    const shareData = {
      title: 'Silsilah Keluarga Isgijantoro',
      text: 'Mari melihat silsilah keluarga Isgijantoro secara interaktif.',
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan silsilah telah disalin ke papan klip!');
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Floating Top Left: Identitas Silsilah (Sangat Ringkas) */}
      <div style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--glass-bg)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)' }}>
        <img src="/hero_family.png" alt="Keluarga" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
        <h2 style={{ fontSize: '0.9rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>Keluarga Isgijantoro</h2>
      </div>

      {/* Floating Top Right: Kontrol Pengurus */}
      <div style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.4rem', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-md)', backdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)' }}>
        <button 
          onClick={handleShareLink} 
          title="Bagikan Silsilah" 
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'white', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
        {currentUser ? (
          <React.Fragment>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0 0.5rem', color: 'var(--color-text-main)', display: 'none' }} className="hide-on-mobile">
              Halo, {currentUser.username}
            </span>
            {(userRole === 'super-admin' || userRole === 'admin') && (
              <button onClick={() => setShowAccessModal(true)} style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', cursor: 'pointer', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 'bold' }}>
                Akses
              </button>
            )}
            <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', border: 'none', background: '#F3F4F6' }}>Logout</button>
          </React.Fragment>
        ) : (
          <button onClick={() => setShowLoginModal(true)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)' }}>
            🔒 Login
          </button>
        )}
      </div>

      {/* Peta Silsilah Layar Penuh (100% Bebas Hambatan) */}
      <main style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
        <FamilyTree role={userRole} currentUser={currentUser} />
      </main>

      {/* Modal Login (Username & Password) */}
      {showLoginModal && (
        <div className="modal-overlay" style={{ zIndex: 200 }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Login Pengurus Silsilah</h3>
              <button type="button" className="close-btn" onClick={() => setShowLoginModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleLogin} className="modal-form">
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={loginUsername} 
                  onChange={(e) => setLoginUsername(e.target.value)} 
                  placeholder="Masukkan username..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  placeholder="Masukkan kata sandi..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Masuk</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Akses (Admin & Editor) */}
      {showAccessModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Kelola Akses Keluarga</h3>
              <button className="close-btn" onClick={() => setShowAccessModal(false)}>&times;</button>
            </div>
            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Buatkan Username dan Password untuk kerabat Anda agar mereka bisa membantu mengedit silsilah.
            </div>
            
            <form onSubmit={handleAddAccess} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  placeholder="Username baru..." 
                  required 
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
                <input 
                  type="text" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Password..." 
                  required 
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select 
                  value={newRoleAssign} 
                  onChange={(e) => setNewRoleAssign(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                >
                  {userRole === 'super-admin' && <option value="admin">Admin</option>}
                  <option value="editor">Editor</option>
                </select>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Buat Akun</button>
              </div>
            </form>

            <div>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>🛡️ Daftar Akun Pengurus</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {accounts.length === 0 ? <li style={{ fontSize: '0.85rem', color: '#999' }}>Belum ada pengurus tambahan.</li> : null}
                {accounts.map(acc => (
                  <li key={acc.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--color-background)', marginBottom: '8px', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                    <div>
                      <strong>{acc.username}</strong> 
                      <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', background: 'var(--color-white)', padding: '2px 6px', borderRadius: '4px' }}>
                        {acc.role === 'admin' ? '🛡️ Admin' : '📝 Editor'}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Pw: {acc.password}
                      </div>
                    </div>
                    {((userRole === 'super-admin') || (userRole === 'admin' && acc.role === 'editor')) && (
                      <button onClick={() => handleRemoveAccess(acc.username)} style={{ color: 'red', border: 'none', background: 'rgba(239,68,68,0.1)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Hapus</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
