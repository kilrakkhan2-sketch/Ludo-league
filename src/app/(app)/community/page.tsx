
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CommunityPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Community Hub</h1>
      <Card>
        <CardHeader>
          <CardTitle>Join the Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Community forums, discussions, and user-generated content will be available here. Let's build a community together!</p>
        </CardContent>
      </Card>
    </div>
  );
}
