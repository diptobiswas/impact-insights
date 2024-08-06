// @ts-nocheck

import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
} from 'ai/rsc'
import OpenAI from 'openai'
import { nanoid } from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage, BotMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { retrieveRelevantCaseStudies } from './retrieval'
import CaseStudyDisplay from '@/components/CaseStudyDisplay'

export type { Message };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  const relevantCaseStudies = await retrieveRelevantCaseStudies(content);
  let context = '';

  if (Array.isArray(relevantCaseStudies)) {
    context = relevantCaseStudies.map(study => `${study.title}: ${study.description}`).join('\n\n');
  } else {
    context = "No context cannot answer query"; // This will be the "No context cannot answer query" message
  }

  const spinnerStream = createStreamableUI(<SpinnerMessage />)
  const messageStream = createStreamableUI(null)

  console.log("Context:", context)
  if (!context || context.trim() === '') {
    context = "No relevant case studies or best practices found to answer the question";
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI used to provide answers about case studies and best practices for improving quality of life. 
          Respond to user queries and engage in conversation about case studies and best practices only.
          Your response must be concise.
          Use the following context to inform your responses: ${context}
          if there are no context, refuse to answer the question.
          `
        },
        ...aiState.get().messages.map((message: any) => ({
          role: message.role,
          content: message.content
        }))
      ],
      stream: true
    })

    let fullContent = ''

    for await (const chunk of response) {
      if (chunk.choices[0]?.delta?.content) {
        fullContent += chunk.choices[0].delta.content
        messageStream.update(<BotMessage content={fullContent} />)
      }
    }

    spinnerStream.done(null)

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'assistant',
          content: fullContent
        }
      ]
    })

    messageStream.update(
      <div>
        <BotMessage content={fullContent} />
        <CaseStudyDisplay caseStudies={relevantCaseStudies} />
      </div>
    )

    messageStream.done()

  } catch (error) {
    console.error('Error:', error)
    spinnerStream.error('An error occurred. Please try again.')
    messageStream.error('An error occurred. Please try again.')
  }

  return {
    id: nanoid(),
    display: messageStream.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' ? (
          <BotMessage content={message.content as string} />
        ) : null
    }))
}