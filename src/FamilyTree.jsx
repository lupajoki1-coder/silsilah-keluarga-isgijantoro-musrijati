import React, { useState, useEffect } from 'react';
import { syncTreeToDB, getTreeFromDB, isDemoMode } from './firebase';
import html2canvas from 'html2canvas';
import { validateFamilyAddition } from './gemini';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { addLog } from './logger';

// Komponen kontrol zoom untuk alternatif tambahan yang rapi
const ZoomControls = () => {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();
  
  const handleDefaultView = () => {
    resetTransform(500); // Durasi 500ms
    setTimeout(() => centerView(1, 500), 10);
  };

  return (
    <div className="zoom-controls-container" style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
      <button onClick={() => zoomIn(0.2)} title="Perbesar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: '1.2rem', boxShadow: 'var(--shadow-md)', cursor: 'pointer' }}>➕</button>
      <button onClick={() => zoomOut(0.2)} title="Perkecil" style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'var(--color-white)', color: 'var(--color-primary)', fontSize: '1.2rem', boxShadow: 'var(--shadow-md)', cursor: 'pointer', border: '2px solid var(--color-primary)' }}>➖</button>
      <button onClick={handleDefaultView} title="Tampilan Default" style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'var(--color-text-main)', color: 'white', fontSize: '1.2rem', boxShadow: 'var(--shadow-md)', cursor: 'pointer' }}>🔄</button>
    </div>
  );
};

// Komponen Cerdas Penghubung Garis Keturunan
const FamilyLines = ({ treeData, focusedMemberId }) => {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const updateLines = () => {
      const newLines = [];
      const flatMembers = treeData.flatMap(gen => gen.members);
      
      flatMembers.forEach(member => {
        if (member.referenceMemberId && member.relation === 'Anak') {
          const parentEl = document.getElementById(`member-${member.referenceMemberId}`);
          const childEl = document.getElementById(`member-${member.id}`);
          const wrapperEl = document.getElementById('family-tree-wrapper');

          if (parentEl && childEl && wrapperEl) {
            const pRect = parentEl.getBoundingClientRect();
            const cRect = childEl.getBoundingClientRect();
            const wRect = wrapperEl.getBoundingClientRect();

            // Koordinat relatif terhadap wrapper
            const x1 = (pRect.left + pRect.width / 2) - wRect.left;
            const y1 = (pRect.bottom) - wRect.top;
            const x2 = (cRect.left + cRect.width / 2) - wRect.left;
            const y2 = (cRect.top) - wRect.top;

            const isFocused = focusedMemberId === member.id || focusedMemberId === Number(member.referenceMemberId);

            newLines.push({ x1, y1, x2, y2, isFocused });
          }
        }
      });
      setLines(newLines);
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    // Observe changes in the wrapper to update lines when children change
    const observer = new MutationObserver(updateLines);
    const wrapper = document.getElementById('family-tree-wrapper');
    if (wrapper) observer.observe(wrapper, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', updateLines);
      observer.disconnect();
    };
  }, [treeData, focusedMemberId]);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-border)" />
        </marker>
        <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-primary)" />
        </marker>
      </defs>
      {lines.map((line, i) => (
        <path
          key={i}
          d={`M ${line.x1} ${line.y1} L ${line.x1} ${line.y1 + 15} L ${line.x2} ${line.y1 + 15} L ${line.x2} ${line.y2}`}
          fill="none"
          stroke={line.isFocused ? 'var(--color-primary)' : 'var(--color-border)'}
          strokeWidth={line.isFocused ? 3 : 1.5}
          strokeDasharray={line.isFocused ? 'none' : '4 2'}
          style={{ transition: 'all 0.3s ease' }}
          markerEnd={line.isFocused ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
        />
      ))}
    </svg>
  );
};

const getSilhouette = (gender) => {
  if (gender === 'Perempuan') {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F472B6'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  }
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2360A5FA'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
};

const initialData = [
  {
    id: "gen-1",
    generation: "Kakek & Nenek",
    members: [
      { id: 1, name: "Budi Santoso", relation: "Kakek", status: "Meninggal", gender: "Laki-laki", customAvatar: "", avatarUrl: getSilhouette('Laki-laki') },
      { id: 2, name: "Siti Aminah", relation: "Nenek", status: "Meninggal", gender: "Perempuan", customAvatar: "", avatarUrl: getSilhouette('Perempuan') },
    ]
  },
  {
    id: "gen-2",
    generation: "Orang Tua",
    members: [
      { id: 3, name: "Agus Santoso", relation: "Ayah", status: "Hidup", gender: "Laki-laki", customAvatar: "", avatarUrl: getSilhouette('Laki-laki') },
      { id: 4, name: "Dewi Lestari", relation: "Ibu", status: "Hidup", gender: "Perempuan", customAvatar: "", avatarUrl: getSilhouette('Perempuan') },
    ]
  },
  {
    id: "gen-3",
    generation: "Generasi Anda",
    members: [
      { id: 5, name: "Pengguna Demo", relation: "Anda", status: "Hidup", gender: "Laki-laki", customAvatar: "", avatarUrl: getSilhouette('Laki-laki') },
    ]
  }
];

export default function FamilyTree({ role = 'guest', currentUser }) {
  const isGuest = role === 'guest';
  const isSuperAdmin = role === 'super-admin';
  const isAdmin = role === 'admin';
  
  const canEditPhoto = isSuperAdmin || isAdmin;
  const canDelete = isSuperAdmin;

  const [treeData, setTreeData] = useState(initialData);
  const [isDBLoaded, setIsDBLoaded] = useState(false);
  const [focusedMemberId, setFocusedMemberId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  // AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Form State
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState('Hidup');
  const [newGender, setNewGender] = useState('Laki-laki');
  const [newCustomAvatar, setNewCustomAvatar] = useState('');
  const [referenceMemberId, setReferenceMemberId] = useState('');
  const [relationType, setRelationType] = useState('Anak'); // Suami, Istri, Anak, Ayah, Ibu, Saudara
  const [newNote, setNewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Derived flat list of members for dropdown
  const allMembers = treeData.flatMap((gen, genIndex) => gen.members.map(m => ({ ...m, genIndex })));

  // Load from DB
  useEffect(() => {
    const loadData = async () => {
      if (!isDemoMode) {
        const dbData = await getTreeFromDB();
        if (dbData) setTreeData(dbData);
      }
      setIsDBLoaded(true);
    };
    loadData();
  }, []);

  // Initial Focus Logic
  useEffect(() => {
    if (isDBLoaded) {
      if (isGuest) {
        // Guest: Focus on the very first member (Ancestor)
        if (treeData[0]?.members[0]) {
          setFocusedMemberId(treeData[0].members[0].id);
        }
      } else if (currentUser) {
        // Admin/Editor: Focus on their own generation match
        const myGenMember = allMembers.find(m => {
          const mName = m.name.toLowerCase().replace(/[^a-z]/g, '');
          const uName = currentUser.username.toLowerCase().replace(/[^a-z]/g, '');
          const trackKey = uName.substring(0, 4);
          return trackKey.length >= 3 && (mName.includes(trackKey) || uName.includes(mName.substring(0, 4)));
        });
        if (myGenMember) {
          setFocusedMemberId(myGenMember.id);
        } else if (treeData[0]?.members[0]) {
          setFocusedMemberId(treeData[0].members[0].id);
        }
      }
    }
  }, [isDBLoaded, isGuest, currentUser]);

  const openAddModal = () => {
    setEditingMember(null);
    setNewName('');
    setNewStatus('Hidup');
    setNewGender('Laki-laki');
    setNewCustomAvatar('');
    setNewNote('');
    setAiError('');
    if (allMembers.length > 0) {
      setReferenceMemberId(allMembers[allMembers.length - 1].id.toString());
    }
    setRelationType('Anak');
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setNewName(member.name);
    setRelationType(member.relation);
    setNewStatus(member.status);
    setNewGender(member.gender || 'Laki-laki');
    setNewCustomAvatar(member.customAvatar || '');
    setNewNote(member.note || '');
    setAiError('');
    setIsModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Kompresi Gambar: Mencegah melebihi batas 1MB Firestore
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 250; // Resolusi maksimal untuk avatar (Sangat Cukup)
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Konversi ke format WebP/JPEG dengan Kualitas 0.7 (Sangat Ringan, +- 5KB-10KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setNewCustomAvatar(compressedDataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // --- GEMINI AI VALIDATION ---
    setIsAiLoading(true);
    setAiError('');
    
    let refName = "Dirinya Sendiri";
    if (!editingMember) {
      const refMem = allMembers.find(m => m.id.toString() === referenceMemberId);
      if (refMem) refName = refMem.name;
    }

    const validation = await validateFamilyAddition(newName, newGender, relationType, refName);
    setIsAiLoading(false);

    if (!validation.valid) {
      setAiError(validation.message);
      addLog('warn', 'AI Validation Ditolak', `Penyimpanan '${newName}' diblokir AI: ${validation.message}`);
      return; // Stop saving if AI says it's illogical
    }
    // --- END AI ---

    const finalAvatarUrl = newCustomAvatar.trim() 
      ? newCustomAvatar.trim() 
      : getSilhouette(newGender);

    const newMem = {
      id: editingMember ? editingMember.id : Date.now(),
      name: newName,
      relation: relationType,
      status: newStatus,
      gender: newGender,
      customAvatar: newCustomAvatar.trim(),
      avatarUrl: finalAvatarUrl,
      note: newNote,
      referenceMemberId: referenceMemberId ? referenceMemberId.toString() : ''
    };

    let updatedTree = treeData.map(gen => ({
      ...gen,
      members: [...gen.members]
    }));

    if (editingMember) {
      updatedTree = updatedTree.map(gen => ({
        ...gen,
        members: gen.members.map(m => m.id === editingMember.id ? newMem : m)
      }));
      addLog('info', 'Edit Anggota', `Berhasil mengedit data anggota '${newName}'.`);
    } else {
      const refMem = allMembers.find(m => m.id.toString() === referenceMemberId) || allMembers[0];
      let targetGenIndex = refMem ? refMem.genIndex : 0;

      if (relationType === 'Anak') {
        targetGenIndex += 1;
      } else if (relationType === 'Ayah' || relationType === 'Ibu') {
        targetGenIndex -= 1;
      }

      if (targetGenIndex < 0) {
        updatedTree.unshift({
          id: `gen-top-${Date.now()}`,
          generation: `Leluhur (${relationType})`,
          members: [newMem]
        });
      } else if (targetGenIndex >= updatedTree.length) {
        updatedTree.push({
          id: `gen-bot-${Date.now()}`,
          generation: `Generasi Baru`,
          members: [newMem]
        });
      } else {
        updatedTree[targetGenIndex].members.push(newMem);
      }
      addLog('info', 'Tambah Anggota', `Berhasil menambahkan '${newName}' sebagai ${relationType} dari ${refName}.`);
    }

    try {
      setTreeData(updatedTree);
      
      // Simpan langsung ke database secara eksplisit dan berikan konfirmasi
      if (!isDemoMode) {
        await syncTreeToDB(updatedTree);
        alert(`Sukses! Data anggota keluarga telah tersimpan secara permanen di Database Firebase.`);
      }
      setIsModalOpen(false);
    } catch (dbError) {
      alert(`⚠️ ERROR DATABASE: Penyimpanan gagal.\n\nDetail Error: ${dbError.message}\n\nPastikan Aturan Keamanan (Rules) Firestore Anda sudah 'allow read, write: if true;'.`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!editingMember) return;
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus ${editingMember.name} dari silsilah?`);
    if (!confirmDelete) return;

    const updatedTree = treeData.map(gen => ({
      ...gen,
      members: gen.members.filter(m => m.id !== editingMember.id)
    })).filter(gen => gen.members.length > 0); 
    
    try {
      setTreeData(updatedTree);
      addLog('warn', 'Hapus Anggota', `Super-Admin menghapus anggota '${editingMember.name}'.`);
      
      if (!isDemoMode) {
        await syncTreeToDB(updatedTree);
        alert("Anggota berhasil dihapus secara permanen dari Database Firebase.");
      }
      setIsModalOpen(false);
    } catch (dbError) {
      alert(`⚠️ ERROR DATABASE: Penghapusan gagal.\n\nDetail Error: ${dbError.message}`);
    }
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

  const handleExportData = () => {
    const dataStr = JSON.stringify(treeData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cadangan_Silsilah_Keluarga_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("Data silsilah berhasil dicadangkan! Simpan file ini di tempat yang aman.");
  };

  const handleExportImage = () => {
    const treeElement = document.getElementById('family-tree-wrapper');
    if (!treeElement) return;
    
    html2canvas(treeElement, { backgroundColor: '#FDFBF7', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Gambar_Silsilah_${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    });
  };

  // --- SISTEM FOKUS JENDELA GENERASI (+2 / -2) ---
  let focusedGenIndex = 0;
  if (focusedMemberId) {
    const idx = treeData.findIndex(gen => gen.members.some(m => m.id === focusedMemberId));
    if (idx !== -1) focusedGenIndex = idx;
  }
  const startIndex = Math.max(0, focusedGenIndex - 2);
  const endIndex = Math.min(treeData.length - 1, focusedGenIndex + 2);
  const visibleTreeData = treeData.slice(startIndex, endIndex + 1);

  return (
    <div className="family-tree-container" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', background: 'var(--color-background)' }}>
      {/* Global Search Bar */}
      <div className="search-container hide-on-mobile-flex">
        <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Cari anggota keluarga..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <TransformWrapper
          initialScale={1}
          minScale={0.2}
          maxScale={2}
          centerOnInit={true}
          limitToBounds={false}
          wheel={{ step: 0.1, smoothStep: 0.005 }}
          pinch={{ step: 5 }}
          panning={{ velocityDisabled: true }} 
          doubleClick={{ disabled: true }}
        >
          {() => (
            <React.Fragment>
              <ZoomControls />
              <TransformComponent wrapperStyle={{ width: "100vw", height: "100vh" }} contentStyle={{ width: "100%", minWidth: "max-content", padding: "1rem" }}>
                <div id="family-tree-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <FamilyLines treeData={visibleTreeData} focusedMemberId={focusedMemberId} />
                  {visibleTreeData.map((gen, index) => {
                    // Logika Pencocokan Ekstrem: Mencari nama pengguna di dalam data anggota
                    const isUserGeneration = currentUser && gen.members.some(m => {
                      const mName = m.name.toLowerCase().replace(/[^a-z]/g, '');
                      const uName = currentUser.username.toLowerCase().replace(/[^a-z]/g, '');
                      // Ambil 4 huruf pertama dari username sebagai kunci pelacakan
                      const trackKey = uName.substring(0, 4);
                      return trackKey.length >= 3 && (mName.includes(trackKey) || uName.includes(mName.substring(0, 4)));
                    });

                    return (
                      <div key={gen.id} className="generation-row" style={{ width: '100%', marginBottom: '0.5rem' }}>
                        {isUserGeneration && (
                          <h3 className="generation-title" style={{ textAlign: 'center', background: 'var(--color-primary)', color: 'white' }}>Generasi Anda</h3>
                        )}
                        <div className="members-container" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', gap: '0.8rem', minWidth: 'max-content' }}>
                        {(() => {
                          const grouped = [];
                          const processedIds = new Set();
                          
                          gen.members.forEach(member => {
                            if (processedIds.has(member.id)) return;
                            
                            const spouse = gen.members.find(m => {
                              if (processedIds.has(m.id)) return false;
                              
                              // Deteksi akurat menggunakan referenceMemberId
                              const isExplicitMatch = 
                                ((m.relation === 'Suami' || m.relation === 'Istri') && m.referenceMemberId === member.id.toString()) ||
                                ((member.relation === 'Suami' || member.relation === 'Istri') && member.referenceMemberId === m.id.toString());
                                
                              // Deteksi mundur (legacy) untuk data lama yang belum punya referenceMemberId
                              const isLegacyMatch = 
                                (!m.referenceMemberId && !member.referenceMemberId) && 
                                (((m.relation === 'Suami' || m.relation === 'Istri') && (member.relation !== 'Suami' && member.relation !== 'Istri')) ||
                                ((member.relation === 'Suami' || member.relation === 'Istri') && (m.relation !== 'Suami' && m.relation !== 'Istri')));

                              return isExplicitMatch || isLegacyMatch;
                            });

                            if (spouse) {
                              grouped.push({ type: 'couple', members: [member, spouse] });
                              processedIds.add(member.id);
                              processedIds.add(spouse.id);
                            } else {
                              grouped.push({ type: 'single', members: [member] });
                              processedIds.add(member.id);
                            }
                          });

                          const renderMemberCard = (member) => (
                            <div style={{ position: 'relative' }} key={member.id}>
                              {!isGuest && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openEditModal(member); }}
                                  style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', zIndex: 10, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}
                                  title="Edit Anggota"
                                >
                                  ✏️
                                </button>
                              )}
                              <div 
                                className={`member-card ${focusedMemberId === member.id ? 'focused' : ''} ${searchTerm && member.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 'search-match' : ''} ${
                                  focusedMemberId && (
                                    member.id.toString() === allMembers.find(m => m.id === focusedMemberId)?.referenceMemberId || 
                                    member.referenceMemberId === focusedMemberId.toString()
                                  ) ? 'related-match' : ''
                                }`}
                                id={`member-${member.id}`}
                                onClick={() => setFocusedMemberId(member.id)}
                                style={{ 
                                  cursor: 'pointer', 
                                  border: focusedMemberId === member.id ? '4px solid var(--color-primary)' : '2px solid var(--color-border)',
                                  transform: focusedMemberId === member.id ? 'scale(1.05)' : 'scale(1)',
                                  boxShadow: focusedMemberId === member.id ? '0 10px 25px rgba(217, 119, 87, 0.4)' : 'var(--shadow-md)'
                                }}
                                title="Klik untuk melihat garis keturunan"
                              >
                                {member.note && (
                                  <div className="member-note-tooltip">
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px', color: 'var(--color-primary)' }}>Catatan:</div>
                                    {member.note}
                                    <div className="arrow" style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid rgba(0,0,0,0.85)' }}></div>
                                  </div>
                                )}
                                <div 
                                  className={`member-avatar ${member.status === "Meninggal" ? "grayscale" : ""}`}
                                  style={{ backgroundImage: `url(${member.avatarUrl})` }}
                                >
                                  {member.status === "Meninggal" && <div className="status-badge rip">RIP</div>}
                                </div>
                                <div className="member-info">
                                  <h4 className="member-name">
                                    {member.name} 
                                    {!isGuest && <span style={{ color: member.gender === 'Perempuan' ? '#EC4899' : '#3B82F6' }}> {member.gender === 'Perempuan' ? '♀' : '♂'}</span>}
                                  </h4>
                                  {isGuest && <small style={{ fontSize: '0.65rem', color: '#999', display: 'block', marginTop: '2px' }}>🔒 Detail Terkunci</small>}
                                </div>
                              </div>
                            </div>
                          );

                          return grouped.map((group, gIdx) => {
                            if (group.type === 'single') {
                              return renderMemberCard(group.members[0]);
                            } else {
                              return (
                                <div key={`couple-${gIdx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(217, 119, 87, 0.05)', padding: '0.5rem', borderRadius: '16px', border: '1px dashed rgba(217, 119, 87, 0.4)' }}>
                                  {renderMemberCard(group.members[0])}
                                  <div style={{ fontSize: '1.2rem', padding: '0 0.2rem', opacity: 0.8 }}>💍</div>
                                  {renderMemberCard(group.members[1])}
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>
                      {/* Konektor CSS Lama dihapus karena digantikan SVG Cerdas */}
                      {index < visibleTreeData.length - 1 && (
                        <div style={{ height: '30px' }}></div>
                      )}
                    </div>
                  );
                })}
                </div>
              </TransformComponent>
            </React.Fragment>
          )}
        </TransformWrapper>
      </div>
      
      <div className="action-row" style={{ position: 'fixed', bottom: '15px', left: '15px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
        {!isGuest && (
          <button className="btn-primary add-member-btn" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Anggota Baru
          </button>
        )}
        {!isGuest && (
          <button className="btn-secondary" onClick={handleExportData} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-white)' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Unduh Cadangan
          </button>
        )}
        <button className="btn-secondary" onClick={handleExportImage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-white)' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Cetak Silsilah (JPG)
        </button>
      </div>
      

      


      {/* Modal / Pop-up Form */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingMember ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            {aiError && (
              <div style={{ padding: '1rem', background: '#FEF2F2', borderLeft: '4px solid #EF4444', marginBottom: '1rem', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <p style={{ margin: 0, color: '#991B1B', fontSize: '0.9rem', lineHeight: 1.4 }}>{aiError}</p>
              </div>
            )}

            <form onSubmit={handleSaveMember} className="modal-form">
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Masukkan nama..."
                  required
                />
              </div>

              {!editingMember && (
                <React.Fragment>
                  <div className="form-group">
                    <label>Anggota Rujukan (Keluarga yang sudah ada)</label>
                    <select value={referenceMemberId} onChange={(e) => setReferenceMemberId(e.target.value)} required>
                      {allMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Hubungan dengan Rujukan</label>
                    <select value={relationType} onChange={(e) => setRelationType(e.target.value)} required>
                      <option value="Suami">Suami dari Rujukan</option>
                      <option value="Istri">Istri dari Rujukan</option>
                      <option value="Anak">Anak dari Rujukan</option>
                      <option value="Ayah">Ayah dari Rujukan</option>
                      <option value="Ibu">Ibu dari Rujukan</option>
                      <option value="Saudara">Saudara Kandung Rujukan</option>
                    </select>
                  </div>
                </React.Fragment>
              )}

              {editingMember && (
                <div className="form-group">
                  <label>Relasi / Status (Bisa diedit manual)</label>
                  <input 
                    type="text" 
                    value={relationType} 
                    onChange={(e) => setRelationType(e.target.value)} 
                    placeholder="Contoh: Suami, Anak Pertama"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Status Kehidupan</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="Hidup">Masih Hidup</option>
                  <option value="Meninggal">Telah Meninggal</option>
                </select>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={newGender} onChange={(e) => setNewGender(e.target.value)}>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Catatan Singkat (Opsional)</label>
                <textarea 
                  value={newNote} 
                  onChange={(e) => setNewNote(e.target.value)} 
                  placeholder="Contoh: Lahir di Solo, 1950. Hobi berkebun."
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              
              <div className="form-group">
                <label>Foto Profil (Kamera / Galeri)</label>
                {!canEditPhoto ? (
                  <small style={{ color: 'red', display: 'block', padding: '0.5rem', background: '#FEF2F2', borderRadius: '4px' }}>
                    ⛔ Level akses Anda saat ini ({role}) tidak diizinkan untuk mengunggah atau mengubah foto profil.
                  </small>
                ) : (
                  <React.Fragment>
                    <input 
                      type="file" 
                      accept="image/*"
                      capture="user"
                      onChange={handleImageUpload} 
                      style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    />
                    {newCustomAvatar && (
                      <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center' }}>
                        <img src={newCustomAvatar} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
                        <button type="button" onClick={() => setNewCustomAvatar('')} style={{ marginLeft: '1rem', color: '#EF4444', background: 'none', border: '1px solid #EF4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Hapus Foto</button>
                      </div>
                    )}
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '6px', display: 'block' }}>
                      Kosongkan untuk menampilkan siluet bawaan. Anda dapat memotret langsung dari kamera HP.
                    </small>
                  </React.Fragment>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isAiLoading}>
                  {isAiLoading ? 'Memvalidasi...' : (editingMember ? 'Simpan Perubahan' : 'Simpan Anggota')}
                </button>
                {(editingMember && canDelete) && (
                  <button 
                    type="button" 
                    onClick={handleDeleteMember} 
                    style={{ 
                      padding: '0.8rem 1.2rem', 
                      background: '#EF4444', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 'var(--radius-full)', 
                      cursor: 'pointer', 
                      fontWeight: '600',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    Hapus
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
