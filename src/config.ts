import dotenv from "dotenv";

// load environment variables from .env file
dotenv.config();

interface ConfigProps {
  port: string | number;
  host: string;
  databaseUrl: string;
}

const config: ConfigProps = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || "localhost",
  databaseUrl:
    process.env.DATABASE_URL ||
    "mysql://root:root@localhost:3306/habit_tracker",
};

export { config };
