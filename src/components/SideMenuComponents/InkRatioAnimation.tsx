import React from 'react';

const InkRatioAnimation: React.FC = () => {
    return (
        <div className="mb-4 d-flex flex-column align-items-center bg-light p-3 rounded">
            <style>
                {`
                    @keyframes moveB {
                        0%   { transform: translateX(15px); opacity: 1; }
                        25%  { transform: translateX(40px); opacity: 1; }
                        50%  { transform: translateX(65px); opacity: 1; }
                        75%  { transform: translateX(90px); opacity: 1; }
                        100% { transform: translateX(0px); opacity: 0; }
                    }

                    @keyframes moveC {
                        0%   { transform: translateX(5px); }    /* C is at B (-10) -> 15 - 10 = 5 */
                        25%  { transform: translateX(55px); }   /* C is at B (+15) -> 40 + 15 = 55 */
                        50%  { transform: translateX(105px); }  /* C is at B (+40) -> 65 + 40 = 105 */
                        75%  { transform: translateX(155px); }  /* C is at B (+65) -> 90 + 65 = 155 */
                        100% { transform: translateX(90px); }   /* C is at B (+90) -> 0 + 90 = 90 */
                    }
                `}
            </style>
            <div style={{ width: '200px', height: '80px', position: 'relative' }}>
                <svg width="200" height="80">
                    <g fill="#0d6efd" opacity="0.8">
                        {/* Point A (Fixed base point) */}
                        <circle cx="20" cy="40" r="15" />

                        {/* Point B */}
                        <circle
                            cx="20" cy="40" r="15"
                            style={{ animation: 'moveB 6s infinite alternate ease-in-out' }}
                        />

                        {/* Point C */}
                        <circle
                            cx="20" cy="40" r="15"
                            style={{ animation: 'moveC 6s infinite alternate ease-in-out' }}
                        />
                    </g>
                </svg>

                {/* Label */}
                <div className="text-center small text-muted mt-1" style={{ fontSize: '0.7em' }}>
                    Filtering Threshold Animation
                </div>
            </div>
        </div>
    );
};

export default InkRatioAnimation;
