import { useState } from 'react';
import DocumentsPage from './pages/DocumentsPage.jsx';

const DEFAULT_USER_ID = 'usuario-demo';

export default function App() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <h1 className="app-title">
            <span className="app-title__mark" aria-hidden="true">
              ▤{' '}
            </span>
            Document Management System
          </h1>
          <label className="user-field">
            Usuário
            <input
              className="input"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              maxLength={128}
              pattern="[A-Za-z0-9_.@\-]+"
              title='Use letras, números, ".", "_", "-" ou "@".'
            />
          </label>
        </div>
      </header>

      <main className="app-main">
        <DocumentsPage userId={userId.trim()} />
      </main>
    </>
  );
}
