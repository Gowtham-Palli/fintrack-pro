// FinTrack Pro: Elite Edition (Dual Custom Tooltips + Glowing Curves + Stable Performance)
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { create } from 'zustand';
import { Trash2, User, Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Filter, RotateCcw, Clock, Tag, TrendingUp, Edit3 } from 'lucide-react';
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
  ],
  addTransaction: (t) => set((s) => ({ transactions: [t, ...s.transactions] })),
  deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter(t => t.id !== id) })),
  updateTransaction: (updated) => set((s) => ({
    transactions: s.transactions.map(t => t.id === updated.id ? updated : t)
  })),
}));

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

// 🟢 SHARED CUSTOM TOOLTIP COMPONENT
const CustomChartTooltip = ({ active, payload, label, isPie = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">
          {isPie ? payload[0].name : label}
        </p>
        <p className="text-xl font-black text-white">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const mousePos = useMousePosition();
  const { role, setRole, transactions, addTransaction, deleteTransaction, updateTransaction } = useStore();
  
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ date: '', amount: '', category: '', type: 'expense' });

  const revealTrigger = useMemo(() => `trigger-${role}`, [role]);
  const [statsRef, statsVisible] = useScrollReveal(isIntroFinished, revealTrigger);
  const [chartRef, chartVisible] = useScrollReveal(isIntroFinished, revealTrigger);
  const [formSectionRef, formVisible] = useScrollReveal(isIntroFinished, revealTrigger);
  const [tableRef, tableVisible] = useScrollReveal(isIntroFinished, revealTrigger);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroFinished(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const balance = income - expense;

  const expenseData = useMemo(() => {
    const grouped = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const handleSubmit = () => {
    if (!form.date || !form.amount || !form.category) return;
    if (editingId) {
      updateTransaction({ ...form, id: editingId, amount: Number(form.amount) });
      setEditingId(null);
    } else {
      addTransaction({ 
        ...form, id: Date.now(), 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }), 
        amount: Number(form.amount) 
      });
    }
    setForm({ date: '', amount: '', category: '', type: 'expense' });
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-x-hidden relative font-sans">
      
      {/* 🟣 TYPEWRITER INTRO */}
      {!isIntroFinished && (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[100]">
          <style>{`
            @keyframes typing { from { width: 0 } to { width: 100% } }
            @keyframes blink { 50% { border-color: transparent } }
            .typewriter-text {
              overflow: hidden;
              border-right: 4px solid #6366f1;
              white-space: nowrap;
              letter-spacing: 0.15em;
              width: 0;
              animation: typing 1.5s steps(15, end) forwards, blink 0.6s step-end infinite;
            }
          `}</style>
          <h1 className="typewriter-text text-3xl sm:text-5xl font-black font-[Orbitron] text-white uppercase text-center">
            FINTRACK PRO
          </h1>
        </div>
      )}

      {/* 🟣 DYNAMIC MOUSE SPOTLIGHT */}
      <div 
        className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[100px] z-0 transition-transform duration-200 ease-out"
        style={{ transform: `translate(${mousePos.x - 300}px, ${mousePos.y - 300}px)` }}
      />

      <style>{`
        @keyframes snappyReveal { 
          0% { opacity: 0; transform: translateY(20px); filter: blur(4px); } 
          100% { opacity: 1; transform: translateY(0); filter: blur(0); } 
        }
        .reveal-active { animation: snappyReveal 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        .reveal-idle { opacity: 0; transform: translateY(20px); }
        .stagger-1 { animation-delay: 50ms; }
        .stagger-2 { animation-delay: 100ms; }
        .stagger-3 { animation-delay: 150ms; }
      `}</style>

      {/* Main Dashboard Container */}
      <div className={`relative z-10 w-full px-4 sm:px-10 py-10 space-y-12 max-w-full mx-auto transition-opacity duration-700 ${isIntroFinished ? 'opacity-100 block' : 'opacity-0 invisible h-0'}`}>
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-white/5 pb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="p-3 bg-white/5 rounded-full border border-white/10 shadow-lg"><User size={24}/></div>
            <div className="space-y-1">
               <h1 className="text-2xl font-black tracking-[0.2em] font-[Orbitron] bg-gradient-to-r from-white via-indigo-400 to-gray-600 bg-clip-text text-transparent">FINTRACK PRO</h1>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Intelligence</p>
            </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <button onClick={() => setRole('viewer')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black transition-all ${role === 'viewer' ? 'bg-white/10 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}>VIEWER</button>
            <button onClick={() => setRole('admin')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black transition-all ${role === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}>ADMIN</button>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <section ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${statsVisible ? 'reveal-active stagger-1' : 'reveal-idle'}`}><Card title="Net Balance" value={balance} icon={<Wallet />} color="text-white" /></div>
          <div className={`${statsVisible ? 'reveal-active stagger-2' : 'reveal-idle'}`}><Card title="Total Income" value={income} icon={<ArrowUpCircle />} color="text-green-400" /></div>
          <div className={`${statsVisible ? 'reveal-active stagger-3' : 'reveal-idle'}`}><Card title="Total Expense" value={expense} icon={<ArrowDownCircle />} color="text-red-400" /></div>
        </section>

        {/* CHARTS */}
        <section ref={chartRef} className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* CURVE CHART (LINE CHART) */}
          <div className={`p-8 rounded-[32px] bg-white/[0.02] border border-white/5 h-[400px] backdrop-blur-md shadow-xl transition-all ${chartVisible ? 'reveal-active' : 'reveal-idle'}`}>
            <h2 className="text-[11px] font-black tracking-widest text-indigo-400 uppercase mb-10 flex items-center gap-2"><TrendingUp size={14}/> Capital Flow</h2>
            <div className="h-64 w-full min-h-[250px]">
              {chartVisible && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transactions}>
                    {/* 🟠 Custom Dialogue Tooltip for Curve Chart */}
                    <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#6366f1" 
                      strokeWidth={5} 
                      dot={false} 
                      isAnimationActive={true} 
                      filter="drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.8))"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* PIE CHART */}
          <div className={`p-8 rounded-[32px] bg-white/[0.02] border border-white/5 h-[400px] backdrop-blur-md shadow-xl flex items-center justify-center transition-all ${chartVisible ? 'reveal-active stagger-1' : 'reveal-idle'}`}>
             {chartVisible && (
               <div className="w-full h-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie data={expenseData} innerRadius={90} outerRadius={120} dataKey="value" paddingAngle={8} stroke="none" isAnimationActive={true}>
                        {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      {/* 🟠 Custom Dialogue Tooltip for Pie Chart */}
                      <Tooltip content={<CustomChartTooltip isPie={true} />} />
                  </PieChart>
                </ResponsiveContainer>
               </div>
             )}
          </div>
        </section>

        {/* ADMIN FORM */}
        {role === 'admin' && (
          <section ref={formSectionRef} className={`p-10 rounded-[40px] border-2 transition-all duration-300 ${editingId ? 'bg-indigo-600/[0.03] border-indigo-500/30' : 'bg-white/[0.02] border-white/5 shadow-2xl'} ${formVisible ? 'reveal-active' : 'reveal-idle'}`}>
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-xl font-black uppercase italic flex items-center gap-4 text-white">
                 <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">{editingId ? <Edit3 size={18}/> : <Plus size={18}/>}</div>
                 {editingId ? 'Modify Record' : 'New Entry'}
               </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 ml-2">DATE</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 ml-2">MAGNITUDE (₹)</label>
                <input type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 ml-2">TAG</label>
                <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-500 transition-all text-sm text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 ml-2">FLOW TYPE</label>
                <div className="flex bg-black/40 rounded-2xl p-1 border border-white/10 h-[60px]">
                  <button onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 rounded-xl text-[10px] font-black transition-all ${form.type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}>EXPENSE</button>
                  <button onClick={() => setForm({...form, type: 'income'})} className={`flex-1 rounded-xl text-[10px] font-black transition-all ${form.type === 'income' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'}`}>INCOME</button>
                </div>
              </div>
            </div>
            <button onClick={handleSubmit} className="mt-8 bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-[18px] text-[11px] font-black tracking-widest shadow-lg active:scale-95 transition-all uppercase text-white">{editingId ? 'Update Ledger' : 'Commit Entry'}</button>
          </section>
        )}

        {/* LEDGER TABLE */}
        <section ref={tableRef} className={`space-y-8 ${tableVisible ? 'reveal-active' : 'reveal-idle'}`}>
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-xl">
              <Filter size={16} className="text-gray-500" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold outline-none text-gray-400" />
              <span className="text-white/10 font-thin">/</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold outline-none text-gray-400" />
            </div>
            <button onClick={() => {setStartDate(''); setEndDate('')}} className="text-[10px] font-black text-gray-500 hover:text-white tracking-tighter flex items-center gap-2"><RotateCcw size={14}/> SYSTEM RESET</button>
          </div>

          <div className="rounded-[32px] bg-white/[0.01] border border-white/5 shadow-2xl backdrop-blur-3xl overflow-y-auto max-h-[600px] 
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-indigo-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-indigo-500/40">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 border-b border-white/5">
                <tr>
                  <th className="px-8 py-6">Timestamp</th>
                  <th className="px-8 py-6">Classification</th>
                  <th className="px-8 py-6 text-right">Value</th>
                  {role === 'admin' && <th className="px-8 py-6 text-center">Manage</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="px-8 py-6">
                      <div className="font-bold text-base tracking-tight">{t.date}</div>
                      <div className="text-[9px] text-indigo-400 font-black flex items-center gap-1.5 mt-1 uppercase opacity-70 tracking-widest"><Clock size={12}/> {t.time}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 text-gray-400 font-bold">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><Tag size={14} className="text-gray-600"/></div>
                        {t.category}
                      </div>
                    </td>
                    <td className={`px-8 py-6 text-right font-mono text-xl font-black ${t.type === 'income' ? 'text-green-400' : 'text-white'}`}>₹{t.amount.toLocaleString()}</td>
                    {role === 'admin' && (
                      <td className="px-8 py-6 text-center">
                         <div className="flex justify-center gap-4">
                           <button onClick={() => {setEditingId(t.id); setForm(t); window.scrollTo({top: 400, behavior: 'smooth'})}} className="p-3 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-xl transition-all active:scale-90"><Edit3 size={16}/></button>
                           <button onClick={() => deleteTransaction(t.id)} className="p-3 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all active:scale-90"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ title, value, color, icon }) {
  return (
    <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all duration-700 shadow-xl relative overflow-hidden">
      <div className="space-y-2 relative z-10">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{title}</h3>
        <p className={`text-3xl font-black tracking-tighter ${color} drop-shadow-md`}>₹{value.toLocaleString()}</p>
      </div>
      <div className="relative z-10 p-5 bg-white/5 rounded-2xl text-gray-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-xl">
        {icon}
      </div>
    </div>
  );
}