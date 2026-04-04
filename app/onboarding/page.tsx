"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, BrainCircuit, Sun, Moon, Sparkles, Activity } from "lucide-react";

export default function Onboarding() {
    const router = useRouter();
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { user } = useUser();

    const [step, setStep] = useState(1);
    const [scores, setScores] = useState({
        Realistic: 0, Investigative: 0, Artistic: 0,
        Social: 0, Enterprising: 0, Conventional: 0
    });
    
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [currentCategory, setCurrentCategory] = useState("");
    const [currentCluster, setCurrentCluster] = useState(""); 
    const [isAiMode, setIsAiMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [clusterPrefs, setClusterPrefs] = useState<Record<string, number>>({});
    const [uiType, setUiType] = useState("stars"); 
    const [sliderValue, setSliderValue] = useState(3);
    const [currentImage, setCurrentImage] = useState(""); 

    const [history, setHistory] = useState<any[]>([]);
    const [future, setFuture] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        fetchNextQuestion(1, scores, 0, "", {}, []);
    }, []);

    const fetchNextQuestion = async (
        nextStep: number, 
        currentScores: any, 
        lastRating: number, 
        cluster: string,
        prefs: Record<string, number>,
        prevQs: string[]
    ) => {
        setLoading(true);
        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: nextStep,
                    scores: currentScores,
                    last_rating: lastRating,
                    current_cluster: cluster,
                    cluster_prefs: prefs,
                    previous_questions: prevQs
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.is_complete) {
                    const userId = user?.id || "guest";
                    
                    let testHistory = JSON.parse(localStorage.getItem(`apnidisha_test_history_${userId}`) || "[]");

                    const newTest = {
                        cluster: data.final_cluster,
                        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                        confidence: data.conf_score || "94.2",
                        attempt: testHistory.length + 1 
                    };
                    
                    testHistory.unshift(newTest); 
                    
                    localStorage.setItem(`apnidisha_test_history_${userId}`, JSON.stringify(testHistory));
                    localStorage.setItem(`apnidisha_final_cluster_${userId}`, data.final_cluster);
                    localStorage.setItem(`apnidisha_recommended_jobs_${userId}`, JSON.stringify(data.recommended_jobs));
                    localStorage.setItem(`apnidisha_confidence_score_${userId}`, newTest.confidence.toString());
                    
                    router.push("/dashboard");
                    return;
                } else {
                    setCurrentQuestion(data.question);
                    setIsAiMode(data.type === "adaptive");
                    setUiType(data.ui_type || "stars"); 
                    setCurrentImage(data.image_url || "");
                    setSliderValue(3);
                    
                    if (data.type === "base") setCurrentCategory(data.category);
                    if (data.type === "adaptive") setCurrentCluster(data.predicted_cluster);
                    setStep(data.step);
                }
            } else {
                alert("Error from backend : " + data.error);
            }
        } catch(error) {
            console.error("Fetch error : ", error);
            alert("Failed to connect to the server.");
        }
        setLoading(false);
    };

    const handleAnswer = (rating: number) => {
        const newPrevQs = history.map(h => h.currentQuestion);
        if (currentQuestion) newPrevQs.push(currentQuestion);

        const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, uiType, currentImage };
        setHistory([...history, currentState]);
        setFuture([]); 

        let newScores = { ...scores };
        let newPrefs = { ...clusterPrefs };
        
        if (!isAiMode && currentCategory) {
            newScores[currentCategory as keyof typeof newScores] += (rating * 2);
        } else if (isAiMode && currentCluster) {
            if (!newPrefs[currentCluster]) newPrefs[currentCluster] = 0;
            
            if (rating === 1) newPrefs[currentCluster] -= 20; 
            else if (rating === 2) newPrefs[currentCluster] -= 10; 
            else if (rating === 4) newPrefs[currentCluster] += 15; 
            else if (rating === 5) newPrefs[currentCluster] += 30; 
            
            setClusterPrefs(newPrefs);
        }

        setScores(newScores);
        fetchNextQuestion(step + 1, newScores, rating, currentCluster, newPrefs, newPrevQs); 
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, uiType, currentImage };
        setFuture([currentState, ...future]);
        setHistory(history.slice(0, -1));
        setStep(previousState.step);
        setScores(previousState.scores);
        setCurrentQuestion(previousState.currentQuestion);
        setCurrentCategory(previousState.currentCategory);
        setCurrentCluster(previousState.currentCluster);
        setIsAiMode(previousState.isAiMode);
        setClusterPrefs(previousState.clusterPrefs);
        setUiType(previousState.uiType);
        setCurrentImage(previousState.currentImage);
    };

    const handleForward = () => {
        if (future.length === 0) return;
        const nextState = future[0];
        const currentState = { step, scores, currentQuestion, currentCategory, currentCluster, isAiMode, clusterPrefs, uiType, currentImage };
        setHistory([...history, currentState]);
        setFuture(future.slice(1));
        setStep(nextState.step);
        setScores(nextState.scores);
        setCurrentQuestion(nextState.currentQuestion);
        setCurrentCategory(nextState.currentCategory);
        setCurrentCluster(nextState.currentCluster);
        setIsAiMode(nextState.isAiMode);
        setClusterPrefs(nextState.clusterPrefs);
        setUiType(nextState.uiType);
        setCurrentImage(nextState.currentImage);
    };

    const renderInputArea = () => {
        if (uiType === "emojis") {
            return (
                <div className="flex justify-between w-full mt-10 md:px-8">
                    {[
                        { val: 1, emoji: "😡", label: "Hate it" },
                        { val: 2, emoji: "😟", label: "Dislike" },
                        { val: 3, emoji: "😐", label: "Neutral" },
                        { val: 4, emoji: "🙂", label: "Like it" },
                        { val: 5, emoji: "🤩", label: "Love it!" }
                    ].map(item => (
                        <button key={item.val} onClick={() => handleAnswer(item.val)} className="flex flex-col items-center gap-3 group outline-none">
                            <span className="text-4xl md:text-5xl transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2 drop-shadow-sm">
                                {item.emoji}
                            </span>
                            <span className={`text-xs font-bold transition-colors ${isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            );
        }

        if (uiType === "mcq") {
            const mcqOptions = [
                { val: 5, text: "🚀 Absolutely! This sounds exactly like me.", lightClass: "hover:border-blue-500 hover:bg-blue-50", darkClass: "hover:border-blue-500 hover:bg-blue-500/10" },
                { val: 4, text: "👍 Yeah, I'd give that a shot.", lightClass: "hover:border-emerald-500 hover:bg-emerald-50", darkClass: "hover:border-emerald-500 hover:bg-emerald-500/10" },
                { val: 2, text: "🤔 Not really my cup of tea.", lightClass: "hover:border-orange-500 hover:bg-orange-50", darkClass: "hover:border-orange-500 hover:bg-orange-500/10" },
                { val: 1, text: "🛑 No way, I would hate doing that.", lightClass: "hover:border-rose-500 hover:bg-rose-50", darkClass: "hover:border-rose-500 hover:bg-rose-500/10" }
            ];

            return (
                <div className="flex flex-col gap-3 mt-8 w-full">
                    {mcqOptions.map((btn) => (
                        <button 
                            key={btn.val} 
                            onClick={() => handleAnswer(btn.val)} 
                            className={`w-full text-left px-6 py-4 rounded-2xl transition-all duration-200 font-semibold border shadow-sm outline-none ${
                                isDark 
                                ? `bg-[#141414] border-[#2A2A2A] text-slate-300 ${btn.darkClass}` 
                                : `bg-white border-slate-200 text-slate-700 ${btn.lightClass}`
                            }`}
                        >
                            {btn.text}
                        </button>
                    ))}
                </div>
            );
        }

        if (uiType === "slider") {
            return (
                <div className="w-full mt-12 flex flex-col items-center px-4">
                    <input 
                        type="range" min="1" max="5" step="1" 
                        value={sliderValue} onChange={(e) => setSliderValue(parseInt(e.target.value))}
                        className={`w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500 outline-none ${isDark ? 'bg-[#2A2A2A]' : 'bg-slate-200'}`}
                    />
                    <div className={`flex justify-between w-full text-xs mt-6 px-1 font-bold tracking-wider transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>STRONGLY DISAGREE</span>
                        <span>NEUTRAL</span>
                        <span>STRONGLY AGREE</span>
                    </div>
                    <button onClick={() => handleAnswer(sliderValue)} className={`mt-10 px-10 py-3.5 rounded-xl font-bold transition-all w-full md:w-auto shadow-lg outline-none ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}>
                        Confirm & Continue
                    </button>
                </div>
            );
        }

        return (
            <div>
                <div className="flex gap-4 justify-center md:justify-between mt-10">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            key={star} 
                            onClick={() => handleAnswer(star)} 
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl text-xl font-black transition-all duration-200 hover:-translate-y-1 border shadow-sm flex items-center justify-center outline-none ${
                                isDark 
                                ? 'bg-[#141414] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border-[#2A2A2A] hover:border-indigo-500' 
                                : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-400 hover:shadow-md'
                            }`}
                        >
                            {star}
                        </button>
                    ))}
                </div>
                <div className={`flex justify-between mt-6 text-xs font-bold tracking-wider px-2 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="uppercase">Strongly Dislike</span>
                    <span className="uppercase">Strongly Like</span>
                </div>
            </div>
        );
    };

    if (!mounted) return null;

    return (
        <div className={`min-h-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#000000]' : 'bg-[#F8FAFC]'}`}>
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[140px] transition-colors duration-700 ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-400/20'}`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[140px] transition-colors duration-700 ${isDark ? 'bg-cyan-900/20' : 'bg-cyan-400/20'}`}></div>
            </div>

            <nav className={`sticky top-0 z-50 backdrop-blur-2xl border-b transition-colors duration-500 ${isDark ? 'border-[#222] bg-[#000000]/80' : 'border-slate-200/80 bg-white/80'}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 cursor-pointer outline-none">
                        <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <span className={`text-xl font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Apni<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">Disha</span>
                        </span>
                    </Link>

                    <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full outline-none transition-colors ${isDark ? 'hover:bg-[#222] text-slate-400 hover:text-yellow-400' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </nav>

            {loading ? (
                <main className="flex-1 flex flex-col items-center justify-center relative z-10">
                    <div className={`w-16 h-16 rounded-full border-4 border-t-indigo-500 animate-spin mb-6 ${isDark ? 'border-[#222]' : 'border-indigo-100'}`}></div>
                    <h1 className={`text-xl md:text-2xl font-bold animate-pulse ${isDark ? 'text-slate-300' : 'text-indigo-600'} text-center px-4`}>
                        {step === 1 ? "Initializing AI Engine..." : "Adapting to your response..."}
                    </h1>
                </main>
            ) : (
                <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
                    
                    <div className="w-full max-w-3xl mb-6 flex justify-between items-center z-10 px-2">
                        <button onClick={handleBack} disabled={history.length === 0} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${history.length === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'bg-[#141414] hover:bg-[#222] text-slate-300 border border-[#2A2A2A]' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'}`}>
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        <button onClick={handleForward} disabled={future.length === 0} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all outline-none ${future.length === 0 ? 'opacity-0 pointer-events-none' : isDark ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm'}`}>
                            Skip Forward <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className={`p-0 rounded-[2rem] max-w-3xl w-full border relative overflow-hidden z-10 transition-all duration-500 ${isDark ? 'bg-[#0A0A0A] border-[#2A2A2A] shadow-[0_0_40px_rgba(0,0,0,0.8)]' : 'bg-white border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)]'}`}>
                        
                        <div className={`absolute top-0 left-0 w-full h-1.5 z-30 transition-colors duration-500 ${isDark ? 'bg-[#222]' : 'bg-slate-100'}`}>
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500 ease-out" style={{ width: `${(step / 20) * 100}%` }}></div>
                        </div>

                        <div className={`relative w-full h-48 md:h-56 overflow-hidden ${isDark ? 'bg-[#111]' : 'bg-slate-100'}`}>
                            {currentImage ? (
                                <Image src={currentImage} alt="Topic Theme" fill className="object-cover opacity-90" priority />
                            ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${isDark ? 'from-slate-900 to-[#0A0A0A]' : 'from-slate-200 to-slate-100'}`}></div>
                            )}
                           
                            <div className={`absolute inset-0 bg-gradient-to-t transition-colors duration-500 ${isDark ? 'from-[#0A0A0A] via-[#0A0A0A]/60' : 'from-white via-white/40'} to-transparent`}></div>
                            
                            <div className="absolute bottom-6 left-6 md:left-10 right-6">
                                <div className="flex justify-between items-end">
                                     <h1 className={`text-3xl md:text-4xl font-black tracking-tight drop-shadow-md transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        Question {step}
                                    </h1>
                                    <div className={`flex flex-col items-end gap-2`}>
                                        <span className={`text-xs font-bold px-4 py-1.5 rounded-full border shadow-sm transition-colors duration-500 ${isDark ? 'bg-[#141414]/90 border-[#333] text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800'}`}>
                                            {step} of 20
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-10 pt-4 md:pt-6">
                            
                            <div className={`mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${isDark ? 'bg-[#141414] border-[#333] text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                {isAiMode ? <Sparkles className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                {isAiMode ? `AI Analyzing: ${currentCluster}` : `Testing: ${currentCategory}`}
                            </div>

                            <h2 className={`text-xl md:text-2xl font-semibold leading-snug min-h-[90px] transition-colors duration-500 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                {currentQuestion}
                            </h2>

                            {renderInputArea()}
                        </div>
                    </div>
                </main>
            )}
        </div>
    );
}