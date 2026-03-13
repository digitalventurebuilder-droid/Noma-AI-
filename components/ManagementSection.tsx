
import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, where, orderBy } from 'firebase/firestore';
import { Modal } from './Modal';
import { FarmFolder, FarmFile, FarmNote, TeamMember } from '../types';

export const ManagementSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FILES' | 'NOTES' | 'TEAM'>('FILES');
  const [folders, setFolders] = useState<FarmFolder[]>([]);
  const [files, setFiles] = useState<FarmFile[]>([]);
  const [notes, setNotes] = useState<FarmNote[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalType, setModalType] = useState<'FOLDER' | 'FILE' | 'NOTE' | 'MEMBER' | null>(null);
  const [formData, setFormData] = useState({ name: '', title: '', content: '', role: '', size: '2 MB' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const baseRef = `users/${user.uid}`;
    
    const unsubFolders = onSnapshot(query(collection(db, `${baseRef}/folders`), orderBy('createdAt', 'desc')), (sn) => {
      setFolders(sn.docs.map(d => ({ id: d.id, ...d.data() } as FarmFolder)));
    });

    const unsubFiles = onSnapshot(query(collection(db, `${baseRef}/files`), orderBy('createdAt', 'desc')), (sn) => {
      setFiles(sn.docs.map(d => ({ id: d.id, ...d.data() } as FarmFile)));
    });

    const unsubNotes = onSnapshot(query(collection(db, `${baseRef}/notes`), orderBy('createdAt', 'desc')), (sn) => {
      setNotes(sn.docs.map(d => ({ id: d.id, ...d.data() } as FarmNote)));
    });

    const unsubTeam = onSnapshot(query(collection(db, `${baseRef}/teamMembers`), orderBy('createdAt', 'desc')), (sn) => {
      setTeam(sn.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)));
      setLoading(false);
    });

    return () => {
      unsubFolders(); unsubFiles(); unsubNotes(); unsubTeam();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      const baseRef = `users/${user.uid}`;
      if (modalType === 'FOLDER') {
        await addDoc(collection(db, `${baseRef}/folders`), { name: formData.name, createdAt: serverTimestamp() });
      } else if (modalType === 'FILE') {
        await addDoc(collection(db, `${baseRef}/files`), { name: formData.name, size: formData.size, createdAt: serverTimestamp() });
      } else if (modalType === 'NOTE') {
        await addDoc(collection(db, `${baseRef}/notes`), { title: formData.title, content: formData.content, createdAt: serverTimestamp() });
      } else if (modalType === 'MEMBER') {
        await addDoc(collection(db, `${baseRef}/teamMembers`), { name: formData.name, role: formData.role, createdAt: serverTimestamp() });
      }
      setModalType(null);
      setFormData({ name: '', title: '', content: '', role: '', size: '2 MB' });
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFiles = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex gap-3">
        <button onClick={() => setModalType('FOLDER')} className="flex-1 py-4 bg-green-50 text-brand-green font-black rounded-2xl border border-green-100 flex items-center justify-center gap-2 hover:bg-green-100 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
          New Folder
        </button>
        <button onClick={() => setModalType('FILE')} className="flex-1 py-4 bg-brand-green text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/10 active:scale-95 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add File
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {folders.length === 0 && files.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold text-sm">Your vault is empty</p>
          </div>
        ) : (
          <>
            {folders.map(f => (
              <div key={f.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                </div>
                <div>
                  <h4 className="font-black text-gray-900">{f.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Folder</p>
                </div>
              </div>
            ))}
            {files.map(f => (
              <div key={f.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-gray-900">{f.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{f.size} • File</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={() => setModalType('NOTE')} className="w-full py-4 bg-brand-green text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/10 active:scale-95 transition-all">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        New Note
      </button>
      {notes.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
          <p className="text-gray-400 font-bold text-sm">No notes yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notes.map(n => (
            <div key={n.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
              <h4 className="font-black text-gray-900 mb-2">{n.title}</h4>
              <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button onClick={() => setModalType('MEMBER')} className="w-full py-4 bg-brand-green text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/10 active:scale-95 transition-all">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        Add Member
      </button>
      {team.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
          <p className="text-gray-400 font-bold text-sm">Team list is empty</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden">
          {team.map((m, i) => (
            <div key={m.id} className={`p-4 flex items-center gap-4 ${i !== team.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-10 h-10 bg-brand-orange text-white rounded-full flex items-center justify-center font-black">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-black text-gray-900 leading-tight">{m.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-5">
      <div className="flex bg-gray-100 p-1.5 rounded-3xl mb-8">
        {(['FILES', 'NOTES', 'TEAM'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === tab ? 'bg-white text-brand-green shadow-sm' : 'text-gray-400'}`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'FILES' && renderFiles()}
      {activeTab === 'NOTES' && renderNotes()}
      {activeTab === 'TEAM' && renderTeam()}

      {/* Modals */}
      <Modal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        title={modalType === 'FOLDER' ? 'New Folder' : modalType === 'FILE' ? 'Add File' : modalType === 'NOTE' ? 'New Note' : 'Add Team Member'}
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {(modalType === 'FOLDER' || modalType === 'FILE' || modalType === 'MEMBER') && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Name</label>
              <input 
                required
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-brand-green/20"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          {modalType === 'NOTE' && (
            <>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Title</label>
                <input 
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-brand-green/20"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Content</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-brand-green/20 h-32 resize-none"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>
            </>
          )}
          {modalType === 'MEMBER' && (
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Role</label>
              <input 
                required
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-brand-green/20"
                value={formData.role}
                placeholder="e.g. Field Manager"
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalType(null)} className="flex-1 py-4 font-black text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-brand-green text-white font-black rounded-2xl shadow-xl shadow-green-900/10 active:scale-95 disabled:opacity-50 transition-all">
              {submitting ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
