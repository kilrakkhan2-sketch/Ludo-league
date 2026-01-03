"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { submitResult, type FormState } from "@/lib/actions";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending} variant="accent">
      {pending ? (
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
  );
}

export function SubmitResultForm({ matchId }: { matchId: string }) {
  const initialState: FormState = undefined;
  const [state, dispatch] = useActionState(submitResult, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUri, setDataUri] = useState<string>("");
  const { toast } = useToast();

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

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.isError ? "Submission Failed" : "Submission Successful",
        description: state.message,
        variant: state.isError ? "destructive" : "default",
      });
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Match Result</CardTitle>
        <CardDescription>
          Upload your result screenshot, select your position, and choose your status. All submissions are manually verified by an admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-6">
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="screenshotDataUri" value={dataUri} />

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
            <RadioGroup name="position" required className="flex gap-4">
              {[1, 2, 3, 4].map((pos) => (
                <div key={pos} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(pos)} id={`pos-${pos}`} />
                  <Label
                    htmlFor={`pos-${pos}`}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    {pos === 1 && <Crown className="h-4 w-4 text-yellow-500" />}
                    {pos}
                    {pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th"}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Your Claimed Status</Label>
            <RadioGroup
              name="status"
              required
              defaultValue="win"
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="win" id="win" />
                <Label
                  htmlFor="win"
                  className="flex items-center gap-1.5 cursor-pointer text-green-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  I Won
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="loss" id="loss" />
                <Label
                  htmlFor="loss"
                  className="flex items-center gap-1.5 cursor-pointer text-red-600"
                >
                  <XCircle className="h-4 w-4" />I Lost
                </Label>
              </div>
            </RadioGroup>
          </div>

          {state?.message && (
             <Alert variant={state.isError ? "destructive" : "default"} className={!state.isError ? "bg-green-50 border-green-200 text-green-800" : ""}>
              {state.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 !text-green-500"/>}
              <AlertTitle>{state.isError ? "Error" : "Success"}</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
