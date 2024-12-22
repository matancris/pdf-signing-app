import { SignedPDF } from '../types/types';

interface PDFData {
  pdfUrl: string;
  signaturePosition?: { x: number; y: number, pageNumber: number };
  signatureImage?: string;
  pdfDimensions?: { width: number; height: number };
  status?: 'pending' | 'signed';
}

const API_BASE_URL = 'http://localhost:3000';

export const storePDFData = async (documentId: string, data: PDFData): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId, data }),
    });

    if (!response.ok) throw new Error('Failed to store PDF data');
    return true;
  } catch (error) {
    console.error('Error storing PDF data:', error);
    return false;
  }
};

export const getPDFData = async (documentId: string): Promise<PDFData | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-data/${documentId}`);
    if (!response.ok) {
      if (response.status === 404) return undefined;
      throw new Error('Failed to fetch PDF data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting PDF data:', error);
    return undefined;
  }
};

export const submitSignedPDF = async (
  documentId: string, 
  signatureImage: string,
  pdfDimensions: { width: number; height: number },
  signaturePosition: { x: number; y: number; pageNumber: number }
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-data/${documentId}/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        signatureImage,
        pdfDimensions,
        signaturePosition
      }),
    });

    if (!response.ok) throw new Error('Failed to submit signed PDF');
    return true;
  } catch (error) {
    console.error('Error submitting signed PDF:', error);
    return false;
  }
};

export const deletePDFData = async (documentId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-data/${documentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete PDF data');
    return true;
  } catch (error) {
    console.error('Error deleting PDF data:', error);
    return false;
  }
};

export const cleanupPDFData = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cleanup`, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error('Cleanup failed');
    return true;
  } catch (error) {
    console.error('Error during cleanup:', error);
    return false;
  }
};

export const getPDFList = async (): Promise<SignedPDF[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf-data/list`);
    if (!response.ok) throw new Error('Failed to fetch PDF list');
    return await response.json();
  } catch (error) {
    console.error('Error getting PDF list:', error);
    return [];
  }
}; 