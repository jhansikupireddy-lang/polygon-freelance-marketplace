/**
 * Simple keyword-based scam detection for job descriptions.
 * In a real production environment, this would be replaced or augmented by
 * an AI service (like OpenAI moderation API) or a crowd-sourced reporting system.
 */

const SUSPICIOUS_KEYWORDS = [
    'whatsapp',
    'telegram',
    'direct pay',
    'pay outside',
    'private key',
    'seed phrase',
    'gift card',
    'upfront payment',
    'quick money',
    'dm for details',
    'message me on',
    'crypto payment only',
    'no escrow',
    'trusted source'
];

/**
 * Analyzes a title and description for suspicious patterns.
 * @param {string} title - The job title.
 * @param {string} description - The job description.
 * @returns {object} { isSuspicious: boolean, matches: string[] }
 */
export const checkRiskLevel = (title = '', description = '') => {
    const content = `${title} ${description}`.toLowerCase();
    const matches = SUSPICIOUS_KEYWORDS.filter(keyword => content.includes(keyword.toLowerCase()));

    return {
        isSuspicious: matches.length > 0,
        matches: matches
    };
};
