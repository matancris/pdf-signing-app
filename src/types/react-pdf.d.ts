declare module 'react-pdf' {
  import { ComponentType, ReactElement, ReactNode } from 'react';

  interface DocumentProps {
    file: string | null;
    onLoadSuccess?: (data: { numPages: number }) => void;
    onLoadError?: (error: Error) => void;
    loading?: ReactElement;
    error?: ReactElement | null;
    children?: ReactNode;
  }

  interface PageProps {
    pageNumber: number;
    scale?: number;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
  }

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    version: string;
  };
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const content: any;
  export default content;
} 