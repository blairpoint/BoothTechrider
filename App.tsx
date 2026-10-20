import React, { useState, useRef, MouseEvent, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { DeviceRenderer } from './components/DeviceRenderer';
import { ManifestModal } from './components/ManifestModal';
import { TechRiderModal } from './components/TechRiderModal';
import { CableConnector } from './components/CableConnector';
import { 
  BoothItem, DeviceDefinition, Cable, ManifestItem, SetupAnalysis, 
  SoftwareType, RiderMetadata 
} from './types';
import { DEVICES } from './data/equipment';
import { generateCables, generateManifest, analyzeSetup } from './services/cablingService';
import { 
  Trash2, RefreshCw, ZoomIn, ZoomOut, Maximize, Cable as CableIcon, 
  AlertCircle, CheckCircle, Info, Layout, Unlock, FileText, 
  Download, Sparkles, Layers, Sliders, ShieldCheck, Printer, Check
} from 'lucide-react';

const getThemeClasses = (software: SoftwareType) => {
    switch (software) {
        case 'serato':
            return {
                app: 'bg-zinc-950 text-zinc-200',
                toolbar: 'bg-zinc-900 border-red-900/50',
                btnControl: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-red-900/50',
                select: 'bg-zinc-900 text-zinc-300 border-red-900/50 focus:border-red-500',
                gridColor: 'rgba(220, 38, 38, 0.08)',
                logoColor: 'text-red-500',
                logoText: 'serato',
                logoImg: undefined,
                logoFont: 'font-bold italic tracking-tighter text-[16rem]',
                canvasBg: 'bg-zinc-950',
            };
        case 'traktor':
            return {
                app: 'bg-blue-950 text-blue-100',
                toolbar: 'bg-blue-900 border-blue-800/50',
                btnControl: 'bg-blue-900/80 hover:bg-blue-800 text-blue-200 border-blue-800/50',
                select: 'bg-blue-900/80 text-blue-200 border-blue-800/50 focus:border-blue-400',
                gridColor: 'rgba(59, 130, 246, 0.12)',
                logoColor: 'text-blue-500',
                logoText: 'TRAKTOR',
                logoImg: undefined,
                logoFont: 'font-black tracking-widest text-[14rem]',
                canvasBg: 'bg-blue-950',
            };
        case 'rekordbox':
            return {
                app: 'bg-slate-900 text-slate-200',
                toolbar: 'bg-slate-800 border-slate-700/50',
                btnControl: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50',
                select: 'bg-slate-800 text-slate-300 border-slate-700/50 focus:border-slate-400',
                gridColor: 'rgba(255, 255, 255, 0.05)',
                logoColor: 'text-white',
                logoText: 'rekordbox',
                logoImg: undefined,
                logoFont: 'font-bold tracking-tighter text-[16rem]',
                canvasBg: 'bg-slate-900',
            };
        default:
            return {
                app: 'bg-slate-950 text-slate-200',
                toolbar: 'bg-slate-900 border-slate-800',
                btnControl: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
                select: 'bg-slate-800 text-slate-300 border-slate-700 focus:border-indigo-500',
                gridColor: 'rgba(99, 102, 241, 0.08)',
                logoColor: 'text-indigo-500',
                logoText: '',
                logoImg: undefined,
                logoFont: '',
                canvasBg: 'bg-slate-950',
            };
    }
};

const defaultRiderMeta: RiderMetadata = {
  artistName: 'ALEX RIVERA / DJ NOVA',
  actType: 'DJ Performance (Digital / CDJ)',
  tourOrEvent: 'World Tour & Festival Dates 2026',
  date: new Date().toISOString().split('T')[0],
  revision: 'REV 2026.1',
  venueOrCity: 'Mainstage / Festival / Club Tour',
  productionContact: {
    name: 'Alex Morgan',
    role: 'Production & Tour Manager',
    email: 'production@artistmgmt.com',
    phone: '+1 (555) 234-5678'
  },
  techContact: {
    name: 'Sam Chen',
    role: 'FOH & Audio Systems Engineer',
    email: 'audio@artistmgmt.com',
    phone: '+1 (555) 876-5432'
  },
  tableSpec: 'One (1) solid, vibration-free, heavy-duty stage table measuring at least 2.4m (8ft) wide by 0.8m deep. Height must be between 95cm and 100cm (38-40 inches) at waist/elbow height. Absolutely NO plastic banquet tables, folding legs without cross-bracing, or unstable risers will be accepted.',
  monitoringSpec: 'Two (2) high-powered professional active 12-inch or 15-inch monitor speakers (e.g., QSC K12.2, Pioneer VM-80, d&b, L-Acoustics) placed on sturdy stands at ear height, angled directly at the artist. Fed via balanced XLR from mixer Booth Output with independent volume control on the mixer surface. Capable of delivering clean 118 dB peak SPL without distortion.',
  powerSpec: 'Dedicated clean, surge-protected 230V/110V circuit isolated from stage lighting, video walls, and motor dimmers. Minimum of 6 clean grounded outlets directly on the DJ table surface.',
  lightingSpec: 'Dimmed, non-distracting lighting over the DJ booth. One adjustable gooseneck LED task light on mixer. No direct strobe lighting pointed into artist eyes from less than 3 meters.',
  hospitalitySpec: 'Four (4) clean black stage towels. Six (6) sealed 500ml room-temperature bottles of still spring water. One high-velocity electric floor fan pointing at artist position.',
  generalClauses: [
    'All equipment must be fully operational, clean, flight-cased, and running the latest official manufacturer firmware.',
    'No substitutions may be made without prior written confirmation from artist management at least 14 days prior to event.',
    'A dedicated soundcheck of at least 30 minutes with a qualified house audio engineer is mandatory prior to venue doors opening.',
    'Beverages must never be placed on top of or directly adjacent to audio hardware.',
    'The promoter is fully responsible for stage security and ensuring the booth is physically protected from audience intrusion.'
  ],
  customClauses: '',
  substitutions: {},
  notesForPromoter: ''
};

const App: React.FC = () => {
  // Booth State
  const [items, setItems] = useState<BoothItem[]>([]);
  const [software, setSoftware] = useState<SoftwareType>('none');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);
  const [isTechRiderOpen, setIsTechRiderOpen] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [globalView, setGlobalView] = useState<'front' | 'back'>('front');
  const [scale, setScale] = useState(0.4);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cables, setCables] = useState<Cable[]>([]);
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [riderMeta, setRiderMeta] = useState<RiderMetadata>(defaultRiderMeta);
  const [analysis, setAnalysis] = useState<SetupAnalysis>({ 
    status: 'empty', 
    message: 'Start by adding equipment or selecting a preset', 
    capabilities: [], 
    missing: [] 
  });

  const theme = useMemo(() => getThemeClasses(software), [software]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const dragPanRef = useRef<{ startX: number, startY: number, initialPanX: number, initialPanY: number } | null>(null);

  // Auto initialize with Club Standard Preset on first load
  useEffect(() => {
    handleApplyPreset('club_2cdj_900');
  }, []);

  // Analysis and Manifest update
  useEffect(() => {
    setAnalysis(analyzeSetup(items, software));
    const newManifest = generateManifest(items, cables);
    setManifest(newManifest);
  }, [items, software, cables]);

  // Sort cables by type so they form clean, color-grouped lanes in the loom
  const sortedCables = useMemo(() => {
    return [...cables].sort((a, b) => {
        const typeOrder = { power: 0, audio: 1, data: 2, ground: 3 };
        return typeOrder[a.type] - typeOrder[b.type];
    });
  }, [cables]);

  // Helper to get port absolute coordinates regardless of current view
  const getPortPosition = (item: BoothItem, portId: string) => {
      const def = DEVICES.find(d => d.id === item.deviceId);
      if (!def) return { x: 0, y: 0, isOnBack: false, portDef: null };
      
      let control = def.backControls.find(c => c.id === portId);
      
      if (control) {
          if (item.view === 'back') {
              return { x: item.x + control.x, y: item.y + control.y, isOnBack: true, portDef: control };
          } else {
              return { x: item.x + control.x, y: item.y, isOnBack: true, portDef: control };
          }
      }

      control = def.frontControls.find(c => c.id === portId);
      if (control) {
          if (item.view === 'back') {
              return { x: item.x + control.x, y: item.y, isOnBack: false, portDef: control };
          } else {
              return { x: item.x + control.x, y: item.y + control.y, isOnBack: false, portDef: control };
          }
      }
      
      return { x: item.x, y: item.y, isOnBack: false, portDef: null };
  };

  const handleAddDevice = (device: DeviceDefinition) => {
    const existingCount = items.length;
    const newItem: BoothItem = {
      instanceId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      deviceId: device.id,
      x: 200 + (existingCount * 280),
      y: 120,
      view: globalView
    };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    // Automatically re-cable on change
    const newCables = generateCables(nextItems);
    setCables(newCables);
  };

  const handleGenerateCables = () => {
      const newCables = generateCables(items);
      setCables(newCables);
      const newManifest = generateManifest(items, newCables);
      setManifest(newManifest);
  };

  const handleClearCables = () => {
      setCables([]);
      setSelectedCableId(null);
  };

  const handleClearBooth = () => {
      setItems([]);
      setCables([]);
      setSelectedId(null);
      setSelectedCableId(null);
  };

  const handleFitToScreen = (itemsOverride?: BoothItem[]) => {
      const targetItems = itemsOverride || items;
      if (targetItems.length === 0 || !canvasRef.current) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      targetItems.forEach(item => {
          const def = DEVICES.find(d => d.id === item.deviceId);
          if (!def) return;
          minX = Math.min(minX, item.x);
          minY = Math.min(minY, item.y);
          maxX = Math.max(maxX, item.x + def.width);
          const currentHeight = (item.view === 'back' && def.rearHeight) ? def.rearHeight : def.height;
          maxY = Math.max(maxY, item.y + currentHeight);
      });

      const PADDING = 120;
      const contentWidth = maxX - minX + (PADDING * 2);
      const contentHeight = maxY - minY + (PADDING * 2);

      if (contentWidth <= 0 || contentHeight <= 0) return;

      const containerW = canvasRef.current.clientWidth;
      const containerH = canvasRef.current.clientHeight;

      const scaleX = containerW / contentWidth;
      const scaleY = containerH / contentHeight;
      
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 0.95);

      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;

      const newPanX = (containerW / 2) - (contentCenterX * newScale);
      const newPanY = (containerH / 2) - (contentCenterY * newScale);

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
  };

  const handleAutoArrange = (itemsToArrange?: BoothItem[]) => {
    const sourceItems = itemsToArrange || items;
    if (sourceItems.length === 0) return;
    
    const CENTER_X = 800;
    const TABLE_Y = 160;
    const MONITOR_Y = 120;
    const SPACING = 25;

    let newItems = [...sourceItems];
    const getDeviceDef = (id: string) => DEVICES.find(d => d.id === id);

    // Grouping
    const mixers = sourceItems.filter(i => ['MIXER', 'ALL_IN_ONE', 'CONTROLLER'].includes(getDeviceDef(i.deviceId)?.type || ''));
    const players = sourceItems.filter(i => getDeviceDef(i.deviceId)?.type === 'PLAYER');
    const samplers = sourceItems.filter(i => getDeviceDef(i.deviceId)?.type === 'FX');
    const monitors = sourceItems.filter(i => getDeviceDef(i.deviceId)?.type === 'SPEAKER');
    const accessories = sourceItems.filter(i => !mixers.includes(i) && !players.includes(i) && !samplers.includes(i) && !monitors.includes(i));

    let leftBound = CENTER_X;
    let rightBound = CENTER_X;

    // 1. Center mixer
    if (mixers.length > 0) {
        const main = mixers[0];
        const def = getDeviceDef(main.deviceId)!;
        const startX = CENTER_X - (def.width / 2);
        newItems = newItems.map(i => i.instanceId === main.instanceId ? { ...i, x: startX, y: TABLE_Y } : i);
        leftBound = startX - SPACING;
        rightBound = startX + def.width + SPACING;
    }

    // 2. Flank players (CDJs / Turntables)
    players.forEach((p, idx) => {
        const def = getDeviceDef(p.deviceId)!;
        if (idx % 2 === 0) {
            const x = leftBound - def.width;
            newItems = newItems.map(i => i.instanceId === p.instanceId ? { ...i, x: x, y: TABLE_Y } : i);
            leftBound = x - SPACING;
        } else {
            const x = rightBound;
            newItems = newItems.map(i => i.instanceId === p.instanceId ? { ...i, x: x, y: TABLE_Y } : i);
            rightBound = x + def.width + SPACING;
        }
    });

    // 3. Live samplers / FX
    samplers.forEach(s => {
        const def = getDeviceDef(s.deviceId)!;
        const x = rightBound;
        newItems = newItems.map(i => i.instanceId === s.instanceId ? { ...i, x: x, y: TABLE_Y } : i);
        rightBound = x + def.width + SPACING;
    });

    // 4. Booth Monitors (Left & Right of booth)
    if (monitors.length > 0) {
        const monLeft = monitors[0];
        const leftDef = getDeviceDef(monLeft.deviceId)!;
        const xL = leftBound - leftDef.width - 40;
        newItems = newItems.map(i => i.instanceId === monLeft.instanceId ? { ...i, x: xL, y: MONITOR_Y } : i);
        leftBound = xL - SPACING;

        if (monitors.length > 1) {
            const monRight = monitors[1];
            const xR = rightBound + 40;
            newItems = newItems.map(i => i.instanceId === monRight.instanceId ? { ...i, x: xR, y: MONITOR_Y } : i);
            rightBound = xR + getDeviceDef(monRight.deviceId)!.width + SPACING;
        }
    }

    // 5. Accessories (Power, stand, mic)
    let accX = rightBound + 20;
    accessories.forEach(a => {
        const def = getDeviceDef(a.deviceId)!;
        newItems = newItems.map(i => i.instanceId === a.instanceId ? { ...i, x: accX, y: TABLE_Y + 40 } : i);
        accX += def.width + SPACING;
    });

    setItems(newItems);
    const newCables = generateCables(newItems);
    setCables(newCables);
    handleFitToScreen(newItems);
  };

  // Preset Template Loader
  const handleApplyPreset = (presetKey: string) => {
    let presetItems: BoothItem[] = [];

    switch(presetKey) {
      case 'festival_4cdj_a9':
        presetItems = [
          { instanceId: 'm1', deviceId: 'djm-a9', x: 0, y: 0, view: globalView },
          { instanceId: 'p1', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'p2', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'p3', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'p4', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'mon1', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'mon2', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'mic1', deviceId: 'mic-sm58', x: 0, y: 0, view: globalView },
          { instanceId: 'sw1', deviceId: 'link-switch', x: 0, y: 0, view: globalView },
          { instanceId: 'pwr1', deviceId: 'pwr-strip', x: 0, y: 0, view: globalView }
        ];
        setRiderMeta(prev => ({
          ...prev,
          actType: 'DJ Performance (Digital / CDJ)',
          substitutions: {
            'CDJ-3000': 'Pioneer CDJ-2000NXS2 (Latest firmware required)',
            'DJM-A9': 'Pioneer DJM-900NXS2 or DJM-V10'
          }
        }));
        break;

      case 'club_2cdj_900':
        presetItems = [
          { instanceId: 'm1', deviceId: 'djm-900', x: 0, y: 0, view: globalView },
          { instanceId: 'p1', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'p2', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'mon1', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'mon2', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'pwr1', deviceId: 'pwr-strip', x: 0, y: 0, view: globalView },
          { instanceId: 'hp1', deviceId: 'senn-hd25', x: 0, y: 0, view: globalView }
        ];
        setRiderMeta(prev => ({
          ...prev,
          actType: 'DJ Performance (Club Standard)',
          substitutions: {
            'CDJ-3000': 'Pioneer CDJ-2000NXS2',
            'DJM-900NXS2': 'Pioneer DJM-A9'
          }
        }));
        break;

      case 'vinyl_analog_xone':
        presetItems = [
          { instanceId: 'm1', deviceId: 'xone-96', x: 0, y: 0, view: globalView },
          { instanceId: 'tt1', deviceId: 'sl-1200', x: 0, y: 0, view: globalView },
          { instanceId: 'tt2', deviceId: 'sl-1200', x: 0, y: 0, view: globalView },
          { instanceId: 'iso1', deviceId: 'turntable-isolator', x: 0, y: 0, view: globalView },
          { instanceId: 'iso2', deviceId: 'turntable-isolator', x: 0, y: 0, view: globalView },
          { instanceId: 'mon1', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'mon2', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'pwr1', deviceId: 'pwr-strip', x: 0, y: 0, view: globalView }
        ];
        setRiderMeta(prev => ({
          ...prev,
          actType: 'Vinyl DJ Set (Analog Turntables)',
          tableSpec: 'EXTREMELY IMPORTANT: Heavy, vibration-damped DJ table. Turntables must be placed on high-density concrete isolation slabs with sorbothane isolation feet to prevent low-frequency acoustic feedback.',
          substitutions: {
            'SL-1210MK7': 'Technics SL-1200MK2 / MK5 (Must be calibrated, target weight 2.5g)',
            'Xone:96': 'Allen & Heath Xone:92 or Pioneer DJM-900NXS2'
          }
        }));
        break;

      case 'hybrid_live_sampler':
        presetItems = [
          { instanceId: 'm1', deviceId: 'djm-900', x: 0, y: 0, view: globalView },
          { instanceId: 'p1', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'p2', deviceId: 'cdj-3000', x: 0, y: 0, view: globalView },
          { instanceId: 'fx1', deviceId: 'djs-1000', x: 0, y: 0, view: globalView },
          { instanceId: 'stand1', deviceId: 'laptop-stand', x: 0, y: 0, view: globalView },
          { instanceId: 'mon1', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'mon2', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'pwr1', deviceId: 'pwr-strip', x: 0, y: 0, view: globalView }
        ];
        setRiderMeta(prev => ({
          ...prev,
          actType: 'Hybrid DJ / Live Hardware Act',
          substitutions: {
            'DJS-1000': 'Roland SP-404MKII or Akai MPC Live II',
            'DJM-900NXS2': 'Pioneer DJM-A9'
          }
        }));
        break;

      case 'all_in_one_xz':
        presetItems = [
          { instanceId: 'm1', deviceId: 'xdj-xz', x: 0, y: 0, view: globalView },
          { instanceId: 'mon1', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'mon2', deviceId: 'booth-mon-12', x: 0, y: 0, view: globalView },
          { instanceId: 'mic1', deviceId: 'mic-sm58', x: 0, y: 0, view: globalView },
          { instanceId: 'pwr1', deviceId: 'pwr-strip', x: 0, y: 0, view: globalView }
        ];
        setRiderMeta(prev => ({
          ...prev,
          actType: 'All-In-One Standalone Performance',
          substitutions: {
            'XDJ-XZ': 'Pioneer Opus-Quad or 2x CDJ-3000 + DJM-A9'
          }
        }));
        break;

      default:
        return;
    }

    handleAutoArrange(presetItems);
  };

  const handleItemMouseDown = (e: MouseEvent, item: BoothItem) => {
    e.stopPropagation();
    setSelectedId(item.instanceId);
    dragItemRef.current = {
      id: item.instanceId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y
    };
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      setSelectedId(null);
      setSelectedCableId(null);
      dragPanRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialPanX: pan.x,
          initialPanY: pan.y
      };
  };

  const handleCableClick = (e: MouseEvent, cableId: string) => {
      e.stopPropagation();
      setSelectedCableId(cableId);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragItemRef.current) {
      const deltaX = (e.clientX - dragItemRef.current.startX) / scale;
      const deltaY = (e.clientY - dragItemRef.current.startY) / scale;

      setItems(prev => prev.map(item => {
        if (item.instanceId === dragItemRef.current?.id) {
          return {
            ...item,
            x: dragItemRef.current.initialX + deltaX,
            y: dragItemRef.current.initialY + deltaY
          };
        }
        return item;
      }));
    } 
    else if (dragPanRef.current) {
        const deltaX = e.clientX - dragPanRef.current.startX;
        const deltaY = e.clientY - dragPanRef.current.startY;
        
        setPan({
            x: dragPanRef.current.initialPanX + deltaX,
            y: dragPanRef.current.initialPanY + deltaY
        });
    }
  };

  const handleMouseUp = () => {
    dragItemRef.current = null;
    dragPanRef.current = null;
  };

  const toggleView = () => {
      const newView = globalView === 'front' ? 'back' : 'front';
      setGlobalView(newView);
      setItems(prev => prev.map(i => ({ ...i, view: newView })));
  };

  const calculateCableGeometry = (start: {x: number, y: number}, end: {x: number, y: number}, index: number) => {
      const isVerticalDrop = Math.abs(start.x - end.x) < 5 && end.y > start.y + 100;

      if (isVerticalDrop) {
           const d = `M ${start.x} ${start.y} L ${start.x} ${end.y}`;
           return { d, labelX: start.x + 8, labelY: start.y + 80, isVertical: true };
      }

      const LANE_HEIGHT = 12;
      const laneOffset = (index % 8) * LANE_HEIGHT;
      const BASE_CLEARANCE = 100;
      const channelY = Math.max(start.y, end.y) + BASE_CLEARANCE + laneOffset;
      const radius = 15;
      const dirX = end.x > start.x ? 1 : -1;
      
      if (Math.abs(end.x - start.x) < radius * 2) {
           const d = `M ${start.x} ${start.y} 
               L ${start.x} ${channelY} 
               L ${end.x} ${channelY} 
               L ${end.x} ${end.y}`;
           return { d, labelX: (start.x + end.x) / 2, labelY: channelY, isVertical: false };
      }

      const d = `
        M ${start.x} ${start.y} 
        L ${start.x} ${channelY - radius}
        Q ${start.x} ${channelY} ${start.x + (radius * dirX)} ${channelY}
        L ${end.x - (radius * dirX)} ${channelY}
        Q ${end.x} ${channelY} ${end.x} ${channelY - radius}
        L ${end.x} ${end.y}
      `;

      const midX = (start.x + end.x) / 2;
      const labelY = channelY;

      return { d, labelX: midX, labelY: labelY, isVertical: false };
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme.app} transition-colors duration-500 font-sans`}>
      
      {/* Sidebar: Equipment Library & Rider Presets */}
      <Sidebar 
          onAddDevice={handleAddDevice} 
          onApplyPreset={handleApplyPreset}
      />
      
      {/* Main Workspace Canvas & Toolbar */}
      <main className="flex-1 flex flex-col relative h-full" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
          
          {/* Top Control Toolbar */}
          <div className={`h-16 ${theme.toolbar} border-b flex items-center justify-between px-6 z-20 shadow-lg shrink-0 transition-colors duration-500`}>
              
              {/* Left Side: Zoom & View Controls */}
              <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 ${theme.btnControl} rounded-lg p-1 border transition-colors duration-500`}>
                      <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-1.5 hover:opacity-80 rounded transition" title="Zoom Out">
                          <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono w-12 text-center opacity-70">{Math.round(scale * 100)}%</span>
                      <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1.5 hover:opacity-80 rounded transition" title="Zoom In">
                          <ZoomIn className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleFitToScreen()} className="p-1.5 hover:opacity-80 rounded transition text-xs font-mono px-2" title="Fit Booth to Screen">
                          FIT
                      </button>
                  </div>

                  <div className="flex items-center gap-2">
                      <button onClick={toggleView} className={`flex items-center gap-2 px-3 py-1.5 ${theme.btnControl} rounded-lg border transition font-mono text-xs`} title="Toggle Top vs Rear Panel View">
                          <RefreshCw className={`w-3.5 h-3.5 ${globalView === 'back' ? 'text-indigo-400' : ''}`} />
                          {globalView === 'front' ? 'TOP VIEW' : 'REAR PANEL'}
                      </button>
                      
                      <button onClick={() => handleAutoArrange()} className={`flex items-center gap-2 px-3 py-1.5 ${theme.btnControl} rounded-lg border transition font-mono text-xs`} title="Auto-Arrange Ergonomic DJ Table Layout">
                          <Layout className="w-3.5 h-3.5" />
                          AUTO-ALIGN
                      </button>
                      
                      <select 
                          value={software} 
                          onChange={(e) => setSoftware(e.target.value as SoftwareType)}
                          className={`${theme.select} rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none transition-colors duration-500 cursor-pointer`}
                          title="DJ Software Integration"
                      >
                          <option value="none">STANDALONE (NO LAPTOP)</option>
                          <option value="rekordbox">PIONEER REKORDBOX</option>
                          <option value="serato">SERATO DJ PRO</option>
                          <option value="traktor">NI TRAKTOR PRO</option>
                      </select>
                  </div>
              </div>

              {/* Middle: Rider Health Status */}
              <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-800/60 border border-slate-700/80 rounded-full">
                  {analysis.status === 'ready' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : 
                  analysis.status === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-400" /> :
                  analysis.status === 'incomplete' ? <AlertCircle className="w-4 h-4 text-rose-400" /> :
                  <Info className="w-4 h-4 text-slate-400" />}
                  
                  <span className={`text-xs font-bold uppercase tracking-tight ${
                      analysis.status === 'ready' ? 'text-emerald-400' : 
                      analysis.status === 'incomplete' ? 'text-rose-400' :
                      analysis.status === 'warning' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                      {analysis.message}
                  </span>
              </div>

              {/* Right Side: Primary Tech Rider Generation Action */}
              <div className="flex items-center gap-3">
                  
                  {selectedId && (
                      <button 
                        onClick={() => { 
                          if (selectedId) setItems(prev => prev.filter(i => i.instanceId !== selectedId)); 
                          setSelectedId(null); 
                        }} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/60 rounded-lg transition text-xs font-medium"
                      >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Gear
                      </button>
                  )}

                  {items.length > 0 && (
                    <button
                      onClick={handleClearBooth}
                      className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition"
                      title="Clear booth canvas"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    onClick={() => setIsManifestOpen(true)}
                    disabled={items.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition text-xs font-semibold disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Manifest ({items.length})
                  </button>

                  {/* Primary CTA: GENERATE TECH RIDER & PDF */}
                  <button
                    onClick={() => {
                      handleGenerateCables();
                      setIsTechRiderOpen(true);
                    }}
                    disabled={items.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white border border-indigo-400/30 rounded-xl transition text-xs font-bold shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <FileText className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                    <span>GENERATE TECH RIDER & PDF</span>
                    <Download className="w-3.5 h-3.5 text-indigo-200" />
                  </button>

              </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex overflow-hidden relative">
              <div 
                  id="booth-canvas"
                  ref={canvasRef}
                  className={`flex-1 relative overflow-hidden ${theme.canvasBg} cursor-grab active:cursor-grabbing transition-colors duration-500`}
                  onMouseDown={handleCanvasMouseDown}
                  style={{ 
                      backgroundImage: `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                      backgroundPosition: `${pan.x}px ${pan.y}px` 
                  }}
              >
                  {/* Canvas Container with Pan & Scale */}
                  <div 
                      className="absolute inset-0 transition-transform duration-75 origin-top-left"
                      style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
                  >
                      {items.length === 0 && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25" 
                            style={{ transform: `translate(${-pan.x}px, ${-pan.y}px) scale(${1/scale})` }}
                          >
                              <div className="text-center max-w-md">
                                  <Sliders className="w-20 h-20 mx-auto text-slate-500 mb-4 stroke-1" />
                                  <h2 className="text-3xl font-black text-slate-400 tracking-tight">EMPTY BOOTH</h2>
                                  <p className="text-slate-400 font-sans text-sm mt-2">
                                      Select a standard rider preset from the left panel or click any equipment item to construct your custom artist rider.
                                  </p>
                              </div>
                          </div>
                      )}

                      {/* Cable Interconnect Layer (Visible on Rear View or when Patched) */}
                      {globalView === 'back' && (
                          <svg className="absolute inset-0 overflow-visible" width="100%" height="100%" style={{ zIndex: 20 }}>
                              {sortedCables.map((cable, index) => {
                                  const fromItem = items.find(i => i.instanceId === cable.fromInstanceId);
                                  if (!fromItem) return null;
                                  
                                  const startInfo = getPortPosition(fromItem, cable.fromPortId);
                                  let endInfo = { x: startInfo.x, y: startInfo.y + 250, isOnBack: false, portDef: null as any };
                                  
                                  if (cable.toInstanceId) {
                                      const toItem = items.find(i => i.instanceId === cable.toInstanceId);
                                      if (toItem && cable.toPortId) {
                                          endInfo = getPortPosition(toItem, cable.toPortId);
                                      }
                                  }

                                  let strokeColor = '#64748b'; 
                                  if (cable.type === 'power') strokeColor = '#f59e0b'; 
                                  if (cable.type === 'audio') strokeColor = '#ef4444'; 
                                  if (cable.type === 'ground') strokeColor = '#10b981'; 
                                  if (cable.type === 'data') strokeColor = '#3b82f6'; 
                                  
                                  const isSelected = cable.id === selectedCableId;
                                  if (isSelected) strokeColor = '#ffffff';

                                  const geom = calculateCableGeometry(startInfo, endInfo, index);

                                  return (
                                      <g 
                                          key={cable.id} 
                                          onClick={(e) => handleCableClick(e, cable.id)}
                                          className="cursor-pointer hover:opacity-80 transition-opacity"
                                      >
                                          <path 
                                              d={geom.d}
                                              stroke="transparent"
                                              strokeWidth="20"
                                              fill="none"
                                          />
                                          <path 
                                              d={geom.d}
                                              stroke={strokeColor}
                                              strokeWidth={isSelected ? "8" : "6"}
                                              fill="none"
                                              strokeLinejoin="round"
                                              strokeLinecap="round"
                                              className="drop-shadow-md"
                                          />
                                          <circle cx={startInfo.x} cy={startInfo.y} r={isSelected ? 8 : 6} fill={strokeColor} />
                                          <circle cx={endInfo.x} cy={endInfo.y} r={isSelected ? 8 : 6} fill={strokeColor} />
                                          
                                          <g transform={`translate(${geom.labelX}, ${geom.labelY})`}>
                                              <rect 
                                                  x="-30" y="-10" width="60" height="20" 
                                                  fill="#0f172a" stroke={strokeColor} strokeWidth="1" rx="4" 
                                              />
                                              <text 
                                                  x="0" y="4" 
                                                  textAnchor="middle" 
                                                  fill={strokeColor} 
                                                  fontSize="10" 
                                                  fontWeight="bold" 
                                                  fontFamily="Space Mono"
                                              >
                                                  {cable.type.toUpperCase()}
                                              </text>
                                          </g>
                                      </g>
                                  );
                              })}
                          </svg>
                      )}

                      {/* Connector Popups Layer */}
                      {globalView === 'back' && selectedCableId && (() => {
                          const cable = cables.find(c => c.id === selectedCableId);
                          if (!cable) return null;

                          const fromItem = items.find(i => i.instanceId === cable.fromInstanceId);
                          const toItem = items.find(i => i.instanceId === cable.toInstanceId);
                          if (!fromItem) return null;

                          const startInfo = getPortPosition(fromItem, cable.fromPortId);
                          const endInfo = toItem && cable.toPortId ? getPortPosition(toItem, cable.toPortId) : { x: startInfo.x, y: startInfo.y + 250, isOnBack: false, portDef: null };

                          let startGender: 'male' | 'female' = 'female'; 
                          let endGender: 'male' | 'female' = 'male'; 
                          
                          let startType: any = cable.type;
                          if (cable.type === 'audio') {
                            if (startInfo.portDef?.type === 'port-rca') startGender = 'male'; 
                            else startGender = 'female'; 

                            if (endInfo.portDef?.type === 'port-rca') endGender = 'male';
                            else endGender = 'male'; 
                          }

                          if (cable.type === 'power') {
                              startGender = 'female';
                              endGender = 'male';
                          }

                          return (
                              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
                                  <div style={{ position: 'absolute', left: startInfo.x, top: startInfo.y, transform: 'translate(-50%, -120%)' }}>
                                      <CableConnector type={startType} gender={startGender} label={startInfo.portDef?.label} />
                                  </div>
                                  {cable.toInstanceId && (
                                      <div style={{ position: 'absolute', left: endInfo.x, top: endInfo.y, transform: 'translate(-50%, -120%)' }}>
                                          <CableConnector type={startType} gender={endGender} label={endInfo.portDef?.label} />
                                      </div>
                                  )}
                              </div>
                          );
                      })()}

                      {/* Placed Equipment Devices */}
                      {items.map(item => {
                          const def = DEVICES.find(d => d.id === item.deviceId);
                          if (!def) return null;
                          
                          return (
                              <div
                                  key={item.instanceId}
                                  style={{ 
                                      position: 'absolute', 
                                      left: item.x, 
                                      top: item.y,
                                      zIndex: item.instanceId === selectedId ? 35 : 10
                                  }}
                                  onMouseDown={(e) => handleItemMouseDown(e, item)}
                              >
                                  <DeviceRenderer 
                                      device={def} 
                                      view={item.view} 
                                      selected={item.instanceId === selectedId}
                                  />
                              </div>
                          );
                      })}
                  </div>
                  
                  {/* Canvas HUD Legend */}
                  <div className="absolute bottom-4 right-4 pointer-events-none text-right bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-2.5 rounded-lg">
                      <div className="text-[10px] font-mono text-slate-400">STAGE TABLE GRID: 20mm</div>
                      <div className="text-[10px] font-mono text-slate-400">SCALE: 1:{Math.round(1/scale)}</div>
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mt-0.5">DRAG GEAR TO POSITION</div>
                  </div>

                  {/* Quick Guide Indicator */}
                  <div className="absolute bottom-4 left-4 pointer-events-none bg-slate-900/80 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11px] font-mono text-slate-300">
                        {globalView === 'front' ? 'Top-Down Stage Plot View' : 'Rear Panel Cable Loom View'}
                      </span>
                  </div>
              </div>

              {/* Side Patch Summary Bar (collapsible or persistent when cabled) */}
              {cables.length > 0 && (
                  <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl h-full shrink-0">
                      <div className="p-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <CableIcon className="w-4 h-4 text-indigo-400" />
                              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                  Patch Routing
                              </h3>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/40">
                              {cables.length} lines
                          </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                          {manifest.filter(m => m.category === 'cable').map((cable, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                                  <div>
                                    <div className="text-slate-200 text-xs font-medium">{cable.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{cable.details}</div>
                                  </div>
                                  <span className="font-mono text-indigo-400 text-xs font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
                                      x{cable.quantity}
                                  </span>
                              </div>
                          ))}
                      </div>

                      <div className="p-3 border-t border-slate-800 bg-slate-950">
                          <button
                            onClick={() => setIsTechRiderOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Open Full Tech Rider
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </main>

      {/* Official Technical Rider Document & PDF Generation Modal */}
      <TechRiderModal
          isOpen={isTechRiderOpen}
          onClose={() => setIsTechRiderOpen(false)}
          items={items}
          cables={cables}
          manifest={manifest}
          riderMeta={riderMeta}
          onUpdateRiderMeta={setRiderMeta}
      />

      {/* Quick Equipment Manifest Modal */}
      <ManifestModal
          isOpen={isManifestOpen}
          onClose={() => setIsManifestOpen(false)}
          onAcknowledge={() => {
            setIsManifestOpen(false);
            setIsTechRiderOpen(true);
          }}
          manifest={manifest}
      />

    </div>
  );
};

export default App;