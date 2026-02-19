import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CollectionPage } from './pages/CollectionPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AdminPage } from './pages/AdminPage';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';

type Page = 'dashboard' | 'collection' | 'profile' | 'leaderboard';

export default function App() {
  const { profile, loading, isAuthenticated, sendOtp, verifyOtp, signOut, updateProfile, refreshProfile } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return <AuthPage onSendOtp={sendOtp} onVerifyOtp={verifyOtp} />;
  }

  if (!profile.registrationComplete) {
    return (
      <OnboardingPage
        phone={profile.phone}
        onComplete={async (data) => {
          await updateProfile({ ...data, registrationComplete: true });
        }}
      />
    );
  }

  if (showAdmin && profile.isAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Header profile={profile} onSignOut={signOut} onAdmin={() => setShowAdmin(true)} />
      <main className="max-w-2xl mx-auto pb-20">
        {page === 'dashboard' && <DashboardPage profile={profile} onProfileUpdate={refreshProfile} />}
        {page === 'collection' && <CollectionPage />}
        {page === 'leaderboard' && <LeaderboardPage currentUserId={profile.id} />}
        {page === 'profile' && <ProfilePage profile={profile} onUpdate={updateProfile} onProfileUpdate={refreshProfile} />}
      </main>
      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}
