import { ScanResult, ChunkData } from './types';

self.onmessage = (e: MessageEvent<ChunkData>) => {
  const { buffer, offset, minLength, searchPattern, extractBytes } = e.data;
  const view = new Uint8Array(buffer);
  const results: ScanResult[] = [];
  
  const isAllowed = (char: number) => {
    return (
      (char >= 97 && char <= 122) ||
      (char >= 65 && char <= 90) ||
      (char >= 48 && char <= 57) ||
      char === 95 || char === 47 || char === 45 || char === 58
    );
  };

  const getBytesAt = (idx: number, length: number = 16) => {
    const bytes: string[] = [];
    for (let i = idx; i < Math.min(idx + length, view.length); i++) {
      bytes.push(view[i].toString(16).padStart(2, '0').toUpperCase());
    }
    return bytes.join(' ');
  };

  // Pattern Scanning Logic
  if (searchPattern) {
    const patternParts = searchPattern.trim().split(/\s+/);
    const patternLen = patternParts.length;
    
    for (let i = 0; i <= view.length - patternLen; i++) {
      let match = true;
      for (let j = 0; j < patternLen; j++) {
        const part = patternParts[j];
        if (part === '??' || part === '?') continue;
        const byte = parseInt(part, 16);
        if (view[i + j] !== byte) {
          match = false;
          break;
        }
      }
      
      if (match) {
        const finalOffset = offset + i;
        results.push({
          text: `Pattern Match: ${searchPattern}`,
          offset: finalOffset,
          hexOffset: '0x' + finalOffset.toString(16).toUpperCase(),
          id: `pattern-${finalOffset}`,
          bytes: getBytesAt(i, 32),
          length: patternLen
        });
      }
    }
  } else {
    // String Extraction Logic
    let currentString = '';
    let startOffset = -1;

    for (let i = 0; i < view.length; i++) {
      const char = view[i];
      if (isAllowed(char)) {
        if (currentString === '') {
          startOffset = i;
        }
        currentString += String.fromCharCode(char);
      } else {
        if (currentString.length >= minLength) {
          const finalOffset = offset + startOffset;
          results.push({
            text: currentString,
            offset: finalOffset,
            hexOffset: '0x' + finalOffset.toString(16).toUpperCase(),
            id: `${finalOffset}-${currentString}`,
            bytes: extractBytes ? getBytesAt(startOffset, 32) : undefined,
            length: currentString.length
          });
        }
        currentString = '';
        startOffset = -1;
      }
    }

    if (currentString.length >= minLength) {
      const finalOffset = offset + startOffset;
      results.push({
        text: currentString,
        offset: finalOffset,
        hexOffset: '0x' + finalOffset.toString(16).toUpperCase(),
        id: `${finalOffset}-${currentString}`,
        bytes: extractBytes ? getBytesAt(startOffset, 32) : undefined,
        length: currentString.length
      });
    }
  }

  self.postMessage(results);
};
