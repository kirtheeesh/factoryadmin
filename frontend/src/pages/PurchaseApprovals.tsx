import React, { useEffect, useState } from 'react';
import { 
    ShieldCheck, 
    CheckCircle, 
    Clock, 
    Search,
    Filter,
    AlertTriangle,
    Store,
    BadgeIndianRupee,
    Package
} from 'lucide-react';
import client, { API_URL } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface PurchaseOrder {
    id: number;
    request_id: number;
    material_name: string;
    requested_quantity: string;
    purchased_quantity: string;
    vendor_name: string;
    price: string;
    created_by: string;
    status: string;
    created_at: string;
}

const PurchaseApprovals: React.FC = () => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await client.get('/purchase/orders/pending');
            setOrders(response.data);
        } catch (err: any) {
            console.error('Error fetching purchase orders:', err);
            setError(err.response?.data?.message || 'Failed to load purchase orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await client.patch(`/purchase/orders/${id}/approve`);
            fetchOrders();
        } catch (err) {
            console.error('Error approving order:', err);
            alert('Failed to approve order');
        }
    };

    const handleDownloadPDF = (id: number) => {
        const base = API_URL.replace('/api', '');
        const url = `${base}/purchase/orders/${id}/pdf?isAdmin=true`;
        window.open(url, '_blank');
    };

    const filteredOrders = orders.filter(order => {
        return order.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               order.id.toString().includes(searchTerm);
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <ShieldCheck size={14} /> Procurement Verification
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Purchase Order Approvals</h1>
                    <p className="text-slate-500 font-medium">Verify and authorize final purchase orders from Accounts.</p>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by material, vendor or order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-[350px] bg-slate-100 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : error ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="p-8 bg-rose-50 rounded-3xl border border-rose-100 max-w-md mx-auto">
                                <AlertTriangle className="mx-auto text-rose-500 mb-4" size={48} />
                                <h2 className="text-xl font-black text-slate-900 mb-2">Sync Failure</h2>
                                <p className="text-slate-500 mb-6">{error}</p>
                                <button onClick={fetchOrders} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl">Retry</button>
                            </div>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">No purchase orders awaiting approval</p>
                        </div>
                    ) : (
                        filteredOrders.map((order, idx) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={order.id}
                                className="glass p-8 rounded-[2.5rem] border border-slate-100 shadow-soft group relative flex flex-col"
                            >
                                <div className="flex-1 space-y-6">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border text-amber-600 bg-amber-50 border-amber-100`}>
                                        <Clock size={12} />
                                        Awaiting Admin Approval
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                            {order.material_name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORDER #{order.id.toString().padStart(5, '0')}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.vendor_name}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchased Qty</p>
                                            <div className="flex items-center gap-2 text-slate-900 font-black">
                                                <Package size={14} className="text-slate-400" />
                                                <span className="text-lg">{order.purchased_quantity}</span>
                                            </div>
                                        </div>
                                        <div className="bg-primary/10 p-4 rounded-2xl">
                                            <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">Total Price</p>
                                            <div className="flex items-center gap-1 text-primary font-black">
                                                <span className="text-xs">₹</span>
                                                <span className="text-lg">{order.price}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Created by:</span>
                                            <span className="text-slate-600">{order.created_by}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Request Ref:</span>
                                            <span className="text-slate-600">REQ #{order.request_id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <button 
                                        onClick={() => handleApprove(order.id)}
                                        className="w-full py-3.5 bg-primary hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                                    >
                                        Approve Purchase
                                    </button>
                                    <button 
                                        onClick={() => handleDownloadPDF(order.id)}
                                        className="w-full py-3.5 bg-white border border-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        View Invoice
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PurchaseApprovals;
