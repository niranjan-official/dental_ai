const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { SpeechClient } = require("@google-cloud/speech");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const speechClient = new SpeechClient({
    keyFilename: path.join(__dirname, "key.json"),
});

// Helper function to save Base64 audio file
const saveAudioFile = (base64Data) => {
    const filePath = path.join(__dirname, "temp_audio.wav");
    const audioBuffer = Buffer.from(base64Data, "base64");

    if (audioBuffer.length < 1000) {
        throw new Error("Audio file is too small, possibly silent.");
    }

    fs.writeFileSync(filePath, audioBuffer);
    return filePath;
};

app.post("/api/speech-to-text", async (req, res) => {
    try {
        const filePath = "temp_audio.wav";

        if (!fs.existsSync(filePath)) {
            return res.status(400).json({ error: "Audio file not found" });
        }

        console.log(`Processing audio: ${filePath} (Size: ${fs.statSync(filePath).size} bytes)`);
        const audioBuffer = fs.readFileSync(filePath);

        const [response] = await speechClient.recognize({
            config: {
                encoding: "LINEAR16",
                languageCode: "en-US",
                model: "default",
            },
            audio: {
                content: audioBuffer.toString("base64"),
            },
        });

        const transcript = response.results
            ?.map((result) => result.alternatives[0]?.transcript)
            .join(" ") || "No speech detected.";
        
        console.log(transcript);
        return res.json({ transcript });

    } catch (error) {
        console.error("Speech-to-text error:", error);
        return res.status(500).json({ error: error.message });
    }
});



// Serve saved audio file for playback
app.get("/temp_audio.wav", (req, res) => {
    const filePath = path.join(__dirname, "temp_audio.wav");
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Audio file not found" });
    }
});

app.post("/api/analyze-data", async (req, res) => {
    try {
        
        const reportData = req.body;
        // console.log("Data",reportData);
        
        const response = await axios.post("https://792d-117-206-129-167.ngrok-free.app/detect-symptoms", reportData, {
            headers: { "Content-Type": "application/json" },
        });

        return res.json(response.data);
    } catch (error) {
        // console.error("Error analyzing data:", error);
        return res.status(500).json({ error: "Failed to analyze data" });
    }
});

app.post("/api/feedback", async (req, res) => {
    try {
        const { original_text, correct_symptom, correct_treatment } = req.body;

        if (!correct_symptom || !correct_treatment) {
            return res.status(400).json({ error: "Both symptom and treatment are required." });
        }

        // Log feedback (you can replace this with database storage if needed)
        const feedbackEntry = {
            detected_symptoms: original_text,
            correct: false,
            correct_symptom,
            correct_treatment,
        };
        console.log(feedbackEntry);
        

        const response = await axios.post("https://792d-117-206-129-167.ngrok-free.app/feedback", feedbackEntry, {
            headers: { "Content-Type": "application/json" },
        });
        console.log(response);
        

        return res.json({ message: "Feedback submitted successfully!" });
    } catch (error) {
        console.error("Feedback submission error:", error);
        return res.status(500).json({ error: "Failed to submit feedback" });
    }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
