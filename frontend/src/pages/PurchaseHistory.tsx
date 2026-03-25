import React, { useEffect, useState } from 'react';
import { 
    Package, 
    CheckCircle, 
    Search,
    Filter,
    AlertTriangle,
    Download,
    Eye
} from 'lucide-react';
import client, { API_URL } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface PurchaseOrder {
    id: number;
    material_name: string;
    purchased_quantity: string;
    vendor_name: string;
    price: string;
    created_by: string;
    status: string;
    created_at: string;
    admin_approval_date: string;
}

const PurchaseHistory: React.FC = () => {
    const [history, setHistory] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get('/purchase/history');
            setHistory(response.data);
        } catch (err: any) {
            console.error('Error fetching purchase history:', err);
            setError(err.response?.data?.message || 'Failed to load purchase history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDownloadPDF = (id: number) => {
        const base = API_URL.replace('/api', '');
        const url = `${base}/purchase/orders/${id}/pdf?isAdmin=true`;
        window.open(url, '_blank');
    };

    const filteredHistory = history.filter(order => {
        return order.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               order.id.toString().includes(searchTerm);
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <Package size={14} /> Historical Procurement
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Purchase History</h1>
                    <p className="text-slate-500 font-medium">View and audit all completed and approved material purchases.</p>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by material, vendor or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                </div>
            </div>

            {/* History Table/Grid */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-6 h-20 bg-slate-50/50" />
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <AlertTriangle className="mx-auto text-rose-500 mb-4" size={32} />
                                        <p className="text-slate-500 font-bold">{error}</p>
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <Package size={32} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold">No purchase history found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((order, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={order.id}
                                        className="group hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                                    <Package size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.material_name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">#{order.id.toString().padStart(5, '0')} • {new Date(order.admin_approval_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-black text-slate-700">{order.purchased_quantity}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-black text-primary">₹{parseFloat(order.price).toFixed(2)}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{order.vendor_name}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                                                <CheckCircle size={10} />
                                                Completed
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => handleDownloadPDF(order.id)}
                                                className="p-3 text-slate-400 hover:bg-white hover:text-primary hover:shadow-soft rounded-xl transition-all active:scale-90"
                                                title="Download Invoice"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PurchaseHistory;
