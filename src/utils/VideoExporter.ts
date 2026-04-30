import * as WebMMuxer from 'webm-muxer';
import * as MP4Muxer from 'mp4-muxer';

export interface VideoExportOptions {
    format: 'webm' | 'mp4';
    durationSec: number;
    uniqueValues: (string | number)[];
    setAnimationValue: (val: string | number) => void;
    onProgress: (progress: number) => void;
}

export class VideoExporter {
    static async exportVideo(options: VideoExportOptions): Promise<Blob> {
        const { format, durationSec, uniqueValues, setAnimationValue, onProgress } = options;

        if (uniqueValues.length === 0) {
            throw new Error("No frames to export");
        }

        const gd = document.querySelector('.js-plotly-plot') as HTMLElement;
        if (!gd) {
            throw new Error("Plotly element not found");
        }

        // Must be even numbers for h264 encoder
        const width = gd.clientWidth % 2 === 0 ? gd.clientWidth : gd.clientWidth - 1;
        const height = gd.clientHeight % 2 === 0 ? gd.clientHeight : gd.clientHeight - 1;

        let muxer: any;
        if (format === 'webm') {
            muxer = new WebMMuxer.Muxer({
                target: new WebMMuxer.ArrayBufferTarget(),
                video: {
                    codec: 'V_VP9',
                    width,
                    height,
                    frameRate: uniqueValues.length / durationSec
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

        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        // Time per frame in microseconds
        const frameTimeUs = Math.round((durationSec * 1_000_000) / uniqueValues.length);

        for (let i = 0; i < uniqueValues.length; i++) {
            setAnimationValue(uniqueValues[i]);
            // Wait for React to update the state and Plotly to finish its transition
            // Plotly's default transition takes some time. 
            // We wait enough time for the render to complete before snapping it.
            await delay(300);

            // Import Plotly dynamically to avoid SSR issues if any, or just use window.Plotly
            const Plotly = (window as any).Plotly;
            if (!Plotly) throw new Error("Plotly not found on window");

            const dataUrl = await Plotly.toImage(gd, { format: 'png', width, height });

            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if one frame fails to load
            });

            // Draw white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const timestampUs = i * frameTimeUs;
            const frame = new VideoFrame(canvas, { timestamp: timestampUs });

            // Keyframe every second (approx)
            const keyFrameInterval = Math.max(1, Math.floor(uniqueValues.length / durationSec));
            const isKeyFrame = i % keyFrameInterval === 0;

            videoEncoder.encode(frame, { keyFrame: isKeyFrame });
            frame.close();

            onProgress(Math.round(((i + 1) / uniqueValues.length) * 100));
        }

        await videoEncoder.flush();
        muxer.finalize();

        const buffer = muxer.target.buffer;
        return new Blob([buffer], { type: format === 'webm' ? 'video/webm' : 'video/mp4' });
    }
}
