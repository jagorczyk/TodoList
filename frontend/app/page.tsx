'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || 'Wystąpił błąd');
      }

      if (isLogin) {
        localStorage.setItem('token', data.access_token);
        router.push('/tasks');
      } else {
        alert('Rejestracja udana! Zaloguj się.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isLogin ? 'Logowanie' : 'Rejestracja'}
        </h1>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nazwa użytkownika"
            className="p-2 border rounded text-black"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Hasło"
            className="p-2 border rounded text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
          >
            {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-500 underline"
          >
            {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
          </button>
        </p>
      </div>
    </main>
  );
}