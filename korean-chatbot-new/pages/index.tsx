import Head from 'next/head'
import ChatWindow from '../components/ChatWindow'

export default function Home() {
  return (
    <>
      <Head>
        <title>한국어 챗봇</title>
        <meta name="description" content="Korean language practice chatbot" />
      </Head>
      <ChatWindow />
    </>
  )
}