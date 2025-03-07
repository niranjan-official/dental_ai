'use client';

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, UserRound, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { collection, getDocs, Timestamp, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { format } from "date-fns";

type Patient = {
  id: string;
  name: string;
  age: number;
  lastVisit: string;
  condition: string;
  image?: string;
}

type NewPatient = Omit<Patient, 'id'>;

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPatient, setNewPatient] = useState<NewPatient>({
    name: "",
    age: 0,
    lastVisit: format(new Date(), 'yyyy-MM-dd'),
    condition: "",
    image: ""
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const patientsCollection = collection(db, "users");
      const patientsSnapshot = await getDocs(patientsCollection);

      const patientsList: Patient[] = patientsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const lastVisit =
          data.lastVisit instanceof Timestamp ? data.lastVisit.toDate().toISOString().split("T")[0] : data.lastVisit;

        return {
          id: doc.id,
          name: data.name,
          age: data.age,
          lastVisit: lastVisit,
          condition: data.condition,
          image: data.image,
        };
      });

      setPatients(patientsList);
      setError(null);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load patients. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const patientsCollection = collection(db, "users");

      await addDoc(patientsCollection, {
        ...newPatient,
        lastVisit: new Date(newPatient.lastVisit),
        age: Number(newPatient.age)
      });

      setNewPatient({
        name: "",
        age: 0,
        lastVisit: format(new Date(), 'yyyy-MM-dd'),
        condition: "",
        image: ""
      });
      setIsDialogOpen(false);
      fetchPatients();
    } catch (err) {
      console.error("Error adding patient:", err);
      setError("Failed to add patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "recent" && new Date(patient.lastVisit) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddPatient}>
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's details below. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastVisit" className="text-right">
                    Visit Date
                  </Label>
                  <Input
                    id="lastVisit"
                    type="date"
                    value={newPatient.lastVisit}
                    onChange={(e) => setNewPatient({ ...newPatient, lastVisit: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="condition" className="text-right">
                    Condition
                  </Label>
                  <Input
                    id="condition"
                    value={newPatient.condition}
                    onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Image URL
                  </Label>
                  <Input
                    id="image"
                    value={newPatient.image}
                    onChange={(e) => setNewPatient({ ...newPatient, image: e.target.value })}
                    className="col-span-3"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Patient
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                      className="text-primary"
                    >
                      {patient.condition}
                    </span>
                  </div>
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
  );
}
