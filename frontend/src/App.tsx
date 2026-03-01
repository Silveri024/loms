import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Templates from './pages/Templates';
import Integrations from './pages/Integrations';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
function App() {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);
useEffect(() => {
const token = localStorage.getItem('token');
const userData = localStorage.getItem('user');
if (token && userData) {
  setIsAuthenticated(true);
  setUser(JSON.parse(userData));
}
}, []);
const handleLogin = (token, userData) => {
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(userData));
setIsAuthenticated(true);
setUser(userData);
};
const handleLogout = () => {
localStorage.removeItem('token');
localStorage.removeItem('user');
setIsAuthenticated(false);
setUser(null);
};
if (!isAuthenticated) {
return (
<Router>
<Routes>
<Route path="/login" element={<Login onLogin={handleLogin} />} />
<Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
</Router>
);
}
return (
<Router>
<div className="flex h-screen bg-dark-50">
<Sidebar user={user} />
<div className="flex-1 flex flex-col overflow-hidden">
<Navbar user={user} onLogout={handleLogout} />
<main className="flex-1 overflow-x-hidden overflow-y-auto bg-dark-50 p-6">
<Routes>
<Route path="/" element={<Navigate to="/dashboard" replace />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/clients" element={<Clients />} />
<Route path="/clients/:id" element={<ClientDetail />} />
<Route path="/cases" element={<Cases />} />
  <Route path="/cases/:id" element={<CaseDetail />} />
  <Route path="/payments" element={<Payments />} />
<Route path="/templates" element={<Templates />} />
<Route path="/integrations" element={<Integrations />} />
<Route path="/users" element={user?.role === 'admin' ? <Users /> : <Navigate to="/dashboard" replace />} />
<Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
</main>
</div>
</div>
</Router>
);
}
export default App;
