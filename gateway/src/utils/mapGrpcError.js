export function mapGrpcError(err, res) {
  const map = {
    1: 499,  // CANCELLED → 499 Client Closed Request
    2: 500,  // UNKNOWN → 500 Internal Server Error
    3: 400,  // INVALID_ARGUMENT → 400 Bad Request
    4: 504,  // DEADLINE_EXCEEDED → 504 Gateway Timeout
    5: 404,  // NOT_FOUND → 404 Not Found
    6: 409,  // ALREADY_EXISTS → 409 Conflict
    7: 403,  // PERMISSION_DENIED → 403 Forbidden
    8: 429,  // RESOURCE_EXHAUSTED → 429 Too Many Requests
    9: 412,  // FAILED_PRECONDITION → 412 Precondition Failed
    10: 409, // ABORTED → 409 Conflict
    11: 400, // OUT_OF_RANGE → 400 Bad Request
    12: 501, // UNIMPLEMENTED → 501 Not Implemented
    13: 500, // INTERNAL → 500 Internal Server Error
    14: 503, // UNAVAILABLE → 503 Service Unavailable
    15: 500, // DATA_LOSS → 500 Internal Server Error
    16: 401  // UNAUTHENTICATED → 401 Unauthorized
  };
  
  res.status(map[err.code] ?? 500).json({
    error: err.message || "GRPC_ERROR",
    code: err.code
  });
}
