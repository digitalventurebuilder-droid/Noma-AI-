
import React, { useState } from 'react';
import { AppState, UserProfile } from '../types';
import { auth, googleProvider } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup
} from 'firebase/auth';

interface AuthProps {
  onAuthComplete: (user: UserProfile) => void;
  initialState?: AppState.LOGIN | AppState.SIGNUP | AppState.VERIFY_EMAIL;
}

export const Auth: React.FC<AuthProps> = ({ onAuthComplete, initialState = AppState.SIGNUP }) => {
  const [view, setView] = useState<AppState.LOGIN | AppState.SIGNUP | AppState.VERIFY_EMAIL>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    location: '',
    primaryCrop: 'Maize'
  });

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists
      const existingProfile = localStorage.getItem(`noma_profile_${user.uid}`);
      let profile: UserProfile;
      if (!existingProfile) {
          profile = {
            fullName: user.displayName || user.email?.split('@')[0] || "Farmer",
            location: "Detected via Google",
            primaryCrop: "Maize",
            isGuest: false
          };
          localStorage.setItem(`noma_profile_${user.uid}`, JSON.stringify(profile));
      } else {
          profile = JSON.parse(existingProfile);
      }
      
      onAuthComplete(profile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (view === AppState.SIGNUP) {
        const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Save profile to local storage NOW so it's there when they log in
        const userProfile: UserProfile = {
          fullName: formData.fullName,
          location: formData.location,
          primaryCrop: formData.primaryCrop,
          isGuest: false
        };
        localStorage.setItem(`noma_profile_${userCred.user.uid}`, JSON.stringify(userProfile));

        await sendEmailVerification(userCred.user);
        const email = userCred.user.email || formData.email;
        setVerificationEmail(email);
        await signOut(auth);
        setView(AppState.VERIFY_EMAIL);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        
        if (!userCred.user.emailVerified) {
          setVerificationEmail(userCred.user.email || formData.email);
          await signOut(auth);
          setView(AppState.VERIFY_EMAIL);
          return;
        }

        // We don't need to call onAuthComplete with a dummy profile.
        // onAuthStateChanged in App.tsx will handle loading the profile and navigating to HOME.
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("The email or password you entered is incorrect. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (view === AppState.VERIFY_EMAIL) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF9] px-6 py-12">
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-green to-green-600 rounded-[24px] shadow-xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Verify Email</h1>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-white p-8 text-center">
          <h2 className="text-xl font-black text-gray-900 mb-4">Check your inbox</h2>
          <p className="text-gray-500 font-bold mb-8 leading-relaxed">
            We have sent you a verification email to <span className="text-brand-green">{verificationEmail}</span>. Please verify it and log in.
          </p>

          <button 
            onClick={() => {
              setView(AppState.LOGIN);
              setError(null);
            }}
            className="w-full py-5 bg-brand-green text-white font-black rounded-2xl shadow-xl shadow-green-900/20 active:scale-[0.98] transition-all"
          >
            Log In
          </button>
        </div>

        <div className="mt-auto text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Built for African Farmers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] px-6 py-12">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-green to-green-600 rounded-[24px] shadow-xl flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 4 18 4 10C4 5 7 2 12 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22C12 22 20 18 20 10C20 5 17 2 12 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5"/>
            <circle cx="12" cy="6" r="2.5" fill="currentColor"/>
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Noma<span className="text-brand-green">AI</span></h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Virtual Agronomy Expert</p>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-white p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          {view === AppState.SIGNUP ? "Join Noma AI" : "Welcome Back"}
        </h2>
        <p className="text-gray-500 font-medium mb-6">
          {view === AppState.SIGNUP ? "Start getting expert farm advice today." : "Log in to your farming dashboard."}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-100"></div>
          <span className="px-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
          <div className="flex-1 border-t border-gray-100"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="farmer@example.com"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all outline-none"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {view === AppState.SIGNUP && (
            <>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. John Doe"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all outline-none"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Your Region</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Kaduna, Nigeria"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all outline-none"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Main Crop</label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all outline-none"
                  value={formData.primaryCrop}
                  onChange={e => setFormData({...formData, primaryCrop: e.target.value})}
                >
                  <option>Maize</option>
                  <option>Cassava</option>
                  <option>Rice</option>
                  <option>Yam</option>
                  <option>Tomato</option>
                </select>
              </div>
            </>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-brand-green text-white font-black rounded-2xl shadow-xl shadow-green-900/20 active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : (view === AppState.SIGNUP ? "Create Account" : "Log In")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
          <p className="text-sm font-bold text-gray-400">
            {view === AppState.SIGNUP ? "Already have an account?" : "New to Noma AI?"}
            <button 
              onClick={() => {
                setView(view === AppState.SIGNUP ? AppState.LOGIN : AppState.SIGNUP);
                setError(null);
              }}
              className="ml-2 text-brand-green font-black hover:underline"
            >
              {view === AppState.SIGNUP ? "Log In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-auto text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Built for African Farmers</p>
      </div>
    </div>
  );
};
