'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Sprawdzenie czy kod działa po stronie klienta
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
      // Usunąłem ukośnik na końcu, żeby pasowało do backendu
      const res = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const data = await res.json();
      
      // ZABEZPIECZENIE: Sprawdzamy, czy otrzymaliśmy tablicę
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.error("Otrzymano nieprawidłowe dane:", data);
        setTasks([]); // Ustaw pustą listę w razie błędu
      }
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !newTask.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTask })
      });

      if (res.ok) {
        setNewTask('');
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Aktualizacja lokalna dla szybkości
      setTasks(currentTasks => currentTasks.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) return <p className="text-center mt-10">Ładowanie...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Moje Zadania</h1>
          <button 
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
          >
            Wyloguj
          </button>
        </div>

        <form onSubmit={addTask} className="flex gap-2 mb-8">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Co masz do zrobienia?"
            className="flex-1 p-3 border rounded shadow-sm text-black"
          />
          <button 
            type="submit" 
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 shadow-sm font-bold"
          >
            Dodaj
          </button>
        </form>

        <ul className="space-y-3">
          {/* POPRAWKA: Renderowanie listy tylko gdy są zadania */}
          {tasks.map((task) => (
            <li key={task.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <span className="text-lg text-gray-800">{task.title}</span>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700 font-bold px-3 py-1 border border-red-200 rounded hover:bg-red-50"
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
        
        {/* POPRAWKA: Przeniesienie komunikatu poza <ul> */}
        {tasks.length === 0 && (
          <p className="text-center text-gray-500 mt-4">Brak zadań. Dodaj coś!</p>
        )}
      </div>
    </div>
  );
}