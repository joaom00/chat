import React from 'react'
import { createPortal, flushSync } from 'react-dom'
import { RiStopFill, RiChat3Fill, RiPauseFill, RiPlayFill } from 'react-icons/ri'
import { useTimer } from '../hooks/useTimer'
import { createContext } from '../lib/createContex'
import { formatSecondsIntoMinutesAndSeconds } from '../utils/seconds'
import { ChatInputField } from './ChatInput'
import { CircularProgress } from './CircularProgress'
import { Tooltip } from './Tooltip'
import { usePomodoro, usePomodoroActions } from '../stores'
import { useTasksStore } from '@/stores/tasks'
import { ReaderIcon } from '@radix-ui/react-icons'

const CHAT_NAME = 'Chat'

interface ChatContextValue {
  headerRef?: React.RefObject<HTMLElement>
}

const [ChatProvider, useChatContext] = createContext<ChatContextValue>(CHAT_NAME)

const MIN_WORK_MINUTES = 30
const MIN_BREAK_MINUTES = 5

export const Chat = () => {
  const pomodoro = usePomodoro()
  const { start } = usePomodoroActions()

  const tasksOpen = useTasksStore((state) => state.open)
  const toggleOpen = useTasksStore((state) => state.toggleOpen)

  const [messages, setMessages] = React.useState<string[]>([])
  const [commandValue, setCommandValue] = React.useState('')

  const headerRef = React.useRef<HTMLElement>(null)
  const chatContainer = React.useRef<HTMLDivElement>(null)
  const messagesContainer = React.useRef<HTMLDivElement>(null)

  const onPomodoro = (args: string[]) => {
    const workTime = Math.max(Number(args[0]), MIN_WORK_MINUTES)
    const breakTime = Math.max(Number(args[1]), MIN_BREAK_MINUTES)

    start(
      isNaN(workTime) ? MIN_WORK_MINUTES : workTime,
      isNaN(breakTime) ? MIN_BREAK_MINUTES : breakTime
    )
  }

  return (
    <ChatProvider headerRef={headerRef}>
      <div className="bg-gray-900/70 max-h-[384px] md:max-h-full h-full md:max-w-[340px] w-full backdrop-blur-lg backdrop-saturate-[180%] flex flex-col border-l border-l-gray-700 absolute inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto">
        <header
          ref={headerRef}
          className="border-b border-b-gray-700 w-full grid grid-cols-3 items-center py-4 px-3"
        >
          <p className="text-xl font-bold justify-self-center col-start-2 font-bungee">Chat</p>

          <Tooltip content={tasksOpen ? 'Close tasks list' : 'Open tasks list'}>
            <button
              aria-label={tasksOpen ? 'Close tasks list' : 'Open tasks list'}
              onClick={toggleOpen}
              className="text-gray-400 hover:bg-gray-700/50 w-8 h-8 flex items-center justify-center rounded-md ml-auto hover:text-gray-100 duration-150"
            >
              <ReaderIcon aria-hidden />
            </button>
          </Tooltip>
        </header>

        <div
          ref={messagesContainer}
          className="px-4 pt-3 mb-3 overflow-auto flex-1 basis-auto h-0 messages"
        >
          {pomodoro.started && <ChatPomodoro />}

          {(pomodoro.minimized || !pomodoro.started) && (
            <div className="space-y-3.5" ref={chatContainer}>
              {messages.map((message, i) => (
                <p className="text-sm" key={i} tabIndex={0}>
                  <span className="text-gray-400 font-medium">joaom00</span> {message}
                </p>
              ))}
            </div>
          )}
        </div>

        <ChatInputField
          value={commandValue}
          onValueChange={setCommandValue}
          onSubmit={() => {
            flushSync(() => {
              setMessages((currentMessages) => [...currentMessages, commandValue])
            })
            const lastChild = messagesContainer.current?.lastChild as HTMLElement
            lastChild.scrollIntoView({
              behavior: 'smooth',
              block: 'end',
            })
          }}
          onCommandEnter={(command, args) => {
            switch (command) {
              case '/pomodoro':
                onPomodoro(args)
                break
            }
          }}
        />
      </div>
    </ChatProvider>
  )
}

const CHAT_POMODORO_NAME = 'ChatPomodoro'

const ChatPomodoro = () => {
  const context = useChatContext(CHAT_POMODORO_NAME)

  const pomodoro = usePomodoro()
  const { minimize } = usePomodoroActions()

  const { seconds, setSeconds, totalSeconds } = useTimer({
    timerStarted: pomodoro.started,
  })

  const onShowPomodoro = () => minimize(false)

  return pomodoro.minimized ? (
    createPortal(
      <button className="justify-self-end font-bungee px-2" onClick={onShowPomodoro}>
        {formatSecondsIntoMinutesAndSeconds(seconds)}
      </button>,
      context.headerRef?.current ?? document.body
    )
  ) : (
    <ChatPomodoroImpl seconds={seconds} setSeconds={setSeconds} totalSeconds={totalSeconds}>
      {formatSecondsIntoMinutesAndSeconds(seconds)}
    </ChatPomodoroImpl>
  )
}

interface ChatPomodoroImplProps {
  children?: React.ReactNode
  seconds: number
  setSeconds?: (seconds: number) => void
  totalSeconds: number
}

const ChatPomodoroImpl = ({
  seconds,
  setSeconds,
  totalSeconds,
  children,
}: ChatPomodoroImplProps) => {
  const pomodoro = usePomodoro()
  const pomodoroActions = usePomodoroActions()

  const percentage = Math.max(((totalSeconds - seconds) / totalSeconds) * 100, 1)

  const onPlay = () => pomodoroActions.pause(false)
  const onPause = () => pomodoroActions.pause(true)
  const onStop = () => {
    pomodoroActions.stop()
    setSeconds?.(60 * 30)
  }
  const onShowChat = () => pomodoroActions.minimize()

  return pomodoro.started ? (
    <div className="justify-start items-center gap-8 h-full flex flex-col pt-8">
      <div className="w-[240px] h-[240px]">
        <CircularProgress value={percentage} className="w-full align-middle" strokeWidth={5}>
          <CircularProgress.Trail className="stroke-gray-700" strokeLinecap="round" />

          <CircularProgress.Path
            className="stroke-pink-500"
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease',
            }}
          />
          <CircularProgress.Text
            className="text-sm font-bungee fill-white select-none"
            style={{ dominantBaseline: 'middle', textAnchor: 'middle' }}
          >
            {children}
          </CircularProgress.Text>
        </CircularProgress>
      </div>

      <div className="flex justify-evenly items-center w-full mt-4">
        <Tooltip content="Stop">
          <button
            className="hover:bg-gray-800 text-gray-200 p-2 rounded-lg select-none"
            onClick={onStop}
          >
            <RiStopFill size={24} />
          </button>
        </Tooltip>

        {pomodoro.paused ? (
          <Tooltip content="Play">
            <button
              className="hover:bg-gray-800 text-gray-200 p-2 rounded-lg select-none"
              onClick={onPlay}
            >
              <RiPlayFill size={24} />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Pause">
            <button
              className="hover:bg-gray-800 text-gray-200 p-2 rounded-lg select-none"
              onClick={onPause}
            >
              <RiPauseFill size={24} />
            </button>
          </Tooltip>
        )}

        <Tooltip content="Minimize">
          <button
            className="hover:bg-gray-800 text-gray-200 p-2 rounded-lg text-sm"
            onClick={onShowChat}
          >
            <RiChat3Fill size={24} />
          </button>
        </Tooltip>
      </div>
    </div>
  ) : null
}
