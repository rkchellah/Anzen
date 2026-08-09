import { LogOut } from "lucide-react";
import { AnzenLogo } from "@/components/AnzenLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SignedOutPage() {
  return (
    <div className="anzen-page flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2.5">
            <AnzenLogo size={28} />
            <span className="text-xl font-semibold tracking-tight">Anzen</span>
            <Badge>AI</Badge>
          </div>
          <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
            <LogOut className="text-primary size-5" />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-medium">You&apos;ve been signed out</p>
          <p className="text-muted-foreground text-sm">
            Your session has ended. All tokens remain secured in Auth0 Token Vault.
          </p>
        </CardContent>

        <Separator />

        <CardFooter className="pb-4">
          <Button render={<a href="/auth/login" />} size="lg" className="w-full">
            Sign back in
          </Button>
        </CardFooter>
      </Card>

      <p className="text-muted-foreground mt-8 text-center text-xs">
        Anzen 安全 · Secured by Auth0 Token Vault
      </p>
    </div>
  );
}
