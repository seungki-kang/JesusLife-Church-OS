/** Errors raised across the application boundary. */

/** A dependency cannot safely serve the request (for example an unsafe DB role). */
export class DependencyUnavailable extends Error {
  constructor(reason = 'DEPENDENCY_UNAVAILABLE') {
    super(reason);
    this.name = 'DependencyUnavailable';
  }
}
