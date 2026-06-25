import { useState, useEffect } from 'react';

export default function UserProfile() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser({
      name: 'John Doe',
      email: 'john@example.com',
      joinDate: '2026-01-15',
      articlesRead: 42,
      preferences: {
        theme: 'dark',
        emailDigest: true,
      },
    });
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Profile</h1>

        <div className="border border-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">{user.name}</h2>
          <p className="text-gray-400 mb-2">{user.email}</p>
          <p className="text-gray-400 mb-6">Joined {user.joinDate}</p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400">Articles Read</p>
              <p className="text-3xl font-bold">{user.articlesRead}</p>
            </div>
            <div>
              <p className="text-gray-400">Theme</p>
              <p className="text-3xl font-bold capitalize">{user.preferences.theme}</p>
            </div>
          </div>

          <button className="mt-8 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
