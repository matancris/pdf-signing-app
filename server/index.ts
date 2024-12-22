const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
import { Request, Response } from 'express';

interface PDFData {
  pdfUrl: string;
  signaturePosition?: { x: number; y: number };
  signatureImage?: string;
  pdfDimensions?: { width: number; height: number };
  status: 'pending' | 'signed';
}

interface StoredData {
  pdfs: {
    [key: string]: PDFData & {
      id: string;
      originalPdfUrl: string;
      signedPdfUrl: string | null;
      signerName: string;
      dateSent: string;
    };
  };
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));

const STORAGE_FILE = path.join(__dirname, 'pdf-store.json');

// Initialize storage file if it doesn't exist
if (!fs.existsSync(STORAGE_FILE)) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({ pdfs: {} }), 'utf8');
    console.log('Created new storage file at:', STORAGE_FILE);
  } catch (error) {
    console.error('Failed to create storage file:', error);
    process.exit(1);
  }
}

// Routes
app.get('/api/pdf-data/list', (req: Request, res: Response) => {
  try {
    console.log('Loading PDF list...');
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8')) as StoredData;
    const pdfs = Object.values(data.pdfs).map(pdf => ({
      id: pdf.id,
      originalPdfUrl: pdf.pdfUrl,
      signedPdfUrl: pdf.signatureImage ? pdf.pdfUrl : null,
      signerName: pdf.signerName || '',
      status: pdf.status,
      dateSent: pdf.dateSent
    }));
    console.log('Returning PDFs:', pdfs);
    res.json(pdfs);
  } catch (error) {
    console.error('Error loading PDF list:', error);
    res.status(500).json({ message: 'Failed to load PDF list' });
  }
});

app.post('/api/pdf-data', (req: Request, res: Response) => {
  try {
    const { documentId, data } = req.body;
    const storedData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8')) as StoredData;
    
    storedData.pdfs[documentId] = {
      ...data,
      id: documentId,
      originalPdfUrl: data.pdfUrl,
      signedPdfUrl: null,
      signerName: data.signerName || '',
      dateSent: new Date().toISOString(),
      pdfDimensions: data.pdfDimensions
    };

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storedData, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error storing PDF:', error);
    res.status(500).json({ message: 'Failed to store PDF' });
  }
});

app.get('/api/pdf-data/:documentId', (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8')) as StoredData;
    const pdf = data.pdfs[documentId];
    
    if (!pdf) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json(pdf);
  } catch (error) {
    console.error('Error retrieving PDF:', error);
    res.status(500).json({ message: 'Failed to retrieve PDF' });
  }
});

app.post('/api/pdf-data/:documentId/sign', (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const { signatureImage, signaturePosition, pdfDimensions } = req.body;
    
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8')) as StoredData;
    if (!data.pdfs[documentId]) {
      return res.status(404).json({ message: 'Document not found' });
    }

    data.pdfs[documentId] = {
      ...data.pdfs[documentId],
      signatureImage,
      signaturePosition,
      pdfDimensions,
      status: 'signed' as const
    };

    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error signing PDF:', error);
    res.status(500).json({ message: 'Failed to sign PDF' });
  }
});

app.delete('/api/pdf-data/:documentId', (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8')) as StoredData;
    
    if (!data.pdfs[documentId]) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (data.pdfs[documentId].status === 'signed') {
      return res.status(400).json({ message: 'Cannot delete signed documents' });
    }

    delete data.pdfs[documentId];
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ message: 'Failed to delete PDF' });
  }
});

// Update cleanup endpoint
app.post('/api/cleanup', (req: Request, res: Response) => {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({ pdfs: {} }), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({ message: 'Cleanup failed' });
  }
});

// Add error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Storage file location:', STORAGE_FILE);
});