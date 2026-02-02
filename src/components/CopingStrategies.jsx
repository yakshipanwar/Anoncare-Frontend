import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

function CopingStrategies() {
  const { auth } = useContext(AuthContext);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [session, setSession] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [moodBefore, setMoodBefore] = useState(null);
  const [moodAfter, setMoodAfter] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [stats, setStats] = useState(null);
  
  // Journal specific states
  const [journalContent, setJournalContent] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [journalTags, setJournalTags] = useState([]);
  const [savedEntries, setSavedEntries] = useState([]);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  
  const timerRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = auth?.token || auth?.access;

  const categories = [
    { id: 'all', label: 'All', icon: '✨' },
    { id: 'breathing', label: 'Breathing', icon: '🌬️' },
    { id: 'grounding', label: 'Grounding', icon: '🌳' },
    { id: 'distraction', label: 'Distraction', icon: '🎮' },
    { id: 'journaling', label: 'Journaling', icon: '📓' }, // Added category
    { id: 'physical', label: 'Physical', icon: '💪' },
    { id: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  ];

  const availableTags = ['Gratitude', 'Anxiety', 'Work', 'Family', 'Sleep', 'Goals', 'Reflection'];

  useEffect(() => {
    if (token) {
      fetchStrategies();
      fetchStats();
      fetchJournalEntries();
    }
  }, [token]);

  const fetchStrategies = async () => {
    try {
      const res = await axios.get(`${API_URL}/wellness/coping-strategies/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Replace Bubble Wrap with Journal if it exists in DB
      setStrategies(res.data);
      setFavorites(new Set(res.data.filter(s => s.is_favorite).map(s => s.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/wellness/coping-strategies/stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJournalEntries = async () => {
    try {
      const res = await axios.get(`${API_URL}/wellness/journal/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (strategyId) => {
    const isFav = favorites.has(strategyId);
    try {
      if (isFav) {
        await axios.delete(`${API_URL}/wellness/coping-strategies/${strategyId}/favorite/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(strategyId);
          return next;
        });
      } else {
        await axios.post(`${API_URL}/wellness/coping-strategies/${strategyId}/favorite/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => new Set([...prev, strategyId]));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startStrategy = async (strategy) => {
    setActiveStrategy(strategy);
    setMoodBefore(null);
    setMoodAfter(null);
    
    // Special handling for journaling
    if (strategy.category === 'journaling') {
      setJournalContent('');
      setJournalTitle('');
      setJournalTags([]);
      setSession({ session_id: 'journal-' + Date.now() }); // Mock session for journal
      return;
    }
    
    try {
      const res = await axios.post(`${API_URL}/wellness/coping-strategies/${strategy.id}/start/`, {
        mood_before: moodBefore
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSession(res.data);
      setTimer(res.data.duration_seconds);
      setIsRunning(true);
      
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error(err);
    }
  };

  const saveJournalEntry = async () => {
    if (!journalContent.trim()) return;
    
    try {
      await axios.post(`${API_URL}/wellness/journal/`, {
        title: journalTitle || 'Journal Entry',
        content: journalContent,
        mood: moodBefore,
        tags: journalTags
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Complete the strategy session
      await completeStrategy();
      
      // Refresh entries
      fetchJournalEntries();
      
    } catch (err) {
      console.error(err);
    }
  };

  const completeStrategy = async () => {
    if (!session) return;
    
    // If it's a journal session, don't call the regular complete endpoint
    if (session.session_id?.toString().startsWith('journal-')) {
      setActiveStrategy(null);
      setSession(null);
      fetchStats();
      return;
    }
    
    clearInterval(timerRef.current);
    setIsRunning(false);
    
    try {
      await axios.post(`${API_URL}/wellness/strategy-sessions/${session.session_id}/complete/`, {
        mood_after: moodAfter,
        notes: ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchStats();
      setActiveStrategy(null);
      setSession(null);
      
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getColorClass = (color) => {
    const map = {
      blue: 'bg-blue-600 border-blue-500/30 text-blue-400',
      purple: 'bg-purple-600 border-purple-500/30 text-purple-400',
      green: 'bg-emerald-600 border-emerald-500/30 text-emerald-400',
      cyan: 'bg-cyan-600 border-cyan-500/30 text-cyan-400',
      pink: 'bg-pink-600 border-pink-500/30 text-pink-400',
      orange: 'bg-orange-600 border-orange-500/30 text-orange-400',
      yellow: 'bg-yellow-600 border-yellow-500/30 text-yellow-400',
    };
    return map[color] || map.blue;
  };

  const toggleTag = (tag) => {
    setJournalTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse text-gray-400 text-center py-20">Loading...</div>
      </div>
    );
  }

  // JOURNALING VIEW
  if (activeStrategy?.category === 'journaling') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeStrategy.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{activeStrategy.name}</h2>
                <p className="text-sm text-gray-400">{activeStrategy.description}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setActiveStrategy(null);
                setSession(null);
              }}
              className="text-gray-500 hover:text-gray-300"
            >
              ✕ Close
            </button>
          </div>

          {/* Mood Before */}
          {!moodBefore ? (
            <div className="text-center py-8 bg-gray-950/50 rounded-xl mb-6">
              <p className="text-gray-400 mb-4">How are you feeling before writing?</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setMoodBefore(n)}
                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold transition"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-4 text-sm text-gray-500">
              Mood before: <span className="text-blue-400 font-bold">{moodBefore}/10</span>
            </div>
          )}

          {/* Journal Form */}
          {moodBefore && (
            <>
              <input
                type="text"
                placeholder="Title (optional)..."
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white mb-4 focus:border-blue-500 focus:outline-none"
              />
              
              <textarea
                placeholder="Start writing... What's on your mind? How are you feeling? What are you grateful for?"
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                className="w-full h-64 bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white resize-none focus:border-blue-500 focus:outline-none mb-4"
                autoFocus
              />
              
              {/* Tags */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        journalTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={saveJournalEntry}
                  disabled={!journalContent.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-bold text-white transition"
                >
                  Save Entry
                </button>
                <button
                  onClick={() => {
                    setActiveStrategy(null);
                    setSession(null);
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* Previous Entries Toggle */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={() => setShowJournalHistory(!showJournalHistory)}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
            >
              {showJournalHistory ? '▼' : '▶'} Previous Entries ({savedEntries.length})
            </button>
            
            {showJournalHistory && (
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {savedEntries.map(entry => (
                  <div key={entry.id} className="bg-gray-950/50 rounded-lg p-4 border border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-white">{entry.title}</h4>
                      <span className="text-xs text-gray-500">{entry.date}</span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{entry.content_preview}</p>
                    {entry.mood && (
                      <span className="inline-block mt-2 text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                        Mood: {entry.mood}/10
                      </span>
                    )}
                  </div>
                ))}
                {savedEntries.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No entries yet. Start writing!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular Strategy Active View
  if (activeStrategy) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">{activeStrategy.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-2">{activeStrategy.name}</h2>
          <p className="text-gray-400 mb-6">{activeStrategy.description}</p>
          
          <div className="text-6xl font-mono font-bold text-emerald-400 mb-8">
            {formatTime(timer)}
          </div>
          
          <div className="bg-gray-950 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Steps:</h3>
            <ol className="space-y-3">
              {activeStrategy.instructions.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-gray-400 text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          {!moodBefore && !isRunning && (
            <div className="mb-6">
              <p className="text-gray-400 mb-3">How are you feeling right now?</p>
              <div className="flex justify-center gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setMoodBefore(n)}
                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold transition"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {timer === 0 && !isRunning && (
            <div className="mb-6 animate-in fade-in">
              <p className="text-gray-400 mb-3">How do you feel now?</p>
              <div className="flex justify-center gap-2 mb-4">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setMoodAfter(n)}
                    className={`w-10 h-10 rounded-lg font-bold transition ${
                      moodAfter === n ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={completeStrategy}
                disabled={!moodAfter}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl font-bold text-white transition"
              >
                Complete Session
              </button>
            </div>
          )}
          
          {isRunning && (
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${((activeStrategy.duration_seconds - timer) / activeStrategy.duration_seconds) * 100}%` }}
              />
            </div>
          )}
          
          <button
            onClick={() => {
              clearInterval(timerRef.current);
              setActiveStrategy(null);
              setSession(null);
            }}
            className="text-gray-500 hover:text-gray-400 text-sm"
          >
            Cancel Session
          </button>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Coping Toolbox</h2>
        <p className="text-gray-400">Techniques to help you feel better</p>
        
        {stats && (
          <div className="flex justify-center gap-6 mt-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
              <span className="text-2xl font-bold text-emerald-400">{stats.completed_sessions}</span>
              <span className="text-gray-500 text-sm ml-2">completed</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
              <span className="text-2xl font-bold text-blue-400">{stats.completion_rate}%</span>
              <span className="text-gray-500 text-sm ml-2">completion</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl border transition ${
              activeCategory === cat.id
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {strategies
          .filter(s => activeCategory === 'all' || s.category === activeCategory)
          .map(strategy => (
            <div
              key={strategy.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition group relative"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(strategy.id);
                }}
                className={`absolute top-4 right-4 text-xl transition ${
                  favorites.has(strategy.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                }`}
              >
                {favorites.has(strategy.id) ? '★' : '☆'}
              </button>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getColorClass(strategy.color)}`}>
                  {strategy.icon}
                </div>
                
                <div className="flex-1 pr-8">
                  <h3 className="font-semibold text-white mb-1">{strategy.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{strategy.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="bg-gray-800 px-2 py-1 rounded">{strategy.category_display}</span>
                    {strategy.category !== 'journaling' && (
                      <span>⏱️ {Math.ceil(strategy.duration_seconds / 60)} min</span>
                    )}
                    {strategy.used_count > 0 && (
                      <span className="text-emerald-400">Used {strategy.used_count} times</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => startStrategy(strategy)}
                className="mt-4 w-full py-2 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg font-medium transition"
              >
                {strategy.category === 'journaling' ? 'Start Writing' : 'Start Exercise'}
              </button>
            </div>
          ))}
      </div>

      {strategies.filter(s => activeCategory === 'all' || s.category === activeCategory).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No strategies found.</p>
        </div>
      )}
    </div>
  );
}

export default CopingStrategies;