// PDF Parser - Extract text from PDF files

export class PDFParser {
  /**
   * Extract text from PDF file
   * Uses PDF.js library for parsing
   */
  static async extractText(file: File): Promise<string> {
    try {
      // For now, we'll use a simple approach
      // In production, you'd use pdf.js or similar
      const arrayBuffer = await file.arrayBuffer();
      const text = await this.parsePDFBuffer(arrayBuffer);
      return text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  /**
   * Parse PDF buffer to text
   * This is a placeholder - in production use pdf.js
   */
  private static async parsePDFBuffer(_buffer: ArrayBuffer): Promise<string> {
    // TODO: Integrate pdf.js for proper PDF parsing
    // For now, return a message
    throw new Error('PDF parsing requires pdf.js library. Please use text files for now or we can integrate pdf.js.');
  }

  /**
   * Check if file is a valid PDF
   */
  static isValidPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.endsWith('.pdf');
  }
}

/**
 * Text file parser
 */
export class TextParser {
  /**
   * Extract text from text file
   */
  static async extractText(file: File): Promise<string> {
    try {
      const text = await file.text();
      return text;
    } catch (error) {
      console.error('Error reading text file:', error);
      throw new Error('Failed to read text file');
    }
  }

  /**
   * Check if file is a valid text file
   */
  static isValidText(file: File): boolean {
    return file.type === 'text/plain' || file.name.endsWith('.txt');
  }
}

/**
 * Main file parser that routes to appropriate parser
 */
export class FileParser {
  /**
   * Parse resume file and extract text
   */
  static async parse(file: File): Promise<{ text: string; format: 'text' | 'pdf' | 'docx' }> {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    // Route to appropriate parser
    if (TextParser.isValidText(file)) {
      const text = await TextParser.extractText(file);
      return { text, format: 'text' };
    } else if (PDFParser.isValidPDF(file)) {
      const text = await PDFParser.extractText(file);
      return { text, format: 'pdf' };
    } else {
      throw new Error('Unsupported file format. Please use .txt or .pdf files.');
    }
  }

  /**
   * Validate file before parsing
   */
  static validate(file: File): { valid: boolean; error?: string } {
    // Check file size
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 5MB)' };
    }

    // Check file type
    const isText = TextParser.isValidText(file);
    const isPDF = PDFParser.isValidPDF(file);

    if (!isText && !isPDF) {
      return { valid: false, error: 'Unsupported format. Use .txt or .pdf' };
    }

    return { valid: true };
  }
}
