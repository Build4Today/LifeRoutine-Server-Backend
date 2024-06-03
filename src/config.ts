import dotenv from "dotenv";

// load environment variables from .env file
dotenv.config();

interface ConfigProps {
  port: string | number;
  host: string;
}

const config: ConfigProps = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
};

export { config };
