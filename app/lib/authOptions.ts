import type { NextAuthOptions } from "next-auth"
import axios from "axios"
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/auth/sign-in',  // Displays signin buttons
        signOut: '/auth/sign-out', // Signs out user and displays message
        error: '/auth/error', // Error code passed in query string as ?error=
    },
    theme: {
        colorScheme: 'light',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID ?? "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
        }),
        CredentialsProvider({
            name: 'Credentials',
            type: "credentials",
            credentials: {
                email: { name: "email", label: "Email", type: "text", placeholder: "yassine@skymap.net" },
                password: { name: "password", label: "Password", type: "password" }
            },
            async authorize(credentials: any, req: any): Promise<any> {
                const { email, password } = credentials as {
                    email: string;
                    password: string;
                }

                // I will use a single user for this example - and later will implement a real authentication
                const validUser = {
                    id: 1,
                    name: "Anonymous",
                    email: "anonymous@skymap.dev",
                    image: "https://ui-avatars.com/api/?name=A+S",
                }

                return validUser;
            }
        })
    ],
}
