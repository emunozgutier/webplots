import React, { useState, useRef, useEffect } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface CloseButtonProps {
    onClose: () => void;
    title?: string;
    className?: string;
    colorClass?: string;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClose, title = "Hold 2s to Remove", className = "", colorClass = "danger" }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (deleteTimerRef.current) {
                clearTimeout(deleteTimerRef.current);
            }
        };
    }, []);

    const startDelete = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        setShowTooltip(false);
        deleteTimerRef.current = setTimeout(() => {
            onClose();
        }, 2000);
    };

    const cancelDelete = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (deleteTimerRef.current) {
            clearTimeout(deleteTimerRef.current);
            deleteTimerRef.current = null;
        }
        setIsDeleting(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // If we just clicked, it means we didn't hold long enough.
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
    };

    return (
        <OverlayTrigger
            placement="top"
            show={showTooltip}
            overlay={<Tooltip id="button-tooltip">Hold to close</Tooltip>}
        >
            <button
                className={`btn btn-sm btn-link text-${colorClass} p-0 ms-1 position-relative overflow-hidden d-flex align-items-center justify-content-center ${className}`}
                style={{ textDecoration: 'none', fontSize: '1.2rem', lineHeight: '1', width: '22px', height: '22px', borderRadius: '4px' }}
                onMouseDown={startDelete}
                onMouseUp={cancelDelete}
                onMouseLeave={cancelDelete}
                onTouchStart={startDelete}
                onTouchEnd={cancelDelete}
                onClick={handleClick}
                title={title}
            >
                <div 
                    className={`bg-${colorClass} position-absolute top-0 start-0 h-100`}
                    style={{ 
                        width: isDeleting ? '100%' : '0%', 
                        transition: isDeleting ? 'width 2s linear' : 'width 0.2s ease-out',
                        opacity: 0.2,
                    }} 
                />
                <span className="position-relative" style={{ zIndex: 1, marginTop: '-2px' }}>&times;</span>
            </button>
        </OverlayTrigger>
    );
};

export default CloseButton;
