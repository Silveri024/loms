import React from 'react';
import { LogOut, User } from 'lucide-react';

function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white shadow-md border-b border-dark-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
          Legal Operations Management System
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-dark-50 rounded-lg">
            <User className="w-5 h-5 text-primary-600" />
            <div>
              <p className="font-semibold text-dark-900 text-sm">{user?.username}</p>
              <p className="text-xs text-dark-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-accent-rose text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
