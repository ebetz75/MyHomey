import React, { useState, useEffect } from 'react';
import { InventoryItem, AppView } from './types';
import { getItems, saveItem, deleteItem, seedDataIfEmpty } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { AddItemModal } from './components/AddItemModal';
import { LayoutDashboard, List, Plus, Settings, Home, Download } from 'lucide-react';

// Simple UUID generator fallback to ensure compatibility
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // Ensure data exists
    seedDataIfEmpty();
    // Load data
    setItems(getItems());

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleSaveItem = (newItemData: Omit<InventoryItem, 'id' | 'dateAdded'>) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: generateId(),
      dateAdded: new Date().toISOString()
    };
    const updatedItems = saveItem(newItem);
    setItems(updatedItems);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedItems = deleteItem(id);
      setItems(updatedItems);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="px-6 pt-safe-top pb-4 bg-white sticky top-0 z-20 flex justify-between items-center border-b border-gray-100 pt-6 shadow-sm">
          <div>
             <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               <Home className="text-indigo-600 w-5 h-5" />
               My Homey
             </h1>
             <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Asset & Warranty Manager</p>
          </div>
          
          <div className="flex items-center gap-3">
            {showInstallBtn && (
              <button 
                onClick={handleInstallClick}
                className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-200 transition-colors animate-pulse"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
              JS
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 overflow-y-auto scroll-smooth pb-24 no-scrollbar">
          {currentView === AppView.DASHBOARD && (
            <div className="animate-in fade-in duration-500">
              <Dashboard items={items} />
            </div>
          )}
          {currentView === AppView.INVENTORY && (
            <div className="animate-in fade-in duration-500">
              <InventoryList items={items} onDelete={handleDeleteItem} />
            </div>
          )}
        </main>

        {/* Floating Action Button (FAB) */}
        <div className="fixed bottom-24 right-6 z-30">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg shadow-indigo-300 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-20 pb-safe-bottom pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className={`flex flex-col items-center gap-1 transition-colors p-2 rounded-xl ${
              currentView === AppView.DASHBOARD ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Overview</span>
          </button>

          <button
            onClick={() => setCurrentView(AppView.INVENTORY)}
            className={`flex flex-col items-center gap-1 transition-colors p-2 rounded-xl ${
              currentView === AppView.INVENTORY ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ledger</span>
          </button>
        </nav>

        {/* Modal */}
        <AddItemModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleSaveItem}
        />
    </div>
  );
};

export default App;
