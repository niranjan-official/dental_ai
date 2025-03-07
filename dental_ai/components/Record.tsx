"use client";
import { Mic } from "lucide-react";
import React, { useState, useRef } from "react";
import { Button } from "./ui/button";

const Record = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            await sendAudioToGCP(audioBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToGCP = async (audioBlob: Blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(",")[1];

            try {
                const response = await fetch("http://localhost:5000/api/speech-to-text", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ audioContent: base64Audio }),
                });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const data = await response.json();
                setTranscript(data.transcript || "No transcription available");
            } catch (error) {
                console.error("Error sending audio to GCP:", error);
            }
        };
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <Button
                variant={isRecording ? "destructive" : "secondary"}
                onClick={isRecording ? stopRecording : startRecording}
            >
                <Mic className="mr-2 h-4 w-4" />
                {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
            {transcript && (
                <div className="p-2 border rounded-md w-full max-w-md bg-gray-100">
                    <p className="text-sm font-medium">Transcription:</p>
                    <p className="text-sm text-gray-700">{transcript}</p>
                </div>
            )}
        </div>
    );
};

export default Record;
