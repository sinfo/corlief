FROM node:lts

WORKDIR /app
COPY . .

RUN npm install
RUN npm run gen-keys
CMD ["npm", "run", "production"]