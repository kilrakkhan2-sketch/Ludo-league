import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Browse and manage all registered users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>User list will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
