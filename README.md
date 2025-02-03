<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>



## Payments Microservice with Stripe and Webhooks
This microservice is responsible for handling payments.

1. Instalar el servidor de webhooks de Stripe
```
npm install stripe
```

2. Crear un usuario en Stripe y obtener la clave ( para desarrollo no es necesario crear toda la configuración de Stripe)
3. Crear un producto en Stripe
```
stripe products create --name "Producto de prueba" --type good --active true --interval count --amount 100 --currency EUR
```

4.  Ejecutar el webhook
```	
stripe trigger payment_intent.succeeded
```


5. Para probar el webhook en local
```
stripe listen --forward-to localhost:3003/payments/webhook
```