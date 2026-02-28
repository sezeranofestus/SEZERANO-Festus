
export enum AppMode {
  CHAT = 'CHAT',
  SEARCH = 'SEARCH',
  IMAGE = 'IMAGE',
  VISION = 'VISION',
  LIVE = 'LIVE',
  SCORING = 'SCORING',
  LOGO = 'LOGO',
  STUDIO = 'STUDIO',
  PRO_EDITOR = 'PRO_EDITOR'
}

export interface IntelligenceMetrics {
  logic: number;
  speed: number;
  creativity: number;
  accuracy: number;
  empathy: number;
  precision?: number;
  recall?: number;
  f1?: number;
}

export interface SystemConfig {
  instruction: string;
  defaultLanguage: string;
  preferredLanguage?: string;
  globalModel: 'flash' | 'pro';
  responseSpeed: 'turbo' | 'balanced' | 'precision';
  meritPoints: number;
  globalMetrics: IntelligenceMetrics;
  qualityControl: {
    minAccuracy: number;
    hallucinationGuard: boolean;
    deepAnalysis: boolean;
    autoCorrection: boolean;
  };
  featuresEnabled: {
    imageGen: boolean;
    webSearch: boolean;
    vision: boolean;
    scoring: boolean;
    languagePolyglot: boolean;
    proEditor: boolean;
  };
}

export interface EditLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
  type: 'image' | 'adjustment' | 'text' | 'shape';
  data?: string; // base64
  adjustmentParams?: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio';
  imageUrl?: string;
  sources?: Array<{ title: string; uri: string }>;
  timestamp: number;
  rating?: 'up' | 'down';
  scores?: IntelligenceMetrics;
  analyticalTrace?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mode: AppMode;
  createdAt: number;
}
