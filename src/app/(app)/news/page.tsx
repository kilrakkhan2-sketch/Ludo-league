
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Latest News</h1>
      <Card>
        <CardHeader>
          <CardTitle>Stay Updated</CardTitle>
        </CardHeader>
        <CardContent>
          <p>News articles and announcements will be displayed here. Check back later for updates!</p>
        </CardContent>
      </Card>
    </div>
  );
}
