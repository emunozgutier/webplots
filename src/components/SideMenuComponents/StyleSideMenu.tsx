import React from 'react';
import { useStyleSideMenuStore } from '../../store/SideMenu/useStyleSideMenuStore';
import { useWorkspaceStore } from '../../store/Workspace/useWorkspaceStore';
import StyleElement from './subcomponents/StyleElement';

const StyleSideMenu: React.FC = () => {

    const { colorData, setHue, setSaturation, setLightness, setSize } = useStyleSideMenuStore();
    const { isDebugMode } = useWorkspaceStore();

    return (
        <div className="p-3 w-100" style={{ height: '100%', overflowY: 'auto' }}>
            <h5 className="mb-3">Color & Style Configuration</h5>
            <p className="text-muted small mb-4">
                Map data values to visual aesthetics or set fixed manual properties. Traces dynamically rebuild based on these rules.
            </p>

            <StyleElement title="Hue/Color" mapping={colorData.hue} updateFn={setHue} type="number" />
            {isDebugMode && (
                <div title="Debug Feature: Adjusts saturation levels. Requires deeper understanding of HSL color space.">
                    <StyleElement title="Saturation" mapping={colorData.saturation} updateFn={setSaturation} type="number" />
                </div>
            )}
            <StyleElement title="Lightness" mapping={colorData.lightness} updateFn={setLightness} type="number" />
            <StyleElement title="Node Size" mapping={colorData.size} updateFn={setSize} type="number" />

        </div>
    );
};

export default StyleSideMenu;
