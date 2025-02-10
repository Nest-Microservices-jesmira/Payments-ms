import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs, NATS_SERVICE } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';


@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);
  private readonly logger = new Logger('PaymentsService');

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

    async createPaymentSession(paymentSessionDto: PaymentSessionDto) {

        const { currency, items, orderId } = paymentSessionDto; 

        const lineItems = items.map(item => {
            return {
                price_data: {
                    currency,
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.round(item.price * 100), // 20.00 * 100 = 2000
                },
                quantity: item.quantity,
            }
        });

        const session = await this.stripe.checkout.sessions.create({

            // Colocar aquí el ID de mi orden
            payment_intent_data: {
                metadata:{
                    orderId: orderId
                }
            },

            line_items:lineItems, 
            mode: 'payment',
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelUrl,
                

        });
    
        

        // return session;
        return {
            cancelUrl: session.cancel_url,
            successUrl: session.success_url,
            url: session.url,
        };
    }

    async stripeWebhook( req: Request, res: Response) {
       const sig = req.headers['stripe-signature'];

       let event: Stripe.Event;
       // Testing
    //    const endpointSecret = "whsec_2305fc74f511dd9eeacd6e4baef47d62ebe06e3fa4a90e27f22f836b66977166";
       // Real
    //    const endpointSecret = "whsec_ipeaJNk2uWh6avIERrslSPLQB7FvTm4p";
       const endpointSecret = envs.stripeEndpointSecret;

       try {
        event = this.stripe.webhooks.constructEvent(req['rawBody'], sig, endpointSecret);
        
       } catch (error) {
        res.status(400).send(`Webhook Error:  ${ error.message}`);
        return;
       }

       switch (event.type) {
         case 'charge.succeeded':
            const chargeSucceeded = event.data.object;
            const payload = {
                stripePaymentId: chargeSucceeded.id,
                orderId: chargeSucceeded.metadata.orderId,
                receiptUrl: chargeSucceeded.receipt_url,
            }
            // this.logger.log({ payload });
            this.client.emit('payment.succeeded', payload);
        //    console.log({
        //     metadata: chargeSucceeded.metadata,
        //     orderId: chargeSucceeded.metadata.orderId,
        //    });
           break;
         default:
           console.log(`Ecent ${event.type} no handle`);
       }


       return res.status(200).json({ sig });
    }
}
