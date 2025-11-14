// eureka/CircuitBreaker.js
export class CircuitBreaker {
  constructor({
    failureThreshold = 3,
    openInterval = 10000,
    cacheTTL = 30000
  } = {}) {
    this.failureThreshold = failureThreshold;
    this.openInterval = openInterval;
    this.cacheTTL = cacheTTL;

    this.cache = new Map();     // { serviceName: { host, port, expiresAt } }
    this.breakers = new Map();  // { serviceName: { state, failures, nextTry } }
  }

  /** Obtiene si el circuito está abierto/medio abierto/cerrado */
  canRequest(serviceName) {
    const breaker = this.breakers.get(serviceName) || {
      state: 'CLOSED',
      failures: 0,
      nextTry: 0
    };

    // Si el circuito está abierto, verificamos si ya podemos probar half-open
    if (breaker.state === 'OPEN') {
      if (Date.now() < breaker.nextTry) {
        return false; // NO se puede intentar
      }
      breaker.state = 'HALF_OPEN'; // Intento permitido
      this.breakers.set(serviceName, breaker);
      return true;
    }

    return true; // CLOSED o HALF_OPEN
  }

  /** Guarda un resultado en cache */
  saveCache(serviceName, instance) {
    this.cache.set(serviceName, {
      ...instance,
      expiresAt: Date.now() + this.cacheTTL
    });
  }

  /** Recupera caché válido */
  getCache(serviceName) {
    const entry = this.cache.get(serviceName);
    if (entry && entry.expiresAt > Date.now()) {
      return entry;
    }
    return null;
  }

  /** Marca intento fallido */
  registerFailure(serviceName) {
    let breaker = this.breakers.get(serviceName) || {
      state: 'CLOSED',
      failures: 0,
      nextTry: 0
    };

    breaker.failures++;

    if (breaker.failures >= this.failureThreshold) {
      breaker.state = 'OPEN';
      breaker.nextTry = Date.now() + this.openInterval;
    }

    this.breakers.set(serviceName, breaker);
  }

  /** Marca intento exitoso */
  registerSuccess(serviceName) {
    this.breakers.set(serviceName, {
      state: 'CLOSED',
      failures: 0,
      nextTry: 0
    });
  }
}
