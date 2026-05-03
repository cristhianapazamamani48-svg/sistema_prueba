# Usamos una versión ligera de Node.js
FROM node:20-alpine

# Creamos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias primero
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código del proyecto
COPY . .

# Exponemos el puerto que usa nuestra app
EXPOSE 3000

# Comando para iniciar la aplicación
CMD [ "node", "server.js" ]
