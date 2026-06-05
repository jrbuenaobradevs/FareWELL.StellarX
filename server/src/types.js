/** @typedef {'draft' | 'active' | 'scheduled' | 'delivered'} MessageStatus */
/** @typedef {'individual' | 'group'} MessageType */

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [stellarPublicKey]
 * @property {string} createdAt
 * @property {string} [lastActivityAt]
 * @property {number} inactivityDays
 */

/**
 * @typedef {object} LegacyMessage
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} recipient
 * @property {string} bodyEncrypted
 * @property {string} contentHash
 * @property {string} [stellarTxHash]
 * @property {MessageType} type
 * @property {MessageStatus} status
 * @property {string} createdAt
 * @property {string} [deliveredAt]
 */

/**
 * @typedef {object} Verifier
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} email
 * @property {string} relationship
 * @property {string} [stellarAddress]
 * @property {number} priority
 */

/**
 * @typedef {object} TimelineEvent
 * @property {string} id
 * @property {string} userId
 * @property {string} [messageId]
 * @property {'message_created' | 'message_anchored' | 'activity_ping' | 'verifier_vote' | 'delivery_triggered' | 'message_delivered'} type
 * @property {string} label
 * @property {string} [stellarTxHash]
 * @property {string} [meta]
 * @property {string} createdAt
 */

/**
 * @typedef {object} VerifierVote
 * @property {string} id
 * @property {string} messageId
 * @property {string} verifierId
 * @property {boolean} confirmed
 * @property {string} [stellarTxHash]
 * @property {string} createdAt
 */

export {};
