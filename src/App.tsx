import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  Clock, 
  Filter,
  ChevronRight,
  LayoutDashboard,
  Settings,
  LogOut,
  Search,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Category, Period, Intervention } from './types';

export default function App() {
  const [view, setView] = useState<'interventions' | 'categories' | 'periods'>('interventions');
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const [newIntervention, setNewIntervention] = useState<Partial<Intervention>>({
    user_id: 1,
    category_id: 1,
    period_id: 1,
    object: '',
    intervention_date: new Date().toISOString().split('T')[0]
  });

  const [newCategory, setNewCategory] = useState({ title: '' });
  const [newPeriod, setNewPeriod] = useState({ title: '' });

  const [filter, setFilter] = useState({
    search: '',
    category: 'all',
    period: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [intRes, userRes, catRes, perRes] = await Promise.all([
        fetch('/api/interventions'),
        fetch('/api/users'),
        fetch('/api/categories'),
        fetch('/api/periods')
      ]);
      
      setInterventions(await intRes.json());
      setUsers(await userRes.json());
      setCategories(await catRes.json());
      setPeriods(await perRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntervention)
      });
      if (response.ok) {
        setShowAddModal(false);
        setNewIntervention({
          user_id: 1,
          category_id: 1,
          period_id: 1,
          object: '',
          intervention_date: new Date().toISOString().split('T')[0]
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding intervention:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding category:", newCategory);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (response.ok) {
        console.log("Category added successfully");
        setShowCategoryModal(false);
        setNewCategory({ title: '' });
        fetchData();
      } else {
        const errorData = await response.json();
        console.error("Failed to add category:", errorData);
        alert(errorData.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Network error adding category');
    }
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding period:", newPeriod);
    try {
      const response = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriod)
      });
      if (response.ok) {
        console.log("Period added successfully");
        setShowPeriodModal(false);
        setNewPeriod({ title: '' });
        fetchData();
      } else {
        const errorData = await response.json();
        console.error("Failed to add period:", errorData);
        alert(errorData.error || 'Failed to add period');
      }
    } catch (error) {
      console.error('Error adding period:', error);
      alert('Network error adding period');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this intervention?')) return;
    try {
      await fetch(`/api/interventions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting intervention:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure? This will fail if the category is being used.')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      } else {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDeletePeriod = async (id: number) => {
    if (!confirm('Are you sure? This will fail if the period is being used.')) return;
    try {
      const res = await fetch(`/api/periods/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      } else {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting period:', error);
    }
  };

  const filteredInterventions = interventions.filter(item => {
    const matchesSearch = item.object.toLowerCase().includes(filter.search.toLowerCase()) ||
                          item.user_name?.toLowerCase().includes(filter.search.toLowerCase());
    const matchesCategory = filter.category === 'all' || item.category_id.toString() === filter.category;
    const matchesPeriod = filter.period === 'all' || item.period_id.toString() === filter.period;
    return matchesSearch && matchesCategory && matchesPeriod;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Object', 'User', 'Category', 'Date', 'Period'];
    const rows = filteredInterventions.map(item => [
      item.id,
      `"${item.object.replace(/"/g, '""')}"`,
      item.user_name,
      item.category_title,
      item.intervention_date,
      item.period_title
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `interventions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#141414] bg-[#E4E3E0] z-20 hidden md:flex flex-col">
        <div className="p-6 border-bottom border-[#141414]">
          <h1 className="font-serif italic text-2xl font-bold tracking-tight">Interventions</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Management System v1.0</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setView('interventions')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-sm text-sm transition-all ${view === 'interventions' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            <LayoutDashboard size={18} />
            <span>Interventions</span>
          </button>
          <button 
            onClick={() => setView('categories')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-sm text-sm transition-all ${view === 'categories' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            <Tag size={18} />
            <span>Categories</span>
          </button>
          <button 
            onClick={() => setView('periods')}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-sm text-sm transition-all ${view === 'periods' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            <Clock size={18} />
            <span>Periods</span>
          </button>
          <div className="pt-4 border-t border-[#141414]/10">
            <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#141414]/5 rounded-sm text-sm transition-all text-left">
              <UserIcon size={18} />
              <span>Team</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#141414]/5 rounded-sm text-sm transition-all text-left">
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#141414] rounded-full flex items-center justify-center text-[#E4E3E0] text-xs font-bold">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-[10px] opacity-50 truncate">admin@system.local</p>
            </div>
            <button className="opacity-50 hover:opacity-100 transition-opacity">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-6 md:p-10">
        {view === 'interventions' && (
          <>
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="font-serif italic text-4xl md:text-5xl font-medium">Interventions Log</h2>
                <p className="mt-2 text-sm opacity-60 max-w-md">
                  Real-time tracking and management of all field interventions and maintenance activities.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={exportToCSV}
                  className="flex items-center justify-center gap-2 border border-[#141414] text-[#141414] px-6 py-3 rounded-sm hover:bg-[#141414] hover:text-[#E4E3E0] transition-all font-medium"
                >
                  <Download size={20} />
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-sm hover:scale-[1.02] active:scale-[0.98] transition-all font-medium shadow-lg"
                >
                  <Plus size={20} />
                  <span>New Intervention</span>
                </button>
              </div>
            </header>

            {/* Stats / Quick Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              {[
                { label: 'Total Logs', value: interventions.length, color: 'bg-white' },
                { label: 'Today', value: interventions.filter(i => i.intervention_date === new Date().toISOString().split('T')[0]).length, color: 'bg-white' },
                { label: 'Categories', value: categories.length, color: 'bg-white' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.color} border border-[#141414] p-6 flex flex-col justify-between h-32`}>
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">{stat.label}</span>
                  <span className="text-4xl font-mono font-light tracking-tighter">{stat.value.toString().padStart(2, '0')}</span>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-wrap items-center gap-4 p-4 border border-[#141414] bg-white/50 backdrop-blur-sm">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by object or user..." 
                  className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none text-sm transition-all"
                  value={filter.search}
                  onChange={e => setFilter({...filter, search: e.target.value})}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter size={16} className="opacity-50" />
                <select 
                  className="bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none text-sm py-2 cursor-pointer"
                  value={filter.category}
                  onChange={e => setFilter({...filter, category: e.target.value})}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} className="opacity-50" />
                <select 
                  className="bg-transparent border-b border-[#141414]/20 focus:border-[#141414] outline-none text-sm py-2 cursor-pointer"
                  value={filter.period}
                  onChange={e => setFilter({...filter, period: e.target.value})}
                >
                  <option value="all">All Periods</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>

            {/* Data Grid */}
            <div className="border border-[#141414] bg-white overflow-hidden">
              <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_80px] p-4 border-bottom border-[#141414] bg-[#141414] text-[#E4E3E0]">
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">#</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">Object / Description</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">User</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">Category</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">Schedule</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70 text-right">Actions</span>
              </div>

              <div className="divide-y divide-[#141414]">
                <AnimatePresence mode="popLayout">
                  {filteredInterventions.length > 0 ? (
                    filteredInterventions.map((item, idx) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={item.id} 
                        className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_80px] p-4 items-center hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group cursor-default"
                      >
                        <span className="font-mono text-xs opacity-50 group-hover:opacity-100">{(idx + 1).toString().padStart(2, '0')}</span>
                        <div className="pr-4">
                          <p className="font-medium text-sm truncate">{item.object}</p>
                          <p className="text-[10px] opacity-50 group-hover:opacity-70 mt-0.5">ID: {item.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#141414]/10 group-hover:bg-[#E4E3E0]/20 flex items-center justify-center">
                            <UserIcon size={10} />
                          </div>
                          <span className="text-sm">{item.user_name}</span>
                        </div>
                        <div>
                          <span className="inline-block px-2 py-0.5 border border-[#141414]/20 group-hover:border-[#E4E3E0]/30 rounded-full text-[10px] uppercase font-bold tracking-tight">
                            {item.category_title}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-mono">{item.intervention_date}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-50 group-hover:opacity-70">{item.period_title}</span>
                        </div>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-sm transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-20 text-center">
                      <p className="font-serif italic text-xl opacity-30">No interventions found matching your criteria.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}

        {view === 'categories' && (
          <>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="font-serif italic text-4xl md:text-5xl font-medium">Category Management</h2>
                <p className="mt-2 text-sm opacity-60 max-w-md">
                  Define and organize the types of interventions available in the system.
                </p>
              </div>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-sm hover:scale-[1.02] active:scale-[0.98] transition-all font-medium shadow-lg"
              >
                <Plus size={20} />
                <span>New Category</span>
              </button>
            </header>

            <div className="border border-[#141414] bg-white overflow-hidden max-w-2xl">
              <div className="grid grid-cols-[60px_1fr_80px] p-4 border-bottom border-[#141414] bg-[#141414] text-[#E4E3E0]">
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">ID</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">Title</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70 text-right">Actions</span>
              </div>
              <div className="divide-y divide-[#141414]">
                {categories.map(cat => (
                  <div key={cat.id} className="grid grid-cols-[60px_1fr_80px] p-4 items-center hover:bg-[#141414]/5 transition-all">
                    <span className="font-mono text-xs opacity-50">{cat.id}</span>
                    <span className="text-sm font-medium">{cat.title}</span>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-sm transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'periods' && (
          <>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="font-serif italic text-4xl md:text-5xl font-medium">Period Management</h2>
                <p className="mt-2 text-sm opacity-60 max-w-md">
                  Manage the time slots and periods used for scheduling interventions.
                </p>
              </div>
              <button 
                onClick={() => setShowPeriodModal(true)}
                className="flex items-center justify-center gap-2 bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-sm hover:scale-[1.02] active:scale-[0.98] transition-all font-medium shadow-lg"
              >
                <Plus size={20} />
                <span>New Period</span>
              </button>
            </header>

            <div className="border border-[#141414] bg-white overflow-hidden max-w-2xl">
              <div className="grid grid-cols-[60px_1fr_80px] p-4 border-bottom border-[#141414] bg-[#141414] text-[#E4E3E0]">
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">ID</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70">Title</span>
                <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-70 text-right">Actions</span>
              </div>
              <div className="divide-y divide-[#141414]">
                {periods.map(period => (
                  <div key={period.id} className="grid grid-cols-[60px_1fr_80px] p-4 items-center hover:bg-[#141414]/5 transition-all">
                    <span className="font-mono text-xs opacity-50">{period.id}</span>
                    <span className="text-sm font-medium">{period.title}</span>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleDeletePeriod(period.id)}
                        className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-sm transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-[#E4E3E0] border border-[#141414] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-[#141414] flex justify-between items-center">
                <h3 className="font-serif italic text-2xl">Log New Intervention</h3>
                <button onClick={() => setShowAddModal(false)} className="opacity-50 hover:opacity-100"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form onSubmit={handleAddIntervention} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Object / Description</label>
                  <input required type="text" className="w-full bg-transparent border-b border-[#141414] py-2 outline-none focus:bg-white/30 transition-all px-2" value={newIntervention.object} onChange={e => setNewIntervention({...newIntervention, object: e.target.value})} placeholder="e.g., HVAC System Repair" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">User</label>
                    <select className="w-full bg-transparent border-b border-[#141414] py-2 outline-none cursor-pointer" value={newIntervention.user_id} onChange={e => setNewIntervention({...newIntervention, user_id: parseInt(e.target.value)})}>
                      {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Category</label>
                    <select className="w-full bg-transparent border-b border-[#141414] py-2 outline-none cursor-pointer" value={newIntervention.category_id} onChange={e => setNewIntervention({...newIntervention, category_id: parseInt(e.target.value)})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Date</label>
                    <input required type="date" className="w-full bg-transparent border-b border-[#141414] py-2 outline-none" value={newIntervention.intervention_date} onChange={e => setNewIntervention({...newIntervention, intervention_date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Period</label>
                    <select className="w-full bg-transparent border-b border-[#141414] py-2 outline-none cursor-pointer" value={newIntervention.period_id} onChange={e => setNewIntervention({...newIntervention, period_id: parseInt(e.target.value)})}>
                      {periods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-sm font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg mt-4">Submit Log</button>
              </form>
            </motion.div>
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCategoryModal(false)} className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[#E4E3E0] border border-[#141414] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-[#141414] flex justify-between items-center">
                <h3 className="font-serif italic text-2xl">New Category</h3>
                <button onClick={() => setShowCategoryModal(false)} className="opacity-50 hover:opacity-100"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form onSubmit={handleAddCategory} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Category Title</label>
                  <input required type="text" className="w-full bg-transparent border-b border-[#141414] py-2 outline-none focus:bg-white/30 transition-all px-2" value={newCategory.title} onChange={e => setNewCategory({ title: e.target.value })} placeholder="e.g., Emergency" />
                </div>
                <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-sm font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg mt-4">Add Category</button>
              </form>
            </motion.div>
          </div>
        )}

        {showPeriodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPeriodModal(false)} className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[#E4E3E0] border border-[#141414] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-[#141414] flex justify-between items-center">
                <h3 className="font-serif italic text-2xl">New Period</h3>
                <button onClick={() => setShowPeriodModal(false)} className="opacity-50 hover:opacity-100"><Plus className="rotate-45" size={24} /></button>
              </div>
              <form onSubmit={handleAddPeriod} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Period Title</label>
                  <input required type="text" className="w-full bg-transparent border-b border-[#141414] py-2 outline-none focus:bg-white/30 transition-all px-2" value={newPeriod.title} onChange={e => setNewPeriod({ title: e.target.value })} placeholder="e.g., Night Shift" />
                </div>
                <button type="submit" className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-sm font-bold uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg mt-4">Add Period</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
