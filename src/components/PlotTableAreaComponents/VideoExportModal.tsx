import React, { useState } from 'react';
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
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        setProgress(0);
        setError(null);

        try {
            const blob = await VideoExporter.exportVideo({
                format,
                durationSec: duration,
                uniqueValues,
                setAnimationValue,
                onProgress: setProgress
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
                setProgress(0);
                onHide();
            }, 1000);
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
                        <p className="small text-muted fw-bold mb-1">Rendering Frames...</p>
                        <ProgressBar animated now={progress} label={`${progress}%`} />
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isExporting}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'Exporting...' : 'Start Export'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
