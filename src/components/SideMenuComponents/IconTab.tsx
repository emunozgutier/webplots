import React from 'react';
import { useWindowDim } from '../../store/useWindowDim';

interface IconTabProps {
    id?: string;
    tab: string;
    activeTab: string;
    label: string;
    iconClass: string;
    onClick: () => void;
}

const IconTab: React.FC<IconTabProps> = ({
    id,
    tab,
    activeTab,
    label,
    iconClass,
    onClick
}) => {
    const isActive = activeTab === tab;
    const screenType = useWindowDim((state) => state.screenType);
    const showIcon = screenType === 'big monitor' || isActive;

    return (
        <button
            id={id || `side-menu-btn-${tab}`}
            className={`btn btn-sm w-100 mb-2 p-2 ${isActive ? 'btn-primary' : 'btn-light text-secondary'} border-0 rounded-0 rounded-start`}
            onClick={onClick}
            title={label}
            style={{ borderRadius: '4px 0 0 4px', position: 'relative', right: '-1px' }}
        >
            <div className="d-flex flex-column align-items-center">
                {showIcon && <i className={`bi ${iconClass} fs-5`}></i>}
                <span style={{ 
                    fontSize: '0.65rem', 
                    marginTop: showIcon ? '2px' : '0px', 
                    textAlign: 'center', 
                    lineHeight: '1.1' 
                }}>
                    {label}
                </span>
            </div>
        </button>
    );
};

export default IconTab;
