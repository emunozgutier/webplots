import React from 'react';
import { useAppStateStore } from '../store/AppStateStore';

const PopupMenu: React.FC = () => {
    const { popupContent, closePopup } = useAppStateStore();

    if (!popupContent) return null;

    return (
        <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
            onClick={closePopup}
        >
            <div onClick={(e) => e.stopPropagation()}>
                {popupContent}
            </div>
        </div>
    );
};

export default PopupMenu;
