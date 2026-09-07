import { client } from './client'

export interface CharacteristicValue {
  id: string; characteristicTypeId: string; code: string; name: string; sortOrder: number; isActive: boolean
}

export interface CharacteristicType {
  id: string; code: string; name: string; description: string | null
  sortOrder: number; isActive: boolean; values: CharacteristicValue[]
}

export interface CodeMaster {
  id: string; segmentName: string; segmentOrder: number; separator: string; isOptional: boolean; notes: string | null
  characteristicTypeId: string | null; characteristicTypeName: string | null
}

export interface GenerateCodeResponse {
  code: string
  segments: { segmentName: string; characteristicTypeName: string; valueCode: string; valueName: string }[]
}

export const characteristicTypesApi = {
  getAll: (activeOnly = false) =>
    client.get<CharacteristicType[]>('/characteristic-types', { params: { activeOnly } }).then(r => r.data),

  create: (req: { code: string; name: string; description?: string; sortOrder: number }) =>
    client.post<CharacteristicType>('/characteristic-types', req).then(r => r.data),

  update: (id: string, req: { name: string; description?: string; sortOrder: number; isActive: boolean }) =>
    client.put<CharacteristicType>(`/characteristic-types/${id}`, req).then(r => r.data),

  addValue: (typeId: string, req: { code: string; name: string; sortOrder: number }) =>
    client.post<CharacteristicValue>(`/characteristic-types/${typeId}/values`, req).then(r => r.data),

  updateValue: (valueId: string, req: { name: string; sortOrder: number; isActive: boolean }) =>
    client.put<CharacteristicValue>(`/characteristic-types/values/${valueId}`, req).then(r => r.data),
}

export const codeMastersApi = {
  getAll: () => client.get<CodeMaster[]>('/code-masters').then(r => r.data),

  create: (req: { segmentName: string; segmentOrder: number; separator: string; isOptional: boolean; notes?: string; characteristicTypeId?: string }) =>
    client.post<CodeMaster>('/code-masters', req).then(r => r.data),

  update: (id: string, req: { segmentName: string; segmentOrder: number; separator: string; isOptional: boolean; notes?: string; characteristicTypeId?: string }) =>
    client.put<CodeMaster>(`/code-masters/${id}`, req).then(r => r.data),

  generateCode: (selections: Record<string, string>) =>
    client.post<GenerateCodeResponse>('/generate-code', { selections }).then(r => r.data),
}
