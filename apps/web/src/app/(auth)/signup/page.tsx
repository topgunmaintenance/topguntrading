import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@topgun/ui";

export default function SignupPage(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Use a real email. Passwords must be at least 12 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/api/auth/signup" method="post" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
            />
          </div>
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
              autoComplete="new-password"
              required
              minLength={12}
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-sm text-text-secondary">
          Already have one?{" "}
          <Link href="/login" className="text-accent-secondary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
