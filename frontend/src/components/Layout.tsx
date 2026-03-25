import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
    LayoutDashboard, 
    Users, 
    Package, 
    LogOut, 
    Menu, 
    X,
    Cpu,
    Factory,
    ClipboardCheck,
    Search,
    ChevronLeft,
    Monitor,
    ShieldCheck,
    FileText,
    TrendingUp,
    Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const NavItem: React.FC<{ 
    item: { name: string; path: string; icon: any }; 
    isActive: boolean;
    isCollapsed: boolean;
}> = ({ item, isActive, isCollapsed }) => {
    return (
        <Link
            to={item.path}
            className={cn(
                "relative flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group",
                isActive
                    ? "bg-[#e85c24] text-white shadow-lg shadow-[#e85c24]/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            <item.icon size={20} className={cn("shrink-0", isActive ? "text-white" : "group-hover:scale-110 transition-transform")} />
            {!isCollapsed && (
                <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="whitespace-nowrap"
                >
                    {item.name}
                </motion.span>
            )}
            {isActive && !isCollapsed && (
                <motion.div 
                    layoutId="activeNav"
                    className="absolute right-2 w-1.5 h-5 bg-white/30 rounded-full"
                />
            )}
        </Link>
    );
};

const Layout: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'User Management', path: '/users', icon: Users },
        { name: 'Inventory', path: '/inventory', icon: Package },
        { name: 'Machines', path: '/machines', icon: Cpu },
        { name: 'Production', path: '/production', icon: Factory },
        { name: 'Quality Control', path: '/qc', icon: ClipboardCheck },
        { name: 'Sales Approvals', path: '/sales-approvals', icon: FileText },
        { name: 'Sales History', path: '/sales-history', icon: TrendingUp },
        { name: 'Dispatch', path: '/dispatch', icon: Truck },
        { name: 'Purchase Requests', path: '/purchase-requests', icon: ClipboardCheck },
        { name: 'Purchase Approvals', path: '/purchase-approvals', icon: ShieldCheck },
        { name: 'Purchase History', path: '/purchase-history', icon: Package },
    ];

    return (
        <div className="flex h-screen transition-colors duration-500">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside 
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-[#f8fafc] border-r border-slate-200 transition-all duration-500 ease-in-out lg:relative lg:translate-x-0",
                    isCollapsed ? "w-24" : "w-72",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className={cn("flex items-center h-24 px-6 mb-4", isCollapsed ? "justify-center" : "justify-between")}>
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center">
                                <img src="/logo.jpeg" alt="Logo" className="w-12 h-12 object-contain rounded-xl shadow-lg" />
                            </div>
                            {!isCollapsed && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex flex-col"
                                >
                                    <span className="text-xl font-black text-[#333333] tracking-tighter">ADHMANGALAM</span>
                                    <span className="text-[10px] font-black text-[#e85c24] uppercase tracking-[0.3em] leading-none mt-0.5">Admin v2.0</span>
                                </motion.div>
                            )}
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        <div className={cn("px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]", isCollapsed && "text-center")}>
                            {isCollapsed ? '•••' : 'Main Navigation'}
                        </div>
                        {navItems.map((item) => (
                            <NavItem 
                                key={item.path} 
                                item={item} 
                                isActive={location.pathname === item.path}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 mt-auto border-t border-slate-50">
                        <div className={cn("flex items-center gap-3 p-3 bg-slate-50 rounded-[1.5rem] mb-4", isCollapsed && "justify-center")}>
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#e85c24] font-black shadow-sm">
                                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 truncate uppercase tracking-wider">
                                        {user?.username || 'Administrator'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        System {user?.role || 'Root'}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "flex items-center gap-3 w-full px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest",
                                isCollapsed && "justify-center"
                            )}
                        >
                            <LogOut size={18} />
                            {!isCollapsed && <span>End Session</span>}
                        </button>
                    </div>
                </div>

                {/* Collapse Toggle (Desktop) */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-4 top-10 hidden lg:flex w-8 h-8 bg-white border border-slate-100 rounded-full items-center justify-center shadow-sm text-slate-400 hover:text-[#e85c24] transition-colors z-50"
                >
                    <ChevronLeft size={16} className={cn("transition-transform duration-500", isCollapsed && "rotate-180")} />
                </button>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Global Header */}
                <header className="h-24 bg-[#f8fafc]/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-6">
                        <button
                            className="p-3 text-slate-500 hover:bg-slate-50 rounded-2xl lg:hidden transition-colors"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications removed */}
                        
                        <div className="h-10 w-[1px] bg-slate-100 mx-2" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">
                                    {user?.username || 'ADMIN'}
                                </p>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <span className="text-[10px] font-black text-[#e85c24] uppercase tracking-widest">Active Session</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-orange-50 border-2 border-white rounded-2xl flex items-center justify-center shadow-soft overflow-hidden">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=e85c24&color=fff&bold=true`} 
                                    alt="User" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
