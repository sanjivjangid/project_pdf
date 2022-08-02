import React, { useState, useEffect, useRef } from "react";

// worker file location
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry.js';

import "../App.css";

/**
 * PDFJS resources 
 * install: https://github.com/mozilla/pdf.js/wiki/Setup-pdf.js-in-a-website
 * github: https://github.com/mozilla/pdf.js
 * 
 */


const Home = (props) => {
  // file
  const [file, setFile] = useState('');
  const [fileData, setFileData] = useState('');

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageNumPending, setPageNumPending] = useState(null);

  const canvasRef = useRef(null);


  const handleChangeFile = e => {
    console.log(e);
    setFile(e.target.value);
    setFileData(e.target.files[0]);
  };

  const readFile = (file) => {
    // reset previous
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPdfDoc(null);
    setPageNum(0);
    setPageCount(0);

    //read new
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const result = event.target.result;
      console.log('result ** ', result);

      // render 
      loadPdf({data: result});
    });
  
    reader.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percent = (event.loaded / event.total) * 100;
        console.log(`Progress: ${Math.round(percent)}`);
      }
    });
    reader.readAsArrayBuffer(fileData);
  }

  const handleViewFile = () => {
    console.log('handle view pdf', file);
    if (file) {
      readFile(file);
    } else {
      alert('please select file to view');
    }
  };


  /**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
  const renderPage = (num) => {
    setPageRendering(true);
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
      const viewport = page.getViewport({ scale: 0.8 });

      // Prepare canvas using PDF page dimensions
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      var renderTask = page.render(renderContext);

      // Wait for rendering to finish
      renderTask.promise.then(function () {
        setPageRendering(false);
        if (pageNumPending !== null) {
          // New page rendering is pending
          renderPage(pageNumPending);
          setPageNumPending(null);
        }
      });
    });
  };

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
 const queueRenderPage = (num) => {
    if (pageRendering) {
      setPageNumPending(num);
    } else {
      renderPage(num);
    }
  }

  /**
 * Displays previous page.
 */
  const onPrevPage = () => {
    if (pageNum <= 1) {
      return;
    }

    setPageNum(pageNum - 1);
    // queueRenderPage(pageNum);
  }

  /**
 * Displays next page.
 */
  const onNextPage = () => {
    if (pageNum >= pdfDoc.numPages) {
      return;
    }
    setPageNum(pageNum + 1)
    // queueRenderPage(pageNum);
  }

  const loadPdf = (file) => {
    const pdfjsLib = require('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    pdfjsLib.getDocument(file).promise.then(function (pdfDoc_) {
      setPdfDoc(pdfDoc_);
      setPageCount(pdfDoc_.numPages);

      // Initial/first page rendering
      setPageNum(1);
    });
  };

  useEffect(() => {
    if (pdfDoc) {
      queueRenderPage(pageNum);
    }
  
  }, [pageNum]);


  return (
    <div className="home">
      <div className="controls">
        Upload Pdf: 
        <input type="file" value={file} onChange={handleChangeFile} />
        <button onClick={handleViewFile}>View selected Pdf</button>
      </div>
      <div className="pdfControls">
        <span>
          Page: {pageNum} / {pageCount}
        </span>{" "}
        <span>
          <button onClick={onPrevPage} disabled={pageRendering}>Prev.</button>
          <button onClick={onNextPage} disabled={pageRendering}>Next</button>
        </span>
      </div>
      <canvas className="pdfContainer" id="pdfContainer" ref={canvasRef}></canvas>
    </div>
  );
};

export default Home;
