export interface SignedPDF {
  id: string;
  originalPdfUrl: string;
  signedPdfUrl: string | null;
  signerName: string;
  status: 'pending' | 'signed';
  dateSent: string;
} 