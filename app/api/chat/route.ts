import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const pythonResponse = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await pythonResponse.json();
        return NextResponse.json(data, { status: 200 });
    } catch(error) {
        console.log("Chat Microservice Error : ", error);
        return NextResponse.json({ success: false, error: "Failed to connect to AI Coach." }, { status: 500 });
    }
}