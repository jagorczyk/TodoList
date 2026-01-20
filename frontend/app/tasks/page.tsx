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

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('12:00');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }
      fetchTasks(token);
    }
  }, [router]);

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

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-600">Ładowanie...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Harmonogram</h1>
        </div>
        <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 font-semibold border border-red-200 px-4 py-2 rounded hover:bg-red-50 transition">
          Wyloguj się
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 flex justify-between items-center">
            <span>{format(date, 'd MMMM', { locale: pl })}</span>
            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{tasksForSelectedDate.length} zadań</span>
          </h2>
          
          <div className="space-y-3 min-h-50">
            {tasksForSelectedDate.length === 0 ? (
              <p className="text-gray-400 text-center py-8 italic">Brak planów na ten dzień.</p>
            ) : (
              tasksForSelectedDate.map(task => (
                <div key={task.id} className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-white border border-transparent hover:border-blue-100 rounded-lg transition-all shadow-sm hover:shadow-md">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{task.title}</span>
                    <span className="text-xs text-blue-500 font-mono">
                      {task.due_date && format(parseISO(task.due_date), 'HH:mm')}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity px-2"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 w-full">
            <style>{`
              .react-calendar { border: none; width: 100%; font-family: inherit; }
              .react-calendar__tile { height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10px; }
              .react-calendar__tile--active { background: #3b82f6 !important; color: white !important; border-radius: 12px; }
              .react-calendar__tile--now { background: #eff6ff; border-radius: 12px; color: #3b82f6; font-weight: bold; }
              .react-calendar__navigation button { font-size: 1.2rem; font-weight: bold; }
              
              /* Kropka oznaczająca zadania w dniu */
              .dot { height: 6px; width: 6px; background-color: #10b981; border-radius: 50%; margin-top: 4px; }
            `}</style>
            
            <Calendar 
              onChange={(v) => setDate(v as Date)} 
              value={date}
              locale="pl-PL"
              tileContent={({ date: tileDate }) => {
                const hasTasks = tasks.some(t => t.due_date && isSameDay(parseISO(t.due_date), tileDate));
                return hasTasks ? <div className="dot"></div> : null;
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-3 bg-blue-600 text-white p-6 rounded-2xl shadow-lg h-fit">
          <h3 className="text-xl font-bold mb-4">Dodaj nowe</h3>
          <form onSubmit={addTask} className="space-y-4">
            <div>
              <label className="block text-blue-100 text-xs uppercase font-bold mb-1">Co robimy?</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Np. posprzątać"
                className="w-full p-3 rounded-lg bg-blue-700 border border-blue-500 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            
            <div>
              <label className="block text-blue-100 text-xs uppercase font-bold mb-1">Godzina</label>
              <input
                type="time"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
                className="w-full p-3 rounded-lg bg-blue-700 border border-blue-500 text-white focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div className="pt-2">
              <p className="text-sm text-blue-200 mb-4">
                Dla daty: <strong>{format(date, 'd MMMM yyyy', { locale: pl })}</strong>
              </p>
              <button 
                type="submit" 
                className="w-full py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition shadow-md"
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