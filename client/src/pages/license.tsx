import { Helmet } from "react-helmet";
import { NurseLicenseVerification } from "@/components/nurse-license-verification";

export default function LicensePage() {
  return (
    <>
      <Helmet>
        <title>Nurse License Verification | Nursing Rocks Concert Series</title>
        <meta name="description" content="Verify your nursing license to access free concert tickets and exclusive benefits for healthcare professionals." />
      </Helmet>
      
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Nurse License Verification</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Verify your nursing credentials to receive free concert tickets and exclusive benefits as part of our mission to celebrate healthcare professionals.
          </p>
        </div>
        
        <NurseLicenseVerification />
      </div>
    </>
  );
}