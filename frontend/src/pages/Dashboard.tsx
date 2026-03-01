import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { getAllCases } from '../api/cases';
import { getAllClients } from '../api/clients';

// Shows an overview of key statistics and recent activity.
function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    totalClients: 0,
    upcomingDeadlines: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [cases, clients] = await Promise.all([
        getAllCases(),
        getAllClients(),
      ]);

      const activeCases = cases.filter((c) => c.status === 'open');
      const upcomingDeadlines = cases.filter(
        (c) => c.daysUntilDeadline !== undefined && c.daysUntilDeadline > 0 && c.daysUntilDeadline <= 7
      );

      setStats({
        totalCases: cases.length,
        activeCases: activeCases.length,
        totalClients: clients.length,
        upcomingDeadlines: upcomingDeadlines.length,
      });

      setRecentCases(cases.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Cases', value: stats.totalCases, icon: Briefcase, color: 'bg-gradient-to-br from-primary-500 to-primary-700', accent: 'primary', link: '/cases', filter: 'all' },
    { title: 'Active Cases', value: stats.activeCases, icon: TrendingUp, color: 'bg-gradient-to-br from-accent-emerald to-emerald-700', accent: 'emerald', link: '/cases', filter: 'open' },
    { title: 'Total Clients', value: stats.totalClients, icon: Users, color: 'bg-gradient-to-br from-accent-indigo to-indigo-700', accent: 'indigo', link: '/clients', filter: null },
    { title: 'Upcoming Deadlines', value: stats.upcomingDeadlines, icon: AlertCircle, color: 'bg-gradient-to-br from-accent-amber to-amber-700', accent: 'amber', link: '/cases', filter: 'all' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Dashboard</h2>
        <p className="text-dark-500 mt-1">Welcome back! Here's your case overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              onClick={() => navigate(stat.link, { state: stat.filter ? { filter: stat.filter } : undefined })}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-dark-100 cursor-pointer transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-500 text-sm font-medium">{stat.title}</p>
                  <p className="text-4xl font-bold text-dark-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-xl shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-dark-100">
        <div className="px-6 py-5 border-b border-dark-100 bg-gradient-to-r from-dark-50 to-white rounded-t-xl">
          <h3 className="text-xl font-bold text-dark-900">Recent Cases</h3>
          <p className="text-sm text-dark-500 mt-1">Latest case activity and status updates</p>
        </div>
        <div className="p-6">
          {recentCases.length === 0 ? (
            <p className="text-dark-500 text-center py-8">No cases available</p>
          ) : (
            <div className="space-y-3">
              {recentCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  className="flex items-center justify-between p-4 border border-dark-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-dark-900">{caseItem.title}</h4>
                    <p className="text-sm text-dark-600 mt-1">
                      <span className="font-medium">{caseItem.client.name}</span> • <span className="capitalize">{caseItem.status}</span>
                    </p>
                  </div>
                  {caseItem.daysUntilDeadline !== undefined && (
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        caseItem.isOverdue
                          ? 'bg-accent-rose/10 text-accent-rose'
                          : caseItem.daysUntilDeadline <= 7
                          ? 'bg-accent-amber/10 text-accent-amber'
                          : 'bg-accent-emerald/10 text-accent-emerald'
                      }`}
                    >
                      {caseItem.isOverdue
                        ? '🚨 Overdue'
                        : `⏱️ ${caseItem.daysUntilDeadline} days`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
