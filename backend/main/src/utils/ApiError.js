class ApiError extends Error {
    constructor(
        statusCode,
        message = "something went wrong",
        errors = [],
        stack
    ) {
        super(message);
        this.message = message
        this.statusCode = statusCode
        this.errors = errors
        if (stack) {
            this.stack = stack
        }
    }
}

export { ApiError }