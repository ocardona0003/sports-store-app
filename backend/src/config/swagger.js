const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: '🏆 Sports Store API',
      version: '2.0.0',
      description: `
## API REST — Tienda Deportiva

API completa con autenticación **JWT**, gestión de productos, categorías, carrito, órdenes y empleados.

### Autenticación
1. Llama a \`POST /api/auth/login\` con tus credenciales
2. Copia el \`accessToken\` de la respuesta
3. Haz clic en **Authorize 🔒** e ingresa: \`Bearer <accessToken>\`

### Cuentas de prueba
| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sportsstore.com | password | admin |
| empleado@sportsstore.com | password | empleado |

### Renovación de token
El accessToken expira en **15 minutos**. Usa \`POST /api/auth/refresh\` con el refreshToken para obtener uno nuevo.
      `,
      contact: { name: 'Sports Store', email: 'admin@sportsstore.com' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Desarrollo' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtenido en /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error:   { type: 'string',  example: 'Mensaje de error' },
            code:    { type: 'string',  example: 'TOKEN_EXPIRED' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 48 },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        Producto: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            nombre:      { type: 'string',  example: 'Nike Air Zoom' },
            categoria:   { type: 'string',  example: 'Calzado' },
            descripcion: { type: 'string' },
            precio:      { type: 'number',  format: 'float', example: 129.99 },
            stock:       { type: 'integer', example: 50 },
            imagen_url:  { type: 'string',  example: '/uploads/productos/abc.webp' },
            activo:      { type: 'boolean', example: true },
          },
        },
        Categoria: {
          type: 'object',
          properties: {
            id:          { type: 'integer' },
            nombre:      { type: 'string',  example: 'Calzado' },
            descripcion: { type: 'string' },
            activo:      { type: 'boolean' },
          },
        },
        Empleado: {
          type: 'object',
          properties: {
            id:           { type: 'integer' },
            nombre:       { type: 'string' },
            apellido:     { type: 'string' },
            email:        { type: 'string', format: 'email' },
            departamento: { type: 'string' },
            cargo:        { type: 'string' },
            salario:      { type: 'number' },
            activo:       { type: 'boolean' },
          },
        },
        CarritoItem: {
          type: 'object',
          properties: {
            id:         { type: 'integer' },
            session_id: { type: 'string' },
            producto_id:{ type: 'integer' },
            nombre:     { type: 'string' },
            precio:     { type: 'number' },
            cantidad:   { type: 'integer' },
            stock:      { type: 'integer' },
            imagen_url: { type: 'string' },
          },
        },
        Orden: {
          type: 'object',
          properties: {
            id:             { type: 'integer' },
            session_id:     { type: 'string' },
            cliente_nombre: { type: 'string' },
            cliente_email:  { type: 'string' },
            total:          { type: 'number' },
            estado:         { type: 'string', enum: ['pendiente','completada','cancelada'] },
            created_at:     { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
