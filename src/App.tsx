/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Trash2, 
  Command, 
  Cpu, 
  Zap,
  ChevronRight,
  Plus,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  X,
  Shield,
  Info,
  Palette,
  Image as ImageIcon,
  Paperclip,
  Copy,
  Check,
  Terminal
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Message, sendMessageStream } from './services/geminiService';

interface UserData {
  id: number;
  email: string;
  name: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showSettings, setShowSettings] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'account' | 'appearance' | 'privacy' | 'about' | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    theme: 'helix-dark',
    reducedMotion: false,
    incognito: false,
    twoFactor: false
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setIsGuest(false);
        setShowAuthModal(false);
        setAuthForm({ email: '', password: '', name: '' });
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Server error. Please try again.');
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setUser(null);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setIsGuest(false);
    setMessages([]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading) return;
    if (!user && !isGuest) {
      setShowAuthModal(true);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: Date.now(),
      image: attachedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    const currentImage = attachedImage;
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const history = messages;
      let assistantText = '';
      
      const assistantMessage: Message = {
        role: 'model',
        text: '',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      const stream = sendMessageStream(userMessage.text, history, currentImage || undefined);
      
      for await (const chunk of stream) {
        assistantText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...assistantMessage,
            text: assistantText,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: 'I encountered an error. Please check your connection and try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-helix-bg overflow-hidden selection:bg-helix-primary/30">
      {/* Auth Modal */}
      <AnimatePresence>
        {(showAuthModal || (!user && !isGuest)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-helix-primary to-helix-secondary" />
              
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-helix-primary to-helix-secondary flex items-center justify-center shadow-xl shadow-helix-primary/20">
                  <Sparkles className="text-white w-8 h-8" />
                </div>
              </div>

              <h2 className="text-2xl font-display font-bold text-white text-center mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Join Helix AI'}
              </h2>
              <p className="text-slate-400 text-center text-sm mb-8">
                {authMode === 'login' ? 'Login to access your personalized AI experience' : 'Create an account to save your chat history'}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-helix-primary transition-colors"
                    value={authForm.name}
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                  />
                )}
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-helix-primary transition-colors"
                  value={authForm.email}
                  onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-helix-primary transition-colors"
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                />
                
                {authError && <p className="text-red-400 text-xs text-center">{authError}</p>}

                <button
                  type="submit"
                  className="w-full bg-helix-primary hover:bg-helix-primary/80 text-white font-bold py-3 rounded-xl shadow-lg shadow-helix-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  {authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or</span></div>
                </div>

                <button
                  onClick={handleGuestMode}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Continue as Guest
                </button>

                <p className="text-center text-sm text-slate-500">
                  {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-helix-primary hover:underline font-medium"
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl h-full md:h-auto bg-slate-900 border border-white/10 rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  {activeSettingsTab && (
                    <button 
                      onClick={() => setActiveSettingsTab(null)}
                      className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                  <Settings className="w-5 h-5 text-helix-primary" />
                  <h2 className="text-xl font-display font-bold text-white">
                    {activeSettingsTab ? activeSettingsTab.charAt(0).toUpperCase() + activeSettingsTab.slice(1) : 'Settings'}
                  </h2>
                </div>
                <button onClick={() => { setShowSettings(false); setActiveSettingsTab(null); }} className="p-2 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden h-[500px] md:h-[400px]">
                {/* Sidebar - Hidden on mobile when a tab is active */}
                <div className={`${activeSettingsTab ? 'hidden md:flex' : 'flex'} w-full md:w-48 border-r border-white/5 p-4 flex-col space-y-2`}>
                  <button 
                    onClick={() => setActiveSettingsTab('account')}
                    className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg transition-all text-sm font-medium flex items-center justify-between md:justify-start gap-2 ${
                      activeSettingsTab === 'account' ? 'bg-helix-primary/10 text-helix-primary' : 'hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Account
                    </div>
                    <ChevronRight className="w-4 h-4 md:hidden opacity-50" />
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('appearance')}
                    className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg transition-all text-sm font-medium flex items-center justify-between md:justify-start gap-2 ${
                      activeSettingsTab === 'appearance' ? 'bg-helix-primary/10 text-helix-primary' : 'hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" /> Appearance
                    </div>
                    <ChevronRight className="w-4 h-4 md:hidden opacity-50" />
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('privacy')}
                    className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg transition-all text-sm font-medium flex items-center justify-between md:justify-start gap-2 ${
                      activeSettingsTab === 'privacy' ? 'bg-helix-primary/10 text-helix-primary' : 'hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Privacy
                    </div>
                    <ChevronRight className="w-4 h-4 md:hidden opacity-50" />
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('about')}
                    className={`w-full text-left px-4 py-3 md:py-2 rounded-xl md:rounded-lg transition-all text-sm font-medium flex items-center justify-between md:justify-start gap-2 ${
                      activeSettingsTab === 'about' ? 'bg-helix-primary/10 text-helix-primary' : 'hover:bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" /> About
                    </div>
                    <ChevronRight className="w-4 h-4 md:hidden opacity-50" />
                  </button>
                </div>

                {/* Content - Hidden on mobile when no tab is active */}
                <div className={`${!activeSettingsTab ? 'hidden md:block' : 'block'} flex-1 p-6 md:p-8 overflow-y-auto`}>
                  <div className="space-y-8">
                    {!activeSettingsTab && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                        <Settings className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Select a category to adjust your settings</p>
                      </div>
                    )}
                    
                    {activeSettingsTab === 'account' && (
                      <>
                        <section>
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Account Information</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Display Name</p>
                                <p className="text-sm text-white font-medium">{user?.name || 'Guest User'}</p>
                              </div>
                              {user && <button className="text-xs text-helix-primary hover:underline">Edit</button>}
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Email Address</p>
                                <p className="text-sm text-white font-medium">{user?.email || 'Not logged in'}</p>
                              </div>
                              {user && <button className="text-xs text-helix-primary hover:underline">Change</button>}
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Data Management</h3>
                          <button 
                            onClick={() => { clearChat(); setShowSettings(false); }}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <span className="text-sm font-medium">Clear All Chat History</span>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </section>
                      </>
                    )}

                    {activeSettingsTab === 'appearance' && (
                      <section>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Appearance</h3>
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-sm text-white font-medium mb-2">Theme</p>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'helix-dark', label: 'Helix Dark' },
                                { id: 'midnight', label: 'Midnight' },
                                { id: 'cyberpunk', label: 'Cyberpunk' }
                              ].map(t => (
                                <button 
                                  key={t.id}
                                  onClick={() => setSettings({ ...settings, theme: t.id })}
                                  className={`p-2 rounded-lg border transition-all text-xs ${
                                    settings.theme === t.id 
                                      ? 'bg-helix-primary/20 border-helix-primary text-white' 
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <p className="text-sm text-white font-medium">Reduced Motion</p>
                            <button 
                              onClick={() => setSettings({ ...settings, reducedMotion: !settings.reducedMotion })}
                              className={`w-10 h-5 rounded-full relative transition-colors ${settings.reducedMotion ? 'bg-helix-primary' : 'bg-slate-700'}`}
                            >
                              <motion.div 
                                animate={{ x: settings.reducedMotion ? 22 : 4 }}
                                className="absolute top-1 w-3 h-3 bg-white rounded-full" 
                              />
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {activeSettingsTab === 'privacy' && (
                      <section>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Privacy & Security</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                              <p className="text-sm text-white font-medium">Incognito Mode</p>
                              <p className="text-xs text-slate-500">Don't save chat history to server</p>
                            </div>
                            <button 
                              onClick={() => setSettings({ ...settings, incognito: !settings.incognito })}
                              className={`w-10 h-5 rounded-full relative transition-colors ${settings.incognito ? 'bg-helix-primary' : 'bg-slate-700'}`}
                            >
                              <motion.div 
                                animate={{ x: settings.incognito ? 22 : 4 }}
                                className="absolute top-1 w-3 h-3 bg-white rounded-full" 
                              />
                            </button>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                              <p className="text-sm text-white font-medium">Two-Factor Auth</p>
                              <p className="text-xs text-slate-500">Add extra security to your account</p>
                            </div>
                            <button 
                              onClick={() => setSettings({ ...settings, twoFactor: !settings.twoFactor })}
                              className={`text-xs font-bold transition-colors ${settings.twoFactor ? 'text-red-400' : 'text-helix-primary'}`}
                            >
                              {settings.twoFactor ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      </section>
                    )}

                    {activeSettingsTab === 'about' && (
                      <section className="text-center space-y-6">
                        <div className="flex justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-helix-primary to-helix-secondary flex items-center justify-center shadow-xl">
                            <Sparkles className="text-white w-8 h-8" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-display font-bold text-white">Helix AI</h3>
                          <p className="text-xs text-slate-500 uppercase tracking-widest">Version 1.0.4 - Stable</p>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          Helix AI is a high-performance artificial intelligence interface designed for seamless human-computer interaction. Built with cutting-edge web technologies.
                        </p>
                        <div className="pt-4 flex justify-center gap-4">
                          <button className="text-xs text-helix-primary hover:underline">Terms of Service</button>
                          <button className="text-xs text-helix-primary hover:underline">Privacy Policy</button>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-helix-primary helix-glow rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-helix-secondary helix-glow rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-500/20 helix-glow rounded-full" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-white/5 bg-black/20 backdrop-blur-xl z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-helix-primary to-helix-secondary flex items-center justify-center shadow-lg shadow-helix-primary/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight text-white">Helix AI</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Intelligence Redefined</p>
            </div>
          </div>

          <button 
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-slate-300 hover:text-white group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 px-4 overflow-y-auto">
          <div className="space-y-1">
            <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Capabilities</p>
            {[
              { icon: Cpu, label: 'Advanced Reasoning' },
              { icon: Zap, label: 'Real-time Processing' },
              { icon: Command, label: 'Technical Mastery' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg text-slate-400 text-sm">
                <item.icon className="w-4 h-4 text-helix-primary" />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
              {user ? (
                <div className="w-full h-full bg-helix-primary flex items-center justify-center text-white font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name || (isGuest ? 'Guest' : 'Not Logged In')}</p>
              <p className="text-[10px] text-slate-500">{user ? 'Pro Member' : 'Free Tier'}</p>
            </div>
            <button 
              onClick={user || isGuest ? handleLogout : () => setShowAuthModal(true)}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
            >
              {user || isGuest ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Header - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-bottom border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="text-helix-primary w-5 h-5" />
            <span className="font-display font-bold text-lg text-white">Helix</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={clearChat} className="p-2 text-slate-400 hover:text-white">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 space-y-6 md:space-y-8">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-helix-primary to-helix-secondary flex items-center justify-center shadow-2xl shadow-helix-primary/40 relative"
              >
                <Sparkles className="text-white w-8 h-8 md:w-12 md:h-12" />
                <div className="absolute -inset-4 bg-helix-primary/20 blur-2xl rounded-full -z-10 animate-pulse" />
              </motion.div>
              
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
                  How can I help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-helix-primary to-helix-secondary">evolve</span> today?
                </h2>
                <p className="text-slate-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                  I'm Helix, your high-performance AI companion. Ask me anything from complex coding to creative storytelling. 🚀
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-xl">
                {[
                  "Explain quantum computing simply ⚛️",
                  "Write a sci-fi short story 🛸",
                  "Help me debug a React hook 💻",
                  "Plan a 3-day trip to Tokyo 🗼"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-helix-primary/50 transition-all text-left text-sm text-slate-300 group flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{suggestion}</span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-helix-primary" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8 pb-12">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                    <motion.div
                      key={msg.timestamp + i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg self-start mt-1 ${
                        msg.role === 'user' 
                          ? 'bg-slate-800 border border-white/10' 
                          : 'bg-gradient-to-br from-helix-primary to-helix-secondary'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3.5 h-3.5 md:w-5 md:h-5 text-slate-300" /> : <Bot className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />}
                      </div>
                      
                      <div className={`flex-1 min-w-0 space-y-1 md:space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                          {msg.role === 'user' ? (user?.name || 'You') : 'Helix AI'}
                        </p>
                        <div className={`inline-block max-w-full text-left ${
                          msg.role === 'user' 
                            ? 'bg-helix-primary/10 border border-helix-primary/20 px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl text-slate-200 text-sm md:text-base' 
                            : 'markdown-body text-sm md:text-base'
                        }`}>
                          {msg.image && (
                            <img 
                              src={msg.image} 
                              alt="Attached" 
                              className="max-w-full md:max-w-sm rounded-lg md:rounded-xl mb-3 border border-white/10 shadow-lg"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {msg.role === 'user' ? (
                            msg.text
                          ) : (
                            <Markdown
                              components={{
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const codeString = String(children).replace(/\n$/, '');
                                  const codeId = `code-${msg.timestamp}-${i}`;
                                  
                                  if (!inline && match) {
                                    return (
                                      <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-slate-950/50 group/code w-full max-w-[calc(100vw-70px)] md:max-w-full">
                                        <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-white/5 border-b border-white/5">
                                          <div className="flex items-center gap-2">
                                            <Terminal className="w-3 h-3 text-helix-primary" />
                                            <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-500 font-bold">{match[1]}</span>
                                          </div>
                                          <button 
                                            onClick={() => copyToClipboard(codeString, codeId)}
                                            className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                                          >
                                            {copiedId === codeId ? (
                                              <>
                                                <Check className="w-3 h-3 text-green-400" />
                                                <span className="text-green-400">COPIED</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3" />
                                                <span>COPY</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                        <div className="overflow-x-auto p-3 md:p-4 scrollbar-thin scrollbar-thumb-white/10">
                                          <code className={`${className} text-[10px] md:text-sm font-mono block whitespace-pre`} {...props}>
                                            {children}
                                          </code>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-helix-primary font-mono text-[10px] md:text-sm" {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {msg.text}
                            </Markdown>
                          )}
                        </div>
                      </div>
                    </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-8 pt-0 pb-10 md:pb-8">
          <div className="max-w-4xl mx-auto relative">
            {/* Image Preview */}
            <AnimatePresence>
              {attachedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-3 left-0 p-2 bg-slate-900 border border-white/10 rounded-xl md:rounded-2xl shadow-2xl flex items-center gap-2 md:gap-3 z-20"
                >
                  <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl overflow-hidden border border-white/10">
                    <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="pr-2 md:pr-4">
                    <p className="text-[10px] md:text-xs font-bold text-white">Image Attached</p>
                    <p className="text-[8px] md:text-[10px] text-slate-500">Ready to analyze</p>
                  </div>
                  <button 
                    onClick={removeAttachedImage}
                    className="p-1 md:p-1.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form 
              onSubmit={handleSubmit}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-helix-primary to-helix-secondary rounded-xl md:rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
              <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl overflow-hidden focus-within:border-helix-primary/50 transition-all">
                <div className="flex items-center pl-2 md:pl-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-helix-primary transition-colors"
                    title="Attach Screenshot"
                  >
                    <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Helix..."
                  className="flex-1 bg-transparent px-3 md:px-4 py-3 md:py-4 text-slate-200 text-sm md:text-base focus:outline-none placeholder:text-slate-500"
                  disabled={isLoading}
                />
                <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4">
                  <button
                    type="submit"
                    disabled={(!input.trim() && !attachedImage) || isLoading}
                    className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${
                      (!input.trim() && !attachedImage) || isLoading
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-white bg-helix-primary hover:bg-helix-primary/80 shadow-lg shadow-helix-primary/20'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>
            <p className="mt-2 text-center text-[8px] md:text-[10px] text-slate-600 uppercase tracking-widest font-medium">
              Helix AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
