import React from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { CopyIcon, PlusIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { motion } from 'framer-motion'
import { useTodo } from './Todo'

interface MenuProps {
  children: React.ReactNode
}

export const Menu = React.forwardRef<HTMLDivElement, MenuProps>(({ children }, forwardedRef) => {
  const value = useTodo((state) => state.value)
  const setEdit = useTodo((state) => state.setEdit)
  const setMenu = useTodo((state) => state.setMenu)

  const onCopy = () => {
    window.navigator.clipboard.writeText(value)
  }

  const onEdit = () => {
    setEdit(true)
  }

  return (
    <ContextMenu.Root onOpenChange={setMenu}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="min-w-[300px] w-full rounded-lg bg-gray-850 py-1 text-sm shadow-lg shadow-black/50 border border-gray-700"
          ref={forwardedRef}
        >
          <MenuItem onSelect={onCopy}>
            <CopyIcon />
            Copy task
            <RightSLot>Ctrl+C</RightSLot>
          </MenuItem>

          <ContextMenu.Separator className="h-[1px] bg-gray-700 my-1" />

          <MenuItem>
            <PlusIcon />
            Insert task below
            <RightSLot>Alt+Enter</RightSLot>
          </MenuItem>

          <MenuItem>
            <CopyIcon />
            Duplicate task
            <RightSLot>Ctrl+Shift+V</RightSLot>
          </MenuItem>

          <MenuItem onSelect={onEdit}>
            <Pencil1Icon />
            Edit task
            <RightSLot>Enter</RightSLot>
          </MenuItem>

          <ContextMenu.Separator className="h-[1px] bg-gray-600 my-1" />

          <MenuItem>
            <TrashIcon />
            Delete
          </MenuItem>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
})
Menu.displayName = 'MenuTodo'

interface MenuItemProps {
  children?: React.ReactNode
  onSelect?: (event: Event) => void
}

const MotionContextMenuItem = motion(ContextMenu.Item)
const MenuItem = ({ children, onSelect }: MenuItemProps) => {
  const [hovering, setHovering] = React.useState(false)

  return (
    <MotionContextMenuItem
      onSelect={onSelect}
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
      animate={hovering ? 'hovering' : 'unhovering'}
      variants={{
        hovering: {
          backgroundColor: 'rgb(51 51 56)',
          transition: { duration: 0 },
        },
        unhovering: {
          backgroundColor: 'rgb(51 51 56 / 0)',
          transition: { duration: 0.18 },
        },
      }}
      className="flex items-center gap-2 px-3 cursor-pointer h-[30px] text-gray-200 todo-menu-item"
    >
      {children}
    </MotionContextMenuItem>
  )
}

const RightSLot = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="ml-auto text-[11px] leading-none text-gray-400 border border-gray-700 rounded-[4px] p-0.5">
      {children}
    </div>
  )
}
