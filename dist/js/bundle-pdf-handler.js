(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // pdf-handler.js
  (function() {
    "use strict";
    console.log("Q-SCI PDF Handler: Initializing...");
    async function downloadPDF(pdfUrl) {
      console.log("Q-SCI PDF Handler: Downloading PDF from:", pdfUrl);
      if (pdfUrl.startsWith("file://")) {
        console.warn("Q-SCI PDF Handler: Skipping file:// URL (not supported):", pdfUrl);
        throw new Error("Local file URLs (file://) are not supported for security reasons");
      }
      try {
        const response = await chrome.runtime.sendMessage({
          type: "DOWNLOAD_PDF",
          url: pdfUrl
        });
        if (!response.success) {
          throw new Error(response.error || "Failed to download PDF");
        }
        const binary = atob(response.data);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const arrayBuffer = bytes.buffer;
        console.log("Q-SCI PDF Handler: PDF downloaded successfully, size:", arrayBuffer.byteLength, "bytes");
        return arrayBuffer;
      } catch (error) {
        console.error("Q-SCI PDF Handler: Error downloading PDF:", error);
        throw new Error(`Failed to download PDF: ${error.message}`);
      }
    }
    async function extractTextFromPDF(pdfData) {
      console.log("Q-SCI PDF Handler: Extracting text from PDF...");
      try {
        const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        const loadingTask = pdfjsLib.getDocument({
          data: pdfData,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true
        });
        const pdf = await loadingTask.promise;
        console.log("Q-SCI PDF Handler: PDF loaded, pages:", pdf.numPages);
        let fullText = "";
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            fullText += pageText + "\n\n";
            console.log(`Q-SCI PDF Handler: Extracted text from page ${pageNum}/${pdf.numPages} (${pageText.length} chars)`);
          } catch (pageError) {
            console.warn(`Q-SCI PDF Handler: Error extracting text from page ${pageNum}:`, pageError);
          }
        }
        console.log("Q-SCI PDF Handler: Text extraction complete, total length:", fullText.length);
        return fullText.trim();
      } catch (error) {
        console.error("Q-SCI PDF Handler: Error extracting text from PDF:", error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }
    }
    async function tryDownloadAndExtractPDF(pdfUrls) {
      console.log("Q-SCI PDF Handler: Attempting to download and extract PDF...");
      console.log("Q-SCI PDF Handler: PDF URLs to try:", pdfUrls.length);
      if (!pdfUrls || pdfUrls.length === 0) {
        return {
          success: false,
          error: "No PDF URLs found"
        };
      }
      const validUrls = pdfUrls.filter((url) => {
        if (url.startsWith("file://")) {
          console.warn("Q-SCI PDF Handler: Skipping file:// URL:", url);
          return false;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          console.warn("Q-SCI PDF Handler: Skipping unsupported protocol:", url);
          return false;
        }
        return true;
      });
      if (validUrls.length === 0) {
        return {
          success: false,
          error: "No valid HTTP(S) PDF URLs found (file:// URLs are not supported)"
        };
      }
      console.log("Q-SCI PDF Handler: Valid PDF URLs to try:", validUrls.length);
      for (let i = 0; i < validUrls.length; i++) {
        const pdfUrl = validUrls[i];
        console.log(`Q-SCI PDF Handler: Trying PDF URL ${i + 1}/${validUrls.length}:`, pdfUrl);
        try {
          const pdfData = await downloadPDF(pdfUrl);
          const text = await extractTextFromPDF(pdfData);
          if (text && text.length > 100) {
            console.log("Q-SCI PDF Handler: Successfully extracted text from PDF:", text.length, "characters");
            return {
              success: true,
              text,
              pdfUrl
            };
          } else {
            console.warn("Q-SCI PDF Handler: PDF text too short or empty, trying next URL");
          }
        } catch (error) {
          console.warn(`Q-SCI PDF Handler: Failed to process PDF from ${pdfUrl}:`, error.message);
        }
      }
      return {
        success: false,
        error: "Failed to download or extract text from any PDF URL"
      };
    }
    window.QSCIPDFHandler = {
      tryDownloadAndExtractPDF,
      downloadPDF,
      extractTextFromPDF
    };
    console.log("Q-SCI PDF Handler: Initialized successfully");
  })();
})();
//# sourceMappingURL=bundle-pdf-handler.js.map
