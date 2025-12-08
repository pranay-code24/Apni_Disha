// Updated AIMentorFloatingChat.jsx with Mic Input + Improved UI/UX

import { useEffect, useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Minus, Mic, Send, X } from "lucide-react"
import axios from "axios"

const AIMentorFloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your AI mentor — ask me anything about courses, exams, colleges, or careers!" },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const chatEndRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize Speech Recognition (Browser API)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognitionRef.current = recognition
        recognition.lang = "en-IN"
        recognition.interimResults = false

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInput(transcript)
          handleSend(transcript)
        }

        recognition.onend = () => setIsRecording(false)
      }
    }
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) return
    setIsRecording(true)
    recognitionRef.current.start()
  }

  const handleSend = async (forcedText = null) => {
    const text = forcedText || input
    if (!text.trim()) return

    const userMsg = { from: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    try {
      const payload = {
        messages: [
          { role: "system", content: "You are a friendly, smart, factual AI mentor for students from class 9-12. Make your answers clear, mature, and helpful." },
          { role: "user", content: text },
        ],
      }

      const res = await axios.post("http://127.0.0.1:8080/api/chat", payload, {
        headers: { "Content-Type": "application/json" },
      })

      const botReply = res.data?.reply || res.data?.content || "Hmm... I couldn't process that. Try again!"

      setMessages((prev) => [...prev, { from: "bot", text: botReply }])
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: "Oops! I couldn't connect to the server." }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-all z-50"
          whileTap={{ scale: 0.9 }}
        >
          <span className="text-3xl">🤖</span>
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl border-l z-50"
          >
            <Card className="h-full rounded-none border-none flex flex-col">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-md flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-wide">
                  <span className="text-2xl">🤖</span>
                  AI Career Mentor
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>

              <CardContent className="p-4 flex flex-col flex-1 overflow-hidden">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1 custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl text-sm max-w-[85%] leading-relaxed shadow-sm transition-all ${
                        msg.from === "bot"
                          ? "bg-gray-100 text-gray-900 border border-gray-200 self-start"
                          : "bg-blue-600 text-white self-end"
                      }`}
                    >
                      {msg.text}
                    </motion.div>
                  ))}

                  {isTyping && (
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-sm max-w-[85%] border border-gray-200 self-start animate-pulse">
                      Typing...
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Row */}
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    className={`rounded-xl p-2 border w-12 h-12 flex items-center justify-center ${
                      isRecording ? "bg-red-500 text-white" : "bg-white"
                    }`}
                    onClick={startListening}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your question..."
                    className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900 shadow-sm"
                    disabled={isTyping}
                  />

                  <Button
                    onClick={() => handleSend()}
                    disabled={isTyping}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white p-3 h-12 w-12 flex items-center justify-center"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIMentorFloatingChat;