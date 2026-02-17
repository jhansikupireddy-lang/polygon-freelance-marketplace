import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema({
    address: { type: String, required: true, lowercase: true },
    dataCategory: { type: String, required: true }, // identity, contact, financial, etc.
    legalBasis: { type: String, required: true }, // consent, contract, legal_obligation
    purpose: { type: String, required: true },
    consentGiven: { type: Boolean, default: false },
    consentDate: { type: Date },
    withdrawalDate: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
}, { timestamps: true });

export const Consent = mongoose.model('Consent', consentSchema);

const dataAccessRecordSchema = new mongoose.Schema({
    address: { type: String, required: true, lowercase: true },
    accessedBy: { type: String, required: true },
    accessType: { type: String, required: true }, // data_export, data_update, data_deletion
    dataCategories: [{ type: String }],
    purpose: { type: String },
    ipAddress: { type: String },
}, { timestamps: true });

export const DataAccessRecord = mongoose.model('DataAccessRecord', dataAccessRecordSchema);
