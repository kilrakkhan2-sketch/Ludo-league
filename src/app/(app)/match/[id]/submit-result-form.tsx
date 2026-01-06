
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  Trophy,
  Loader2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import {
  collection,
  serverTimestamp,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';

export function SubmitResultForm({ matchId }: { matchId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [preview, setPreview] = useState<string | null>(null);
  const [dataUri, setDataUri] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const [submittedPositions, setSubmittedPositions] = useState<number[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [status, setStatus] = useState<'win' | 'loss' | null>(null);

  useEffect(() => {
    if (!firestore || !matchId) return;

    const resultsRef = collection(firestore, `matches/${matchId}/results`);
    const unsubscribe = onSnapshot(resultsRef, (snapshot) => {
      const positions: number[] = [];
      let userSubmitted = false;
      snapshot.docs.forEach((doc) => {
        positions.push(doc.data().position);
        if (doc.data().userId === user?.uid) {
            userSubmitted = true;
        }
      });
      setSubmittedPositions(positions);
      setHasSubmitted(userSubmitted);
    });

    return () => unsubscribe();
  }, [firestore, matchId, user?.uid]);

  const handlePositionChange = (value: string) => {
    const pos = Number(value);
    setPosition(pos);
    if (pos === 1) {
        setStatus('win');
    } else {
        setStatus('loss');
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore || !dataUri) {
      toast({
        title: 'Please login and select a screenshot.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!position || !status) {
      toast({
        title: 'Please select your position.',
        variant: 'destructive',
      });
      return;
    }

    if (position === 1 && status === 'loss') {
        toast({ title: "Invalid Selection", description: "You cannot claim 1st position with a 'Loss' status.", variant: "destructive"});
        return;
    }

    if (position > 1 && status === 'win') {
        toast({ title: "Invalid Selection", description: "You can only claim 'Win' status if you are in 1st position.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    setFormState(null);

    try {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `match-results/${matchId}/${user.uid}/${Date.now()}.jpg`
      );
      await uploadString(storageRef, dataUri, 'data_url');
      const screenshotUrl = await getDownloadURL(storageRef);

      const resultDocRef = doc(
        firestore,
        `matches/${matchId}/results`,
        user.uid
      );

      await setDoc(resultDocRef, {
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        position,
        status,
        screenshotUrl,
        submittedAt: serverTimestamp(),
      });
      
      // The onResultSubmit cloud function will now handle all logic.

      setFormState({
        message: 'Result submitted successfully! Your submission is now under review.',
        isError: false,
      });

    } catch (error: any) {
      console.error('Error submitting result:', error);
      setFormState({
        message: `Submission failed: ${error.message}`,
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted && !formState) {
    return (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 !text-green-500"/>
            <AlertTitle>Result Submitted</AlertTitle>
            <AlertDescription>You have already submitted your result for this match. Please wait for the other players and admin verification.</AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Match Result</CardTitle>
        <CardDescription>
          Upload your result screenshot and select your final position in the game.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="screenshot">Result Screenshot</Label>
            <Input
              id="screenshot"
              name="screenshot"
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="file:text-primary"
            />
            {preview && (
              <Image
                src={preview}
                alt="Screenshot preview"
                width={600}
                height={400}
                className="mt-2 rounded-md object-contain border"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Your Position</Label>
            <RadioGroup name="position" required onValueChange={handlePositionChange} className="flex gap-4">
              {[1, 2, 3, 4].map((pos) => (
                <div key={pos} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={String(pos)}
                    id={`pos-${pos}`}
                    disabled={submittedPositions.includes(pos)}
                  />
                  <Label
                    htmlFor={`pos-${pos}`}
                    className="flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {pos === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    {pos}
                    {pos === 1
                      ? 'st'
                      : pos === 2
                      ? 'nd'
                      : pos === 3
                      ? 'rd'
                      : 'th'}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Your Claimed Status</Label>
            <div
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="win" id="win" checked={status === 'win'} disabled />
                <Label
                  htmlFor="win"
                  className="flex items-center gap-1.5 cursor-pointer text-green-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  I Won
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="loss" id="loss" checked={status === 'loss'} disabled/>
                <Label
                  htmlFor="loss"
                  className="flex items-center gap-1.5 cursor-pointer text-red-600"
                >
                  <XCircle className="h-4 w-4" />I Lost
                </Label>
              </div>
            </div>
          </div>

          {formState && (
            <Alert
              variant={formState.isError ? 'destructive' : 'default'}
              className={
                !formState.isError
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : ''
              }
            >
              {formState.isError ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4 !text-green-500" />
              )}
              <AlertTitle>{formState.isError ? 'Error' : 'Success'}</AlertTitle>
              <AlertDescription>{formState.message}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !position}
            variant="accent"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Submit Result for Review
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
