
import React, { useState } from 'react';
import { ShieldCheck, Users, Cpu, Eye, EyeOff, ArrowRight, Lock } from 'lucide-react';

type Role = 'officer' | 'borrower' | null;

interface LoginPageProps {
    onLogin: (role: 'officer' | 'borrower', name: string) => void;
}

// Demo credentials
const CREDENTIALS = {
    officer: { username: 'officer@intellicredit.in', password: 'officer123' },
    borrower: { username: 'borrower@intellicredit.in', password: 'borrower123' },
};

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [selectedRole, setSelectedRole] = useState<Role>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;
        setError('');
        setLoading(true);

        setTimeout(() => {
            const creds = CREDENTIALS[selectedRole];
            if (username === creds.username && password === creds.password) {
                const displayName = selectedRole === 'officer' ? 'Credit Officer' : 'Borrower';
                onLogin(selectedRole, displayName);
            } else {
                setError('Invalid credentials. Please try the demo credentials shown below.');
            }
            setLoading(false);
        }, 800);
    };

    const prefill = (role: Role) => {
        if (!role) return;
        setSelectedRole(role);
        setUsername(CREDENTIALS[role].username);
        setPassword(CREDENTIALS[role].password);
        setError('');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-wasabi/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-khaki/5 blur-[120px] rounded-full" />
            </div>

            <div className="mb-10 text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                    <div className="p-3 rounded-2xl bg-khaki/10 border border-khaki/25 text-khaki">
                        <ShieldCheck size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
                            INTELLI<span className="text-khaki">-CREDIT</span>
                        </h1>
                        <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-wasabi/60">
                            AI Decisioning Engine
                        </p>
                    </div>
                </div>
                <p className="text-khaki/60 text-sm max-w-sm mx-auto font-medium">
                    Sign in to access your portal. Select your role to continue.
                </p>
            </div>

            {/* Role selection */}
            <div className="w-full max-w-lg space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <RoleCard
                        icon={<Cpu size={24} />}
                        title="Credit Officer"
                        subtitle="Internal dashboard, risk scores & decisions"
                        role="wasabi"
                        selected={selectedRole === 'officer'}
                        onClick={() => prefill('officer')}
                    />
                    <RoleCard
                        icon={<Users size={24} />}
                        title="Borrower"
                        subtitle="Apply for a loan & track your application"
                        role="khaki"
                        selected={selectedRole === 'borrower'}
                        onClick={() => prefill('borrower')}
                    />
                </div>

                {/* Login form — shown after role selection */}
                <div className={`transition-all duration-500 overflow-hidden ${selectedRole ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="glass-card">
                        {/* Role indicator strip */}
                        {selectedRole && (
                            <div className={`h-1 w-full ${selectedRole === 'officer' ? 'bg-gradient-to-r from-khaki to-white' : 'bg-gradient-to-r from-khaki to-khaki/60'}`} />
                        )}

                        <form onSubmit={handleLogin} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-khaki/60">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="your@email.com"
                                    className="input-field"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-khaki/60">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-khaki/40 hover:text-white transition-colors"
                                    >
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-earth text-xs font-medium bg-earth/10 border border-earth/20 rounded-lg px-4 py-3">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full h-12 font-bold text-sm uppercase tracking-widest rounded-xl border transition-all duration-300 flex items-center justify-center gap-2 ${selectedRole === 'officer'
                                    ? 'bg-khaki/10 border-khaki/40 text-khaki hover:bg-khaki hover:text-noir'
                                    : 'bg-khaki/10 border-khaki/40 text-khaki hover:bg-khaki hover:text-noir'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? (
                                    <span className="animate-pulse">Authenticating...</span>
                                ) : (
                                    <>
                                        <Lock size={15} />
                                        Sign In as {selectedRole === 'officer' ? 'Officer' : 'Borrower'}
                                        <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Demo hint */}
                <div className="glass-panel border-khaki/10 text-center space-y-3 bg-khaki/[0.02]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-khaki/60">
                        Demo Credentials
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <button
                            onClick={() => prefill('officer')}
                            className="bg-wasabi/5 border border-wasabi/15 rounded-lg p-3 text-left hover:border-wasabi/30 transition-all"
                        >
                            <div className="flex items-center gap-1.5 text-wasabi font-bold mb-1">
                                <Cpu size={11} /> Credit Officer
                            </div>
                            <div className="text-text-dim font-mono text-[10px] space-y-0.5">
                                <div>officer@intellicredit.in</div>
                                <div>officer123</div>
                            </div>
                        </button>
                        <button
                            onClick={() => prefill('borrower')}
                            className="bg-khaki/5 border border-khaki/15 rounded-lg p-3 text-left hover:border-khaki/30 transition-all"
                        >
                            <div className="flex items-center gap-1.5 text-khaki font-bold mb-1">
                                <Users size={11} /> Borrower
                            </div>
                            <div className="text-text-dim font-mono text-[10px] space-y-0.5">
                                <div>borrower@intellicredit.in</div>
                                <div>borrower123</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RoleCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    role: 'wasabi' | 'khaki';
    selected: boolean;
    onClick: () => void;
}> = ({ icon, title, subtitle, role, selected, onClick }) => {
    const wasabiStyle = selected
        ? 'border-wasabi bg-wasabi/10 shadow-[0_0_24px_rgba(128,144,118,0.15)]'
        : 'border-white/8 hover:border-wasabi/40 hover:bg-wasabi/5';
    const khakiStyle = selected
        ? 'border-khaki bg-khaki/10 shadow-[0_0_24px_rgba(248,215,148,0.15)]'
        : 'border-white/8 hover:border-khaki/40 hover:bg-khaki/5';

    const iconColor = role === 'wasabi' ? 'text-wasabi' : 'text-khaki';
    const titleColor = selected ? (role === 'wasabi' ? 'text-wasabi' : 'text-khaki') : 'text-white';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer ${role === 'wasabi' ? wasabiStyle : khakiStyle
                }`}
        >
            <div className={`mb-3 ${iconColor}`}>{icon}</div>
            <div className={`font-bold text-sm mb-1 ${titleColor}`}>{title}</div>
            <div className="text-khaki/50 text-[11px] leading-relaxed font-medium">{subtitle}</div>
            {selected && (
                <div className={`mt-3 text-[9px] font-bold uppercase tracking-widest ${iconColor}`}>
                    ✓ Selected
                </div>
            )}
        </button>
    );
};

export default LoginPage;
