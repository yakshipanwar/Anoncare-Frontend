import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

function DailyCheckIn() {
  const { auth } = useContext(AuthContext);
  const [checkin, setCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUnlocks, setNewUnlocks] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✅', category: 'general', color: 'blue' });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = auth?.token || auth?.access;

  const iconOptions = ['✅', '💧', '🚶', '📝', '🏃', '🧘', '💪', '🥗', '😴', '📚', '🎨', '🎵', '💊', '🌱', '🔥'];
  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-600' },
    { value: 'green', label: 'Green', class: 'bg-emerald-600' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-600' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-600' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-600' },
  ];

  useEffect(() => {
    if (token) fetchTodayCheckin();
  }, [token]);

  const fetchTodayCheckin = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/wellness/checkin/today/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCheckin(res.data);
      setSelectedMood(res.data.mood_score);
      if (res.data.newly_unlocked?.length > 0) setNewUnlocks(res.data.newly_unlocked);
    } catch (err) {
      console.error(err);
      setError("Failed to load check-in");
      setCheckin({ habits: [], completed_habit_ids: [], completion_percent: 0, current_streak: 0 });
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId) => {
    if (!checkin || !token) return;
    const isCompleted = checkin.completed_habit_ids?.includes(habitId);
    const action = isCompleted ? 'remove' : 'add';

    setCheckin(prev => ({
      ...prev,
      completed_habit_ids: action === 'add' 
        ? [...(prev.completed_habit_ids || []), habitId]
        : (prev.completed_habit_ids || []).filter(id => id !== habitId),
      completion_percent: action === 'add'
        ? ((prev.completed_habit_ids?.length + 1) / prev.habits?.length * 100)
        : ((prev.completed_habit_ids?.length - 1) / prev.habits?.length * 100)
    }));

    try {
      const res = await axios.post(`${API_URL}/wellness/checkin/today/`, {
        habit_id: habitId,
        action: action
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setCheckin(prev => ({
        ...prev,
        completed_habit_ids: res.data.completed_habit_ids,
        current_streak: res.data.current_streak
      }));
      if (res.data.newly_unlocked?.length > 0) setNewUnlocks(res.data.newly_unlocked);
    } catch (err) {
      fetchTodayCheckin();
    }
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/wellness/habits/`, newHabit, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCheckin(prev => ({
        ...prev,
        habits: [...(prev.habits || []), res.data]
      }));
      setNewHabit({ name: '', icon: '✅', category: 'general', color: 'blue' });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add habit:", err);
    }
  };

  const deleteHabit = async (habitId) => {
    if (!confirm('Delete this habit?')) return;
    try {
      await axios.delete(`${API_URL}/wellness/habits/${habitId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCheckin(prev => ({
        ...prev,
        habits: prev.habits.filter(h => h.id !== habitId)
      }));
    } catch (err) {
      console.error("Failed to delete habit:", err);
    }
  };

  const submitMood = async (score) => {
    setSelectedMood(score);
    try {
      await axios.post(`${API_URL}/wellness/checkin/today/`, {
        mood_score: score
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error(err);
    }
  };

  const getStreak = () => checkin?.current_streak || 0;
  const getCompletionPercent = () => checkin?.completion_percent || 0;
  const getHabits = () => checkin?.habits || [];
  const isCompleted = (id) => checkin?.completed_habit_ids?.includes(id);

  const getColorClass = (color) => {
    const map = {
      blue: 'bg-blue-600 border-blue-500/30 text-blue-400',
      green: 'bg-emerald-600 border-emerald-500/30 text-emerald-400',
      purple: 'bg-purple-600 border-purple-500/30 text-purple-400',
      orange: 'bg-orange-600 border-orange-500/30 text-orange-400',
      pink: 'bg-pink-600 border-pink-500/30 text-pink-400'
    };
    return map[color] || map.blue;
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      {/* New Unlocks Modal */}
      {newUnlocks.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">New Feature Unlocked!</h2>
            {newUnlocks.map((f, i) => (
              <div key={i} className="mb-4">
                <h3 className="text-xl font-semibold text-white">{f.name}</h3>
                <p className="text-gray-400 text-sm">{f.description}</p>
              </div>
            ))}
            <button onClick={() => setNewUnlocks([])} className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white">Awesome!</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full border border-orange-500/30 mb-4">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-lg">{getStreak()}</span>
          <span className="text-sm">day streak</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Habits</h2>
        <p className="text-gray-400 text-sm">{getHabits().length} habits tracked</p>
        
        <div className="mt-4 bg-gray-800 rounded-full h-3 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all" style={{ width: `${getCompletionPercent()}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-2">{Math.round(getCompletionPercent())}% done</p>
      </div>

      {/* Mood */}
      <div className="bg-gray-950/50 rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">How are you feeling?</h3>
        <div className="flex justify-between gap-1">
          {[1,2,3,4,5,6,7,8,9,10].map(s => (
            <button key={s} onClick={() => submitMood(s)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${selectedMood === s ? 'bg-blue-600 text-white scale-110' : 'bg-gray-800 text-gray-400'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Add Habit Button */}
      <button onClick={() => setShowAddForm(!showAddForm)} className="w-full mb-4 py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:border-gray-500 hover:text-gray-300 transition">
        + Add New Habit
      </button>

      {/* Add Habit Form */}
      {showAddForm && (
        <form onSubmit={addHabit} className="bg-gray-950/50 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Habit name (e.g., Read 10 pages)"
            value={newHabit.name}
            onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
            required
          />
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {iconOptions.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setNewHabit({...newHabit, icon})}
                className={`text-2xl p-2 rounded-lg ${newHabit.icon === icon ? 'bg-blue-600' : 'bg-gray-800'}`}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {colorOptions.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewHabit({...newHabit, color: c.value})}
                className={`flex-1 py-2 rounded-lg text-xs font-medium ${c.class} ${newHabit.color === c.value ? 'ring-2 ring-white' : 'opacity-60'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">Add Habit</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-800 rounded-lg text-gray-400">Cancel</button>
          </div>
        </form>
      )}

      {/* Habits List */}
      <div className="space-y-2">
        {getHabits().length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No habits yet. Create your first one above!</p>
          </div>
        )}

        {getHabits().map(habit => {
          const completed = isCompleted(habit.id);
          return (
            <div key={habit.id} className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${completed ? getColorClass(habit.color) : 'bg-gray-800/50 border-gray-800 text-gray-300'}`}>
              <button onClick={() => toggleHabit(habit.id)} className="flex-1 flex items-center gap-3 text-left">
                <span className="text-2xl">{habit.icon}</span>
                <span className={`flex-1 ${completed ? 'line-through opacity-70' : ''}`}>{habit.name}</span>
                {completed && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              </button>
              <button onClick={() => deleteHabit(habit.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition p-1">
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {getCompletionPercent() === 100 && getHabits().length > 0 && (
        <div className="mt-4 text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <div className="text-2xl mb-1">🌟</div>
          <h3 className="text-sm font-bold text-emerald-400">All Habits Complete!</h3>
        </div>
      )}
    </div>
  );
}

export default DailyCheckIn;