import React, { useEffect, useState } from 'react';
import { 
    CheckCircle, 
    XCircle, 
    Search, 
    ShieldCheck, 
    ShieldAlert, 
    Calendar,
    Package,
    ClipboardCheck,
    AlertCircle,
    Activity,
    FileText,
    TrendingUp,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface QCRecord {
    id: number;
    inventory_name: string;
    qc_name: string;
    status: string;
    remarks: string;
    date: string;
}

const QC: React.FC = () => {
    const [records, setRecords] = useState<QCRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchQC = async () => {
        setLoading(true);
        try {
            const response = await client.get('/qc', {
                params: { search: searchTerm }
            });
            setRecords(response.data);
        } catch (err) {
            console.error('Error fetching QC records:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQC();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <ShieldCheck size={14} /> Quality Assurance
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inspection Registry</h1>
                    <p className="text-slate-500 font-medium">Monitoring material standards and compliance certifications.</p>
                </div>
                <div className="flex gap-4">
                    <button className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-white px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/25 active:scale-95">
                        <FileText size={18} />
                        Compliance Report
                    </button>
                </div>
            </header>

            {/* QC Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Pass Rate', value: '94.8%', unit: 'Compliance', icon: CheckCircle, color: 'primary' },
                    { label: 'Pending Reviews', value: '14', unit: 'Batches', icon: Activity, color: 'primary' },
                    { label: 'Critical Failures', value: '02', unit: 'Recent', icon: ShieldAlert, color: 'rose' },
                ].map((stat, i) => (
                    <div key={i} className="glass p-8 rounded-[2rem] border border-slate-100 shadow-soft group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color === 'primary' ? 'primary' : stat.color + '-50'} ${stat.color === 'primary' ? 'bg-opacity-10 text-primary' : 'text-' + stat.color + '-600'}`}>
                                <stat.icon size={24} />
                            </div>
                            <TrendingUp size={16} className="text-slate-300" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                            <span className="text-xs font-bold text-slate-400 uppercase">{stat.unit}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by material, inspector or status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 shadow-soft focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all shadow-soft">
                    <Filter size={18} /> Advanced
                </button>
            </div>

            {/* QC Records Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-[250px] bg-slate-100 rounded-[2.5rem] animate-pulse" />)
                    ) : records.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <ShieldCheck size={40} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm">No inspection records found</p>
                        </div>
                    ) : (
                        records.map((record, idx) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={record.id}
                                className="glass p-8 rounded-[2.5rem] border border-slate-100 shadow-soft group hover:border-primary/30 transition-all overflow-hidden relative"
                            >
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                            record.status === 'PASSED' 
                                                ? 'bg-primary text-white' 
                                                : 'bg-rose-500 text-white'
                                        }`}>
                                            {record.status === 'PASSED' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {record.status}
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-slate-300">REF#{record.id.toString().padStart(6, '0')}</span>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Package size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Inspected</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{record.inventory_name}</h3>
                                    </div>

                                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inspector Remarks</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 line-clamp-2 leading-relaxed italic">
                                            "{record.remarks || 'No specific remarks provided for this batch.'}"
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-primary border border-slate-100">
                                                {record.qc_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Verified By</p>
                                                <p className="text-xs font-black text-slate-700">{record.qc_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Date</p>
                                            <p className="text-xs font-black text-slate-700">
                                                {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QC;
