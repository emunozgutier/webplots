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
    const [aspectRatio, setAspectRatio] = useState<'original' | 'landscape' | 'portrait'>('original');
    const [portraitMode, setPortraitMode] = useState<'fit' | 'stretch'>('fit');
    
    const [isPreRendering, setIsPreRendering] = useState(true);
    const [preRenderProgress, setPreRenderProgress] = useState(0);
    const [latestPreRenderFrame, setLatestPreRenderFrame] = useState<string | null>(null);
    const [preRenderedData, setPreRenderedData] = useState<{frames: string[], width: number, height: number} | null>(null);

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (show) {
            let isCancelled = false;
            setIsPreRendering(true);
            setPreRenderProgress(0);
            setLatestPreRenderFrame(null);
            setError(null);

            let targetWidth: number | undefined;
            let targetHeight: number | undefined;
            if (aspectRatio === 'landscape') { targetWidth = 1920; targetHeight = 1080; }
            else if (aspectRatio === 'portrait') { targetWidth = 1080; targetHeight = 1920; }

            VideoExporter.preRenderFrames({
                uniqueValues,
                setAnimationValue,
                targetWidth,
                targetHeight,
                portraitMode,
                onProgress: (p, frame) => {
                    if (isCancelled) return;
                    setPreRenderProgress(p);
                    if (frame) setLatestPreRenderFrame(frame);
                }
            }).then(data => {
                if (isCancelled) return;
                setPreRenderedData(data);
                setIsPreRendering(false);
            }).catch(err => {
                if (isCancelled) return;
                console.error("Pre-render error", err);
                setError(err.message || 'Error occurred while pre-rendering frames.');
                setIsPreRendering(false);
            });
            
            return () => { isCancelled = true; };
        }
    }, [show, uniqueValues, setAnimationValue, aspectRatio, portraitMode]);

    const [previewFrameIndex, setPreviewFrameIndex] = useState(0);

    useEffect(() => {
        if (!isPreRendering && preRenderedData && preRenderedData.frames.length > 0) {
            const intervalMs = (duration * 1000) / preRenderedData.frames.length;
            const timer = setInterval(() => {
                setPreviewFrameIndex(prev => (prev + 1) % preRenderedData.frames.length);
            }, intervalMs);
            return () => clearInterval(timer);
        }
    }, [isPreRendering, preRenderedData, duration]);

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
        <Modal show={show} onHide={isExporting ? undefined : onHide} centered>
            <Modal.Header closeButton={!isExporting}>
                <Modal.Title>Save as Video</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger p-2 mb-3 small">{error}</div>}

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

                <div className="row">
                    <div className="col-md-6">
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
                    </div>
                    <div className="col-md-6">
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small mb-1">Aspect Ratio</Form.Label>
                            <Form.Select 
                                value={aspectRatio} 
                                onChange={(e) => setAspectRatio(e.target.value as 'original' | 'landscape' | 'portrait')}
                                disabled={isExporting}
                            >
                                <option value="original">Match Plot Size</option>
                                <option value="landscape">Landscape (1920x1080)</option>
                                <option value="portrait">Portrait (1080x1920)</option>
                            </Form.Select>
                        </Form.Group>
                        {aspectRatio === 'portrait' && (
                            <Form.Check 
                                type="switch"
                                id="portrait-stretch-switch"
                                label={<span className="small text-muted">Stretch axes to fill (No letterbox)</span>}
                                checked={portraitMode === 'stretch'}
                                onChange={(e) => setPortraitMode(e.target.checked ? 'stretch' : 'fit')}
                                disabled={isExporting}
                            />
                        )}
                    </div>
                </div>
                
                {isPreRendering ? (
                    <div className="text-center p-3 border rounded bg-light">
                        {latestPreRenderFrame && (
                            <div className="mb-3 border rounded overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
                                <img src={latestPreRenderFrame} alt="Rendering frame" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                            </div>
                        )}
                        <p className="fw-bold mb-2">Pre-rendering animation frames...</p>
                        <ProgressBar animated now={preRenderProgress} label={`${preRenderProgress}%`} />
                        <p className="text-muted mt-3 small mb-0">Please wait while we cache the frames. This ensures a fast, high-quality export.</p>
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

                        {preRenderedData && preRenderedData.frames.length > 0 && (
                            <div className="border rounded overflow-hidden mb-3 text-center bg-dark" style={{ position: 'relative', width: '100%', paddingTop: `${(preRenderedData.height / preRenderedData.width) * 100}%` }}>
                                <img 
                                    src={preRenderedData.frames[previewFrameIndex]} 
                                    alt="Preview" 
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                                <div className="position-absolute top-0 start-0 p-1 m-2 bg-dark bg-opacity-75 text-white rounded small" style={{ fontSize: '0.7rem' }}>
                                    Preview ({duration}s Target)
                                </div>
                            </div>
                        )}

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
                <Button variant="secondary" onClick={onHide} disabled={isExporting}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleExport} disabled={isExporting || isPreRendering || !preRenderedData}>
                    {isExporting ? 'Encoding...' : 'Export Video'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
