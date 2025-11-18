export type Conveyance = 'Personal' | 'Fixture' | 'Negotiable';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  room: string;
  purchasePrice: number;
  currentValue: number;
  description: string;
  dateAdded: string;
  purchaseDate?: string;
  imageUrl?: string;
  // Real Estate / Warranty additions
  conveyance: Conveyance; // Does it stay with the house?
  serialNumber?: string;
  modelNumber?: string;
  // Maintenance & Warranty
  warrantyExpiration?: string;
  maintenanceNotes?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SETTINGS = 'SETTINGS'
}

export interface GeminiAnalysisResult {
  name: string;
  category: string;
  room: string;
  estimatedValue: number;
  description: string;
  conveyance: Conveyance;
  serialNumber?: string;
  modelNumber?: string;
}

export const CATEGORIES = [
  'Major Appliances', 
  'HVAC & Systems', 
  'Plumbing/Fixtures', 
  'Electronics',
  'Furniture',
  'Kitchen',
  'Tools',
  'Art/Decor',
  'Flooring/Paint', 
  'Other'
];

export const ROOMS = [
  'Living Room',
  'Kitchen',
  'Master Bedroom',
  'Bedroom 2',
  'Bathroom',
  'Garage',
  'Office',
  'Dining Room',
  'Basement',
  'Outdoor',
  'Utility Room' 
];
