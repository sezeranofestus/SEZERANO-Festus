
import React, { useState, useEffect, useRef } from 'react';

interface User {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
}

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthView = 'CHOICE' | 'LOGIN_EMAIL' | 'SIGNUP_EMAIL' | 'VERIFY' | 'FORGOT' | 'LOGIN_PHONE';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('CHOICE');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const getStoredUsers = (): User[] => {
    const users = localStorage.getItem('festus_db_users');
    return users ? JSON.parse(users) : [];
  };

  const saveUser = (user: User) => {
    const users = getStoredUsers();
    users.push(user);
    localStorage.setItem('festus_db_users', JSON.stringify(users));
  };

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setResendTimer(30);
    
    fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    }).catch(err => console.error('Failed to resend verification email:', err));
  };

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      action();
      setIsLoading(false);
    }, 1000);
  };

  const handleSignup = () => {
    handleAction(() => {
      if (!email.includes('@')) return setError('Invalid email format');
      if (password.length < 8) return setError('Password must be 8+ chars');
      if (password !== confirmPassword) return setError('Passwords do not match');
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);
      console.log(`[AUTH] Verification code for ${email}: ${code}`);
      
      // Send verification email
      fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      }).catch(err => console.error('Failed to send verification email:', err));
      
      const newUser: User = { name: email.split('@')[0], email, password, isVerified: false };
      saveUser(newUser);
      setView('VERIFY');
    });
  };

  const handleLogin = () => {
    handleAction(() => {
      const users = getStoredUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) return setError('Invalid credentials');
      if (!user.isVerified) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        console.log(`[AUTH] Verification code: ${code}`);

        // Send verification email
        fetch('/api/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        }).catch(err => console.error('Failed to send verification email:', err));

        return setView('VERIFY');
      }
      onLogin(user);
    });
  };

  const handleAdminLogin = () => {
    handleAction(() => {
      // Hardcoded Admin Credentials from Instruction
      if (phone === '0796506100' && password === 'abc123@!') {
        onLogin({ name: 'Sezerano Festus', phone, isAdmin: true, isVerified: true });
      } else {
        setError('Unauthorized Creator Key.');
      }
    });
  };

  const handleVerify = () => {
    handleAction(() => {
      if (verificationCode === sentCode) {
        onLogin({ name: email.split('@')[0], email, isVerified: true });
      } else {
        setError('Invalid verification code');
      }
    });
  };

  const renderHeader = () => (
    <div className="text-center mb-10">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
        <i className="fa-solid fa-bolt text-3xl text-white"></i>
      </div>
      <h2 className="text-4xl font-black text-white tracking-tighter mb-2">Festus AI Pro</h2>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Advanced Multimodal Matrix</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#020617] p-6">
      <div className="max-w-md w-full bg-[#050814] border border-white/10 rounded-[2.5rem] p-10 md:p-14 relative shadow-2xl">
        {renderHeader()}

        {error && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold text-center rounded-2xl uppercase tracking-widest">{error}</div>}

        {view === 'CHOICE' && (
          <div className="space-y-4">
            <button onClick={() => onLogin({ name: 'OAuth Explorer', email: 'user@google.com', isVerified: true })} className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="G" /> Google Sync
            </button>
            <button onClick={() => setView('LOGIN_EMAIL')} className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white hover:bg-white/10">
              <i className="fa-solid fa-envelope text-indigo-400"></i> Email Access
            </button>
            <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[8px] uppercase"><span className="bg-[#050814] px-4 text-slate-600 tracking-[0.4em] font-black">Creator Access</span></div></div>
            <button onClick={() => setView('LOGIN_PHONE')} className="w-full flex items-center justify-center gap-3 bg-indigo-600/10 border border-indigo-500/20 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-indigo-400 hover:bg-indigo-600/20">
              <i className="fa-solid fa-user-shield"></i> Portal Admin
            </button>
          </div>
        )}

        {(view === 'LOGIN_EMAIL' || view === 'SIGNUP_EMAIL') && (
          <div className="space-y-5">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-indigo-500/50" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-indigo-500/50" />
            {view === 'SIGNUP_EMAIL' && <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-indigo-500/50" />}
            <button onClick={view === 'LOGIN_EMAIL' ? handleLogin : handleSignup} disabled={isLoading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
              {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : view === 'LOGIN_EMAIL' ? 'Authenticate' : 'Initialize'}
            </button>
            <button onClick={() => setView(view === 'LOGIN_EMAIL' ? 'SIGNUP_EMAIL' : 'LOGIN_EMAIL')} className="w-full text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">{view === 'LOGIN_EMAIL' ? 'Create Identity' : 'Already have access?'}</button>
            <button onClick={() => setView('CHOICE')} className="w-full text-center text-[10px] font-bold text-slate-700 uppercase tracking-widest">Return back</button>
          </div>
        )}

        {view === 'VERIFY' && (
          <div className="space-y-6 text-center">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Verification code sent to {email}</p>
            <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="000000" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-center text-2xl font-mono tracking-widest outline-none focus:border-indigo-500/50" />
            <button onClick={handleVerify} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest active:scale-95 transition-all">Finalize Link</button>
            
            <button 
              onClick={handleResendCode} 
              disabled={resendTimer > 0}
              className={`w-full text-center text-[10px] font-bold uppercase tracking-widest ${resendTimer > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
            >
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
            </button>

            <button onClick={() => setView('LOGIN_EMAIL')} className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all">
              <i className="fa-solid fa-arrow-left"></i> Return Back
            </button>
          </div>
        )}

        {view === 'LOGIN_PHONE' && (
          <div className="space-y-5">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Admin Mobile (07...)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-indigo-500/50" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin Key" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-indigo-500/50" />
            <button onClick={handleAdminLogin} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl active:scale-95 transition-all">Enter Portal</button>
            <button onClick={() => setView('CHOICE')} className="w-full text-center text-[10px] font-bold text-slate-700 uppercase tracking-widest">Return back</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
