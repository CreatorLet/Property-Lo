import { AlertCircle, FileQuestion } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
      <div className="bg-card shadow-sm border rounded-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-muted p-4 rounded-full text-muted-foreground">
            <FileQuestion className="h-12 w-12" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">
            Page not found
          </h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <Link 
          href="/" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
}
