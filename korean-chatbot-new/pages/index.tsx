import Head from 'next/head'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'



// Option 2: Dynamic import 

const ChatWindow = dynamic(
  () => import('../components/ChatWindow'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-white">Loading chat...</div>
    </div>
  }
)


export default function Home() {
  return (
    <>
      <Head>
        <title>Kimchi Tutor</title>
        <meta name="description" content="Korean language practice chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="h-screen w-screen overflow-hidden">
        
        
        
        {/* Option 2: With Suspense boundary */}
        {
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-white">Initializing chat...</div>
          </div>
        }>
          <ChatWindow />
        </Suspense>
        }
      </main>
    </>
  )
}