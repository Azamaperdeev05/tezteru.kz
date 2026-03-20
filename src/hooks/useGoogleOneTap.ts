import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithCredential, User } from 'firebase/auth';
import { auth } from '../firebase';

declare global {
  interface Window {
    google?: any;
  }
}

export function useGoogleOneTap(user: User | null) {
  useEffect(() => {
    // If user is already signed in, don't show the prompt
    if (user) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // The script is loaded in index.html, but we wait for it to be ready
    const initOneTap = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const credential = GoogleAuthProvider.credential(response.credential);
            await signInWithCredential(auth, credential);
          } catch (error) {
            console.error('Error signing in with Google One Tap:', error);
          }
        },
        auto_select: true, // Enable One Tap automatically if possible
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.log('One Tap skipped:', notification.getSkippedReason());
        }
      });
    };

    // Try to init, if not ready, wait a bit
    if (window.google?.accounts?.id) {
      initOneTap();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initOneTap();
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [user]);
}
