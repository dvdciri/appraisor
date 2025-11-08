import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { query } from '@/lib/db/client'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Upsert user to database
          await query(`
            INSERT INTO users (google_id, email, name, profile_picture, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (google_id) 
            DO UPDATE SET 
              email = EXCLUDED.email,
              name = EXCLUDED.name,
              profile_picture = EXCLUDED.profile_picture,
              updated_at = NOW()
          `, [
            user.id,
            user.email,
            user.name,
            user.image
          ])
          
          console.log('User signed in:', user.email)
          return true
        } catch (error) {
          console.error('Error saving user to database:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})

export { handler as GET, handler as POST }
