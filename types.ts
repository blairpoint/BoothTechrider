export enum DeviceType {
  PLAYER = 'PLAYER', // CDJs, Turntables, Media Players
  MIXER = 'MIXER',
  ALL_IN_ONE = 'ALL_IN_ONE',
  FX = 'FX',
  CONTROLLER = 'CONTROLLER',
  SPEAKER = 'SPEAKER', // PA & Booth Monitors
  ACCESSORY = 'ACCESSORY' // Stands, Power, Tables, Mics
}

export interface Point {
  x: number;
  y: number;
}

export interface ControlFeature {
  id: string;
  type: 'knob' | 'fader' | 'button-round' | 'button-rect' | 'jog-wheel' | 'screen' | 'pad-grid' | 'label' | 'port-xlr' | 'port-rca' | 'port-usb' | 'port-power' | 'driver';
  x: number;
  y: number;
  width?: number; // For rects, screens, pads
  height?: number;
  radius?: number; // For knobs, buttons, jog wheels, drivers
  label?: string;
  subLabel?: string;
  rotation?: number; // Visual rotation for knobs
  variant?: 'filled' | 'outline' | 'accent';
}

export interface DeviceDefinition {
  id: string;
  model: string;
  manufacturer: string;
  type: DeviceType;
  width: number; // In mm or relative units
  height: number; // Front/Top view height (Depth)
  rearHeight?: number; // Rear view height (Height of back panel). Defaults to height if undefined.
  frontControls: ControlFeature[];
  backControls: ControlFeature[];
  description: string;
  category?: 'primary' | 'monitoring' | 'peripherals';
  defaultSubstitution?: string;
}

export interface BoothItem {
  instanceId: string;
  deviceId: string;
  x: number;
  y: number;
  view: 'front' | 'back';
}

export interface Cable {
  id: string;
  fromInstanceId: string;
  fromPortId: string;
  toInstanceId?: string; // If undefined, goes to FOH snake/floor
  toPortId?: string;
  type: 'power' | 'audio' | 'data' | 'ground';
  label?: string;
}

export interface ManifestItem {
  name: string;
  quantity: number;
  category: 'device' | 'cable';
  details?: string;
  substitution?: string;
}

export type SoftwareType = 'none' | 'rekordbox' | 'serato' | 'traktor';

export interface SetupAnalysis {
  status: 'empty' | 'incomplete' | 'ready' | 'warning';
  message: string;
  capabilities: string[];
  missing: string[];
}

export interface ContactInfo {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface RiderMetadata {
  artistName: string;
  actType: string;
  tourOrEvent: string;
  date: string;
  revision: string;
  venueOrCity: string;
  productionContact: ContactInfo;
  techContact: ContactInfo;
  tableSpec: string;
  monitoringSpec: string;
  powerSpec: string;
  lightingSpec: string;
  hospitalitySpec: string;
  generalClauses: string[];
  customClauses: string;
  substitutions: Record<string, string>;
  notesForPromoter: string;
}