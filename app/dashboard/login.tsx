import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AnzenLogo } from "@/components/AnzenLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function LoginPage() {
  const session = await auth0.getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="anzen-page flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2.5">
            <AnzenLogo size={32} />
            <span className="text-2xl font-semibold tracking-tight">Anzen</span>
            <Badge>AI</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Your AI Chief of Staff, secured by Auth0 Token Vault.
          </p>
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-lg font-medium">Sign in to continue</p>
          <p className="text-muted-foreground text-sm">
            Connect GitHub, Gmail and Slack securely.
          </p>
        </CardContent>

        <CardFooter className="flex-col gap-4 pb-4">
          <Button render={<a href="/auth/login" />} size="lg" className="w-full">
            Continue with Auth0
          </Button>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ShieldCheck className="size-3.5" />
            Zero credentials stored in Anzen
          </p>
        </CardFooter>
      </Card>

      <p className="text-muted-foreground mt-8 text-center text-xs">
        Anzen 安全 · Secured by Auth0 Token Vault
      </p>
    </div>
  );
}
