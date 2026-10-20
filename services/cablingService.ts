import { BoothItem, Cable, DeviceType, ManifestItem, SetupAnalysis, SoftwareType } from '../types';
import { DEVICES } from '../data/equipment';

export const analyzeSetup = (items: BoothItem[], software: SoftwareType = 'none'): SetupAnalysis => {
    if (items.length === 0) {
        return {
            status: 'empty',
            message: 'Booth is empty. Add equipment to build your rider.',
            capabilities: [],
            missing: ['Equipment (Mixer, Players, Monitors)']
        };
    }

    const counts = {
        players: 0,
        mixers: 0,
        allInOnes: 0,
        controllers: 0,
        turntables: 0,
        monitors: 0,
        speakers: 0,
        subs: 0,
        mics: 0,
        samplers: 0
    };

    items.forEach(i => {
        const def = DEVICES.find(d => d.id === i.deviceId);
        if (def) {
            if (def.type === DeviceType.PLAYER) {
                if (def.model.includes('SL-12') || def.model.includes('Turntable')) counts.turntables++;
                else counts.players++;
            }
            if (def.type === DeviceType.MIXER) counts.mixers++;
            if (def.type === DeviceType.ALL_IN_ONE) counts.allInOnes++;
            if (def.type === DeviceType.CONTROLLER) counts.controllers++;
            if (def.type === DeviceType.FX || def.id.includes('djs')) counts.samplers++;
            if (def.id.includes('mic')) counts.mics++;
            
            if (def.type === DeviceType.SPEAKER) {
                if (def.id.includes('booth-mon') || def.description.toLowerCase().includes('monitor')) {
                    counts.monitors++;
                } else if (def.description.toLowerCase().includes('sub')) {
                    counts.subs++;
                } else {
                    counts.speakers++;
                }
            }
        }
    });

    const capabilities: string[] = [];
    const missing: string[] = [];
    let status: SetupAnalysis['status'] = 'ready';
    let message = 'Tech Rider Ready for Export';

    // Capabilities
    if (software !== 'none') capabilities.push(`Software Integration: ${software.toUpperCase()}`);
    if (counts.turntables > 0) capabilities.push(`${counts.turntables}x Turntable Vinyl Playback (Phono Grounded)`);
    if (counts.players > 0) capabilities.push(`${counts.players}x Pro Digital Multi-Player Decks (Pro DJ Link)`);
    if (counts.allInOnes > 0) capabilities.push('Standalone All-In-One Console');
    if (counts.controllers > 0) capabilities.push('Laptop DJ Control Surface');
    if (counts.samplers > 0) capabilities.push('Live Hardware Sequencing & Sampling');
    if (counts.mics > 0) capabilities.push('Dedicated MC / Vocal Microphone Line');

    if (counts.monitors > 0) {
        capabilities.push(`Stereo Booth Monitoring (${counts.monitors} Active Wedge${counts.monitors > 1 ? 's' : ''})`);
    }

    if (counts.speakers > 0 || counts.subs > 0) {
        capabilities.push(`PA Rig (${counts.speakers} Tops, ${counts.subs} Subs)`);
    }

    // Accessories check
    const accessories = items.filter(i => {
        const d = DEVICES.find(dev => dev.id === i.deviceId);
        return d?.type === DeviceType.ACCESSORY;
    });
    
    // Check for Power Distro
    const hasPower = accessories.some(i => i.deviceId.includes('pwr') || i.deviceId.includes('strip'));
    if (!hasPower && items.length > 2) {
        missing.push('Dedicated Power Distro / Clean Circuit PDU');
    }

    // Check for Booth Monitors
    if (counts.monitors === 0 && counts.speakers === 0) {
        missing.push('Stage Booth Monitors (L & R)');
    }

    // Check for Isolation if Vinyl
    if (counts.turntables > 0) {
        const hasIsolators = items.some(i => i.deviceId.includes('isolator'));
        if (!hasIsolators) {
            missing.push('Turntable Vibration Isolation Slabs');
        }
    }

    // Central hub validation
    const hasCentralHub = counts.mixers > 0 || counts.allInOnes > 0 || counts.controllers > 0;
    
    if (!hasCentralHub) {
        status = 'incomplete';
        message = 'No Audio Mixer or Hub Specified';
        missing.unshift('Primary DJ Mixer or Console');
    } else {
        if (counts.mixers > 0 && counts.players === 0 && counts.turntables === 0 && counts.samplers === 0) {
            status = 'incomplete';
            message = 'No Playback Sources for Mixer';
            missing.unshift('CDJs, Turntables, or Samplers');
        }
    }

    if (status === 'ready' && missing.length > 0) {
        status = 'warning';
        message = `Rider Note: Consider adding ${missing[0]}`;
    }

    return { status, message, capabilities, missing };
};

export const generateCables = (items: BoothItem[]): Cable[] => {
  const cables: Cable[] = [];
  
  const addCable = (fromItem: BoothItem, fromPortId: string, type: Cable['type'], toItem?: BoothItem, toPortId?: string, label?: string) => {
    cables.push({
      id: `cab-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      fromInstanceId: fromItem.instanceId,
      fromPortId: fromPortId,
      toInstanceId: toItem?.instanceId,
      toPortId: toPortId,
      type,
      label
    });
  };

  const hub = items.find(i => {
    const d = DEVICES.find(dev => dev.id === i.deviceId);
    return d && (d.type === DeviceType.MIXER || d.type === DeviceType.ALL_IN_ONE || d.type === DeviceType.CONTROLLER);
  });

  const sources = items.filter(i => {
    const d = DEVICES.find(dev => dev.id === i.deviceId);
    return d?.type === DeviceType.PLAYER || d?.type === DeviceType.FX;
  }).sort((a, b) => a.x - b.x); 

  const monitors = items.filter(i => {
      const d = DEVICES.find(dev => dev.id === i.deviceId);
      return d?.type === DeviceType.SPEAKER;
  }).sort((a, b) => a.x - b.x);

  const mics = items.filter(i => i.deviceId.includes('mic'));
  const pwrStrip = items.find(i => i.deviceId === 'pwr-strip');
  const linkSwitch = items.find(i => i.deviceId === 'link-switch');

  // --- 1. POWER DISTRIBUTION ---
  let pwrSlot = 0;
  items.forEach(item => {
    if (item.deviceId === 'pwr-strip') return;

    const def = DEVICES.find(d => d.id === item.deviceId);
    if (!def) return;
    const pwr = def.backControls.find(c => c.type === 'port-power' || c.id.includes('ac') || c.id.includes('pwr'));
    
    if (pwr) {
        if (pwrStrip && pwrSlot < 6) {
             pwrSlot++;
             addCable(item, pwr.id, 'power', pwrStrip, `ac-${pwrSlot}`, 'IEC Mains');
        } else {
             addCable(item, pwr.id, 'power', undefined, undefined, 'Mains AC Outlet');
        }
    }
  });
  
  if (pwrStrip) {
      addCable(pwrStrip, 'ac-in', 'power', undefined, undefined, 'Clean Audio Circuit Mains (Isolated)');
  }

  // --- 2. AUDIO ROUTING (Sources -> Mixer) ---
  if (hub) {
    const hubDef = DEVICES.find(d => d.id === hub.deviceId);
    
    if (hubDef) {
      sources.forEach((source, idx) => {
        const srcDef = DEVICES.find(d => d.id === source.deviceId);
        if (!srcDef) return;

        // Digital or RCA audio out
        const audioOut = srcDef.backControls.find(c => c.type === 'port-rca' && (c.id.includes('out') || c.id === 'rca'));
        
        // Find matching input on mixer
        let hubInId: string | undefined;
        if (hubDef.type === DeviceType.MIXER) {
             const channelNum = (idx % 4) + 1;
             const input = hubDef.backControls.find(c => c.label?.includes(`CH${channelNum}`) && c.type === 'port-rca');
             if (input) hubInId = input.id;
             else {
                 // Fallback to first available RCA input
                 const anyRca = hubDef.backControls.find(c => c.type === 'port-rca' && c.id.includes(`in-${channelNum}`));
                 if (anyRca) hubInId = anyRca.id;
             }
        } else if (hubDef.id === 'xdj-xz') {
             if (idx === 0) hubInId = 'rca-in-3';
             else if (idx === 1) hubInId = 'rca-in-4';
        } else if (hubDef.id === 'traktor-s4') {
             const inputs = ['rca-in-1', 'rca-in-2', 'rca-in-3', 'rca-in-4'];
             if (idx < 4) hubInId = inputs[idx];
        } else if (hubDef.id === 'xdj-rx3') {
             if (idx === 0) hubInId = 'rca-in-1';
             if (idx === 1) hubInId = 'rca-in-2';
        }

        if (audioOut && hubInId) {
          addCable(source, audioOut.id, 'audio', hub, hubInId, `CH${(idx % 4) + 1} Audio`);
        }

        // Turntable Ground
        if (srcDef.id === 'sl-1200') {
           const gnd = srcDef.backControls.find(c => c.id === 'gnd');
           if (gnd) addCable(source, gnd.id, 'ground', undefined, undefined, 'GND Ground Post'); 
        }

        // Pro DJ Link LAN
        if (linkSwitch) {
            const linkPort = srcDef.backControls.find(c => c.id === 'link');
            if (linkPort && idx < 4) {
                addCable(source, linkPort.id, 'data', linkSwitch, `port${idx + 1}`, 'Pro DJ Link LAN');
            }
        }
      });

      // Microphone
      mics.forEach((mic, idx) => {
          const micDef = DEVICES.find(d => d.id === mic.deviceId);
          const micOut = micDef?.backControls.find(c => c.id === 'xlr-out');
          const hubMicIn = hubDef.backControls.find(c => c.id === 'mic1' || c.label?.includes('MIC'));
          if (micOut && hubMicIn) {
              addCable(mic, micOut.id, 'audio', hub, hubMicIn.id, 'Vocal Mic XLR');
          } else if (micOut) {
              addCable(mic, micOut.id, 'audio', undefined, undefined, 'Direct to FOH Mic Line');
          }
      });

      // --- 3. MIXER OUTPUTS ---
      // Master Out (L/R) -> FOH Snake
      const masterL = hubDef.backControls.find(c => c.label?.includes('MASTER L') || c.label?.includes('MAIN L'));
      const masterR = hubDef.backControls.find(c => c.label?.includes('MASTER R') || c.label?.includes('MAIN R'));

      // Booth Out (L/R) -> Booth Monitors
      const boothL = hubDef.backControls.find(c => c.label?.includes('BOOTH L'));
      const boothR = hubDef.backControls.find(c => c.label?.includes('BOOTH R'));

      const boothMonitors = monitors.filter(m => {
          const d = DEVICES.find(dev => dev.id === m.deviceId);
          return d?.id.includes('booth-mon') || d?.description.toLowerCase().includes('monitor');
      });

      const paTops = monitors.filter(m => !boothMonitors.includes(m) && !DEVICES.find(d => d.id === m.deviceId)?.description.toLowerCase().includes('sub'));
      const paSubs = monitors.filter(m => DEVICES.find(d => d.id === m.deviceId)?.description.toLowerCase().includes('sub'));

      // Booth Monitors connect to Booth Out
      if (boothMonitors.length > 0 && boothL && boothR) {
          boothMonitors.forEach((bm, i) => {
              if (i === 0) addCable(hub, boothL.id, 'audio', bm, 'xlr-in-1', 'Booth Out Left (XLR)');
              else if (i === 1) addCable(hub, boothR.id, 'audio', bm, 'xlr-in-1', 'Booth Out Right (XLR)');
              else addCable(hub, boothL.id, 'audio', bm, 'xlr-in-1', 'Booth Aux (XLR)');
          });
      } else if (boothL && boothR) {
          // Send to stage snake
          addCable(hub, boothL.id, 'audio', undefined, undefined, 'Booth Monitor L (Balanced XLR)');
          addCable(hub, boothR.id, 'audio', undefined, undefined, 'Booth Monitor R (Balanced XLR)');
      }

      // Master Out goes to FOH
      if (paTops.length === 0 && paSubs.length === 0) {
          if (masterL) addCable(hub, masterL.id, 'audio', undefined, undefined, 'FOH Master Left (Balanced XLR to Stage Box)');
          if (masterR) addCable(hub, masterR.id, 'audio', undefined, undefined, 'FOH Master Right (Balanced XLR to Stage Box)');
      } else {
          // Connect to PA speakers
          if (paSubs.length > 0) {
              paSubs.forEach((sub, i) => {
                  if (i % 2 === 0 && masterL) addCable(hub, masterL.id, 'audio', sub, 'xlr-in-l', 'FOH Master L');
                  if (i % 2 === 1 && masterR) addCable(hub, masterR.id, 'audio', sub, 'xlr-in-r', 'FOH Master R');
                  if (paSubs.length === 1 && masterR) addCable(hub, masterR.id, 'audio', sub, 'xlr-in-r', 'FOH Master R');
              });

              paTops.forEach((top, i) => {
                  const sourceSub = paSubs[i % paSubs.length]; 
                  const outPort = (i % 2 === 0) ? 'xlr-out-l' : 'xlr-out-r';
                  addCable(sourceSub, outPort, 'audio', top, 'xlr-in-1', 'PA Thru to Top');
              });
          } else {
              paTops.forEach((top, i) => {
                   if (i % 2 === 0 && masterL) addCable(hub, masterL.id, 'audio', top, 'xlr-in-1', 'FOH Master L');
                   if (i % 2 === 1 && masterR) addCable(hub, masterR.id, 'audio', top, 'xlr-in-1', 'FOH Master R');
              });
          }
      }

      // USB connection for controllers
      if (hubDef.type === DeviceType.CONTROLLER) {
          const usb = hubDef.backControls.find(c => c.label === 'USB');
          if (usb) addCable(hub, usb.id, 'data', undefined, undefined, 'USB Host to Laptop');
      }
    }
  }

  return cables;
};

export const generateManifest = (items: BoothItem[], cables: Cable[]): ManifestItem[] => {
  const manifest: ManifestItem[] = [];

  const deviceCounts = new Map<string, { count: number, def?: any }>();
  items.forEach(item => {
    const def = DEVICES.find(d => d.id === item.deviceId);
    const model = def?.model || item.deviceId;
    if (!deviceCounts.has(model)) {
        deviceCounts.set(model, { count: 0, def });
    }
    deviceCounts.get(model)!.count++;
  });

  deviceCounts.forEach((info, name) => {
    manifest.push({ 
        name, 
        quantity: info.count, 
        category: 'device',
        details: info.def?.description,
        substitution: info.def?.defaultSubstitution
    });
  });

  const powerCount = cables.filter(c => c.type === 'power').length;
  if (powerCount > 0) {
      manifest.push({ 
          name: 'IEC C13 Power Cables', 
          quantity: powerCount, 
          category: 'cable',
          details: 'Heavy-gauge grounded IEC mains cords'
      });
  }
  
  const lanCount = cables.filter(c => c.type === 'data' && (c.label?.includes('LAN') || c.label?.includes('Link'))).length;
  if (lanCount > 0) {
      manifest.push({ 
          name: 'Cat6 Shielded RJ45 Ethernet Cables', 
          quantity: lanCount, 
          category: 'cable',
          details: 'Pro DJ Link LAN network interconnects'
      });
  }

  const usbCount = cables.filter(c => c.type === 'data' && !c.label?.includes('LAN')).length;
  if (usbCount > 0) {
      manifest.push({ 
          name: 'High-Speed USB A-to-B Cables', 
          quantity: usbCount, 
          category: 'cable',
          details: 'Dual-ferrite core low latency audio data'
      });
  }

  let xlrCount = 0;
  let rcaCount = 0;

  cables.filter(c => c.type === 'audio').forEach(c => {
      const fromItem = items.find(i => i.instanceId === c.fromInstanceId);
      const def = DEVICES.find(d => d.id === fromItem?.deviceId);
      if (def) {
          const port = def.backControls.find(p => p.id === c.fromPortId) || def.frontControls.find(p => p.id === c.fromPortId);
          if (port?.type === 'port-xlr') xlrCount++;
          else rcaCount++;
      } else {
          rcaCount++;
      }
  });

  if (rcaCount > 0) {
      manifest.push({ 
          name: 'Stereo RCA / Digital Coaxial Pairs', 
          quantity: rcaCount, 
          category: 'cable',
          details: 'Gold-plated shielded phono/line interconnects'
      });
  }

  if (xlrCount > 0) {
      manifest.push({ 
          name: 'Balanced XLR Cables (M-to-F)', 
          quantity: xlrCount, 
          category: 'cable',
          details: 'Balanced stage mic/line interconnects to FOH & Booth'
      });
  }

  const groundCount = cables.filter(c => c.type === 'ground').length;
  if (groundCount > 0) {
      manifest.push({ 
          name: 'Phono Ground Leads (Spade to Lug)', 
          quantity: groundCount, 
          category: 'cable',
          details: 'Chassis ground wire for hum elimination'
      });
  }

  return manifest;
};