import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Menu, 
  Clock, 
  FileText,
  Check,
  X,
  Settings,
  Archive,
  Star,
  LayoutGrid,
  Pin,
  Type,
  Bold,
  Italic,
  Underline,
  Highlighter,
  Bell,
  Palette,
  Tag,
  Download,
  Upload,
  AlertCircle,
  Folder,
  ShieldCheck,
  Scale,
  Copyright,
  Share2,
  Undo,
  Redo,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Preferences } from '@capacitor/preferences';
import { Toast } from '@capacitor/toast';
import { Share } from '@capacitor/share';
import { cn } from './lib/utils';
import { Note, AppSettings } from './types';

const COLORS = [];

const TEXT_COLORS = [
  '#000000', '#4B5563', '#9CA3AF', '#D1D5DB', 
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'
];

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-app-bg"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-app-card shadow-2xl shadow-app-text/10 border border-app-border">
        <FileText className="text-app-text w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.5} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-app-text">X NOTES</h1>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: 40 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-4 h-1 rounded-full bg-app-text"
      />
    </motion.div>
  </motion.div>
);

const NoteCard = ({ note, onClick, onDelete, onToggleFavorite }: { 
  note: Note, 
  onClick: () => void, 
  onDelete: (e: React.MouseEvent) => void, 
  onToggleFavorite: (e: React.MouseEvent) => void,
  key?: string 
}) => (
  <motion.div
    layoutId={note.id}
    onClick={onClick}
    className={cn(
      "group relative flex flex-col p-4 sm:p-6 transition-all hover:bg-app-accent cursor-pointer border border-app-border rounded-2xl bg-app-card shadow-sm hover:shadow-md"
    )}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="line-clamp-1 font-bold text-app-text uppercase tracking-wider text-xs sm:text-sm">
        {note.title || 'Untitled'}
      </h3>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleFavorite}
          className={cn(
            "p-1 transition-colors",
            note.isFavorite ? "text-amber-400" : "text-app-muted hover:text-app-text"
          )}
        >
          <Star size={16} fill={note.isFavorite ? "currentColor" : "none"} />
        </button>
        <div className="flex gap-2">
          {note.isPinned && <div className="w-1.5 h-1.5 rounded-full bg-app-text" />}
        </div>
      </div>
    </div>
    <p className="line-clamp-2 text-[10px] sm:text-xs leading-relaxed text-app-muted font-medium">
      {note.content || 'No content'}
    </p>
    {note.category && (
      <div className="mt-4 flex">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-app-muted">
          {note.category}
        </span>
      </div>
    )}
    <div className="mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-app-muted/60">
      <div className="flex items-center gap-1.5">
        {format(note.updatedAt, 'MMM d, h:mm a')}
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:text-rose-500"
      >
        <Trash2 size={12} />
      </button>
    </div>
  </motion.div>
);

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [customTabs, setCustomTabs] = useState<string[]>(['Workspace', 'Personal', 'Ideas', 'Projects']);

  // Undo/Redo History
  const [history, setHistory] = useState<Note[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // Theme and Legal States
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [activeLegalPage, setActiveLegalPage] = useState<'none' | 'privacy' | 'terms' | 'license' | 'themes'>('none');
  const [activeMainPage, setActiveMainPage] = useState<'home' | 'favorites' | 'archived'>('home');
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false);
  const [isSearchPageOpen, setIsSearchPageOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ autoSave: false });
  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const triggerResize = () => {
    if (contentRef.current) {
      contentRef.current.style.height = '0px';
      const scrollHeight = contentRef.current.scrollHeight;
      contentRef.current.style.height = `${scrollHeight}px`;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (!isEditing) return;

    // Initial resize attempts to catch the layout after animations
    const t1 = setTimeout(triggerResize, 0);
    const t2 = setTimeout(triggerResize, 100);
    const t3 = setTimeout(triggerResize, 300);
    const t4 = setTimeout(triggerResize, 500);
    
    triggerResize();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [currentNote?.content, currentNote?.fontSize, isEditing, currentNote?.id]);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Load notes and tabs from Capacitor Preferences
  useEffect(() => {
    const loadData = async () => {
      try {
        const { value: notesValue } = await Preferences.get({ key: 'notes' });
        if (notesValue) {
          const loadedNotes = JSON.parse(notesValue);
          if (Array.isArray(loadedNotes)) setNotes(loadedNotes);
        }
        
        const { value: tabsValue } = await Preferences.get({ key: 'customTabs' });
        if (tabsValue) {
          let loadedTabs: string[] = JSON.parse(tabsValue);
          loadedTabs = loadedTabs.filter(t => t.toLowerCase() !== 'home');
          if (!loadedTabs.includes('Ideas')) loadedTabs.push('Ideas');
          if (!loadedTabs.includes('Projects')) loadedTabs.push('Projects');
          setCustomTabs(loadedTabs);
        }
        
        const { value: settingsValue } = await Preferences.get({ key: 'appSettings' });
        if (settingsValue) {
          setAppSettings(JSON.parse(settingsValue));
        }
        
        const { value: themeValue } = await Preferences.get({ key: 'theme' });
        if (themeValue) {
          setTheme(themeValue as 'light' | 'dark' | 'system');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        // Ensure state updates are processed before enabling saving
        setTimeout(() => setIsLoading(false), 100);
        setTimeout(() => setShowSplash(false), 2000);
      }
    };
    loadData();
  }, []);

  // Handle history tracking
  useEffect(() => {
    if (isEditing && currentNote && !isUndoRedoAction) {
      const timer = setTimeout(() => {
        setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          const last = newHistory[newHistory.length - 1];
          
          if (last && last.title === currentNote.title && last.content === currentNote.content) {
            return prev;
          }
          
          const updatedHistory = [...newHistory, { ...currentNote }];
          setHistoryIndex(updatedHistory.length - 1);
          return updatedHistory;
        });
      }, 500);
      return () => clearTimeout(timer);
    }
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
    }
  }, [currentNote?.title, currentNote?.content, isEditing]);

  // Reset history when starting to edit a new/different note
  useEffect(() => {
    if (isEditing && currentNote) {
      setHistory([{ ...currentNote }]);
      setHistoryIndex(0);
    } else {
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [isEditing]);

  // Save notes and tabs to Capacitor Preferences
  useEffect(() => {
    if (isLoading) return;

    const saveData = async () => {
      try {
        await Preferences.set({
          key: 'notes',
          value: JSON.stringify(notes),
        });
        await Preferences.set({
          key: 'customTabs',
          value: JSON.stringify(customTabs),
        });
        await Preferences.set({
          key: 'appSettings',
          value: JSON.stringify(appSettings),
        });
        await Preferences.set({
          key: 'theme',
          value: theme,
        });
      } catch (error) {
        console.error('Failed to save data:', error);
      }
    };

    const timer = setTimeout(saveData, 500);
    return () => clearTimeout(timer);
  }, [notes, customTabs, appSettings, theme, isLoading]);

  const { pinnedNotes, unpinnedNotes } = useMemo(() => {
    const filtered = [...notes].filter(n => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          n.title.toLowerCase().includes(query) || 
          n.content.toLowerCase().includes(query) ||
          n.category?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // If search page is open, show all matching notes (including archived/favorites)
      if (isSearchPageOpen) return true;

      if (activeMainPage === 'favorites') return !!n.isFavorite && !n.isArchived;
      if (activeMainPage === 'archived') return !!n.isArchived;
      
      const filter = activeFilter.toLowerCase();
      
      // Home view filters
      if (filter === 'all') return !n.isArchived;
      
      // Category filters (custom tabs)
      // Only show if the note's category matches the active filter exactly
      if (n.category?.toLowerCase() === filter) return !n.isArchived;
      
      // If we're on a specific category tab and the note doesn't match, hide it
      return false;
    });

    const pinned = filtered.filter(n => n.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
    const unpinned = filtered.filter(n => !n.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);

    return { pinnedNotes: pinned, unpinnedNotes: unpinned };
  }, [notes, activeFilter, activeMainPage, searchQuery]);

  // Auto-save effect
  useEffect(() => {
    if (isEditing && currentNote && appSettings.autoSave && !currentNote.isReadMode) {
      const timer = setTimeout(() => {
        setNotes(prev => {
          const exists = prev.find(n => n.id === currentNote.id);
          if (exists) {
            return prev.map(n => n.id === currentNote.id ? { ...currentNote, updatedAt: Date.now() } : n);
          }
          return [{ ...currentNote, updatedAt: Date.now() }, ...prev];
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentNote, isEditing, appSettings.autoSave]);

  const sortedNotes = useMemo(() => [...pinnedNotes, ...unpinnedNotes], [pinnedNotes, unpinnedNotes]);

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const newTabs = [...customTabs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newTabs.length) {
      [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
      setCustomTabs(newTabs);
    }
  };

  const handleAddCategory = () => {
    if (newTabName.trim() && !customTabs.includes(newTabName.trim())) {
      setCustomTabs(prev => [...prev, newTabName.trim()]);
      setNewTabName('');
    }
  };

  const handleDeleteCategory = (tab: string) => {
    setCustomTabs(prev => prev.filter(t => t !== tab));
  };

  const handleExportNote = (note: Note) => {
    const blob = new Blob([note.content.replace(/<[^>]*>/g, '')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Untitled'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareNote = async (note: Note) => {
    try {
      await Share.share({
        title: note.title || 'Note',
        text: note.content,
        dialogTitle: 'Share this note',
      });
    } catch (error) {
      console.error('Error sharing note:', error);
      Toast.show({ text: 'Sharing failed or not supported' });
    }
  };

  const handleImportNote = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const title = file.name.replace('.txt', '');
      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content: content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        color: COLORS[0],
      };
      setNotes(prev => [newNote, ...prev]);
    };
    reader.readAsText(file);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: COLORS[0],
    };
    setCurrentNote(newNote);
    setIsEditing(true);
    setIsSettingsOpen(false);
    setIsMenuOpen(false);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setIsUndoRedoAction(true);
      setHistoryIndex(prevIndex);
      setCurrentNote({ ...history[prevIndex] });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setIsUndoRedoAction(true);
      setHistoryIndex(nextIndex);
      setCurrentNote({ ...history[nextIndex] });
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
    if (currentNote?.id === id) {
      setCurrentNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote({ ...note });
    setIsEditing(true);
    setIsSettingsOpen(false);
  };

  const handleCloseEditor = () => {
    setIsEditing(false);
    setIsSettingsOpen(false);
    setCurrentNote(null);
  };

  const handleSaveNote = () => {
    if (!currentNote) return;

    const isContentEmpty = !currentNote.content.trim();
    const isTitleEmpty = !currentNote.title.trim();

    if (isTitleEmpty && isContentEmpty) {
      setIsEditing(false);
      setCurrentNote(null);
      return;
    }

    const updatedNote = {
      ...currentNote,
      updatedAt: Date.now(),
    };

    setNotes(prev => {
      const exists = prev.find(n => n.id === updatedNote.id);
      if (exists) {
        return prev.map(n => n.id === updatedNote.id ? updatedNote : n);
      }
      return [updatedNote, ...prev];
    });

    setIsEditing(false);
    setIsSettingsOpen(false);
    setCurrentNote(null);
    
    // Show native device toast
    Toast.show({
      text: 'Note Saved',
      duration: 'short',
      position: 'bottom'
    });
  };

  const handleDeleteNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (currentNote?.id === id) {
      setIsEditing(false);
      setIsSettingsOpen(false);
      setCurrentNote(null);
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex h-screen flex-col bg-app-bg font-sans text-app-text">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* Sidebar Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] sm:w-[300px] bg-app-card shadow-2xl overflow-hidden flex flex-col border-r border-app-border"
            >
              {/* Drawer Header */}
              <div className="px-4 sm:px-6 pt-10 sm:pt-12 pb-4 sm:pb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-app-text">X NOTES</h2>
                    <span className="text-[10px] sm:text-xs font-medium text-app-muted mt-0.5">Workspace</span>
                  </div>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-full p-2 text-app-muted hover:bg-app-accent transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Drawer Items */}
              <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
                <button
                  onClick={() => {
                    setActiveMainPage('home');
                    setActiveFilter('All');
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-4 h-14 px-6 text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeMainPage === 'home' && activeFilter === 'All'
                      ? "bg-app-text text-app-bg" 
                      : "text-app-muted hover:bg-app-accent active:bg-app-accent/50"
                  )}
                >
                  <FileText size={20} strokeWidth={2.5} />
                  All Notes
                </button>

                {[
                  { icon: Star, label: 'Favorites', page: 'favorites' as const },
                  { icon: Archive, label: 'Archive', page: 'archived' as const },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveMainPage(item.page);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-4 h-14 px-6 text-[10px] font-bold uppercase tracking-widest transition-all",
                      activeMainPage === item.page 
                        ? "bg-app-text text-app-bg" 
                        : "text-app-muted hover:bg-app-accent active:bg-app-accent/50"
                    )}
                  >
                    <item.icon size={20} strokeWidth={2.5} />
                    {item.label}
                  </button>
                ))}

                <button 
                  onClick={() => {
                    setIsGlobalSettingsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-4 h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-app-muted hover:bg-app-accent active:bg-app-accent/50 transition-all"
                >
                  <Settings size={20} />
                  App Settings
                </button>

                <div className="my-4 border-t border-app-border" />

                {[
                  { icon: Palette, label: 'Themes', page: 'themes' as const },
                  { icon: ShieldCheck, label: 'Privacy Policy', page: 'privacy' as const },
                  { icon: Scale, label: 'Terms of Service', page: 'terms' as const },
                  { icon: Copyright, label: 'License', page: 'license' as const },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveLegalPage(item.page);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-4 h-14 px-6 text-[10px] font-bold uppercase tracking-widest text-app-muted hover:bg-app-accent active:bg-app-accent/50 transition-all"
                  >
                    <item.icon size={20} strokeWidth={2.5} />
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Drawer Footer (Optional) */}
              <div className="p-6 text-[10px] text-app-muted font-medium uppercase tracking-widest">
                v1.0.0
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key={activeMainPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Header / Nav - Unified color with status bar */}
            <header className="safe-area-top border-b border-app-border bg-app-bg px-4 sm:px-6 pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  {activeMainPage !== 'home' && (
                    <button 
                      onClick={() => setActiveMainPage('home')}
                      className="rounded-full p-2 text-app-muted hover:bg-app-accent"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-app-text">
                    {activeMainPage === 'home' ? 'X NOTES' : 
                     activeMainPage === 'favorites' ? 'FAVORITES' : 'ARCHIVE'}
                  </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {activeMainPage === 'home' && (
                    <button 
                      onClick={handleCreateNote}
                      className="flex items-center gap-2 rounded-[5px] bg-app-text px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-app-bg shadow-lg transition-transform active:scale-95"
                    >
                      <Plus className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      New Note
                    </button>
                  )}
                  <button 
                    onClick={() => setIsSearchPageOpen(true)}
                    className="rounded-full p-2 text-app-muted hover:bg-app-accent"
                  >
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="rounded-full p-2 text-app-muted hover:bg-app-accent"
                  >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              {activeMainPage === 'home' && (
                <div className="mt-4 sm:mt-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar flex-1">
                    <button
                      onClick={() => setActiveFilter('All')}
                      className={cn(
                        "pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap",
                        activeFilter === 'All' 
                          ? "text-app-text border-app-text" 
                          : "text-app-muted border-transparent hover:text-app-text"
                      )}
                    >
                      all
                    </button>
                    {customTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveFilter(tab)}
                        className={cn(
                          "pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap",
                          activeFilter === tab 
                            ? "text-app-text border-app-text" 
                            : "text-app-muted border-transparent hover:text-app-text"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsAddTabModalOpen(true)}
                    className="pb-2 text-app-muted hover:text-app-text transition-colors shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </header>

            {/* Notes List */}
            <main className="flex-1 overflow-y-auto px-6 py-6">
              {sortedNotes.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-app-muted">
                  <LayoutGrid size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">
                    {activeMainPage === 'favorites' ? 'No favorites yet' : 
                     activeMainPage === 'archived' ? 'Archive is empty' : 'No notes yet'}
                  </p>
                  <p className="mt-1 text-sm opacity-60">
                    {activeMainPage === 'favorites' ? 'Star a note to see it here' : 
                     activeMainPage === 'archived' ? 'Archived notes will appear here' : 'Tap "New Note" to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {pinnedNotes.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-app-muted px-1">
                        Pinned Notes
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pinnedNotes.map((note) => (
                          <NoteCard 
                            key={note.id} 
                            note={note} 
                            onClick={() => handleEditNote(note)}
                            onDelete={(e) => handleDeleteNote(note.id, e)}
                            onToggleFavorite={(e) => handleToggleFavorite(note.id, e)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {unpinnedNotes.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-app-muted px-1">
                        Notes
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {unpinnedNotes.map((note) => (
                          <NoteCard 
                            key={note.id} 
                            note={note} 
                            onClick={() => handleEditNote(note)}
                            onDelete={(e) => handleDeleteNote(note.id, e)}
                            onToggleFavorite={(e) => handleToggleFavorite(note.id, e)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
          </motion.div>
        ) : isSettingsOpen ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex flex-1 flex-col overflow-hidden bg-app-bg"
          >
            {/* Settings Header */}
            <header className="safe-area-top flex items-center gap-4 px-4 pb-4 border-b border-app-border">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-full p-2 text-app-muted hover:bg-app-accent transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <h2 className="text-xl font-bold text-app-text">Note Settings</h2>
            </header>

            <main className="flex-1 px-6 py-4 space-y-8 overflow-y-auto">
              <section className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">Visibility & Priority</div>
                
                {/* Pin Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-base font-medium text-app-text">Pin Note</p>
                    <p className="text-xs text-app-muted">Keep at the top of the list</p>
                  </div>
                  <button
                    onClick={() => setCurrentNote(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      currentNote?.isPinned ? "bg-app-text" : "bg-app-accent"
                    )}
                  >
                    <motion.div 
                      animate={{ x: currentNote?.isPinned ? 20 : 0 }}
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-colors",
                        currentNote?.isPinned ? "bg-app-bg" : "bg-app-muted"
                      )} 
                    />
                  </button>
                </div>

                {/* Favorite Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-base font-medium text-app-text">Favorite</p>
                    <p className="text-xs text-app-muted">
                      {currentNote?.isArchived ? "Remove from Archive to favorite" : "Add to favorites list"}
                    </p>
                  </div>
                  <button
                    disabled={currentNote?.isArchived}
                    onClick={() => setCurrentNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      currentNote?.isFavorite ? "bg-amber-400" : "bg-app-accent",
                      currentNote?.isArchived && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <motion.div 
                      animate={{ x: currentNote?.isFavorite ? 20 : 0 }}
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-colors",
                        currentNote?.isFavorite ? "bg-app-bg" : "bg-app-muted"
                      )} 
                    />
                  </button>
                </div>

                {/* Archive Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-base font-medium text-app-text">Archive</p>
                    <p className="text-xs text-app-muted">
                      {currentNote?.isFavorite ? "Remove from Favorites to archive" : "Hide from main list"}
                    </p>
                  </div>
                  <button
                    disabled={currentNote?.isFavorite}
                    onClick={() => setCurrentNote(prev => prev ? { ...prev, isArchived: !prev.isArchived } : null)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      currentNote?.isArchived ? "bg-app-muted" : "bg-app-accent",
                      currentNote?.isFavorite && "opacity-30 cursor-not-allowed"
                    )}
                  >
                    <motion.div 
                      animate={{ x: currentNote?.isArchived ? 20 : 0 }}
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-colors",
                        currentNote?.isArchived ? "bg-app-bg" : "bg-app-muted"
                      )} 
                    />
                  </button>
                </div>

                {/* Read Mode Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-base font-medium text-app-text">Read Mode</p>
                    <p className="text-xs text-app-muted">Disable editing for this note</p>
                  </div>
                  <button
                    onClick={() => setCurrentNote(prev => prev ? { ...prev, isReadMode: !prev.isReadMode } : null)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      currentNote?.isReadMode ? "bg-indigo-500" : "bg-app-accent"
                    )}
                  >
                    <motion.div 
                      animate={{ x: currentNote?.isReadMode ? 20 : 0 }}
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-colors",
                        currentNote?.isReadMode ? "bg-white" : "bg-app-muted"
                      )} 
                    />
                  </button>
                </div>
              </section>

              <div className="h-px bg-app-border" />

              <section className="space-y-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">Typography & Style</div>

                {/* Font Size */}
                <div className="space-y-3">
                  <p className="text-base font-medium text-app-text">Font Size</p>
                  <div className="flex gap-2">
                    {(['sm', 'base', 'lg', 'xl', '2xl'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setCurrentNote(prev => prev ? { ...prev, fontSize: size } : null)}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all border",
                          (currentNote?.fontSize || 'base') === size 
                            ? "bg-app-text text-app-bg border-app-text" 
                            : "bg-transparent text-app-muted border-app-border hover:border-app-muted/50"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div className="space-y-3">
                  <p className="text-base font-medium text-app-text">Text Color</p>
                  <div className="flex flex-wrap gap-3">
                    {TEXT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCurrentNote(prev => prev ? { ...prev, textColor: color } : null)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-transform active:scale-90",
                          currentNote?.textColor === color ? "border-app-text scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <div className="h-px bg-app-border" />

              <section className="space-y-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">Metadata</div>

                {/* Category */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium text-app-text">Category</p>
                    {currentNote?.category && (
                      <button 
                        onClick={() => setCurrentNote(prev => prev ? { ...prev, category: '' } : null)}
                        className="text-[10px] font-bold text-rose-500 uppercase tracking-widest"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customTabs.filter(t => t.toLowerCase() !== 'home').map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCurrentNote(prev => prev ? { ...prev, category: cat } : null)}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                          currentNote?.category?.toLowerCase() === cat.toLowerCase()
                            ? "bg-app-text text-app-bg border-app-text" 
                            : "bg-transparent text-app-muted border-app-border hover:border-app-muted/50"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Or type custom category..."
                    value={currentNote?.category || ''}
                    onChange={(e) => setCurrentNote(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full bg-transparent border-b border-app-border py-2 text-sm text-app-text focus:outline-none focus:border-app-text transition-colors placeholder:text-app-muted/30"
                  />
                </div>

                {/* Reminder */}
                <div className="space-y-3">
                  <p className="text-base font-medium text-app-text">Reminder</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-app-muted">
                      {currentNote?.reminder ? format(new Date(currentNote.reminder), 'MMM d, yyyy h:mm a') : 'No reminder set'}
                    </p>
                    <button 
                      onClick={() => setIsDatePickerOpen(true)}
                      className="text-sm font-bold text-app-text underline underline-offset-4"
                    >
                      {currentNote?.reminder ? 'Change' : 'Set Reminder'}
                    </button>
                  </div>
                </div>
              </section>

              <div className="h-px bg-app-border" />

              <section className="space-y-4 pb-8">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">Actions</div>

                <button
                  onClick={() => currentNote && handleExportNote(currentNote)}
                  className="w-full flex items-center justify-between py-4 text-app-text border-b border-app-border"
                >
                  <span className="text-base font-medium">Export as .txt</span>
                </button>

                <button
                  onClick={() => currentNote && handleShareNote(currentNote)}
                  className="w-full flex items-center justify-between py-4 text-app-text border-b border-app-border"
                >
                  <span className="text-base font-medium">Share Note</span>
                  <Share2 size={20} className="text-app-muted" />
                </button>

                <label className="w-full flex items-center justify-between py-4 text-app-text cursor-pointer border-b border-app-border">
                  <span className="text-base font-medium">Import .txt</span>
                  <input type="file" accept=".txt" onChange={handleImportNote} className="hidden" />
                </label>

                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full flex items-center justify-between py-4 text-rose-500"
                >
                  <span className="text-base font-medium">Delete Note</span>
                </button>
              </section>
            </main>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onAnimationComplete={triggerResize}
            className="flex flex-1 flex-col overflow-hidden bg-app-bg"
          >
            {/* Editor Header */}
            <header className="safe-area-top flex items-center justify-between px-4 pb-4 border-b border-app-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={appSettings.autoSave || currentNote?.isReadMode ? handleSaveNote : handleCloseEditor}
                  className="rounded-full p-2 text-app-muted hover:bg-app-accent"
                  title={appSettings.autoSave ? "Save & Back" : "Back without saving"}
                >
                  <ChevronLeft size={28} />
                </button>
                {!currentNote?.isReadMode && (
                  <div className="flex items-center bg-app-accent rounded-full px-2 py-1">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-2 text-app-muted hover:text-app-text disabled:opacity-20 disabled:hover:text-app-muted transition-colors"
                      title="Undo"
                    >
                      <Undo size={18} />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="p-2 text-app-muted hover:text-app-text disabled:opacity-20 disabled:hover:text-app-muted transition-colors"
                      title="Redo"
                    >
                      <Redo size={18} />
                    </button>
                  </div>
                )}
                {currentNote?.isReadMode && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    <ShieldCheck size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Read Mode</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!currentNote?.isReadMode && (
                  <button
                    onClick={handleSaveNote}
                    className="rounded-full bg-app-text px-6 py-2 text-sm font-bold text-app-bg hover:opacity-90 transition-all active:scale-95"
                  >
                    Save
                  </button>
                )}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="rounded-full p-2 text-app-muted hover:bg-app-accent transition-colors"
                >
                  <Settings size={22} />
                </button>
              </div>
            </header>

            {/* Editor Body */}
            <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6 sm:pb-8 pt-4 sm:pt-6 no-scrollbar">
              <input
                autoFocus
                type="text"
                placeholder="Title"
                readOnly={currentNote?.isReadMode}
                value={currentNote?.title || ''}
                onChange={(e) => setCurrentNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                className={cn(
                  "mb-4 sm:mb-6 w-full bg-transparent text-2xl sm:text-3xl font-black text-app-text placeholder:text-app-muted/30 focus:outline-none",
                  currentNote?.isReadMode && "cursor-default"
                )}
              />
              <textarea
                ref={contentRef}
                autoFocus={!currentNote?.title}
                placeholder="Write something brilliant..."
                readOnly={currentNote?.isReadMode}
                value={currentNote?.content || ''}
                onChange={(e) => setCurrentNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                style={{ 
                  color: currentNote?.textColor || 'inherit',
                  fontSize: currentNote?.fontSize === 'sm' ? '0.75rem' : 
                            currentNote?.fontSize === 'lg' ? '1rem' :
                            currentNote?.fontSize === 'xl' ? '1.125rem' :
                            currentNote?.fontSize === '2xl' ? '1.25rem' : '0.875rem'
                }}
                className={cn(
                  "w-full resize-none bg-transparent leading-relaxed text-app-text placeholder:text-app-muted/30 focus:outline-none overflow-hidden",
                  currentNote?.isReadMode && "cursor-default"
                )}
              />
            </main>

            {/* Toolbar removed for reliability */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Tab Modal */}
      <AnimatePresence>
        {isAddTabModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddTabModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[280px] sm:max-w-sm overflow-hidden rounded-2xl sm:rounded-3xl bg-app-card p-6 sm:p-8 shadow-2xl border border-app-border"
            >
              <h2 className="text-lg sm:text-xl font-bold text-app-text mb-2 uppercase tracking-widest">Add New Tab</h2>
              <p className="text-xs sm:text-sm text-app-muted mb-4 sm:mb-6">Enter a name for your new navigation tab.</p>
              
              <input
                autoFocus
                type="text"
                placeholder="Tab name..."
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTabName.trim()) {
                    const tab = newTabName.trim().toLowerCase();
                    if (!customTabs.includes(tab)) {
                      setCustomTabs(prev => [...prev, tab]);
                    }
                    setActiveFilter(tab);
                    setNewTabName('');
                    setIsAddTabModalOpen(false);
                  }
                }}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-app-text placeholder:text-app-muted/50 focus:outline-none focus:border-app-text mb-4 sm:mb-6 text-xs sm:text-sm"
              />

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setIsAddTabModalOpen(false)}
                  className="flex-1 rounded-xl bg-app-accent py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-app-text hover:bg-app-muted/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newTabName.trim()) {
                      const tab = newTabName.trim().toLowerCase();
                      if (!customTabs.includes(tab)) {
                        setCustomTabs(prev => [...prev, tab]);
                      }
                      setActiveFilter(tab);
                      setNewTabName('');
                      setIsAddTabModalOpen(false);
                    }
                  }}
                  className="flex-1 rounded-xl bg-app-text py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-app-bg hover:opacity-90 transition-colors"
                >
                  Add Tab
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Date Picker Modal */}
      <AnimatePresence>
        {isDatePickerOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDatePickerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[280px] sm:max-w-sm bg-app-card shadow-2xl border border-app-border overflow-hidden rounded-2xl sm:rounded-3xl"
            >
              <div className="p-4 sm:p-6">
                <h3 className="mb-4 sm:mb-6 text-base sm:text-lg font-bold text-app-text uppercase tracking-widest">Set Reminder</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-app-muted uppercase tracking-widest">Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={currentNote?.reminder || ''}
                      onChange={(e) => setCurrentNote(prev => prev ? { ...prev, reminder: e.target.value } : null)}
                      className="w-full bg-app-bg border border-app-border px-3 sm:px-4 py-2 sm:py-3 text-app-text focus:outline-none focus:border-app-text text-xs sm:text-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <div className="flex border-t border-app-border">
                <button
                  onClick={() => {
                    setCurrentNote(prev => prev ? { ...prev, reminder: undefined } : null);
                    setIsDatePickerOpen(false);
                  }}
                  className="flex-1 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-app-muted uppercase tracking-widest hover:bg-app-accent transition-colors border-r border-app-border"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsDatePickerOpen(false)}
                  className="flex-1 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-app-text uppercase tracking-widest hover:bg-app-accent transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[280px] sm:max-w-sm bg-app-card shadow-2xl border border-app-border overflow-hidden rounded-2xl sm:rounded-3xl"
            >
              <div className="p-6 sm:p-8">
                <h3 className="mb-2 text-lg sm:text-xl font-bold text-app-text uppercase tracking-widest">Delete Note?</h3>
                <p className="text-xs sm:text-sm text-app-muted leading-relaxed">This action is permanent and cannot be undone.</p>
              </div>
              <div className="flex border-t border-app-border">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-app-muted uppercase tracking-widest hover:bg-app-accent transition-colors border-r border-app-border"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (currentNote) {
                      handleDeleteNote(currentNote.id);
                      setIsDeleteModalOpen(false);
                    }
                  }}
                  className="flex-1 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGlobalSettingsOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[400] bg-app-bg flex flex-col"
          >
            <header className="safe-area-top flex items-center gap-4 px-4 pb-4 border-b border-app-border">
              <button
                onClick={() => setIsGlobalSettingsOpen(false)}
                className="rounded-full p-2 text-app-muted hover:bg-app-accent transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
              <h2 className="text-xl font-bold text-app-text uppercase tracking-widest">App Settings</h2>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 no-scrollbar">
              <section className="space-y-4 sm:space-y-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">General</div>
                
                {/* Auto Save Toggle */}
                <div className="flex items-center justify-between py-2 sm:py-3">
                  <div>
                    <p className="text-sm sm:text-base font-medium text-app-text">Auto Save</p>
                    <p className="text-[10px] sm:text-xs text-app-muted">Save notes automatically as you type</p>
                  </div>
                  <button
                    onClick={() => setAppSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      appSettings.autoSave ? "bg-indigo-500" : "bg-app-accent"
                    )}
                  >
                    <motion.div 
                      animate={{ x: appSettings.autoSave ? 20 : 0 }}
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-colors",
                        appSettings.autoSave ? "bg-white" : "bg-app-muted"
                      )} 
                    />
                  </button>
                </div>

                {/* Category Settings Link */}
                <button
                  onClick={() => setIsCategorySettingsOpen(true)}
                  className="w-full flex items-center justify-between py-3 sm:py-4 text-app-text border-b border-app-border"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm sm:text-base font-medium">Category Settings</span>
                    <span className="text-[10px] sm:text-xs text-app-muted">Manage and reorder categories</span>
                  </div>
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-app-muted" />
                </button>

                <div className="p-4 rounded-2xl bg-app-accent/50 border border-app-border">
                  <div className="flex gap-3 text-app-muted">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-xs leading-relaxed">
                      When Auto Save is <span className="font-bold text-app-text">OFF</span>, you must manually tap "Save" in the editor. Unsaved changes will be lost if you exit without saving.
                    </p>
                  </div>
                </div>
              </section>

              <div className="h-px bg-app-border" />

              <section className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">About</div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-app-text">X NOTES</p>
                  <p className="text-xs text-app-muted">Version 1.0.0</p>
                </div>
              </section>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeLegalPage !== 'none' && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[300] bg-app-bg flex flex-col"
          >
            <header className="safe-area-top flex items-center gap-4 px-4 pb-4 border-b border-app-border">
              <button
                onClick={() => setActiveLegalPage('none')}
                className="rounded-full p-2 text-app-muted hover:bg-app-accent transition-colors"
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-app-text uppercase tracking-widest">
                {activeLegalPage === 'themes' ? 'Themes' : 
                 activeLegalPage === 'privacy' ? 'Privacy Policy' :
                 activeLegalPage === 'terms' ? 'Terms of Service' : 'License'}
              </h2>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
              {activeLegalPage === 'themes' ? (
                <div className="space-y-8">
                  <p className="text-sm text-app-muted uppercase tracking-widest font-bold">Appearance</p>
                  <div className="space-y-4">
                    {[
                      { id: 'light', label: 'Light', icon: Palette },
                      { id: 'dark', label: 'Dark', icon: Palette },
                      { id: 'system', label: 'System', icon: Settings },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id as any)}
                        className={cn(
                          "w-full flex items-center justify-between p-6 rounded-2xl border transition-all",
                          theme === t.id 
                            ? "bg-app-text text-app-bg border-app-text" 
                            : "bg-app-card text-app-muted border-app-border hover:border-app-muted/50"
                        )}
                      >
                        <span className="font-bold uppercase tracking-widest text-xs">{t.label}</span>
                        {theme === t.id && <Check size={18} />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-none">
                  {activeLegalPage === 'privacy' && (
                    <div className="space-y-6 text-app-muted leading-relaxed">
                      <h3 className="text-app-text text-lg font-bold">Privacy Policy</h3>
                      <p>Your privacy is important to us. It is X NOTES' policy to respect your privacy regarding any information we may collect from you across our website and other sites we own and operate.</p>
                      <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
                      <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>
                    </div>
                  )}
                  {activeLegalPage === 'terms' && (
                    <div className="space-y-6 text-app-muted leading-relaxed">
                      <h3 className="text-app-text text-lg font-bold">Terms of Service</h3>
                      <p>By accessing the app at X NOTES, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
                      <p>The materials contained in this app are protected by applicable copyright and trademark law.</p>
                      <h4 className="text-app-text font-bold mt-8">Use License</h4>
                      <p>Permission is granted to temporarily download one copy of the materials (information or software) on X NOTES' app for personal, non-commercial transitory viewing only.</p>
                    </div>
                  )}
                  {activeLegalPage === 'license' && (
                    <div className="space-y-6 text-app-muted leading-relaxed">
                      <h3 className="text-app-text text-lg font-bold">License</h3>
                      <p>MIT License</p>
                      <p>Copyright (c) 2026 X NOTES</p>
                      <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
                      <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
                    </div>
                  )}
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Settings Page */}
      <AnimatePresence>
        {isCategorySettingsOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[500] bg-app-bg flex flex-col"
          >
            <header className="safe-area-top flex items-center gap-4 px-4 pb-4 border-b border-app-border">
              <button
                onClick={() => setIsCategorySettingsOpen(false)}
                className="rounded-full p-2 text-app-muted hover:bg-app-accent transition-colors"
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-app-text uppercase tracking-widest">Category Settings</h2>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 no-scrollbar">
              <section className="space-y-4 sm:space-y-6">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">Add New Category</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Category name..."
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="flex-1 bg-transparent border-b border-app-border py-2 text-xs sm:text-sm text-app-text focus:outline-none focus:border-app-text transition-colors placeholder:text-app-muted/30"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="bg-app-text text-app-bg px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
              </section>

              <section className="space-y-4 sm:space-y-6">
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-app-muted px-1">Manage Categories</div>
                <div className="space-y-2">
                  {customTabs.map((tab, index) => (
                    <div 
                      key={tab}
                      className="flex items-center justify-between p-3 sm:p-4 bg-app-card rounded-xl sm:rounded-2xl border border-app-border group"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-app-muted/30" />
                        <span className="text-xs sm:text-sm font-medium text-app-text">{tab}</span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                          onClick={() => handleMoveCategory(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 sm:p-2 text-app-muted hover:text-app-text disabled:opacity-20 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={() => handleMoveCategory(index, 'down')}
                          disabled={index === customTabs.length - 1}
                          className="p-1.5 sm:p-2 text-app-muted hover:text-app-text disabled:opacity-20 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(tab)}
                          className="p-1.5 sm:p-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Page */}
      <AnimatePresence>
        {isSearchPageOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[600] bg-app-bg flex flex-col"
          >
            <header className="safe-area-top flex items-center gap-4 px-4 pb-4 border-b border-app-border">
              <button
                onClick={() => {
                  setIsSearchPageOpen(false);
                  setSearchQuery('');
                }}
                className="rounded-full p-2 text-app-muted hover:bg-app-accent transition-colors"
              >
                <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
              <div className="flex-1 relative">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search notes, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent py-2 text-base sm:text-lg text-app-text focus:outline-none placeholder:text-app-muted/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-app-muted hover:text-app-text"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
              {searchQuery.trim() === '' ? (
                <div className="flex h-full flex-col items-center justify-center text-app-muted opacity-40">
                  <Search className="w-12 h-12 sm:w-16 sm:h-16 mb-4" strokeWidth={1} />
                  <p className="text-xs sm:text-sm font-medium uppercase tracking-widest">Start typing to search</p>
                </div>
              ) : sortedNotes.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-app-muted opacity-40">
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 mb-4" strokeWidth={1} />
                  <p className="text-xs sm:text-sm font-medium uppercase tracking-widest">No results found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedNotes.map((note) => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onClick={() => {
                        handleEditNote(note);
                        setIsSearchPageOpen(false);
                      }}
                      onDelete={(e) => handleDeleteNote(note.id, e)}
                      onToggleFavorite={(e) => handleToggleFavorite(note.id, e)}
                    />
                  ))}
                </div>
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {!showSplash && !isEditing && !isSettingsOpen && !isGlobalSettingsOpen && !isCategorySettingsOpen && !isSearchPageOpen && activeLegalPage === 'none' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCreateNote}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] w-12 h-12 sm:w-14 sm:h-14 bg-app-text text-app-bg rounded-full shadow-2xl flex items-center justify-center"
        >
          <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
        </motion.button>
      )}
    </div>
  );
}
