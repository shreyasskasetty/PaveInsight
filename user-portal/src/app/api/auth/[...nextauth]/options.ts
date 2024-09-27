import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const options: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text", placeholder: "your-cool-username" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                //This is where you need to retrieve user data to verify with the credentials
                const user = { id: 1, name: 'test', password: 'test'}
                if (credentials?.username === user.name && credentials?.password === user.password) {
                    return user
                }else{
                    return null
                }
            }
        })
    ],
}