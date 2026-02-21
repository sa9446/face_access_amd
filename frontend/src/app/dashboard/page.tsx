'use client';

import { useEffect, useState } from 'react';
import { getStats, getUsers } from '@/lib/api';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, usersData] = await Promise.all([getStats(), getUsers()]);
                setStats(statsData);
                setUsers(usersData);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500">System overview and visitor analytics</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                    Live System Status: Healthy
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Members', value: stats?.totalUsers || 0, icon: '👥' },
                    { label: 'Access Events', value: stats?.totalAccessEvents || 0, icon: '🚪' },
                    { label: 'Average Daily', value: Math.round((stats?.totalAccessEvents || 0) / 7), icon: '📈' },
                    { label: 'Wait Time (avg)', value: '0.8s', icon: '⚡' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="text-3xl mb-4">{stat.icon}</div>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                        <p className="text-3xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tier Distribution */}
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6">Loyalty Tiers</h3>
                    <div className="space-y-4">
                        {Object.entries(stats?.tierDistribution || {}).map(([tier, count]) => (
                            <div key={tier} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${tier === 'Platinum' ? 'bg-indigo-500' :
                                            tier === 'Gold' ? 'bg-yellow-500' :
                                                tier === 'Silver' ? 'bg-slate-400' : 'bg-orange-500'
                                        }`}></div>
                                    <span className="font-semibold text-slate-700">{tier}</span>
                                </div>
                                <span className="text-slate-500 font-bold">{count as number}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Members */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold">Recent Members</h3>
                        <button className="text-blue-600 text-sm font-bold hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-8 py-4">Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Points</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.slice(0, 5).map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                                                    {user.name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.tier === 'PLATINUM' ? 'bg-indigo-100 text-indigo-700' :
                                                    user.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {user.tier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {user.loyaltyPoints}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
