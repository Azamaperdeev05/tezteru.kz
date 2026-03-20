import { signInWithPopup, signOut, User, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { LogIn, LogOut } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { useGoogleOneTap } from '../hooks/useGoogleOneTap';

interface AuthProps {
  user: User | null;
}

export function Auth({ user }: AuthProps) {
  // Use the One Tap hook
  useGoogleOneTap(user);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-sm font-medium hidden sm:inline-block text-(--main-color)">
            {user.displayName}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-(--error-color) hover:bg-(--error-color)/10 rounded-full transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline-block">Шығу</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-2 px-5 py-2 bg-(--main-color) text-(--bg-color) hover:opacity-90 rounded-full text-sm font-medium transition-all shadow-sm"
    >
      <LogIn size={16} />
      <span>Кіру / Тіркелу</span>
    </button>
  );
}
