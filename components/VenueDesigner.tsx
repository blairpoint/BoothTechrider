import React, { useState, useRef, useMemo, MouseEvent } from 'react';
import { BoothItem, DeviceDefinition, DeviceType, Point, VenueItem } from '../types';
import { DEVICES } from '../data/equipment';
import { THEME_COLORS, VENUE_GRID_SIZE } from '../constants';
import { PenTool, MousePointer2, Volume2, RotateCw, Trash2, Maximize, AlertCircle, Layout, Map, Box } from 'lucide-react';

interface VenueDesignerProps {
  items: BoothItem[];
  onViewChange: (mode: 'booth' | 'venue') => void;
  walls: Point[];
  onWallsChange: (walls: Point[]) => void;
  placedItems: VenueItem[];
  onPlacedItemsChange: (items: VenueItem[]) => void;
}

export const VenueDesigner: React.FC<VenueDesignerProps> = ({ 
    items, onViewChange, walls, onWallsChange, placedItems, onPlacedItemsChange 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'select'>('select');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAcoustics, setShowAcoustics] = useState(true);

  // Refs for dragging
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const rotateRef = useRef<{ id: string, startAngle: number, initialRotation: number } | null>(null);

  // Filter available items from the booth
  const availableDevices = useMemo(() => {
      // Group items by their type for easier browsing
      return items.filter(item => {
           // We might want to filter out tiny accessories if needed, but keeping most gear is good
           return true;
      });
  }, [items]);

  // --- Drawing Logic ---

  const handleCanvasClick = (e: MouseEvent) => {
    if (mode !== 'draw' || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Snap to grid
    const x = Math.round(rawX / (VENUE_GRID_SIZE / 2)) * (VENUE_GRID_SIZE / 2);
    const y = Math.round(rawY / (VENUE_GRID_SIZE / 2)) * (VENUE_GRID_SIZE / 2);

    // Close loop if near start
    if (walls.length > 2) {
      const start = walls[0];
      if (Math.hypot(x - start.x, y - start.y) < 20) {
        setIsDrawing(false);
        setMode('select');
        return;
      }
    }

    onWallsChange([...walls, { x, y }]);
  };

  const clearWalls = () => {
    onWallsChange([]);
    setIsDrawing(true);
    setMode('draw');
  };

  // --- Item Management ---

  const importItem = (boothItem: BoothItem) => {
    // Check if already placed
    if (placedItems.some(pi => pi.sourceInstanceId === boothItem.instanceId)) return;

    onPlacedItemsChange([...placedItems, {
      id: `venue-${Date.now()}`,
      sourceInstanceId: boothItem.instanceId,
      deviceId: boothItem.deviceId,
      type: 'device',
      x: 300,
      y: 300,
      rotation: 180 // Default facing 'crowd' (down)
    }]);
    setMode('select');
  };

  const addTable = () => {
      onPlacedItemsChange([...placedItems, {
          id: `furn-${Date.now()}`,
          deviceId: 'generic-table',
          type: 'furniture',
          x: 400,
          y: 400,
          width: 160, // 4 grid squares
          height: 60, // 1.5 grid squares
          rotation: 0
      }]);
      setMode('select');
  };

  // --- Dragging Logic ---

  const handleMouseDown = (e: MouseEvent, id: string) => {
    if (mode === 'draw') return;
    e.stopPropagation();
    setSelectedItemId(id);
    
    const item = placedItems.find(i => i.id === id);
    if (!item) return;

    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y
    };
  };

  const handleRotateMouseDown = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const item = placedItems.find(i => i.id === id);
    if (!item || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + item.x;
    const centerY = rect.top + item.y;
    
    // Calculate initial angle
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    rotateRef.current = {
      id,
      startAngle: angle,
      initialRotation: item.rotation
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      
      const rawX = dragRef.current.initialX + dx;
      const rawY = dragRef.current.initialY + dy;

      // Snap to Grid (20px)
      const GRID = VENUE_GRID_SIZE / 2;
      const snappedX = Math.round(rawX / GRID) * GRID;
      const snappedY = Math.round(rawY / GRID) * GRID;

      onPlacedItemsChange(placedItems.map(item => {
        if (item.id === dragRef.current?.id) {
          return {
            ...item,
            x: snappedX,
            y: snappedY
          };
        }
        return item;
      }));
    } else if (rotateRef.current && svgRef.current) {
      const item = placedItems.find(i => i.id === rotateRef.current?.id);
      if (!item) return;

      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + item.x;
      const centerY = rect.top + item.y;
      
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const deltaAngle = currentAngle - rotateRef.current.startAngle;
      
      // Snap rotation to 15 degrees
      let newRotation = rotateRef.current.initialRotation + deltaAngle;
      newRotation = Math.round(newRotation / 15) * 15;
      
      onPlacedItemsChange(placedItems.map(i => {
        if (i.id === rotateRef.current?.id) {
          return { ...i, rotation: newRotation };
        }
        return i;
      }));
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
    rotateRef.current = null;
  };

  // --- Acoustics Visualization ---

  const renderAcoustics = () => {
    return placedItems.map(item => {
      const def = DEVICES.find(d => d.id === item.deviceId);
      // Only render acoustics for speakers
      if (!def || def.type !== DeviceType.SPEAKER) return null;

      // Heuristic for sound dispersion based on device type
      let throwDistance = 300; // pixels
      let dispersionAngle = 90; // degrees
      let isSub = def.description.toLowerCase().includes('sub');

      if (isSub) {
        throwDistance = 250;
        dispersionAngle = 360; // Subs are omni (simplified)
      } else {
        // Long throw tops vs standard
        if (def.model.includes('LA') || def.description.includes('Line')) {
          throwDistance = 600;
          dispersionAngle = 100; // Wide horizontal
        } else {
          throwDistance = 400;
          dispersionAngle = 90;
        }
      }

      const rad = (item.rotation - 90) * (Math.PI / 180); // Adjusting so 0 is up, but visually we rotated
      
      // Calculate wedge path
      let d = '';
      if (dispersionAngle >= 360) {
        d = `M ${item.x} ${item.y} m -${throwDistance}, 0 a ${throwDistance},${throwDistance} 0 1,0 ${throwDistance * 2},0 a ${throwDistance},${throwDistance} 0 1,0 -${throwDistance * 2},0`;
      } else {
        const startAngle = rad - (dispersionAngle * Math.PI / 360);
        const endAngle = rad + (dispersionAngle * Math.PI / 360);
        
        const x1 = item.x + throwDistance * Math.cos(startAngle);
        const y1 = item.y + throwDistance * Math.sin(startAngle);
        const x2 = item.x + throwDistance * Math.cos(endAngle);
        const y2 = item.y + throwDistance * Math.sin(endAngle);

        d = `M ${item.x} ${item.y} L ${x1} ${y1} A ${throwDistance} ${throwDistance} 0 0 1 ${x2} ${y2} Z`;
      }

      return (
        <g key={`sound-${item.id}`} style={{ pointerEvents: 'none' }}>
           <defs>
             <radialGradient id={`grad-${item.id}`} cx="0.5" cy="0.5" r="0.5">
               <stop offset="0%" stopColor={isSub ? "#a855f7" : "#38bdf8"} stopOpacity="0.6" />
               <stop offset="100%" stopColor={isSub ? "#a855f7" : "#38bdf8"} stopOpacity="0" />
             </radialGradient>
           </defs>
           <path 
             d={d} 
             fill={`url(#grad-${item.id})`} 
             clipPath="url(#room-clip)"
           />
        </g>
      );
    });
  };

  const wallPath = useMemo(() => {
    if (walls.length === 0) return '';
    return walls.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  }, [walls]);

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 font-sans" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      {/* Sidebar Controls */}
      <div className="w-72 border-r border-slate-700 flex flex-col bg-slate-900 shadow-xl z-10">
        <div className="p-4 border-b border-slate-700 bg-slate-950">
          <h2 className="font-bold text-lg mb-4">Venue Designer</h2>
          
           {/* Navigation Switcher */}
           <div className="flex bg-slate-800 p-1 rounded-lg mb-2 border border-slate-700">
                <button 
                    onClick={() => onViewChange('booth')} 
                    className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700/50"
                >
                    <Layout className="w-3 h-3" /> BOOTH
                </button>
                <button 
                    onClick={() => onViewChange('venue')} 
                    className="flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white shadow"
                >
                    <Map className="w-3 h-3" /> VENUE
                </button>
            </div>

          <p className="text-xs text-slate-500 text-center mt-2">Draw floorplan & place PA.</p>
        </div>

        {/* Tools */}
        <div className="p-4 grid grid-cols-2 gap-2">
           <button 
             onClick={() => setMode('select')}
             className={`p-2 flex flex-col items-center justify-center rounded border ${mode === 'select' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
           >
             <MousePointer2 className="w-5 h-5 mb-1" />
             <span className="text-[10px]">SELECT / MOVE</span>
           </button>
           <button 
             onClick={() => { setMode('draw'); if(walls.length > 0) clearWalls(); }}
             className={`p-2 flex flex-col items-center justify-center rounded border ${mode === 'draw' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
           >
             <PenTool className="w-5 h-5 mb-1" />
             <span className="text-[10px]">DRAW WALLS</span>
           </button>
        </div>
        
        <div className="px-4 pb-4">
             <button 
                onClick={addTable}
                className="w-full py-2 flex items-center justify-center gap-2 rounded border bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-500 transition-colors"
             >
                 <Box className="w-4 h-4" />
                 ADD DJ TABLE
             </button>
        </div>

        {/* Acoustics Toggle */}
        <div className="px-4 pb-4">
             <button 
                onClick={() => setShowAcoustics(!showAcoustics)}
                className={`w-full py-2 flex items-center justify-center gap-2 rounded border transition-colors ${showAcoustics ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
             >
                 <Volume2 className="w-4 h-4" />
                 {showAcoustics ? 'HIDE ACOUSTICS' : 'SHOW ACOUSTICS'}
             </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Booth Equipment</h3>
          <div className="space-y-2">
            {availableDevices.map((item) => {
               const def = DEVICES.find(d => d.id === item.deviceId);
               const isPlaced = placedItems.some(pi => pi.sourceInstanceId === item.instanceId);
               
               return (
                 <div 
                   key={item.instanceId}
                   onClick={() => !isPlaced && importItem(item)}
                   className={`p-3 rounded border flex items-center justify-between transition-all ${
                     isPlaced 
                       ? 'opacity-40 bg-slate-900 border-slate-800 cursor-not-allowed' 
                       : 'bg-slate-800 border-slate-700 hover:border-sky-500 cursor-pointer hover:bg-slate-750'
                   }`}
                 >
                    <div>
                        <div className="text-sm font-bold text-slate-200">{def?.model}</div>
                        <div className="text-[10px] text-slate-500">{def?.manufacturer}</div>
                    </div>
                    {isPlaced && <CheckPlaced />}
                 </div>
               );
            })}
            {availableDevices.length === 0 && (
                <div className="p-4 text-center text-slate-600 text-xs italic border border-dashed border-slate-800 rounded">
                    Booth is empty.
                </div>
            )}
          </div>
        </div>
        
        {/* Selected Item Controls */}
        {selectedItemId && (
            <div className="p-4 bg-slate-800 border-t border-slate-700">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">SELECTED ITEM</span>
                    <button 
                        onClick={() => {
                            onPlacedItemsChange(placedItems.filter(i => i.id !== selectedItemId));
                            setSelectedItemId(null);
                        }}
                        className="text-rose-400 hover:text-rose-300"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden bg-slate-950">
        <svg 
           ref={svgRef}
           width="100%" 
           height="100%" 
           className="cursor-crosshair"
           onClick={handleCanvasClick}
        >
          <defs>
             <pattern id="grid" width={VENUE_GRID_SIZE} height={VENUE_GRID_SIZE} patternUnits="userSpaceOnUse">
               <path d={`M ${VENUE_GRID_SIZE} 0 L 0 0 0 ${VENUE_GRID_SIZE}`} fill="none" stroke="#1e293b" strokeWidth="1"/>
             </pattern>
             
             {/* Clip path for acoustics so sound doesn't go through walls (simplified) */}
             <clipPath id="room-clip">
                 {walls.length > 2 ? (
                     <path d={wallPath} />
                 ) : (
                     <rect x="-10000" y="-10000" width="20000" height="20000" />
                 )}
             </clipPath>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Walls */}
          {walls.length > 0 && (
             <path 
                d={wallPath + (mode === 'draw' ? '' : ' Z')}
                fill="#0f172a"
                stroke={THEME_COLORS.line}
                strokeWidth="4"
                strokeLinejoin="round"
             />
          )}

          {/* Drawing Preview Line */}
          {mode === 'draw' && walls.length > 0 && (
              <circle cx={walls[walls.length-1].x} cy={walls[walls.length-1].y} r="4" fill={THEME_COLORS.accent} />
          )}

          {/* Acoustics Layer */}
          {showAcoustics && renderAcoustics()}

          {/* Equipment Layer */}
          {placedItems.map(item => {
              const isSelected = selectedItemId === item.id;
              
              if (item.type === 'furniture') {
                  // Table / Furniture Rendering
                  const w = item.width || 100;
                  const h = item.height || 50;
                  return (
                    <g 
                        key={item.id}
                        transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}
                        onMouseDown={(e) => handleMouseDown(e, item.id)}
                        className="cursor-move"
                    >
                        <rect x={-w/2} y={-h/2} width={w} height={h} fill="#334155" stroke={isSelected ? THEME_COLORS.accent : '#475569'} strokeWidth="2" rx="4" />
                        <text y={4} textAnchor="middle" fontSize="10" fill="#94a3b8" style={{ pointerEvents: 'none', userSelect: 'none' }} transform={`rotate(${-item.rotation})`}>DJ TABLE</text>
                        {isSelected && <RotationHandle item={item} onMouseDown={(e) => handleRotateMouseDown(e, item.id)} />}
                    </g>
                  );
              }

              // Device Rendering
              const def = DEVICES.find(d => d.id === item.deviceId);
              const width = 40; // Simplified dimensions for map view icon
              const height = 30;

              return (
                  <g 
                    key={item.id} 
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}
                    onMouseDown={(e) => handleMouseDown(e, item.id)}
                    className="cursor-move"
                  >
                     {/* Device Icon */}
                     <rect 
                        x={-width/2} y={-height/2} width={width} height={height} 
                        fill="#1e293b" 
                        stroke={isSelected ? THEME_COLORS.accent : THEME_COLORS.text} 
                        strokeWidth={isSelected ? 2 : 1}
                        rx="2"
                     />
                     {/* Front Indicator */}
                     <path d={`M ${-width/2} ${-height/2} L ${width/2} ${-height/2}`} stroke={isSelected ? THEME_COLORS.accent : "white"} strokeWidth="4" />
                     
                     {/* Label */}
                     <text y={5} textAnchor="middle" fontSize="8" fill="white" style={{ pointerEvents: 'none', userSelect: 'none' }} transform={`rotate(${-item.rotation})`}>
                         {def?.model}
                     </text>

                     {/* Rotation Handle */}
                     {isSelected && <RotationHandle item={item} onMouseDown={(e) => handleRotateMouseDown(e, item.id)} />}
                  </g>
              );
          })}

        </svg>

        {/* Empty State Overlay */}
        {walls.length === 0 && mode === 'select' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 text-center max-w-sm backdrop-blur-sm">
                    <Maximize className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Draw Your Venue</h3>
                    <p className="text-slate-400 text-sm mb-4">Select the <strong className="text-white">Draw Walls</strong> tool to define the room shape.</p>
                </div>
            </div>
        )}
        
        {/* Help Text */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 p-3 rounded border border-slate-700 text-xs text-slate-400 pointer-events-none">
             <div className="flex items-center gap-2 mb-1">
                 <MousePointer2 className="w-3 h-3" /> <span>Click + Drag to move</span>
             </div>
             <div className="flex items-center gap-2 mb-1">
                 <RotateCw className="w-3 h-3" /> <span>Drag top handle to rotate</span>
             </div>
        </div>
      </div>
    </div>
  );
};

const CheckPlaced = () => (
    <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
    </div>
);

const RotationHandle = ({ item, onMouseDown }: { item: any, onMouseDown: any }) => (
    <g 
        transform={`translate(0, -${(item.height || 30)/2 + 20})`} 
        onMouseDown={onMouseDown}
        className="cursor-ew-resize hover:scale-110 transition-transform"
    >
        <line x1="0" y1="10" x2="0" y2="25" stroke={THEME_COLORS.accent} strokeDasharray="2 2" />
        <circle r="10" fill={THEME_COLORS.fill} stroke={THEME_COLORS.accent} />
        <RotateCw className="w-3 h-3 -translate-x-1.5 -translate-y-1.5 text-pink-400" />
    </g>
);