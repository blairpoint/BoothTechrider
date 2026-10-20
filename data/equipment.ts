import { DeviceDefinition, DeviceType } from '../types';

// --- HELPER FACTORIES ---

const createSpeaker = (
    id: string, 
    model: string, 
    manufacturer: string, 
    size: '8' | '10' | '12' | '15' | '18' | 'column', 
    isSub: boolean = false
): DeviceDefinition => {
    let width = 350;
    let height = 600;
    let driverRadius = 0;
    
    if (isSub) {
        switch(size) {
            case '12': width = 400; height = 450; driverRadius = 140; break;
            case '15': width = 500; height = 550; driverRadius = 180; break;
            case '18': width = 600; height = 650; driverRadius = 220; break;
        }
    } else {
        switch(size) {
            case '8': width = 250; height = 400; driverRadius = 80; break;
            case '10': width = 300; height = 500; driverRadius = 100; break;
            case '12': width = 360; height = 600; driverRadius = 130; break;
            case '15': width = 430; height = 700; driverRadius = 160; break;
            case 'column': width = 350; height = 800; driverRadius = 40; break;
        }
    }

    const frontControls: any[] = [];

    if (size === 'column') {
        for(let i=0; i<6; i++) {
            frontControls.push({ 
                id: `driver-${i}`, type: 'driver', 
                x: width/2, y: 100 + (i * 90), 
                radius: 35, variant: 'outline' 
            });
        }
        frontControls.push({ 
            id: 'sub-base', type: 'driver', 
            x: width/2, y: height - 150, 
            radius: 100, variant: 'filled' 
        });
    } else {
        frontControls.push({ 
            id: 'woofer', type: 'driver', 
            x: width/2, y: isSub ? height/2 : height - (width/2) - 20, 
            radius: driverRadius, 
            label: isSub ? `${size}" SUB` : '' 
        });

        if (!isSub) {
             frontControls.push({ 
                id: 'tweeter', type: 'driver', 
                x: width/2, y: height/4, 
                radius: driverRadius * 0.3, 
                variant: 'outline'
            });
        }
    }

    const backControls: any[] = [
        { id: 'ac', type: 'port-power', x: width/2 - 20, y: height - 50, width: 40, height: 30, label: 'AC IN' },
        { id: 'vol', type: 'knob', x: width - 60, y: 100, radius: 15, label: 'GAIN' }
    ];

    if (isSub) {
        backControls.push(
            { id: 'xlr-in-l', type: 'port-xlr', x: 60, y: 100, radius: 15, label: 'IN L' },
            { id: 'xlr-in-r', type: 'port-xlr', x: 110, y: 100, radius: 15, label: 'IN R' },
            { id: 'xlr-out-l', type: 'port-xlr', x: 60, y: 160, radius: 15, label: 'OUT L' },
            { id: 'xlr-out-r', type: 'port-xlr', x: 110, y: 160, radius: 15, label: 'OUT R' }
        );
    } else {
        backControls.push(
            { id: 'xlr-in-1', type: 'port-xlr', x: 60, y: 100, radius: 15, label: 'IN 1' },
            { id: 'xlr-in-2', type: 'port-xlr', x: 60, y: 150, radius: 15, label: 'IN 2' },
            { id: 'xlr-out', type: 'port-xlr', x: 60, y: 200, radius: 15, label: 'THRU' }
        );
    }

    return {
        id, model, manufacturer, type: DeviceType.SPEAKER, width, height, rearHeight: height,
        description: isSub ? `${size}-inch Active Subwoofer.` : `${size}-inch Powered PA Speaker / Monitor.`,
        defaultSubstitution: isSub ? 'Equivalent 18" active subwoofer (QSC KS118 / JBL PRX)' : 'Equivalent 12" powered monitor wedge (QSC K12.2 / Yamaha DXR12)',
        frontControls,
        backControls
    };
};

// --- FLAGSHIP PLAYERS & CDJs ---

const CDJ_3000: DeviceDefinition = {
  id: 'cdj-3000',
  model: 'CDJ-3000',
  manufacturer: 'Pioneer DJ',
  type: DeviceType.PLAYER,
  width: 329,
  height: 453,
  rearHeight: 120,
  description: 'Flagship multi-player with 9-inch high-res touch display and MPU processor.',
  defaultSubstitution: 'Pioneer CDJ-2000NXS2 (Firmware v1.85+)',
  frontControls: [
    { id: 'screen', type: 'screen', x: 20, y: 20, width: 289, height: 150, label: 'TOUCH 9"' },
    { id: 'jog', type: 'jog-wheel', x: 164.5, y: 280, radius: 100, label: 'VINYL MODE' },
    { id: 'play', type: 'button-round', x: 40, y: 400, radius: 25, label: 'PLAY', variant: 'accent' },
    { id: 'cue', type: 'button-round', x: 40, y: 340, radius: 25, label: 'CUE' },
    { id: 'pitch', type: 'fader', x: 290, y: 250, width: 20, height: 150, label: 'TEMPO' },
    { id: 'hotcue-grid', type: 'pad-grid', x: 20, y: 190, width: 200, height: 40, label: 'HOT CUE' },
    { id: 'usb', type: 'port-usb', x: 280, y: 30, width: 20, height: 10, label: 'USB' }
  ],
  backControls: [
    { id: 'pwr', type: 'port-power', x: 20, y: 60, width: 40, height: 30, label: 'AC IN' },
    { id: 'rca', type: 'port-rca', x: 100, y: 60, radius: 5, label: 'AUDIO OUT' },
    { id: 'digital', type: 'port-rca', x: 140, y: 60, radius: 5, label: 'DIGITAL' },
    { id: 'link', type: 'port-usb', x: 200, y: 60, width: 30, height: 30, label: 'LAN LINK' }
  ]
};

const CDJ_2000NXS2: DeviceDefinition = {
  id: 'cdj-2000nxs2',
  model: 'CDJ-2000NXS2',
  manufacturer: 'Pioneer DJ',
  type: DeviceType.PLAYER,
  width: 320,
  height: 414,
  rearHeight: 115,
  description: 'Standard pro club player with 7-inch touch screen and 96kHz/24-bit sound card.',
  defaultSubstitution: 'Pioneer CDJ-3000',
  frontControls: [
    { id: 'screen', type: 'screen', x: 25, y: 20, width: 270, height: 130, label: '7" TOUCH' },
    { id: 'jog', type: 'jog-wheel', x: 160, y: 265, radius: 95, label: 'JOG' },
    { id: 'play', type: 'button-round', x: 40, y: 370, radius: 22, label: 'PLAY', variant: 'accent' },
    { id: 'cue', type: 'button-round', x: 40, y: 320, radius: 22, label: 'CUE' },
    { id: 'pitch', type: 'fader', x: 280, y: 235, width: 18, height: 140, label: 'TEMPO' },
    { id: 'hotcue-grid', type: 'pad-grid', x: 20, y: 175, width: 180, height: 35, label: 'HOT CUES' },
    { id: 'usb', type: 'port-usb', x: 270, y: 30, width: 20, height: 10, label: 'USB' }
  ],
  backControls: [
    { id: 'pwr', type: 'port-power', x: 20, y: 60, width: 40, height: 30, label: 'AC IN' },
    { id: 'rca', type: 'port-rca', x: 100, y: 60, radius: 5, label: 'AUDIO OUT' },
    { id: 'digital', type: 'port-rca', x: 140, y: 60, radius: 5, label: 'DIGITAL' },
    { id: 'link', type: 'port-usb', x: 200, y: 60, width: 30, height: 30, label: 'LINK' }
  ]
};

const TECH_1200: DeviceDefinition = {
  id: 'sl-1200', 
  model: 'SL-1210MK7', 
  manufacturer: 'Technics', 
  type: DeviceType.PLAYER, 
  width: 453, 
  height: 353, 
  rearHeight: 100, 
  description: 'Industry gold-standard direct-drive turntable with high-torque coreless motor.',
  defaultSubstitution: 'Technics SL-1200MK2 / MK5 (Must be calibrated, vibration isolated)',
  frontControls: [
    { id: 'platter', type: 'jog-wheel', x: 226, y: 176, radius: 130, label: 'PLATTER', variant: 'filled' },
    { id: 'start', type: 'button-rect', x: 40, y: 280, width: 40, height: 30, label: 'START' },
    { id: 'pitch', type: 'fader', x: 410, y: 140, width: 15, height: 160, label: 'PITCH' }
  ],
  backControls: [
     { id: 'rca-out', type: 'port-rca', x: 200, y: 50, radius: 5, label: 'PHONO OUT' },
     { id: 'gnd', type: 'port-power', x: 230, y: 50, width: 10, height: 10, label: 'GND' },
     { id: 'ac', type: 'port-power', x: 50, y: 50, width: 40, height: 20, label: 'AC' }
  ]
};

// --- FLAGSHIP MIXERS ---

const DJM_A9: DeviceDefinition = {
  id: 'djm-a9',
  model: 'DJM-A9',
  manufacturer: 'Pioneer DJ',
  type: DeviceType.MIXER,
  width: 407,
  height: 458,
  rearHeight: 130,
  description: '4-channel next-generation club standard mixer with ESS Technology 32-bit converters.',
  defaultSubstitution: 'Pioneer DJM-900NXS2 or Allen & Heath Xone:96',
  frontControls: [
    { id: 'screen', type: 'screen', x: 280, y: 25, width: 100, height: 60, label: 'COLOR FX' },
    { id: 'trim1', type: 'knob', x: 50, y: 40, radius: 10, label: 'CH1' },
    { id: 'fader1', type: 'fader', x: 50, y: 280, width: 16, height: 85, label: 'CH1' },
    { id: 'trim2', type: 'knob', x: 120, y: 40, radius: 10, label: 'CH2' },
    { id: 'fader2', type: 'fader', x: 120, y: 280, width: 16, height: 85, label: 'CH2' },
    { id: 'trim3', type: 'knob', x: 190, y: 40, radius: 10, label: 'CH3' },
    { id: 'fader3', type: 'fader', x: 190, y: 280, width: 16, height: 85, label: 'CH3' },
    { id: 'trim4', type: 'knob', x: 260, y: 40, radius: 10, label: 'CH4' },
    { id: 'fader4', type: 'fader', x: 260, y: 280, width: 16, height: 85, label: 'CH4' },
    { id: 'xfader', type: 'fader', x: 165, y: 400, width: 80, height: 16, label: 'MAGVEL X-FADER', rotation: 90 }
  ],
  backControls: [
    { id: 'xlr-out-l', type: 'port-xlr', x: 45, y: 70, radius: 15, label: 'MASTER L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 85, y: 70, radius: 15, label: 'MASTER R' },
    { id: 'booth-l', type: 'port-xlr', x: 135, y: 70, radius: 12, label: 'BOOTH L' },
    { id: 'booth-r', type: 'port-xlr', x: 170, y: 70, radius: 12, label: 'BOOTH R' },
    { id: 'mic1', type: 'port-xlr', x: 220, y: 70, radius: 12, label: 'MIC 1' },
    { id: 'ac-in', type: 'port-power', x: 350, y: 70, width: 40, height: 30, label: 'MAINS AC' },
    { id: 'rca-in-1', type: 'port-rca', x: 40, y: 30, radius: 5, label: 'CH1' },
    { id: 'rca-in-2', type: 'port-rca', x: 100, y: 30, radius: 5, label: 'CH2' },
    { id: 'rca-in-3', type: 'port-rca', x: 160, y: 30, radius: 5, label: 'CH3' },
    { id: 'rca-in-4', type: 'port-rca', x: 220, y: 30, radius: 5, label: 'CH4' },
  ]
};

const DJM_900: DeviceDefinition = {
  id: 'djm-900',
  model: 'DJM-900NXS2',
  manufacturer: 'Pioneer DJ',
  type: DeviceType.MIXER,
  width: 333,
  height: 414,
  rearHeight: 120,
  description: '4-channel professional mixer with 64-bit mixing processor.',
  defaultSubstitution: 'Pioneer DJM-A9 or DJM-V10',
  frontControls: [
    { id: 'trim1', type: 'knob', x: 45, y: 40, radius: 10, label: 'TRIM' },
    { id: 'fader1', type: 'fader', x: 45, y: 280, width: 15, height: 80, label: 'CH1' },
    { id: 'trim2', type: 'knob', x: 105, y: 40, radius: 10 },
    { id: 'fader2', type: 'fader', x: 105, y: 280, width: 15, height: 80, label: 'CH2' },
    { id: 'trim3', type: 'knob', x: 165, y: 40, radius: 10 },
    { id: 'fader3', type: 'fader', x: 165, y: 280, width: 15, height: 80, label: 'CH3' },
    { id: 'trim4', type: 'knob', x: 225, y: 40, radius: 10 },
    { id: 'fader4', type: 'fader', x: 225, y: 280, width: 15, height: 80, label: 'CH4' },
    { id: 'xfader', type: 'fader', x: 135, y: 380, width: 60, height: 15, label: 'X-FADER', rotation: 90 }
  ],
  backControls: [
    { id: 'xlr-out-l', type: 'port-xlr', x: 40, y: 70, radius: 15, label: 'MASTER L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 80, y: 70, radius: 15, label: 'MASTER R' },
    { id: 'booth-l', type: 'port-xlr', x: 125, y: 70, radius: 12, label: 'BOOTH L' },
    { id: 'booth-r', type: 'port-xlr', x: 155, y: 70, radius: 12, label: 'BOOTH R' },
    { id: 'ac-in', type: 'port-power', x: 280, y: 70, width: 40, height: 30, label: 'AC' },
    { id: 'rca-in-1', type: 'port-rca', x: 40, y: 30, radius: 5, label: 'CH1' },
    { id: 'rca-in-2', type: 'port-rca', x: 100, y: 30, radius: 5, label: 'CH2' },
    { id: 'rca-in-3', type: 'port-rca', x: 160, y: 30, radius: 5, label: 'CH3' },
    { id: 'rca-in-4', type: 'port-rca', x: 220, y: 30, radius: 5, label: 'CH4' },
  ]
};

const XONE_96: DeviceDefinition = {
  id: 'xone-96',
  model: 'Xone:96',
  manufacturer: 'Allen & Heath',
  type: DeviceType.MIXER,
  width: 336,
  height: 410,
  rearHeight: 120,
  description: 'Uncompromising 6+2 channel analog DJ mixer with dual 32-bit soundcards and 4-band EQ.',
  defaultSubstitution: 'Allen & Heath Xone:92 or Pioneer DJM-V10',
  frontControls: [
    { id: 'vcf', type: 'knob', x: 168, y: 30, radius: 16, label: 'DUAL VCF' },
    { id: 'fader1', type: 'fader', x: 50, y: 260, width: 14, height: 90, label: 'CH1' },
    { id: 'fader2', type: 'fader', x: 105, y: 260, width: 14, height: 90, label: 'CH2' },
    { id: 'fader3', type: 'fader', x: 160, y: 260, width: 14, height: 90, label: 'CH3' },
    { id: 'fader4', type: 'fader', x: 215, y: 260, width: 14, height: 90, label: 'CH4' },
    { id: 'xfader', type: 'fader', x: 135, y: 375, width: 65, height: 14, label: 'INNOFADER', rotation: 90 }
  ],
  backControls: [
    { id: 'xlr-out-l', type: 'port-xlr', x: 45, y: 70, radius: 15, label: 'MASTER L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 85, y: 70, radius: 15, label: 'MASTER R' },
    { id: 'booth-l', type: 'port-xlr', x: 130, y: 70, radius: 12, label: 'BOOTH L' },
    { id: 'booth-r', type: 'port-xlr', x: 160, y: 70, radius: 12, label: 'BOOTH R' },
    { id: 'ac-in', type: 'port-power', x: 280, y: 70, width: 40, height: 30, label: 'AC' },
    { id: 'rca-in-1', type: 'port-rca', x: 40, y: 30, radius: 5, label: 'CH1' },
    { id: 'rca-in-2', type: 'port-rca', x: 100, y: 30, radius: 5, label: 'CH2' },
    { id: 'rca-in-3', type: 'port-rca', x: 160, y: 30, radius: 5, label: 'CH3' },
    { id: 'rca-in-4', type: 'port-rca', x: 220, y: 30, radius: 5, label: 'CH4' },
  ]
};

// --- LIVE PERFORMANCE SAMPLER ---

const DJS_1000: DeviceDefinition = {
  id: 'djs-1000',
  model: 'DJS-1000',
  manufacturer: 'Pioneer DJ',
  type: DeviceType.FX,
  width: 320,
  height: 421,
  rearHeight: 110,
  description: 'Standalone DJ performance sampler with 16 step sequencer and velocity-sensitive pads.',
  defaultSubstitution: 'Roland SP-404MKII or Akai MPC Live II',
  frontControls: [
    { id: 'screen', type: 'screen', x: 25, y: 25, width: 270, height: 120, label: '7" DISPLAY' },
    { id: 'pads', type: 'pad-grid', x: 40, y: 170, width: 240, height: 120, label: '16 PADS' },
    { id: 'pitch', type: 'fader', x: 275, y: 310, width: 16, height: 85, label: 'TEMPO' }
  ],
  backControls: [
    { id: 'pwr', type: 'port-power', x: 25, y: 60, width: 40, height: 30, label: 'AC IN' },
    { id: 'rca', type: 'port-rca', x: 110, y: 60, radius: 6, label: 'OUT L/R' },
    { id: 'link', type: 'port-usb', x: 220, y: 60, width: 30, height: 30, label: 'PRO LINK' }
  ]
};

// --- ALL-IN-ONE SYSTEMS ---

const XDJ_XZ: DeviceDefinition = {
  id: 'xdj-xz', 
  model: 'XDJ-XZ', 
  manufacturer: 'Pioneer DJ', 
  type: DeviceType.ALL_IN_ONE, 
  width: 878, 
  height: 466, 
  rearHeight: 140, 
  description: 'Professional 4-channel all-in-one DJ system with full-size CDJ jog wheels.',
  defaultSubstitution: 'Pioneer Opus-Quad or 2x CDJ-3000 + DJM-A9 setup',
  frontControls: [
    { id: 'screen', type: 'screen', x: 439, y: 80, width: 250, height: 100, label: 'TOUCH' },
    { id: 'jog-1', type: 'jog-wheel', x: 180, y: 280, radius: 100, label: 'DECK 1' },
    { id: 'jog-2', type: 'jog-wheel', x: 700, y: 280, radius: 100, label: 'DECK 2' }
  ],
  backControls: [
    { id: 'ac', type: 'port-power', x: 50, y: 80, width: 40, height: 30 },
    { id: 'rca-in-3', type: 'port-rca', x: 300, y: 80, radius: 6, label: 'CH3' },
    { id: 'rca-in-4', type: 'port-rca', x: 350, y: 80, radius: 6, label: 'CH4' },
    { id: 'xlr-out-l', type: 'port-xlr', x: 600, y: 80, radius: 15, label: 'MASTER L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 640, y: 80, radius: 15, label: 'MASTER R' }
  ]
};

const XDJ_RX3: DeviceDefinition = {
  id: 'xdj-rx3', 
  model: 'XDJ-RX3', 
  manufacturer: 'Pioneer DJ', 
  type: DeviceType.ALL_IN_ONE, 
  width: 728, 
  height: 469, 
  rearHeight: 140, 
  description: '2-Channel All-in-One system with high resolution 10.1-inch touch screen.',
  defaultSubstitution: 'Pioneer XDJ-XZ',
  frontControls: [
    { id: 'screen', type: 'screen', x: 364, y: 80, width: 300, height: 120 },
    { id: 'jog-1', type: 'jog-wheel', x: 150, y: 300, radius: 80 }
  ],
  backControls: [
    { id: 'ac', type: 'port-power', x: 40, y: 80, width: 40, height: 30 },
    { id: 'rca-in-1', type: 'port-rca', x: 200, y: 80, radius: 6 },
    { id: 'rca-in-2', type: 'port-rca', x: 240, y: 80, radius: 6 },
    { id: 'xlr-out-l', type: 'port-xlr', x: 400, y: 80, radius: 15, label: 'MASTER L' },
    { id: 'xlr-out-r', type: 'port-xlr', x: 440, y: 80, radius: 15, label: 'MASTER R' }
  ]
};

const TRAKTOR_S4: DeviceDefinition = {
  id: 'traktor-s4', 
  model: 'Kontrol S4 MK3', 
  manufacturer: 'Native Instruments', 
  type: DeviceType.CONTROLLER, 
  width: 542, 
  height: 339, 
  rearHeight: 100, 
  description: '4-Channel DJ Controller with Haptic Drive motorized jog wheels.',
  defaultSubstitution: 'Pioneer DDJ-1000 / FLX10',
  frontControls: [
     { id: 'jog-1', type: 'jog-wheel', x: 130, y: 200, radius: 65 },
     { id: 'jog-2', type: 'jog-wheel', x: 412, y: 200, radius: 65 }
  ],
  backControls: [
    { id: 'usb', type: 'port-usb', x: 40, y: 50, width: 20, height: 10, label: 'USB' },
    { id: 'rca-in-1', type: 'port-rca', x: 150, y: 50, radius: 5 },
    { id: 'xlr-out-l', type: 'port-xlr', x: 350, y: 50, radius: 12 },
    { id: 'xlr-out-r', type: 'port-xlr', x: 380, y: 50, radius: 12 },
    { id: 'ac', type: 'port-power', x: 500, y: 50, width: 30, height: 20 }
  ]
};

const TRAKTOR_M2: DeviceDefinition = {
  id: 'traktor-m2', 
  model: 'Traktor M2', 
  manufacturer: 'Native Instruments', 
  type: DeviceType.CONTROLLER, 
  width: 486, 
  height: 265, 
  rearHeight: 80, 
  description: '2-Channel DJ Controller.',
  frontControls: [
     { id: 'jog-1', type: 'jog-wheel', x: 100, y: 150, radius: 55 },
     { id: 'jog-2', type: 'jog-wheel', x: 386, y: 150, radius: 55 }
  ],
  backControls: [
    { id: 'usb', type: 'port-usb', x: 40, y: 40, width: 20, height: 10, label: 'USB' },
    { id: 'rca-out', type: 'port-rca', x: 250, y: 40, radius: 5, label: 'MAIN OUT' },
    { id: 'ac', type: 'port-power', x: 440, y: 40, width: 30, height: 20 }
  ]
};

// --- STAGE BOOTH MONITORS & PA ---

const BOOTH_MONITOR_12: DeviceDefinition = {
  id: 'booth-mon-12',
  model: 'VM-80 / K12.2 (Booth Monitor)',
  manufacturer: 'Pioneer DJ / QSC',
  type: DeviceType.SPEAKER,
  width: 320,
  height: 380,
  rearHeight: 380,
  description: 'High-power 12-inch active booth monitor wedge with ultra-clear transient response.',
  defaultSubstitution: 'Pair of QSC K12.2 / Yamaha DXR12 / EV ETX-12P on stable heavy-duty stands at ear height',
  frontControls: [
    { id: 'woofer', type: 'driver', x: 160, y: 230, radius: 110, label: '12" WOOFER' },
    { id: 'tweeter', type: 'driver', x: 160, y: 80, radius: 40, variant: 'outline' }
  ],
  backControls: [
    { id: 'ac', type: 'port-power', x: 140, y: 320, width: 40, height: 30, label: 'AC IN' },
    { id: 'xlr-in-1', type: 'port-xlr', x: 80, y: 120, radius: 14, label: 'XLR IN' },
    { id: 'gain', type: 'knob', x: 240, y: 120, radius: 14, label: 'LEVEL' }
  ]
};

// --- STAGE & RIDER ACCESSORIES ---

const DJ_TABLE: DeviceDefinition = {
  id: 'dj-table',
  model: 'Heavy Duty DJ Booth Table',
  manufacturer: 'Stage Rigging',
  type: DeviceType.ACCESSORY,
  width: 900,
  height: 250,
  rearHeight: 80,
  description: 'Solid 2.4m x 0.8m vibration-free performance riser at 95-100cm waist height. No folding legs.',
  frontControls: [
    { id: 'table-top', type: 'button-rect', x: 20, y: 20, width: 860, height: 210, label: 'RIGID STAGE RISER (95-100cm HEIGHT)' }
  ],
  backControls: []
};

const LAPTOP_STAND: DeviceDefinition = {
  id: 'laptop-stand',
  model: 'Pro DJ Laptop Stand',
  manufacturer: 'Crane / Magma',
  type: DeviceType.ACCESSORY,
  width: 260,
  height: 240,
  rearHeight: 60,
  description: 'Heavy duty elevated laptop stand placed next to mixer.',
  frontControls: [
    { id: 'tray', type: 'button-rect', x: 30, y: 30, width: 200, height: 180, label: 'LAPTOP TRAY' }
  ],
  backControls: []
};

const TURNTABLE_ISOLATOR: DeviceDefinition = {
  id: 'turntable-isolator',
  model: 'Acoustic Isolation Base',
  manufacturer: 'Freefloat / Luke',
  type: DeviceType.ACCESSORY,
  width: 460,
  height: 360,
  rearHeight: 40,
  description: 'High-density concrete/sorbothane anti-vibration isolation slab for vinyl feedback protection.',
  frontControls: [
    { id: 'slab', type: 'button-rect', x: 10, y: 10, width: 440, height: 340, label: 'ISOLATION SLAB' }
  ],
  backControls: []
};

const MIC_SM58: DeviceDefinition = {
  id: 'mic-sm58',
  model: 'SM58 Wireless / Wired Mic',
  manufacturer: 'Shure',
  type: DeviceType.ACCESSORY,
  width: 140,
  height: 140,
  rearHeight: 60,
  description: 'Dynamic cardioid vocal microphone on weighted round-base or boom stand.',
  defaultSubstitution: 'Sennheiser e935 or Shure Beta 58A',
  frontControls: [
    { id: 'grille', type: 'driver', x: 70, y: 70, radius: 45, label: 'SM58 MIC' }
  ],
  backControls: [
    { id: 'xlr-out', type: 'port-xlr', x: 70, y: 30, radius: 12, label: 'XLR OUT' }
  ]
};

const HD25: DeviceDefinition = {
    id: 'senn-hd25', 
    model: 'HD-25', 
    manufacturer: 'Sennheiser', 
    type: DeviceType.ACCESSORY,
    width: 180, 
    height: 180, 
    rearHeight: 50,
    description: 'Industry standard DJ monitoring headphones (Artist brings own or venue provides back-up).',
    frontControls: [
        { id: 'cups', type: 'driver', x: 90, y: 90, radius: 70, label: 'PHONES', variant: 'outline' },
        { id: 'band', type: 'button-rect', x: 40, y: 10, width: 100, height: 20, variant: 'filled' }
    ],
    backControls: []
};

const PWR_STRIP: DeviceDefinition = {
    id: 'pwr-strip', 
    model: '6-Way Power Distro (PDU)', 
    manufacturer: 'Clean Audio Power', 
    type: DeviceType.ACCESSORY,
    width: 400, 
    height: 60, 
    rearHeight: 60,
    description: 'Surge-protected isolated audio circuit distribution strip with 6 clean outlets.',
    frontControls: [
        { id: 'switch', type: 'button-rect', x: 30, y: 20, width: 20, height: 20, label: 'I/O', variant: 'accent' },
        { id: 'led', type: 'button-round', x: 60, y: 30, radius: 3, variant: 'filled' }
    ],
    backControls: [
       { id: 'ac-in', type: 'port-power', x: 380, y: 30, width: 40, height: 20, label: 'MAINS' },
       { id: 'ac-1', type: 'port-power', x: 50, y: 30, width: 30, height: 20 },
       { id: 'ac-2', type: 'port-power', x: 100, y: 30, width: 30, height: 20 },
       { id: 'ac-3', type: 'port-power', x: 150, y: 30, width: 30, height: 20 },
       { id: 'ac-4', type: 'port-power', x: 200, y: 30, width: 30, height: 20 },
       { id: 'ac-5', type: 'port-power', x: 250, y: 30, width: 30, height: 20 },
       { id: 'ac-6', type: 'port-power', x: 300, y: 30, width: 30, height: 20 }
    ]
};

const PRO_LINK_SWITCH: DeviceDefinition = {
    id: 'link-switch',
    model: '5-Port Pro DJ Link Gigabit Switch',
    manufacturer: 'Netgear / Pioneer',
    type: DeviceType.ACCESSORY,
    width: 200,
    height: 90,
    rearHeight: 60,
    description: 'Dedicated gigabit Ethernet switch for linking CDJ-3000s and DJM-A9.',
    frontControls: [
        { id: 'leds', type: 'button-rect', x: 20, y: 30, width: 160, height: 30, label: 'LAN STATUS' }
    ],
    backControls: [
        { id: 'pwr', type: 'port-power', x: 25, y: 30, width: 25, height: 20, label: 'DC' },
        { id: 'port1', type: 'port-usb', x: 60, y: 30, width: 20, height: 20, label: 'P1' },
        { id: 'port2', type: 'port-usb', x: 90, y: 30, width: 20, height: 20, label: 'P2' },
        { id: 'port3', type: 'port-usb', x: 120, y: 30, width: 20, height: 20, label: 'P3' },
        { id: 'port4', type: 'port-usb', x: 150, y: 30, width: 20, height: 20, label: 'P4' }
    ]
};

// --- POPULAR PA SPEAKERS (JBL, QSC, EV, Yamaha) ---
const JBL_PRX915 = createSpeaker('jbl-prx915', 'PRX915', 'JBL', '15');
const JBL_PRX818XLF = createSpeaker('jbl-prx818xlf', 'PRX818XLF (Sub)', 'JBL', '18', true);
const QSC_K12_2 = createSpeaker('qsc-k12-2', 'K12.2', 'QSC', '12');
const QSC_KS118 = createSpeaker('qsc-ks118', 'KS118 (Sub)', 'QSC', '18', true);
const EV_EKX15P = createSpeaker('ev-ekx15p', 'EKX-15P', 'Electro-Voice', '15');
const EV_ETX18SP = createSpeaker('ev-etx18sp', 'ETX-18SP (Sub)', 'Electro-Voice', '18', true);
const YAM_DXR12 = createSpeaker('yam-dxr12', 'DXR12mkII', 'Yamaha', '12');
const YAM_DXS18 = createSpeaker('yam-dxs18', 'DXS18 (Sub)', 'Yamaha', '18', true);

export const DEVICES: DeviceDefinition[] = [
    // Flagship Players
    CDJ_3000, 
    CDJ_2000NXS2, 
    TECH_1200, 

    // Mixers
    DJM_A9, 
    DJM_900, 
    XONE_96, 

    // Live / Sampler / FX
    DJS_1000, 

    // All-In-One & Controllers
    XDJ_XZ, 
    XDJ_RX3, 
    TRAKTOR_S4, 
    TRAKTOR_M2,

    // Stage Monitors & PA
    BOOTH_MONITOR_12,
    QSC_K12_2, 
    QSC_KS118, 
    JBL_PRX915, 
    JBL_PRX818XLF,
    EV_EKX15P, 
    EV_ETX18SP,
    YAM_DXR12, 
    YAM_DXS18,

    // Stage Infrastructure & Accessories
    DJ_TABLE,
    MIC_SM58,
    LAPTOP_STAND,
    TURNTABLE_ISOLATOR,
    PWR_STRIP, 
    PRO_LINK_SWITCH,
    HD25
];