
"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AtSign,
  PlusCircle,
  Trash2,
  Edit,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import QRCode from "qrcode.react";
import { useToast } from "@/components/ui/use-toast";

interface UpiData {
  id: string;
  upiId: string;
  isActive: boolean;
}

export default function UpiManagementPage() {
  const [upiIds, setUpiIds] = useState<UpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newUpiId, setNewUpiId] = useState("");
  const [editingUpi, setEditingUpi] = useState<UpiData | null>(null);
  const { toast } = useToast();

  const fetchUpiIds = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "upiAddresses"));
      const ids = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UpiData));
      setUpiIds(ids.sort((a, b) => (a.isActive ? -1 : 1)));
    } catch (error) {
      console.error("Error fetching UPI IDs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch UPI IDs.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUpiIds();
  }, [fetchUpiIds]);

  const handleSetActive = async (idToActivate: string) => {
    setIsSaving(true);
    const batch = writeBatch(db);

    upiIds.forEach((upi) => {
      const docRef = doc(db, "upiAddresses", upi.id);
      if (upi.id === idToActivate) {
        batch.update(docRef, { isActive: true });
      } else if (upi.isActive) {
        batch.update(docRef, { isActive: false });
      }
    });

    try {
      await batch.commit();
      toast({
        title: "Success",
        description: "Active UPI ID has been updated.",
      });
      fetchUpiIds();
    } catch (error) {
      console.error("Error setting active UPI ID:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set the active UPI ID.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUpi = async () => {
    if (!newUpiId.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "UPI ID cannot be empty.",
      });
      return;
    }
    setIsSaving(true);
    try {
      // If no other UPIs exist, make this one active
      const isActive = upiIds.length === 0;
      await addDoc(collection(db, "upiAddresses"), {
        upiId: newUpiId.trim(),
        isActive,
      });
      toast({
        title: "Success",
        description: "New UPI ID added successfully.",
      });
      setNewUpiId("");
      fetchUpiIds();
    } catch (error) {
      console.error("Error adding new UPI ID:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new UPI ID.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateUpi = async () => {
    if (!editingUpi || !editingUpi.upiId.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "UPI ID cannot be empty.",
      });
      return;
    }
    setIsSaving(true);
    const docRef = doc(db, "upiAddresses", editingUpi.id);
    try {
      await updateDoc(docRef, { upiId: editingUpi.upiId });
      toast({
        title: "Success",
        description: "UPI ID updated successfully.",
      });
      setEditingUpi(null);
      fetchUpiIds();
    } catch (error) {
      console.error("Error updating UPI ID:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update UPI ID.",
      });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteUpi = async (id: string) => {
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "upiAddresses", id));
      toast({
        title: "Success",
        description: "UPI ID deleted successfully.",
      });
      fetchUpiIds();
    } catch (error) {
      console.error("Error deleting UPI ID:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete UPI ID.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <AtSign className="h-8 w-8 text-primary" />
          UPI Management
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New UPI
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New UPI ID</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="new-upi">UPI ID</Label>
              <Input
                id="new-upi"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value)}
                placeholder="e.g., yourbusiness@okhdfcbank"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddUpi} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add UPI
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Deposit UPI IDs</CardTitle>
          <CardDescription>
            Manage the list of UPI IDs for deposits. Only one can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : upiIds.length === 0 ? (
             <div className="text-center py-8">
                <h3 className="text-lg font-semibold">No UPI IDs Found</h3>
                <p className="text-sm text-muted-foreground">Click "Add New UPI" to get started.</p>
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UPI ID</TableHead>
                  <TableHead className="text-center">QR Code</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upiIds.map((upi) => (
                  <TableRow key={upi.id} className={upi.isActive ? "bg-green-100/50" : ""}>
                    <TableCell className="font-medium">{upi.upiId}</TableCell>
                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <QrCode className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xs">
                          <div className="p-4 flex flex-col items-center justify-center">
                            <QRCode value={`upi://pay?pa=${upi.upiId}`} size={200} />
                            <p className="mt-4 font-mono text-sm">{upi.upiId}</p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={upi.isActive}
                        onCheckedChange={() => handleSetActive(upi.id)}
                        disabled={isSaving || upi.isActive}
                        aria-label="Set active UPI"
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingUpi({...upi})}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit UPI ID</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                <Input
                                    value={editingUpi?.upiId || ''}
                                    onChange={(e) => setEditingUpi(prev => prev ? {...prev, upiId: e.target.value} : null)}
                                />
                                </div>
                                <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingUpi(null)}>Cancel</Button>
                                <Button onClick={handleUpdateUpi} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Save Changes
                                </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" disabled={upi.isActive}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the UPI ID <span className="font-bold">`{upi.upiId}`</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUpi(upi.id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {!loading && upiIds.filter(u => u.isActive).length !== 1 && (
               <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5"/>
                    <p className="text-sm font-semibold">
                        Warning: There is currently no active UPI ID. Users will not be able to make deposits. Please activate one.
                    </p>
               </div>
           )}
        </CardContent>
      </Card>
    </>
  );
}
