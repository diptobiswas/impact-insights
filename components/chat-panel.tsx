import * as React from 'react'
import { useState, useEffect } from 'react'
import { shareChat } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconShare } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import { nanoid } from 'nanoid'
import { UserMessage, SpinnerMessage } from './stocks/message'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Add this type definition at the top of the file
type ExampleMessage = {
  message: string;
};

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ChatPanel({
  id,
  title,
  input,
  setInput,
  isAtBottom,
  scrollToBottom
}: ChatPanelProps) {
  const [aiState, setAIState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [exampleMessages, setExampleMessages] = useState<ExampleMessage[]>([])
  const [showExamples, setShowExamples] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    fetch('/questions.json')
      .then(response => response.json())
      .then(data => {
        setExampleMessages(data)
      })
      .catch(error => {
        console.error('Error fetching example messages:', error)
      })
  }, [])

  const handleExampleClick = async (message: string) => {
    setShowExamples(false)
    setIsSubmitting(true)
    setIsSearching(true)

    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        content: message,
        role: "user",
        display: <UserMessage>{message}</UserMessage>,
        relevantCaseStudies: []
      }
    ])

    try {
      const responseMessage = await submitUserMessage(message)
      setMessages(currentMessages => [...currentMessages, responseMessage])
    } catch {
      toast(
        <div className="text-red-600">
          You have reached your message limit!
          Please try again later.
        </div>
      )
    } finally {
      setIsSubmitting(false)
      setIsSearching(false)
    }
  }

  const handleSubmit = async (value: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setIsSearching(true)
    setShowExamples(false)
    
    try {
      // Optimistically add user message UI
      setMessages(currentMessages => [
        ...currentMessages,
        {
          id: nanoid(),
          content: value,
          role: "user",
          display: <UserMessage>{value}</UserMessage>,
          relevantCaseStudies: []
        }
      ])

      // Submit and get response message
      const responseMessage = await submitUserMessage(value)
      setMessages(currentMessages => [...currentMessages, responseMessage])
    } catch (error) {
      console.error('Error submitting message:', error)
      toast(
        <div className="text-red-600">
          An error occurred. Please try again later.
        </div>
      )
    } finally {
      setIsSubmitting(false)
      setIsSearching(false)
    }
  }
  
  //Infinite scroll example questions
  const renderColumn = (startIndex: number) => (
    <div className={cn(
      "flex-1 overflow-hidden relative",
      `h-[calc(100vh-550px)] sm:h-[calc(100vh-600px)]`,
      startIndex === 2 ? "hidden sm:block" : ""  // Hide the third column on mobile
    )}>
      <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
      <div className="overflow-y-auto h-full">
        <div className={`scroll-content space-y-4 animate-scroll-${startIndex}`}>
          {exampleMessages.slice(startIndex).map((example, index) => (
            <ExampleItem key={index} example={example} onClick={() => handleExampleClick(example.message)} />
          ))}
          {exampleMessages.slice(startIndex).map((example, index) => (
            <ExampleItem key={`duplicate-${index}`} example={example} onClick={() => handleExampleClick(example.message)} />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-x-0 bg-white/90 bottom-0 w-full duration-300 ease-in-out peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px] dark:from-10%">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4 px-0">
        {showExamples && messages.length === 0 && (
          <div className="mb-4 px-0 sm:px-0 flex space-x-4">
            {renderColumn(0)}
            {renderColumn(1)}
            {renderColumn(2)}
          </div>
        )}
        {messages?.length >= 2 ? (
          <div className="flex h-fit items-center justify-center">
            <div className="flex space-x-2">
              {id && title ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <IconShare className="mr-2" />
                    Share
                  </Button>
                  <ChatShareDialog
                    open={shareDialogOpen}
                    onOpenChange={setShareDialogOpen}
                    onCopy={() => setShareDialogOpen(false)}
                    shareChat={shareChat}
                    chat={{
                      id,
                      title,
                      messages: aiState.messages
                    }}
                  />
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:pb-4">
          {isSearching && (
            <div className="flex items-center justify-center space-x-2">
              <SpinnerMessage />
              <span className="text-zinc-500">Searching case studies...</span>
            </div>
          )}
          <PromptForm input={input} setInput={setInput} onSubmit={handleSubmit} />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}

function ExampleItem({ example, onClick }: { example: ExampleMessage; onClick: () => void }) {
  return (
    <div
      className={cn(
        'cursor-pointer bg-zinc-50 text-zinc-950 rounded-2xl p-4 sm:p-6 hover:bg-zinc-100 transition-colors'
      )}
      onClick={onClick}
    >
      <div className="font-medium break-words">{example.message}</div>
    </div>
  )
}

export default ChatPanel;