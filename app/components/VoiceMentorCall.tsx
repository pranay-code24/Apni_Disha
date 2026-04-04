"use client";

import { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { PhoneOff, Loader2, PhoneCall } from "lucide-react";

const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
const vapi = new Vapi(vapiPublicKey); 

export default function VoiceMentorCall() {
    const [isCalling, setIsCalling] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        vapi.on("call-start", () => {
            setIsConnecting(false);
            setIsCalling(true);
        });

        vapi.on("call-end", () => {
            setIsCalling(false);
            setIsConnecting(false);
        });

        vapi.on("error", (e) => {
            console.error("Vapi Error:", e);
            setIsConnecting(false);
            setIsCalling(false);
        });

        return () => {
            vapi.removeAllListeners();
        };
    }, []);

    const toggleCall = async () => {
        if (isCalling) {
            vapi.stop();
        } else {
            setIsConnecting(true);
            const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "";
            
            if (!assistantId || !vapiPublicKey) {
                console.error("Missing VAPI keys");
                setIsConnecting(false);
                return;
            }
            try {
                await vapi.start(assistantId);
            } catch (error) {
                console.error("Failed to start call", error);
                setIsConnecting(false);
            }
        }
    };

    return (
        <button 
            onClick={toggleCall}
            disabled={isConnecting}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isCalling 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
        >
            {isConnecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : isCalling ? (
                <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span> End Call</>
            ) : (
                <><PhoneCall className="w-4 h-4" /> Call AI Mentor</>
            )}
        </button>
    );
}