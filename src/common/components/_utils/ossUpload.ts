import type { OssVO } from "@@/apis/system/oss/types"
import type { UploadUserFile } from "element-plus"

export type OssId = string | number

export interface OssUploadResponse {
  code?: number
  msg?: string
  data?: {
    ossId?: OssId
    url?: string
  }
}

export interface OssUploadUserFile extends UploadUserFile {
  ossId?: OssId
  response?: OssUploadResponse
}

function createStableUid(id: OssId | undefined, index: number): number {
  const raw = String(id ?? index)
  let hash = 0

  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash) + index
}

export function normalizeOssFiles(data: OssVO[] | OssVO | null | undefined): OssUploadUserFile[] {
  const list = Array.isArray(data) ? data : data ? [data] : []

  return list.map((item, index) => ({
    name: item.originalName,
    url: item.url,
    ossId: item.ossId,
    uid: createStableUid(item.ossId, index)
  }))
}

export function getUploadOssIds(files: OssUploadUserFile[]): string {
  return files
    .map(file => file.ossId ?? file.response?.data?.ossId)
    .filter((id): id is OssId => id !== undefined && id !== null && id !== "")
    .join(",")
}

export function getFileAccept(fileType: string[]): string {
  return fileType.map(type => `.${type}`).join(",")
}

export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".")
  return index >= 0 ? fileName.slice(index + 1).toLowerCase() : ""
}

export function isAllowedExtension(fileName: string, fileType: string[]): boolean {
  const extension = getFileExtension(fileName)
  return fileType.some(type => type.toLowerCase() === extension)
}

export function isAllowedImage(file: File, fileType: string[]): boolean {
  const extensionMatched = isAllowedExtension(file.name, fileType)
  const mimeMatched = fileType.some(type => file.type.toLowerCase().includes(type.toLowerCase()))
  return extensionMatched || mimeMatched
}

export function isFileSizeExceeded(file: File, maxSizeMb: number): boolean {
  return maxSizeMb > 0 && file.size / 1024 / 1024 > maxSizeMb
}
