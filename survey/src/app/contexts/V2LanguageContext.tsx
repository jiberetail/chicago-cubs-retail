import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type V2Language = "en" | "es";
export type TranslationValues = Record<string, string | number>;
export type V2Translate = (english: string, values?: TranslationValues) => string;

type V2LanguageContextValue = {
  language: V2Language;
  setLanguage: (language: V2Language) => void;
  t: V2Translate;
};

const spanish: Record<string, string> = {
  "Select an item to open on your phone": "Selecciona un artículo para abrir en tu teléfono",
  "Verify options at store": "Confirma las opciones en la tienda",
  "Open your selected merchandise on MLB Shop. Add your sizes there and complete payment on your phone.": "Abre tus artículos en MLB Shop. Selecciona tus tallas allí y paga desde tu teléfono.",
  "Add your selections on MLB Shop": "Agrega tus selecciones en MLB Shop",
  "Your kiosk basket does not transfer automatically. Confirm each item, size, and fulfillment on MLB Shop.": "La cesta del quiosco no se transfiere automáticamente. Confirma cada artículo, talla y entrega en MLB Shop.",
  Language: "Idioma",
  English: "Inglés",
  Spanish: "Español",
  Back: "Atrás",
  Home: "Inicio",
  Continue: "Continuar",
  Close: "Cerrar",
  "Start over": "Comenzar de nuevo",
  "Your cart will be cleared": "Se vaciará tu carrito",
  "Are you sure you want to start over?": "¿Seguro que quieres comenzar de nuevo?",
  "Keep My Cart": "Conservar mi carrito",
  "Start Over": "Comenzar de nuevo",

  "Concierge Merchandise Pickup": "Recogida Concierge de Mercancía",
  "Suite Delivery": "Entrega a la Suite",
  "Ship-to-Home Ordering": "Pedidos con Envío a Casa",
  "Season-Ticket Interest": "Interés en Abonos de Temporada",
  "Cubs Merchandise Feedback": "Comentarios sobre Mercancía de los Cubs",
  "Cubs Retail Kiosk": "Quiosco de los Cubs",
  "Delivery to suite": "Entrega a la suite",
  "Ship to home": "Envío a casa",
  "Pickup at stadium desk": "Recogida en el estadio",

  "Cubs Game Day": "Día de Partido de los Cubs",
  "Elevate Your Cubs": "Vive la Pasión Cubs",
  "Game Day": "en Cada Partido",
  "Shop smarter, enjoy premium service, and get more from every moment at Wrigley Field.":
    "Compra de forma inteligente, disfruta un servicio premium y aprovecha cada momento en Wrigley Field.",
  "Choose a Cubs game day service": "Elige un servicio para el día de partido de los Cubs",
  "What would you like to do?": "¿Qué te gustaría hacer?",
  "Merchandise pickup": "Recogida de mercancía",
  "Concierge Pickup": "Recogida Concierge",
  "Shop Cubs gear now and pick it up at a nearby merchandise desk.":
    "Compra artículos de los Cubs y recógelos en un mostrador de mercancía cercano.",
  "Start Pickup Order": "Iniciar pedido",
  "Premium service": "Servicio premium",
  "Send merchandise directly to your suite during the game.":
    "Recibe la mercancía directamente en tu suite durante el partido.",
  "Deliver to Suite": "Entregar en la suite",
  "Home delivery": "Entrega a domicilio",
  "Ship to Home": "Enviar a Casa",
  "Buy through the stadium kiosk and have your order shipped after the game.":
    "Compra en el quiosco del estadio y recibe tu pedido después del partido.",
  "Build Ship Order": "Crear pedido con envío",
  "Cubs ticketing": "Boletos de los Cubs",
  "Season Tickets": "Abonos de Temporada",
  "View opportunities or request contact from a Cubs representative.":
    "Explora oportunidades o solicita que te contacte un representante de los Cubs.",
  "Explore Tickets": "Explorar boletos",
  "Official Chicago Cubs game day services": "Servicios oficiales de los Chicago Cubs para el día de partido",

  "Find Your Cubs Gear": "Encuentra tus Artículos de los Cubs",
  "Featured categories from the MLB Shop Cubs Store.": "Categorías destacadas de la Tienda Oficial de los Cubs.",
  "{count} products": "{count} productos",
  "Ready to browse": "Listo para explorar",
  "{count} items in basket": "{count} artículos en el carrito",
  "All Departments": "Todos los Departamentos",
  Hats: "Gorras",
  Jerseys: "Jerseys",
  Sweatshirts: "Sudaderas",
  "T-Shirts": "Camisetas",
  "{count} items": "{count} artículos",
  "Shop Every Department": "Explora Todos los Departamentos",
  "All MLB Shop Cubs Store categories in one place.": "Todas las categorías de la Tienda Oficial de los Cubs en un solo lugar.",
  "Browse merchandise": "Explorar mercancía",
  "{count} products available to browse.": "{count} productos disponibles.",
  "Search {title}": "Buscar en {title}",
  "Search player, product, brand or style": "Buscar jugador, producto, marca o estilo",
  "Catalog pages": "Páginas del catálogo",
  "Previous product page": "Página anterior de productos",
  "Next product page": "Página siguiente de productos",
  "No matching products": "No hay productos coincidentes",
  "Try a player name, product type, brand or style.": "Prueba con un jugador, tipo de producto, marca o estilo.",
  "Back to Selection": "Volver a la Selección",
  "Review Basket": "Revisar Carrito",
  "Ready to ship": "Listo para enviar",
  "Few left": "Quedan pocos",
  "{discount} off": "{discount} de descuento",

  Accessories: "Accesorios",
  "Auto Accessories": "Accesorios para Autos",
  "Blankets, Bed & Bath": "Mantas, Cama y Baño",
  "Books & DVDs": "Libros y DVD",
  Collectibles: "Coleccionables",
  "Cups, Mugs & Shots": "Vasos, Tazas y Vasos de Shot",
  "Dresses & Skirts": "Vestidos y Faldas",
  "Flags & Banners": "Banderas y Pancartas",
  "Gameday & Tailgate": "Día de Partido y Tailgate",
  "Gift Cards": "Tarjetas de Regalo",
  "Golf & More": "Golf y Más",
  "Home Office & School": "Oficina, Hogar y Escuela",
  Jackets: "Chaquetas",
  "Kitchen & Bar": "Cocina y Bar",
  "Lawn & Garden": "Patio y Jardín",
  "License Plate & Frames": "Matrículas y Marcos",
  "Luggage & Sportbags": "Equipaje y Bolsas Deportivas",
  "Pet Supplies": "Artículos para Mascotas",
  Polos: "Polos",
  Rompers: "Mamelucos",
  "Shoes & Socks": "Zapatos y Calcetines",
  "Shorts & Pants": "Pantalones Cortos y Largos",
  "Sweaters & Dress Shirts": "Suéteres y Camisas de Vestir",
  "Sweatshirts & Fleece": "Sudaderas y Forro Polar",
  Swimsuits: "Trajes de Baño",
  "Underwear & Sleepwear": "Ropa Interior y de Dormir",
  "Wallets & Checkbooks": "Carteras y Chequeras",
  "Watches & Clocks": "Relojes",
  "Sale Items": "Artículos en Oferta",

  "Men's fit": "Corte para hombre",
  "Women's fit": "Corte para mujer",
  "Girl's fit": "Corte para niña",
  "Youth fit": "Corte juvenil",
  "Unisex fit": "Corte unisex",
  "Fan fit": "Corte para aficionado",
  Available: "Disponible",
  Unavailable: "No disponible",
  "Selection confirmed": "Selección confirmada",
  "Choose a size": "Elige una talla",
  "Choose an option": "Elige una opción",
  "{option}: {selection} · {fulfillment}.": "{option}: {selection} · {fulfillment}.",
  "Select an available option before adding this item.": "Selecciona una opción disponible antes de agregar este artículo.",
  "Size {size} · {fulfillment}.": "Talla {size} · {fulfillment}.",
  "Select an available size before adding this item.": "Selecciona una talla disponible antes de agregar este artículo.",
  "Add to Basket": "Agregar al Carrito",

  "Review order": "Revisar pedido",
  "Your Basket": "Tu Carrito",
  "Review your items and fulfillment details before online checkout.":
    "Revisa tus artículos y los detalles de entrega antes de continuar al pago en línea.",
  "No items yet": "Aún no hay artículos",
  "Add merchandise to build this order.": "Agrega mercancía para crear este pedido.",
  "Size {size} · Qty {quantity} · {fulfillment}": "Talla {size} · Cant. {quantity} · {fulfillment}",
  "{option}: {selection} · Qty {quantity} · {fulfillment}": "{option}: {selection} · Cant. {quantity} · {fulfillment}",
  "Ready for checkout": "Listo para finalizar la compra",
  Each: "Cada uno",
  "{price} item total": "{price} total del artículo",
  Remove: "Eliminar",
  Subtotal: "Subtotal",
  "Shipping / delivery": "Envío / entrega",
  Included: "Incluido",
  "Estimated tax": "Impuesto estimado",
  "Estimated order total": "Total estimado del pedido",
  "Add More": "Agregar Más",

  Fulfillment: "Entrega",
  "Confirm Suite Delivery": "Confirmar Entrega a la Suite",
  "Choose Pickup Location": "Elegir Lugar de Recogida",
  "Choose the most convenient location for your order.": "Elige el lugar más conveniente para tu pedido.",
  "Club-Level Concierge Desk": "Mostrador Concierge del Nivel Club",
  "Wrigley Field Gate Shop Pickup": "Recogida en la Tienda de la Puerta Wrigley Field",
  "Mezzanine Merchandise Window": "Ventanilla de Mercancía del Mezzanine",

  "Order notifications": "Notificaciones del pedido",
  "Stay Updated on Your Order": "Recibe Actualizaciones de tu Pedido",
  "We'll text you when your delivery is on the way to your suite.":
    "Te enviaremos un mensaje cuando la entrega vaya camino a tu suite.",
  "We'll text you when your order is ready for pickup.":
    "Te enviaremos un mensaje cuando tu pedido esté listo para recoger.",
  "Real-time order updates": "Actualizaciones del pedido en tiempo real",
  "Enter the mobile number that should receive this order's status notification.":
    "Ingresa el número móvil que debe recibir la notificación del estado de este pedido.",
  "Enter your full name": "Ingresa tu nombre completo",
  "Enter a mobile number": "Ingresa un número móvil",
  Service: "Servicio",
  "Delivery location": "Lugar de entrega",
  "Pickup location": "Lugar de recogida",
  "By continuing, you agree to receive order-status text messages. Message and data rates may apply.":
    "Al continuar, aceptas recibir mensajes de texto sobre el estado del pedido. Pueden aplicarse tarifas de mensajes y datos.",
  "Sending order...": "Enviando pedido...",
  "Continue to Phone Checkout": "Continuar al Pago en el Teléfono",

  "Mobile number": "Número de móvil",
  "Secure online checkout": "Pago seguro en línea",
  "Scan to Complete Your Purchase": "Escanea para Completar tu Compra",
  "Continue on the MLB Shop Cubs Store to review your cart and pay securely from your phone.":
    "Continúa en la Tienda Oficial de los Cubs para revisar tu carrito y pagar de forma segura desde tu teléfono.",
  "MLB Shop Cubs Store checkout QR code": "Código QR para finalizar la compra en la Tienda Oficial de los Cubs",
  "Official Cubs Team Store": "Tienda Oficial de los Cubs",
  "Scan with your phone camera": "Escanea con la cámara de tu teléfono",
  "Opens www.mlbshop.com/chicago-cubs/o-7876+t-03665322+z-8647-1125435766": "Abre www.mlbshop.com/chicago-cubs/o-7876+t-03665322+z-8647-1125435766",
  "Checkout stays on your phone": "La compra se completa en tu teléfono",
  "Finish in three quick steps": "Termina en tres pasos rápidos",
  "Scan the QR code": "Escanea el código QR",
  "Open it with your phone camera.": "Ábrelo con la cámara de tu teléfono.",
  "Review your Team Store cart": "Revisa tu carrito de la Tienda Oficial",
  "Confirm products, sizes, and fulfillment.": "Confirma productos, tallas y entrega.",
  "Pay securely on your phone": "Paga de forma segura en tu teléfono",
  "The MLB Shop Cubs Store handles all payment details.": "La Tienda Oficial de los Cubs gestiona todos los datos de pago.",
  "Kiosk selection": "Selección del quiosco",
  "1 item": "1 artículo",
  "Estimated total": "Total estimado",
  Reference: "Referencia",
  "Shipping details entered on your phone": "Datos de envío ingresados en tu teléfono",
  "Prices, availability, taxes, and fulfillment are confirmed on the MLB Shop Cubs Store before purchase.":
    "Los precios, la disponibilidad, los impuestos y la entrega se confirman en la Tienda Oficial de los Cubs antes de comprar.",
  "I've Completed Checkout": "He Completado la Compra",
  "Order received": "Pedido recibido",
  "Order Confirmed": "Pedido Confirmado",
  "Your order has been placed.": "Tu pedido ha sido realizado.",
  "Order confirmation details": "Detalles de confirmación del pedido",
  "Order reference": "Referencia del pedido",
  "We'll text you when your order is on the way to your suite.":
    "Te enviaremos un mensaje cuando tu pedido vaya camino a tu suite.",
  "Shipping and delivery updates will continue on your phone.":
    "Las actualizaciones de envío y entrega continuarán en tu teléfono.",
  "We'll keep you updated": "Te mantendremos informado",
  "This kiosk will reset in {count} seconds.": "Este quiosco se reiniciará en {count} segundos.",
  "10% Fan Survey": "Encuesta para Fans: 10%",
  "10% off survey offer": "Oferta de encuesta con 10% de descuento",
  "A thank-you from the Cubs": "Un agradecimiento de los Cubs",
  "Unlock 10% off your next purchase": "Obtén 10% de descuento en tu próxima compra",
  "Take our quick survey for 10% off your next purchase":
    "Responde nuestra breve encuesta y recibe 10% de descuento en tu próxima compra",
  "No thanks, I'm finished": "No, gracias. He terminado",
  "Quick fan survey": "Encuesta rápida para fans",
  "Survey progress: {progress}%": "Progreso de la encuesta: {progress}%",
  "10% reward": "Recompensa del 10%",
  "Your Cubs experience": "Tu experiencia Cubs",
  "How Was Your Shopping Experience?": "¿Cómo Fue tu Experiencia de Compra?",
  "Choose the answer that best matches your visit today.": "Elige la respuesta que mejor describa tu visita de hoy.",
  Positive: "Positiva",
  Neutral: "Neutral",
  Negative: "Negativa",
  "Everything felt great": "Todo estuvo excelente",
  "It was just okay": "Estuvo bien, sin más",
  "It missed the mark": "No cumplió mis expectativas",
  "Finish this quick survey to receive 10% off your next purchase.":
    "Completa esta breve encuesta y recibe 10% de descuento en tu próxima compra.",
  "Team Store service": "Servicio de la Tienda del Equipo",
  "Did an Associate Help You Today?": "¿Te Ayudó un Asociado Hoy?",
  "Your answer helps us recognize great service and improve every visit.":
    "Tu respuesta nos ayuda a reconocer un gran servicio y mejorar cada visita.",
  "An associate helped me": "Un asociado me ayudó",
  "I shopped on my own": "Compré por mi cuenta",
  "Associate engagement": "Atención del asociado",
  "How Would You Rate Your Engagement?": "¿Cómo Calificarías la Atención Recibida?",
  "Think about how helpful, friendly, and attentive the associate was.":
    "Piensa en qué tan amable, atento y servicial fue el asociado.",
  "Merchandise selection": "Selección de mercancía",
  "Did You Find Everything You Were Looking For?": "¿Encontraste Todo lo que Buscabas?",
  "Let us know whether the right Cubs gear was available today.":
    "Dinos si hoy encontraste los artículos Cubs que querías.",
  "I found everything": "Encontré todo",
  "Something was missing": "Faltaba algo",
  "Tell Us How We Can Improve": "Dinos Cómo Podemos Mejorar",
  "A few details can help us make the next Cubs shopping experience better.":
    "Unos cuantos detalles pueden ayudarnos a mejorar tu próxima experiencia de compra Cubs.",
  "Tell us the item, player, size, or style you hoped to find.":
    "Dinos qué artículo, jugador, talla o estilo esperabas encontrar.",
  "Share what would have made your experience better...": "Cuéntanos qué habría mejorado tu experiencia...",
  "Example: Women's Winter Classic jersey in medium...":
    "Ejemplo: jersey femenino del Winter Classic en talla mediana...",
  "Help us improve": "Ayúdanos a mejorar",
  "Help us stock better": "Ayúdanos a mejorar el inventario",
  "Your feedback": "Tus comentarios",
  "Continue to Your Reward": "Continuar a tu recompensa",
  "Your 10% reward": "Tu recompensa del 10%",
  "Where Should We Send Your Discount?": "¿Dónde Debemos Enviar tu Descuento?",
  "Enter your email and we'll send your Cubs Team Store code.":
    "Ingresa tu correo y te enviaremos tu código de la Tienda del Equipo Cubs.",
  OFF: "DE DESCUENTO",
  "you@example.com": "tu@ejemplo.com",
  "Your email is used to deliver this one-time discount.":
    "Tu correo se utilizará para entregar este descuento de un solo uso.",
  "Send My 10% Discount": "Enviar Mi Descuento del 10%",
  "Survey complete": "Encuesta completada",
  "Check Your Email for Your Discount Code": "Revisa tu Correo para Ver tu Código de Descuento",
  "Your 10% Cubs Team Store discount is headed to {email}.":
    "Tu descuento del 10% para la Tienda del Equipo Cubs va en camino a {email}.",
  "YOUR CUBS REWARD": "TU RECOMPENSA CUBS",
  Done: "Listo",

  "Inventory issue": "Problema de inventario",
  "Size Unavailable": "Talla No Disponible",
  "{product} is unavailable in one requested size. The kiosk blocks checkout and offers alternatives before online checkout.":
    "{product} no está disponible en una talla solicitada. El quiosco bloquea la compra y ofrece alternativas antes del pago en línea.",
  "Unable to reserve selected item": "No se pudo reservar el artículo seleccionado",
  "Size M now shows 0 available at this location.": "La talla M ahora muestra 0 disponibles en este lugar.",
  "Back to Basket": "Volver al Carrito",

  "Cubs official ticketing": "Boletos oficiales de los Cubs",
  "Interested in Becoming a Season-Ticket Holder?": "¿Te Interesa Tener Abonos de Temporada?",
  "Explore season-ticket opportunities or ask a Cubs representative to contact you.":
    "Explora oportunidades de abonos o solicita que te contacte un representante de los Cubs.",
  "View season-ticket opportunities": "Ver oportunidades de abonos de temporada",
  "Request contact from a Cubs representative": "Solicitar contacto de un representante de los Cubs",
  "Season tickets": "Abonos de temporada",
  "Scan to View Official Cubs Options": "Escanea para Ver Opciones Oficiales de los Cubs",
  "Fans can continue on the Cubs approved ticketing experience or request follow-up.":
    "Continúa en la experiencia de boletos aprobada por los Cubs o solicita seguimiento.",
  "Request Contact Instead": "Solicitar Contacto",
  "How Should the Cubs Follow Up?": "¿Cómo Deben Contactarte los Cubs?",
  "Share your contact information and choose your preferred response.":
    "Comparte tu información y elige cómo prefieres recibir una respuesta.",
  Name: "Nombre",
  "Full name": "Nombre completo",
  Mobile: "Móvil",
  Email: "Correo electrónico",
  "Email address": "Dirección de correo electrónico",
  "Text me": "Mensaje de texto",
  "Email me": "Correo electrónico",
  "Call me": "Llamada",
  "Submit Interest": "Enviar Interés",
  "Interest Submitted": "Interés Enviado",
  "A Cubs representative will follow up using the fan's preferred method: {method}.":
    "Un representante de los Cubs dará seguimiento por el método preferido: {method}.",

  "Team Store": "Tienda del Equipo",
  "Did You Find the Merchandise You Were Looking For?": "¿Encontraste la Mercancía que Buscabas?",
  "Tell us what worked and where we can help.": "Cuéntanos qué funcionó y dónde podemos ayudarte.",
  Yes: "Sí",
  "I found what I wanted": "Encontré lo que quería",
  No: "No",
  "Help identify what was missing": "Ayúdanos a identificar lo que faltaba",
  "Merchandise search": "Búsqueda de mercancía",
  "What Were You Looking For?": "¿Qué Estabas Buscando?",
  "Choose the closest match, then tell us the size you needed.":
    "Elige la opción más parecida y dinos qué talla necesitabas.",
  "Shopping experience": "Experiencia de compra",
  "Did We Make Shopping Easy?": "¿Hicimos Fácil tu Compra?",
  "Let us know what would have made your visit better.": "Dinos qué habría mejorado tu visita.",
  "The checkout line was too long.": "La fila para pagar era demasiado larga.",
  "The store was too crowded.": "La tienda estaba demasiado llena.",
  "I needed help but could not find an associate.": "Necesitaba ayuda, pero no encontré a un asociado.",
  "I could not find the product or size I wanted.": "No encontré el producto o la talla que quería.",
  "The merchandise selection was limited.": "La selección de mercancía era limitada.",
  "Other.": "Otro.",
  "Associate interaction": "Interacción con un asociado",
  "Did You Interact with a Store Associate?": "¿Interactuaste con un Asociado de la Tienda?",
  "Your feedback helps us deliver better game day service.":
    "Tus comentarios nos ayudan a ofrecer un mejor servicio el día del partido.",
  "Satisfied with assistance": "Satisfecho con la ayuda",
  "No associate was available": "No había ningún asociado disponible",
  "Not satisfied with assistance": "No satisfecho con la ayuda",
  "Submit Feedback": "Enviar Comentarios",
  "Thank You": "Gracias",
  "Your feedback helps the Cubs improve merchandise availability and the gameday store experience.":
    "Tus comentarios ayudan a los Cubs a mejorar la disponibilidad y la experiencia en la tienda.",
  "Missing item": "Artículo faltante",
  "Not provided": "No proporcionado",
  "Requested size": "Talla solicitada",
  "Experience issue": "Problema de experiencia",
  "Associate response": "Respuesta sobre el asociado",
};

function interpolate(template: string, values: TranslationValues = {}) {
  return Object.entries(values).reduce(
    (copy, [key, value]) => copy.split(`{${key}}`).join(String(value)),
    template,
  );
}

const defaultValue: V2LanguageContextValue = {
  language: "en",
  setLanguage: () => {},
  t: (english, values) => interpolate(english, values),
};

const V2LanguageContext = createContext<V2LanguageContextValue>(defaultValue);

export function V2LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<V2Language>("en");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t: V2Translate = (english, values) => {
    const template = language === "es" ? spanish[english] ?? english : english;
    return interpolate(template, values);
  };

  return (
    <V2LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </V2LanguageContext.Provider>
  );
}

export function useV2Language() {
  return useContext(V2LanguageContext);
}
