import cors from "cors";

const ACCEPTED_ORIGINS = [
  "*", // --> modificar para poner solo los origenes permitidos
];

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests (Postman, curl) when origin is undefined
      if (!origin) return callback(null, true);

      // allow all when '*' is configured
      if (acceptedOrigins.includes("*")) return callback(null, true);

      // otherwise check explicit list
      if (acceptedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  });
