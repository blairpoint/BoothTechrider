import { DEVICES } from '../data/equipment';

/**
 * Localized Offline DJ Tech & Rider Advisor Engine
 * Operates 100% locally in-browser with ZERO API keys or external subscriptions.
 */

interface SetupSuggestion {
  setupName: string;
  devices: string[];
  reasoning: string;
}

export const getLocalSetupRecommendation = (prompt: string): SetupSuggestion => {
  const p = prompt.toLowerCase();

  // 1. Festival / Mainstage 4-Deck
  if (p.includes('festival') || p.includes('mainstage') || p.includes('4 deck') || p.includes('stadium') || p.includes('4 cdj')) {
    return {
      setupName: 'Festival Mainstage 4-Deck Rider',
      devices: ['cdj-3000', 'cdj-3000', 'cdj-3000', 'cdj-3000', 'djm-a9', 'booth-mon-12', 'booth-mon-12', 'mic-sm58', 'link-switch', 'pwr-strip'],
      reasoning: 'Standard 4x Pioneer CDJ-3000 decks with flagship DJM-A9 mixer, Pro DJ Link network switch, vocal mic, and high-SPL stereo booth monitors.'
    };
  }

  // 2. Vinyl / Analog / Turntables
  if (p.includes('vinyl') || p.includes('turntable') || p.includes('technics') || p.includes('1200') || p.includes('1210') || p.includes('analog') || p.includes('record')) {
    return {
      setupName: 'Audiophile Vinyl Performance Setup',
      devices: ['sl-1200', 'sl-1200', 'xone-96', 'turntable-isolator', 'turntable-isolator', 'booth-mon-12', 'booth-mon-12', 'pwr-strip', 'senn-hd25'],
      reasoning: 'Pair of Technics SL-1210MK7 turntables on concrete isolation slabs, warm analog Allen & Heath Xone:96 mixer, and grounded power distro.'
    };
  }

  // 3. Techno / Underground
  if (p.includes('techno') || p.includes('underground') || p.includes('warehouse') || p.includes('berlin')) {
    return {
      setupName: 'Underground Techno 3-Deck & Analog Mixer',
      devices: ['cdj-3000', 'cdj-3000', 'cdj-3000', 'xone-96', 'booth-mon-12', 'booth-mon-12', 'pwr-strip', 'senn-hd25'],
      reasoning: '3-deck CDJ-3000 arrangement with Allen & Heath Xone:96 for surgical 4-band parametric EQ and dual VCF analog filtering.'
    };
  }

  // 4. Hybrid Live / Sampler / Live Electronic
  if (p.includes('hybrid') || p.includes('sampler') || p.includes('live') || p.includes('djs') || p.includes('drum machine') || p.includes('synth')) {
    return {
      setupName: 'Hybrid DJ & Live Sampler Rig',
      devices: ['cdj-3000', 'cdj-3000', 'djm-900', 'djs-1000', 'laptop-stand', 'booth-mon-12', 'booth-mon-12', 'pwr-strip'],
      reasoning: 'Dual CDJ-3000s paired with the Pioneer DJS-1000 standalone performance sampler, DJM-900NXS2 mixer, and elevated laptop stand.'
    };
  }

  // 5. All-in-one Standalone / Mobile
  if (p.includes('all in one') || p.includes('portable') || p.includes('mobile') || p.includes('standalone') || p.includes('xz') || p.includes('rx3') || p.includes('wedding')) {
    return {
      setupName: 'Standalone All-In-One Tour Console',
      devices: ['xdj-xz', 'booth-mon-12', 'booth-mon-12', 'mic-sm58', 'pwr-strip'],
      reasoning: 'Pioneer XDJ-XZ 4-channel standalone console, wireless microphone, stereo booth monitors, and clean power distribution.'
    };
  }

  // 6. Laptop / Controller / Traktor
  if (p.includes('traktor') || p.includes('controller') || p.includes('laptop') || p.includes('s4') || p.includes('compact')) {
    return {
      setupName: 'Pro Laptop Controller Performance Rig',
      devices: ['traktor-s4', 'laptop-stand', 'booth-mon-12', 'booth-mon-12', 'pwr-strip', 'senn-hd25'],
      reasoning: 'Native Instruments Kontrol S4 MK3 motorized controller with elevated laptop stand and studio booth monitors.'
    };
  }

  // 7. Hip Hop / Battle / Scratch
  if (p.includes('hip hop') || p.includes('battle') || p.includes('scratch') || p.includes('dnb') || p.includes('drum and bass')) {
    return {
      setupName: 'Turntable Scratch & Battle Setup',
      devices: ['sl-1200', 'sl-1200', 'djm-900', 'turntable-isolator', 'turntable-isolator', 'mic-sm58', 'booth-mon-12', 'booth-mon-12', 'pwr-strip'],
      reasoning: 'Dual direct-drive turntables with Magvel-fader mixer, anti-skip isolation slabs, vocal mic, and high-impact monitors.'
    };
  }

  // Default: Club Standard 2x CDJ-3000 + DJM-900
  return {
    setupName: 'Club Standard 2-Deck Setup',
    devices: ['cdj-3000', 'cdj-3000', 'djm-900', 'booth-mon-12', 'booth-mon-12', 'pwr-strip', 'senn-hd25'],
    reasoning: 'Industry standard 2x Pioneer CDJ-3000 multi-players with DJM-900NXS2 mixer, stereo stage monitors, and Sennheiser HD-25 headphones.'
  };
};

export const getSuggestedSetup = async (prompt: string): Promise<string[]> => {
  // 100% localized, instant execution
  const recommendation = getLocalSetupRecommendation(prompt);
  return recommendation.devices;
};

export const getTechAdvice = async (question: string): Promise<string> => {
  const q = question.toLowerCase();

  if (q.includes('xlr') || q.includes('rca') || q.includes('balanced') || q.includes('cable') || q.includes('snake')) {
    return `### Balanced XLR vs Unbalanced RCA Cables:
• **Balanced XLR (Master & Booth Out)**: Uses two out-of-phase signal conductors plus a grounded shield. When reaching the FOH stage box or active speakers, differential amplifiers cancel out any noise or ground hum picked up along the run. Crucial for any cable run longer than 3 meters.
• **Unbalanced RCA (CDJ to Mixer Inputs)**: Carries one signal line plus ground shield. Prone to RFI/EMI noise over distances greater than 3 meters. Keep them short and away from AC power lines.
• **Rider Recommendation**: Always require balanced male-to-female XLR lines from the DJ mixer Master Out to the house snake and from Booth Out to stage monitors.`;
  }

  if (q.includes('ground') || q.includes('hum') || q.includes('buzz') || q.includes('phono') || q.includes('turntable')) {
    return `### Turntable Grounding & Ground Loop Elimination:
• **Phono Level Sensitivity**: Turntable cartridges output tiny signals (3–5 mV), making them extremely vulnerable to 50/60 Hz mains hum.
• **Ground Wire Attachment**: Connect each turntable's spade ground lug directly to the mixer's knurled GND terminal. Ensure metal-to-metal contact.
• **Ground Loop Isolation**: Never cut or lift the safety earth prong on 3-prong AC plugs. If hum persists, ensure mixer and turntables share the same power distribution strip on an isolated audio circuit.`;
  }

  if (q.includes('monitor') || q.includes('booth') || q.includes('spl') || q.includes('volume') || q.includes('speaker')) {
    return `### Stage Booth Monitoring Best Practices:
• **Speaker Positioning**: Stage booth monitors should be placed on dedicated heavy-duty speaker stands at ear height (approx. 1.2m - 1.4m), angled 45° directly at the DJ's head.
• **Level Control**: The mixer's dedicated Booth Volume knob must control monitoring volume independently of the Master FOH send.
• **SPL Capability**: Monitor speakers must deliver clean, distortion-free audio at 105–118 dB peak SPL to overcome bleed from front-of-house PA line arrays.`;
  }

  if (q.includes('table') || q.includes('height') || q.includes('vibration') || q.includes('stand') || q.includes('riser')) {
    return `### DJ Table & Ergonomics Standards:
• **Height Requirement**: Table surface must sit between 95cm and 100cm (38" to 40") off the floor—roughly waist/elbow height. Standard 74cm (29") office or banquet tables cause severe back fatigue and poor performance.
• **Rigidity**: Absolutely no plastic folding tables or wobbly risers. The table must withstand heavy scratching and aggressive cueing without flex.
• **Vibration Damping**: For vinyl sets, specify heavy 40mm concrete or granite garden pavers placed on top of Sorbothane or foam isolators directly beneath each turntable.`;
  }

  if (q.includes('link') || q.includes('lan') || q.includes('network') || q.includes('ethernet') || q.includes('sync')) {
    return `### Pro DJ Link Networking Guide:
• **Hardware Switch**: Use a dedicated 5-port or 8-port unmanaged Gigabit Ethernet switch (Netgear or Cisco) placed directly in the booth.
• **Cabling**: Shielded Cat5e or Cat6 cables with snagless RJ45 connectors.
• **Configuration**: Connect each CDJ-3000/2000 and the mixer's LINK port to the switch. In the utility menu of each deck, ensure unique Player numbers (Deck 1, 2, 3, 4) are manually assigned to prevent IP collisions.`;
  }

  if (q.includes('power') || q.includes('circuit') || q.includes('outlet') || q.includes('voltage') || q.includes('pdu')) {
    return `### Clean Electrical Audio Power:
• **Isolated Phase**: DJ equipment and monitoring should be powered from a dedicated clean audio circuit isolated from stage dimmers, strobe lights, and laser power supplies.
• **Surge Protection**: Provide a multi-outlet power distribution strip (minimum 6 sockets) directly on top of the DJ table surface to avoid hazardous dangling extension cords.`;
  }

  if (q.includes('firmware') || q.includes('update') || q.includes('crash') || q.includes('usb')) {
    return `### Firmware & Media Compatibility:
• **Firmware Mandate**: Tech riders should mandate that CDJ-3000s and DJM-A9 mixers be updated to the latest official manufacturer firmware before artist arrival.
• **USB Formats**: Best practice is FAT32 or exFAT formatted USB 3.0/3.1 flash drives (e.g. SanDisk Extreme Pro). Avoid NTFS or APFS if performing on older Pioneer hardware.`;
  }

  return `### Stage Manager Tech Checklist:
1. **Audio Path**: Verified Balanced XLR Master Out to FOH Snake and Stereo Booth Out to stage monitors.
2. **Gain Staging**: Keep channel trims peaking at 0 to +3 dB (first yellow LED). Avoid running into red limiters.
3. **Power**: Dedicated isolated circuit with 6 table-level outlets.
4. **Ergonomics**: Solid, vibration-free table at 95–100cm elbow height.
5. **Stage Amenities**: Clean black stage towels, sealed room-temp water, and a directional booth fan.`;
};