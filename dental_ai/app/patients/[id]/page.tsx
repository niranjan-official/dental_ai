"use client";

import { useState } from "react";
import { MainNav } from "@/components/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Calendar,
    FileText,
    Upload,
    Activity,
    Brain,
    History,
    AlertCircle,
    FileImage,
} from "lucide-react";
import Record from "@/components/Record";
import { analyzeData, uploadMedicalReport, uploadXRay } from "./actions";

const mockPatients = [
    {
        id: "oNWa7TBJhkLQKPOtaVBR",
        name: "Sarah Johnson",
        age: 34,
        lastVisit: "2024-03-15",
        status: "Critical",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        condition: "Root Canal Treatment",
        // medicalHistory: "Diabetes Type 2, Hypertension",
        upcomingAppointment: "2024-04-01",
        treatmentProgress: 65,
        recentDiagnosis: "Severe tooth decay in lower right molar",
        xrays: [
            "https://images.unsplash.com/photo-1590424693420-454c73699911",
            "https://images.unsplash.com/photo-1590424693420-454c73699912",
        ],
    },
    {
        id: "th1k76sebmd6XzeOF2OF",
        name: "Michael Chen",
        age: 28,
        lastVisit: "2024-03-10",
        status: "Stable",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        condition: "Regular Checkup",
        // medicalHistory: "None",
        upcomingAppointment: "2024-04-05",
        treatmentProgress: 100,
        recentDiagnosis: "Good oral health",
        xrays: [],
    },
    {
        id: "D2z44Gnyyn0RmaPrxdVo",
        name: "Emily Davis",
        age: 45,
        lastVisit: "2024-03-18",
        status: "Critical",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
        condition: "Dental Crown",
        // medicalHistory: "Osteoporosis, Anemia",
        upcomingAppointment: "2024-04-07",
        treatmentProgress: 40,
        recentDiagnosis: "Cracked molar requiring crown",
        xrays: ["https://images.unsplash.com/photo-1590424693420-454c73699913"],
    },
    {
        id: "2JfZiePs2SmrH9sdoKBK",
        name: "David Wilson",
        age: 52,
        lastVisit: "2024-03-12",
        status: "Stable",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        condition: "Teeth Cleaning",
        // medicalHistory: "High Cholesterol",
        upcomingAppointment: "2024-04-10",
        treatmentProgress: 90,
        recentDiagnosis: "Mild plaque buildup",
        xrays: [],
    },
];

export default function PatientProfile({ params }: { params: { id: string } }) {
    const { id } = params;
    const patient = mockPatients.find((p) => p.id === id);

    const [isUploadingReport, setIsUploadingReport] = useState(false);
    const [isUploadingXRay, setIsUploadingXRay] = useState(false);
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [xrayFile, setXrayFile] = useState<File | null>(null);
    const [analyzedData, setAnalyzedData] = useState<{
        detected_symptoms: string[];
        treatment_suggestions: string;
    } | null>(null);

    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [correctSymptom, setCorrectSymptom] = useState("");
    const [correctTreatment, setCorrectTreatment] = useState("");

    if (!patient) {
        return <div>Patient not found</div>;
    }

    const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReportFile(e.target.files[0]);
        }
    };

    const handleXRayFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setXrayFile(e.target.files[0]);
        }
    };

    const handleReportUpload = async () => {
        if (!reportFile) {
            toast("No file selected");

            return;
        }

        try {
            setIsUploadingReport(true);
            const formData = new FormData();
            formData.append("file", reportFile);
            formData.append("patientId", id);

            const result = await uploadMedicalReport(formData);

            toast("Upload successful");

            setReportFile(null);
        } catch (error) {
            toast("Upload failed");
        } finally {
            setIsUploadingReport(false);
        }
    };

    const handleXRayUpload = async () => {
        if (!xrayFile) {
            toast("No file selected");

            return;
        }

        try {
            setIsUploadingXRay(true);
            const formData = new FormData();
            formData.append("file", xrayFile);
            formData.append("patientId", id);

            const result = await uploadXRay(formData);

            toast.message("Upload successful", {
                description: `X-Ray uploaded and processed: ${result.analysisText.substring(
                    0,
                    50
                )}...`,
            });

            setXrayFile(null);
        } catch (error) {
            toast.message("Upload failed", {
                description:
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred",
            });
            console.log(error);
        } finally {
            setIsUploadingXRay(false);
        }
    };

    const analyzeAI = async () => {
        try {
            const data = await analyzeData(patient.id);
            console.log("Server", data);
            setAnalyzedData(data);
        } catch (error) {
            console.error("Error analyzing data:", error);
        }
    };

    const submitFeedback = async () => {
        if (!correctSymptom || !correctTreatment) return;

        const response = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                original_text: analyzedData?.treatment_suggestions,
                correct_symptom: correctSymptom,
                correct_treatment: correctTreatment,
            }),
        });

        if (response.ok) {
            setShowFeedbackForm(false);
            setCorrectSymptom("");
            setCorrectTreatment("");
            alert("Feedback submitted successfully!");
        } else {
            alert("Failed to submit feedback.");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <MainNav />
            <main className="container mx-auto p-8">
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src={patient.image || "/placeholder.svg"}
                        alt={patient.name}
                        className="rounded-full w-16 h-16 object-cover"
                    />
                    <div>
                        <h1 className="text-3xl font-bold">{patient.name}</h1>
                        <p className="text-muted-foreground">
                            Age: {patient.age} | Patient ID: {patient.id}
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="records">
                            Medical Records
                        </TabsTrigger>
                        <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Status
                                    </CardTitle>
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className={`text-2xl font-bold ${
                                            patient.status === "Critical"
                                                ? "text-destructive"
                                                : "text-primary"
                                        }`}
                                    >
                                        {patient.status}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Current Condition: {patient.condition}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Next Appointment
                                    </CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {new Date(
                                            patient.upcomingAppointment
                                        ).toLocaleDateString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Scheduled Follow-up
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Treatment Progress
                                    </CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <Progress
                                        value={patient.treatmentProgress}
                                        className="mt-2"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {patient.treatmentProgress}% Complete
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Recent Diagnosis
                                    </CardTitle>
                                    <Brain className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">
                                        {patient.recentDiagnosis}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="records">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Medical History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">
                                        {/* {patient.medicalHistory} */}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>X-Rays</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        {patient.xrays.map((xray, index) => (
                                            <img
                                                key={index}
                                                src={xray || "/placeholder.svg"}
                                                alt={`X-Ray ${index + 1}`}
                                                className="rounded-lg object-cover w-full h-48"
                                            />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Upload Medical Report</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                        <FileText className="h-8 w-8 mx-auto mb-4" />
                                        <Label
                                            htmlFor="report-upload"
                                            className="cursor-pointer block"
                                        >
                                            {reportFile
                                                ? reportFile.name
                                                : "Drag and drop files here or click to browse"}
                                        </Label>
                                        <Input
                                            id="report-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.txt"
                                            onChange={handleReportFileChange}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleReportUpload}
                                        disabled={
                                            !reportFile || isUploadingReport
                                        }
                                    >
                                        {isUploadingReport ? (
                                            "Uploading..."
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-4 w-4" />{" "}
                                                Upload Medical Report
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Upload X-Ray</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                        <FileImage className="h-8 w-8 mx-auto mb-4" />
                                        <Label
                                            htmlFor="xray-upload"
                                            className="cursor-pointer block"
                                        >
                                            {xrayFile
                                                ? xrayFile.name
                                                : "Drag and drop files here or click to browse"}
                                        </Label>
                                        <Input
                                            id="xray-upload"
                                            type="file"
                                            className="hidden"
                                            accept=".jpg,.jpeg,.png,.dicom"
                                            onChange={handleXRayFileChange}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleXRayUpload}
                                        disabled={!xrayFile || isUploadingXRay}
                                    >
                                        {isUploadingXRay ? (
                                            "Uploading..."
                                        ) : (
                                            <>
                                                <FileImage className="mr-2 h-4 w-4" />{" "}
                                                Upload X-Ray
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Voice Recording</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Record />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="analysis">
                        <div className="grid gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Analysis Dashboard</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button
                                        className="w-full mb-4"
                                        onClick={analyzeAI}
                                    >
                                        <Brain className="mr-2 h-4 w-4" />{" "}
                                        Analyze Data
                                    </Button>
                                </CardContent>
                            </Card>
                            {analyzedData && (
                                <div className="w-full border mt-4 p-5">
                                    <h2>Analyzed Data</h2>
                                    <p>
                                        <strong>Detected Symptoms:</strong>
                                    </p>
                                    <ul className="list-disc pl-5">
                                        {analyzedData.detected_symptoms?.map(
                                            (symptom, index) => (
                                                <li key={index}>{symptom}</li>
                                            )
                                        )}
                                    </ul>
                                    <p className="mt-2">
                                        <strong>Treatment Suggestions:</strong>
                                    </p>
                                    <p>{analyzedData.treatment_suggestions}</p>

                                    {/* Feedback Buttons */}
                                    <div className="mt-4 flex gap-2">
                                        <Button variant="outline">
                                            Was this useful?
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                setShowFeedbackForm(true)
                                            }
                                        >
                                            No
                                        </Button>
                                    </div>

                                    {/* Feedback Form */}
                                    {showFeedbackForm && (
                                        <div className="mt-4 border p-4">
                                            <h3 className="font-semibold">
                                                Provide Correct Information
                                            </h3>
                                            <input
                                                type="text"
                                                className="w-full mt-2 p-2 border rounded"
                                                placeholder="Enter correct symptom"
                                                value={correctSymptom}
                                                onChange={(e) =>
                                                    setCorrectSymptom(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <textarea
                                                className="w-full mt-2 p-2 border rounded"
                                                placeholder="Enter correct treatment plan"
                                                value={correctTreatment}
                                                onChange={(e) =>
                                                    setCorrectTreatment(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Button
                                                className="mt-3"
                                                onClick={submitFeedback}
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
