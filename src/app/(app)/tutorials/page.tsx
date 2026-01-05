
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TutorialsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tutorials</h1>
      <Card>
        <CardHeader>
          <CardTitle>Learn and Grow</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Find tutorials, guides, and learning materials here. Enhance your skills and knowledge!</p>
        </CardContent>
      </Card>
    </div>
  );
}
