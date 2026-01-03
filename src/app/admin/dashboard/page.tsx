import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockFraudAlerts, mockUsers } from "@/lib/data"
import { Ban, Eye, ShieldCheck, ThumbsDown } from "lucide-react"

export default function AdminDashboardPage() {
  const suspiciousUsers = mockUsers.filter(u => u.winRate > 70 || mockUsers.filter(user => user.ipAddress === u.ipAddress).length > 1);

  return (
    <>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Admin Dashboard</h2>
      <Tabs defaultValue="fraud-alerts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fraud-alerts">Fraud Alerts</TabsTrigger>
          <TabsTrigger value="suspicious-users">Suspicious Users</TabsTrigger>
        </TabsList>
        <TabsContent value="fraud-alerts">
          <Card>
            <CardHeader>
              <CardTitle>Automated Fraud Alerts</CardTitle>
              <CardDescription>
                Submissions automatically flagged by the system for review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Match ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFraudAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.user.name}</TableCell>
                      <TableCell>{alert.reason}</TableCell>
                      <TableCell>{alert.matchId}</TableCell>
                      <TableCell>{new Date(alert.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-100 hover:text-green-700">Approve</Button>
                            <Button variant="destructive" size="sm"><ThumbsDown className="mr-2 h-4 w-4"/>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="suspicious-users">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Users</CardTitle>
              <CardDescription>
                Users with high win rates or using shared IPs/devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suspiciousUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.winRate}%</TableCell>
                      <TableCell>{user.ipAddress}</TableCell>
                      <TableCell>{user.deviceId}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex gap-2 justify-end">
                            <Button variant="secondary" size="sm">Suspend</Button>
                            <Button variant="destructive" size="sm"><Ban className="mr-2 h-4 w-4"/>Block</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
