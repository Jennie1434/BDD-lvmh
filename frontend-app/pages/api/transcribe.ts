import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

// Disable default body parser to handle file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API Key is missing.' });
    }

    try {
        const form = formidable({
            keepExtensions: true,
            maxFileSize: 25 * 1024 * 1024, // 25MB (Whisper limit)
        });

        const [fields, files] = await form.parse(req);

        // Check if file exists
        // formidable v3 returns an array of files for each key
        const file = files.file?.[0] || files.file;

        if (!file) {
            return res.status(400).json({ error: 'No audio file provided.' });
        }

        // "file" is likely of type formidable.File
        const filePath = (file as any).filepath || (file as any).path;

        if (!filePath) {
            return res.status(500).json({ error: 'File upload failed (no path).' });
        }

        console.log(`Transcribing file: ${filePath}`);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            language: "fr", // Force French for better results
        });

        // Clean up temporary file
        fs.unlinkSync(filePath);

        return res.status(200).json({ transcription: transcription.text });

    } catch (error: any) {
        console.error('Transcription error:', error);
        return res.status(500).json({ error: error.message || 'Error processing audio' });
    }
}
