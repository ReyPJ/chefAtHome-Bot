// Data de restaurantes reales - Optimizada para WhatsApp Business API
// Organizada por categorías para cumplir con límite de 10 items por lista

const restaurants = [
  {
    id: 'rest_1',
    name: '🍖 Asador Doña Tina',
    description: 'Cocina Mexicana Tradicional Nivel Gourmet',
    categories: [
      {
        id: 'cat_1_1',
        name: 'Desayunos',
        items: [
          { id: 'item_1_1', name: 'Huevos Fritos', description: 'Tiernos, bien cocidos o volteados, con frijoles y arroz', price: 175 },
          { id: 'item_1_2', name: 'Huevos Divorciados', description: 'Tortillas pocheadas, salsas verde y ranchera, frijoles y arroz', price: 180 },
          { id: 'item_1_3', name: 'Huevos Pasilla', description: 'Revueltos con salsa de chile pasilla, frijoles y arroz', price: 180 },
          { id: 'item_1_4', name: 'Huevos Rancheros', description: 'Sobre tortillas, frijol, jamón al grill y arroz blanco', price: 180 },
          { id: 'item_1_5', name: 'Huevos Machaca', description: 'Con salsa ranchera, frijoles de olla y arroz blanco', price: 180 },
          { id: 'item_1_6', name: 'Huevos Jamón York', description: 'Revueltos con jamón de York, frijoles y arroz', price: 180 },
          { id: 'item_1_7', name: 'Fruta Temporada', description: 'Con yogurt griego, granola y miel', price: 175 },
          { id: 'item_1_8', name: 'Bowl Frutos Rojos', description: 'Fresa, zarzamora, blueberries, yogurt, granola, miel', price: 190 },
          { id: 'item_1_9', name: 'Bagel Salmón', description: 'Salmón ahumado, queso crema, cebolla, aceitunas, alcaparras', price: 220 },
          { id: 'item_1_10', name: 'Avocado Toast', description: 'Masa madre, hojas, jitomate cherry, pepita, aguacate, limón', price: 185 },
        ]
      },
      {
        id: 'cat_1_2',
        name: 'Sugerencias',
        items: [
          { id: 'item_1_11', name: 'Chilaquiles Verde/Rojo', description: 'Crema ácida, queso fresco, aguacate y frijoles', price: 180 },
          { id: 'item_1_12', name: 'Chilaquiles Doña Tina', description: 'Mole negro oaxaqueño, crema, queso, chip plátano, frijoles', price: 180 },
          { id: 'item_1_13', name: 'Chilaquiles Suizos', description: 'Con asado de tira, crema, queso, aguacate y frijoles', price: 185 },
          { id: 'item_1_14', name: 'Chilaquiles Morita', description: 'Con asado de tira, crema, queso, aguacate y frijoles', price: 185 },
          { id: 'item_1_15', name: 'Enchiladas Gratinadas', description: 'Pollo orgánico, crema ácida, queso de oveja, frijoles', price: 190 },
          { id: 'item_1_16', name: 'Enfrijoladas', description: 'Pollo, crema, queso fresco, chorizo, pico de gallo', price: 185 },
          { id: 'item_1_17', name: 'Enmoladas', description: 'Pollo, mole negro, crema, queso, chip plátano macho', price: 185 },
          { id: 'item_1_18', name: 'Molletes', description: 'Pan horneado, frijoles, queso de oveja, pico de gallo, aguacate', price: 185 },
        ]
      },
      {
        id: 'cat_1_3',
        name: 'Platos Fuertes',
        items: [
          { id: 'item_1_19', name: 'Ensalada Verde', description: 'Lechuga, arúgula, parmesano, aguacate, vinagreta limón', price: 175 },
          { id: 'item_1_20', name: 'Ensalada Cítrica', description: 'Lechuga, arúgula, queso cabra, nuez, cítricos, miel y mostaza', price: 195 },
          { id: 'item_1_21', name: 'Sopa de Tortillas', description: 'Chile guajillo y ancho, aguacate, chicharrón, chile, queso', price: 165 },
          { id: 'item_1_22', name: 'Quesadillas (2)', description: 'Chicharrón, queso, flor calabaza, champiñones o tinga', price: 150 },
          { id: 'item_1_23', name: 'Pescadillas Sierra', description: 'Pescado tatemado, salsa verde habanero, queso, crema (5)', price: 220 },
          { id: 'item_1_24', name: 'Pechuga Empanizada', description: 'Con pasta fettuccine en salsa de chipotle, frijoles', price: 320 },
          { id: 'item_1_25', name: 'Flautas Tinga', description: 'Tortillas a mano, salsa roja, queso, lechuga, crema', price: 190 },
          { id: 'item_1_26', name: 'Filete Salsa Morita', description: 'Black Angus 250g al Josper, puré papa, salsa morita', price: 415 },
          { id: 'item_1_27', name: 'Filete Escamoles', description: 'Black Angus 250g, salsa tuétano, escamoles, puré papa', price: 645 },
          { id: 'item_1_28', name: 'Albóndigas Chipotle', description: 'Carne Angus, salsa cremosa chipotle, queso de oveja', price: 220 },
        ]
      },
      {
        id: 'cat_1_4',
        name: 'Postres y Bebidas',
        items: [
          { id: 'item_1_29', name: 'Manchamanteles', description: 'Costilla y lomo cerdo, guiso chile, papa, arroz blanco', price: 215 },
          { id: 'item_1_30', name: 'Concha Rellena', description: 'Nata montada, almendra, amaranto, frutos rojos', price: 125 },
          { id: 'item_1_31', name: 'Pan Francés 3 Leches', description: 'Pan brioche, leche condensada, frutos rojos, crema batida', price: 140 },
          { id: 'item_1_32', name: 'Pan Francés Frutos', description: 'Brioche, reducción vino tinto, frutos rojos, crema montada', price: 150 },
          { id: 'item_1_33', name: 'Tiramisú Requesón', description: 'Requesón, mascarpone, cocoa, palanqueta pepita', price: 150 },
          { id: 'item_1_34', name: 'Coca-Cola', description: 'Refresco', price: 45 },
          { id: 'item_1_35', name: 'Agua Mineral', description: 'Agua mineral', price: 45 },
          { id: 'item_1_36', name: 'Sprite', description: 'Refresco', price: 45 },
          { id: 'item_1_37', name: 'Jugo Naranja', description: 'Cold press prensado en frío', price: 55 },
          { id: 'item_1_38', name: 'Jugo Verde', description: 'Pepino, jengibre, nopal, espinaca, piña, apio', price: 65 },
        ]
      }
    ]
  },
  {
    id: 'rest_2',
    name: '🍝 Scarpetta',
    description: 'Pasta Artesanal',
    categories: [
      {
        id: 'cat_2_1',
        name: 'Entradas',
        items: [
          { id: 'item_2_1', name: 'Insalata Meraviglia', description: 'Mix lechugas, fresa, betabel, mango, queso cabra, pistacho', price: 205 },
          { id: 'item_2_2', name: 'Ensalada Verde', description: 'Lechuga, arúgula, parmesano, aguacate, vinagreta limón', price: 175 },
          { id: 'item_2_3', name: 'Ensalada Cítrica', description: 'Lechuga, queso cabra, nuez, cítricos, aceite, miel y mostaza', price: 205 },
          { id: 'item_2_4', name: 'Insalata Caprese', description: 'Mozzarella fior di late, jitomate, pesto, albahaca, arúgula', price: 235 },
        ]
      },
      {
        id: 'cat_2_2',
        name: 'Pasta',
        items: [
          { id: 'item_2_5', name: 'Gnocchi Sorrentina', description: 'Papa, mantequilla, echalote, pomodoro, mozzarella', price: 250 },
          { id: 'item_2_6', name: 'Gnocchi Ricotta', description: 'Papa, ricotta, mantequilla, pomodoro, mozzarella', price: 265 },
          { id: 'item_2_7', name: 'Conchieglie Bolognesa', description: 'Con ragú tradicional cocción 12hrs, parmigiano, perejil', price: 300 },
          { id: 'item_2_8', name: 'Tagliatelle Pesto', description: 'Ajo negro, echalote, pesto artesanal, parmigiano', price: 265 },
          { id: 'item_2_9', name: 'Pasta Ruota Parmigiano', description: 'Preparada en rueda de parmigiano reggiano', price: 265 },
          { id: 'item_2_10', name: 'Tagliatelle Salmone', description: 'Salmón 150g, vodka, salsa blanca, pimienta, limón', price: 385 },
          { id: 'item_2_11', name: 'Caserecce Cacio Pepe', description: 'Salsa blanca, parmigiano, pecorino, pimienta negra', price: 235 },
          { id: 'item_2_12', name: 'Lasagna Bolognese', description: 'Ragú res y cerdo, bechamel, pomodoro, parmigiano', price: 330 },
          { id: 'item_2_13', name: 'Fettuccine Boscaiola', description: 'Salsa blanca, hongos, setas, vino blanco, parmigiano', price: 325 },
          { id: 'item_2_14', name: 'Penne Amatriciana', description: 'Jitomate, peperoncino, guanciale, vino rosso, parmigiano', price: 275 },
        ]
      },
      {
        id: 'cat_2_3',
        name: 'Carnes y Postres',
        items: [
          { id: 'item_2_15', name: 'Spaghetti Arrabiata', description: 'Ajo negro, echalote, pomodoro, perejil, picante', price: 265 },
          { id: 'item_2_16', name: 'Pechuga Milanese', description: 'Empanizada panko, ensalada mixta, aderezo miel, parmesano', price: 320 },
          { id: 'item_2_17', name: 'Salmone Pistacchio', description: 'Salmón 220g, salsa blanca vino, ejotes, pistache, nuez', price: 390 },
          { id: 'item_2_18', name: 'Filete Frutos Rojos', description: 'Black Angus 250g, puré papa, espárragos, reducción frutos', price: 435 },
          { id: 'item_2_19', name: 'Filete Pepe Verde', description: 'Black Angus 250g, pimienta verde brandy, ejotes, puré papa', price: 645 },
          { id: 'item_2_20', name: 'Albóndigas Chipotle', description: 'Carne Angus, salsa chipotle, queso de oveja gratinado', price: 295 },
          { id: 'item_2_21', name: 'Pan Francés 3 Leches', description: 'Brioche caramelizado, leche condensada, frutos, crema', price: 140 },
          { id: 'item_2_22', name: 'Pan Francés Frutos', description: 'Brioche, vino tinto, mascabado, frutos rojos, crema', price: 140 },
          { id: 'item_2_23', name: 'Tiramisú', description: 'Mascarpone, cocoa, soletas licor café, palanqueta pepita', price: 150 },
        ]
      },
      {
        id: 'cat_2_4',
        name: 'Bebidas',
        items: [
          { id: 'item_2_24', name: 'Coca-Cola', description: 'Refresco', price: 45 },
          { id: 'item_2_25', name: 'Agua Mineral', description: 'Agua mineral', price: 45 },
          { id: 'item_2_26', name: 'Shake Vainilla', description: 'Malteada', price: 85 },
          { id: 'item_2_27', name: 'Shake Fresa', description: 'Malteada', price: 85 },
        ]
      }
    ]
  },
  {
    id: 'rest_3',
    name: '🍔 Hamburger Place',
    description: 'Smash Burgers Calidad Gourmet',
    categories: [
      {
        id: 'cat_3_1',
        name: 'Burgers',
        items: [
          { id: 'item_3_1', name: 'Burger Clásica', description: 'Pan brioche, carne CAB, queso oveja, cebolla, lechuga, papas', price: 195 },
          { id: 'item_3_2', name: 'Burger Pancetta', description: 'Pan brioche, CAB, queso, tocineta ahumada, papas', price: 205 },
          { id: 'item_3_3', name: 'Burger Hawaiana', description: 'Pan brioche, CAB, queso, piña, jamón York al grill, papas', price: 210 },
          { id: 'item_3_4', name: 'Burger BBQ', description: 'Pan brioche, CAB, queso, tocino, cebolla caramelizada, BBQ', price: 210 },
          { id: 'item_3_5', name: 'Burger Vegetariana', description: 'Pan brioche, portobello laqueado, queso azul, papas', price: 210 },
          { id: 'item_3_6', name: 'Triple Cheese', description: 'Pan brioche, triple carne CAB, triple queso gratinado, papas', price: 250 },
          { id: 'item_3_7', name: 'Hot Dog Clásico', description: 'Pan brioche, salchicha Oscar Mayer, tocino, cebolla, papas', price: 185 },
          { id: 'item_3_8', name: 'Cangre-Jocho', description: 'Pan brioche, surimi, cangrejo, mayo dijon, crunchy, papas', price: 265 },
          { id: 'item_3_9', name: 'Deditos de Queso', description: 'Mozzarella empanizado panko, pomodoro, papas', price: 185 },
          { id: 'item_3_10', name: 'Papas Francesas', description: 'Crujientes papas 140g con aderezo de la casa', price: 140 },
        ]
      },
      {
        id: 'cat_3_2',
        name: 'Platos Fuertes',
        items: [
          { id: 'item_3_11', name: 'Ensalada Verde', description: 'Lechuga, arúgula, parmesano, aguacate, vinagreta limón', price: 175 },
          { id: 'item_3_12', name: 'Ensalada Cítrica', description: 'Lechuga, queso cabra, nuez, cítricos, aceite, miel, mostaza', price: 195 },
          { id: 'item_3_13', name: 'Pechuga Empanizada', description: 'Con pasta fettuccine salsa chipotle, aguacate, papas', price: 320 },
          { id: 'item_3_14', name: 'Filete Tuétano', description: 'Black Angus 250g al Josper, puré, espárragos, tuétano', price: 415 },
          { id: 'item_3_15', name: 'Filete Escamoles', description: 'Black Angus 250g, tuétano, escamoles al epazote, puré papa', price: 645 },
          { id: 'item_3_16', name: 'Albóndigas Chipotle', description: 'Carne Angus, salsa chipotle, queso oveja gratinado', price: 210 },
        ]
      },
      {
        id: 'cat_3_3',
        name: 'Postres y Bebidas',
        items: [
          { id: 'item_3_17', name: 'Pan Francés 3 Leches', description: 'Brioche caramelizado, leche condensada, frutos, crema', price: 140 },
          { id: 'item_3_18', name: 'Pan Francés Frutos', description: 'Brioche, vino tinto mascabado, frutos rojos, crema', price: 150 },
          { id: 'item_3_19', name: 'Tiramisú', description: 'Mascarpone, cocoa, soletas licor café, palanqueta pepita', price: 150 },
          { id: 'item_3_20', name: 'Coca-Cola', description: 'Refresco', price: 45 },
          { id: 'item_3_21', name: 'Agua Mineral', description: 'Agua mineral', price: 45 },
          { id: 'item_3_22', name: 'Jugo Naranja', description: 'Cold press', price: 55 },
          { id: 'item_3_23', name: 'Jugo Verde', description: 'Pepino, jengibre, nopal, espinaca, piña, apio', price: 65 },
        ]
      }
    ]
  },
  {
    id: 'rest_4',
    name: '🥔 Papa World',
    description: 'Papas al nivel de la alta cocina',
    categories: [
      {
        id: 'cat_4_1',
        name: 'Papas Horneadas',
        items: [
          { id: 'item_4_1', name: 'Papa Clásica', description: 'Horneada, crème fraîche, cebollín, queso manchego y maasdam', price: 170 },
          { id: 'item_4_2', name: 'Papa con Ragú', description: 'Horneada, ragú res y cerdo, crème fraîche, queso gratinado', price: 185 },
          { id: 'item_4_3', name: 'Papa Salami', description: 'Horneada, salami piamontés, crème fraîche, queso gratinado', price: 185 },
          { id: 'item_4_4', name: 'Papa Salchicha', description: 'Horneada, salchicha, cebolla caramelizada, queso gratinado', price: 175 },
          { id: 'item_4_5', name: 'Papa 4 Quesos', description: 'Horneada, gorgonzola, provoleta, manchego, maasdam', price: 215 },
          { id: 'item_4_6', name: 'Papa Champiñones', description: 'Horneada, champiñones, jamón York, queso gratinado', price: 185 },
          { id: 'item_4_7', name: 'Papa Milanesa Pollo', description: 'Horneada, milanesa pechuga pollo, queso gratinado', price: 185 },
          { id: 'item_4_8', name: 'Papa Arrachera', description: 'Horneada, arrachera rostizada, queso gratinado', price: 195 },
          { id: 'item_4_9', name: 'Deditos de Queso', description: 'Mozzarella empanizado panko, salsa pomodoro, papas', price: 170 },
        ]
      },
      {
        id: 'cat_4_2',
        name: 'Ensaladas y Postres',
        items: [
          { id: 'item_4_10', name: 'Ensalada Verde', description: 'Lechuga, arúgula, parmesano, aguacate, vinagreta limón', price: 175 },
          { id: 'item_4_11', name: 'Ensalada Cítrica', description: 'Lechuga, queso cabra, nuez, cítricos, aceite, miel, mostaza', price: 195 },
          { id: 'item_4_12', name: 'Pan Francés 3 Leches', description: 'Brioche caramelizado, leche condensada, frutos, crema', price: 140 },
          { id: 'item_4_13', name: 'Pan Francés Frutos', description: 'Brioche, vino tinto, frutos rojos, crema montada', price: 150 },
          { id: 'item_4_14', name: 'Fresas con Crema', description: 'Maceradas balsámico y miel, mascarpone, crumble, foam', price: 150 },
          { id: 'item_4_15', name: 'Coca-Cola', description: 'Refresco', price: 45 },
          { id: 'item_4_16', name: 'Agua Mineral', description: 'Agua mineral', price: 45 },
          { id: 'item_4_17', name: 'Shake Vainilla', description: 'Malteada', price: 85 },
        ]
      }
    ]
  },
  {
    id: 'rest_5',
    name: "🥐 Valya's Cinnabons",
    description: 'Una panaderia de alta cocina',
    categories: [
      {
        id: 'cat_5_1',
        name: 'Cinnabons y Pan',
        items: [
          { id: 'item_5_1', name: 'Cinnabons (2)', description: 'Glaseado, fermentado, canela, suave 90gr', price: 125 },
          { id: 'item_5_2', name: 'Cinnabons (6)', description: 'Glaseado, fermentado, canela, suave - Paquete', price: 320 },
          { id: 'item_5_3', name: 'Croissant', description: 'Pan artesanal', price: 55 },
          { id: 'item_5_4', name: 'Concha Vainilla', description: 'Pan dulce', price: 55 },
          { id: 'item_5_5', name: 'Concha Chocolate', description: 'Pan dulce', price: 55 },
          { id: 'item_5_6', name: 'Dona Chocolate', description: 'Dona glaseada', price: 55 },
          { id: 'item_5_7', name: 'Dona Azucarada', description: 'Dona con azúcar', price: 55 },
          { id: 'item_5_8', name: 'Dona Glaseada', description: 'Dona glaseada clásica', price: 55 },
          { id: 'item_5_9', name: 'Chocolatín', description: 'Pan de chocolate', price: 55 },
          { id: 'item_5_10', name: 'Orejas', description: 'Pan hojaldrado', price: 55 },
        ]
      },
      {
        id: 'cat_5_2',
        name: 'Bebidas',
        items: [
          { id: 'item_5_11', name: 'Coca-Cola', description: 'Refresco', price: 45 },
          { id: 'item_5_12', name: 'Agua Mineral', description: 'Agua mineral', price: 45 },
          { id: 'item_5_13', name: 'Jugo Naranja', description: 'Cold press 8AM-1PM', price: 50 },
          { id: 'item_5_14', name: 'Jugo Verde', description: 'Pepino, jengibre, nopal, espinaca, piña, apio 8AM-1PM', price: 55 },
          { id: 'item_5_15', name: 'Atole Vainilla', description: '8AM-1PM', price: 55 },
          { id: 'item_5_16', name: 'Atole Fresa', description: '8AM-1PM', price: 55 },
        ]
      }
    ]
  }
];

// Zonas de delivery y sus costos
const deliveryZones = {
  1: { name: 'Zona 1 - Centro', fee: 50 },
  2: { name: 'Zona 2 - Colonias cercanas', fee: 80 },
  3: { name: 'Zona 3 - Colonias lejanas', fee: 120 }
};

// Función para obtener todos los restaurantes
function getAllRestaurants() {
  return restaurants;
}

// Función para obtener un restaurante por ID
function getRestaurantById(restaurantId) {
  return restaurants.find(r => r.id === restaurantId);
}

// Función para obtener una categoría de un restaurante
function getCategory(restaurantId, categoryId) {
  const restaurant = getRestaurantById(restaurantId);
  if (!restaurant || !restaurant.categories) return null;
  return restaurant.categories.find(cat => cat.id === categoryId);
}

// Función para obtener un item del menú
function getMenuItem(restaurantId, itemId) {
  const restaurant = getRestaurantById(restaurantId);
  if (!restaurant || !restaurant.categories) return null;

  // Buscar en todas las categorías
  for (const category of restaurant.categories) {
    const item = category.items.find(item => item.id === itemId);
    if (item) return item;
  }
  return null;
}

// Función para obtener info de zona de delivery
function getDeliveryZone(zoneNumber) {
  return deliveryZones[zoneNumber];
}

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getCategory,
  getMenuItem,
  getDeliveryZone,
  deliveryZones
};
