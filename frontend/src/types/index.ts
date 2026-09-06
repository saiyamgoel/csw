export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

export type ItemCategory = 'RAW_MATERIAL' | 'ACCESSORY' | 'PACKAGING';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Item {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  description: string | null;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  minimumStockLevel: number;
  reorderLevel: number;
  preferredStockLevel: number;
  currentStock: number;
  stockStatus: StockStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemCreateRequest {
  code: string;
  name: string;
  category: ItemCategory;
  description?: string;
  unitId: string;
  minimumStockLevel: number;
  reorderLevel: number;
  preferredStockLevel: number;
}

export interface ItemUpdateRequest {
  name: string;
  description?: string;
  unitId: string;
  minimumStockLevel: number;
  reorderLevel: number;
  preferredStockLevel: number;
  isActive: boolean;
}

export interface ProductType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductTypeCreateRequest {
  code: string;
  name: string;
  description?: string;
}

export interface ProductTypeUpdateRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  totalItems: number;
  rawMaterials: number;
  accessories: number;
  packaging: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalTransactions: number;
  activeProductTypes: number;
}
