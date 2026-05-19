import { Output, Mp4OutputFormat, WebMOutputFormat, BufferTarget, CanvasSource } from 'mediabunny';

export interface PreRenderOptions {
    uniqueValues: (string | number)[];
    setAnimationValue: (val: string | number) => void;
    onProgress: (progress: number, latestFrame?: string) => boolean | void;
    targetWidth?: number;
    targetHeight?: number;
    portraitMode?: 'fit' | 'stretch';
}

export interface EncodeOptions {
    format: 'webm' | 'mp4';
    durationSec: number;
    preRenderedFrames: string[];
    width: number;
    height: number;
    onProgress: (progress: number) => void;
}

export class VideoExporter {
    static async preRenderFrames(options: PreRenderOptions): Promise<{ frames: string[], width: number, height: number }> {
        const { uniqueValues, setAnimationValue, onProgress, targetWidth, targetHeight, portraitMode } = options;

        if (uniqueValues.length === 0) {
            throw new Error("No frames to export");
        }

        const gd = document.querySelector('.js-plotly-plot') as HTMLElement;
        if (!gd) {
            throw new Error("Plotly element not found");
        }

        let rawWidth = targetWidth || gd.clientWidth;
        let rawHeight = targetHeight || gd.clientHeight;

        const width = rawWidth % 2 === 0 ? rawWidth : rawWidth - 1;
        const height = rawHeight % 2 === 0 ? rawHeight : rawHeight - 1;

        let renderWidth = width;
        let renderHeight = height;

        if (portraitMode === 'fit' && width === 1080 && height === 1920) {
            renderHeight = Math.round(1080 * (gd.clientHeight / gd.clientWidth));
            renderHeight = renderHeight % 2 === 0 ? renderHeight : renderHeight - 1;
        }

        const frames: string[] = [];
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        for (let i = 0; i < uniqueValues.length; i++) {
            setAnimationValue(uniqueValues[i]);
            await delay(300);

            const Plotly = (window as any).Plotly;
            if (!Plotly) throw new Error("Plotly not found on window");

            const dataUrl = await Plotly.toImage(gd, { format: 'webp', width: renderWidth, height: renderHeight });

            let finalDataUrl = dataUrl;

            if (portraitMode === 'fit' && width === 1080 && height === 1920) {
                const img = new Image();
                img.src = dataUrl;
                await new Promise(r => { img.onload = r; img.onerror = r; });
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    const y = (height - renderHeight) / 2;
                    ctx.drawImage(img, 0, y, renderWidth, renderHeight);
                    finalDataUrl = canvas.toDataURL('image/webp');
                }
            }

            frames.push(finalDataUrl);
            const shouldContinue = onProgress(Math.round(((i + 1) / uniqueValues.length) * 100), finalDataUrl);
            if (shouldContinue === false) {
                throw new Error("Pre-rendering cancelled by user");
            }
        }

        return { frames, width, height };
    }

    static async encodeVideo(options: EncodeOptions): Promise<Blob> {
        const { format, durationSec, preRenderedFrames, width, height, onProgress } = options;

        if (preRenderedFrames.length === 0) {
            throw new Error("No pre-rendered frames provided");
        }

        const outputFormat = format === 'webm' ? new WebMOutputFormat() : new Mp4OutputFormat();
        const bufferTarget = new BufferTarget();
        const output = new Output({
            format: outputFormat,
            target: bufferTarget
        });

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error("Could not get 2d context");

        const videoSource = new CanvasSource(canvas, {
            codec: format === 'webm' ? 'vp9' : 'avc',
            bitrate: 5_000_000
        });
        output.addVideoTrack(videoSource);

        await output.start();

        const frameTimeSec = durationSec / preRenderedFrames.length;

        for (let i = 0; i < preRenderedFrames.length; i++) {
            const img = new Image();
            img.src = preRenderedFrames[i];
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; 
            });

            // Draw white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const timestampSec = i * frameTimeSec;
            
            const keyFrameInterval = Math.max(1, Math.floor(preRenderedFrames.length / durationSec));
            const isKeyFrame = i % keyFrameInterval === 0;

            await videoSource.add(timestampSec, frameTimeSec, { keyFrame: isKeyFrame });

            onProgress(Math.round(((i + 1) / preRenderedFrames.length) * 100));
        }

        await output.finalize();

        return new Blob([bufferTarget.buffer || new ArrayBuffer(0)], { type: format === 'webm' ? 'video/webm' : 'video/mp4' });
    }
}
