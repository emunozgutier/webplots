import * as WebMMuxer from 'webm-muxer';
import * as MP4Muxer from 'mp4-muxer';

export interface PreRenderOptions {
    uniqueValues: (string | number)[];
    setAnimationValue: (val: string | number) => void;
    onProgress: (progress: number, latestFrame?: string) => void;
    targetWidth?: number;
    targetHeight?: number;
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
        const { uniqueValues, setAnimationValue, onProgress, targetWidth, targetHeight } = options;

        if (uniqueValues.length === 0) {
            throw new Error("No frames to export");
        }

        const gd = document.querySelector('.js-plotly-plot') as HTMLElement;
        if (!gd) {
            throw new Error("Plotly element not found");
        }

        // Use target dimensions or fallback to plot dimensions
        let rawWidth = targetWidth || gd.clientWidth;
        let rawHeight = targetHeight || gd.clientHeight;

        // Must be even numbers for h264 encoder
        const width = rawWidth % 2 === 0 ? rawWidth : rawWidth - 1;
        const height = rawHeight % 2 === 0 ? rawHeight : rawHeight - 1;

        const frames: string[] = [];
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        for (let i = 0; i < uniqueValues.length; i++) {
            setAnimationValue(uniqueValues[i]);
            // Wait for React to update the state and Plotly to finish its transition
            await delay(300);

            const Plotly = (window as any).Plotly;
            if (!Plotly) throw new Error("Plotly not found on window");

            const dataUrl = await Plotly.toImage(gd, { format: 'webp', width, height });
            frames.push(dataUrl);

            onProgress(Math.round(((i + 1) / uniqueValues.length) * 100), dataUrl);
        }

        return { frames, width, height };
    }

    static async encodeVideo(options: EncodeOptions): Promise<Blob> {
        const { format, durationSec, preRenderedFrames, width, height, onProgress } = options;

        if (preRenderedFrames.length === 0) {
            throw new Error("No pre-rendered frames provided");
        }

        let muxer: any;
        if (format === 'webm') {
            muxer = new WebMMuxer.Muxer({
                target: new WebMMuxer.ArrayBufferTarget(),
                video: {
                    codec: 'V_VP9',
                    width,
                    height,
                    frameRate: preRenderedFrames.length / durationSec
                }
            });
        } else {
            muxer = new MP4Muxer.Muxer({
                target: new MP4Muxer.ArrayBufferTarget(),
                video: {
                    codec: 'avc',
                    width,
                    height
                },
                fastStart: 'in-memory'
            });
        }

        const videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: e => console.error("VideoEncoder error", e)
        });

        videoEncoder.configure({
            codec: format === 'webm' ? 'vp09.00.10.08' : 'avc1.640028',
            width,
            height,
            bitrate: 5_000_000 // 5 Mbps for high quality
        });

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error("Could not get 2d context");

        // Time per frame in microseconds
        const frameTimeUs = Math.round((durationSec * 1_000_000) / preRenderedFrames.length);

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

            const timestampUs = i * frameTimeUs;
            const frame = new VideoFrame(canvas, { timestamp: timestampUs });

            const keyFrameInterval = Math.max(1, Math.floor(preRenderedFrames.length / durationSec));
            const isKeyFrame = i % keyFrameInterval === 0;

            videoEncoder.encode(frame, { keyFrame: isKeyFrame });
            frame.close();

            onProgress(Math.round(((i + 1) / preRenderedFrames.length) * 100));
        }

        await videoEncoder.flush();
        muxer.finalize();

        const buffer = muxer.target.buffer;
        return new Blob([buffer], { type: format === 'webm' ? 'video/webm' : 'video/mp4' });
    }
}
