export interface StockoutItem {
  id: string;
  name: string;
  productLine: string;
  leadTime: number;
  approxShipDate: string;
  escalationOwner: string;
  topLevel: string[];
}

export interface FutureStockoutItem {
  partNumber: string;
  name: string;
  productLine: string;
  estimatedWeeksOnHand: number;
}

export type View = 'cards' | 'graph' | 'upload' | 'admin' | 'login';

export interface Admin {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}
