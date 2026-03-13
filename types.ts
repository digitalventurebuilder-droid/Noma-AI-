
export enum AppState {
  AUTH = 'AUTH',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  PEST_SCAN = 'PEST_SCAN',
  INPUT_SCAN = 'INPUT_SCAN',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  PEST_RESULT = 'PEST_RESULT',
  CHAT = 'CHAT',
  LIVE_TALK = 'LIVE_TALK',
  NUTRIENT_FLOW = 'NUTRIENT_FLOW',
  CALCULATOR = 'CALCULATOR',
  FARM_MAPPER = 'FARM_MAPPER',
  ERROR = 'ERROR'
}

export enum SupportedLanguage {
  ENGLISH = 'English',
  HAUSA = 'Hausa',
  YORUBA = 'Yoruba',
  IGBO = 'Igbo',
  SWAHILI = 'Swahili',
  ARABIC = 'Arabic',
  FRENCH = 'French'
}

export interface UserProfile {
  fullName: string;
  location: string;
  primaryCrop: string;
  isGuest?: boolean;
}

// New Management Types
export interface FarmFolder {
  id: string;
  name: string;
  createdAt: any;
}

export interface FarmFile {
  id: string;
  name: string;
  folderId?: string;
  size: string;
  createdAt: any;
}

export interface FarmNote {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  createdAt: any;
}

export interface DiagnosisResult {
  crop: string;
  status: 'Healthy' | 'Infected' | 'Unknown';
  diagnosis: string;
  severity: 'Low' | 'Medium' | 'High' | 'None';
  description: string;
  advice: {
    organic: string[];
    chemical: string[];
    prevention: string[];
  };
}

export interface PestIdentificationResult {
  pestName: string;
  type: string;
  threatLevel: 'Low' | 'Medium' | 'High';
  description: string;
  localRemedies: string[];
  preventiveMeasures: string[];
}

export interface FarmMappingResult {
  locationDescription: string;
  areaEstimate: string;
  landSuitability: string;
  links: { title: string; uri: string }[];
}

export interface NutrientOption {
  type: 'A' | 'B' | 'C';
  title: string;
  description: string;
  materials: string[];
  instructions: string[];
  duration: string;
}

export interface NutrientAnalysisResult {
  crop: string;
  deficiency: 'Nitrogen' | 'Phosphorus' | 'Potassium' | 'None' | 'Unknown';
  visualSymptoms: string;
  explanation: string;
  options: {
    A: NutrientOption;
    B: NutrientOption;
    C: NutrientOption;
  };
}

export interface InputAnalysisResult {
  productName: string;
  isLikelyAuthentic: boolean;
  safetyWarning: string;
  dosage: string;
  usage: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface MarketPrice {
  crop: string;
  price: string;
  trend: 'up' | 'down' | 'stable';
  location: string;
}

export interface MarketDataResponse {
  prices: MarketPrice[];
  sources: { title: string; uri: string }[];
}

export interface WeatherData {
  temp: string;
  condition: string;
  locationName: string;
  humidity: string;
  forecast: string;
  sources: { title: string; uri: string }[];
}
