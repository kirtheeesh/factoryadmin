import React, { useEffect, useState } from 'react';
import { 
    Cpu, 
    Plus, 
    Edit2, 
    Trash2, 
    X, 
    Activity,
    Settings,
    Power,
    Zap,
    Thermometer,
    Clock,
    Wrench,
    Shield
} from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Machine {
    id: number;
    machine_name: string;
    status: string;
    total_output: number;
    product_name: string;
    shift: string;
    cycle_timing: number;
    cavity: number;
}

const Machines: React.FC = () => {
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    
    const [name, setName] = useState('');
    const [status, setStatus] = useState('OPERATIONAL');
    const [cycleTiming, setCycleTiming] = useState(0);
    const [cavity, setCavity] = useState(1);

    const statuses = ['running', 'paused', 'idle', 'MAINTENANCE', 'REPAIR'];

    const fetchMachines = async () => {
        setLoading(true);
        try {
            const response = await client.get('/machines');
            setMachines(response.data);
        } catch (err) {
            console.error('Error fetching machines:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMachines();
        const interval = setInterval(fetchMachines, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenModal = (machine: Machine | null = null) => {
        if (machine) {
            setEditingMachine(machine);
            setName(machine.machine_name);
            setStatus(machine.status);
            setCycleTiming(machine.cycle_timing || 0);
            setCavity(machine.cavity || 1);
        } else {
            setEditingMachine(null);
            setName('');
            setStatus('idle');
            setCycleTiming(0);
            setCavity(1);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMachine) {
                await client.put(`/machines/${editingMachine.id}`, { 
                    machine_name: name, 
                    status,
                    cycle_timing: cycleTiming,
                    cavity
                });
            } else {
                await client.post('/machines', { 
                    machine_name: name, 
                    status,
                    cycle_timing: cycleTiming,
                    cavity
                });
            }
            setIsModalOpen(false);
            fetchMachines();
        } catch (err) {
            console.error('Error saving machine:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Decommission this machine?')) {
            try {
                await client.delete(`/machines/${id}`);
                fetchMachines();
            } catch (err) {
                console.error('Error deleting machine:', err);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running': return 'text-emerald-500 bg-emerald-50';
            case 'paused': return 'text-amber-500 bg-amber-50';
            case 'idle': return 'text-slate-500 bg-slate-50';
            case 'repair': return 'text-rose-500 bg-rose-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em] mb-2">
                        <Activity size={14} /> Production Line
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Machine Fleet</h1>
                    <p className="text-slate-500 font-medium">Real-time status monitoring and lifecycle management.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-white px-6 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/25 active:scale-95"
                >
                    <Plus size={18} />
                    Commission Unit
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-[300px] bg-slate-100 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : machines.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <Cpu size={40} />
                            </div>
                            <p className="text-slate-400 font-bold">No machinery units deployed</p>
                        </div>
                    ) : (
                        machines.map((machine, idx) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={machine.id}
                                className="glass rounded-[2.5rem] border border-slate-100 shadow-soft group overflow-hidden"
                            >
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-4 rounded-2xl ${getStatusColor(machine.status)} group-hover:scale-110 transition-transform duration-500`}>
                                            <Cpu size={28} />
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <button 
                                                onClick={() => handleOpenModal(machine)}
                                                className="p-2.5 bg-white text-slate-400 hover:text-primary rounded-xl shadow-soft border border-slate-100 transition-all active:scale-90"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(machine.id)}
                                                className="p-2.5 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-soft border border-slate-100 transition-all active:scale-90"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${machine.status.toLowerCase() === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{machine.status}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{machine.machine_name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Product: {machine.product_name || 'None'}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                <Zap size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Output</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-700">{machine.total_output || 0} Units</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Shift</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-700">{machine.shift || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Settings size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Cycle: {machine.cycle_timing}s | Cavity: {machine.cavity}</span>
                                    </div>
                                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                                        View Diagnostics
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Machine Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 bg-primary text-white relative">
                                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                    <Wrench size={28} />
                                </div>
                                <h2 className="text-3xl font-black tracking-tight uppercase">
                                    {editingMachine ? 'Reconfigure Unit' : 'Initialize Unit'}
                                </h2>
                                <p className="text-white/80 text-sm font-medium mt-2">
                                    Set machine identifiers and operational baseline.
                                </p>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Machine Designation</label>
                                        <div className="relative">
                                            <Settings className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                required
                                                placeholder="e.g. Automated Spinner MK-IV"
                                            />
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Operational State</label>
                                        <div className="relative">
                                            <Power className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                                            <select 
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full pl-14 pr-10 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer"
                                            >
                                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Cycle Time (s)</label>
                                            <input 
                                                type="number" 
                                                value={cycleTiming}
                                                onChange={(e) => setCycleTiming(parseInt(e.target.value))}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Cavity Count</label>
                                            <input 
                                                type="number" 
                                                value={cavity}
                                                onChange={(e) => setCavity(parseInt(e.target.value))}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] px-6 py-4 text-xs font-black uppercase tracking-widest text-white bg-primary hover:opacity-90 rounded-2xl transition-all shadow-lg shadow-primary/25 active:scale-95"
                                    >
                                        {editingMachine ? 'Apply Protocols' : 'Initialize Fleet Unit'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Machines;
