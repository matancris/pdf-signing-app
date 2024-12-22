import { useState, useEffect } from 'react';
import PDFUploader from './components/PDFUploader';
import PDFViewer from './components/PDFViewer';
import SentPDFsList from './components/SentPDFsList';
import SendDialog from './components/SendDialog';
import Modal from './components/Modal';
import { SignedPDF } from './types/types';
import { sendWhatsappMessage } from './services/whatsappService';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SigningPage from './components/SigningPage';
import { storePDFData, getPDFData, deletePDFData, getPDFList } from './services/pdfService';
import { PDFDocument } from 'pdf-lib';


// Update the signature position type
type SignaturePosition = {
  x: number;
  y: number;
  pageNumber: number;  // Add page number to track signature location
};

function App() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | undefined>(undefined);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [sentPDFs, setSentPDFs] = useState<SignedPDF[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<SignedPDF | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load sent PDFs from server on mount
  useEffect(() => {
    const loadSentPDFs = async () => {
      try {
        const pdfs = await getPDFList();
        setSentPDFs(pdfs);
      } catch (error) {
        console.error('Error loading PDFs:', error);
      }
    };

    loadSentPDFs();
  }, []);

  // Remove localStorage effects and keep only the polling effect
  useEffect(() => {
    if (sentPDFs.length === 0) return;

    const loadSentPDFs = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/pdf-data/list');
        if (!response.ok) throw new Error('Failed to load PDFs');
        const pdfs = await response.json();
        setSentPDFs(pdfs);
      } catch (error) {
        console.error('Error polling PDFs:', error);
      }
    };

    loadSentPDFs();


  }, [sentPDFs.length]);

  const handlePdfUpload = async (url: string) => {
    const newId = Date.now().toString();
    console.log('Generated new PDF ID:', newId);

    // Get PDF dimensions
    const pdfBytes = await fetch(url).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const dimensions = page.getSize();

    // Store initial PDF data with status and dimensions
    storePDFData(newId, {
      pdfUrl: url,
      signaturePosition: undefined,
      pdfDimensions: dimensions,
      status: 'pending' as const
    });

    setPdfUrl(url);
    setIsPlacementMode(true);
    setCurrentPdfId(newId);

    setSentPDFs(prev => [...prev, {
      id: newId,
      originalPdfUrl: url,
      signedPdfUrl: null,
      signerName: '',
      status: 'pending',
      dateSent: new Date().toISOString()
    }]);
  };

  const handlePlaceSignature = async (position: { x: number; y: number, pageNumber: number }) => {
    if (!currentPdfId || !pdfUrl) return;

    const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[position.pageNumber - 1];
    const { width, height } = page.getSize();

    setSignaturePosition(position);
    setIsPlacementMode(false);

    storePDFData(currentPdfId, {
      pdfUrl: pdfUrl,
      signaturePosition: position,  // Now includes pageNumber
      pdfDimensions: { width, height },
      status: 'pending' as const
    });

    setIsDialogOpen(true);
  };

  const handleSendPDF = async (phone: string) => {
    if (!currentPdfId || !pdfUrl || !signaturePosition) {
      console.error('Missing required data:', { currentPdfId, pdfUrl, signaturePosition });
      return;
    }

    // Get PDF dimensions
    const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];
    const dimensions = page.getSize();

    const pdfData = {
      pdfUrl: pdfUrl,
      signaturePosition: signaturePosition,
      pdfDimensions: dimensions,
      status: 'pending' as const,
      signerName: phone
    };

    const stored = await storePDFData(currentPdfId, pdfData);
    if (!stored) {
      console.error('Failed to store PDF data');
      return;
    }

    setSentPDFs(prev => prev.map(pdf =>
      pdf.id === currentPdfId
        ? { ...pdf, signerName: phone }
        : pdf
    ));

    sendWhatsappMessage(phone, currentPdfId);
    setIsDialogOpen(false);
    setPdfUrl(null);
    setCurrentPdfId(null);
    setSignaturePosition(undefined);  // Reset signature position
    setSignatureImage(null);         // Reset signature image
    setIsPlacementMode(false);       // Reset placement mode

    // Reset the file input by triggering a re-render
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleViewPDF = async (pdf: SignedPDF) => {
    setSelectedPDF(pdf);

    const pdfData = await getPDFData(pdf.id);
    if (pdfData) {
      setPdfUrl(pdfData.pdfUrl);
      setSignatureImage(pdfData.signatureImage || null);
      setSignaturePosition(pdfData.signaturePosition ? 
        { ...pdfData.signaturePosition, pageNumber: pdfData.signaturePosition.pageNumber || 1 } 
        : undefined
      );
      setIsPreviewOpen(true);
    } else {
      setPdfUrl(pdf.originalPdfUrl);
      setIsPreviewOpen(true);
    }
  };

  const handleDownloadPDF = async (pdf: SignedPDF) => {
    if (pdf.status !== 'signed') return;

    try {
      const pdfData = await getPDFData(pdf.id);
      console.log('PDF Data:', pdfData);

      if (!pdfData?.signatureImage) {
        console.error('Missing signature');
        return;
      }

      // Get dimensions from the PDF base64 data if not provided directly
      let dimensions = pdfData.pdfDimensions;
      if (!dimensions && pdfData.pdfUrl) {
        try {
          const pdfDoc = await PDFDocument.load(pdfData.pdfUrl);
          const page = pdfDoc.getPage(0);
          dimensions = {
            width: page.getWidth(),
            height: page.getHeight()
          };
        } catch (err) {
          console.error('Failed to get PDF dimensions:', err);
          return;
        }
      }

      if (!dimensions) {
        console.error('Could not determine PDF dimensions');
        return;
      }

      setPdfUrl(pdfData.pdfUrl);
      setSignatureImage(pdfData.signatureImage || null);
      setSignaturePosition(pdfData.signaturePosition ? 
        { ...pdfData.signaturePosition, pageNumber: pdfData.signaturePosition.pageNumber || 1 } 
        : undefined
      );

      const pdfBytes = await fetch(pdfData.pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      if (pdfData.signaturePosition) {
        const { x, y, pageNumber } = pdfData.signaturePosition;
        const page = pages[pageNumber - 1];
        const { height: pdfHeight } = page.getSize();
        
        const signatureImageBytes = await fetch(pdfData.signatureImage).then(res => res.arrayBuffer());
        const signatureImageEmbed = await pdfDoc.embedPng(signatureImageBytes);
        
        const signatureWidth = 140;
        const signatureHeight = 70;
        
        page.drawImage(signatureImageEmbed, {
          x: x - signatureWidth/2,  // Center the signature horizontally
          y: pdfHeight - y - signatureHeight/2,  // Center vertically and flip Y coordinate
          width: signatureWidth,
          height: signatureHeight
        });
      }

      // Save and download the PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `signed_${pdf.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const handleDeletePDF = async (pdf: SignedPDF) => {
    if (pdf.status !== 'pending') return;

    try {
      const success = await deletePDFData(pdf.id);
      if (success) {
        setSentPDFs(prev => prev.filter(p => p.id !== pdf.id));
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="app">
            <h1>PDF Signing App</h1>
            
            <PDFUploader onUpload={handlePdfUpload} />

            {/* PDF Preview for newly uploaded document */}
            {pdfUrl && !selectedPDF && (
              <PDFViewer
                pdfUrl={pdfUrl}
                isPlacementMode={isPlacementMode}
                onPlaceSignature={handlePlaceSignature}
                signatureImage={signatureImage}
                signaturePosition={signaturePosition || undefined}
              />
            )}

            <SentPDFsList
              pdfs={sentPDFs}
              onViewPDF={handleViewPDF}
              onDownloadPDF={handleDownloadPDF}
              onDeletePDF={handleDeletePDF}
            />

            {/* Modal for viewing signed documents */}
            <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)}>
              {selectedPDF && pdfUrl && (
                <PDFViewer 
                  pdfUrl={pdfUrl}
                  signatureImage={selectedPDF.status === 'signed' ? signatureImage : undefined}
                  signaturePosition={selectedPDF.status === 'signed' ? signaturePosition || undefined : undefined}
                />
              )}
            </Modal>

            <SendDialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              onSend={handleSendPDF}
            />
          </div>
        } />
        <Route path="/sign/:documentId" element={<SigningPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 