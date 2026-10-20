import React, { useRef, useEffect, useState } from 'react';
import { X, Box, Play, Pause, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { BoothItem, Cable, DeviceType } from '../types';
import { DEVICES } from '../data/equipment';
import { THEME_COLORS } from '../constants';

interface VideoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BoothItem[];
  cables?: Cable[];
}

// 3D Point in mm/units
interface Point3D {
  x: number;
  y: number; // Height
  z: number; // Depth
}

interface ItemPosition {
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    d: number;
}

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({ isOpen, onClose, items, cables = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(20);
  const [isRotating, setIsRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && isRotating) {
      const animate = () => {
        setAngle(prev => (prev + 0.2) % 360);
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, isRotating]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    renderScene();
  }, [isOpen, angle, items, cables, zoomLevel]);

  const renderScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, width, height);

    // -- SCENE CONFIG --
    const TABLE_HEIGHT = 900; // mm

    // --- 1. Calculate 3D Positions & Stacking ---
    const itemPositions = new Map<string, ItemPosition>();
    
    // Initial Position Pass
    items.forEach(item => {
         const def = DEVICES.find(d => d.id === item.deviceId);
         if (!def) return;
         
         if (def.type === DeviceType.SPEAKER) {
             const w = def.width;
             const h = def.height;
             const d = w; // Depth approx for speakers
             // Speakers start on floor (y=0)
             itemPositions.set(item.instanceId, { x: item.x, y: 0, z: item.y, w, h, d });
         } else {
             const w = def.width;
             const d = def.height; // 2D height is 3D depth for gear
             const h = 80; // Chassis thickness
             // Gear starts on table
             itemPositions.set(item.instanceId, { x: item.x, y: TABLE_HEIGHT, z: item.y, w, h, d });
         }
    });

    // Stacking Logic (Speakers)
    const speakers = items.filter(i => {
         const d = DEVICES.find(dev => dev.id === i.deviceId);
         return d?.type === DeviceType.SPEAKER;
    });
    const subs = speakers.filter(s => DEVICES.find(d => d.id === s.deviceId)?.description.toLowerCase().includes('sub'));
    const tops = speakers.filter(s => !DEVICES.find(d => d.id === s.deviceId)?.description.toLowerCase().includes('sub'));
    
    const stackHeights = new Map<string, number>();
    subs.forEach(s => {
        const pos = itemPositions.get(s.instanceId);
        if(pos) stackHeights.set(s.instanceId, pos.y + pos.h); // Base + Height
    });

    // Sort tops by Y (depth in 2D) so we process front-to-back or similar if needed, 
    // but usually just iterating matches them to the nearest sub.
    tops.forEach(top => {
        const topPos = itemPositions.get(top.instanceId);
        if (!topPos) return;

        let closestSubId: string | null = null;
        let minDist = Infinity;

        subs.forEach(sub => {
             const subPos = itemPositions.get(sub.instanceId);
             if (!subPos) return;
             
             const subCenter = subPos.x + subPos.w/2;
             const topCenter = topPos.x + topPos.w/2;
             const dist = Math.abs(subCenter - topCenter);
             
             // Threshold for stacking (150mm tolerance)
             if (dist < 150 && dist < minDist) {
                 minDist = dist;
                 closestSubId = sub.instanceId;
             }
        });

        if (closestSubId) {
             const subPos = itemPositions.get(closestSubId)!;
             const stackH = stackHeights.get(closestSubId)!;
             
             // Update Top Position to sit centered on the sub stack
             const newX = subPos.x + (subPos.w - topPos.w)/2;
             const newZ = subPos.z + (subPos.d - topPos.d)/2;
             const newY = stackH;
             
             itemPositions.set(top.instanceId, { ...topPos, x: newX, y: newY, z: newZ });
             stackHeights.set(closestSubId, newY + topPos.h);
        }
    });
    
    // --- 2. Calculate Bounds for Camera ---
    let allMinX = Infinity, allMaxX = -Infinity, allMinZ = Infinity, allMaxZ = -Infinity; // All items bounds (3D coords)
    let tMinX = Infinity, tMaxX = -Infinity, tMinZ = Infinity, tMaxZ = -Infinity; // Table bounds

    if (items.length === 0) {
        allMinX = 0; allMaxX = 1200; allMinZ = 0; allMaxZ = 600;
        tMinX = 0; tMaxX = 1200; tMinZ = 0; tMaxZ = 600;
    } else {
        items.forEach(i => {
            const pos = itemPositions.get(i.instanceId);
            if (!pos) return;
            
            // Global Update
            allMinX = Math.min(allMinX, pos.x);
            allMaxX = Math.max(allMaxX, pos.x + pos.w);
            allMinZ = Math.min(allMinZ, pos.z);
            allMaxZ = Math.max(allMaxZ, pos.z + pos.d);

            const def = DEVICES.find(d => d.id === i.deviceId);
            // Table Update
            if (def?.type !== DeviceType.SPEAKER) {
                 tMinX = Math.min(tMinX, pos.x);
                 tMaxX = Math.max(tMaxX, pos.x + pos.w);
                 tMinZ = Math.min(tMinZ, pos.z);
                 tMaxZ = Math.max(tMaxZ, pos.z + pos.d);
            }
        });
    }

    // Fallback if no table items found but speakers exist
    if (tMinX === Infinity) { 
        tMinX = allMinX; tMaxX = allMaxX; tMinZ = allMinZ; tMaxZ = allMaxZ; 
    }
    
    // Table Box geometry
    const TABLE_PADDING = 50;
    const tableBox = {
        x: tMinX - TABLE_PADDING,
        z: tMinZ - TABLE_PADDING,
        w: (tMaxX - tMinX) + TABLE_PADDING * 2,
        d: (tMaxZ - tMinZ) + TABLE_PADDING * 2
    };

    // Camera Center: Center of the bounding box of ALL items
    const centerX = (allMinX + allMaxX) / 2;
    const centerZ = (allMinZ + allMaxZ) / 2;
    const centerY = TABLE_HEIGHT / 2; // Look at mid-height

    // Camera Scale: Fit ALL items with rotation
    const extentX = (allMaxX - allMinX) / 2;
    const extentZ = (allMaxZ - allMinZ) / 2;
    // Radius of the scene cylinder to ensure rotation doesn't clip
    const sceneRadius = Math.sqrt(extentX * extentX + extentZ * extentZ);
    
    // We want the diameter (radius*2) plus padding to fit in the canvas min dimension
    const VIEW_PADDING = 150; // pixels on screen buffer
    // Multiplier 2.2 provides a bit of extra "zoom out" to handle the tilt perspective.
    let baseFitScale = (Math.min(width, height) - VIEW_PADDING) / (sceneRadius * 2.2);
    
    // Clamp base scale to reasonable limits
    baseFitScale = Math.max(0.1, Math.min(baseFitScale, 1.0));

    // Apply User Zoom
    const fitScale = baseFitScale * zoomLevel;

    const renderOffsetX = width / 2;
    const renderOffsetY = height / 2;
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // 3D Projection Function
    const project = (p: Point3D) => {
        // Translate to center
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dz = p.z - centerZ;

        // Rotate around Y axis (Orbit)
        const rx = dx * cos - dz * sin;
        const rz = dx * sin + dz * cos;
        const ry = dy;

        // Simple Perspective / Ortho Hybrid
        const screenX = rx * fitScale + renderOffsetX;
        const screenY = (renderOffsetY * 0.5) - (ry * fitScale) + (rz * fitScale * 0.3); // Tilt factor
        
        return { x: screenX, y: screenY, depth: rz };
    };

    // Drawing Primitives
    const drawLine3D = (p1: Point3D, p2: Point3D, color: string, lineWidth: number = 1) => {
        const s1 = project(p1);
        const s2 = project(p2);
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    };

    const fillQuad = (p1: Point3D, p2: Point3D, p3: Point3D, p4: Point3D, color: string, stroke: string = 'transparent') => {
         const pts = [project(p1), project(p2), project(p3), project(p4)];
         ctx.beginPath();
         ctx.moveTo(pts[0].x, pts[0].y);
         for(let i=1; i<4; i++) ctx.lineTo(pts[i].x, pts[i].y);
         ctx.closePath();
         ctx.fillStyle = color;
         ctx.fill();
         if (stroke !== 'transparent') {
             ctx.strokeStyle = stroke;
             ctx.stroke();
         }
    };

    const drawBox = (bx: number, by: number, bz: number, bw: number, bh: number, bd: number, color: string, fill: boolean = true) => {
        // Vertices
        // Bottom Face
        const b1 = { x: bx, y: by, z: bz };
        const b2 = { x: bx+bw, y: by, z: bz };
        const b3 = { x: bx+bw, y: by, z: bz+bd };
        const b4 = { x: bx, y: by, z: bz+bd };
        // Top Face
        const t1 = { x: bx, y: by+bh, z: bz };
        const t2 = { x: bx+bw, y: by+bh, z: bz };
        const t3 = { x: bx+bw, y: by+bh, z: bz+bd };
        const t4 = { x: bx, y: by+bh, z: bz+bd };

        if (fill) {
            // Draw order simplified
            // Top
            fillQuad(t1, t2, t3, t4, 'rgba(30, 41, 59, 0.95)', color);
            // Front (Z+D)
            fillQuad(b4, b3, t3, t4, 'rgba(30, 41, 59, 0.8)', color);
            // Side (X+W)
            fillQuad(b2, b3, t3, t2, 'rgba(30, 41, 59, 0.8)', color);
            // Side (X)
            fillQuad(b1, b4, t4, t1, 'rgba(30, 41, 59, 0.8)', color);
        } else {
            // Wireframe
            drawLine3D(b1, b2, color); drawLine3D(b2, b3, color); drawLine3D(b3, b4, color); drawLine3D(b4, b1, color);
            drawLine3D(t1, t2, color); drawLine3D(t2, t3, color); drawLine3D(t3, t4, color); drawLine3D(t4, t1, color);
            drawLine3D(b1, t1, color); drawLine3D(b2, t2, color); drawLine3D(b3, t3, color); drawLine3D(b4, t4, color);
        }
    };

    // --- RENDER LOOP ---

    // 1. Floor Grid
    // Extend grid based on scene size for context
    const gridExt = Math.max(3000, sceneRadius * 1.5);
    const gridStep = 500;
    
    ctx.globalAlpha = 0.2;
    // Draw grid centered around calculated center
    const startX = Math.floor((centerX - gridExt) / gridStep) * gridStep;
    const endX = Math.ceil((centerX + gridExt) / gridStep) * gridStep;
    const startZ = Math.floor((centerZ - gridExt) / gridStep) * gridStep;
    const endZ = Math.ceil((centerZ + gridExt) / gridStep) * gridStep;

    for(let x = startX; x <= endX; x+= gridStep) {
        drawLine3D({x, y:0, z: startZ}, {x, y:0, z: endZ}, '#475569');
    }
    for(let z = startZ; z <= endZ; z+= gridStep) {
        drawLine3D({x: startX, y:0, z}, {x: endX, y:0, z}, '#475569');
    }
    ctx.globalAlpha = 1.0;

    // 2. Table Legs & Surface
    const legW = 40;
    const surfaceH = 40;
    // Surface
    drawBox(tableBox.x, TABLE_HEIGHT - surfaceH, tableBox.z, tableBox.w, surfaceH, tableBox.d, '#94a3b8');
    // Legs
    const legColor = '#64748b';
    drawBox(tableBox.x + 20, 0, tableBox.z + 20, legW, TABLE_HEIGHT - surfaceH, legW, legColor);
    drawBox(tableBox.x + tableBox.w - 20 - legW, 0, tableBox.z + 20, legW, TABLE_HEIGHT - surfaceH, legW, legColor);
    drawBox(tableBox.x + 20, 0, tableBox.z + tableBox.d - 20 - legW, legW, TABLE_HEIGHT - surfaceH, legW, legColor);
    drawBox(tableBox.x + tableBox.w - 20 - legW, 0, tableBox.z + tableBox.d - 20 - legW, legW, TABLE_HEIGHT - surfaceH, legW, legColor);

    // 3. Render Items
    // Sort items by depth for painter's algorithm using calculated positions
    const sortedItems = [...items].sort((a, b) => {
        const posA = itemPositions.get(a.instanceId) || { x: 0, y: 0, z: 0 };
        const posB = itemPositions.get(b.instanceId) || { x: 0, y: 0, z: 0 };
        // Project center of each to get 'depth' relative to camera
        const pA = project({x: posA.x, y: posA.y, z: posA.z});
        const pB = project({x: posB.x, y: posB.y, z: posB.z});
        return pB.depth - pA.depth; 
    });

    sortedItems.forEach(item => {
        const def = DEVICES.find(d => d.id === item.deviceId);
        if (!def) return;
        const pos = itemPositions.get(item.instanceId);
        if (!pos) return;

        const isSpeaker = def.type === DeviceType.SPEAKER;
        
        if (isSpeaker) {
            // Speaker Logic using Calculated Position
            drawBox(pos.x, pos.y, pos.z, pos.w, pos.h, pos.d, THEME_COLORS.line);

            // Draw Drivers
            def.frontControls.forEach(c => {
                 const cx = pos.x + c.x; // relative to box origin
                 const cy = pos.y + pos.h - c.y; // Y is height from floor + box height - control Y
                 const cz = pos.z; // Front face is at Z (Assuming front is Z- plane or we draw on face)
                 // Note: Our drawBox draws front face at z+d. Let's stick to consistent face.
                 // Actually in drawBox: Front (Z+D), so controls should be at Z+D
                 // Let's adjust to draw controls on the Z+D face (Front towards viewer in default box)
                 
                 // Re-mapping for this specific 3D logic:
                 // drawBox draws faces: b4-b3-t3-t4 is Front (Z+D)
                 // So we project onto Z+D plane
                 
                 if (c.type === 'driver' || c.type === 'knob') {
                     const r = c.radius || 20;
                     const pts = [];
                     for(let i=0; i<=12; i++) {
                         const th = (i/12)*Math.PI*2;
                         // Center controls on front face? 
                         // Actually code uses `cz = item.y` which was Z.
                         // Let's put them on the Z face for now as per original style, but verify orientation.
                         // Original code: `cz = item.y`. drawBox: `z`. Back face is `z`, Front face is `z+d`.
                         // The original code seemingly drew drivers on the BACK face (Z) or the logic for faces is swapped.
                         // Let's assume we want them visible. The camera rotates.
                         // Let's put them on the Z face to match legacy behavior for now to ensure visibility consistency.
                         
                         pts.push({ x: cx + Math.cos(th)*r, y: cy + Math.sin(th)*r, z: pos.z });
                     }
                     const projPts = pts.map(project);
                     ctx.beginPath();
                     ctx.moveTo(projPts[0].x, projPts[0].y);
                     for(let i=1; i<projPts.length; i++) ctx.lineTo(projPts[i].x, projPts[i].y);
                     ctx.fillStyle = '#1e293b';
                     ctx.fill();
                     ctx.strokeStyle = c.variant === 'outline' ? THEME_COLORS.text : '#fff';
                     ctx.stroke();
                 }
            });

            // Back Panel (Z + D)
            // Just like original code: `item.y + d`
            const plateW = 100; const plateH = 150;
            const plateX = pos.x + pos.w/2 - plateW/2;
            const plateY = pos.y + pos.h/2 - plateH/2;
            const plateZ = pos.z + pos.d;
            
            const p1 = {x: plateX, y: plateY, z: plateZ};
            const p2 = {x: plateX+plateW, y: plateY, z: plateZ};
            const p3 = {x: plateX+plateW, y: plateY+plateH, z: plateZ};
            const p4 = {x: plateX, y: plateY+plateH, z: plateZ};
            fillQuad(p1, p2, p3, p4, '#334155', '#475569');

            // Simulate ports
            def.backControls.forEach(c => {
                 const pcx = pos.x + c.x;
                 const pcy = pos.y + c.y + 100; // Offset approximation
                 const pcz = pos.z + pos.d;
                 const pp = project({x: pcx, y: pcy, z: pcz});
                 ctx.beginPath();
                 ctx.arc(pp.x, pp.y, 2, 0, Math.PI*2);
                 ctx.fillStyle = c.type.includes('xlr') ? 'red' : 'yellow';
                 ctx.fill();
            });

        } else {
            // Gear Logic (Flat on Table)
            // Use POS
            drawBox(pos.x, pos.y, pos.z, pos.w, pos.h, pos.d, THEME_COLORS.line);

            // Controls on Top Face
            const topY = pos.y + pos.h;
            
            def.frontControls.forEach(c => {
                const cx = pos.x + c.x;
                const cz = pos.z + c.y; // Map 2D Y to 3D Z
                
                if (c.type === 'screen') {
                    const p1 = project({x: cx, y: topY+1, z: cz});
                    const p2 = project({x: cx+ (c.width || 0), y: topY+1, z: cz});
                    const p3 = project({x: cx+ (c.width || 0), y: topY+1, z: cz+ (c.height || 0)});
                    const p4 = project({x: cx, y: topY+1, z: cz+ (c.height || 0)});
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.lineTo(p3.x, p3.y);
                    ctx.lineTo(p4.x, p4.y);
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                    ctx.fill();
                    ctx.strokeStyle = THEME_COLORS.accent;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else if (c.type === 'jog-wheel') {
                    const r = c.radius || 80;
                    const pts = [];
                    for(let i=0; i<=16; i++) {
                        const th = (i/16)*Math.PI*2;
                        pts.push(project({ x: cx + Math.cos(th)*r, y: topY+2, z: cz + Math.sin(th)*r }));
                    }
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for(let i=1; i<pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.strokeStyle = '#fff';
                    ctx.stroke();
                } else if (c.type === 'fader') {
                     drawLine3D({x: cx, y: topY, z: cz}, {x: cx, y: topY, z: cz + (c.height || 60)}, '#64748b', 2);
                     drawBox(cx - 5, topY, cz + (c.height||60)/2, 10, 10, 15, '#fff');
                } else if (c.type === 'knob') {
                     drawBox(cx - 5, topY, cz - 5, 10, 15, 10, '#94a3b8');
                }
            });

            // Rear Ports
            const rearZ = pos.z;
            def.backControls.forEach(c => {
                const cx = pos.x + c.x;
                const cy = pos.y + pos.h/2; // Mid-way up chassis
                const pp = project({x: cx, y: cy, z: rearZ});
                
                ctx.beginPath();
                ctx.arc(pp.x, pp.y, 2, 0, Math.PI*2);
                ctx.fillStyle = c.type === 'port-power' ? 'yellow' : 'red';
                ctx.fill();
            });
        }
    });

    // 4. Render Cables
    cables.forEach(cable => {
        const fromItem = items.find(i => i.instanceId === cable.fromInstanceId);
        const toItem = items.find(i => i.instanceId === cable.toInstanceId);
        if (!fromItem) return;

        const getCablePoint = (item: BoothItem, portId: string | undefined): Point3D => {
            const def = DEVICES.find(d => d.id === item.deviceId);
            const pos = itemPositions.get(item.instanceId);
            
            // Fallback if pos missing
            if (!def || !pos) return { x: item.x, y: TABLE_HEIGHT, z: item.y };
            
            const isSpeaker = def.type === DeviceType.SPEAKER;
            // Check rear first
            let control = def.backControls.find(c => c.id === portId);
            if (control) {
                if (isSpeaker) {
                    // Speaker Back Panel
                    return { x: pos.x + control.x, y: pos.y + 150, z: pos.z + pos.d }; 
                } else {
                    // Gear Rear Panel (Z = pos.z)
                    return { x: pos.x + control.x, y: pos.y + 40, z: pos.z };
                }
            }
            // Front/Top
            control = def.frontControls.find(c => c.id === portId);
            if (control) {
                 if (isSpeaker) {
                     // Speaker Front
                     return { x: pos.x + control.x, y: pos.y + def.height - control.y, z: pos.z };
                 } else {
                     // Gear Top
                     return { x: pos.x + control.x, y: pos.y + 80, z: pos.z + control.y };
                 }
            }
            // Default center
            return { x: pos.x + pos.w/2, y: pos.y + pos.h/2, z: pos.z + pos.d/2 };
        };

        const start = getCablePoint(fromItem, cable.fromPortId);
        // If no dest, drop to floor
        const end = toItem ? getCablePoint(toItem, cable.toPortId) : { x: start.x, y: 0, z: start.z - 200 };

        // Draw 3D Curve
        const pStart = project(start);
        const pEnd = project(end);
        
        // Control Points for "Slack"
        // Midpoint drops down in Y
        const cp1 = project({ x: start.x, y: start.y - 100, z: start.z - 50 }); // Curve out
        const cp2 = project({ x: end.x, y: end.y - 100, z: end.z - 50 });

        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pEnd.x, pEnd.y);
        
        let color = '#fff';
        if (cable.type === 'power') color = '#f59e0b';
        if (cable.type === 'audio') color = '#ef4444';
        if (cable.type === 'data') color = '#3b82f6';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/40 backdrop-blur">
                    <Box className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h2 className="font-bold text-white text-lg drop-shadow-md">3D Stage Preview</h2>
                    <p className="text-xs text-slate-300 font-mono">LIVE RENDERING</p>
                </div>
            </div>
            
            <div className="flex gap-2 pointer-events-auto">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-600 backdrop-blur mr-2">
                    <button onClick={() => setZoomLevel(z => Math.max(0.1, z - 0.1))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono w-12 text-center text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={() => setZoomLevel(z => Math.min(3.0, z + 0.1))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
                
                <button 
                    onClick={() => { setZoomLevel(1.0); setAngle(20); }}
                    className="p-2 rounded bg-slate-800/50 hover:bg-slate-700 text-white border border-slate-600 transition mr-2"
                    title="Reset View"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>

                <button 
                    onClick={() => setIsRotating(!isRotating)}
                    className="p-2 rounded bg-slate-800/50 hover:bg-slate-700 text-white border border-slate-600 transition"
                >
                    {isRotating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={onClose} className="p-2 rounded bg-slate-800/50 hover:bg-slate-700 text-white border border-slate-600 transition">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950">
            <canvas 
                ref={canvasRef} 
                width={1200} 
                height={800} 
                className="w-full h-full object-cover cursor-move"
                onMouseMove={(e) => {
                    if (e.buttons === 1) {
                        setIsRotating(false);
                        setAngle(prev => prev + e.movementX * 0.5);
                    }
                }}
            />
        </div>

        <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-slate-600 rounded-sm"></div>
                    <span>TABLE ({900}mm)</span>
                </div>
                 <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                    <span>GEAR</span>
                </div>
                <div className="mt-2 text-[10px] opacity-50">
                    CLICK + DRAG TO ROTATE CAMERA
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
