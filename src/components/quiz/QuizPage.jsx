// Updated QuizPage.jsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Trophy, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Confetti from "react-dom-confetti"
import axios from "axios"

// Configurable constants
const NUM_RIASEC_QUESTIONS = 9
const NUM_MCQ_QUESTIONS = 5
const TOTAL_QUESTIONS = NUM_RIASEC_QUESTIONS + NUM_MCQ_QUESTIONS

const API_BASE_URL = "http://127.0.0.1:8080/api/quiz"

/* -------------------------
   Small presentational helpers
   ------------------------- */
const StepDot = ({ active }) => (
  <div className={`w-3 h-3 rounded-full ${active ? "bg-blue-600" : "bg-gray-200"}`} aria-hidden="true" />
)

const ProgressRing = ({ progress }) => {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" aria-hidden="true">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{progress}%</span>
      </div>
    </div>
  )
}

const LikertEmoji = ({ value, selected, onClick }) => {
  const emojis = ["😞", "🙁", "😐", "🙂", "😊"]
  return (
    <motion.button
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(value)}
      aria-pressed={selected}
      aria-label={`Rate ${value}`}
      className={`text-4xl p-3 rounded-full transition-all focus:outline-none focus:ring-2 ${
        selected ? "bg-blue-100 scale-110 shadow-lg" : "hover:bg-gray-100"
      }`}
    >
      {emojis[value - 1]}
    </motion.button>
  )
}

const McqOption = ({ letter, text, selected, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(letter)}
    className={`text-left px-6 py-4 rounded-xl border-2 transition-all font-medium focus:outline-none focus:ring-2 w-full ${
      selected
        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg"
        : "bg-white text-gray-800 hover:bg-gray-50 border-gray-300 hover:border-blue-300"
    }`}
    aria-pressed={selected}
  >
    <span className="font-bold text-lg mr-3">{letter}.</span>
    <span>{text}</span>
  </motion.button>
)

/* -------------------------
   Main QuizPage component
   ------------------------- */
const QuizPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [validationError, setValidationError] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mcqLoaded, setMcqLoaded] = useState(false)

  // Quiz progress & answers
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [points, setPoints] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState("")

  // Chat / mentor states
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your assistant. Ask me about courses, exams, or colleges." },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const focusErrorRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const loadRiasecQuestions = async () => {
      setLoading(true)
      setValidationError("")
      try {
        let tempAsked = { R: [], I: [], A: [], S: [], E: [], C: [] }
        let tempQuestions = []

        for (let i = 0; i < NUM_RIASEC_QUESTIONS; i++) {
          const response = await axios.post(`${API_BASE_URL}/next-question`, { questions_asked: tempAsked })
          if (response.data.success) {
            const { trait, question } = response.data
            const qId = `q${i}`
            tempQuestions.push({
              id: qId,
              section: trait,
              text: question,
              type: "likert",
              icon: getTraitIcon(trait),
              trait,
            })
            tempAsked[trait].push(question)
          } else {
            throw new Error(response.data.message || "Failed to load question")
          }
        }

        setQuestions(tempQuestions)
        setCurrent(0)
      } catch (err) {
        console.error("[v0] Error loading RIASEC questions:", err)
        setValidationError(err.message || "Could not connect to server. Please check your connection.")
      } finally {
        setLoading(false)
      }
    }

    loadRiasecQuestions()
  }, [])

  // Helper to get icon based on RIASEC trait
  const getTraitIcon = (trait) => {
    const icons = {
      R: "🔧", // Realistic
      I: "🔬", // Investigative
      A: "🎨", // Artistic
      S: "👥", // Social
      E: "💼", // Enterprising
      C: "📊", // Conventional
    }
    return icons[trait] || "❓"
  }

  /* -------------------------
     Chat helpers
  ------------------------- */
  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = { from: "user", text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    try {
      const payload = {
        messages: [
          { role: "system", content: "You are a friendly career advisor chatbot." },
          { role: "user", content: input },
        ],
      }

      const res = await axios.post("http://127.0.0.1:8080/api/chat", payload, {
        headers: { "Content-Type": "application/json" },
      })

      const botReply = res.data?.reply || res.data?.content || "Hmm... I couldn't process that. Please try again."

      setMessages((prev) => [...prev, { from: "bot", text: botReply }])
    } catch (err) {
      console.error("Chat API Error:", err)
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I couldn't connect to the server." }])
    } finally {
      setIsTyping(false)
    }
  }

  /* -------------------------
     Quiz helpers
  ------------------------- */
  const answeredCount = Object.keys(answers).length
  const progress = TOTAL_QUESTIONS === 0 ? 0 : Math.round((answeredCount / TOTAL_QUESTIONS) * 100)
  const q = questions[current]

  const validateAnswerValue = (question, value) => {
    if (!question) return false
    if (question.type === "likert") {
      const v = Number(value)
      return Number.isInteger(v) && v >= 1 && v <= 5
    }
    if (question.type === "mcq") {
      return question.options && Object.keys(question.options).includes(value)
    }
    return false
  }

  const setAnswer = (qid, value) => {
    const question = questions.find((qq) => qq.id === qid)
    if (!validateAnswerValue(question, value)) {
      setError("Selected value is invalid for this question.")
      setTimeout(() => focusErrorRef.current?.focus?.(), 0)
      return
    }
    setAnswers((prev) => ({ ...prev, [qid]: value }))
    setPoints((prev) => prev + (prevAnswersHas(qid) ? 0 : 10))
    setError("")
  }

  const prevAnswersHas = (qid) => Object.prototype.hasOwnProperty.call(answers, qid)

  const next = async () => {
    if (!q) {
      setError("Question not found. Can't proceed.")
      return
    }
    if (!answers[q.id]) {
      setError("Please select an option before continuing.")
      focusErrorRef.current?.focus?.()
      return
    }
    setError("")

    if (current === NUM_RIASEC_QUESTIONS - 1 && !mcqLoaded) {
      // Load MCQs after RIASEC phase
      setLoading(true)
      try {
        const riasecHistory = questions.slice(0, NUM_RIASEC_QUESTIONS).map((qq, i) => ({
          trait: qq.trait,
          question: qq.text,
          rating: Number(answers[qq.id]),
        }))

        const response = await axios.post(`${API_BASE_URL}/generate-mcq`, {
          qa_history: riasecHistory,
          num_questions: NUM_MCQ_QUESTIONS,
        })

        if (response.data.success) {
          const mcqs = response.data.questions.map((mq, i) => ({
            id: `mcq${i}`,
            section: "MCQ",
            text: mq.question,
            type: "mcq",
            options: mq.options,
            icon: "❓",
          }))
          setQuestions((prev) => [...prev, ...mcqs])
          setMcqLoaded(true)
          setCurrent(NUM_RIASEC_QUESTIONS)
        } else {
          setError(response.data.message || "Failed to generate follow-up questions.")
        }
      } catch (err) {
        console.error("MCQ Generation Error:", err)
        setError("Failed to generate follow-up questions. Please try again.")
      } finally {
        setLoading(false)
      }
    } else if (current < TOTAL_QUESTIONS - 1) {
      setCurrent((c) => c + 1)
    }
  }

  const prev = () => {
    setError("")
    if (current > 0) setCurrent((c) => c - 1)
  }

  const submit = async () => {
    if (!q) {
      setError("Question not found. Can't submit.")
      return
    }
    if (!answers[q.id]) {
      setError("Please select an option before submitting.")
      focusErrorRef.current?.focus?.()
      return
    }
    setError("")
    setSubmitting(true)
    setShowConfetti(true)

    try {
      // Prepare RIASEC answers (first NUM_RIASEC_QUESTIONS)
      const riasecAnswers = questions.slice(0, NUM_RIASEC_QUESTIONS).map((question) => ({
        trait: question.trait,
        question: question.text,
        rating: Number(answers[question.id]),
      }))

      // Prepare MCQ answers (last NUM_MCQ_QUESTIONS)
      const mcqAnswers = questions.slice(NUM_RIASEC_QUESTIONS).map((question) => ({
        question: question.text,
        answer: answers[question.id],
      }))

      const response = await axios.post(`${API_BASE_URL}/submit`, {
        answers: riasecAnswers,
        mcq_answers: mcqAnswers,
      })

      if (response.data.success) {
        // Store results in sessionStorage to pass to results page
        sessionStorage.setItem("quizResults", JSON.stringify(response.data))

        setTimeout(() => {
          navigate("/quiz/results/demo-attempt")
        }, 1200)
      } else {
        setError("Failed to submit quiz. Please try again.")
        setShowConfetti(false)
      }
    } catch (err) {
      console.error("Submit Error:", err)
      setError("Could not submit quiz. Please check your connection.")
      setShowConfetti(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /* -------------------------
     Render loading state
  ------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your personalized quiz...</p>
        </div>
      </div>
    )
  }

  /* -------------------------
     Render main quiz
  ------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-[2fr_1fr] gap-8">
          <main>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
                <span className="text-sm text-gray-500">
                  Est. {Math.round(TOTAL_QUESTIONS * 2) || 12} mins
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">RIASEC Career Assessment</h1>
              <p className="text-gray-600 mb-4">
                Answer honestly — this helps us suggest the right career paths and educational streams for you.
              </p>

              {/* Progress and Points */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ProgressRing progress={progress} />
                  <div className="flex items-center gap-1">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold text-gray-800">{points} pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap" aria-hidden="true">
                  {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                    const id = idx < NUM_RIASEC_QUESTIONS ? `q${idx}` : `mcq${idx - NUM_RIASEC_QUESTIONS}`
                    return (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <StepDot active={!!answers[id]} />
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Question Card */}
            {!q ? (
              <Card className="mb-6 rounded-xl shadow-md p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Valid Questions</h3>
                <p className="text-gray-600">
                  This quiz currently does not contain valid questions. Try another assessment.
                </p>
              </Card>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.45 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <Card className="mb-6 rounded-xl shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl" aria-hidden="true">
                          {q.icon}
                        </span>
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                          {q.section} ({current + 1}/{TOTAL_QUESTIONS})
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 leading-tight">{q.text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {q.type === "likert" && (
                        <div className="flex gap-4 mt-6 justify-center" role="radiogroup" aria-label="Likert scale">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <LikertEmoji
                              key={val}
                              value={val}
                              selected={answers[q.id] === val}
                              onClick={(v) => setAnswer(q.id, v)}
                            />
                          ))}
                        </div>
                      )}

                      {q.type === "mcq" && q.options && (
                        <div className="flex flex-col gap-4 mt-6" role="radiogroup" aria-label="Multiple choice options">
                          {Object.entries(q.options).map(([letter, text]) => (
                            <McqOption
                              key={letter}
                              letter={letter}
                              text={text}
                              selected={answers[q.id] === letter}
                              onClick={(l) => setAnswer(q.id, l)}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Inline error message */}
            {error && (
              <div
                ref={focusErrorRef}
                tabIndex={-1}
                aria-live="assertive"
                className="text-red-600 text-sm font-medium mt-2"
              >
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  onClick={prev}
                  disabled={current === 0 || loading}
                  className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 rounded-2xl px-8 py-3 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-disabled={current === 0 || loading}
                >
                  Previous
                </Button>
              </motion.div>

              {current === TOTAL_QUESTIONS - 1 ? (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={submit}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 rounded-2xl px-8 py-3 font-bold shadow-lg flex items-center disabled:opacity-60"
                      disabled={!q || !answers[q.id] || submitting || loading}
                      aria-disabled={!q || !answers[q.id] || submitting || loading}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" /> Submit Quiz
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <div className="ml-4">
                    <Confetti
                      active={showConfetti}
                      config={{
                        angle: 90,
                        spread: 90,
                        startVelocity: 40,
                        elementCount: 100,
                        dragFriction: 0.1,
                        duration: 3000,
                        stagger: 3,
                        width: "8px",
                        height: "8px",
                        colors: ["#aabbff", "#99ddff", "#7799ee"],
                      }}
                    />
                  </div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={next}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 rounded-2xl px-8 py-3 font-bold shadow-lg disabled:opacity-60"
                    disabled={!q || !answers[q.id] || loading}
                    aria-disabled={!q || !answers[q.id] || loading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                    Next <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>
              )}
            </div>
          </main>

          {/* AI Mentor */}
          <aside className="hidden md:block sticky top-8 self-start">
            <Card className="rounded-2xl shadow-lg border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-2xl">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span> AI Career Mentor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 overflow-y-auto mb-4 space-y-3">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl text-sm ${
                        msg.from === "bot" ? "bg-gray-100 text-gray-800" : "bg-blue-500 text-white ml-8"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-xl text-sm">
                      <span className="animate-pulse">Typing...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isTyping}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default QuizPage