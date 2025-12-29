import mongoose from 'mongoose';

const jobMetadataSchema = new mongoose.Schema({
    jobId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    tags: { type: String },
}, { timestamps: true });

export const JobMetadata = mongoose.model('JobMetadata', jobMetadataSchema);
