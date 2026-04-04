"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrainCircuit, Loader2, ArrowRight } from "lucide-react";

export default function CompleteProfile() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    educationLevel: "",
    institution: ""
  });
  
  const [isSaving, setIsSaving] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center relative">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-indigo-400 font-bold animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("http://localhost:8000/api/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: user?.id,
          name: user?.fullName || "ApniDisha Explorer",
          email: user?.primaryEmailAddress?.emailAddress || "no-email",
          phone: formData.phone,
          address: formData.address,
          education_level: formData.educationLevel,
          institution: formData.institution
        })
      });

      if (response.ok) {
        router.push("/onboarding"); 
      } else {
        alert("Oops! Engine has some issue. Database save is failed.");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Backend is not connecting with the server!!");
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[140px] bg-indigo-900/20 transition-colors duration-700"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[140px] bg-cyan-900/20 transition-colors duration-700"></div>
      </div>

      <div className="max-w-xl w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-[2rem] p-8 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10">
        
        <div className="flex justify-center mb-6">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <BrainCircuit className="w-8 h-8" />
            </div>
        </div>

        <h1 className="text-3xl font-black text-white mb-2 text-center">
          Welcome, {user?.firstName || "Explorer"}! 🚀
        </h1>
        <p className="text-slate-400 mb-8 text-center text-sm leading-relaxed">
          We need a few quick details to calibrate the AI Career Engine specifically for your educational background.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number</label>
            <input 
              type="tel" 
              required
              placeholder="+91 98765 43210"
              className="w-full bg-[#141414] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">City / Location</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Nagpur, Maharashtra"
              className="w-full bg-[#141414] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current Level</label>
              <select 
                required
                className="w-full bg-[#141414] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                onChange={(e) => setFormData({...formData, educationLevel: e.target.value})}
              >
                <option value="">Select Level...</option>
                <option value="school_10th">10th Standard</option>
                <option value="school_12th">12th Standard</option>
                <option value="bachelor">Bachelors Degree</option>
                <option value="master">Masters & Above</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">School/College Name</label>
              <input 
                type="text" 
                required
                placeholder="Where do you study?"
                className="w-full bg-[#141414] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                onChange={(e) => setFormData({...formData, institution: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 shadow-indigo-900/50 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start My Adaptive Test"} 
            {!isSaving && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

      </div>
    </main>
  );
}