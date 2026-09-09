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
  isExportImportOpen: boolean
  setIsExportImportOpen: (open: boolean) => void
  exportImportTab: 'export' | 'import'
  setExportImportTab: (tab: 'export' | 'import') => void
  openEdit: () => void
  openDelete: () => void
  openLeave: () => void
  openShare: () => void
  openExport: () => void
  openImport: () => void
  openExportImport: (tab?: 'export' | 'import') => void
}

export function useBoardDetailDialogs(): BoardDetailDialogs {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLeaveOpen, setIsLeaveOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isExportImportOpen, setIsExportImportOpen] = useState(false)
  const [exportImportTab, setExportImportTab] = useState<'export' | 'import'>('export')

  const openExportImport = (tab?: unknown) => {
    const validTab = tab === 'import' ? 'import' : 'export'
    setExportImportTab(validTab)
    setIsExportImportOpen(true)
  }

  return {
    isEditOpen,
    setIsEditOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isLeaveOpen,
    setIsLeaveOpen,
    isShareOpen,
    setIsShareOpen,
    isExportImportOpen,
    setIsExportImportOpen,
    exportImportTab,
    setExportImportTab,
    isExportOpen: isExportImportOpen && exportImportTab === 'export',
    setIsExportOpen: (open: boolean) => {
      if (open) setExportImportTab('export')
      setIsExportImportOpen(open)
    },
    isImportOpen: isExportImportOpen && exportImportTab === 'import',
    setIsImportOpen: (open: boolean) => {
      if (open) setExportImportTab('import')
      setIsExportImportOpen(open)
    },
    openEdit: () => setIsEditOpen(true),
    openDelete: () => setIsDeleteOpen(true),
    openLeave: () => setIsLeaveOpen(true),
    openShare: () => setIsShareOpen(true),
    openExportImport,
    openExport: () => openExportImport('export'),
    openImport: () => openExportImport('import')
  }
}
