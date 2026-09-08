import { useState } from 'react'

export interface BoardDetailDialogs {
  isEditOpen: boolean
  setIsEditOpen: (open: boolean) => void
  isDeleteOpen: boolean
  setIsDeleteOpen: (open: boolean) => void
  isLeaveOpen: boolean
  setIsLeaveOpen: (open: boolean) => void
  isShareOpen: boolean
  setIsShareOpen: (open: boolean) => void
  isExportOpen: boolean
  setIsExportOpen: (open: boolean) => void
  isImportOpen: boolean
  setIsImportOpen: (open: boolean) => void
  openEdit: () => void
  openDelete: () => void
  openLeave: () => void
  openShare: () => void
  openExport: () => void
  openImport: () => void
}

export function useBoardDetailDialogs(): BoardDetailDialogs {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLeaveOpen, setIsLeaveOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  return {
    isEditOpen,
    setIsEditOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isLeaveOpen,
    setIsLeaveOpen,
    isShareOpen,
    setIsShareOpen,
    isExportOpen,
    setIsExportOpen,
    isImportOpen,
    setIsImportOpen,
    openEdit: () => setIsEditOpen(true),
    openDelete: () => setIsDeleteOpen(true),
    openLeave: () => setIsLeaveOpen(true),
    openShare: () => setIsShareOpen(true),
    openExport: () => setIsExportOpen(true),
    openImport: () => setIsImportOpen(true)
  }
}
