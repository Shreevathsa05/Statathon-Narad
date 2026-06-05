import { createLogger, transports, format } from "winston";
import LokiTransport from "winston-loki";

const options = {
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new LokiTransport({
            host: process.env.LOKI_URL || "http://127.0.0.1:3100"
        }),
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    ]
};

export const logger = createLogger(options);
