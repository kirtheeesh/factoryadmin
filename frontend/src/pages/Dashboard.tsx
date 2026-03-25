import React, { useEffect, useState } from 'react';
import { 
    Users, 
    Package, 
    Cpu, 
    TrendingUp, 
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    ClipboardCheck,
    Activity,
    TrendingDown,
    Calendar,
    Filter,
    RefreshCw
} from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

interface DashboardStats {
    users: { role: string; count: string }[];
    machines: { status: string; count: string }[];
    totalMachines: string;
    production: string;
    qc: string;
    attendance: { status: string; count: string }[];
    headAttendance: { role: string; count: string }[];
    sales?: { count: string; total: string; pending_count: string };
    productionTrend?: { day: string; output: string }[];
    materialAnalytics?: {
        name: string;
        total_production: string | number;
        monthly_production: string | number;
        total_sales: string | number;
        monthly_sales: string | number;
        total_sales_amount: string | number;
        monthly_sales_amount: string | number;
        total_purchase: string | number;
        monthly_purchase: string | number;
        total_purchase_amount: string | number;
        monthly_purchase_amount: string | number;
    }[];
}

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    color: string;
    delay?: number;
}> = ({ title, value, icon: Icon, color, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="glass p-6 rounded-3xl shadow-soft hover:shadow-strong transition-all duration-300 group overflow-hidden relative"
    >
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-500 ${color}`} />
        
        <div className="flex items-start justify-between relative z-10">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            </div>
            <div className={`p-4 rounded-2xl shadow-lg shadow-[#e85c24]/10 ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </motion.div>
);

// Helper to get date string in YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // Date filtering states
    const [startDate, setStartDate] = useState<string>(formatDate(new Date(new Date().setDate(new Date().getDate() - 7))));
    const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

    const fetchStats = async (polling = false) => {
        try {
            if (!polling) setLoading(true);
            setIsPolling(polling);
            setError(null);
            const response = await client.get('/dashboard/stats', {
                params: {
                    from: startDate,
                    to: endDate
                }
            });
            setStats(response.data);
        } catch (err: any) {
            console.error('Error fetching stats:', err);
            if (!polling) setError(err.response?.data?.message || 'Failed to load dashboard data.');
        } finally {
            if (!polling) setLoading(false);
            setIsPolling(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => fetchStats(true), 15000);
        return () => clearInterval(interval);
    }, [startDate, endDate]);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-[#e85c24]/20 border-t-[#e85c24] rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-medium animate-pulse">Loading analytics...</p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-4">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 max-w-md w-full text-center">
                    <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
                    <h2 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button onClick={() => fetchStats()} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold">Retry</button>
                </div>
            </div>
        );
    }

    const totalUsers = stats.users.reduce((acc, curr) => acc + parseInt(curr.count || '0'), 0);
    const runningMachines = stats.machines.find(m => m.status?.toLowerCase() === 'running')?.count || '0';

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#e85c24] text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <Activity size={14} className={isPolling ? "animate-pulse" : ""} /> Live System Feed
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Factory Dashboard</h1>
                    <p className="text-slate-500 font-medium">Real-time monitoring of production and resources.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-soft border border-slate-100">
                        <Calendar size={16} className="text-[#e85c24]" />
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-xs font-bold text-slate-600 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
                            />
                            <span className="text-slate-300 font-bold text-xs">to</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-xs font-bold text-slate-600 bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => fetchStats()}
                        disabled={loading}
                        className="p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl shadow-soft border border-slate-100 transition-all active:scale-95 disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard title="Total Users" value={totalUsers} icon={Users} color="bg-[#333333]" delay={0.1} />
                <StatCard title="Active Machines" value={`${runningMachines}/${stats.totalMachines}`} icon={Cpu} color="bg-[#e85c24]" delay={0.2} />
                <StatCard title="Production (Units)" value={stats.production} icon={TrendingUp} color="bg-emerald-600" delay={0.3} />
                <StatCard title="Quality Checks" value={stats.qc} icon={ClipboardCheck} color="bg-sky-600" delay={0.4} />
            </div>

            <div className="glass p-8 rounded-[2rem] shadow-soft border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Production Analytics</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#e85c24]" />
                        <span className="text-xs font-bold text-slate-500">Output History</span>
                    </div>
                </div>
                
                <div className="h-64 flex items-end justify-between gap-4 px-2">
                    {(stats.productionTrend && stats.productionTrend.length > 0 ? stats.productionTrend : []).map((item, i) => {
                        const maxOutput = Math.max(...(stats.productionTrend?.map(p => parseInt(p.output)) || [100]));
                        const height = maxOutput > 0 ? (parseInt(item.output) / maxOutput) * 100 : 0;
                        return (
                            <div key={i} className="flex-1 group relative">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(height, 5)}%` }}
                                    transition={{ duration: 1, delay: i * 0.05 }}
                                    className="w-full bg-gradient-to-t from-[#e85c24] to-[#fb923c] rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer relative"
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        {item.output} Units
                                    </div>
                                </motion.div>
                                <div className="mt-2 text-[10px] font-black text-slate-400 text-center">{item.day}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Material & Product Analytics Table */}
            <div className="glass rounded-[2rem] shadow-soft border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Material & Product Intelligence</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Cross-departmental material flow & sales performance</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-orange-50/30">Total Prod</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-orange-50/50">Monthly Prod</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-emerald-50/30">Total Sales</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-emerald-50/50">Monthly Sales</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-amber-50/30">Total Purchase</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-amber-50/50">Monthly Purchase</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stats.materialAnalytics && stats.materialAnalytics.length > 0 ? (
                                stats.materialAnalytics.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</span>
                                        </td>
                                        <td className="px-8 py-4 text-center bg-orange-50/10">
                                            <span className="text-sm font-bold text-orange-600">{item.total_production}</span>
                                        </td>
                                        <td className="px-8 py-4 text-center bg-orange-50/20">
                                            <span className="text-sm font-black text-orange-700">{item.monthly_production}</span>
                                        </td>
                                        <td className="px-8 py-4 text-center bg-emerald-50/10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-emerald-600">{item.total_sales}</span>
                                                <span className="text-[9px] font-bold text-emerald-600/60">₹{Number(item.total_sales_amount).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center bg-emerald-50/20">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-emerald-700">{item.monthly_sales}</span>
                                                <span className="text-[9px] font-bold text-emerald-700/60">₹{Number(item.monthly_sales_amount).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center bg-amber-50/10">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-amber-600">{item.total_purchase}</span>
                                                <span className="text-[9px] font-bold text-amber-600/60">₹{Number(item.total_purchase_amount).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center bg-amber-50/20">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-amber-700">{item.monthly_purchase}</span>
                                                <span className="text-[9px] font-bold text-amber-700/60">₹{Number(item.monthly_purchase_amount).toLocaleString()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-10 text-center text-slate-400 font-bold">No material analytics available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
