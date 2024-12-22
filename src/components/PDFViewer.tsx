import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import SignaturePlacement from './SignaturePlacement';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  isPlacementMode?: boolean;
  onPlaceSignature?: (position: { x: number; y: number; pageNumber: number }) => void;
  signatureImage?: string | null;
  signaturePosition?: { x: number; y: number; pageNumber: number };
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  isPlacementMode = false,
  onPlaceSignature,
  signatureImage,
  signaturePosition
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  const signatureFrameWidth = 200;
  const signatureFrameHeight = 100;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setError(null);
    setNumPages(numPages);
    
    (pdfjs as any).getDocument(pdfUrl).promise.then((pdf: any) => {
      pdf.getPage(pageNumber).then((page: any) => {
        const viewport = page.getViewport({ scale: 1 });
        setPageDimensions({ width: viewport.width, height: viewport.height });
      });
    }).catch((error: any) => {
      console.error('Error loading page:', error);
      setError('Failed to load page dimensions.');
    });
  }

  function onDocumentLoadError(error: Error): void {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF file. Please make sure it\'s a valid PDF.');
  }

  if (!pdfUrl) return null;

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button 
          onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
          disabled={pageNumber <= 1}
        >
          Previous
        </button>
        <span>
          Page {pageNumber} of {numPages}
        </span>
        <button 
          onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
          disabled={pageNumber >= numPages}
        >
          Next
        </button>
        <button onClick={() => setScale(prev => prev + 0.2)}>Zoom In</button>
        <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.4))}>Zoom Out</button>
      </div>
      
      <div className="pdf-container">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div>Loading PDF...</div>}
          error={error ? <div className="error">{error}</div> : null}
        >
          {numPages > 0 && (
            <div className="page-wrapper" style={{ position: 'relative' }}>
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
              
              {signaturePosition && signaturePosition.pageNumber === pageNumber && (
                <div 
                  className="signature-frame"
                  style={{
                    position: 'absolute',
                    left: `${(signaturePosition.x / pageDimensions.width) * 100}%`,
                    top: `${(signaturePosition.y / pageDimensions.height) * 100}%`,
                    width: `${(signatureFrameWidth / pageDimensions.width) * 100}%`,
                    height: `${(signatureFrameHeight / pageDimensions.height) * 100}%`,
                    border: '2px dashed #2196f3',
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)',
                    transformOrigin: 'center'
                  }}
                >
                  {signatureImage && (
                    <img 
                      src={signatureImage} 
                      alt="Signature" 
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </div>
              )}
              
              {isPlacementMode && (
                <SignaturePlacement 
                  isPlacementMode={isPlacementMode}
                  onPlaceSignature={(position) => {
                    onPlaceSignature?.({
                      x: position.x,
                      y: position.y,
                      pageNumber: pageNumber
                    });
                  }}
                  hasSignature={!!signatureImage}
                  currentPage={pageNumber}
                />
              )}
            </div>
          )}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer; 