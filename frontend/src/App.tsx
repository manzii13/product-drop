import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DropPage } from './pages/DropPage';
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  return (
    <QueryClientProvider client={queryClient}>
      {isLoggedIn ? (
        <DropPage />
      ) : (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      )}
    </QueryClientProvider>
  );
}

export default App;