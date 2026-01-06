export class HttpException extends Error {
  statusCode;
  constructor(descriprion: string, statusCode: number) {
    super(descriprion);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class BadRequestException extends HttpException {
  errors: never[];
  constructor(description = 'BAD_REQUEST', errors = []) {
    super(description, 400);
    this.errors = errors;
  }
}

export class UnauthorizedException extends HttpException {
  constructor(description = 'UNAUTHORIZED') {
    super(description, 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(description = 'FORBIDDEN') {
    super(description, 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(description = 'NOT_FOUND') {
    super(description, 404);
  }
}

export class ConflictException extends HttpException {
  constructor(description = 'CONFLICT') {
    super(description, 409);
  }
}
