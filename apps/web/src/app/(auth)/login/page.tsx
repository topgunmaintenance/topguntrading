import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@topgun/ui";

export default function LoginPage(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Welcome back. Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/login" method="post" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Log in
          </Button>
        </form>
        <p className="mt-4 text-sm text-text-secondary">
          New here?{" "}
          <Link href="/signup" className="text-accent-secondary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
