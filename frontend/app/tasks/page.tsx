'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from 'react-calendar';
import { format, isSameDay, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import 'react-calendar/dist/Calendar.css';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  due_date: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('12:00');
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false); // Stan trybu ciemnego
  const router = useRouter();

  useEffect(() => {
    // 1. Sprawdzenie tokena
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }
      fetchTasks(token);
    }

    // 2. Ładowanie motywu z pamięci lub ustawień systemu
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, [router]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const fetchTasks = async (token: string) => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (id: number, currentStatus: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setTasks(current => 
      current.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t)
    );

    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !newTaskTitle.trim()) return;

    const fullDate = new Date(date);
    const [hours, minutes] = newTaskTime.split(':').map(Number);
    fullDate.setHours(hours, minutes);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: newTaskTitle,
          due_date: fullDate.toISOString() 
        })
      });

      if (res.ok) {
        setNewTaskTitle('');
        fetchTasks(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTasks(current => current.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const tasksForSelectedDate = tasks.filter(task => {
    if (!task.due_date) return false;
    return isSameDay(parseISO(task.due_date), date);
  });

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
      Ładowanie...
    </div>
  );

  return (
    // Główny kontener z obsługą trybu ciemnego (dark:bg-gray-900)
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 transition-colors duration-300">
      
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TodoList</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* PRZEŁĄCZNIK TRYBU */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-2xl"
            title={isDarkMode ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>

          <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold border border-red-200 dark:border-red-900 px-4 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            Wyloguj się
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Kolumna listy zadań */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit transition-colors">
          <h2 className="text-xl font-bold mb-4 border-b dark:border-gray-700 pb-2 flex justify-between items-center text-gray-900 dark:text-white">
            <span>{format(date, 'd MMMM', { locale: pl })}</span>
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {tasksForSelectedDate.length} zadań
            </span>
          </h2>
          
          <div className="space-y-3 min-h-50">
            {tasksForSelectedDate.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-center py-8 italic">Brak planów na ten dzień.</p>
            ) : (
              tasksForSelectedDate.map(task => (
                <div key={task.id} className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-blue-100 dark:hover:border-blue-900 rounded-lg transition-all shadow-sm hover:shadow-md">
                  
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={task.is_completed}
                      onChange={() => toggleTaskCompletion(task.id, task.is_completed)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-600 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className={`font-medium transition-colors ${
                        task.is_completed 
                          ? 'line-through text-gray-400 dark:text-gray-500' 
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {task.title}
                      </span>
                      <span className="text-xs text-blue-500 dark:text-blue-400 font-mono">
                        {task.due_date && format(parseISO(task.due_date), 'HH:mm')}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity px-2"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolumna Kalendarza */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 w-full transition-colors">
            {/* Style dla kalendarza nadpisujące domyślne kolory */}
            <style>{`
              .react-calendar { border: none; width: 100%; font-family: inherit; background: transparent !important; }
              .react-calendar__tile { height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10px; color: inherit; }
              .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #e5e7eb; }
              /* Dark mode hover */
              .dark .react-calendar__tile:enabled:hover { background-color: #374151; }
              
              .react-calendar__tile--active { background: #3b82f6 !important; color: white !important; border-radius: 12px; }
              .react-calendar__tile--now { background: #eff6ff; border-radius: 12px; color: #3b82f6; font-weight: bold; }
              .dark .react-calendar__tile--now { background: #1e3a8a; color: #93c5fd; }
              
              .react-calendar__navigation button { font-size: 1.2rem; font-weight: bold; color: inherit; }
              .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #f3f4f6; }
              .dark .react-calendar__navigation button:enabled:hover { background-color: #374151; }
              
              .react-calendar__month-view__days__day--weekend { color: #ef4444; }
              
              .dot { height: 6px; width: 6px; background-color: #10b981; border-radius: 50%; margin-top: 4px; }
            `}</style>
            
            <Calendar 
              onChange={(v) => setDate(v as Date)} 
              value={date}
              locale="pl-PL"
              className={isDarkMode ? 'text-gray-200' : 'text-gray-800'} 
              tileContent={({ date: tileDate }) => {
                const tasksInDay = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), tileDate));
                if (tasksInDay.length === 0) return null;
                const allDone = tasksInDay.every(t => t.is_completed);
                return <div className="dot" style={{ backgroundColor: allDone ? '#9ca3af' : '#10b981' }}></div>;
              }}
            />
          </div>
        </div>

        {/* Kolumna dodawania zadania */}
        <div className="lg:col-span-3 bg-blue-600 dark:bg-blue-800 text-white p-6 rounded-2xl shadow-lg h-fit transition-colors">
          <h3 className="text-xl font-bold mb-4">Dodaj nowe</h3>
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label className="block text-blue-100 text-xs uppercase font-bold mb-1">Co robimy?</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Np. posprzątać"
                className="w-full p-3 rounded-lg bg-blue-700 dark:bg-blue-900 border border-blue-500 dark:border-blue-700 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-blue-100 text-xs uppercase font-bold mb-1">Godzina</label>
              <input
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="w-full p-3 rounded-lg bg-blue-700 dark:bg-blue-900 border border-blue-500 dark:border-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
              />
            </div>

            <div className="pt-2">
              <p className="text-sm text-blue-200 mb-4">
                Dla daty: <strong>{format(date, 'd MMMM yyyy', { locale: pl })}</strong>
              </p>
              <button 
                type="submit" 
                className="w-full py-3 bg-white dark:bg-gray-200 text-blue-600 dark:text-blue-900 font-bold rounded-lg hover:bg-blue-50 dark:hover:bg-white transition shadow-md"
              >
                Zaplanuj
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
}