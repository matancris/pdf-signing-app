import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PDFViewer from './PDFViewer';
import SignaturePad from './SignaturePad';
import { getPDFData, submitSignedPDF } from '../services/pdfService';

const SigningPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number, pageNumber: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPad, setShowPad] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const loadPdfData = async () => {
      if (!documentId) {
        setError('No document ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const pdfData = await getPDFData(documentId);
        if (!pdfData) {
          setError('This form is no longer available. Please contact the sender.');
          setIsLoading(false);
          return;
        }

        setPdfUrl(pdfData.pdfUrl);
        if (pdfData.signaturePosition) {
          setSignaturePosition(pdfData.signaturePosition);
        }
      } catch (error) {
        console.error('Error loading PDF data:', error);
        setError('Failed to load document');
      }
      
      setIsLoading(false);
    };

    loadPdfData();
  }, [documentId]);

  const handleSaveSignature = (signature: string) => {
    setSignatureImage(signature);
    setShowPad(false);
  };

  const handleConfirm = async () => {
    if (!documentId || !signatureImage || !pdfUrl) return;

    try {
      const existingData = await getPDFData(documentId);
      if (!existingData?.signaturePosition || !existingData.pdfDimensions) {
        setError('Missing signature position or dimensions');
        return;
      }

      const success = await submitSignedPDF(
        documentId, 
        signatureImage, 
        existingData.pdfDimensions,
        existingData.signaturePosition
      );

      if (success) {
        setIsSubmitted(true);
      } else {
        setError('Failed to submit signature');
      }
    } catch (error) {
      console.error('Error submitting signature:', error);
      setError('Failed to submit signature');
    }
  };

  const handleEditSignature = () => {
    setShowPad(true);
  };

  if (isLoading) {
    return (
      <div className="signing-page">
        <h1>Loading document...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="signing-page">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Return to Home</button>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="signing-page">
        <h1>Loading...</h1>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="signing-page">
        <div className="thank-you-message">
          <h1>Thank You!</h1>
          <p>Your signature has been submitted successfully.</p>
          <p>You can close this window now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signing-page">
      <h1>Sign Document</h1>
      {pdfUrl && (
        <PDFViewer 
          pdfUrl={pdfUrl}
          signatureImage={signatureImage}
          signaturePosition={signaturePosition || undefined}
        />
      )}
      
      {showPad ? (
        <SignaturePad onSave={handleSaveSignature} />
      ) : (
        <div className="signature-actions">
          <button 
            className="confirm-button"
            onClick={handleConfirm}
          >
            Confirm & Submit
          </button>
          <button 
            className="edit-button"
            onClick={handleEditSignature}
          >
            Edit Signature
          </button>
        </div>
      )}
    </div>
  );
};

export default SigningPage; 