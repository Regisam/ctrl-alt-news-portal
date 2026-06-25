import { ReactNode, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    // Request notification permission on mount (optional)
    if (isSupported && !isSubscribed && Notification.permission === 'default') {
      // Auto-request permission only once per session
      const hasAsked = sessionStorage.getItem('notification-permission-asked');
      if (!hasAsked) {
        sessionStorage.setItem('notification-permission-asked', 'true');
        // Don't auto-subscribe, let user opt-in
      }
    }
  }, [isSupported, isSubscribed]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl font-bold hover:text-blue-400">
            CTRL + ALT NEWS
          </a>
          <nav className="space-x-6">
            <a href="/ai" className="hover:text-blue-400">AI</a>
            <a href="/science" className="hover:text-blue-400">Science</a>
            <a href="/robotics" className="hover:text-blue-400">Robotics</a>
            <a href="/gadgets" className="hover:text-blue-400">Gadgets</a>
            <a href="/search" className="hover:text-blue-400">Search</a>
            <a href="/profile" className="hover:text-blue-400">Profile</a>
            <a href="/dashboard" className="hover:text-blue-400">Dashboard</a>
          </nav>
          {isSupported && (
            <button
              onClick={subscribe}
              className={`px-4 py-2 rounded ${
                isSubscribed ? 'bg-green-600' : 'bg-blue-600'
              } hover:opacity-80`}
            >
              {isSubscribed ? '✓ Notifications' : 'Enable Notifications'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-8 mt-12">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2026 CTRL ALT NEWS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
