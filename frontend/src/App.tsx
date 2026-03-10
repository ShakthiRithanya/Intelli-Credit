
import { useState } from 'react';
import { ShieldCheck, Users, Cpu, LogOut, ChevronDown, ArrowRight } from 'lucide-react';

import LoginPage from './pages/LoginPage';
import { CompanyListPage, CompanyDashboardPage } from './pages/AppPages';
import { PortfolioPage, AnalyticsPage } from './pages/ExtendedPages';
import { LoanApplyPage, ApplicationStatusPage } from './pages/BorrowerPages';
import { OfficerApplicationsPage } from './pages/OfficerApplications';
import BorrowerLayout from './layouts/BorrowerLayout';
import OfficerLayout from './layouts/OfficerLayout';

// ─── Auth types ───────────────────────────────────────────────────────────────
type UserRole = 'officer' | 'borrower';
interface AuthUser { role: UserRole; name: string; }

// ─── Officer routes ───────────────────────────────────────────────────────────
type OfficerRoute = 'dashboard' | 'portfolio' | 'analytics' | 'company' | 'applications';
// ─── Borrower routes ──────────────────────────────────────────────────────────
type BorrowerRoute = 'apply' | 'status';

// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [auth, setAuth] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('intellicredit_auth');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (role: UserRole, name: string) => {
    const user = { role, name };
    setAuth(user);
    localStorage.setItem('intellicredit_auth', JSON.stringify(user));
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem('intellicredit_auth');
  };

  // Not logged in → show login page
  if (!auth) {
    return <LoginPage onLogin={login} />;
  }

  // Route to correct app shell by role — strict separation
  if (auth.role === 'officer') {
    return <OfficerApp user={auth} onLogout={logout} />;
  }

  return <BorrowerApp user={auth} onLogout={logout} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// OFFICER APP
// ═════════════════════════════════════════════════════════════════════════════
function OfficerApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [route, setRoute] = useState<OfficerRoute>('dashboard');
  const [companyId, setCompanyId] = useState<string | null>(null);

  const navigate = (r: OfficerRoute, extra?: string) => {
    if (r === 'company' && extra) {
      setCompanyId(extra);
    }
    setRoute(r);
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <BgOrbs color="wasabi" />

      {/* Officer Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-noir/80 border-b border-khaki/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-6">
          <button onClick={() => navigate('dashboard')} className="flex items-center gap-2.5 group shrink-0">
            <div className="p-2 rounded-xl bg-khaki/10 border border-khaki/20 text-khaki group-hover:bg-khaki group-hover:text-noir transition-all">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight leading-none text-khaki uppercase italic">
                INTELLI<span className="text-white">-CREDIT</span>
              </div>
              <div className="text-[8px] font-bold tracking-[0.3em] uppercase text-wasabi/60">Credit Officer Cockpit</div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <ONavBtn label="Dashboard" active={route === 'dashboard'} onClick={() => navigate('dashboard')} />
            <ONavBtn label="Applications" active={route === 'applications'} onClick={() => navigate('applications')} />
            <ONavBtn label="Portfolio" active={route === 'portfolio'} onClick={() => navigate('portfolio')} />
            <ONavBtn label="Analytics" active={route === 'analytics'} onClick={() => navigate('analytics')} />
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs text-khaki">
              <div className="p-1.5 rounded-lg bg-khaki/10 border border-khaki/20">
                <Cpu size={14} />
              </div>
              <span className="font-semibold">{user.name}</span>
            </div>
            <button onClick={onLogout} title="Sign out" className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-dim hover:text-earth border border-white/10 hover:border-earth/30 px-3 py-1.5 rounded-lg transition-all">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-10 space-y-0">
        {route === 'dashboard' && (
          <OfficerLayout title="Credit Officer Dashboard" subtitle="Portfolio overview, real-time risk scores, and AI-driven credit insights.">
            <CompanyListPage onSelect={id => navigate('company', id)} />
          </OfficerLayout>
        )}
        {route === 'company' && companyId && (
          <OfficerLayout title="Company Risk View" subtitle="Explainable AI scoring, Credit Appraisal Memo, and What-If simulations.">
            <BackBtn label="Back to Dashboard" onClick={() => navigate('dashboard')} />
            <CompanyDashboardPage id={companyId} />
          </OfficerLayout>
        )}
        {route === 'portfolio' && (
          <OfficerLayout title="Portfolio Intelligence" subtitle="Aggregate health metrics, sector concentration, and risk distribution.">
            <PortfolioPage />
          </OfficerLayout>
        )}
        {route === 'analytics' && (
          <OfficerLayout title="Macro Analytics" subtitle="Market sentiment, GST growth trends, and sector-wise risk benchmarks.">
            <AnalyticsPage />
          </OfficerLayout>
        )}
        {route === 'applications' && (
          <OfficerLayout title="Borrower Applications" subtitle="Review AI-scored loan applications submitted via the Borrower Portal. Approve or reject with custom terms.">
            <OfficerApplicationsPage />
          </OfficerLayout>
        )}
      </main>

      <AppFooter />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// BORROWER APP
// ═════════════════════════════════════════════════════════════════════════════
function BorrowerApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [route, setRoute] = useState<BorrowerRoute>('apply');
  const [appStatusId, setAppStatusId] = useState<string | null>(null);
  const [appIdInput, setAppIdInput] = useState('');
  const [showTrackInput, setShowTrackInput] = useState(false);

  const navigateToStatus = (id: string) => {
    setAppStatusId(id);
    setRoute('status');
    setShowTrackInput(false);
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <BgOrbs color="khaki" />

      {/* Borrower Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-noir/80 border-b border-khaki/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="p-2 rounded-xl bg-khaki/10 border border-khaki/20 text-khaki">
              <Users size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight leading-none text-khaki uppercase italic">
                INTELLI<span className="text-white">-CREDIT</span>
              </div>
              <div className="text-[8px] font-bold tracking-[0.3em] uppercase text-khaki/60">Borrower Portal</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <BNavBtn label="Apply for Loan" active={route === 'apply'} onClick={() => setRoute('apply')} />
            <div className="relative">
              <BNavBtn
                label="Track Application"
                active={route === 'status' || showTrackInput}
                onClick={() => setShowTrackInput(v => !v)}
                icon={<ChevronDown size={11} className={`transition-transform ${showTrackInput ? 'rotate-180' : ''}`} />}
              />
              {showTrackInput && (
                <div className="absolute left-0 top-full mt-2 w-72 glass-card p-4 space-y-3 z-50">
                  <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Enter Your Application ID</p>
                  <input
                    className="input-field font-mono text-sm"
                    placeholder="APP_XXXXXXXX"
                    value={appIdInput}
                    onChange={e => setAppIdInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && appIdInput.trim()) navigateToStatus(appIdInput.trim()); }}
                    autoFocus
                  />
                  <button
                    onClick={() => { if (appIdInput.trim()) navigateToStatus(appIdInput.trim()); }}
                    className="w-full h-10 rounded-xl bg-khaki/10 border border-khaki/30 text-khaki hover:bg-khaki hover:text-noir text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Track Status <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs text-text-dim">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Users size={14} />
              </div>
              <span className="font-medium">{user.name}</span>
            </div>
            <button onClick={onLogout} title="Sign out" className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-text-dim hover:text-rose-400 border border-white/10 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-all">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-12 mt-10">
        {route === 'apply' && (
          <BorrowerLayout title="Apply for a Corporate Loan" subtitle="Submit your company details to receive an AI-powered credit decision in minutes.">
            <LoanApplyPage onStatusNav={navigateToStatus} />
          </BorrowerLayout>
        )}
        {route === 'status' && appStatusId && (
          <BorrowerLayout title="Application Status" subtitle="Track your application, review the AI decision, and manage your loan offer in real time.">
            <BackBtn label="Apply for Another Loan" onClick={() => setRoute('apply')} />
            <ApplicationStatusPage id={appStatusId} />
          </BorrowerLayout>
        )}
      </main>

      <AppFooter />
    </div>
  );
}

// ─── Shared micro-components ───────────────────────────────────────────────────
const BgOrbs = ({ color }: { color: 'wasabi' | 'khaki' }) => (
  <div className="fixed inset-0 pointer-events-none -z-10">
    <div className={`absolute top-[-15%] left-[-10%] w-[50%] h-[50%] blur-[140px] rounded-full ${color === 'wasabi' ? 'bg-wasabi/10' : 'bg-khaki/10'}`} />
    <div className="absolute bottom-0 right-[-5%] w-[35%] h-[35%] bg-noir/50 blur-[100px] rounded-full" />
  </div>
);

const ONavBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${active ? 'text-white bg-khaki/20 border border-khaki/30' : 'text-khaki/60 hover:text-white hover:bg-white/5'}`}>
    {label}
  </button>
);

const BNavBtn = ({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) => (
  <button onClick={onClick} className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${active ? 'text-white bg-khaki/20 border border-khaki/30' : 'text-khaki/60 hover:text-white hover:bg-white/5'}`}>
    {label} {icon}
  </button>
);

const BackBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-white transition-colors mb-8">
    <span>←</span> {label}
  </button>
);

const AppFooter = () => (
  <footer className="mt-24 text-center border-t border-white/5 pt-10">
    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-dim opacity-25">
      Intelli-Credit · AI Credit Decisioning Engine · Hackathon 2026
    </p>
  </footer>
);
