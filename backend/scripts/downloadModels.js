import fs from 'fs';
import path from 'path';
import https from 'https';

const models = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const destDir = path.resolve('models');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

async function download(file) {
    const url = baseUrl + file;
    const dest = path.join(destDir, file);

    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(dest);
        https.get(url, (res) => {
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Downloaded ${file}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    console.log('Downloading models...');
    for (const model of models) {
        try {
            await download(model);
        } catch (err) {
            console.error(`Failed to download ${model}:`, err.message);
        }
    }
    console.log('All models downloaded.');
}

main();
