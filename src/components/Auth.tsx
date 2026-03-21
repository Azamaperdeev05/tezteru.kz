import { signInWithPopup, User } from 'firebase/auth';
import { LogIn } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { useGoogleOneTap } from '../hooks/useGoogleOneTap';
import { Link } from 'react-router-dom';

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

  if (user) {
    return (
      <Link
        to="/profile"
        className="flex items-center gap-2 rounded-full px-2 py-1 text-(--main-color) transition-colors hover:bg-(--main-color)/6"
        title="Профильді ашу"
      >
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
      </Link>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center gap-2 rounded-full border border-(--sub-color)/15 bg-(--main-color)/4 px-4 py-2 text-sm font-medium text-(--sub-color) transition-colors hover:text-(--main-color)"
    >
      <LogIn size={16} />
      <span>Кіру / Тіркелу</span>
    </button>
  );
}
