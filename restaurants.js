// Data mock de restaurantes y sus menús
// Cada restaurante tiene 5-7 platillos típicos mexicanos

const restaurants = [
  {
    id: 'rest_1',
    name: '🌮 La Taquería del Barrio',
    description: 'Tacos auténticos al estilo tradicional',
    menu: [
      {
        id: 'item_1_1',
        name: 'Tacos de Pastor',
        description: 'Tres tacos con carne al pastor, piña, cilantro y cebolla',
        price: 85
      },
      {
        id: 'item_1_2',
        name: 'Tacos de Asada',
        description: 'Tres tacos con carne asada, guacamole y salsa',
        price: 95
      },
      {
        id: 'item_1_3',
        name: 'Tacos de Carnitas',
        description: 'Tres tacos de carnitas estilo Michoacán',
        price: 90
      },
      {
        id: 'item_1_4',
        name: 'Tacos de Suadero',
        description: 'Tres tacos de suadero con cilantro, cebolla y limón',
        price: 80
      },
      {
        id: 'item_1_5',
        name: 'Orden de Quesadillas',
        description: 'Tres quesadillas con queso Oaxaca y tu elección de guisado',
        price: 100
      },
      {
        id: 'item_1_6',
        name: 'Gringa Grande',
        description: 'Tortilla de harina con pastor, queso derretido y piña',
        price: 120
      }
    ]
  },
  {
    id: 'rest_2',
    name: '🍲 Antojitos Doña Lupita',
    description: 'Comida casera mexicana como en casa',
    menu: [
      {
        id: 'item_2_1',
        name: 'Enchiladas Verdes',
        description: 'Enchiladas bañadas en salsa verde con pollo, crema y queso',
        price: 130
      },
      {
        id: 'item_2_2',
        name: 'Enchiladas Rojas',
        description: 'Enchiladas en salsa roja con queso fresco y cebolla',
        price: 130
      },
      {
        id: 'item_2_3',
        name: 'Chilaquiles con Pollo',
        description: 'Chilaquiles verdes o rojos con pollo deshebrado',
        price: 110
      },
      {
        id: 'item_2_4',
        name: 'Pozole Rojo',
        description: 'Pozole rojo con carne de cerdo, lechuga, rábano y tostadas',
        price: 140
      },
      {
        id: 'item_2_5',
        name: 'Mole con Pollo',
        description: 'Piezas de pollo bañadas en mole poblano con arroz',
        price: 150
      },
      {
        id: 'item_2_6',
        name: 'Tamales (3 piezas)',
        description: 'Tamales de salsa verde o roja con pollo o cerdo',
        price: 85
      },
      {
        id: 'item_2_7',
        name: 'Sopes (3 piezas)',
        description: 'Sopes con frijoles, carne, lechuga, crema y queso',
        price: 95
      }
    ]
  },
  {
    id: 'rest_3',
    name: '🌊 Mariscos El Pescador',
    description: 'Los mejores mariscos frescos de la región',
    menu: [
      {
        id: 'item_3_1',
        name: 'Ceviche de Camarón',
        description: 'Camarón fresco en jugo de limón con verduras',
        price: 180
      },
      {
        id: 'item_3_2',
        name: 'Ceviche de Pescado',
        description: 'Pescado blanco en limón con chile, cebolla y cilantro',
        price: 160
      },
      {
        id: 'item_3_3',
        name: 'Cóctel de Camarón',
        description: 'Camarones en salsa de tomate con aguacate',
        price: 190
      },
      {
        id: 'item_3_4',
        name: 'Tacos de Pescado',
        description: 'Tres tacos de pescado empanizado con col y chipotle',
        price: 140
      },
      {
        id: 'item_3_5',
        name: 'Camarones a la Diabla',
        description: 'Camarones en salsa picante con arroz y ensalada',
        price: 220
      },
      {
        id: 'item_3_6',
        name: 'Filete Empapelado',
        description: 'Filete de pescado con verduras al vapor',
        price: 200
      }
    ]
  },
  {
    id: 'rest_4',
    name: '🔥 Tortas y Burgers La Lupita',
    description: 'Las mejores tortas y hamburguesas artesanales',
    menu: [
      {
        id: 'item_4_1',
        name: 'Torta de Milanesa',
        description: 'Torta con milanesa, aguacate, queso, frijoles y chipotle',
        price: 110
      },
      {
        id: 'item_4_2',
        name: 'Torta Cubana',
        description: 'Torta con jamón, salchicha, milanesa, queso y pierna',
        price: 130
      },
      {
        id: 'item_4_3',
        name: 'Torta de Pastor',
        description: 'Torta con carne al pastor, piña, queso y aguacate',
        price: 115
      },
      {
        id: 'item_4_4',
        name: 'Hamburguesa Clásica',
        description: 'Hamburguesa de res con queso, lechuga, tomate y papas',
        price: 120
      },
      {
        id: 'item_4_5',
        name: 'Hamburguesa Mexicana',
        description: 'Hamburguesa con jalapeños, aguacate, queso manchego',
        price: 140
      },
      {
        id: 'item_4_6',
        name: 'Hot Dog Especial',
        description: 'Hot dog con tocino, queso, cebolla caramelizada y jalapeños',
        price: 90
      }
    ]
  },
  {
    id: 'rest_5',
    name: '🍕 Pizzería Don Romano',
    description: 'Pizzas artesanales con toque mexicano',
    menu: [
      {
        id: 'item_5_1',
        name: 'Pizza Hawaiiana',
        description: 'Jamón, piña, queso mozzarella (Mediana)',
        price: 180
      },
      {
        id: 'item_5_2',
        name: 'Pizza Pepperoni',
        description: 'Doble pepperoni con queso mozzarella (Mediana)',
        price: 190
      },
      {
        id: 'item_5_3',
        name: 'Pizza Mexicana',
        description: 'Chorizo, jalapeños, cebolla, queso (Mediana)',
        price: 200
      },
      {
        id: 'item_5_4',
        name: 'Pizza Cuatro Quesos',
        description: 'Mozzarella, manchego, parmesano, queso azul (Mediana)',
        price: 220
      },
      {
        id: 'item_5_5',
        name: 'Pizza Vegetariana',
        description: 'Champiñones, pimiento, cebolla, aceitunas (Mediana)',
        price: 170
      },
      {
        id: 'item_5_6',
        name: 'Pizza BBQ Chicken',
        description: 'Pollo, tocino, cebolla, salsa BBQ (Mediana)',
        price: 210
      },
      {
        id: 'item_5_7',
        name: 'Alitas BBQ (10 pzas)',
        description: 'Alitas de pollo con salsa BBQ y aderezo ranch',
        price: 150
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

// Función para obtener un item del menú
function getMenuItem(restaurantId, itemId) {
  const restaurant = getRestaurantById(restaurantId);
  if (!restaurant) return null;
  return restaurant.menu.find(item => item.id === itemId);
}

// Función para obtener info de zona de delivery
function getDeliveryZone(zoneNumber) {
  return deliveryZones[zoneNumber];
}

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getMenuItem,
  getDeliveryZone,
  deliveryZones
};
