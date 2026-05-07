import React from 'react';
import { useGroupSideMenuStore } from '../../../store/SideMenu/useGroupSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import GroupElementSettings from './GroupElementSettings';
import CloseButton from './CloseButton';

interface GroupElementProps {
    column: string;
}

const GroupElement: React.FC<GroupElementProps> = ({ column }) => {
    const { setGroupAxis } = useGroupSideMenuStore();
    const { setPopupContent } = useWorkspaceLocalStore();

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
                            onClick={(e) => { e.stopPropagation(); setPopupContent(<GroupElementSettings column={column} />); }}
                            style={{ textDecoration: 'none' }}
                            title="Advanced Settings"
                        >
                            <i className="bi bi-gear-fill" style={{ fontSize: '0.8rem' }}></i>
                        </button>
                        <CloseButton 
                            onClose={() => setGroupAxis(null)} 
                            title="Hold 2s to Remove Group" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupElement;
