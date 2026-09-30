import React, { useState } from 'react';
import { 
  X, 
  User, 
  Store, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Sparkles, 
  Wallet, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  RotateCcw, 
  Key, 
  LogOut, 
  Check, 
  Truck, 
  BadgeCheck,
  PackageCheck
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/dropship';
import { DEFAULT_ACCOUNTS } from '../data/defaultAccounts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  lastUser: UserAccount | null;
  onLogin: (user: UserAccount, remember?: boolean) => void;
  onRegister: (newUser: UserAccount) => void;
  onLogout: () => void;
  initialMode?: 'login' | 'register' | 'profile' | 'relogin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  lastUser,
  onLogin,
  onRegister,
  onLogout,
  initialMode = 'login',
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register' | 'profile' | 'relogin' | 'forgot'>(
    currentUser ? 'profile' : initialMode
  );

  // Registration role
  const [selectedRole, setSelectedRole] = useState<UserRole>('reseller');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Common Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Lahore');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Reseller Specific Fields
  const [brandName, setBrandName] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'JazzCash' | 'EasyPaisa' | 'Bank Transfer'>('JazzCash');
  const [payoutAccountTitle, setPayoutAccountTitle] = useState('');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('');

  // Wholesaler Specific Fields
  const [companyName, setCompanyName] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [dispatchTime, setDispatchTime] = useState('24 Hours');
  const [ntnOrCnic, setNtnOrCnic] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('Electronics & Smart Tech');

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password
  const [forgotStep, setForgotStep] = useState<'input' | 'otp' | 'done'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Error & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const PAKISTANI_CITIES = [
    'Lahore',
    'Karachi',
    'Islamabad',
    'Rawalpindi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Sialkot',
    'Gujranwala',
    'Quetta',
    'Hyderabad',
    'Bahawalpur',
  ];

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your active WhatsApp / mobile number.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to Apna Store partner terms & conditions.');
      return;
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: selectedRole,
      city,
      isVerified: true,
      createdAt: new Date().toISOString().split('T')[0],
      lastLoginAt: 'Just now',
      avatarUrl: `https://images.unsplash.com/photo-${selectedRole === 'reseller' ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?auto=format&fit=crop&w=200&q=80`,
      // Role specifics
      ...(selectedRole === 'reseller'
        ? {
            brandName: brandName.trim() || `${fullName.trim()}'s Store`,
            payoutMethod,
            payoutAccountTitle: payoutAccountTitle.trim() || fullName.trim(),
            payoutAccountNumber: payoutAccountNumber.trim() || phone.trim(),
          }
        : {
            companyName: companyName.trim() || `${fullName.trim()} Enterprises`,
            warehouseLocation: warehouseLocation.trim() || `${city} Main Hub`,
            dispatchTime,
            ntnOrCnic: ntnOrCnic.trim() || 'Verified Partner',
            primaryCategory,
            totalProductsSupplied: 12,
            totalOrdersFulfilled: 0,
            rating: 5.0,
          }),
    };

    onRegister(newUser);
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email or registered phone number.');
      return;
    }

    // Check against demo accounts or last user
    const foundDemo = DEFAULT_ACCOUNTS.find(
      (acc) =>
        acc.email.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
        acc.phone.replace(/[\s-]/g, '').includes(loginIdentifier.replace(/[\s-]/g, ''))
    );

    if (foundDemo) {
      onLogin({ ...foundDemo, lastLoginAt: 'Just now' }, rememberMe);
      onClose();
      return;
    }

    if (
      lastUser &&
      (lastUser.email.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
        lastUser.phone.includes(loginIdentifier))
    ) {
      onLogin({ ...lastUser, lastLoginAt: 'Just now' }, rememberMe);
      onClose();
      return;
    }

    // Default fallback: create an on-the-fly authenticated account for any test email!
    const inferredRole: UserRole = loginIdentifier.toLowerCase().includes('wholesal') || loginIdentifier.toLowerCase().includes('apex') ? 'wholesaler' : 'reseller';
    const fallbackUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: loginIdentifier.split('@')[0].replace('.', ' ').toUpperCase(),
      email: loginIdentifier.includes('@') ? loginIdentifier : `${loginIdentifier}@apnastore.pk`,
      phone: loginIdentifier.startsWith('+92') || loginIdentifier.startsWith('03') ? loginIdentifier : '+92 300 1234567',
      role: inferredRole,
      city: 'Lahore',
      isVerified: true,
      createdAt: 'Today',
      lastLoginAt: 'Just now',
      brandName: `${loginIdentifier.split('@')[0]} Dropship`,
      payoutMethod: 'JazzCash',
      payoutAccountTitle: loginIdentifier.split('@')[0],
      payoutAccountNumber: '0300-1234567',
    };

    onLogin(fallbackUser, rememberMe);
    onClose();
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    const demo = DEFAULT_ACCOUNTS.find((a) => a.role === role) || DEFAULT_ACCOUNTS[0];
    onLogin({ ...demo, lastLoginAt: 'Just now' }, true);
    onClose();
  };

  const handleReLoginLastUser = () => {
    if (lastUser) {
      onLogin({ ...lastUser, lastLoginAt: 'Just now' }, true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
              {mode === 'profile' ? <User className="w-5 h-5" /> : mode === 'register' ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                {mode === 'profile'
                  ? 'Account & Partner Profile'
                  : mode === 'register'
                  ? 'Create Partner Account'
                  : mode === 'relogin'
                  ? 'Welcome Back'
                  : mode === 'forgot'
                  ? 'Reset Password'
                  : 'Partner Sign In'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'register'
                  ? 'Register as an official Reseller or Factory Wholesaler'
                  : 'Access wholesale inventory, margins, and courier tracking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* PROFILE VIEW MODE */}
          {mode === 'profile' && currentUser && (
            <div className="space-y-5">
              {/* Profile Header Card */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                currentUser.role === 'wholesaler'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-black text-xl shadow-xs ${
                    currentUser.role === 'wholesaler' ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-emerald-400 bg-emerald-600 text-white'
                  }`}>
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900">{currentUser.fullName}</h4>
                      {currentUser.isVerified && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                          <BadgeCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium">{currentUser.email}</span>
                      <span>•</span>
                      <span>{currentUser.city}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block text-[11px] font-black uppercase px-2.5 py-1 rounded-lg shadow-2xs ${
                    currentUser.role === 'wholesaler'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {currentUser.role === 'wholesaler' ? 'Factory Supplier' : 'Reseller Partner'}
                  </span>
                </div>
              </div>

              {/* Role Specific Business Credentials */}
              {currentUser.role === 'reseller' ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-emerald-600" />
                    Reseller Store & Payout Details
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Courier Flyer Brand Name</span>
                      <span className="font-bold text-slate-900">{currentUser.brandName || 'Apna Reseller'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">WhatsApp Number</span>
                      <span className="font-bold text-slate-900">{currentUser.phone}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Munafa Payout Method</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                        {currentUser.payoutMethod || 'JazzCash'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Account Title / Number</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currentUser.payoutAccountTitle} ({currentUser.payoutAccountNumber})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    Wholesale Factory & Hub Details
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Manufacturing Company</span>
                      <span className="font-bold text-slate-900">{currentUser.companyName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Warehouse Hub</span>
                      <span className="font-bold text-slate-900">{currentUser.warehouseLocation}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Dispatch Speed</span>
                      <span className="font-bold text-emerald-600">{currentUser.dispatchTime}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Business NTN / CNIC</span>
                      <span className="font-mono font-bold text-slate-900">{currentUser.ntnOrCnic}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Quick Actions */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMode('login');
                  }}
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* CREATE ACCOUNT / REGISTRATION MODE */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Role Switcher Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  I want to register as a:
                </label>
                <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('reseller')}
                    className={`py-3 px-3 rounded-xl text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      selectedRole === 'reseller'
                        ? 'bg-white text-slate-900 shadow-md ring-2 ring-emerald-500'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${selectedRole === 'reseller' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Reseller Partner</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Sell at factory rates, earn +Rs. 200 min profit, withdraw via JazzCash.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('wholesaler')}
                    className={`py-3 px-3 rounded-xl text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      selectedRole === 'wholesaler'
                        ? 'bg-white text-slate-900 shadow-md ring-2 ring-amber-500'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${selectedRole === 'wholesaler' ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-600'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Wholesale Supplier</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Supply bulk inventory to 5,000+ active resellers nationwide.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* General Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {selectedRole === 'reseller' ? 'Full Name' : 'Authorized Representative Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Muhammad Ali"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    WhatsApp / Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Operating City
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden cursor-pointer"
                    >
                      {PAKISTANI_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Role Tailored Fields: Reseller */}
              {selectedRole === 'reseller' && (
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reseller Branding & Munafa Payout</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Reseller Brand Name (Printed on Flyers)
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="e.g. Trendz Store PK"
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Payout Wallet Type
                      </label>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl outline-hidden cursor-pointer"
                      >
                        <option value="JazzCash">JazzCash Mobile Account</option>
                        <option value="EasyPaisa">EasyPaisa Mobile Account</option>
                        <option value="Bank Transfer">Direct Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        value={payoutAccountTitle}
                        onChange={(e) => setPayoutAccountTitle(e.target.value)}
                        placeholder="Name as registered on account"
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Account / Mobile Number
                      </label>
                      <input
                        type="text"
                        value={payoutAccountNumber}
                        onChange={(e) => setPayoutAccountNumber(e.target.value)}
                        placeholder="0301-7654321 / IBAN"
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Role Tailored Fields: Wholesaler */}
              {selectedRole === 'wholesaler' && (
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-300 space-y-3">
                  <div className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Factory & Wholesale Supply Verification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Company / Manufacturing Name
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Apex Sourcing & Co."
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Warehouse Location
                      </label>
                      <input
                        type="text"
                        required
                        value={warehouseLocation}
                        onChange={(e) => setWarehouseLocation(e.target.value)}
                        placeholder="e.g. Korangi Industrial Area, Karachi"
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Dispatch Speed
                      </label>
                      <select
                        value={dispatchTime}
                        onChange={(e) => setDispatchTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl outline-hidden cursor-pointer"
                      >
                        <option value="Same Day Dispatch (24 Hours)">Same Day Dispatch (24 Hours)</option>
                        <option value="24-48 Hours">24-48 Hours</option>
                        <option value="3-4 Days (Custom Sourcing)">3-4 Days (Custom Sourcing)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        NTN / Business CNIC Number
                      </label>
                      <input
                        type="text"
                        value={ntnOrCnic}
                        onChange={(e) => setNtnOrCnic(e.target.value)}
                        placeholder="e.g. 42101-1234567-1 or NTN"
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Create Password (minimum 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Agreement */}
              <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-amber-600 mt-0.5 cursor-pointer"
                />
                <span>
                  I agree to Apna Store partner terms: 100% Cash on Delivery delivery guarantee, genuine wholesale pricing, and automated wallet withdrawals.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-3 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  selectedRole === 'reseller'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {selectedRole === 'reseller'
                    ? 'Complete Reseller Registration & Start Earning'
                    : 'Complete Wholesaler Registration & Supply Products'}
                </span>
              </button>

              {/* Switch to Login */}
              <div className="text-center pt-2 text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Sign In to Account
                </button>
              </div>
            </form>
          )}

          {/* SIGN IN / LOGIN MODE */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Quick 1-Click Demo Accounts Pill */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Quick 1-Click Demo Logins
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">Instant Access</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('reseller')}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-emerald-300 hover:border-emerald-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reseller Account</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">Muhammad Ali (Munafa Wallet)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('wholesaler')}
                    className="p-2.5 bg-white hover:bg-amber-50 border border-amber-300 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Wholesaler Account</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">Shenzhen Apex Direct (Karachi)</div>
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <span className="font-semibold">{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email Address or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. ali.reseller@apnastore.pk or 0300-1234567"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-amber-700 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-amber-600 cursor-pointer"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Sign In to Account</span>
                </button>
              </form>

              {/* Re-login shortcut if last user exists */}
              {lastUser && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Previously active on this device:</span>
                    <button
                      type="button"
                      onClick={handleReLoginLastUser}
                      className="font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Quick Re-login as {lastUser.fullName}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Create Account Link */}
              <div className="text-center pt-2 text-xs text-slate-600 border-t border-slate-100">
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-black text-amber-700 hover:underline cursor-pointer"
                >
                  Create Reseller / Wholesaler Account
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Enter your registered email address or WhatsApp mobile number to receive a verification OTP to reset your password.
              </div>

              {forgotStep === 'input' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Email or WhatsApp Number
                    </label>
                    <input
                      type="text"
                      defaultValue={loginIdentifier || 'ali.reseller@apnastore.pk'}
                      placeholder="e.g. 0300-1234567 or email"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotStep('otp')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Send Verification Code (OTP)
                  </button>
                </div>
              )}

              {forgotStep === 'otp' && (
                <div className="space-y-3">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>OTP code sent to your WhatsApp & Email. Use code <strong>7890</strong> to verify.</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Enter 4-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="7890"
                      className="w-full px-3 py-2 text-xs font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new secure password"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-hidden"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('done');
                      setTimeout(() => setMode('login'), 2000);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Update Password & Sign In
                  </button>
                </div>
              )}

              {forgotStep === 'done' && (
                <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-extrabold text-sm">Password Updated Successfully!</h4>
                  <p className="text-xs text-emerald-700">Redirecting to login...</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline block text-center cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
