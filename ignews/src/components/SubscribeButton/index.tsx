import { signIn, useSession } from 'next-auth/client'
import { useRouter } from 'next/router'
import { api } from '../../services/api'
import { getStripeJs } from '../../services/stripe-js'
import styles from './styles.module.scss'

interface SubscribeButtonProps {
	priceId: string
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
	//verifica se o user está logado
	const [session] = useSession()

	const router = useRouter()

	async function handleSubscribe() {
		//se ele nao estiver logado no github
		if (!session) {
			signIn('github')
			return
		}

		//se ele tiver uma sessão ativa no stripe/faundadb
		if (session.activeSubscription) {
			router.push('/posts')
			return
		}

		//se ele estiver logado, mas nao possui uma sessão ativa no stripe
		try {
			const response = await api.post('/subscribe')

			const { sessionId } = response.data

			const stripe = await getStripeJs()

			await stripe.redirectToCheckout({ sessionId })
		} catch (err) {
			alert(err.message)
		}
	}
	return (
		<button
			type="button"
			className={styles.subscribeButton}
			onClick={handleSubscribe}
		>
			Subscribe now
		</button>
	)
}
