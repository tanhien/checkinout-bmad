import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@hotel/ui"

export default function UIDemoPage() {
  return (
    <div className="space-y-10 p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">UI Component Library Demo</h1>

      {/* Button */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="default" isLoading>Loading</Button>
          <Button variant="default" disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Badge */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Input */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Input</h2>
        <div className="grid gap-4 max-w-sm">
          <Input label="Email" type="email" placeholder="admin@demo.hotel" />
          <Input label="With description" description="This is a helper text" placeholder="Enter value" />
          <Input label="With error" error="This field is required" placeholder="Enter value" />
          <Input placeholder="No label" />
        </div>
      </section>

      {/* Textarea */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Textarea</h2>
        <div className="grid gap-4 max-w-sm">
          <Textarea label="Special requests" placeholder="Any special requests for your stay..." />
          <Textarea label="With error" error="Message is too short" />
        </div>
      </section>

      {/* Select */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Select</h2>
        <div className="grid gap-4 max-w-sm">
          <Select
            label="Room type"
            placeholder="Select a room type"
            options={[
              { value: "deluxe", label: "Deluxe Room" },
              { value: "suite", label: "Suite" },
              { value: "standard", label: "Standard Room" },
            ]}
          />
          <Select
            label="With error"
            error="Please select a room type"
            placeholder="Select..."
            options={[{ value: "a", label: "Option A" }]}
          />
        </div>
      </section>

      {/* Card */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Card</h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Booking #HTL-2025-A3F7K2</CardTitle>
            <CardDescription>Check-in: Jun 1, 2025 · Check-out: Jun 3, 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Guest: Nguyễn Văn A · Deluxe Room · 2 adults</p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Check In</Button>
            <Button size="sm" variant="outline">View Details</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Table</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Confirmation</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-xs">HTL-2025-A3F7K2</TableCell>
              <TableCell>Nguyễn Văn A</TableCell>
              <TableCell>Deluxe · 101</TableCell>
              <TableCell><Badge variant="success">Checked In</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">HTL-2025-B7X9K1</TableCell>
              <TableCell>Trần Thị B</TableCell>
              <TableCell>Suite · 201</TableCell>
              <TableCell><Badge variant="primary">Confirmed</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">HTL-2025-C2M3P5</TableCell>
              <TableCell>Lê Văn C</TableCell>
              <TableCell>Standard · 305</TableCell>
              <TableCell><Badge variant="destructive">Cancelled</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Skeleton */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Skeleton</h2>
        <div className="space-y-3 max-w-sm">
          <Skeleton className="h-10 w-full" />
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" />
              <Skeleton variant="text" className="w-2/3" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
