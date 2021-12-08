import NextAuth from "next-auth"
import Providers from "next-auth/providers"
import { query as q } from 'faunadb'

import { fauna } from '../../../services/fauna'
import { signIn } from "next-auth/client"

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      scope: 'read:user'
    }),
  ],
  callbacks: {
    //signIn with github
    async signIn(user, account, profile) {
      const { email } = user

      //add user in Database
      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(q.Index("user_by_email"), q.Casefold(user.email))
              )
            ),
            q.Create(q.Collection("users"), { data: { email } }),
            q.Get(q.Match(q.Index("user_by_email"), q.Casefold(user.email)))
          )
        );
      } catch (err) {
        console.error(err);
        return false;
      }

      return true;
    },
  },
})