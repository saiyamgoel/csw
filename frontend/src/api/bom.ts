import { client } from './client'

export interface BomHeader {
  id: string; productVariantId: string; variantCode: string; variantName: string
  currentVersionId: string | null; currentVersionStatus: string | null; currentVersionNumber: number | null
  isActive: boolean; notes: string | null; createdAt: string
}

export interface BomLine {
  id: string; lineNumber: number; itemId: string; itemCode: string; itemName: string
  quantity: number; unitId: string; unitAbbreviation: string; wastePercent: number; notes: string | null
}

export interface BomVersion {
  id: string; bomHeaderId: string; versionNumber: number; status: string
  effectiveFrom: string; effectiveTo: string | null; changeReason: string | null
  createdAt: string; updatedAt: string; lines: BomLine[]
}

export interface BomVersionSummary {
  id: string; versionNumber: number; status: string
  effectiveFrom: string; effectiveTo: string | null; changeReason: string | null
  createdAt: string; lineCount: number
}

export const bomApi = {
  getHeaders: (productVariantId?: string) =>
    client.get<BomHeader[]>('/boms', { params: { productVariantId } }).then(r => r.data),

  getHeader: (id: string) => client.get<BomHeader>(`/boms/${id}`).then(r => r.data),

  createHeader: (req: { productVariantId: string; notes?: string }) =>
    client.post<BomHeader>('/boms', req).then(r => r.data),

  getVersions: (bomId: string) =>
    client.get<BomVersionSummary[]>(`/boms/${bomId}/versions`).then(r => r.data),

  getVersion: (bomId: string, versionId: string) =>
    client.get<BomVersion>(`/boms/${bomId}/versions/${versionId}`).then(r => r.data),

  createVersion: (bomId: string, req: { effectiveFrom: string; changeReason?: string }) =>
    client.post<BomVersion>(`/boms/${bomId}/versions`, req).then(r => r.data),

  activateVersion: (bomId: string, versionId: string, req: { changeReason?: string }) =>
    client.post<BomVersion>(`/boms/${bomId}/versions/${versionId}/activate`, req).then(r => r.data),

  addLine: (bomId: string, versionId: string, req: { itemId: string; quantity: number; unitId: string; wastePercent: number; notes?: string }) =>
    client.post<BomLine>(`/boms/${bomId}/versions/${versionId}/lines`, req).then(r => r.data),

  updateLine: (bomId: string, versionId: string, lineId: string, req: { quantity: number; unitId: string; wastePercent: number; notes?: string }) =>
    client.put<BomLine>(`/boms/${bomId}/versions/${versionId}/lines/${lineId}`, req).then(r => r.data),

  deleteLine: (bomId: string, versionId: string, lineId: string) =>
    client.delete(`/boms/${bomId}/versions/${versionId}/lines/${lineId}`),
}
