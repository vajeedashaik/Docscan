import React from 'react';
import { Helmet } from 'react-helmet';
import { SignUp } from '@clerk/clerk-react';
import { dark, light } from '@clerk/themes';

const Signup: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    // Function to get current theme
    const getCurrentTheme = (): 'light' | 'dark' => {
      const root = window.document.documentElement;
      return root.classList.contains('light') ? 'light' : 'dark';
    };

    // Set initial theme
    setTheme(getCurrentTheme());

    // Watch for changes to the document element's class
    const observer = new MutationObserver(() => {
      setTheme(getCurrentTheme());
    });

    observer.observe(window.document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'],
      attributeOldValue: true
    });

    return () => observer.disconnect();
  }, []);
  return (
    <>
      <Helmet>
        <title>Sign Up | OCR Document Extractor</title>
      </Helmet>

      <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/Screenshot_2025-12-08_194555-removebg-preview.png" 
              alt="Logo" 
              className="h-64 w-auto logo-animated" 
            />
          </div>

          {/* Clerk SignUp Component */}
          <div className="flex justify-center">
            <SignUp 
              signInUrl="/auth"
              redirectUrl="/"
              appearance={{
                baseTheme: theme === 'dark' ? dark : light,
                elements: {
                  rootBox: "w-full",
                  card: "border-border/50 shadow-lg",
                },
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
