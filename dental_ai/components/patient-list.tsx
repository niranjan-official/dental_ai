"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, UserRound, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { getFirestore, collection, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/firebase/config"

// Patient type definition
type Patient = {
  id: string
  name: string
  age: number
  lastVisit: string
  status: "Critical" | "Stable"
  image?: string
  condition: string
}

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        const patientsCollection = collection(db, "users")
        const patientsSnapshot = await getDocs(patientsCollection)

        const patientsList: Patient[] = patientsSnapshot.docs.map((doc) => {
          const data = doc.data()
          // Convert Firestore Timestamp to string if needed
          const lastVisit =
            data.lastVisit instanceof Timestamp ? data.lastVisit.toDate().toISOString().split("T")[0] : data.lastVisit

          return {
            id: doc.id,
            name: data.name,
            age: data.age,
            lastVisit: lastVisit,
            status: data.status,
            image: data.image,
            condition: data.condition,
          }
        })

        setPatients(patientsList)
        setError(null)
      } catch (err) {
        console.error("Error fetching patients:", err)
        setError("Failed to load patients. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "critical" && patient.status === "Critical") ||
      (filter === "stable" && patient.status === "Stable") ||
      (filter === "recent" && new Date(patient.lastVisit) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    return matchesSearch && matchesFilter
  })

  const handleAddNewPatient = () => {
    // Navigate to add patient page or open modal
    // This is just a placeholder for the functionality
    console.log("Add new patient clicked")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <Button onClick={handleAddNewPatient}>
          <Plus className="mr-2 h-4 w-4" /> Add New Patient
        </Button>
      </div>

      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="critical">Critical Cases</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="recent">Recent Visits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading patients...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No patients found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4">
                {patient.image ? (
                  <img
                    src={patient.image || "/placeholder.svg"}
                    alt={patient.name}
                    className="rounded-full w-12 h-12 object-cover"
                  />
                ) : (
                  <UserRound className="w-12 h-12" />
                )}
                <div>
                  <CardTitle>{patient.name}</CardTitle>
                  <CardDescription>Age: {patient.age}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                    </span>
                    <span
                      className={`font-medium ${patient.status === "Critical" ? "text-destructive" : "text-primary"}`}
                    >
                      {patient.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{patient.condition}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/patients/${patient.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Profile <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

