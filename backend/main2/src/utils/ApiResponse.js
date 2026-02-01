class ApiResponse {
    constructor(
        statusCode,
        data,
        message,
        errors = [],
    ) {
        this.message = message
        this.statusCode = statusCode
        this.data = data
        this.errors = errors

        this.success = statusCode < 400
    }
}

export { ApiResponse }