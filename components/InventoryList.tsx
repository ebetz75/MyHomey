import React, { useState, useMemo } from 'react';
import { InventoryItem, CATEGORIES, ROOMS } from '../types';
import { Search, Trash2, Tag, Filter, Home, Box, ShieldCheck, AlertTriangle } from 'lucide-react';

interface InventoryListProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({ items, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'category' | 'room'>('category');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [showFixturesOnly, setShowFixturesOnly] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (activeFilter !== 'All') {
        if (filterType === 'category') {
          matchesFilter = item.category === activeFilter;
        } else {
          matchesFilter = item.room === activeFilter;
        }
      }

      // Real Estate Filter
      let matchesConveyance = true;
      if (showFixturesOnly) {
        matchesConveyance = item.conveyance === 'Fixture';
      }
      
      return matchesSearch && matchesFilter && matchesConveyance;
    });
  }, [items, searchTerm, filterType, activeFilter, showFixturesOnly]);

  const filterOptions = filterType === 'category' ? CATEGORIES : ROOMS;

  // Helper to check warranty
  const getWarrantyStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays < 90) return 'expiring-soon';
    return 'active';
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search and Filter Header */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm pt-2 pb-2 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setFilterType(prev => prev === 'category' ? 'room' : 'category');
              setActiveFilter('All');
            }}
            className="px-3 rounded-xl bg-white border border-gray-200 text-gray-600 flex items-center gap-2 text-xs font-medium shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" />
            {filterType === 'category' ? 'Cat' : 'Room'}
          </button>
        </div>

        {/* Quick Toggle for Real Estate View */}
        <div onClick={() => setShowFixturesOnly(!showFixturesOnly)} className={`cursor-pointer flex items-center justify-between p-2 rounded-lg border ${showFixturesOnly ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2">
               <div className={`p-1 rounded-md ${showFixturesOnly ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                 <Home className="w-4 h-4" />
               </div>
               <span className={`text-xs font-semibold ${showFixturesOnly ? 'text-emerald-800' : 'text-gray-600'}`}>
                  {showFixturesOnly ? 'Showing Fixtures (Stays w/ House)' : 'Show All Items'}
               </span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${showFixturesOnly ? 'bg-emerald-500' : 'bg-gray-300'}`}>
               <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${showFixturesOnly ? 'left-4.5' : 'left-0.5'}`} style={{ left: showFixturesOnly ? '18px' : '2px' }}></div>
            </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'All' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {filterOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setActiveFilter(opt)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === opt 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Search className="w-12 h-12 mb-2 opacity-20" />
          <p>No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map(item => {
             const warrantyStatus = getWarrantyStatus(item.warrantyExpiration);
             
             return (
            <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
              {/* Conveyance Stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.conveyance === 'Fixture' ? 'bg-emerald-400' : 'bg-indigo-400'}`}></div>
              
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden relative ml-2">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Tag className="w-6 h-6" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-0.5 text-center backdrop-blur-sm truncate px-1">
                  {item.room}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      ${item.currentValue.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mt-1 mb-1">
                     {item.conveyance === 'Fixture' ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                           <Home className="w-3 h-3" /> Stays
                        </span>
                     ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                           <Box className="w-3 h-3" /> Personal
                        </span>
                     )}

                     {warrantyStatus === 'active' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-md">
                           <ShieldCheck className="w-3 h-3" /> Warranty
                        </span>
                     )}
                     {warrantyStatus === 'expiring-soon' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-orange-50 text-orange-700 border border-orange-100 px-1.5 py-0.5 rounded-md">
                           <AlertTriangle className="w-3 h-3" /> Expiring
                        </span>
                     )}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                  {(item.serialNumber || item.modelNumber) && (
                     <p className="text-[10px] text-gray-400 font-mono mt-1">
                        SN: {item.serialNumber || 'N/A'}
                     </p>
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400">{item.purchaseDate ? `Installed: ${item.purchaseDate}` : ''}</span>
                  </div>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}})}
        </div>
      )}
    </div>
  );
};
