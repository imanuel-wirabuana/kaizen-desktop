import { useState } from 'react'
import { useUser } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useItemsStore } from '@/stores/items'
import { TaskForm, TaskFormValues } from './task-form'

type InlineCreateTaskProps = {
  laneId: number | null
  boardId?: number | string | null
}

export function InlineCreateTask({ laneId, boardId }: InlineCreateTaskProps) {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addItem = useItemsStore((s) => s.addItem)

  const handleSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true)
    try {
      let isoDueDate: string | null = null
      if (values.dueDate) {
        const d = new Date(values.dueDate)
        if (!isNaN(d.getTime())) {
          isoDueDate = d.toISOString()
        }
      }

      const created = await addItem({
        board_id: boardId ? Number(boardId) : undefined,
        lane_id: laneId,
        title: values.title,
        icon: values.icon,
        description: values.description || null,
        priority: values.priority,
        due_date: isoDueDate,
        background: values.background || null,
        owner: user?.id || null
      })

      if (!created) {
        console.error('Failed to create task: addItem returned null')
        return
      }

      setIsOpen(false)
    } catch (err) {
      console.error('Error creating task item:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full justify-start gap-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 h-8 rounded-xl shadow-2xs transition-all cursor-pointer group/btn"
      >
        <div className="flex size-4 items-center justify-center rounded-md bg-muted group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-colors">
          <Plus className="size-3" />
        </div>
        <span>Add Task</span>
      </Button>
    )
  }

  return (
    <TaskForm
      onSubmit={handleSubmit}
      onCancel={() => setIsOpen(false)}
      submitLabel="Add"
      isSubmitting={isSubmitting}
      autoFocus
    />
  )
}
