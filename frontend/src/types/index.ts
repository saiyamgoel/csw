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
  todayReceipts: number;
  todayConsumptions: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierCreateRequest {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface SupplierUpdateRequest {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive: boolean;
}

export type TransactionType =
  | 'Opening Balance'
  | 'Receipt'
  | 'Consumption'
  | 'Positive Adjustment'
  | 'Negative Adjustment';

export interface InventoryBalance {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  unitName: string;
  unitAbbreviation: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  stockStatus: StockStatus;
  minimumStockLevel: number;
  reorderLevel: number;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  transactionType: string;
  quantity: number;
  sign: number;
  reference: string | null;
  notes: string | null;
  transactionDate: string;
  postedAt: string;
  postedByName: string;
  isVoided: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}
