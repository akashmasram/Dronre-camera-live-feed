const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const process = require('process');

const app = express();
const PORT = process.env.PORT || 8000;
const RTSP_URL = process.env.RTSP_URL || 'rtsp://192.168.1.26/live/ch00_1';

// Ensure the hls directory exists
const hlsDirectory = path.join(__dirname, 'hls');
if (!fs.existsSync(hlsDirectory)) {
    fs.mkdirSync(hlsDirectory);
}

// FFmpeg command to convert RTSP to HLS
const ffmpegCommand = `ffmpeg -i ${RTSP_URL} -c:v copy -c:a aac -f hls -hls_time 2 -hls_list_size 5 -hls_flags delete_segments -hls_segment_filename ${hlsDirectory}/segment%03d.ts ${hlsDirectory}/stream.m3u8`;

// Start FFmpeg process
const ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`FFmpeg error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`FFmpeg stderr: ${stderr}`);
    }
    console.log(`FFmpeg output: ${stdout}`);
});

// Cleanup on server shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    ffmpegProcess.kill();
    process.exit();
});

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the HLS stream files
app.use('/hls', express.static(hlsDirectory));

// Serve static files (like JS and CSS)
app.use('/static', express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
