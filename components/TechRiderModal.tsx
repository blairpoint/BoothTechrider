import React, { useState, useMemo, useRef } from 'react';
import { 
  X, Download, Printer, Copy, Check, Edit3, Eye, FileText, 
  ShieldAlert, Zap, Volume2, Sparkles, Sliders, Music, Phone, 
  Mail, Calendar, MapPin, AlertCircle, ChevronRight, Layers,
  CheckCircle2, RefreshCw, Upload
} from 'lucide-react';
import { BoothItem, Cable, ManifestItem, RiderMetadata, ContactInfo } from '../types';
import { DEVICES } from '../data/equipment';
import { DeviceRenderer } from './DeviceRenderer';
import { THEME_COLORS } from '../constants';

interface TechRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BoothItem[];
  cables: Cable[];
  manifest: ManifestItem[];
  riderMeta: RiderMetadata;
  onUpdateRiderMeta: (meta: RiderMetadata) => void;
}

export const TechRiderModal: React.FC<TechRiderModalProps> = ({
  isOpen,
  onClose,
  items,
  cables,
  manifest,
  riderMeta,
  onUpdateRiderMeta,
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'editor' | 'schematic'>('document');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Diagram bounds computation
  const { minX, minY, width: contentWidth, height: contentHeight } = useMemo(() => {
    if (items.length === 0) return { minX: 0, minY: 0, width: 800, height: 500 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    items.forEach(item => {
        const def = DEVICES.find(d => d.id === item.deviceId);
        if (!def) return;
        minX = Math.min(minX, item.x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, item.x + def.width);
        maxY = Math.max(maxY, item.y + (item.view === 'back' && def.rearHeight ? def.rearHeight : def.height));
    });

    const PADDING = 80;
    return { 
        minX: minX - PADDING, 
        minY: minY - PADDING, 
        width: Math.max(800, (maxX - minX) + (PADDING * 2)), 
        height: Math.max(400, (maxY - minY) + (PADDING * 2)) 
    };
  }, [items]);

  const fitScale = Math.min(1, 800 / contentWidth);

  // Helper for diagram port coordinates
  const getPortPositionInDiagram = (instanceId: string, portId: string, forceRear: boolean = true) => {
    const item = items.find(i => i.instanceId === instanceId);
    if (!item) return { x: 0, y: 0 };
    const def = DEVICES.find(d => d.id === item.deviceId);
    if (!def) return { x: 0, y: 0 };

    let control = def.backControls.find(c => c.id === portId);
    let x = item.x;
    let y = item.y;

    if (control) {
        x += control.x;
        y += forceRear ? control.y : 0;
    } else {
        control = def.frontControls.find(c => c.id === portId);
        if (control) {
            x += control.x;
            y += control.y;
        }
    }
    return { x: x - minX, y: y - minY };
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('tech-rider-printable');
    if (!element) return;

    setIsGeneratingPdf(true);
    const filename = `${(riderMeta.artistName || 'Artist').replace(/[^a-zA-Z0-9_-]/g, '_')}_Technical_Rider.pdf`;

    const opt = {
      margin: [0.25, 0.25, 0.25, 0.25],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        scrollY: 0
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const w = window as any;
    if (w.html2pdf) {
      w.html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPdf(false);
      }).catch((err: any) => {
        console.error('PDF generation error:', err);
        setIsGeneratingPdf(false);
        // Fallback to print
        window.print();
      });
    } else {
      setIsGeneratingPdf(false);
      window.print();
    }
  };

  const handleCopyText = () => {
    const hardwareList = manifest
      .filter(m => m.category === 'device')
      .map(d => `• ${d.quantity}x ${d.name} ${d.substitution ? `(Acceptable Alternative: ${d.substitution})` : ''}`)
      .join('\n');

    const cableList = manifest
      .filter(m => m.category === 'cable')
      .map(c => `• ${c.quantity}x ${c.name}`)
      .join('\n');

    const text = `
==================================================
TECHNICAL RIDER & STAGE REQUIREMENTS
ARTIST: ${riderMeta.artistName.toUpperCase()}
ACT TYPE: ${riderMeta.actType}
EVENT / TOUR: ${riderMeta.tourOrEvent}
DATE: ${riderMeta.date} | REVISION: ${riderMeta.revision}
==================================================

1. PRODUCTION CONTACTS:
Production Manager: ${riderMeta.productionContact.name} (${riderMeta.productionContact.phone} / ${riderMeta.productionContact.email})
Technical Lead: ${riderMeta.techContact.name} (${riderMeta.techContact.phone} / ${riderMeta.techContact.email})

2. EQUIPMENT SPECIFICATION (NO UNAUTHORIZED SUBSTITUTIONS):
${hardwareList}

3. CABLING & PATCH REQUIREMENTS:
${cableList}

4. DJ BOOTH & TABLE SPECIFICATIONS:
${riderMeta.tableSpec}

5. MONITORING SYSTEM:
${riderMeta.monitoringSpec}

6. ELECTRICAL POWER & GROUNDING:
${riderMeta.powerSpec}

7. HOSPITALITY & STAGE SETUP:
${riderMeta.hospitalitySpec}

8. GENERAL TERMS:
${riderMeta.generalClauses.map((c, i) => `${i + 1}. ${c}`).join('\n')}
${riderMeta.customClauses ? `\nADDITIONAL NOTES:\n${riderMeta.customClauses}` : ''}
==================================================
`;

    navigator.clipboard.writeText(text.trim());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleExportJson = () => {
    const data = {
      riderMeta,
      items,
      manifest,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(riderMeta.artistName || 'rider').toLowerCase().replace(/\s+/g, '_')}_rider_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.riderMeta) {
          onUpdateRiderMeta(parsed.riderMeta);
        }
      } catch (err) {
        console.error('Failed to parse rider profile JSON', err);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md print:p-0 print:bg-white print:static overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative print:h-auto print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none print:static">
        
        {/* Top App Header / Action Bar (Hidden in Print) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-lg tracking-tight">
                  {riderMeta.artistName || 'Artist'} — Technical Rider
                </h2>
                <span className="bg-indigo-950/80 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {riderMeta.revision || 'v1.0'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Artist Technical Rider, Stage Plot & Equipment Specifications
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('document')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'document' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Full Tech Rider
            </button>
            <button
              onClick={() => setActiveTab('schematic')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'schematic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Stage Plot & Wiring
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Rider Details
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
              title="Copy text for contract or email"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedText ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
              title="Print directly or use browser PDF"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-indigo-900/30 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              {isGeneratingPdf ? 'Rendering PDF...' : 'Download PDF'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-6 print:p-0 print:bg-white print:overflow-visible">
          
          {/* TAB 1: FULL RIDER DOCUMENT (Printable Area) */}
          {activeTab === 'document' && (
            <div 
              id="tech-rider-printable" 
              className="max-w-4xl mx-auto bg-white text-slate-900 p-10 rounded-xl shadow-2xl print:p-0 print:shadow-none print:max-w-none print:rounded-none font-sans"
              style={{ minHeight: '1000px' }}
            >
              
              {/* Document Header */}
              <div className="border-b-4 border-slate-950 pb-6 mb-8 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded">
                      OFFICIAL TECHNICAL RIDER
                    </span>
                    <span className="text-slate-500 text-xs font-mono font-bold">
                      {riderMeta.revision || 'REV 2026.1'}
                    </span>
                  </div>
                  <h1 className="text-4xl font-black uppercase tracking-tight text-slate-950 mt-1">
                    {riderMeta.artistName || 'ARTIST / DJ PERFORMANCE'}
                  </h1>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
                    {riderMeta.actType} • {riderMeta.tourOrEvent}
                  </p>
                </div>

                <div className="text-right text-xs font-mono text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900">DATE: {riderMeta.date || new Date().toLocaleDateString()}</div>
                  <div>VENUE/CITY: {riderMeta.venueOrCity || 'TBD / On Tour'}</div>
                  <div className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                    MANDATORY TECHNICAL COMPLIANCE
                  </div>
                </div>
              </div>

              {/* Important Legal & Compliance Banner */}
              <div className="bg-slate-100 border-l-4 border-indigo-600 p-4 rounded-r-lg mb-8 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">PROMOTER & VENUE NOTICE:</span>
                This document forms an integral part of the performance contract. All listed audio equipment, dimensions, monitoring specifications, and power connections are strictly required. <strong>No substitutions of any kind may be made without prior written confirmation</strong> from artist management at least fourteen (14) days prior to load-in.
              </div>

              {/* Section 1: Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 break-inside-avoid">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Production / Tour Manager
                  </div>
                  <div className="font-bold text-sm text-slate-900">{riderMeta.productionContact.name}</div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">{riderMeta.productionContact.role}</div>
                  <div className="text-xs text-slate-700 mt-2 space-y-0.5">
                    <div>Email: <span className="font-mono text-slate-900">{riderMeta.productionContact.email}</span></div>
                    <div>Phone: <span className="font-mono text-slate-900">{riderMeta.productionContact.phone}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" /> Technical / Sound Lead
                  </div>
                  <div className="font-bold text-sm text-slate-900">{riderMeta.techContact.name}</div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">{riderMeta.techContact.role}</div>
                  <div className="text-xs text-slate-700 mt-2 space-y-0.5">
                    <div>Email: <span className="font-mono text-slate-900">{riderMeta.techContact.email}</span></div>
                    <div>Phone: <span className="font-mono text-slate-900">{riderMeta.techContact.phone}</span></div>
                  </div>
                </div>
              </div>

              {/* Section 2: Equipment Manifest Table */}
              <div className="mb-8 break-inside-avoid">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <span>1. Required Audio Hardware & Specification</span>
                  <span className="text-xs font-mono text-slate-500">{items.length} units specified</span>
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] border-b border-slate-200">
                        <th className="py-2.5 px-3 font-bold w-12 text-center">QTY</th>
                        <th className="py-2.5 px-3 font-bold">Equipment Model</th>
                        <th className="py-2.5 px-3 font-bold">Manufacturer & Specs</th>
                        <th className="py-2.5 px-3 font-bold">Acceptable Alternative</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {manifest.filter(m => m.category === 'device').map((device, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-mono font-bold text-center bg-slate-50/50 text-indigo-700">
                            {device.quantity}x
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {device.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {device.details || 'Standard specification'}
                          </td>
                          <td className="py-2.5 px-3 text-xs font-medium text-slate-700">
                            {riderMeta.substitutions[device.name] || device.substitution || 'NO SUBSTITUTIONS'}
                          </td>
                        </tr>
                      ))}
                      {manifest.filter(m => m.category === 'device').length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                            No equipment currently placed on the booth canvas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-2">
                  * Note: All multi-players must be networked via gigabit Ethernet switch (Pro DJ Link). All media players must be updated to current firmware.
                </p>
              </div>

              {/* Section 3: Visual Stage Plot / Booth Diagram */}
              <div className="mb-10 break-inside-avoid">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <span>2. Booth Stage Plot & Equipment Layout (Top View)</span>
                  <span className="text-xs font-mono text-slate-500">Scale 1:{Math.round(1/fitScale)}</span>
                </h3>

                <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                  <div 
                    style={{ 
                      width: contentWidth * fitScale, 
                      height: contentHeight * fitScale, 
                      position: 'relative' 
                    }}
                  >
                    <div 
                      style={{ 
                        transform: `scale(${fitScale})`, 
                        transformOrigin: 'top left',
                        width: contentWidth,
                        height: contentHeight,
                        position: 'absolute',
                        top: 0, 
                        left: 0
                      }}
                    >
                      {items.map(item => {
                        const def = DEVICES.find(d => d.id === item.deviceId);
                        if (!def) return null;
                        return (
                          <div
                            key={item.instanceId}
                            style={{
                              position: 'absolute',
                              left: item.x - minX,
                              top: item.y - minY
                            }}
                          >
                            <DeviceRenderer device={def} view="front" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between w-full text-[11px] font-mono text-slate-500 border-t border-slate-200 pt-3">
                    <span>AUDIENCE / DANCEFLOOR ORIENTATION: FRONT OF BOOTH</span>
                    <span>DJ PERFORMANCE POSITION: REAR OF TABLE</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Cabling & Patch List */}
              <div className="mb-8 break-inside-avoid">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <span>3. Signal Flow & Patch List</span>
                  <span className="text-xs font-mono text-slate-500">{cables.length} patch lines</span>
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] border-b border-slate-200">
                        <th className="py-2 px-3 font-bold">Cable Type</th>
                        <th className="py-2 px-3 font-bold">From (Source)</th>
                        <th className="py-2 px-3 font-bold">To (Destination)</th>
                        <th className="py-2 px-3 font-bold">Specification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {cables.map((cable, idx) => {
                        const fromItem = items.find(i => i.instanceId === cable.fromInstanceId);
                        const fromDef = DEVICES.find(d => d.id === fromItem?.deviceId);
                        const toItem = cable.toInstanceId ? items.find(i => i.instanceId === cable.toInstanceId) : null;
                        const toDef = toItem ? DEVICES.find(d => d.id === toItem.deviceId) : null;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                cable.type === 'audio' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                cable.type === 'power' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                cable.type === 'data' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {cable.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-900 font-medium">
                              {fromDef?.model || 'Device'} ({cable.fromPortId})
                            </td>
                            <td className="py-2 px-3 text-slate-800">
                              {toDef ? `${toDef.model} (${cable.toPortId})` : 'FOH Snake / Stage Box / Mains'}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                              {cable.label || 'Standard patch line'}
                            </td>
                          </tr>
                        );
                      })}
                      {cables.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                            Click 'Auto-Align & Cable' in the main booth workspace to calculate connections.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Stage, Power, Monitoring & Hospitality Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 break-inside-avoid">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> 4. Stage & DJ Table Specifications
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {riderMeta.tableSpec}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> 5. Booth Monitoring Requirements
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {riderMeta.monitoringSpec}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" /> 6. Electrical Power & Clean Circuit
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {riderMeta.powerSpec}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-600" /> 7. Hospitality & Stage Environment
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {riderMeta.hospitalitySpec}
                  </p>
                </div>
              </div>

              {/* Section 6: Standard General Clauses */}
              <div className="border-t border-slate-200 pt-6 mb-8 break-inside-avoid">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">
                  8. General Technical Terms & Compliance Conditions
                </h4>
                <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 leading-relaxed">
                  {riderMeta.generalClauses.map((clause, idx) => (
                    <li key={idx}>
                      <span className="text-slate-800">{clause}</span>
                    </li>
                  ))}
                  {riderMeta.customClauses && (
                    <li className="font-semibold text-slate-900 mt-2">
                      Special Rider Clause: {riderMeta.customClauses}
                    </li>
                  )}
                </ol>
              </div>

              {/* Sign-Off / Acceptance Block */}
              <div className="border-t-2 border-slate-900 pt-6 break-inside-avoid">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-4">
                  9. Technical Rider Acceptance & Sign-off
                </div>
                <div className="grid grid-cols-2 gap-8 text-xs text-slate-800">
                  <div className="border-b border-slate-400 pb-8">
                    <p className="font-bold mb-1">On Behalf of Artist / Production:</p>
                    <p className="text-[11px] text-slate-500 font-mono">Sign & Date</p>
                  </div>
                  <div className="border-b border-slate-400 pb-8">
                    <p className="font-bold mb-1">On Behalf of Promoter / Technical Director:</p>
                    <p className="text-[11px] text-slate-500 font-mono">Sign & Date</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-4">
                  <span>GENERATED WITH BOOTHTECT TECH RIDER SYSTEM</span>
                  <span>{new Date().toISOString()} • ALL RIGHTS RESERVED</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: RIDER EDITOR (Tweak Artist Name, Contacts, Specs) */}
          {activeTab === 'editor' && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-8 text-slate-200">
              <div>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" /> Technical Rider Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  Customize artist identity, contact points, table requirements, and legal clauses.
                </p>
              </div>

              {/* Basic Artist & Show Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Artist / Act Name</label>
                  <input
                    type="text"
                    value={riderMeta.artistName}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, artistName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. DJ NOVA / ALEX RIVERA"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Act Performance Type</label>
                  <select
                    value={riderMeta.actType}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, actType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DJ Performance (Digital / CDJ)">DJ Performance (Digital / CDJ)</option>
                    <option value="Vinyl DJ Set (Analog Turntables)">Vinyl DJ Set (Analog Turntables)</option>
                    <option value="Hybrid DJ / Live Hardware Act">Hybrid DJ / Live Hardware Act</option>
                    <option value="Live Electronic Musician">Live Electronic Musician</option>
                    <option value="B2B Performance Setup">B2B Performance Setup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Tour / Event Name</label>
                  <input
                    type="text"
                    value={riderMeta.tourOrEvent}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, tourOrEvent: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Global Tour 2026 / Club & Festival Shows"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Rider Revision & Date</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={riderMeta.revision}
                      onChange={e => onUpdateRiderMeta({ ...riderMeta, revision: e.target.value })}
                      className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="v2.1"
                    />
                    <input
                      type="text"
                      value={riderMeta.date}
                      onChange={e => onUpdateRiderMeta({ ...riderMeta, date: e.target.value })}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. 2026-10-20"
                    />
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="border-t border-slate-800 pt-6">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
                  Production Contacts
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tour Manager */}
                  <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-indigo-400 block">Production / Tour Manager</span>
                    <input
                      type="text"
                      value={riderMeta.productionContact.name}
                      onChange={e => onUpdateRiderMeta({
                        ...riderMeta,
                        productionContact: { ...riderMeta.productionContact, name: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="Manager Name"
                    />
                    <input
                      type="email"
                      value={riderMeta.productionContact.email}
                      onChange={e => onUpdateRiderMeta({
                        ...riderMeta,
                        productionContact: { ...riderMeta.productionContact, email: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      value={riderMeta.productionContact.phone}
                      onChange={e => onUpdateRiderMeta({
                        ...riderMeta,
                        productionContact: { ...riderMeta.productionContact, phone: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="Phone"
                    />
                  </div>

                  {/* Sound Lead */}
                  <div className="space-y-3 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-sky-400 block">FOH / Technical Sound Contact</span>
                    <input
                      type="text"
                      value={riderMeta.techContact.name}
                      onChange={e => onUpdateRiderMeta({
                        ...riderMeta,
                        techContact: { ...riderMeta.techContact, name: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="Sound Engineer Name"
                    />
                    <input
                      type="email"
                      value={riderMeta.techContact.email}
                      onChange={e => onUpdateRiderMeta({
                        ...riderMeta,
                        techContact: { ...riderMeta.techContact, email: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      value={riderMeta.techContact.phone}
                      onChange={e => onUpdateRiderMeta({
                        ...riderMeta,
                        techContact: { ...riderMeta.techContact, phone: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      placeholder="Phone"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Specifications Text */}
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Technical Specifications & Rider Clauses
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Booth & Table Height Requirements</label>
                  <textarea
                    rows={2}
                    value={riderMeta.tableSpec}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, tableSpec: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Booth Monitoring Specifications</label>
                  <textarea
                    rows={2}
                    value={riderMeta.monitoringSpec}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, monitoringSpec: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Power & Electrical Isolation</label>
                  <textarea
                    rows={2}
                    value={riderMeta.powerSpec}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, powerSpec: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Hospitality, Fans & Stage Comfort</label>
                  <textarea
                    rows={2}
                    value={riderMeta.hospitalitySpec}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, hospitalitySpec: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Additional Custom Rider Clauses</label>
                  <textarea
                    rows={2}
                    value={riderMeta.customClauses}
                    onChange={e => onUpdateRiderMeta({ ...riderMeta, customClauses: e.target.value })}
                    placeholder="e.g. Stage fan required. No stage access for audience during soundcheck."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              {/* Import / Export JSON buttons */}
              <div className="border-t border-slate-800 pt-6 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                  Save your rider configuration to disk or reload an existing profile.
                </div>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportJson} 
                    accept=".json" 
                    className="hidden" 
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> Import Profile
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Profile (.json)
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: STAGE PLOT & SCHEMATIC ONLY (Audio Crew View) */}
          {activeTab === 'schematic' && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 text-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" /> Stage Crew Schematic & Patch Diagram
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-contrast rear panel interconnects and cable routing for sound engineers.
                  </p>
                </div>
              </div>

              {/* Rear-view Schematic Canvas */}
              <div className="border border-slate-800 rounded-xl p-6 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                <div 
                  style={{ 
                    width: contentWidth * fitScale, 
                    height: contentHeight * fitScale, 
                    position: 'relative' 
                  }}
                >
                  <div 
                    style={{ 
                      transform: `scale(${fitScale})`, 
                      transformOrigin: 'top left',
                      width: contentWidth,
                      height: contentHeight,
                      position: 'absolute',
                      top: 0, 
                      left: 0
                    }}
                  >
                    {/* SVG Cables Layer */}
                    <svg width={contentWidth} height={contentHeight} className="absolute inset-0 pointer-events-none overflow-visible z-20">
                      {cables.map((cable, idx) => {
                        const start = getPortPositionInDiagram(cable.fromInstanceId, cable.fromPortId, true);
                        let end = { x: start.x, y: start.y + 120 };
                        if (cable.toInstanceId && cable.toPortId) {
                          end = getPortPositionInDiagram(cable.toInstanceId, cable.toPortId, true);
                        }

                        let strokeColor = '#3b82f6';
                        if (cable.type === 'power') strokeColor = '#f59e0b';
                        if (cable.type === 'audio') strokeColor = '#ef4444';
                        if (cable.type === 'ground') strokeColor = '#10b981';

                        const d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

                        return (
                          <g key={cable.id}>
                            <path d={d} stroke="#0f172a" strokeWidth="6" fill="none" />
                            <path d={d} stroke={strokeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                            <circle cx={start.x} cy={start.y} r="4" fill={strokeColor} stroke="#fff" strokeWidth="1" />
                            <circle cx={end.x} cy={end.y} r="4" fill={strokeColor} stroke="#fff" strokeWidth="1" />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Devices in Rear View */}
                    {items.map(item => {
                      const def = DEVICES.find(d => d.id === item.deviceId);
                      if (!def) return null;
                      return (
                        <div
                          key={item.instanceId}
                          style={{
                            position: 'absolute',
                            left: item.x - minX,
                            top: item.y - minY,
                            zIndex: 10
                          }}
                        >
                          <DeviceRenderer device={def} view="back" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cable Legend & Key */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Audio Lines</div>
                    <div className="text-[10px] text-slate-400">Balanced XLR & RCA</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Power AC Mains</div>
                    <div className="text-[10px] text-slate-400">Grounded IEC C13</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-sky-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Pro DJ Link / Data</div>
                    <div className="text-[10px] text-slate-400">Cat6 Gigabit LAN / USB</div>
                  </div>
                </div>

                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Turntable Ground</div>
                    <div className="text-[10px] text-slate-400">Spade to Chassis GND</div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
