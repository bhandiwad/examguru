import { ChevronLeft, Home } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "./button";

export function PageHeader({ title }: { title: string }) {
  const [location] = useLocation();
  
  return (
    <div className="flex items-center gap-4 mb-8">
      {location !== "/dashboard" && (
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
    </div>
  );
}
