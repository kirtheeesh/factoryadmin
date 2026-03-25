import React, { useEffect, useState } from 'react';
import { 
    Users as UsersIcon, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    X, 
    Check,
    Shield,
    UserCircle,
    Filter,
    ShieldCheck,
    Mail,
    Lock,
    UserPlus,
    ShieldAlert,
    Boxes,
    Cpu
} from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    id: number;
    username: string;
    role: string;
}

interface Customer {
    id: number;
    name: string;
    category: string;
    address?: string;
    phone_number?: string;
    alternate_phone_number?: string;
    email?: string;
    gst?: string;
}

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const configs: Record<string, { color: string; icon: any }> = {
        'ADMIN': { color: 'bg-[#333333]', icon: ShieldCheck },
        'PRODUCTION HEAD': { color: 'bg-[#e85c24]', icon: Shield },
        'PRODUCTION_HEAD': { color: 'bg-[#e85c24]', icon: Shield },
        'QUALITY': { color: 'bg-emerald-500', icon: Check },
        'SALES': { color: 'bg-orange-400', icon: UserCircle },
        'PACKING': { color: 'bg-amber-500', icon: Boxes },
        'OPERATOR': { color: 'bg-sky-500', icon: Cpu },
        'STAFF': { color: 'bg-slate-500', icon: UserCircle },
    };

    const config = configs[role] || configs['STAFF'];
    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
            config.color
        )}>
            <Icon size={12} />
            {role.replace('_', ' ')}
        </span>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

interface Vendor {
    id: number;
    name: string;
    address?: string;
    phone_number?: string;
    alternate_phone_number?: string;
    email?: string;
    gst?: string;
    created_by: string;
    created_at: string;
    materials: {
        material_id: number;
        material_name: string;
        price_per_kg: number;
    }[];
}

interface Material {
    id: number;
    material_name: string;
    category?: string;
}

const Users: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'customers' | 'vendors'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STAFF');
    
    const [customerName, setCustomerName] = useState('');
    const [customerCategory, setCustomerCategory] = useState('wholesale');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAltPhone, setCustomerAltPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerGst, setCustomerGst] = useState('');

    const [vendorName, setVendorName] = useState('');
    const [vendorAddress, setVendorAddress] = useState('');
    const [vendorPhone, setVendorPhone] = useState('');
    const [vendorAltPhone, setVendorAltPhone] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [vendorGst, setVendorGst] = useState('');
    
    const [error, setError] = useState<string | null>(null);

    const roles = ['ADMIN', 'STAFF', 'PRODUCTION_HEAD', 'SALES', 'QUALITY'];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await client.get('/users', {
                params: { search: searchTerm, role: roleFilter }
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await client.get('/sales/customers');
            setCustomers(response.data);
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const response = await client.get('/vendors');
            setVendors(response.data);
        } catch (err) {
            console.error('Error fetching vendors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'users') fetchUsers();
            else if (activeTab === 'customers') fetchCustomers();
            else {
                fetchVendors();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter, activeTab]);

    const handleOpenVendorModal = () => {
        setVendorName('');
        setVendorAddress('');
        setVendorPhone('');
        setVendorAltPhone('');
        setVendorEmail('');
        setVendorGst('');
        setError(null);
        setIsVendorModalOpen(true);
    };

    const handleVendorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await client.post('/vendors', {
                name: vendorName,
                address: vendorAddress,
                phone_number: vendorPhone,
                alternate_phone_number: vendorAltPhone,
                email: vendorEmail,
                gst: vendorGst,
                created_by: 'Admin'
            });
            setIsVendorModalOpen(false);
            fetchVendors();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save vendor');
        }
    };

    const handleOpenModal = (user: User | null = null) => {
        if (user) {
            setEditingUser(user);
            setUsername(user.username);
            setRole(user.role);
            setPassword('');
        } else {
            setEditingUser(null);
            setUsername('');
            setRole('STAFF');
            setPassword('');
        }
        setError(null);
        setIsModalOpen(true);
    };

    const handleOpenCustomerModal = (customer: Customer | null = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setCustomerName(customer.name);
            setCustomerCategory(customer.category || 'wholesale');
            setCustomerAddress(customer.address || '');
            setCustomerPhone(customer.phone_number || '');
            setCustomerAltPhone(customer.alternate_phone_number || '');
            setCustomerEmail(customer.email || '');
            setCustomerGst(customer.gst || '');
        } else {
            setEditingCustomer(null);
            setCustomerName('');
            setCustomerCategory('wholesale');
            setCustomerAddress('');
            setCustomerPhone('');
            setCustomerAltPhone('');
            setCustomerEmail('');
            setCustomerGst('');
        }
        setError(null);
        setIsCustomerModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingUser) {
                await client.put(`/users/${editingUser.id}`, { username, role, password: password || undefined });
            } else {
                if (!password) { setError('Password is required for new users'); return; }
                await client.post('/users', { username, password, role });
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save user');
        }
    };

    const handleCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const payload = { 
                name: customerName, 
                category: customerCategory,
                address: customerAddress,
                phone_number: customerPhone,
                alternate_phone_number: customerAltPhone,
                email: customerEmail,
                gst: customerGst
            };
            if (editingCustomer) {
                await client.put(`/sales/customers/${editingCustomer.id}`, payload);
            } else {
                await client.post('/sales/customers', payload);
            }
            setIsCustomerModalOpen(false);
            fetchCustomers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save customer');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to permanently delete this user?')) {
            try { await client.delete(`/users/${id}`); fetchUsers(); } catch (err) { console.error('Error deleting user:', err); }
        }
    };

    const handleCustomerDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to permanently delete this customer?')) {
            try { await client.delete(`/sales/customers/${id}`); fetchCustomers(); } catch (err) { console.error('Error deleting customer:', err); }
        }
    };

    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[#e85c24] text-xs font-black uppercase tracking-[0.2em] mb-2">
                        {activeTab === 'users' ? <UsersIcon size={14} /> : <UserCircle size={14} />} 
                        {activeTab === 'users' ? 'Identity Management' : 'Customer Relations'}
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {activeTab === 'users' ? 'Staff Directory' : 'Sales Customers'}
                    </h1>
                </div>
                <div className="flex gap-4">
                    <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                        <button onClick={() => setActiveTab('users')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'users' ? "bg-white text-[#e85c24] shadow-sm" : "text-slate-400 hover:text-slate-600")}>Staff</button>
                        <button onClick={() => setActiveTab('customers')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'customers' ? "bg-white text-[#e85c24] shadow-sm" : "text-slate-400 hover:text-slate-600")}>Customers</button>
                        <button onClick={() => setActiveTab('vendors')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'vendors' ? "bg-white text-[#e85c24] shadow-sm" : "text-slate-400 hover:text-slate-600")}>Vendors</button>
                    </div>
                    {activeTab === 'users' ? (
                        <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 bg-[#e85c24] hover:bg-[#d44d1a] text-white px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-[#e85c24]/20"><UserPlus size={18} /> Provision User</button>
                    ) : activeTab === 'customers' ? (
                        <button onClick={() => handleOpenCustomerModal()} className="inline-flex items-center gap-2 bg-[#e85c24] hover:bg-[#d44d1a] text-white px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-[#e85c24]/20"><Plus size={18} /> Add Customer</button>
                    ) : (
                        <button onClick={() => handleOpenVendorModal()} className="inline-flex items-center gap-2 bg-[#e85c24] hover:bg-[#d44d1a] text-white px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-[#e85c24]/20"><Plus size={18} /> Create Vendor</button>
                    )}
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e85c24] transition-colors" size={18} />
                    <input type="text" placeholder={activeTab === 'users' ? "Search by name or ID..." : "Search by customer name..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-soft focus:ring-4 focus:ring-[#e85c24]/5 outline-none transition-all" />
                </div>
                {activeTab === 'users' && (
                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full pl-14 pr-10 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-soft focus:ring-4 focus:ring-[#e85c24]/5 outline-none appearance-none cursor-pointer"><option value="">All Roles</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    </div>
                )}
            </div>

            <div className="glass rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden relative">
                <div className="overflow-x-auto">
                    {activeTab === 'users' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Member Profile</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Permission Level</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System ID</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? [1, 2, 3].map(i => (<tr key={i} className="animate-pulse"><td className="px-8 py-6"><div className="h-12 w-48 bg-slate-100 rounded-2xl"></div></td><td className="px-8 py-6"><div className="h-8 w-24 bg-slate-100 rounded-xl"></div></td><td className="px-8 py-6"><div className="h-6 w-16 bg-slate-100 rounded-lg"></div></td><td className="px-8 py-6 text-right"><div className="h-10 w-10 bg-slate-100 rounded-xl ml-auto"></div></td></tr>)) : users.length === 0 ? (<tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">No personnel found</td></tr>) : (
                                    users.map((user, idx) => (
                                        <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={user.id} className="hover:bg-orange-50/30 transition-colors group">
                                            <td className="px-8 py-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#e85c24] font-black shadow-sm border border-slate-100">{user.username.charAt(0).toUpperCase()}</div><div><p className="font-black text-slate-900 tracking-tight">{user.username}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Active Member</p></div></div></td>
                                            <td className="px-8 py-6"><RoleBadge role={user.role} /></td>
                                            <td className="px-8 py-6 font-mono text-xs font-black text-slate-400">#{user.id.toString().padStart(4, '0')}</td>
                                            <td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => handleOpenModal(user)} className="p-3 bg-white text-slate-400 hover:text-[#e85c24] rounded-xl shadow-soft border border-slate-100"><Edit2 size={16} /></button><button onClick={() => handleDelete(user.id)} className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-soft border border-slate-100"><Trash2 size={16} /></button></div></td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : activeTab === 'customers' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 ">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Name</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 ">
                                {loading ? [1, 2, 3].map(i => (<tr key={i} className="animate-pulse"><td className="px-8 py-6"><div className="h-12 w-48 bg-slate-100  rounded-2xl"></div></td><td className="px-8 py-6"><div className="h-8 w-24 bg-slate-100  rounded-xl"></div></td><td className="px-8 py-6"><div className="h-6 w-16 bg-slate-100  rounded-lg"></div></td><td className="px-8 py-6 text-right"><div className="h-10 w-10 bg-slate-100  rounded-xl ml-auto"></div></td></tr>)) : filteredCustomers.length === 0 ? (<tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">No customers registered</td></tr>) : (
                                    filteredCustomers.map((customer, idx) => (
                                        <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={customer.id} className="hover:bg-emerald-50/30 transition-colors group">
                                            <td className="px-8 py-6 font-black text-slate-900  tracking-tight">{customer.name}</td>
                                            <td className="px-8 py-6"><span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Category {customer.category}</span></td>
                                            <td className="px-8 py-6 font-mono text-xs font-black text-slate-400">#C{customer.id.toString().padStart(4, '0')}</td>
                                            <td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => handleOpenCustomerModal(customer)} className="p-3 bg-white  text-slate-400 hover:text-emerald-600 rounded-xl shadow-soft border border-slate-100 "><Edit2 size={16} /></button><button onClick={() => handleCustomerDelete(customer.id)} className="p-3 bg-white  text-slate-400 hover:text-rose-600 rounded-xl shadow-soft border border-slate-100 "><Trash2 size={16} /></button></div></td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 ">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vendor Name</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material(s) & Price</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Created Date</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? [1, 2, 3].map(i => (<tr key={i} className="animate-pulse"><td className="px-8 py-6"><div className="h-12 w-48 bg-slate-100 rounded-2xl"></div></td><td className="px-8 py-6"><div className="h-8 w-24 bg-slate-100 rounded-xl"></div></td><td className="px-8 py-6"><div className="h-6 w-16 bg-slate-100 rounded-lg"></div></td><td className="px-8 py-6 text-right"><div className="h-10 w-10 bg-slate-100 rounded-xl ml-auto"></div></td></tr>)) : vendors.length === 0 ? (<tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">No vendors registered</td></tr>) : (
                                    vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())).map((vendor, idx) => (
                                        <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} key={vendor.id} className="hover:bg-orange-50/30 transition-colors group">
                                            <td className="px-8 py-6 font-black text-slate-900 tracking-tight">{vendor.name}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {vendor.materials && vendor.materials.length > 0 ? vendor.materials.map((m, midx) => (
                                                        <span key={midx} className="px-3 py-1 bg-orange-100 text-[#e85c24] text-[10px] font-black rounded-lg uppercase tracking-widest">{m.material_name}: ₹{m.price_per_kg}/kg</span>
                                                    )) : <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Materials Linked</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-xs font-black text-slate-400">{new Date(vendor.created_at).toLocaleDateString()}</td>
                                            <td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all"><button className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-soft border border-slate-100"><Trash2 size={16} /></button></div></td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="p-10 bg-gradient-to-br from-[#e85c24] to-[#d44d1a] text-white relative">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/60 hover:text-white"><X size={24} /></button>
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6"><Shield size={32} /></div>
                                    <h2 className="text-3xl font-black tracking-tight">{editingUser ? 'Update Profile' : 'New Identity'}</h2>
                                </div>
                                <div className="p-10 space-y-6">
                                    {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold text-center">{error}</div>}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Email</label>
                                            <div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="staff_id@factory.com" className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" /></div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Password</label>
                                            <div className="relative"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editingUser ? "Leave blank to keep current" : "Secure entry phrase"} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" /></div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Role</label>
                                            <div className="relative"><ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><select value={role} onChange={(e) => setRole(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none appearance-none cursor-pointer">{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"> {editingUser ? 'Commit Changes' : 'Authorize User'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCustomerModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsCustomerModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden">
                            <form onSubmit={handleCustomerSubmit}>
                                <div className="p-10 bg-gradient-to-br from-[#e85c24] to-[#d44d1a] text-white relative">
                                    <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="absolute top-8 right-8 text-white/60 hover:text-white"><X size={24} /></button>
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6"><UserCircle size={32} /></div>
                                    <h2 className="text-3xl font-black tracking-tight">{editingCustomer ? 'Update Client' : 'Add Client'}</h2>
                                </div>
                                <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company / Individual Name</label>
                                            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required placeholder="ABC Enterprises" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Distribution Category</label>
                                            <select value={customerCategory} onChange={(e) => setCustomerCategory(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none appearance-none cursor-pointer">
                                                <option value="wholesale">Wholesale</option>
                                                <option value="retail">Retail</option>
                                                <option value="others">Others</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                            <textarea value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required placeholder="Customer Address" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all min-h-[100px]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required placeholder="9876543210" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alt. Phone (Optional)</label>
                                                <input value={customerAltPhone} onChange={(e) => setCustomerAltPhone(e.target.value)} placeholder="9876543210" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                                            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@example.com" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number (Optional)</label>
                                            <input value={customerGst} onChange={(e) => setCustomerGst(e.target.value)} placeholder="22AAAAA0000A1Z5" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">{editingCustomer ? 'Commit Update' : 'Register Customer'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isVendorModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsVendorModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden">
                            <form onSubmit={handleVendorSubmit}>
                                <div className="p-10 bg-gradient-to-br from-[#e85c24] to-[#d44d1a] text-white relative">
                                    <button type="button" onClick={() => setIsVendorModalOpen(false)} className="absolute top-8 right-8 text-white/60 hover:text-white"><X size={24} /></button>
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6"><UsersIcon size={32} /></div>
                                    <h2 className="text-3xl font-black tracking-tight">Create Vendor</h2>
                                </div>
                                <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                                    {error && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold text-center">{error}</div>}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Name</label>
                                            <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} required placeholder="Vendor Name" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                            <textarea value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} required placeholder="Vendor Address" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all min-h-[100px]" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                                <input value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} required placeholder="9876543210" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alt. Phone (Optional)</label>
                                                <input value={vendorAltPhone} onChange={(e) => setVendorAltPhone(e.target.value)} placeholder="9876543210" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                                            <input type="email" value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} placeholder="vendor@example.com" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Number (Optional)</label>
                                            <input value={vendorGst} onChange={(e) => setVendorGst(e.target.value)} placeholder="22AAAAA0000A1Z5" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-5 bg-[#e85c24] hover:bg-[#d44d1a] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all shadow-[#e85c24]/20">Register Vendor</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Users;
