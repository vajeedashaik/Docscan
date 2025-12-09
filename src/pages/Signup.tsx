import React from 'react';
import { Helmet } from 'react-helmet';
import { SignUp } from '@clerk/clerk-react';

const Signup: React.FC = () => {
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
