import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    Activity, Users, Briefcase, DollarSign, TrendingUp,
    PieChart as PieIcon, BarChart3, Loader2, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

const COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316'];

export default function AnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const stats = await api.getAnalytics();
            setData(stats);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-text-dim font-bold tracking-widest uppercase text-xs">Synchronizing Neural Data...</p>
            </div>
        );
    }

    const stats = [
        { label: 'Total Value Locked', value: `$${parseFloat(data.tvl || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
        { label: 'Network Citizens', value: data.totalUsers, icon: Users, color: 'text-blue-400' },
        { label: 'Active Contracts', value: data.totalJobs, icon: Briefcase, color: 'text-primary' },
        { label: 'Total Ecosystem Volume', value: `$${parseFloat(data.totalVolume || 0).toLocaleString()}`, icon: Activity, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card !p-6 flex items-center justify-between group hover:border-primary/50 transition-all duration-500"
                    >
                        <div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth Trends */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 glass-card !p-8 h-[400px] flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <TrendingUp size={20} className="text-primary" />
                                Ecosystem Growth
                            </h3>
                            <p className="text-xs text-text-muted font-medium">Daily contract creation volume</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                            Live Metrics
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trends}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#02040a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}
                                    itemStyle={{ color: '#8b5cf6' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card !p-8 h-[400px] flex flex-col"
                >
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <PieIcon size={20} className="text-primary" />
                            Sector Load
                        </h3>
                        <p className="text-xs text-text-muted font-medium">Work distribution by category</p>
                    </div>

                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.categoryDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#02040a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-text-muted uppercase">Global</span>
                            <span className="text-xl font-black text-white">RECAP</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {data.categoryDistribution.slice(0, 4).map((entry, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-bold text-text-dim truncate">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Neural Insights Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card !bg-primary/5 border-primary/20 !p-8"
            >
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="p-6 rounded-[2.5rem] bg-primary/20 text-primary shadow-2xl shadow-primary/20 shrink-0">
                        <Globe size={48} className="animate-[spin_10s_linear_infinite]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-black uppercase">AI Protocol</span>
                            <h3 className="text-xl font-black text-white">Neural Network Insight</h3>
                        </div>
                        <p className="text-text-dim text-sm leading-relaxed max-w-3xl font-medium">
                            Synthesizing on-chain data: The PolyLance ecosystem is currently operating at <span className="text-primary font-bold">SUPREME</span> efficiency.
                            Active contract volume has grown significantly in the last period, with a focus on <span className="text-emerald-400 font-bold">{data.categoryDistribution[0]?.name || 'High-Tier'}</span> projects.
                            Reputation synchronization across Neural Nodes is maintaining a network average of <span className="text-blue-400 font-bold">{data.avgReputation.toFixed(1)}/100</span>.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
