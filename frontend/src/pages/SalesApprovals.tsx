import React, { useEffect, useState } from 'react';
import { 
    FileText, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Download, 
    Trash2, 
    Search,
    Filter,
    AlertTriangle,
    Eye
} from 'lucide-react';
import client, { API_URL } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Invoice {
    id: number;
    batch_number?: string;
    customer_name: string;
    category: string;
    total_amount: string;
    approval_status: string;
    invoice_date: string;
    items?: {
        product_name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
    }[];
}

const SalesApprovals: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchInvoices = async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        setError(null);
        try {
            const response = await client.get('/sales/invoices');
            const data = response.data;
            
            setInvoices(data);
        } catch (err: any) {
            console.error('Error fetching invoices:', err);
            if (!isPolling) setError(err.response?.data?.message || 'Failed to load sales invoices.');
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        
        // Polling every 15 seconds to check for new invoices
        const interval = setInterval(() => {
            fetchInvoices(true);
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            if (status === 'approved') {
                const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
                await client.post(`/sales/requests/${id}/approve`, { approved_by: adminUser.id || 1 });
            } else if (status === 'rejected') {
                await client.post(`/sales/requests/${id}/reject`);
            } else {
                await client.put(`/sales/invoices/${id}/status`, { status });
            }
            fetchInvoices();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this invoice record?')) return;
        try {
            await client.delete(`/sales/invoices/${id}`);
            fetchInvoices();
        } catch (err) {
            console.error('Error deleting invoice:', err);
            alert('Failed to delete invoice');
        }
    };

    const handleDownload = (id: number) => {
        // Points to the main backend server for PDF generation
        const base = API_URL.replace('/api', '');
        const url = `${base}/sales/invoices/${id}/pdf?isAdmin=true`;
        window.open(url, '_blank');
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             inv.id.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || inv.approval_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'approved':
                return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle, label: 'Approved' };
            case 'rejected':
                return { color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle, label: 'Rejected' };
            default:
                return { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock, label: 'Pending Approval' };
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#e85c24] text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <FileText size={14} /> Revenue Oversight
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Sales Approvals</h1>
                    <p className="text-slate-500 font-medium">Verify and authorize sales invoices before distribution.</p>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e85c24] transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by customer or invoice ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-[#e85c24]/5 outline-none transition-all"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-14 pr-10 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-[#e85c24]/5 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Invoices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[280px] bg-slate-100 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : error ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="p-8 bg-rose-50 rounded-3xl border border-rose-100 max-w-md mx-auto">
                                <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
                                <h2 className="text-xl font-black text-slate-900 mb-2">Sync Failure</h2>
                                <p className="text-slate-500 mb-6">{error}</p>
                                <button onClick={fetchInvoices} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl">Retry</button>
                            </div>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">No invoices found matching criteria</p>
                        </div>
                    ) : (
                        filteredInvoices.map((inv, idx) => {
                            const config = getStatusConfig(inv.approval_status);
                            const StatusIcon = config.icon;
                            
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={inv.id}
                                    className="glass p-8 rounded-[2.5rem] border border-slate-100 shadow-soft group relative flex flex-col"
                                >
                                    <div className="absolute top-0 right-0 p-6 flex gap-2">
                                        <button onClick={() => handleDelete(inv.id)} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-soft transition-all active:scale-90 opacity-0 group-hover:opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${config.color}`}>
                                            <StatusIcon size={12} />
                                            {config.label}
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-[#e85c24] transition-colors line-clamp-1">
                                                {inv.customer_name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {inv.batch_number ? `BATCH #${inv.batch_number}` : `INV #${inv.id.toString().padStart(5, '0')}`}
                                                </span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.category || 'Standard'}</span>
                                            </div>
                                        </div>

                                        {inv.items && inv.items.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</p>
                                                <div className="space-y-2">
                                                    {inv.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-600">
                                                            <span>{item.product_name}</span>
                                                            <span className="text-[#e85c24]">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Receivable</p>
                                            <p className="text-2xl font-black text-slate-900">₹{inv.total_amount}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center gap-3">
                                        {inv.approval_status === 'pending' ? (
                                            <>
                                                <button 
                                                    onClick={() => handleUpdateStatus(inv.id, 'approved')}
                                                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(inv.id, 'rejected')}
                                                    className="px-4 py-3.5 bg-white border border-slate-100 text-rose-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    onClick={() => handleDownload(inv.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                                                >
                                                    <Download size={14} />
                                                    Download PDF
                                                </button>
                                                {inv.approval_status === 'rejected' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(inv.id, 'pending')}
                                                        className="px-4 py-3.5 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:text-[#e85c24] transition-all"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SalesApprovals;
