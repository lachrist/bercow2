/** @typedef {string} Specifier */
/** @typedef {string} Hash */
/** @typedef {string} Content */
/** @typedef {string} Target */
/** @typedef {string} Origin */

/** @typedef {{ target: Target, origin: Specifier }} Query */
/** @typedef {{ specifier: Specifier, external: boolean}} Answer */

/** @typedef {function(Specifier): Promise<Hash>} Digest */
/** @typedef {function(Specifier): Promise<Target[]>} Link */
/** @typedef {function(Query): Promise<Answer>} Resolve */
/** @typedef {function(Specifier): Promise<boolean>} Validate */

/** @typedef {{ module: string; options: Object }} Plugin */

/**
 * @typedef {Object} Configuration
 * @property {Digest | Plugin} fetch
 * @property {Link | Plugin} link
 * @property {Resolve | Plugin} resolve
 * @property {Validate | Plugin} validate
 */
