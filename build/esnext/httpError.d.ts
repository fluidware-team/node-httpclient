export declare class HttpError extends Error {
    statusCode: number;
    httpResponse: Response;
    constructor(msg: string, statusCode: number, httpResponse: Response);
    getStatusCode(): number;
    getHttpResponse(): Response;
}
//# sourceMappingURL=httpError.d.ts.map