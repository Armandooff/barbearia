import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { api } from './api/client';

export default function App() {
  const [authed, setAuthed] = useState(!!api.getToken());

  return authed ? (
    <Dashboard onLogout={() => { api.logout(); setAuthed(false); }} />
  ) : (
    <Login onSuccess={() => setAuthed(true)} />
  );
}