import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // You could send to your analytics service here
      console.error(`404 Error: ${location.pathname}`);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <img src={logoImg} alt="Kyakabi Group" className="h-16 mx-auto" />
        </motion.div>

        {/* 404 Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.7 }}
          className="bg-card rounded-3xl shadow-brand-lg border p-8"
        >
          {/* Animated 404 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle className="h-12 w-12 text-primary" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-7xl font-display font-bold text-primary mb-2">404</h1>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">Page Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been moved.
              <br />
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded mt-2 inline-block">
                {location.pathname}
              </span>
            </p>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button asChild className="w-full h-11 font-semibold">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full h-11" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </motion.div>

          {/* Support contact */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-muted-foreground mt-6"
          >
            Need assistance? Contact us at{" "}
            <a href="mailto:a.ddumba@kyakabi.com" className="text-primary hover:underline">
              a.ddumba@kyakabi.com
            </a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;