import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const { messages, conversationName } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "No messages to summarize" },
                { status: 400 }
            );
        }

        // Format messages for the prompt
        const formattedMessages = messages
            .map(
                (m: { senderName: string; content: string; date: string }) =>
                    `[${m.date}] ${m.senderName}: ${m.content}`
            )
            .join("\n");

        const prompt = `You are a helpful assistant that summarizes chat conversations. Summarize the following chat conversation from "${conversationName || "a chat"}". 

Rules:
- Provide a clear, concise summary in simple 2 paragraphs
- I want plain text no special characters because the text doesn't format correctly.
- Mention important participants when relevant
- Use a professional but friendly tone
- If the conversation is casual, keep the summary light
- Do not include any preamble, just start with the bullet points

Chat messages (last 30 days):
${formattedMessages}`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        return NextResponse.json({ summary });
    } catch (error) {
        console.error("Summarize API error:", error);
        return NextResponse.json(
            { error: "Failed to generate summary" },
            { status: 500 }
        );
    }
}
