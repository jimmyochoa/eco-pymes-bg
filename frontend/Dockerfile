# Usa una imagen base de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de tu aplicación
COPY . .

# Usa las variables de entorno proporcionadas como argumentos de construcción
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_SESSION_TOKEN
ARG AWS_REGION

# Exporta las variables al contenedor
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
ENV AWS_REGION=$AWS_REGION

# Instalar dependencias
RUN npm install

# Build de la app
RUN npm run build

# Exponer el puerto que Next.js usará
EXPOSE 3000

# Comando para iniciar la aplicación Next.js
CMD ["npm", "start"]
