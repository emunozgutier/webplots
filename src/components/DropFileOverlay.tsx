import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Papa from 'papaparse';
import { useCsvDataStore, type CsvDataStore } from '../store/useCsvDataStore';
import { useWorkspaceStore, workspaceRegistry } from '../store/Workspace/useWorkspaceStore';
import './DropFileOverlay.css';

export interface DropFileOverlayProps {
  onFileLoaded?: (data: CsvDataStore[], columns: string[], file: File) => void;
  onError?: (error: Error | string) => void;
  disabled?: boolean;
}

interface ErrorDetails {
  title: string;
  message: string;
  filename: string;
}

export const DropFileOverlay: React.FC<DropFileOverlayProps> = ({
  onFileLoaded,
  onError,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const dragCounter = useRef(0);
  const { setPlotData, setColumns } = useCsvDataStore();

  const isCsvFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    return (
      fileName.endsWith('.csv') ||
      mimeType === 'text/csv' ||
      mimeType === 'text/comma-separated-values' ||
      mimeType === 'application/csv' ||
      mimeType === 'application/vnd.ms-excel'
    );
  };

  const processFile = useCallback(
    (file: File) => {
      if (!isCsvFile(file)) {
        const errorInfo: ErrorDetails = {
          title: 'Unsupported File Format',
          message: `Only .csv files are supported. Please drop a valid comma-separated values file.`,
          filename: file.name,
        };
        setErrorDetails(errorInfo);
        if (onError) {
          onError(new Error(`File "${file.name}" is not a CSV file.`));
        }
        return;
      }

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as CsvDataStore[];
          if (parsedData && parsedData.length > 0) {
            setPlotData(parsedData);
            const cols = Object.keys(parsedData[0]).filter((c) => c !== '__idx');
            setColumns(cols);
            if (cols.length > 0) {
              const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspaceId;
              const activeStores = workspaceRegistry.get(activeWorkspaceId);
              if (activeStores) {
                activeStores.axisSideMenuStore.getState().setXAxis('');
              }
            }
            if (onFileLoaded) {
              onFileLoaded(parsedData, cols, file);
            }
          } else {
            const errorInfo: ErrorDetails = {
              title: 'Empty CSV File',
              message: 'The file contains no readable data rows or columns.',
              filename: file.name,
            };
            setErrorDetails(errorInfo);
            if (onError) {
              onError(new Error(errorInfo.message));
            }
          }
        },
        error: (error) => {
          const errorInfo: ErrorDetails = {
            title: 'Failed to Parse CSV',
            message: error.message || 'An unexpected error occurred while parsing the CSV file.',
            filename: file.name,
          };
          setErrorDetails(errorInfo);
          if (onError) {
            onError(error);
          }
        },
      });
    },
    [setPlotData, setColumns, onFileLoaded, onError]
  );

  useEffect(() => {
    if (disabled) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;

      // Check if drag contains files
      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        processFile(file);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [disabled, processFile]);

  return (
    <>
      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div
          className="drop-overlay-backdrop"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current = 0;
            setIsDragging(false);
            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
              processFile(e.dataTransfer.files[0]);
            }
          }}
        >
          <div className="drop-overlay-card">
            {/* Animated CSV Document Icon */}
            <div className="csv-animation-container">
              <div className="particle-ring" />
              <i className="bi bi-arrow-down-circle-fill drop-arrow-indicator" />
              
              <div className="csv-doc-wrapper">
                <div className="csv-doc-corner" />
                <div className="csv-doc-header">
                  <span>CSV</span>
                  <i className="bi bi-table" style={{ fontSize: '0.75rem' }} />
                </div>
                <div className="csv-doc-body">
                  <div className="csv-doc-row">
                    <div className="csv-cell cell-1" />
                    <div className="csv-cell cell-2" />
                    <div className="csv-cell cell-3" />
                  </div>
                  <div className="csv-doc-row">
                    <div className="csv-cell cell-2" />
                    <div className="csv-cell cell-1" />
                    <div className="csv-cell cell-3" />
                  </div>
                  <div className="csv-doc-row">
                    <div className="csv-cell cell-3" />
                    <div className="csv-cell cell-2" />
                    <div className="csv-cell cell-1" />
                  </div>
                  <div className="csv-doc-row">
                    <div className="csv-cell cell-1" />
                    <div className="csv-cell cell-3" />
                    <div className="csv-cell cell-2" />
                  </div>
                </div>
              </div>
            </div>

            <h3 className="drop-title">Drop CSV File Here</h3>
            <p className="drop-subtitle">
              Release to parse headers, data columns, and load them instantly into your workspace
            </p>

            <div className="drop-badge">
              <span className="drop-badge-dot" />
              <span>Accepts .csv</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup Modal */}
      <Modal
        show={errorDetails !== null}
        onHide={() => setErrorDetails(null)}
        centered
        className="drop-error-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-octagon-fill text-danger fs-5" />
            {errorDetails?.title || 'File Upload Error'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">{errorDetails?.message}</p>
          {errorDetails?.filename && (
            <div className="drop-error-card-badge">
              <i className="bi bi-file-earmark-x text-danger fs-4" />
              <div>
                <div className="text-secondary small fw-medium">Received file:</div>
                <span className="drop-error-filename">{errorDetails.filename}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setErrorDetails(null)}>
            Dismiss
          </Button>
          <Button variant="danger" size="sm" onClick={() => setErrorDetails(null)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DropFileOverlay;
