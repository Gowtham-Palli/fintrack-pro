// FinTrack Pro: Elite Analytics Edition (Interactive Curve Tooltips + Scanline Effect)
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { create } from 'zustand';
import { Trash2, User, Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Filter, RotateCcw, Clock, Tag, TrendingUp, Edit3, Search, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

// ---------------- CUSTOM HOOKS ----------------

function useMousePosition() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  return mousePos;
}

function useScrollReveal(active, triggerKey) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.01 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [active, triggerKey]); 

  return [ref, isVisible];
}

// ---------------- STORE ----------------
const useStore = create((set) => ({
  role: 'admin',
  setRole: (role) => set({ role }),
  transactions: [
    { id: 1, date: '2026-04-01', time: '09:30 AM', amount: 5000, category: 'Salary', type: 'income' },
    { id: 2, date: '2026-04-02', time: '01:10 PM', amount: 1200, category: 'Food', type: 'expense' },
    { id: 3, date: '2026-04-03', time: '06:45 PM', amount: 800, category: 'Shopping', type: 'expense' },
    { id: 4, date: '2026-04-04', time: '11:20 AM', amount: 2000, category: 'Freelance', type: 'income' },
    { id: 5, date: '2026-04-05', time: '08:15 AM', amount: 400, category: 'Transport', type: 'expense' },
  ],
  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) })),
  updateTransaction: (updated) => set((s) => ({
    transactions: s.transactions.map(t => t.id === updated.id ? updated : t)
  })),
}));

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

// 🟢 ENHANCED CURVE TOOLTIP
const CustomCurveTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 ring-1 ring-indigo-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${data.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{data.category}</p>
        </div>
        <p className="text-xl font-black text-white mb-1">₹{data.amount.toLocaleString()}</p>
        <div className="flex items-center gap-2 text-gray-500 text-[9px] font-bold">
          <Clock size={10} />
          <span>{data.date} • {data.time}</span>
        </div>
      </div>
    );
  }
  return null;
};

// 🟢 PIE TOOLTIP
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
        <p className="text-sm font-bold text-white">₹{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const mousePos = useMousePosition();
  const { role, setRole, transactions, addTransaction, deleteTransaction, updateTransaction } = useStore();
  
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ date: '', amount: '', category: '', type: 'expense' });

  const revealTrigger = useMemo(() => `trigger-${role}`, [role]);
  const [statsRef, statsVisible] = useScrollReveal(isIntroFinished, revealTrigger);
  const [insightRef, insightVisible] = useScrollReveal(isIntroFinished, revealTrigger);
  const [chartRef, chartVisible] = useScrollReveal(isIntroFinished, revealTrigger);
  const [formRef, formVisible] = useScrollReveal(isIntroFinished, revealTrigger);
  const [tableRef, tableVisible] = useScrollReveal(isIntroFinished, revealTrigger);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroFinished(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const processedData = useMemo(() => {
    let data = [...transactions];
    if (searchQuery) data = data.filter(t => t.category.toLowerCase().includes(searchQuery.toLowerCase()));
    if (startDate) data = data.filter(t => new Date(t.date) >= new Date(startDate));
    if (endDate) data = data.filter(t => new Date(t.date) <= new Date(endDate));
    if (sortBy === 'amount') data.sort((a, b) => b.amount - a.amount);
    else data.sort((a, b) => new Date(b.date) - new Date(a.date));
    return data;
  }, [transactions, searchQuery, sortBy, startDate, endDate]);

  const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;

  const expenseData = useMemo(() => {
    const grouped = processedData.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [processedData]);

  const topCategory = expenseData.length ? [...expenseData].sort((a,b) => b.value - a.value)[0].name : 'N/A';
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  const handleSubmit = () => {
    if (!form.date || !form.amount || !form.category) return;
    if (editingId) {
      updateTransaction({ ...form, id: editingId, amount: Number(form.amount) });
      setEditingId(null);
    } else {
      addTransaction({ ...form, id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }), amount: Number(form.amount) });
    }
    setForm({ date: '', amount: '', category: '', type: 'expense' });
  };

  if (!isIntroFinished) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[100]">
        <style>{`
          @keyframes typing { from { width: 0 } to { width: 100% } }
          @keyframes blink { 50% { border-color: transparent } }
          .typewriter-text { overflow: hidden; border-right: 4px solid #6366f1; white-space: nowrap; letter-spacing: 0.15em; width: 0; animation: typing 1.5s steps(15, end) forwards, blink 0.6s step-end infinite; }
        `}</style>
        <h1 className="typewriter-text text-3xl sm:text-5xl font-black font-[Orbitron] text-white uppercase text-center">FINTRACK PRO</h1>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden relative font-sans">
      
      <div className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[100px] z-0 transition-transform duration-200 ease-out" style={{ transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)` }} />

      <style>{`
        @keyframes snappyReveal { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .reveal-active { animation: snappyReveal 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .reveal-idle { opacity: 0; transform: translateY(20px); }
        .stagger-1 { animation-delay: 50ms; }
        .stagger-2 { animation-delay: 100ms; }
        .stagger-3 { animation-delay: 150ms; }
        input[type="date"]::before { content: attr(placeholder); width: 100%; color: #6b7280; }
        input[type="date"]:focus::before, input[type="date"]:valid::before { content: ""; display: none; }
        input[type="date"] { color-scheme: dark; min-height: 56px; }
      `}</style>

      <div className="relative z-10 w-full px-4 sm:px-10 py-10 space-y-12 max-w-full mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-white/5 pb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-white/5 rounded-full border border-white/10 shadow-lg"><User size={24}/></div>
            <div className="space-y-1 text-center md:text-left">
               <h1 className="text-2xl font-black tracking-tight font-[Orbitron] bg-gradient-to-r from-white via-indigo-400 to-gray-600 bg-clip-text text-transparent">FINTRACK PRO</h1>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Intelligent Analytics</p>
            </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <button onClick={() => setRole('viewer')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black transition-all ${role === 'viewer' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>VIEWER</button>
            <button onClick={() => setRole('admin')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}>ADMIN</button>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <section ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${statsVisible ? 'reveal-active stagger-1' : 'reveal-idle'}`}><Card title="Current Assets" value={balance} icon={<Wallet />} color="text-white" /></div>
          <div className={`${statsVisible ? 'reveal-active stagger-2' : 'reveal-idle'}`}><Card title="Total Revenue" value={income} icon={<ArrowUpCircle />} color="text-green-400" /></div>
          <div className={`${statsVisible ? 'reveal-active stagger-3' : 'reveal-idle'}`}><Card title="Total Outflow" value={expense} icon={<ArrowDownCircle />} color="text-red-400" /></div>
        </section>

        {/* INSIGHTS SECTION */}
        <section ref={insightRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${insightVisible ? 'reveal-active' : 'reveal-idle'}`}>
          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white/[0.05] transition-all">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform"><BarChart3 size={20}/></div>
            <div><p className="text-[9px] font-black text-gray-500 uppercase">Top Drain</p><p className="text-sm font-bold truncate w-24">{topCategory}</p></div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white/[0.05] transition-all">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-400 group-hover:scale-110 transition-transform"><TrendingUp size={20}/></div>
            <div><p className="text-[9px] font-black text-gray-500 uppercase">Savings Rate</p><p className="text-sm font-bold">{savingsRate}%</p></div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white/[0.05] transition-all">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform"><Clock size={20}/></div>
            <div><p className="text-[9px] font-black text-gray-500 uppercase">Entries</p><p className="text-sm font-bold">{transactions.length}</p></div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white/[0.05] transition-all">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform"><Tag size={20}/></div>
            <div><p className="text-[9px] font-black text-gray-500 uppercase">Avg Value</p><p className="text-sm font-bold">₹{transactions.length ? Math.round(income / transactions.length) : 0}</p></div>
          </div>
        </section>

        {/* CHARTS */}
        <section ref={chartRef} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className={`p-8 rounded-[40px] bg-white/[0.02] border border-white/5 h-[400px] backdrop-blur-md shadow-xl transition-all ${chartVisible ? 'reveal-active' : 'reveal-idle'}`}>
            <h2 className="text-[11px] font-black tracking-widest text-indigo-400 uppercase mb-8 flex items-center gap-2"><TrendingUp size={14}/> Transaction Curve</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...transactions].reverse()}>
                  {/* 🟠 Small dialogue box tooltip enabled with details */}
                  <Tooltip content={<CustomCurveTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`p-8 rounded-[40px] bg-white/[0.02] border border-white/5 h-[400px] flex items-center justify-center backdrop-blur-md shadow-xl transition-all ${chartVisible ? 'reveal-active stagger-1' : 'reveal-idle'}`}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie data={expenseData} innerRadius={90} outerRadius={120} dataKey="value" paddingAngle={8} stroke="none">
                    {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
               </PieChart>
             </ResponsiveContainer>
          </div>
        </section>

        {/* ADMIN FORM */}
        {role === 'admin' && (
          <section ref={formRef} className={`p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border-2 transition-all duration-300 ${editingId ? 'bg-indigo-600/[0.03] border-indigo-500/30' : 'bg-white/[0.02] border-white/5'} ${formVisible ? 'reveal-active' : 'reveal-idle'} shadow-2xl`}>
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black uppercase italic flex items-center gap-4 text-white"><div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">{editingId ? <Edit3 size={18}/> : <Plus size={18}/>}</div>{editingId ? 'Modify Record' : 'New Entry'}</h2>
               {editingId && <button onClick={() => {setEditingId(null); setForm({ date: '', amount: '', category: '', type: 'expense' });}} className="text-[10px] font-black text-red-500 tracking-widest uppercase">Discard</button>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="w-full">
                <label className="text-[10px] font-black text-gray-500 ml-2 uppercase">Date</label>
                <input type="date" placeholder="Select Date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all text-sm text-white" />
              </div>
              <div className="w-full">
                <label className="text-[10px] font-black text-gray-500 ml-2 uppercase">Magnitude (₹)</label>
                <input type="number" placeholder="Enter Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all text-sm text-white" />
              </div>
              <div className="w-full">
                <label className="text-[10px] font-black text-gray-500 ml-2 uppercase">Classification</label>
                <input type="text" placeholder="Category Name" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all text-sm text-white" />
              </div>
              <div className="flex bg-black/40 rounded-2xl p-1 border border-white/10 h-[60px]">
                <button onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 rounded-xl text-[10px] font-black ${form.type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}>EXPENSE</button>
                <button onClick={() => setForm({...form, type: 'income'})} className={`flex-1 rounded-xl text-[10px] font-black ${form.type === 'income' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'}`}>INCOME</button>
              </div>
            </div>
            <button onClick={handleSubmit} className="mt-8 bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-[18px] text-[11px] font-black tracking-widest shadow-lg transition-all uppercase text-white w-full sm:w-auto">{editingId ? 'Update Ledger' : 'Commit Entry'}</button>
          </section>
        )}

        {/* SEARCH & LEDGER TABLE */}
        <section ref={tableRef} className={`space-y-8 ${tableVisible ? 'reveal-active' : 'reveal-idle'}`}>
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-[22px] border border-white/10 backdrop-blur-xl flex-1">
              <Search size={18} className="text-gray-500" />
              <input type="text" placeholder="Search categories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-[11px] font-bold outline-none text-gray-300 w-full uppercase tracking-widest" />
            </div>
            <div className="flex flex-wrap items-center gap-4 bg-white/5 px-6 py-3 rounded-[22px] border border-white/10 backdrop-blur-xl">
              <Filter size={18} className="text-gray-500" />
              <div className="flex gap-2">
                <button onClick={() => setSortBy('date')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-tighter transition-all ${sortBy === 'date' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>NEWEST</button>
                <button onClick={() => setSortBy('amount')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-tighter transition-all ${sortBy === 'amount' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>HIGHEST</button>
              </div>
              <button onClick={() => {setSearchQuery(''); setStartDate(''); setEndDate(''); setSortBy('date')}} className="text-[9px] font-black text-gray-500 hover:text-white transition-colors"><RotateCcw size={14}/></button>
            </div>
          </div>

          <div className="rounded-[32px] sm:rounded-[48px] bg-white/[0.01] border border-white/5 shadow-2xl backdrop-blur-3xl overflow-y-auto max-h-[600px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-indigo-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-500/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 border-b border-white/5">
                  <tr className="px-8 py-6">
                    <th className="px-8 py-6 text-indigo-400">Timestamp</th><th className="px-8 py-6">Classification</th><th className="px-8 py-6 text-right">Value</th>{role === 'admin' && <th className="px-8 py-6 text-center">Manage</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processedData.map((t) => (
                    <tr key={t.id} className="group hover:bg-white/[0.02] transition-all">
                      <td className="px-8 py-6">
                        <div className="font-bold text-base tracking-tight text-white">{t.date}</div>
                        <div className="text-[9px] text-indigo-400 font-black flex items-center gap-1.5 mt-1 uppercase opacity-70 tracking-widest"><Clock size={12}/> {t.time}</div>
                      </td>
                      <td className="px-8 py-6"><div className="flex items-center gap-4 text-gray-400 font-bold"><div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><Tag size={14} className="text-gray-600"/></div>{t.category}</div></td>
                      <td className={`px-8 py-6 text-right font-mono text-xl font-black ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>₹{t.amount.toLocaleString()}</td>
                      {role === 'admin' && (
                        <td className="px-8 py-6 text-center">
                          <div className="flex justify-center gap-4">
                            <button onClick={() => {setEditingId(t.id); setForm(t); window.scrollTo({top: 400, behavior: 'smooth'})}} className="p-3 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-xl transition-all"><Edit3 size={16}/></button>
                            <button onClick={() => deleteTransaction(t.id)} className="p-3 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, value, color, icon }) {
  return (
    <div className="p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all duration-700 shadow-xl relative overflow-hidden">
      <div className="space-y-2 relative z-10">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-indigo-400">{title}</h3>
        <p className={`text-2xl sm:text-3xl font-black tracking-tighter ${color}`}>₹{value.toLocaleString()}</p>
      </div>
      <div className="relative z-10 p-4 sm:p-5 bg-white/5 rounded-2xl text-gray-500 group-hover:text-indigo-400 group-hover:scale-110 transition-all">{icon}</div>
    </div>
  );
}