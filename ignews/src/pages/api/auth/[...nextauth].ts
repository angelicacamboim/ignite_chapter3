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
    async session(session){
    try{
      const userActiveSubscription = await fauna.query(
        q.Get(
          q.Intersection([
            q.Match( //select subscription_by_user_ref
              q.Index('subscription_by_user_ref'),
              q.Select(
                "ref",
                q.Get(
                  q.Match( //where user_by_email = session.user.email
                    q.Index('user_by_email'),
                    q.Casefold(session.user.email)
                  )
                )
              )
            ),
            q.Match(
              q.Index('subscription_by_status'),
              "active"
            )
             ] )
        )
      )

      return {...session, activeSubscription: userActiveSubscription}
      
    }catch{
      return {...session, activeSubscription: null}
    }
    },
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