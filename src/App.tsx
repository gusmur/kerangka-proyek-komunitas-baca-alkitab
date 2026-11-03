import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ConfigMissing from './components/ConfigMissing';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Groups from './pages/Groups';
import NewGroup from './pages/NewGroup';
import Home from './pages/Home';
import { AuthProvider } from './lib/auth';
import { supabase } from './lib/supabase';

function Placeholder({ title }: { title: string }) {
  return <h1 className="py-10 text-center text-2xl font-bold">{title}</h1>;
}

export default function App() {
  if (!supabase) {
    return <ConfigMissing />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/masuk" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/baru" element={<NewGroup />} />
              <Route path="/groups/:id" element={<Placeholder title="Detail grup" />} />
              <Route path="/baca" element={<Placeholder title="Baca" />} />
              <Route path="/profil" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
