import Head from 'next/head' //title dinamico
import { SubscribeButton } from '../components/SubscribeButton'
import styles from './home.module.scss'
import { GetStaticProps } from 'next'
import { stripe } from '../components/services/stripe'

//chamadas api e gerar a pagina
//client-side (depois da pagina ter carregado)
//server-side (dinamico em tempo real)
//static site generation

interface HomeProps {
	product: {
		priceId: string
		amount: number
	}
}

export default function Home({ product }: HomeProps) {
	return (
		<>
			<Head>
				<title>Home | ig.news</title>
			</Head>
			<main className={styles.contentContainer}>
				<section className={styles.hero}>
					<span>👏 Hey, welcome</span>
					<h1>
						News about the <span>React</span> world.
					</h1>
					<p>
						Get access to all the publications <br />
						<span>for {product.amount} month</span>
					</p>
					<SubscribeButton priceId={product.priceId} />
				</section>

				<img src="/images/avatar.svg" alt="Girl coding" />
			</main>
		</>
	)
}

//stripe SSG - buscar da api o preço (valor estático)
export const getStaticProps: GetStaticProps = async () => {
	const price = await stripe.prices.retrieve('price_1JzSdvH901wNIzOlhVgoJWtC', {
		expand: ['product']
	})

	const product = {
		priceId: price.id,
		amount: new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(price.unit_amount / 100)
	}
	return { props: { product }, revalidate: 60 * 60 * 24 } //24 horas
}
