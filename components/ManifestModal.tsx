import React from 'react';
import { X, CheckCircle, FileText, Zap, Music, ArrowRight, Layers } from 'lucide-react';
import { ManifestItem } from '../types';

interface ManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  manifest: ManifestItem[];
}

export const ManifestModal: React.FC<ManifestModalProps> = ({ isOpen, onClose, onAcknowledge, manifest }) => {
  if (!isOpen) return null;

  const devices = manifest.filter(m => m.category === 'device');
  const cables = manifest.filter(m => m.category === 'cable');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30 text-indigo-400">
                    <Layers className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-100 text-base">Booth Equipment & Cable Manifest</h2>
                    <p className="text-xs text-slate-400">Inventory breakdown for your Technical Rider</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition p-1">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
            
            {/* Devices Section */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-indigo-400" /> Audio Hardware ({devices.reduce((acc, d) => acc + d.quantity, 0)} Units)
                </h3>
                <div className="space-y-2">
                    {devices.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                            <div>
                                <span className="text-slate-200 font-semibold text-sm">{item.name}</span>
                                {item.substitution && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Acceptable substitute: {item.substitution}
                                    </p>
                                )}
                            </div>
                            <span className="bg-slate-700 text-white text-xs font-mono font-bold py-1 px-2.5 rounded-lg">
                                x{item.quantity}
                            </span>
                        </div>
                    ))}
                    {devices.length === 0 && <p className="text-xs text-slate-500 italic">No equipment on the booth table yet.</p>}
                </div>
            </div>

            {/* Cables Section */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Stage Cabling Required
                </h3>
                <div className="space-y-2">
                    {cables.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                            <div>
                                <span className="text-slate-300 text-xs font-medium">{item.name}</span>
                                {item.details && (
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.details}</p>
                                )}
                            </div>
                            <span className="text-indigo-400 text-xs font-mono font-bold bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                x{item.quantity}
                            </span>
                        </div>
                    ))}
                     {cables.length === 0 && <p className="text-xs text-slate-500 italic">No cables generated yet.</p>}
                </div>
            </div>

        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
            <button 
                onClick={onClose}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition text-xs"
            >
                Close
            </button>
            <button 
                onClick={onAcknowledge}
                className="flex-[2] bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950"
            >
                <FileText className="w-4 h-4" />
                <span>GENERATE OFFICIAL RIDER PDF</span>
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>

      </div>
    </div>
  );
};