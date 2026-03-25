import React, { useEffect, useState } from 'react';
import { 
    FileText, 
    CheckCircle, 
    Search,
    Download,
    Truck
} from 'lucide-react';
import client, { API_URL } from '../api/client';
import { motion } from 'framer-motion';

interface DispatchRecord {
    id: number;
    batch_number: string;
    customer_name: string;
    dispatched_by_name: string;
    dispatched_at: string;
    pdf_path: string;
    items_summary: string;
}

const Dispatch: React.FC = () => {
    const [history, setHistory] = useState<DispatchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get('/packing/dispatch');
            setHistory(response.data);
        } catch (err: any) {
            console.error('Error fetching dispatch history:', err);
            setError(err.response?.data?.message || 'Failed to load dispatch history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleDownloadPDF = (pdfPath: string) => {
        if (!pdfPath) return;
        const base = API_URL.replace('/api', '');
        const url = `${base}${pdfPath}`;
        window.open(url, '_blank');
    };

    const filteredHistory = history.filter(item => {
        return (item.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
               (item.batch_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.id.toString().includes(searchTerm);
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#e85c24] text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <Truck size={14} /> Logistics Records
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dispatch History</h1>
                    <p className="text-slate-500 font-medium">Review and download all dispatch reports and delivery notes.</p>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e85c24] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by customer, batch or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-[#e85c24]/5 outline-none transition-all"
                    />
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispatch Details</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Batch Number</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispatched By</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6 h-20 bg-slate-50/50" />
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <FileText className="mx-auto text-rose-500 mb-4" size={32} />
                                        <p className="text-slate-500 font-bold">{error}</p>
                                    </td>
                                </tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <FileText size={32} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-bold">No dispatch records found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((item, idx) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.id}
                                        className="group hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-[#e85c24]/10 rounded-2xl text-[#e85c24]">
                                                    <Truck size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">DISPATCH #{item.id}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(item.dispatched_at).toLocaleString()}</p>
                                                    <p className="text-[10px] text-[#e85c24] font-bold mt-1">{item.items_summary}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="text-sm font-black text-slate-700">{item.batch_number}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.customer_name}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-slate-700">{item.dispatched_by_name}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => handleDownloadPDF(item.pdf_path)}
                                                className="p-3 text-slate-400 hover:bg-white hover:text-[#e85c24] hover:shadow-soft rounded-xl transition-all active:scale-90"
                                                title="Download PDF"
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

export default Dispatch;
