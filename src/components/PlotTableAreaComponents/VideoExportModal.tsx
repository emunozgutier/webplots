import React, { useState, useEffect } from 'react';
import { Modal, Button, ProgressBar, Form } from 'react-bootstrap';
import { VideoExporter } from '../../utils/VideoExporter';

interface VideoExportModalProps {
    show: boolean;
    onHide: () => void;
    uniqueValues: (string | number)[];
    setAnimationValue: (val: string | number) => void;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({ show, onHide, uniqueValues, setAnimationValue }) => {
    const [duration, setDuration] = useState<number>(5);
    const [format, setFormat] = useState<'webm' | 'mp4'>('webm');
    
    const [isPreRendering, setIsPreRendering] = useState(true);
    const [preRenderProgress, setPreRenderProgress] = useState(0);
    const [preRenderedData, setPreRenderedData] = useState<{frames: string[], width: number, height: number} | null>(null);

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (show) {
            setIsPreRendering(true);
            setPreRenderProgress(0);
            setError(null);

            VideoExporter.preRenderFrames({
                uniqueValues,
                setAnimationValue,
                onProgress: setPreRenderProgress
            }).then(data => {
                setPreRenderedData(data);
                setIsPreRendering(false);
            }).catch(err => {
                console.error("Pre-render error", err);
                setError(err.message || 'Error occurred while pre-rendering frames.');
                setIsPreRendering(false);
            });
        }
    }, [show, uniqueValues, setAnimationValue]);

    const handleExport = async () => {
        if (!preRenderedData) return;
        setIsExporting(true);
        setExportProgress(0);
        setError(null);

        try {
            const blob = await VideoExporter.encodeVideo({
                format,
                durationSec: duration,
                preRenderedFrames: preRenderedData.frames,
                width: preRenderedData.width,
                height: preRenderedData.height,
                onProgress: setExportProgress
            });

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `animation_export.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Clean up and close
            setTimeout(() => {
                setIsExporting(false);
                setExportProgress(0);
                onHide();
            }, 500);
        } catch (err: any) {
            console.error('Export failed:', err);
            setError(err.message || 'An error occurred during export.');
            setIsExporting(false);
        }
    };

    return (
        <Modal show={show} onHide={(isExporting || isPreRendering) ? undefined : onHide} centered>
            <Modal.Header closeButton={!(isExporting || isPreRendering)}>
                <Modal.Title>Save as Video</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger p-2 mb-3 small">{error}</div>}
                
                {isPreRendering ? (
                    <div className="text-center p-4">
                        <p className="fw-bold mb-2">Pre-rendering animation frames...</p>
                        <ProgressBar animated now={preRenderProgress} label={`${preRenderProgress}%`} />
                        <p className="text-muted mt-3 small">Please wait while we cache the frames. This ensures a fast, high-quality export.</p>
                    </div>
                ) : (
                    <>
                        <div className="alert alert-success p-2 mb-3 small d-flex align-items-center">
                            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                            <div>
                                <strong>Ready to Export!</strong><br/>
                                {preRenderedData?.frames.length} frames pre-rendered.
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small mb-1">Target Duration (seconds)</Form.Label>
                            <Form.Control 
                                type="number" 
                                min={1} 
                                max={60} 
                                value={duration} 
                                onChange={(e) => setDuration(Number(e.target.value))} 
                                disabled={isExporting}
                            />
                            <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                                All {uniqueValues.length} frames will be spaced evenly to complete the animation exactly in this time.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small mb-1">Format</Form.Label>
                            <Form.Select 
                                value={format} 
                                onChange={(e) => setFormat(e.target.value as 'webm' | 'mp4')}
                                disabled={isExporting}
                            >
                                <option value="webm">WebM (VP9, High Quality)</option>
                                <option value="mp4">MP4 (H.264, Better Compatibility)</option>
                            </Form.Select>
                        </Form.Group>

                        {isExporting && (
                            <div className="mt-4 text-center">
                                <p className="small text-muted fw-bold mb-1">Encoding Video...</p>
                                <ProgressBar animated variant="success" now={exportProgress} label={`${exportProgress}%`} />
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isExporting || isPreRendering}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleExport} disabled={isExporting || isPreRendering || !preRenderedData}>
                    {isExporting ? 'Encoding...' : 'Export Video'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
