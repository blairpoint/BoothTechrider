import React, { useState } from 'react';
import { DEVICES } from '../data/equipment';
import { DeviceDefinition, DeviceType } from '../types';
import { 
  Plus, Disc, Sliders, Box, Search, Headphones, Sparkles, 
  Volume2, Radio, Zap, LayoutTemplate, Layers, Check
} from 'lucide-react';

interface SidebarProps {
  onAddDevice: (device: DeviceDefinition) => void;
  onApplyPreset: (presetKey: string) => void;
}

export const PRESET_RIDERS = [
  {
    key: 'festival_4cdj_a9',
    title: 'Festival Standard (4 Decks)',
    desc: '4x CDJ-3000, DJM-A9, 2x Booth Monitors, Shure SM58, PDU',
    badge: 'FESTIVAL',
    color: 'border-indigo-500/40 hover:border-indigo-500 text-indigo-400'
  },
  {
    key: 'club_2cdj_900',
    title: 'Club Standard (2 Decks)',
    desc: '2x CDJ-3000, DJM-900NXS2, 2x Booth Monitors, Power Distro',
    badge: 'CLUB',
    color: 'border-sky-500/40 hover:border-sky-500 text-sky-400'
  },
  {
    key: 'vinyl_analog_xone',
    title: 'Analog Vinyl Purist',
    desc: '2x Technics SL-1210MK7, Xone:96, 2x Isolation Slabs, Monitors',
    badge: 'VINYL',
    color: 'border-emerald-500/40 hover:border-emerald-500 text-emerald-400'
  },
  {
    key: 'hybrid_live_sampler',
    title: 'Hybrid DJ / Live Act',
    desc: '2x CDJ-3000, DJM-900, DJS-1000 Sampler, Laptop Stand, Monitors',
    badge: 'HYBRID',
    color: 'border-pink-500/40 hover:border-pink-500 text-pink-400'
  },
  {
    key: 'all_in_one_xz',
    title: 'All-In-One Touring',
    desc: 'Pioneer XDJ-XZ, 2x Booth Monitors, Shure SM58 Mic',
    badge: 'STANDALONE',
    color: 'border-amber-500/40 hover:border-amber-500 text-amber-400'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ onAddDevice, onApplyPreset }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Gear' },
    { id: DeviceType.PLAYER, label: 'CDJs & Decks' },
    { id: DeviceType.MIXER, label: 'Mixers' },
    { id: DeviceType.ALL_IN_ONE, label: 'All-In-One' },
    { id: DeviceType.FX, label: 'Live & Samplers' },
    { id: DeviceType.SPEAKER, label: 'Monitors & PA' },
    { id: DeviceType.ACCESSORY, label: 'Booth Rigging' },
  ];

  const filteredDevices = DEVICES.filter(d => {
    const matchesSearch = d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || d.type === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getIcon = (type: DeviceType) => {
    switch(type) {
      case DeviceType.PLAYER: return <Disc className="w-4 h-4 text-sky-400" />;
      case DeviceType.MIXER: return <Sliders className="w-4 h-4 text-pink-400" />;
      case DeviceType.ALL_IN_ONE: return <Layers className="w-4 h-4 text-purple-400" />;
      case DeviceType.FX: return <Radio className="w-4 h-4 text-amber-400" />;
      case DeviceType.SPEAKER: return <Volume2 className="w-4 h-4 text-emerald-400" />;
      case DeviceType.ACCESSORY: return <Zap className="w-4 h-4 text-yellow-400" />;
      default: return <Box className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-10 shrink-0">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h1 className="text-xl font-black font-mono text-white tracking-tight">
            TECH<span className="text-indigo-400">RIDER</span>.PRO
          </h1>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Visual DJ & Artist Booth Constructor & PDF Rider Generator
        </p>
      </div>

      {/* Quick Rider Preset Templates */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <LayoutTemplate className="w-3 h-3 text-indigo-400" /> Standard Rider Presets
          </span>
        </div>
        <div className="space-y-1.5">
          {PRESET_RIDERS.map(p => (
            <button
              key={p.key}
              onClick={() => onApplyPreset(p.key)}
              className="w-full text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all group flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {p.title}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-700">
                    {p.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {p.desc}
                </p>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 mt-1 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search equipment, brand..." 
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition ${
                selectedCategory === cat.id 
                  ? 'bg-indigo-600 text-white font-bold shadow' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <div className="text-[10px] font-mono text-slate-500 px-2 py-1 uppercase">
          Click gear to place on booth table:
        </div>

        {filteredDevices.map(device => (
          <div 
            key={device.id}
            onClick={() => onAddDevice(device)}
            className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/60 p-3 rounded-lg cursor-pointer transition-all group shadow-sm hover:shadow-indigo-500/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-900 rounded-md border border-slate-700/60">
                  {getIcon(device.type)}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {device.model}
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">
                    {device.manufacturer}
                  </p>
                </div>
              </div>
              <div className="p-1 rounded bg-slate-900/60 text-slate-500 group-hover:text-white group-hover:bg-indigo-600 transition">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
              {device.description}
            </p>

            {device.defaultSubstitution && (
              <div className="mt-1.5 text-[10px] text-slate-500 italic flex items-center gap-1">
                <span>Alt: {device.defaultSubstitution}</span>
              </div>
            )}
          </div>
        ))}

        {filteredDevices.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500 italic">
            No equipment matching "{searchTerm}".
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>STAGE & BOOTH BUILDER</span>
        <span>PDF RIDER READY</span>
      </div>
    </div>
  );
};