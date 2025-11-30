import React, { useState, useMemo, useRef } from 'react';
import { ISMElement } from '../types';
import { Tag, Plus, Trash2, Edit2, Save, X, Upload, FileJson, FileText, Trash, FileDown, ArrowRight, Check } from 'lucide-react';

interface Props {
  factors: ISMElement[];
  setFactors: React.Dispatch<React.SetStateAction<ISMElement[]>>;
  topic: string;
  onNext: () => void;
}

// Professional Color Palette - High Contrast & Distinct
// Using explicit class strings to ensure Tailwind picks them up
const PALETTE = [
  { name: 'Red', bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', borderL: 'border-l-red-600', hex: '#dc2626' },
  { name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300', borderL: 'border-l-blue-600', hex: '#2563eb' },
  { name: 'Emerald', bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', borderL: 'border-l-emerald-600', hex: '#059669' },
  { name: 'Amber', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', borderL: 'border-l-amber-600', hex: '#d97706' },
  { name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', borderL: 'border-l-purple-600', hex: '#7c3aed' },
  { name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-300', borderL: 'border-l-pink-600', hex: '#db2777' },
  { name: 'Cyan', bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-300', borderL: 'border-l-cyan-600', hex: '#0891b2' },
  { name: 'Lime', bg: 'bg-lime-100', text: 'text-lime-900', border: 'border-lime-300', borderL: 'border-l-lime-600', hex: '#65a30d' },
  { name: 'Orange', bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300', borderL: 'border-l-orange-600', hex: '#ea580c' },
  { name: 'Slate', bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-400', borderL: 'border-l-slate-600', hex: '#475569' },
];

const KNOWN_MAPPINGS: Record<string, number> = {
  'management': 0, // Red
  'cost': 8, // Orange
  'financial': 8,
  'organization': 1, // Blue
  'technology': 6, // Cyan
  'technical': 6,
  'knowledge': 4, // Purple
  'process': 3, // Amber
  'policy': 9, // Slate
  'legal': 9,
  'environment': 2, // Emerald
  'safety': 7, // Lime
};

export const getCategoryTheme = (category?: string) => {
  if (!category) return PALETTE[9]; // Default Slate
  
  const normalizedCat = category.toLowerCase().trim();
  
  // Check known mappings - EXACT MATCH ONLY
  // This ensures "Management A" and "Management B" are treated as different categories
  // rather than both matching "management" and getting the same color.
  if (KNOWN_MAPPINGS[normalizedCat] !== undefined) {
      return PALETTE[KNOWN_MAPPINGS[normalizedCat]];
  }

  // Robust Hashing for unknown categories
  let hash = 0;
  for (let i = 0; i < normalizedCat.length; i++) {
    hash = ((hash << 5) - hash) + normalizedCat.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export const getCategoryColorClasses = (category?: string) => {
  const theme = getCategoryTheme(category);
  return `${theme.bg} ${theme.text} ${theme.border}`;
};

export const getCategoryColorHex = (category?: string) => getCategoryTheme(category).hex;

const DEFAULT_CATEGORIES = ['Management', 'Cost', 'Organization', 'Technology', 'Knowledge', 'Process', 'Policy', 'Environment', 'Safety'];

const FactorInput: React.FC<Props> = ({ factors, setFactors, onNext }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ISMElement>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newFactor, setNewFactor] = useState({ name: '', description: '', category: 'Management' });
  
  // Confirmation states to avoid window.confirm issues
  const [clearConfirm, setClearConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableCategories = useMemo(() => {
    const existing = new Set(factors.map(f => f.category || '').filter(Boolean));
    DEFAULT_CATEGORIES.forEach(c => existing.add(c));
    return Array.from(existing).sort();
  }, [factors]);

  const handleAddFactor = () => {
    if (!newFactor.name.trim() || !newFactor.description.trim()) {
      alert("Name and Description are required.");
      return;
    }
    const factor: ISMElement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      name: newFactor.name.trim(),
      description: newFactor.description.trim(),
      category: newFactor.category
    };
    setFactors([...factors, factor]);
    setNewFactor({ name: '', description: '', category: 'Management' });
    setIsAdding(false);
  };

  const handleSingleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click events
    if (deleteConfirmId === id) {
      // Confirmed
      setFactors(prevFactors => prevFactors.filter(f => f.id !== id));
      setDeleteConfirmId(null);
    } else {
      // First click
      setDeleteConfirmId(id);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirmId(current => current === id ? null : current), 3000);
    }
  };

  const handleClearClick = () => {
    if (clearConfirm) {
      setFactors([]);
      setClearConfirm(false);
    } else {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000);
    }
  };

  const startEdit = (factor: ISMElement) => {
    setEditingId(factor.id);
    setEditValues({ ...factor });
    setDeleteConfirmId(null); // Cancel any pending deletes
  };

  const saveEdit = () => {
    setFactors(factors.map(f => f.id === editingId ? { ...f, ...editValues } as ISMElement : f));
    setEditingId(null);
    setEditValues({});
  };

  const parseCSV = (text: string): ISMElement[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const parsedFactors: ISMElement[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        
        // Generate a new ID by default
        const factor: any = { id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) };
        
        headers.forEach((h, idx) => {
            if (values[idx] !== undefined) {
                // Only use the CSV ID if it is non-empty
                if (h === 'id' && values[idx].trim()) factor.id = values[idx].trim();
                else if (h === 'name' || h === 'factor') factor.name = values[idx];
                else if (h === 'description' || h === 'desc') factor.description = values[idx];
                else if (h === 'category' || h === 'cat') factor.category = values[idx];
            }
        });
        if (factor.name) parsedFactors.push(factor as ISMElement);
    }
    return parsedFactors;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
            let parsed: ISMElement[] = [];
            if (file.name.toLowerCase().endsWith('.csv')) {
                parsed = parseCSV(text);
            } else {
                parsed = JSON.parse(text);
            }

            if (Array.isArray(parsed) && parsed.length > 0) {
                // Ensure all imported items have unique IDs
                const processed = parsed.map(f => ({
                    ...f,
                    id: f.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2))
                }));
                setFactors(processed);
            } else {
                alert("No valid factors found.");
            }
        } catch (err) { console.error(err); alert("Failed to parse file."); }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(factors, null, 2)], { type: "application/json" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Factors_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleExportCSV = () => {
    const headers = ["id", "name", "description", "category"];
    const rows = factors.map(f => [
        `"${f.id}"`, `"${f.name.replace(/"/g, '""')}"`, `"${(f.description || '').replace(/"/g, '""')}"`, `"${(f.category || '').replace(/"/g, '""')}"`
    ].join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Factors_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleDownloadTemplate = () => {
    const csvContent = `id,name,description,category\nF1,Sample Factor,Description here,Management`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv" }));
    link.download = "ISM_Factors_Template.csv";
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Project Factors</h2>
          <p className="text-slate-500 text-sm mt-1">Manage the variables for your structural model.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <input type="file" ref={fileInputRef} className="hidden" accept=".json,.csv" onChange={handleImport} />
           
           <div className="flex bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden divide-x divide-slate-200">
              <button type="button" onClick={handleDownloadTemplate} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                 <FileDown className="w-4 h-4" /> Template
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                 <Upload className="w-4 h-4" /> Import
              </button>
           </div>
           
           <div className="flex bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden divide-x divide-slate-200">
             <button type="button" onClick={handleExportJSON} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                <FileJson className="w-4 h-4" /> JSON
             </button>
             <button type="button" onClick={handleExportCSV} className="px-3 py-2 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> CSV
             </button>
           </div>

           <button 
             type="button" 
             onClick={handleClearClick} 
             className={`px-3 py-2 border rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${clearConfirm ? 'bg-red-600 text-white border-red-700 hover:bg-red-700' : 'bg-white border-red-200 text-red-600 hover:bg-red-50'}`}
           >
             {clearConfirm ? <Check className="w-4 h-4" /> : <Trash className="w-4 h-4" />}
             {clearConfirm ? "Confirm Clear?" : "Clear"}
           </button>

           <div className="w-px h-6 bg-slate-300 mx-2 hidden md:block"></div>

           <button 
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-colors border ${isAdding ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700'}`}
           >
             {isAdding ? <><X className="w-4 h-4"/> Cancel</> : <><Plus className="w-4 h-4"/> Add Factor</>}
           </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 animate-in slide-in-from-top-2 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">New Factor Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Code</label>
                    <input 
                        type="text" 
                        placeholder="e.g. F12"
                        value={newFactor.name}
                        onChange={e => setNewFactor({...newFactor, name: e.target.value})}
                        className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none"
                    />
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                    <input 
                        type="text" 
                        placeholder="Factor description..."
                        value={newFactor.description}
                        onChange={e => setNewFactor({...newFactor, description: e.target.value})}
                        className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                    <input 
                        list="category-options-new"
                        type="text"
                        placeholder="Select or type..."
                        value={newFactor.category}
                        onChange={e => setNewFactor({...newFactor, category: e.target.value})}
                        className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none"
                    />
                    <datalist id="category-options-new">
                        {availableCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                </div>
                <div className="md:col-span-2 flex items-end">
                    <button 
                        type="button"
                        onClick={handleAddFactor}
                        className="w-full py-2.5 bg-slate-800 text-white font-bold text-sm rounded-md hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Save Factor
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Factor List</span>
            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{factors.length} Items</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
          {factors.length === 0 && (
             <div className="text-center py-12 text-slate-400">
                 <p className="font-medium">No factors defined.</p>
                 <p className="text-sm mt-1">Add items manually or use Import.</p>
             </div>
          )}
          {factors.map((factor) => {
             const isEditing = editingId === factor.id;
             const isDeleteConfirming = deleteConfirmId === factor.id;
             const catColor = getCategoryColorClasses(factor.category);
             
             if (isEditing) {
                 return (
                    <div key={factor.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50">
                        <div className="md:col-span-2">
                            <input 
                                value={editValues.name || ''}
                                onChange={e => setEditValues({...editValues, name: e.target.value})}
                                className="w-full p-2 text-sm rounded border border-slate-300 outline-none"
                            />
                        </div>
                        <div className="md:col-span-6">
                            <input 
                                value={editValues.description || ''}
                                onChange={e => setEditValues({...editValues, description: e.target.value})}
                                className="w-full p-2 text-sm rounded border border-slate-300 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <input 
                                list={`category-options-${factor.id}`}
                                value={editValues.category || ''}
                                onChange={e => setEditValues({...editValues, category: e.target.value})}
                                className="w-full p-2 text-sm rounded border border-slate-300 outline-none"
                            />
                            <datalist id={`category-options-${factor.id}`}>
                                {availableCategories.map(cat => <option key={cat} value={cat} />)}
                            </datalist>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2 justify-end">
                            <button type="button" onClick={saveEdit} className="p-2 bg-slate-800 text-white rounded hover:bg-slate-700" title="Save">
                                <Save className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="p-2 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50" title="Cancel">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                 );
             }

             return (
              <div key={factor.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group relative">
                <div className="flex items-center gap-4 overflow-hidden flex-1">
                  <span className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded text-xs font-bold border ${catColor}`}>
                    {factor.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-slate-900 font-medium truncate">{factor.description || factor.name}</p>
                      {factor.category && (
                        <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${catColor}`}>
                          {factor.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-4 z-10">
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); startEdit(factor); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        type="button"
                        onClick={(e) => handleSingleDeleteClick(factor.id, e)}
                        className={`p-2 rounded transition-colors ${isDeleteConfirming ? 'bg-red-600 text-white shadow-sm hover:bg-red-700' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                        title={isDeleteConfirming ? "Confirm Delete" : "Delete"}
                    >
                        {isDeleteConfirming ? <Trash2 className="w-4 h-4 animate-pulse" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="button"
          onClick={onNext}
          disabled={factors.length < 2}
          className={`px-6 py-3 font-bold text-sm rounded-md shadow-sm transition-all flex items-center gap-2 ${factors.length < 2 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
        >
          Proceed to SSIM <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FactorInput;