import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, FileText, BookOpen, Users, Tag, Loader2, Sparkles } from 'lucide-react';
import { KnowledgeItem } from '@/types';
import { api } from '@/services/apiClient';

const KnowledgeBase: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<{title: string, content: string, type: 'text' | 'research' | 'meeting'}>({ title: '', content: '', type: 'text' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ data: any[] }>('/api/knowledge');
      const mapped = (response.data || []).map((item: any) => ({
        id: item._id || item.id,
        title: item.title,
        content: item.content,
        type: item.category || 'text',
        tags: item.tags || [],
        dateAdded: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'
      }));
      setItems(mapped);
    } catch (error) {
      console.error("Failed to fetch knowledge items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDuplication = () => {
      const newWords = new Set(newItem.content.toLowerCase().split(/\s+/));
      let maxOverlap = 0;
      let duplicateItem = null;

      items.forEach(item => {
          const itemWords = new Set(item.content.toLowerCase().split(/\s+/));
          const intersection = new Set([...newWords].filter(x => itemWords.has(x)));
          const overlapPercent = intersection.size / Math.max(newWords.size, itemWords.size);
          
          if (overlapPercent > maxOverlap) {
              maxOverlap = overlapPercent;
              duplicateItem = item;
          }
      });

      return { isDuplicate: maxOverlap > 0.8, item: duplicateItem };
  };

  const handleAiAutoFill = async () => {
        if (!newItem.content) return;
        setIsSaving(true);
        try {
            // Predict Category
            const contentLower = newItem.content.toLowerCase();
            let cat: 'text' | 'research' | 'meeting' = 'text';
            if (contentLower.includes('abstract') || contentLower.includes('doi:') || contentLower.includes('methodology')) cat = 'research';
            if (contentLower.includes('agenda') || contentLower.includes('attendees') || contentLower.includes('action items')) cat = 'meeting';
            
            // Ask AI for Title (using write endpoint as a shortcut for summarization)
            const res = await api.post<any>('/api/write', { type: 'shorten', text: newItem.content });
            const rawTitle = res.data?.result || res.result || res || "Semantic Entry";
            const cleanTitle = typeof rawTitle === 'string' ? rawTitle.replace(/[#\*\"\n]/g, '').slice(0, 40) : "Semantic Entry";

            setNewItem(prev => ({ 
                ...prev, 
                title: cleanTitle,
                type: cat
            }));
        } catch (e) {
            console.error(e);
            alert("Semantic Auto-Fill failed. Try again or enter manually.");
        } finally {
            setIsSaving(false);
        }
  };

  const handleAdd = async () => {
    if (!newItem.title || !newItem.content) return;

    // Content Duplication Merger (Warning)
    const { isDuplicate, item } = checkDuplication();
    if (isDuplicate && item) {
        const proceed = window.confirm(`⚠️ Content Duplication Warning!\n\nThis entry is highly identical (over 80% similar) to your existing knowledge item: "${item.title}".\n\nSaving this will create redundant data. Do you want to save it anyway?`);
        if (!proceed) {
            return;
        }
    }

    try {
      setIsSaving(true);
      await api.post('/api/knowledge', {
        title: newItem.title,
        content: newItem.content,
        category: newItem.type
      });
      await fetchItems();
      setNewItem({ title: '', content: '', type: 'text' });
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add knowledge item:", error);
      alert('Failed to save entry. Check backend logs.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.delete(`/api/knowledge/${id}`);
      setItems(items.filter(i => i.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete knowledge item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'research': return <BookOpen size={18} className="text-blue-400" />;
      case 'meeting': return <Users size={18} className="text-amber-400" />;
      default: return <FileText size={18} className="text-emerald-400" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
              <BookOpen size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Knowledge Dataset</h2>
          </div>
          <p className="text-gray-400 max-w-2xl leading-relaxed">Your private library of reference material used to ground NexusAI's generations and provide factual context.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search knowledge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary/50 w-64 transition-all"
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            Add to Dataset
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="glass neon-border rounded-3xl p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-violet-400">
              <Sparkles size={20} />
              <h3 className="text-xl font-bold text-white">New Entry</h3>
            </div>
            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white transition-colors">&times;</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Title</label>
              <input
                type="text"
                placeholder="e.g., Marketing Q3 Strategy"
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
              <select
                value={newItem.type}
                onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="text">General Document</option>
                <option value="research">Research Paper</option>
                <option value="meeting">Meeting Notes</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Content</label>
                <button
                    onClick={handleAiAutoFill}
                    disabled={!newItem.content || isSaving}
                    className="px-4 py-2 bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 rounded-lg text-[10px] uppercase font-bold transition-all flex items-center gap-2 border border-violet-500/20 disabled:opacity-50"
                >
                    <Sparkles size={12} /> Semantic Auto-Vault
                </button>
            </div>
            <textarea
              placeholder="Paste the raw text here... Then click Semantic Auto-Vault to generate the ideal title and category."
              value={newItem.content}
              onChange={e => setNewItem({ ...newItem, content: e.target.value })}
              className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed custom-scrollbar"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Cancel</button>
            <button
              onClick={handleAdd}
              className="px-10 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={!newItem.title || !newItem.content || isSaving}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isSaving ? 'Processing...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full h-80 flex flex-col items-center justify-center bg-white/[0.02] rounded-3xl border border-white/5 border-dashed">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-2 border-primary/20 rounded-full" />
              <div className="absolute top-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 font-medium tracking-wide animate-pulse">Synchronizing your knowledge dataset...</p>
          </div>
        ) : (
          <>
            {filteredItems.map(item => (
              <div key={item.id} className="glass neon-border p-6 rounded-3xl group relative hover:bg-white/[0.07] transition-all flex flex-col min-h-[280px]">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setDeleteConfirm(item.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {getIcon(item.type)}
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.type}</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2 line-clamp-1 pr-6 group-hover:text-violet-400 transition-colors uppercase tracking-tight">{item.title}</h4>
                <p className="text-sm text-gray-400 line-clamp-4 leading-relaxed mb-6 flex-1">{item.content}</p>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] rounded-md border border-violet-500/20 flex items-center gap-1">
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText size={10} />
                    <span>{item.content.split(' ').length} words</span>
                  </div>
                  <span>Added {item.dateAdded}</span>
                </div>

                {deleteConfirm === item.id && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200 z-10">
                    <Trash2 className="text-red-500 mb-4" size={32} />
                    <h5 className="text-white font-bold mb-2">Delete this entry?</h5>
                    <p className="text-xs text-gray-400 mb-6">This action cannot be undone and will remove it from the knowledge dataset.</p>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all text-white border border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold transition-all text-white shadow-lg shadow-red-600/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredItems.length === 0 && !isAdding && (
              <div className="col-span-full h-80 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02] group">
                <div className="p-6 bg-white/5 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-12 h-12 text-gray-600" />
                </div>
                <p className="text-gray-400 font-bold text-lg mb-1">{searchTerm ? 'No matches found' : 'Your library is empty'}</p>
                <p className="text-sm text-gray-600 max-w-xs text-center">
                  {searchTerm ? `We couldn't find anything matching "${searchTerm}" in your dataset.` : 'Seed your private knowledge dataset to ground NexusAI with factual context.'}
                </p>
                {!searchTerm && (
                  <button onClick={() => setIsAdding(true)} className="mt-6 px-8 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-bold transition-all border border-primary/20 shadow-lg shadow-primary/5 active:scale-95">
                    Create Your First Entry
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
