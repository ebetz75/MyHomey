
import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, CATEGORIES, ROOMS, Conveyance } from '../types';
import { X, Camera, Sparkles, Loader2, Check, MapPin, Calendar, Hash, Home, Box, ShieldCheck, Wrench, ScanBarcode, StopCircle } from 'lucide-react';
import { analyzeItemImage } from '../services/geminiService';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'dateAdded'>) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai' | 'barcode'>('ai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Barcode Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    room: 'Living Room',
    purchasePrice: '',
    currentValue: '',
    purchaseDate: '',
    description: '',
    conveyance: 'Personal' as Conveyance,
    serialNumber: '',
    modelNumber: '',
    warrantyExpiration: '',
    maintenanceNotes: ''
  });

  // Clean up video stream on close or tab change
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setImagePreview(null);
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startScanner = async () => {
    setBarcodeError(null);
    try {
      // Check for browser support
      if (!('BarcodeDetector' in window)) {
        setBarcodeError("Barcode Detection not supported on this device. Try the AI Scan!");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        detectBarcodes();
      }
    } catch (err) {
      console.error("Camera error:", err);
      setBarcodeError("Could not access camera. Check permissions.");
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const detectBarcodes = async () => {
    if (!videoRef.current || !streamRef.current) return;
    
    // @ts-ignore - BarcodeDetector is experimental but works on Android Chrome
    const barcodeDetector = new window.BarcodeDetector({
      formats: ['ean_13', 'upc_a', 'upc_e', 'qr_code', 'code_128']
    });

    const scanLoop = async () => {
      if (!streamRef.current) return;
      
      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const code = barcodes[0].rawValue;
          // Found a barcode!
          stopScanner();
          // Populate field
          setFormData(prev => ({
            ...prev,
            serialNumber: code,
            description: prev.description ? `${prev.description} (Scanned: ${code})` : `Barcode: ${code}`
          }));
          // Switch to manual to review
          setActiveTab('manual');
        } else {
          requestAnimationFrame(scanLoop);
        }
      } catch (e) {
        // Continue scanning if detection fails momentarily
        requestAnimationFrame(scanLoop);
      }
    };
    
    scanLoop();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      
      // Auto-trigger AI analysis
      if (activeTab === 'ai') {
        setIsAnalyzing(true);
        try {
          const result = await analyzeItemImage(base64String);
          setFormData(prev => ({
            ...prev,
            name: result.name,
            category: result.category,
            room: result.room,
            currentValue: result.estimatedValue.toString(),
            purchasePrice: result.estimatedValue.toString(),
            description: result.description,
            conveyance: result.conveyance,
            serialNumber: result.serialNumber || '',
            modelNumber: result.modelNumber || ''
          }));
        } catch (error) {
          console.error("Analysis failed", error);
          alert("Could not identify item. Please fill details manually.");
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      category: formData.category,
      room: formData.room,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      currentValue: parseFloat(formData.currentValue) || 0,
      description: formData.description,
      purchaseDate: formData.purchaseDate,
      conveyance: formData.conveyance,
      serialNumber: formData.serialNumber,
      modelNumber: formData.modelNumber,
      warrantyExpiration: formData.warrantyExpiration,
      maintenanceNotes: formData.maintenanceNotes,
      imageUrl: imagePreview || undefined
    });
    
    setFormData({ 
      name: '', 
      category: 'Other', 
      room: 'Living Room',
      purchasePrice: '', 
      currentValue: '', 
      purchaseDate: '',
      description: '',
      conveyance: 'Personal',
      serialNumber: '',
      modelNumber: '',
      warrantyExpiration: '',
      maintenanceNotes: ''
    });
    setImagePreview(null);
    stopScanner();
    onClose();
  };

  const handleTabChange = (tab: 'manual' | 'ai' | 'barcode') => {
    setActiveTab(tab);
    if (tab === 'barcode') {
      startScanner();
    } else {
      stopScanner();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6">
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Add to My Homey</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Tabs */}
          <div className="flex p-1 mb-6 bg-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => handleTabChange('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'ai' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              AI Scan
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('barcode')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'barcode' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ScanBarcode className="w-3 h-3 sm:w-4 sm:h-4" />
              Barcode
            </button>
            <button
               type="button"
              onClick={() => handleTabChange('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Manual
            </button>
          </div>

          <form id="addItemForm" onSubmit={handleSubmit} className="space-y-5">
            {/* Dynamic Input Area based on Tab */}
            
            {/* AI / Image Mode */}
            {activeTab === 'ai' && (
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageUpload} 
                />
                
                <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden ${imagePreview ? 'border-indigo-500 bg-gray-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}>
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm font-medium animate-pulse">Gemini is analyzing...</span>
                        </div>
                      )}
                      {!isAnalyzing && (
                         <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                           <Check className="w-3 h-3" /> Analyzed
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Take Photo</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Barcode Mode */}
            {activeTab === 'barcode' && (
               <div className="h-40 rounded-2xl bg-black overflow-hidden relative flex items-center justify-center">
                  {barcodeError ? (
                    <div className="text-white text-center p-4">
                      <p className="text-sm text-red-300 mb-2">{barcodeError}</p>
                      <button type="button" onClick={() => handleTabChange('manual')} className="text-xs underline">Switch to Manual</button>
                    </div>
                  ) : (
                    <>
                       <video ref={videoRef} className="w-full h-full object-cover opacity-80" playsInline muted></video>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-32 border-2 border-red-500/50 rounded-lg animate-pulse relative">
                             <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
                             <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
                             <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
                             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>
                          </div>
                       </div>
                       <div className="absolute bottom-2 bg-black/50 px-3 py-1 rounded-full text-white text-xs">
                          Point at barcode
                       </div>
                    </>
                  )}
               </div>
            )}

            {/* Conveyance Toggle */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Asset Type (Real Estate)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, conveyance: 'Personal'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                    formData.conveyance === 'Personal' 
                    ? 'bg-white border-indigo-200 text-indigo-600 shadow-sm' 
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-white'
                  }`}
                >
                  <Box className="w-3 h-3" /> Personal Property
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, conveyance: 'Fixture'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                    formData.conveyance === 'Fixture' 
                    ? 'bg-white border-emerald-200 text-emerald-600 shadow-sm' 
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-white'
                  }`}
                >
                  <Home className="w-3 h-3" /> Stays w/ House
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Samsung Refrigerator"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Room</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={formData.room}
                      onChange={(e) => setFormData({...formData, room: e.target.value})}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                       {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Model & Serial */}
              <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                 <div>
                    <label className="block text-[10px] font-bold text-indigo-800 mb-1">Model Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400" />
                      <input
                        type="text"
                        value={formData.modelNumber}
                        onChange={(e) => setFormData({...formData, modelNumber: e.target.value})}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                        placeholder="Optional"
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-indigo-800 mb-1">Serial Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400" />
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                        placeholder="Scanned / Optional"
                      />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                      className="w-full pl-6 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.currentValue}
                      onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
                      className="w-full pl-6 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Warranty & Maintenance Section */}
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-orange-800 text-xs font-bold uppercase tracking-wider border-b border-orange-100 pb-1">
                     <ShieldCheck className="w-3 h-3" /> 
                     Protection & Care
                  </div>
                  
                  <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Warranty Expiration</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.warrantyExpiration}
                          onChange={(e) => setFormData({...formData, warrantyExpiration: e.target.value})}
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm text-gray-600 bg-white"
                        />
                      </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Maintenance Notes</label>
                    <div className="relative">
                       <Wrench className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                       <textarea
                          rows={2}
                          value={formData.maintenanceNotes}
                          onChange={(e) => setFormData({...formData, maintenanceNotes: e.target.value})}
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none bg-white text-sm"
                          placeholder="e.g. Filter size 20x20x1, Service annually"
                       />
                    </div>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Original Install Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-600"
                    />
                  </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Brand, specific features, condition..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Button */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            form="addItemForm"
            type="submit"
            disabled={isAnalyzing || !formData.name}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98]"
          >
            Save Item to My Homey
          </button>
        </div>

      </div>
    </div>
  );
};
