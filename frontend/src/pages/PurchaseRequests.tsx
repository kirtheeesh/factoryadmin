import React, { useEffect, useState } from 'react';
import { 
    ClipboardCheck, 
    CheckCircle, 
    Clock, 
    Search,
    Filter,
    AlertTriangle,
    User,
    Store,
    IndianRupee,
    Tag,
    Edit2,
    Save,
    X
} from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface PurchaseRequest {
    id: number;
    material_name: string;
    category?: string;
    current_stock: string;
    requested_quantity: string;
    requested_by: string;
    status: string;
    created_at: string;
    vendor_name?: string;
    vendor_price?: string;
}

interface Vendor {
    id: number;
    name: string;
    materials: {
        material_id: number;
        category: string;
        price_per_kg: number;
    }[];
}

const PurchaseRequests: React.FC = () => {
    const [requests, setRequests] = useState<PurchaseRequest[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        vendor_id: '',
        vendor_name: '',
        vendor_price: '',
        requested_quantity: ''
    });

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const [requestsRes, vendorsRes] = await Promise.all([
                client.get('/purchase/requests'),
                client.get('/vendors')
            ]);
            setRequests(requestsRes.data);
            setVendors(vendorsRes.data);
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.response?.data?.message || 'Failed to load purchase requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleEdit = (req: PurchaseRequest) => {
        setEditingId(req.id);
        setEditForm({
            vendor_name: req.vendor_name || '',
            vendor_price: req.vendor_price || '',
            requested_quantity: req.requested_quantity || ''
        });
    };

    const handleSave = async (id: number) => {
        try {
            await client.patch(`/purchase/requests/${id}`, editForm);
            setEditingId(null);
            fetchRequests();
        } catch (err) {
            console.error('Error updating request:', err);
            alert('Failed to update request');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await client.patch(`/purchase/requests/${id}/approve`);
            fetchRequests();
        } catch (err) {
            console.error('Error approving request:', err);
            alert('Failed to approve request');
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.material_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             req.id.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'APPROVED_BY_ADMIN':
                return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle, label: 'Approved' };
            default:
                return { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock, label: 'Pending Approval' };
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 relative">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <ClipboardCheck size={14} /> Material Procurement
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Purchase Requests</h1>
                    <p className="text-slate-500 font-medium">Review and authorize material requests from Production Heads.</p>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by material or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-14 pr-10 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-primary/5 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="PENDING_ADMIN_APPROVAL">Pending</option>
                        <option value="APPROVED_BY_ADMIN">Approved</option>
                    </select>
                </div>
            </div>

            {/* Requests Grid */}
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
                                <button onClick={fetchRequests} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl">Retry</button>
                            </div>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <ClipboardCheck size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold">No purchase requests found</p>
                        </div>
                    ) : (
                        filteredRequests.map((req, idx) => {
                            const config = getStatusConfig(req.status);
                            const StatusIcon = config.icon;
                            const isEditing = editingId === req.id;
                            
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={req.id}
                                    className="glass p-8 rounded-[2.5rem] border border-slate-100 shadow-soft group relative flex flex-col"
                                >
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${config.color}`}>
                                                <StatusIcon size={12} />
                                                {config.label}
                                            </div>
                                            {!isEditing && req.status === 'PENDING_ADMIN_APPROVAL' && (
                                                <button 
                                                    onClick={() => handleEdit(req)}
                                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-primary"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                                                    {req.material_name}
                                                </h3>
                                                {req.category && (
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-md uppercase tracking-widest">
                                                        {req.category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REQ #{req.id.toString().padStart(5, '0')}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                                                <p className="text-xl font-black text-slate-900">{req.current_stock}</p>
                                            </div>
                                            <div className="bg-primary/10 p-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">Requested</p>
                                                {isEditing ? (
                                                    <input 
                                                        type="number"
                                                        value={editForm.requested_quantity}
                                                        onChange={(e) => setEditForm({...editForm, requested_quantity: e.target.value})}
                                                        className="w-full bg-white border-none p-0 text-xl font-black text-primary focus:ring-0 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-xl font-black text-primary">{req.requested_quantity}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-amber-50 p-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <Tag size={10} /> Vendor Price
                                                </p>
                                                {isEditing ? (
                                                    <div className="flex items-center">
                                                        <IndianRupee size={16} className="text-amber-600" />
                                                        <input 
                                                            type="number"
                                                            value={editForm.vendor_price}
                                                            onChange={(e) => setEditForm({...editForm, vendor_price: e.target.value})}
                                                            className="w-full bg-transparent border-none p-0 text-xl font-black text-amber-600 focus:ring-0 outline-none"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-xl font-black text-amber-600 flex items-center">
                                                        <IndianRupee size={16} />{req.vendor_price || '0.00'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="bg-primary/10 p-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest mb-1">Total Price</p>
                                                <p className="text-xl font-black text-primary flex items-center">
                                                    <IndianRupee size={16} />
                                                    {isEditing 
                                                        ? (parseFloat(editForm.vendor_price || '0') * parseFloat(editForm.requested_quantity || '0')).toFixed(2)
                                                        : (parseFloat(req.vendor_price || '0') * parseFloat(req.requested_quantity || '0')).toFixed(2)
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Store size={14} className="text-primary" />
                                                {isEditing ? (
                                                    <select 
                                                        value={editForm.vendor_name}
                                                        onChange={(e) => {
                                                            const vendor = vendors.find(v => v.name === e.target.value);
                                                            if (vendor) {
                                                                // Find price for this specific material category if possible
                                                                const matPrice = vendor.materials?.find(m => m.category === (req.category || 'Materials'));
                                                                setEditForm({
                                                                    ...editForm,
                                                                    vendor_name: vendor.name,
                                                                    vendor_price: matPrice ? matPrice.price_per_kg.toString() : editForm.vendor_price
                                                                });
                                                            } else {
                                                                setEditForm({...editForm, vendor_name: e.target.value});
                                                            }
                                                        }}
                                                        className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold outline-none focus:border-primary"
                                                    >
                                                        <option value="">Select Vendor</option>
                                                        {vendors.map(v => (
                                                            <option key={v.id} value={v.name}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-xs font-bold">Vendor: {req.vendor_name || 'Not Specified'}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <User size={14} className="text-primary" />
                                                <span className="text-xs font-bold">Requested by: {req.requested_by}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center gap-3">
                                        {isEditing ? (
                                            <>
                                                <button 
                                                    onClick={() => handleSave(req.id)}
                                                    className="flex-1 py-3.5 bg-primary hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Save size={16} /> Save Changes
                                                </button>
                                                <button 
                                                    onClick={() => setEditingId(null)}
                                                    className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl transition-all active:scale-95"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            req.status === 'PENDING_ADMIN_APPROVAL' && (
                                                <button 
                                                    onClick={() => handleApprove(req.id)}
                                                    className="flex-1 py-3.5 bg-primary hover:opacity-90 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                                                >
                                                    Approve Request
                                                </button>
                                            )
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

export default PurchaseRequests;
