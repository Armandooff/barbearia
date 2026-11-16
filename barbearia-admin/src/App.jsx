import { useEffect, useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { api } from './api/client';

export default function App() {
  const [authed, setAuthed] = useState(!!api.getToken());
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthed(false);
      setNotice('Sessão expirada. Entre novamente.');
    };
    window.addEventListener('admin:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('admin:unauthorized', handleUnauthorized);
  }, []);

  const handleLogout = () => {
    api.logout();
    setAuthed(false);
    setNotice('');
  };

  const handleSuccess = () => {
    setAuthed(true);
    setNotice('');
  };

  return authed ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <Login
      onSuccess={handleSuccess}
      notice={notice}
      onNoticeDismiss={() => setNotice('')}
    />
  );
}
