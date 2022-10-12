import React from 'react'
import { flushSync } from 'react-dom'
import { Command as CmdkCommand } from 'cmdk'
import Textarea from 'react-textarea-autosize'

import * as Command from './Command'
import { useLazyRef } from '../hooks/useLazyRef'
import { DoublyLinkedList } from '../lib/DoublyLinkedList'

interface ChatInputFieldProps {
  value: string
  onValueChange: (value: string) => void
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  onCommandEnter?: (command: string, args: string[]) => void
}

const getStartEnd = (value: string, subString: string) => [
  value.indexOf(subString),
  value.indexOf(subString) + subString.length,
]

export const ChatInputField = ({
  value,
  onValueChange,
  onSubmit: onSubmitProp,
  onCommandEnter,
}: ChatInputFieldProps) => {
  const [open, setOpen] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [currentArg, setCurrentArg] = React.useState(0)
  const shouldListeningCommand = React.useRef(true)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const dll = useLazyRef(() => new DoublyLinkedList<string>())

  const onCommandSelect = (value: string) => {
    const start = value.indexOf('[')
    const end = value.indexOf(']') + 1
    const hasArgs = !!start && !!end
    flushSync(() => {
      onValueChange(hasArgs ? value : '')
      setOpen(false)
    })
    shouldListeningCommand.current = hasArgs ? false : true
    if (hasArgs) {
      ref.current?.focus()
      ref.current?.setSelectionRange(start, end)
    }
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!value.trim()) return

    dll.current.append(value)
    onValueChange('')
    setCurrentIndex((currentIndex) => currentIndex + 1)
    shouldListeningCommand.current = true

    const isCommand = value.startsWith('/')
    if (isCommand) {
      const [command, ...args] = value.split(' ')
      onCommandEnter?.(command, args)
      return
    }

    onSubmitProp?.(event)
  }

  const onInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value
    if (value === '') {
      shouldListeningCommand.current = true
      setOpen(false)
      setCurrentIndex(dll.current.length)
      setCurrentArg(0)
    }
    const isCommand = value.startsWith('/')
    if (shouldListeningCommand.current && isCommand) setOpen(true)
    onValueChange(value)
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isArrowUpKey = event.key === 'ArrowUp'
    const isArrowDownKey = event.key === 'ArrowDown'
    const isTabKey = event.key === 'Tab'
    const isEnterKey = event.key === 'Enter'
    const isModifierKey = event.ctrlKey && event.altKey && event.metaKey

    if (isArrowUpKey) {
      if (open) return
      const node = dll.current.getAt(currentIndex - 1)
      setCurrentIndex((currentIndex) => Math.max(currentIndex - 1, 0))
      if (!node) return
      onValueChange(node.value)
    }

    if (isArrowDownKey) {
      if (open) return
      const node = dll.current.getAt(currentIndex + 1)
      setCurrentIndex((currentIndex) => Math.min(currentIndex + 1, dll.current.length - 1))
      if (!node) return
      onValueChange(node.value)
    }

    if (isTabKey && !shouldListeningCommand.current) {
      event.preventDefault()

      if (event.shiftKey) {
        // Go to previous arg
        const previousArg = currentArg - 1
        if (previousArg < 0) return
        const [, ...args] = value.split(' ')
        const [start, end] = getStartEnd(value, args[previousArg])
        const hasArgs = !!start && !!end
        if (hasArgs) {
          setCurrentArg(previousArg)
          event.currentTarget.setSelectionRange(start, end)
        }
        return
      }

      const nextArg = currentArg + 1
      const [, ...args] = value.split(' ')
      if (nextArg >= args.length) return
      const [start, end] = getStartEnd(value, args[nextArg])
      const hasArgs = Boolean(start) && Boolean(end)
      if (hasArgs) {
        setCurrentArg(nextArg)
        event.currentTarget.setSelectionRange(start, end)
      }
    }

    if (isEnterKey && !isModifierKey && !open) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="px-2">
      <Command.Root onSelect={onCommandSelect} open={open}>
        <CmdkCommand.Input className="hidden" value={value} onValueChange={onValueChange} />

        <Textarea
          ref={ref}
          name="message"
          minRows={1}
          maxRows={5}
          placeholder="Send a message"
          className="w-full px-4 py-3 text-xs font-medium bg-gray-700 outline-none placeholder-gray-400 resize-none rounded-md border border-transparent focus:bg-gray-900 focus:border-pink-600"
          value={value}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
        />
      </Command.Root>
    </form>
  )
}
