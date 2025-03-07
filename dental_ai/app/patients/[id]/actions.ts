"use server"
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import * as fs from "fs/promises";

type UploadResult = {
  filePath: string;
  analysisText: string;
};

interface MedicalReport {
  summary: string[];
  date: string;
}

interface XrayAnalysis {
  detected_diseases: string[];
  date: string;
}

interface AnalysisReport {
  patient?: { id: string; date: string };
  medical_reports: MedicalReport[];
  xray_analyses: XrayAnalysis[];
  disclaimer?: string;
}

async function ensureDirectoryExists(directory: string) {
  try {
    await mkdir(directory, { recursive: true });
  } catch (error) {
    console.error("Error creating directory:", error);
    throw new Error("Failed to create directory for file storage");
  }
}

async function saveFileToDisk(
  file: File,
  patientId: string,
  type: "medical-reports" | "xrays"
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "uploads", patientId, type);
  await ensureDirectoryExists(uploadDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${timestamp}-${file.name}`;
  const filePath = path.join(uploadDir, filename);

  await writeFile(filePath, new Uint8Array(buffer));
  return filePath;
}

async function analyzeMedicalReport(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileBlob = new Blob([fileBuffer], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", fileBlob, "report.pdf");

    const response = await fetch(
      "https://b950-117-206-129-167.ngrok-free.app/extract_text",
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    return data.extracted_text;
  } catch (error) {
    console.error("Error analyzing medical report:", error);
    throw new Error("Failed to analyze medical report");
  }
}

async function analyzeXRay(filePath: string): Promise<string[]> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileBlob = new Blob([fileBuffer], { type: "image/png" });
    const formData = new FormData();
    formData.append("file", fileBlob, "xray.png");

    const response = await fetch(
      "https://fb35-117-206-129-167.ngrok-free.app/detect",
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = await response.json();
    return data.detected_diseases;
  } catch (error) {
    console.error("Error analyzing X-Ray:", error);
    throw new Error("Failed to analyze X-Ray");
  }
}

async function saveAnalysisJson(
  patientId: string,
  medicalText: string,
  xrayDiseases: string[]
): Promise<void> {
  try {
    const analysisDir = path.join(process.cwd(), "uploads", patientId);
    await ensureDirectoryExists(analysisDir);
    const analysisFilePath = path.join(analysisDir, "report.json");

    let existingData: AnalysisReport = { medical_reports: [], xray_analyses: [] };

    try {
      const fileData = await fs.readFile(analysisFilePath, "utf-8");
      existingData = JSON.parse(fileData) as AnalysisReport;
    } catch (error) {
      console.warn("No existing report found, creating new one.");
    }

    if (!existingData.medical_reports) {
      existingData.medical_reports = [];
    }
    if (!existingData.xray_analyses) {
      existingData.xray_analyses = [];
    }

    if (medicalText) {
      existingData.medical_reports.push({
        summary: medicalText.split("\n").filter(Boolean),
        date: new Date().toISOString(),
      });
    }

    if (xrayDiseases.length > 0) {
      existingData.xray_analyses.push({
        detected_diseases: xrayDiseases,
        date: new Date().toISOString(),
      });
    }

    const report: AnalysisReport = {
      patient: { id: patientId, date: new Date().toISOString() },
      medical_reports: existingData.medical_reports,
      xray_analyses: existingData.xray_analyses,
      disclaimer:
        "This report is generated for informational purposes only. Consult a licensed dentist for a comprehensive diagnosis and treatment plan.",
    };

    await fs.writeFile(analysisFilePath, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("Error saving JSON analysis:", error);
    throw new Error("Failed to save JSON analysis");
  }
}

export async function uploadMedicalReport(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as File;
  const patientId = formData.get("patientId") as string;
  if (!file || !patientId) throw new Error("Missing required fields");

  try {
    const filePath = await saveFileToDisk(file, patientId, "medical-reports");
    const analysisText = await analyzeMedicalReport(filePath);
    await saveAnalysisJson(patientId, analysisText, []);
    return { filePath, analysisText };
  } catch (error) {
    console.error("Error in uploadMedicalReport:", error);
    throw new Error("Failed to upload and process medical report");
  }
}

export async function uploadXRay(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as File;
  const patientId = formData.get("patientId") as string;
  if (!file || !patientId) throw new Error("Missing required fields");

  try {
    const filePath = await saveFileToDisk(file, patientId, "xrays");
    const xrayDiseases = await analyzeXRay(filePath);
    await saveAnalysisJson(patientId, "", xrayDiseases);
    return { filePath, analysisText: xrayDiseases.join(", ") };
  } catch (error) {
    console.error("Error in uploadXRay:", error);
    throw new Error("Failed to upload and process X-Ray");
  }
}

export async function analyzeData(patientId: string): Promise<any> {
  try {
    const analysisFilePath = path.join(process.cwd(), "uploads", patientId, "report.json");

    // Read existing report data
    const fileData = await fs.readFile(analysisFilePath, "utf-8");
    const reportData = JSON.parse(fileData);

    const response = await fetch("http://localhost:5000/api/analyze-data", {
      cache: "no-store",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analysis: ${response.statusText}`);
    }

    const analyzedData = await response.json();
    return analyzedData;
  } catch (error) {
    console.error("Error analyzing data:", error);
    throw new Error("Failed to analyze data");
  }
}
