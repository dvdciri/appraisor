declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    DATABASE_URL: string;
    STREET_API_KEY: string;
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
    SEND_FOX_API_KEY: string;
    SEND_FOX_LIST_ID: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
  }
}
