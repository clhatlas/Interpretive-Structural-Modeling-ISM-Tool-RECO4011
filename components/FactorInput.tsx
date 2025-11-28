import React, { useState } from 'react';
import { ISMElement } from '../types';
import { Plus, Trash2, Wand2, Loader2, Tag } from 'lucide-react';
import { generateFactors } from '../services/geminiService';

interface Props {
  factors: ISMElement[];
  setFactors: React.Dispatch<React.SetStateAction<ISMElement[]>>;
  topic: string;
  onNext: () => void;
}

const FactorInput: React.FC<Props> = ({ factors, setFactors, topic, onNext }) => {
  const [loading, setLoading] = useState(false);
  const [newFactorName, setNewFactorName] = useState('');

  const handleAdd = () => {
    if (!newFactorName.trim()) return;
    const newFactor: ISMElement = {
      id: `manual-${Date.now()}`,
      name: newFactorName,
      description: 'Manually added factor'
    };
    setFactors([...factors, newFactor]);
    setNewFactorName('');
  };

  const handleRemove = (id: string) => {
    setFactors(factors.filter(f => f.id !== id));
  };

  const handleAiGenerate = async () => {
    setLoading(true);
    try {
      const generated = await generateFactors(topic);
      // Merge with existing avoiding dupes by name strictly for UX, though IDs are unique
      setFactors(prev => [...prev, ...generated]);
    } catch (error) {
      console.error(error);
      alert("Failed to generate factors. Please check your API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Define Factors</h2>
          <p className="text-slate-500">List the elements, barriers, or variables for your model.</p>
        </div>
        <button
          onClick={handleAiGenerate}
          disabled={loading || !process.env.API_KEY}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          AI Generate Factors
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xl">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newFactorName}
            onChange={(e) => setNewFactorName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Enter a factor name..."
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {factors.length === 0 && (
            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
              No factors added yet. Add manually, use AI, or load a template.
            </div>
          )}
          {factors.map((factor, idx) => (
            <div key={factor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group hover:border-indigo-400 transition-all shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-sm font-mono border border-slate-300">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-900 font-medium truncate">{factor.name}</p>
                    {factor.category && (
                      <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                        {factor.category}
                      </span>
                    )}
                  </div>
                  {factor.description && factor.description !== factor.category && (
                     <p className="text-xs text-slate-500 truncate">{factor.description}</p>
                  )}
                  {factor.category && (
                     <span className="md:hidden inline-flex items-center gap-1 text-[10px] text-indigo-500 mt-1">
                        <Tag className="w-3 h-3" /> {factor.category}
                     </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemove(factor.id)}
                className="flex-shrink-0 text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-xs text-slate-400">
            Total Factors: {factors.length}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={factors.length < 2}
          className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02]"
        >
          Next: Build SSIM Matrix
        </button>
      </div>
    </div>
  );
};

export default FactorInput;