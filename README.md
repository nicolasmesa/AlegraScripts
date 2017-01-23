#Alegra Scripts
Coleccion de tamper monkey scripts para usar en Alegra

##create-and-pay-invoice-script
Para usar este script se debe configurar cambair el codigo y poner la siguiente configuracion:
```javascript
var paymentConfig = {
	idAccount: <id de la cuenta de banco>,
	paymentMethod: 'cash',
	currency: 'COP',
	thousandsSeparator: ','
};
```
