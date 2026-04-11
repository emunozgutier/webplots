import React, { useState } from 'react';
import { useGroupSideMenuStore } from '../../../store/SideMenu/useGroupSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import GroupAxisSettings from './GroupAxisSettings';

interface GroupElementProps {
    column: string;
}

const GroupElement: React.FC<GroupElementProps> = ({ column }) => {
    const { setGroupAxis } = useGroupSideMenuStore();
    const { setPopupContent } = useWorkspaceLocalStore();
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        return () => {
            if (deleteTimerRef.current) {
                clearTimeout(deleteTimerRef.current);
            }
        };
    }, []);

    const startDelete = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setIsDeleting(true);
        deleteTimerRef.current = setTimeout(() => {
            setGroupAxis(null);
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

    return (
        <div className="card shadow-sm border-0 w-100 p-2">
            <div className="card-header bg-white p-1 ps-2 pe-1">
                <div className="d-flex justify-content-between align-items-center mb-0">
                    <div className="overflow-hidden me-2">
                        <span className="fw-bold text-truncate d-block" style={{ maxWidth: '100%', fontSize: '0.85rem' }} title={column}>
                            {column}
                        </span>
                    </div>
                    <div className="d-flex align-items-center flex-shrink-0">
                        <button
                            className="btn btn-sm btn-link p-0 me-2 text-primary"
                            onClick={(e) => { e.stopPropagation(); setPopupContent(<GroupAxisSettings column={column} />); }}
                            style={{ textDecoration: 'none' }}
                            title="Advanced Settings"
                        >
                            <i className="bi bi-gear-fill" style={{ fontSize: '0.8rem' }}></i>
                        </button>
                        <button
                            className="btn btn-sm btn-link text-danger p-0 ms-1 position-relative overflow-hidden d-flex align-items-center justify-content-center"
                            style={{ textDecoration: 'none', fontSize: '1.2rem', lineHeight: '1', width: '22px', height: '22px', borderRadius: '4px' }}
                            onMouseDown={startDelete}
                            onMouseUp={cancelDelete}
                            onMouseLeave={cancelDelete}
                            onTouchStart={startDelete}
                            onTouchEnd={cancelDelete}
                            onClick={(e) => e.stopPropagation()}
                            title="Hold 2s to Remove Group"
                        >
                            <div 
                                className="bg-danger position-absolute top-0 start-0 h-100" 
                                style={{ 
                                    width: isDeleting ? '100%' : '0%', 
                                    transition: isDeleting ? 'width 2s linear' : 'width 0.2s ease-out',
                                    opacity: 0.2,
                                }} 
                            />
                            <span className="position-relative" style={{ zIndex: 1, marginTop: '-2px' }}>&times;</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupElement;
