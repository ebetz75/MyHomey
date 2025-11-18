import React from 'react';
import { InventoryItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, Package, TrendingUp, ShieldCheck, Download, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { exportToCSV } from '../services/storageService';

interface DashboardProps {
  items: InventoryItem[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#6B7280'];

export const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  const totalCurrentValue = items.reduce((sum, item) => sum + item.currentValue, 0);
  const totalPurchasePrice = items.reduce((sum, item) => sum + item.purchasePrice, 0);
  const totalItems = items.length;

  // Warranty Stats
  const activeWarranties = items.filter(i => {
     if (!i.warrantyExpiration) return false;
     return new Date(i.warrantyExpiration) > new Date();
  }).length;

  const expiringSoon = items.filter(i => {
      if (!i.warrantyExpiration) return false;
      const expiry = new Date(i.warrantyExpiration);
      const today = new Date();
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays < 90; // Less than 90 days
  }).length;

  // Data for Category Pie Chart
  const categoryData = Object.entries(
    items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.currentValue;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 pb-24">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Total Asset Value</p>
              <h2 className="text-3xl font-bold">${totalCurrentValue.toLocaleString()}</h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-lg">
              <Wallet className="w-6 h-6 text-indigo-200" />
            </div>
          </div>
          
          <div className="flex gap-4 text-xs text-indigo-200 border-t border-white/10 pt-4">
            <div>
              <span className="block opacity-60">Purchase Cost</span>
              <span className="font-semibold">${totalPurchasePrice.toLocaleString()}</span>
            </div>
             <div>
              <span className="block opacity-60">Items</span>
              <span className="font-semibold">{totalItems}</span>
            </div>
          </div>
        </div>
        {/* Background Decor */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* Warranty & Protection Widget */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
               <ShieldCheck className="w-5 h-5" />
               <span className="text-xs font-bold uppercase">Active Warranties</span>
            </div>
            <div className="flex items-end gap-2">
               <span className="text-2xl font-bold text-gray-800">{activeWarranties}</span>
               <span className="text-xs text-gray-400 mb-1">items covered</span>
            </div>
         </div>
         <div className={`p-4 rounded-2xl shadow-sm border flex flex-col justify-between ${expiringSoon > 0 ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100'}`}>
            <div className={`flex items-center gap-2 mb-2 ${expiringSoon > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
               <AlertTriangle className="w-5 h-5" />
               <span className="text-xs font-bold uppercase">Expiring Soon</span>
            </div>
            <div className="flex items-end gap-2">
               <span className={`text-2xl font-bold ${expiringSoon > 0 ? 'text-orange-700' : 'text-gray-800'}`}>{expiringSoon}</span>
               <span className={`text-xs mb-1 ${expiringSoon > 0 ? 'text-orange-600' : 'text-gray-400'}`}>next 90 days</span>
            </div>
         </div>
      </div>

      {/* Export Action - The Money Maker */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="bg-emerald-100 p-2 rounded-full">
             <Download className="w-5 h-5 text-emerald-600" />
           </div>
           <div>
             <h3 className="text-sm font-bold text-emerald-900">Insurance Report</h3>
             <p className="text-xs text-emerald-700">Download CSV for claims</p>
           </div>
        </div>
        <button 
          onClick={() => exportToCSV(items)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-2 transition-transform active:scale-95"
        >
          Export
        </button>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Value by Category
        </h3>
        {items.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   formatter={(value: number) => `$${value.toLocaleString()}`}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {categoryData.sort((a,b) => b.value - a.value).slice(0, 5).map((entry, index) => (
                 <div key={entry.name} className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name}
                 </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
            <AlertCircle className="w-8 h-8 opacity-20" />
            <span>No inventory data yet</span>
          </div>
        )}
      </div>
    </div>
  );
};
